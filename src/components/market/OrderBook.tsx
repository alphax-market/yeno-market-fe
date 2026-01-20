import { useMemo } from "react";
import { Market } from "@/data/markets";

interface OrderBookProps {
  market: Market;
}

interface Order {
  price: number;
  shares: number;
  total: number;
}

function generateOrders(basePrice: number, side: "bid" | "ask", count: number = 10): Order[] {
  const orders: Order[] = [];
  let price = side === "bid" ? basePrice - 0.01 : basePrice + 0.01;
  
  for (let i = 0; i < count; i++) {
    const shares = Math.floor(Math.random() * 5000) + 500;
    orders.push({
      price: Math.max(0.01, Math.min(0.99, price)),
      shares,
      total: shares * price,
    });
    price += side === "bid" ? -0.01 : 0.01;
  }
  
  return side === "bid" 
    ? orders.sort((a, b) => b.price - a.price)
    : orders.sort((a, b) => a.price - b.price);
}

export function OrderBook({ market }: OrderBookProps) {
  const yesBids = useMemo(() => generateOrders(market.yesPrice, "bid"), [market.yesPrice]);
  const yesAsks = useMemo(() => generateOrders(market.yesPrice, "ask"), [market.yesPrice]);
  const noBids = useMemo(() => generateOrders(market.noPrice, "bid"), [market.noPrice]);
  const noAsks = useMemo(() => generateOrders(market.noPrice, "ask"), [market.noPrice]);

  const maxYesShares = Math.max(...yesBids.map(o => o.shares), ...yesAsks.map(o => o.shares));
  const maxNoShares = Math.max(...noBids.map(o => o.shares), ...noAsks.map(o => o.shares));

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <h3 className="font-semibold mb-4">Order Book</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Yes Order Book */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="font-medium text-success">Yes Orders</span>
          </div>
          
          {/* Header */}
          <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mb-2 px-2">
            <span>Price</span>
            <span className="text-right">Shares</span>
            <span className="text-right">Total</span>
          </div>
          
          {/* Asks (Sell orders) */}
          <div className="space-y-0.5 mb-2">
            {yesAsks.slice(0, 5).reverse().map((order, i) => (
              <div key={`ask-${i}`} className="relative grid grid-cols-3 gap-2 text-sm px-2 py-1">
                <div 
                  className="absolute inset-0 bg-destructive/10"
                  style={{ width: `${(order.shares / maxYesShares) * 100}%`, right: 0, left: 'auto' }}
                />
                <span className="relative text-destructive">{(order.price * 100).toFixed(0)}¢</span>
                <span className="relative text-right">{order.shares.toLocaleString()}</span>
                <span className="relative text-right text-muted-foreground">${order.total.toLocaleString()}</span>
              </div>
            ))}
          </div>
          
          {/* Spread */}
          <div className="text-center py-2 border-y border-border my-2">
            <span className="text-sm text-muted-foreground">Spread: </span>
            <span className="text-sm font-medium">{((yesAsks[0]?.price - yesBids[0]?.price) * 100).toFixed(1)}¢</span>
          </div>
          
          {/* Bids (Buy orders) */}
          <div className="space-y-0.5">
            {yesBids.slice(0, 5).map((order, i) => (
              <div key={`bid-${i}`} className="relative grid grid-cols-3 gap-2 text-sm px-2 py-1">
                <div 
                  className="absolute inset-0 bg-success/10"
                  style={{ width: `${(order.shares / maxYesShares) * 100}%` }}
                />
                <span className="relative text-success">{(order.price * 100).toFixed(0)}¢</span>
                <span className="relative text-right">{order.shares.toLocaleString()}</span>
                <span className="relative text-right text-muted-foreground">${order.total.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* No Order Book */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span className="font-medium text-destructive">No Orders</span>
          </div>
          
          {/* Header */}
          <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mb-2 px-2">
            <span>Price</span>
            <span className="text-right">Shares</span>
            <span className="text-right">Total</span>
          </div>
          
          {/* Asks */}
          <div className="space-y-0.5 mb-2">
            {noAsks.slice(0, 5).reverse().map((order, i) => (
              <div key={`ask-${i}`} className="relative grid grid-cols-3 gap-2 text-sm px-2 py-1">
                <div 
                  className="absolute inset-0 bg-destructive/10"
                  style={{ width: `${(order.shares / maxNoShares) * 100}%`, right: 0, left: 'auto' }}
                />
                <span className="relative text-destructive">{(order.price * 100).toFixed(0)}¢</span>
                <span className="relative text-right">{order.shares.toLocaleString()}</span>
                <span className="relative text-right text-muted-foreground">${order.total.toLocaleString()}</span>
              </div>
            ))}
          </div>
          
          {/* Spread */}
          <div className="text-center py-2 border-y border-border my-2">
            <span className="text-sm text-muted-foreground">Spread: </span>
            <span className="text-sm font-medium">{((noAsks[0]?.price - noBids[0]?.price) * 100).toFixed(1)}¢</span>
          </div>
          
          {/* Bids */}
          <div className="space-y-0.5">
            {noBids.slice(0, 5).map((order, i) => (
              <div key={`bid-${i}`} className="relative grid grid-cols-3 gap-2 text-sm px-2 py-1">
                <div 
                  className="absolute inset-0 bg-success/10"
                  style={{ width: `${(order.shares / maxNoShares) * 100}%` }}
                />
                <span className="relative text-success">{(order.price * 100).toFixed(0)}¢</span>
                <span className="relative text-right">{order.shares.toLocaleString()}</span>
                <span className="relative text-right text-muted-foreground">${order.total.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
