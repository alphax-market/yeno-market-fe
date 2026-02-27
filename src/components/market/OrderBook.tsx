import { useMemo } from "react";
import { Market } from "@/data/markets";
import { useOrderbook } from "@/hooks/useMarkets";
import { formatPrice } from "@/lib/utils";

const isApiMarket = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

interface OrderBookProps {
  market: Market;
  wsConnected?: boolean;
}

type Level = { price: number; shares: number };

function toLevels(arr: { price: number | string; shares?: number; size?: string }[]): Level[] {
  return arr.map((x) => ({
    price: typeof x.price === 'number' ? x.price : Number(x.price),
    shares: typeof x.shares === 'number' ? x.shares : Number(x.size ?? x.shares ?? 0),
  }));
}

function buildLevels(bids: Level[], asks: Level[]): Level[] {
  const askSorted = [...asks].sort((a, b) => b.price - a.price);
  const bidSorted = [...bids].sort((a, b) => b.price - a.price);
  return [...askSorted, ...bidSorted];
}

export function OrderBook({ market, wsConnected }: OrderBookProps) {
  const isApi = isApiMarket(market.id);
  const { data: orderbook, isLoading, error } = useOrderbook(market.id, { refetchInterval: wsConnected ? false : 5000 });

  const isMultiOutcome = useMemo(() => Array.isArray(orderbook?.options) && orderbook!.options!.length > 0, [orderbook]);
  const firstOption = useMemo(() => (orderbook?.options?.[0] ? { name: orderbook.options[0].name, bids: orderbook.options[0].bids.map((b) => ({ price: Number(b.price), shares: Number(b.size) })), asks: orderbook.options[0].asks.map((a) => ({ price: Number(a.price), shares: Number(a.size) })) } : null), [orderbook]);

  const yesBids = useMemo(() => (isMultiOutcome && firstOption ? firstOption.bids : toLevels(orderbook?.yes?.bids ?? [])), [orderbook, isMultiOutcome, firstOption]);
  const yesAsks = useMemo(() => (isMultiOutcome && firstOption ? firstOption.asks : toLevels(orderbook?.yes?.asks ?? [])), [orderbook, isMultiOutcome, firstOption]);
  const noBids = useMemo(() => (isMultiOutcome ? [] : toLevels(orderbook?.no?.bids ?? [])), [orderbook, isMultiOutcome]);
  const noAsks = useMemo(() => (isMultiOutcome ? [] : toLevels(orderbook?.no?.asks ?? [])), [orderbook, isMultiOutcome]);
  const optionName = firstOption?.name ?? 'Yes';

  const { rows, maxYesShares, maxNoShares } = useMemo(() => {
    const yesLevels = buildLevels(yesBids, yesAsks);
    const noLevels = buildLevels(noBids, noAsks);
    const len = Math.max(yesLevels.length, noLevels.length, 1);
    const rows: { yes: Level | null; no: Level | null }[] = [];
    for (let i = 0; i < len; i++) {
      rows.push({
        yes: yesLevels[i] ?? null,
        no: noLevels[i] ?? null,
      });
    }
    const maxYesShares = Math.max(1, ...rows.map((r) => r.yes?.shares ?? 0));
    const maxNoShares = Math.max(1, ...rows.map((r) => r.no?.shares ?? 0));
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
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <h3 className="font-semibold px-4 pt-4 mb-4">Order Book</h3>
      {isLoading && (
        <p className="text-sm text-muted-foreground py-4 px-4">Loading order book…</p>
      )}
      {error && (
        <p className="text-sm text-destructive py-4 px-4">Failed to load order book.</p>
      )}
      {!isLoading && !error && (
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm border-collapse table-fixed">
            <thead>
              <tr className="border border-dashed border-border">
                <th className="text-left py-2 font-medium text-muted-foreground border-r border-border w-[20%] pl-2">PRICE</th>
                <th className="text-right py-2 font-medium text-success border-r border-border w-[30%]">{isMultiOutcome ? optionName : 'YES'}</th>
                <th className="text-center py-2 font-medium text-muted-foreground border-r border-border w-[20%]">PRICE</th>
                <th className="text-right py-2 font-medium text-destructive w-[30%] pr-2">{isMultiOutcome ? '—' : 'NO'}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-dashed border-border last:border-b-0"
                >
                  {/* Left PRICE */}
                  <td className="font-medium text-foreground align-middle border-r border-border w-[20%] p-2 pl-2 py-2">
                    {row.yes ? formatPrice(row.yes.price) : "—"}
                  </td>
                  {/* YES: full-height bar from left, text right-aligned at end of cell */}
                  <td className="relative align-middle border-r border-border w-[30%] h-[32px] p-2 py-2">
                    {row.yes ? (
                      <>
                        <div
                          className="absolute top-0 bottom-0 right-0 bg-success/20"
                          style={{
                            width: `${Math.min(100, ((row.yes.shares ?? 0) / maxYesShares) * 100)}%`,
                          }}
                        />
                        <span className="absolute inset-y-0 right-0 flex items-center justify-end pr-2 font-medium text-success z-10">
                          {(row.yes.shares ?? 0) >= 1000
                            ? (row.yes.shares ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })
                            : (row.yes.shares ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                      </>
                    ) : (
                      <span className="flex items-center justify-end pr-2 text-muted-foreground">—</span>
                    )}
                  </td>
                  {/* Right PRICE */}
                  <td className="text-center font-medium text-foreground align-middle border-r border-border w-[20%] p-2 py-2">
                    {row.no ? formatPrice(row.no.price) : "—"}
                  </td>
                  {/* NO: full-height bar from left, text right-aligned at end of cell */}
                  <td className="relative align-middle w-[30%] h-[32px] p-2 py-2">
                    {row.no ? (
                      <>
                        <div
                          className="absolute top-0 bottom-0 right-0  bg-destructive/20"
                          style={{
                            width: `${Math.min(100, ((row.no.shares ?? 0) / maxNoShares) * 100)}%`,
                          }}
                        />
                        <span className="absolute inset-y-0 right-0 flex items-center justify-end pr-2 font-medium text-destructive z-10">
                          {(row.no.shares ?? 0) >= 1000
                            ? (row.no.shares ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })
                            : (row.no.shares ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                      </>
                    ) : (
                      <span className="flex items-center justify-end pr-2 text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">No orders yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
