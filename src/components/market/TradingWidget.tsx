import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWallet } from "@/contexts/WalletContext";
import { Market } from "@/data/markets";
import { Wallet, Minus, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";
import { useExecuteTrade, usePlaceOrder } from "@/hooks/useMarkets";
import { formatPrice } from "@/lib/utils";

interface TradingWidgetProps {
  market: Market;
  selectedOutcomeIndex?: number | null;
  onOutcomeChange?: (index: number) => void;
}

export function TradingWidget({ market, selectedOutcomeIndex: externalIndex, onOutcomeChange }: TradingWidgetProps) {
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [internalIndex, setInternalIndex] = useState(0);
  const [selectedPosition, setSelectedPosition] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [limitShares, setLimitShares] = useState("");
  const [expirationEnabled, setExpirationEnabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isConnected, connect, balance, user, retrySyncWithBackend, isDevUser } = useWallet();
  const executeTradeMutation = useExecuteTrade();
  const placeOrderMutation = usePlaceOrder();

  const hasMultipleOutcomes = market.outcomes && market.outcomes.length > 2;
  
  // Use external index if provided (for syncing with parent)
  const selectedOutcomeIndex = externalIndex !== undefined && externalIndex !== null ? externalIndex : internalIndex;
  
  // For multi-outcome markets, use outcomes array; for binary, use yes/no
  const outcomes = hasMultipleOutcomes 
    ? market.outcomes! 
    : [
        { name: "Yes", price: market.yesPrice },
        { name: "No", price: market.noPrice }
      ];

  const selectedOutcome = outcomes[selectedOutcomeIndex];
  const price = selectedPosition === "yes" ? selectedOutcome.price : (1 - selectedOutcome.price);
  
  // Calculate based on order type
  const effectivePrice = orderType === "limit" && limitPrice ? parseFloat(limitPrice) / 100 : price;
  const shares = orderType === "limit" 
    ? (limitShares ? parseFloat(limitShares) : 0)
    : (amount ? parseFloat(amount) / price : 0);
  const totalCost = orderType === "limit" 
    ? shares * effectivePrice 
    : parseFloat(amount || "0");
  const potentialReturn = shares * 1;
  const profit = potentialReturn - totalCost;

  const handleTrade = async () => {
    if (!isConnected) {
      connect("google");
      return;
    }

    if (!user?.id) {
      toast.error("Please connect your wallet first");
      return;
    }

    // Validate input
    if (orderType === "limit") {
      if (!limitPrice || !limitShares || parseFloat(limitShares) <= 0) {
        toast.error("Please enter valid price and shares");
        return;
      }
    } else {
      if (!amount || parseFloat(amount) <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }
    }

    const marketId = market?.id;
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(marketId));
    const isBinaryMarket = !hasMultipleOutcomes;
    let token = apiClient.getToken();
    if (isValidUUID && isBinaryMarket && isConnected && user?.id && !token && !isDevUser) {
      token = (await retrySyncWithBackend()) ? apiClient.getToken() : null;
    }
    const useBackendApi = isValidUUID && isBinaryMarket && !!token;

    if (useBackendApi) {
      setIsSubmitting(true);
      try {
        const side = tradeType === "buy" ? "BUY" : "SELL";
        const outcome = selectedPosition === "yes" ? "YES" : "NO";

        if (orderType === "limit") {
          const priceDecimal = Number(effectivePrice);
          const sharesNum = Number(parseFloat(limitShares));
          let expiresAt: string | undefined;
          if (expirationEnabled) {
            const today = new Date();
            today.setHours(23, 59, 59, 999);
            expiresAt = today.toISOString();
          }
          await placeOrderMutation.mutateAsync({
            marketId: marketId as string,
            side,
            outcome,
            shares: sharesNum,
            price: priceDecimal,
            expiresAt,
          });
          toast.success("Limit order placed successfully!");
          setLimitPrice("");
          setLimitShares("");
          setExpirationEnabled(false);
        } else {
          const sharesNum = Number(totalCost / Number(price));
          await executeTradeMutation.mutateAsync({
            marketId: marketId as string,
            side,
            outcome,
            shares: sharesNum,
          });
          toast.success("Trade executed successfully!");
          setAmount("");
        }
      } catch (error) {
        console.error("Order placement failed:", error);
        toast.error(error instanceof Error ? error.message : "Failed to place order");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (isValidUUID && isBinaryMarket && !apiClient.getToken()) {
      toast.error(
        isConnected
          ? "Trading backend unavailable. Please refresh the page and try again, or check that the API is running."
          : "Connect your wallet so we can sync with the trading backend."
      );
      return;
    }

    if (!isValidUUID && apiClient.getToken()) {
      toast.error("This market is for display only. To trade, open a market from the homepage (markets that load from the API).");
      return;
    }

    toast.error(
      isConnected
        ? "This market is not available for trading. Open a tradable market from the homepage."
        : "Connect your wallet or use Dev Login, then open a tradable market from the homepage to trade."
    );
  };

  const adjustShares = (delta: number) => {
    const current = parseFloat(limitShares) || 0;
    const newValue = Math.max(0, current + delta);
    setLimitShares(newValue.toString());
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Trade Type Tabs with Order Type Dropdown */}
      <Tabs defaultValue="buy" onValueChange={(v) => setTradeType(v as "buy" | "sell")}>
        <div className="flex items-center border-b border-border">
          <TabsList className="flex-1 grid grid-cols-2 rounded-none bg-secondary h-11">
            <TabsTrigger value="buy" className="rounded-none data-[state=active]:bg-card">
              Buy
            </TabsTrigger>
            <TabsTrigger value="sell" className="rounded-none data-[state=active]:bg-card">
              Sell
            </TabsTrigger>
          </TabsList>
          <div className="px-2 border-l border-border">
            <Select value={orderType} onValueChange={(v) => setOrderType(v as "market" | "limit")}>
              <SelectTrigger className="w-24 h-9 border-0 bg-transparent focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border">
                <SelectItem value="market">Market</SelectItem>
                <SelectItem value="limit">Limit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-4">
          {/* Multi-Outcome Selection - Only show selected outcome without chance */}
          {hasMultipleOutcomes && (
            <div className="mb-4">
              <label className="text-sm text-muted-foreground mb-2 block">Selected Outcome</label>
              <div className="p-3 rounded-lg border-2 border-primary bg-primary/10">
                <span className="font-medium truncate">{selectedOutcome.name}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Click an outcome on the left to change selection
              </p>
            </div>
          )}

          {/* Yes/No Position for selected outcome */}
          <div className="mb-4">
            <label className="text-sm text-muted-foreground mb-2 block">
              {hasMultipleOutcomes ? `"${selectedOutcome.name}" Position` : "Outcome"}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedPosition("yes")}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedPosition === "yes"
                    ? "border-success bg-success/10 text-success"
                    : "border-border hover:border-success/50"
                }`}
              >
                <div className="font-semibold">Yes</div>
                <div className="text-sm opacity-75">
                  {formatPrice(selectedOutcome.price)}
                </div>
              </button>
              <button
                onClick={() => setSelectedPosition("no")}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedPosition === "no"
                    ? "border-destructive bg-destructive/10 text-destructive"
                    : "border-border hover:border-destructive/50"
                }`}
              >
                <div className="font-semibold">No</div>
                <div className="text-sm opacity-75">
                  {formatPrice(1 - selectedOutcome.price)}
                </div>
              </button>
            </div>
          </div>

          {/* Limit Order Inputs */}
          {orderType === "limit" ? (
            <>
              {/* Limit Price Input */}
              <div className="mb-4">
                <label className="text-sm text-muted-foreground mb-2 block">Limit Price</label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0"
                    min="1"
                    max="99"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    className="pr-8 bg-secondary border-border"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Current: {formatPrice(price)}
                </p>
              </div>

              {/* Shares Input with Adjusters */}
              <div className="mb-4">
                <label className="text-sm text-muted-foreground mb-2 block">Shares</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={limitShares}
                  onChange={(e) => setLimitShares(e.target.value)}
                  className="bg-secondary border-border mb-2"
                />
                {/* Share adjustment buttons */}
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => adjustShares(-100)}
                    className="py-2 text-sm rounded-lg bg-secondary hover:bg-muted transition-colors flex items-center justify-center gap-1"
                  >
                    <Minus className="w-3 h-3" />100
                  </button>
                  <button
                    onClick={() => adjustShares(-10)}
                    className="py-2 text-sm rounded-lg bg-secondary hover:bg-muted transition-colors flex items-center justify-center gap-1"
                  >
                    <Minus className="w-3 h-3" />10
                  </button>
                  <button
                    onClick={() => adjustShares(10)}
                    className="py-2 text-sm rounded-lg bg-secondary hover:bg-muted transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3 h-3" />10
                  </button>
                  <button
                    onClick={() => adjustShares(100)}
                    className="py-2 text-sm rounded-lg bg-secondary hover:bg-muted transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3 h-3" />100
                  </button>
                </div>
              </div>

              {/* Set Expiration Toggle */}
              <div className="mb-4 flex items-center justify-between p-3 bg-secondary rounded-lg">
                <span className="text-sm">Set expiration</span>
                <Switch
                  checked={expirationEnabled}
                  onCheckedChange={setExpirationEnabled}
                />
              </div>

              {/* Total Cost Display */}
              {limitPrice && limitShares && (
                <div className="mb-4 p-3 bg-secondary rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Cost</span>
                    <span className="font-semibold">{totalCost.toFixed(2)} USDC</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Market Order - Amount Input */}
              <div className="mb-4">
                <label className="text-sm text-muted-foreground mb-2 block">Amount</label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pr-14 bg-secondary border-border"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-medium">USDC</span>
                </div>
                {isConnected && (
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>Balance: {balance.toFixed(2)} USDC</span>
                  </div>
                )}
              </div>

              {/* Quick Amount Buttons with Max */}
              <div className="grid grid-cols-5 gap-2 mb-4">
                {[10, 25, 50, 100].map((val) => (
                  <button
                    key={val}
                    onClick={() => setAmount(val.toString())}
                    className="py-2 text-sm rounded-lg bg-secondary hover:bg-muted transition-colors"
                  >
                    {val}
                  </button>
                ))}
                <button
                  onClick={() => isConnected && setAmount(balance.toString())}
                  className="py-2 text-sm rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors font-medium"
                >
                  Max
                </button>
              </div>
            </>
          )}

          {/* Trade Summary */}
          {((orderType === "market" && amount && parseFloat(amount) > 0) || 
            (orderType === "limit" && limitPrice && limitShares)) && (
            <div className="bg-secondary rounded-lg p-3 mb-4 space-y-2 text-sm">
              {hasMultipleOutcomes && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Outcome</span>
                  <span className="truncate ml-2 max-w-[150px]">{selectedOutcome.name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Type</span>
                <span className="capitalize">{orderType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Position</span>
                <span className={selectedPosition === "yes" ? "text-success" : "text-destructive"}>
                  {selectedPosition.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{orderType === "limit" ? "Limit Price" : "Avg Price"}</span>
                <span>{formatPrice(effectivePrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shares</span>
                <span>{shares.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Potential Return</span>
                <span className="text-success">{potentialReturn.toFixed(2)} USDC</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-muted-foreground">Potential Profit</span>
                <span className={profit > 0 ? "text-success" : "text-destructive"}>
                  {profit > 0 ? "+" : ""}{profit.toFixed(2)} USDC
                </span>
              </div>
              {orderType === "limit" && expirationEnabled && (
                <div className="flex justify-between border-t border-border pt-2">
                  <span className="text-muted-foreground">Expiration</span>
                  <span>End of day</span>
                </div>
              )}
            </div>
          )}

          {/* Trade Button */}
          <Button
            onClick={handleTrade}
            disabled={isSubmitting}
            className={`w-full ${
              selectedPosition === "yes"
                ? "bg-success hover:bg-success/90"
                : "bg-destructive hover:bg-destructive/90"
            }`}
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Placing Order...
              </>
            ) : orderType === "limit" ? (
              `Place Limit Order • ${totalCost.toFixed(2)} USDC`
            ) : (
              `${tradeType === "buy" ? "Buy" : "Sell"} ${selectedPosition === "yes" ? "Yes" : "No"} • ${totalCost.toFixed(2)} USDC`
            )}
          </Button>
        </div>
      </Tabs>
    </div>
  );
}
