import { useMemo, useState, useEffect, useRef } from "react";
import { Market } from "@/data/markets";
import { useOrderbook } from "@/hooks/useMarkets";
import { formatPrice } from "@/lib/utils";

const isApiMarket = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

interface OrderBookProps {
  market: Market;
  wsConnected?: boolean;
  serverUpdateSequence?: number;
  wsOrderbook?: unknown;
}

type Level = { price: number; shares: number; type: 'bid' | 'ask' };
type RowItem = Level | { isSpread: true } | null;

function toLevels(arr: { price: number | string; shares?: number; size?: string }[], type: 'bid' | 'ask'): Level[] {
  return arr.map((x) => ({
    price: typeof x.price === 'number' ? x.price : Number(x.price),
    shares: typeof x.shares === 'number' ? x.shares : Number(x.size ?? x.shares ?? 0),
    type,
  }));
}

function padAsks(asks: Level[], max: number): RowItem[] {
  const askSorted = [...asks].sort((a, b) => b.price - a.price); // Highest to lowest
  const padding = Array(max - askSorted.length).fill(null);
  return [...padding, ...askSorted];
}

function padBids(bids: Level[], max: number): RowItem[] {
  const bidSorted = [...bids].sort((a, b) => b.price - a.price); // Highest to lowest
  const padding = Array(max - bidSorted.length).fill(null);
  return [...bidSorted, ...padding];
}

const FlashingOrderCell = ({ level, maxShares }: { level: RowItem; maxShares: number }) => {
  if (!level) return <span className="flex items-center justify-end pr-2 text-muted-foreground h-[32px] w-full">—</span>;
  if ('isSpread' in level) return null; // Spread handled externally

  const [flash, setFlash] = useState<'increase' | 'decrease' | null>(null);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const prevRef = useRef(level.shares);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (level.shares > prevRef.current) {
      setFlash('increase');
    } else if (level.shares < prevRef.current) {
      setFlash('decrease');
    }
    prevRef.current = level.shares;
    const t = setTimeout(() => setFlash(null), 400);
    return () => clearTimeout(t);
  }, [level.shares]);

  const bgClass = level.type === 'ask' ? 'bg-destructive/20' : 'bg-success/20';
  const textClass = level.type === 'ask' ? 'text-destructive' : 'text-success';
  const flashBg = flash === 'increase' ? 'bg-success/40' : flash === 'decrease' ? 'bg-destructive/40' : '';

  return (
    <div className={`relative w-full h-[32px] transition-colors duration-300 ${flashBg}`}>
      <div
        className={`absolute top-0 bottom-0 right-0 ${bgClass}`}
        style={{ width: `${Math.min(100, (level.shares / Math.max(1, maxShares)) * 100)}%` }}
      />
      <span className={`absolute inset-y-0 right-0 flex items-center justify-end pr-2 font-medium ${textClass} z-10`}>
        {level.shares >= 1000
          ? level.shares.toLocaleString(undefined, { maximumFractionDigits: 0 })
          : level.shares.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </span>
    </div>
  );
};

