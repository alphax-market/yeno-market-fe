import { useMemo } from "react";
import { Market } from "@/data/markets";
import { useOrderbook } from "@/hooks/useMarkets";
import { formatPrice } from "@/lib/utils";

const isApiMarket = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

interface OrderBookProps {
  market: Market;
}

function OrderBookSection({
  title,
  dotClass,
  textClass,
  bids,
  asks,
  emptyLabel,
}: {
  title: string;
  dotClass: string;
  textClass: string;
  bids: { price: number; shares: number }[];
  asks: { price: number; shares: number }[];
  emptyLabel: string;
}) {
  const maxShares = useMemo(
    () => Math.max(1, ...bids.map((o) => o.shares), ...asks.map((o) => o.shares)),
    [bids, asks]
  );

  const hasAny = bids.length > 0 || asks.length > 0;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-3 h-3 rounded-full ${dotClass}`} />
        <span className={`font-medium ${textClass}`}>{title}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mb-2 px-2">
        <span>Price</span>
        <span className="text-right">Shares</span>
        <span className="text-right">Total</span>
      </div>
      {!hasAny ? (
        <p className="text-sm text-muted-foreground py-4 px-2">{emptyLabel}</p>
      ) : (
        <>
          <div className="space-y-0.5 mb-2">
            {asks.slice(0, 5).reverse().map((order, i) => (
              <div key={`ask-${i}`} className="relative grid grid-cols-3 gap-2 text-sm px-2 py-1">
                <div
                  className="absolute inset-0 bg-destructive/10"
                  style={{ width: `${(order.shares / maxShares) * 100}%`, right: 0, left: "auto" }}
                />
                <span className="relative text-destructive">{formatPrice(order.price)}</span>
                <span className="relative text-right">{order.shares.toLocaleString()}</span>
                <span className="relative text-right text-muted-foreground">
                  ${(order.shares * order.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
          <div className="text-center py-2 border-y border-border my-2">
            <span className="text-sm text-muted-foreground">Spread: </span>
            <span className="text-sm font-medium">
              {asks[0] && bids[0]
                ? formatPrice(asks[0].price - bids[0].price)
                : "—"}
            </span>
          </div>
          <div className="space-y-0.5">
            {bids.slice(0, 5).map((order, i) => (
              <div key={`bid-${i}`} className="relative grid grid-cols-3 gap-2 text-sm px-2 py-1">
                <div
                  className="absolute inset-0 bg-success/10"
                  style={{ width: `${(order.shares / maxShares) * 100}%` }}
                />
                <span className="relative text-success">{formatPrice(order.price)}</span>
                <span className="relative text-right">{order.shares.toLocaleString()}</span>
                <span className="relative text-right text-muted-foreground">
                  ${(order.shares * order.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function OrderBook({ market }: OrderBookProps) {
  const isApi = isApiMarket(market.id);
  const { data: orderbook, isLoading, error } = useOrderbook(market.id);

  const yesBids = useMemo(() => orderbook?.yes?.bids ?? [], [orderbook]);
  const yesAsks = useMemo(() => orderbook?.yes?.asks ?? [], [orderbook]);
  const noBids = useMemo(() => orderbook?.no?.bids ?? [], [orderbook]);
  const noAsks = useMemo(() => orderbook?.no?.asks ?? [], [orderbook]);

  if (!isApi) {
    return (
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-semibold mb-4">Order Book</h3>
        <p className="text-sm text-muted-foreground">Order book is available for API-backed markets only.</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <h3 className="font-semibold mb-4">Order Book</h3>
      {isLoading && (
        <p className="text-sm text-muted-foreground py-4">Loading order book…</p>
      )}
      {error && (
        <p className="text-sm text-destructive py-4">Failed to load order book.</p>
      )}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <OrderBookSection
            title="Yes Orders"
            dotClass="bg-success"
            textClass="text-success"
            bids={yesBids}
            asks={yesAsks}
            emptyLabel="No Yes orders yet."
          />
          <OrderBookSection
            title="No Orders"
            dotClass="bg-destructive"
            textClass="text-destructive"
            bids={noBids}
            asks={noAsks}
            emptyLabel="No No orders yet."
          />
        </div>
      )}
    </div>
  );
}