export function OrderBook({ market, wsConnected, serverUpdateSequence, wsOrderbook: wsOrderbookProp }: OrderBookProps) {
  const isApi = isApiMarket(market.id);
  const { data: queryOrderbook, isLoading, error } = useOrderbook(market.id, { refetchInterval: wsConnected ? false : 5000 });
  const orderbook = wsOrderbookProp != null ? (wsOrderbookProp as typeof queryOrderbook) : queryOrderbook;
  const [updateCount, setUpdateCount] = useState(0);
  const [justUpdated, setJustUpdated] = useState(false);
  const prevHash = useRef<string>("");

  useEffect(() => {
    if (!orderbook) return;
    const hash = JSON.stringify({ yes: (orderbook as any).yes, no: (orderbook as any).no, opts: (orderbook as any).options });
    if (prevHash.current && prevHash.current !== hash) {
      setUpdateCount((c) => c + 1);
      setJustUpdated(true);
      const t = setTimeout(() => setJustUpdated(false), 600);
      prevHash.current = hash;
      return () => clearTimeout(t);
    }
    prevHash.current = hash;
  }, [orderbook]);

  const isMultiOutcome = useMemo(() => Array.isArray(orderbook?.options) && orderbook!.options!.length > 0, [orderbook]);
  const firstOption = useMemo(() => {
    if (!orderbook?.options?.[0]) return null;
    return {
      name: orderbook.options[0].name,
      bids: orderbook.options[0].bids.map((b: any) => ({ price: Number(b.price), shares: Number(b.size) })),
      asks: orderbook.options[0].asks.map((a: any) => ({ price: Number(a.price), shares: Number(a.size) }))
    };
  }, [orderbook]);

  const yesBids = useMemo(() => (isMultiOutcome && firstOption ? toLevels(firstOption.bids, 'bid') : toLevels(orderbook?.yes?.bids ?? [], 'bid')), [orderbook, isMultiOutcome, firstOption]);
  const yesAsks = useMemo(() => (isMultiOutcome && firstOption ? toLevels(firstOption.asks, 'ask') : toLevels(orderbook?.yes?.asks ?? [], 'ask')), [orderbook, isMultiOutcome, firstOption]);
  const noBids = useMemo(() => (isMultiOutcome ? [] : toLevels(orderbook?.no?.bids ?? [], 'bid')), [orderbook, isMultiOutcome]);
  const noAsks = useMemo(() => (isMultiOutcome ? [] : toLevels(orderbook?.no?.asks ?? [], 'ask')), [orderbook, isMultiOutcome]);
  const optionName = firstOption?.name ?? 'Yes';

  const { rows, maxYesShares, maxNoShares } = useMemo(() => {
    const maxAsks = Math.max(yesAsks.length, noAsks.length);
    const maxBids = Math.max(yesBids.length, noBids.length);

    const paddedYesAsks = padAsks(yesAsks, maxAsks);
    const paddedNoAsks = padAsks(noAsks, maxAsks);
    const paddedYesBids = padBids(yesBids, maxBids);
    const paddedNoBids = padBids(noBids, maxBids);

    const yesLevels: RowItem[] = [];
    const noLevels: RowItem[] = [];

    if (maxAsks > 0 || maxBids > 0) {
      yesLevels.push(...paddedYesAsks);
      noLevels.push(...paddedNoAsks);
      
      yesLevels.push({ isSpread: true });
      noLevels.push({ isSpread: true });
      
      yesLevels.push(...paddedYesBids);
      noLevels.push(...paddedNoBids);
    }

    const rows: { yes: RowItem; no: RowItem }[] = [];
    for (let i = 0; i < yesLevels.length; i++) {
      rows.push({ yes: yesLevels[i] || null, no: noLevels[i] || null });
    }

    const maxYesShares = Math.max(1, ...yesLevels.map((r) => r && !('isSpread' in r) ? r.shares : 0));
    const maxNoShares = Math.max(1, ...noLevels.map((r) => r && !('isSpread' in r) ? r.shares : 0));
    
    return { rows, maxYesShares, maxNoShares };
  }, [yesBids, yesAsks, noBids, noAsks]);

  if (!isApi) {
    return (
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
        <h3 className="font-semibold mb-4">Order Book</h3>
        <p className="text-sm text-muted-foreground">Order book is available for API-backed markets only.</p>
      </div>
    );
  }

  return (
    <div className={`bg-card rounded-xl border shadow-sm overflow-hidden transition-colors duration-300 ${justUpdated ? "border-primary/60 ring-2 ring-primary/20" : "border-border"}`}>
      <div className="flex items-center justify-between px-4 pt-4 mb-4">
        <h3 className="font-semibold">Order Book</h3>
        {((serverUpdateSequence ?? updateCount) > 0) && (
          <span className="text-xs font-medium text-muted-foreground tabular-nums animate-in fade-in duration-200">
            Updates: {serverUpdateSequence ?? updateCount}
          </span>
        )}
      </div>
      {isLoading && !orderbook && <p className="text-sm text-muted-foreground py-4 px-4">Loading order book…</p>}
      {error && !orderbook && <p className="text-sm text-destructive py-4 px-4">Failed to load order book.</p>}
      {orderbook && !error && (
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm border-collapse table-fixed">
            <thead>
              <tr className="border-y border-border bg-muted/30">
                <th className="text-left py-2 font-medium text-muted-foreground border-r border-border w-[20%] pl-2">PRICE</th>
                <th className="text-right py-2 font-medium text-foreground opacity-80 border-r border-border w-[30%] pr-2">{isMultiOutcome ? optionName : 'YES'}</th>
                <th className="text-center py-2 font-medium text-muted-foreground border-r border-border w-[20%]">PRICE</th>
                <th className="text-right py-2 font-medium text-foreground opacity-80 w-[30%] pr-2">{isMultiOutcome ? '—' : 'NO'}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const isSpread = (row.yes && 'isSpread' in row.yes) || (row.no && 'isSpread' in row.no);
                
                if (isSpread) {
                  return (
                    <tr key={i} className="border-b border-border h-[24px]">
                      <td colSpan={2} className="relative p-0 border-r border-border bg-muted/10 h-full">
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none w-full">
                          <span className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground/50 uppercase">Spread</span>
                        </div>
                      </td>
                      <td colSpan={2} className="relative p-0 border-border bg-muted/10 h-full">
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none w-full">
                          <span className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground/50 uppercase">Spread</span>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={i} className="border-b border-dashed border-border/60 hover:bg-muted/5 transition-colors">
                    {/* YES SIDE */}
                    <td className="font-medium text-foreground align-middle border-r border-border w-[20%] p-2 pl-2">
                      {row.yes && !('isSpread' in row.yes) ? formatPrice(row.yes.price) : "—"}
                    </td>
                    <td className="relative align-middle border-r border-border w-[30%] p-0">
                      <FlashingOrderCell level={row.yes} maxShares={maxYesShares} />
                    </td>
                    {/* NO SIDE */}
                    <td className="text-center font-medium text-foreground align-middle border-r border-border w-[20%] p-2">
                      {row.no && !('isSpread' in row.no) ? formatPrice(row.no.price) : "—"}
                    </td>
                    <td className="relative align-middle w-[30%] p-0">
                      <FlashingOrderCell level={row.no} maxShares={maxNoShares} />
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-sm text-muted-foreground py-8 text-center">No orders yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
