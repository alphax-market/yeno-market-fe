import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Bookmark, Gift, Calendar, X, Info, Minus, Plus } from "lucide-react";
import { Market } from "@/data/markets";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { useWallet } from "@/contexts/WalletContext";
import { usePrivy } from "@privy-io/react-auth";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";
import { TradeSuccessModal } from "@/components/TradeSuccessModal";
import { formatPrice, formatVolume, formatEndDateTime, getCategoryDisplayName } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Drawer, DrawerContent, DrawerHeader } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface MarketCardProps {
  market: Market;
  index: number;
  onSelect: (market: Market) => void;
  isBookmarked?: boolean;
  onToggleBookmark?: (marketId: string) => void;
  onTrade?: (market: Market, side: 'yes' | 'no', outcome?: string) => void;
}

function formatEndDate(endDate: string): string {
  const date = new Date(endDate);
  if (isPast(date)) {
    return "Ended";
  }
  const distance = formatDistanceToNow(date, { addSuffix: false });
  return distance
    .replace(' minutes', 'm')
    .replace(' minute', 'm')
    .replace(' hours', 'h')
    .replace(' hour', 'h')
    .replace(' days', 'd')
    .replace(' day', 'd')
    .replace(' months', 'mo')
    .replace(' month', 'mo')
    .replace('about ', '');
}

/** End date + time for display (e.g. "Feb 28, 2025, 11:59 PM") */
function formatEndDateWithTime(endDate: string): string {
  return formatEndDateTime(endDate);
}

// Category to emoji/icon mapping
const categoryThumbnails: Record<string, string> = {
  politics: "🏛️",
  "us politics": "🇺🇸",
  "uk politics": "🇬🇧",
  "eu politics": "🇪🇺",
  "economic policy": "💰",
  "tech policy": "📱",
  "social media": "𝕏",
  sports: "⚽",
  football: "⚽",
  cricket: "🏏",
  crypto: "₿",
  entertainment: "🎬",
  science: "🔬",
  finance: "📈",
  technology: "💻",
  world: "🌍",
  elections: "🗳️",
  default: "📊"
};

function getCategoryThumbnail(category: string | undefined): string {
  return categoryThumbnails[(category ?? "").toLowerCase()] || categoryThumbnails.default;
}

// Horizontal probability bar: green (Yes) / orange (No) with glowing % labels at outer ends
function ProbabilityBar({ yesPercentage }: { yesPercentage: number }) {
  const noPercentage = 100 - yesPercentage;
  return (
    <div className="flex w-full items-center gap-2">
      <span
        className="text-sm font-bold text-success shrink-0"
      >
        {yesPercentage}%
      </span>
      <div className="flex-1 flex h-2.5 min-w-0 rounded-full overflow-hidden bg-muted/50">
        <div
          className="h-full bg-success rounded-l-full min-w-0 transition-[width] duration-300"
          style={{
            width: `${yesPercentage}%`,
          }}
        />
        <div
          className="h-full bg-destructive rounded-r-full min-w-0 transition-[width] duration-300"
          style={{
            width: `${noPercentage}%`,
          }}
        />
      </div>
      <span
        className="text-sm font-bold text-destructive shrink-0"
      >
        {noPercentage}%
      </span>
    </div>
  );
}

export function MarketCard({ market, index, onSelect, isBookmarked = false, onToggleBookmark, onTrade }: MarketCardProps) {
  const navigate = useNavigate();
  const { isConnected, balance, user, retrySyncWithBackend, isDevUser } = useWallet();
  const { ready, authenticated, login } = usePrivy();
  const yesPercentage = Math.round(Number(market.yesPrice) * 100);
  
  // Bottom sheet trading state
  const [tradingOpen, setTradingOpen] = useState(false);
  const [tradingSide, setTradingSide] = useState<'yes' | 'no'>('yes');
  const [amount, setAmount] = useState(10);
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');
  const [limitPrice, setLimitPrice] = useState(0.5);
  const [autoCancelEnabled, setAutoCancelEnabled] = useState(false);
  const [autoCancelHours, setAutoCancelHours] = useState(12);
  const [autoCancelMinutes, setAutoCancelMinutes] = useState(12);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    navigate(`/market/${market.id}`);
  };

  const handleTradeClick = (e: React.MouseEvent, side: 'yes' | 'no') => {
    e.stopPropagation();
    setTradingSide(side);
    setTradingOpen(true);
  };

  const handleCloseTrading = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTradingOpen(false);
    setAmount(10);
  };

  const currentPrice = tradingSide === 'yes' ? market.yesPrice : market.noPrice;
  const effectivePrice = orderType === 'limit' ? limitPrice : Number(currentPrice);
  const shares = amount / effectivePrice;
  const potentialReturn = shares * 1;

  // Sync limit price when side or market price changes
  useEffect(() => {
    const price = Number(currentPrice);
    setLimitPrice(Number.isFinite(price) ? Math.max(0.01, Math.min(0.99, price)) : 0.5);
  }, [currentPrice, tradingSide]);

  const handleBuyClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isConnected) {
      if (ready && !authenticated) {
        try {
          await login();
        } catch (error) {
          console.error("Failed to connect:", error);
        }
      }
      return;
    }

    const marketId = market?.id;
    const isValidUUID = marketId ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(marketId)) : false;
    const isBinaryOutcome = true;
    let token = apiClient.getToken();
    if (isValidUUID && isConnected && user?.id && !token && !isDevUser) {
      const ok = await retrySyncWithBackend();
      if (ok) token = apiClient.getToken();
    }
    const useBackendApi = isValidUUID && isBinaryOutcome && !!token;

    if (useBackendApi) {
      try {
        const outcomeApi = tradingSide === "yes" ? "YES" : "NO";
        if (orderType === "limit") {
          await apiClient.placeOrder({
            marketId: marketId as string,
            side: "BUY",
            outcome: outcomeApi,
            shares: Number(shares),
            price: Number(limitPrice),
            expiresAt: undefined,
          });
          toast.success("Limit order placed successfully!");
        } else {
          await apiClient.executeTrade({
            marketId: marketId as string,
            side: "BUY",
            outcome: outcomeApi,
            shares: Number(shares),
          });
          toast.success("Trade executed successfully!");
        }
        setTradingOpen(false);
        setShowConfirmation(true);
      } catch (err) {
        console.error("Trade execution failed:", err);
        toast.error(err instanceof Error ? err.message : "Failed to execute trade");
      }
      return;
    }

    if (isValidUUID && !apiClient.getToken()) {
      toast.error(
        isConnected
          ? "Trading backend unavailable. Please refresh and try again."
          : "Connect your wallet so we can sync with the trading backend."
      );
      return;
    }

    toast.error(
      isConnected
        ? "This market is not available for trading. Open a tradable market from the homepage."
        : "Connect your wallet, then open a tradable market from the homepage to trade."
    );
  };

  const endTimeText = (() => {
    const date = new Date(market.endDate);
    if (isPast(date)) return "Ended";
    return `Ends ${formatEndDateWithTime(market.endDate)}`;
  })();

  return (
    <>
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 10 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          opacity: { duration: 0.2, delay: index * 0.02 },
          y: { duration: 0.2, delay: index * 0.02 },
          scale: { type: "tween", duration: 0.22, ease: [0.25, 0.1, 0.25, 1] },
        }}
        className="group bg-card rounded-xl border border-border/50 overflow-hidden hover:border-primary hover:shadow-md hover:shadow-primary/10 hover:ring-2 hover:ring-primary/20 cursor-pointer flex flex-col origin-center"
        onClick={handleClick}
      >
        <div className="p-3 flex flex-col gap-2 flex-1 min-h-0 border rounded-xl">
          {/* Title row with thumbnail and dial */}
          <div className="flex flex-col items-start gap-3 mb-2">
            {/* Thumbnail / event image - always show image (API imageUrl or placeholder by category) */}
            <div className="flex items-center w-full justify-between text-xs text-muted-foreground pt-1.5 border-t border-border/30 mt-auto shrink-0">
            <div className="flex items-center gap-3">
              <span>{formatVolume(market.volume)} Vol.</span>
              {(market as { _count?: { trades?: number } })._count?.trades != null && (
                <span>{(market as { _count?: { trades?: number } })._count!.trades} trades</span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {endTimeText}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); }}
                className="p-1 transition-colors hover:text-foreground"
              >
                <Gift className="w-4 h-4" />
              </button>
              {onToggleBookmark && (
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleBookmark(market.id); }}
                  className={`p-1 transition-colors ${isBookmarked ? 'text-primary' : 'hover:text-foreground'}`}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                </button>
              )}
            </div>
             </div>
           
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <span>{getCategoryDisplayName(market)}</span>
              {(market as { topic?: string }).topic && (
                <>
                  <span aria-hidden>·</span>
                  <span>{(market as { topic?: string }).topic}</span>
                </>
              )}
            </div>
            <div className="flex flex-row w-full items-center gap-2 justify-between">
            <h3 className="font-open-sauce font-medium text-[14px] leading-[20px] tracking-normal text-foreground line-clamp-3 flex-1">
              {market.title}
            </h3>
            <img
              src={(market as { imageUrl?: string }).imageUrl || `https://picsum.photos/seed/${encodeURIComponent(market.category + market.id)}/80/80`}
              alt=""
              className="w-16 h-16 rounded-lg object-cover shrink-0"
            />
            {/* Title */}
          
           </div>
            {/* Probability bar: green / orange with % labels */}
            <ProbabilityBar yesPercentage={yesPercentage} />
          </div>

          {/* Yes/No buttons - open bottom sheet on click */}
          <div className="flex gap-2 mb-2 flex-1 items-end">
            <button
              className="flex flex-row py-2 w-1/2 px-10 rounded-lg bg-success text-primary-foreground hover:bg-success/10 dark:bg-[#B7FFCC] dark:hover:bg-[#B7FFCC]/90 dark:text-[#008000] transition-colors flex items-center justify-center gap-0.5"
              onClick={(e) => handleTradeClick(e, 'yes')}
            >
              <span className="text-md font-medium">Yes</span>
              <span className="text-md font-bold">{formatPrice(yesPercentage / 100)}</span>
            </button>
            <button
              className="py-2 px-10 rounded-lg w-1/2 bg-destructive text-destructive-foreground hover:bg-destructive/10 dark:bg-[#FFDBC9] dark:hover:bg-[#FFDBC9]/90 dark:text-[#772D09] text-primary-foreground transition-colors flex flex-row items-center justify-center gap-0.5"
              onClick={(e) => handleTradeClick(e, 'no')}
            >
              <span className="text-md font-medium">No</span>
              <span className="text-md font-bold">{formatPrice((100 - yesPercentage) / 100)}</span>
            </button>
          </div>

          {/* Footer: Volume + Trades + End Time + Icons */}
          {/* <div className="flex items-center justify-between text-xs text-muted-foreground pt-1.5 border-t border-border/30 mt-auto shrink-0">
            <div className="flex items-center gap-3">
              <span>{formatVolume(market.volume)} Vol.</span>
              {(market as { _count?: { trades?: number } })._count?.trades != null && (
                <span>{(market as { _count?: { trades?: number } })._count!.trades} trades</span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {endTimeText}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); }}
                className="p-1 transition-colors hover:text-foreground"
              >
                <Gift className="w-4 h-4" />
              </button>
              {onToggleBookmark && (
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleBookmark(market.id); }}
                  className={`p-1 transition-colors ${isBookmarked ? 'text-primary' : 'hover:text-foreground'}`}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                </button>
              )}
            </div>
          </div> */}
        </div>
      </motion.div>

      {/* Trade bottom sheet */}
      <Drawer open={tradingOpen} onOpenChange={(open) => { setTradingOpen(open); if (!open) setAmount(10); }}>
        <DrawerContent className="rounded-t-2xl border-t max-h-[90vh] flex flex-col">
          <DrawerHeader className="p-0 px-4 pt-2 pb-2 flex flex-row items-center justify-center relative">
            <button
              type="button"
              onClick={() => { setTradingOpen(false); setAmount(10); }}
              className="absolute left-1/2 -translate-x-1/2 -top-16 p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </DrawerHeader>
          <div className="flex flex-col gap-4 px-4 pb-6 overflow-y-auto font-open-sauce-two text-[14px] leading-[20px]">
            {/* Yes / No segmented */}
            <div className="flex rounded-xl border border-border bg-muted/30 p-1 gap-1">
              <button
                type="button"
                onClick={() => setTradingSide('yes')}
                className={`flex-1 py-2.5 rounded-lg font-semibold text-base transition-colors ${tradingSide === 'yes' ? 'bg-success text-white shadow-sm' : 'text-muted-foreground'}`}
              >
                Yes {formatPrice(Number(market.yesPrice))}
              </button>
              <button
                type="button"
                onClick={() => setTradingSide('no')}
                className={`flex-1 py-2.5 rounded-lg font-semibold text-base transition-colors ${tradingSide === 'no' ? 'bg-destructive text-white shadow-sm' : 'text-muted-foreground'}`}
              >
                No {formatPrice(Number(market.noPrice))}
              </button>
            </div>

            {/* Event row: thumbnail + question + "Yes at $x" */}
            <div className="flex gap-3">
              <img
                src={(market as { imageUrl?: string }).imageUrl || `https://picsum.photos/seed/${encodeURIComponent(market.category + market.id)}/80/80`}
                alt=""
                className="w-14 h-14 rounded-lg object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground line-clamp-2">{market.title}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {tradingSide === 'yes' ? 'Yes' : 'No'} at {formatPrice(currentPrice)}
                </p>
              </div>
            </div>

            {/* Order type: Limit / Market */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex rounded-xl border border-border bg-muted/30 p-1 gap-1 flex-1">
                <button
                  type="button"
                  onClick={() => setOrderType('limit')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${orderType === 'limit' ? 'bg-muted text-foreground shadow-sm' : 'text-muted-foreground'}`}
                >
                  Limit
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('market')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${orderType === 'market' ? 'bg-muted text-foreground shadow-sm' : 'text-muted-foreground'}`}
                >
                  Market
                </button>
              </div>
              <button type="button" className="p-1.5 rounded-full hover:bg-muted transition-colors" aria-label="Info">
                <Info className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Limit Price (when limit): slider + stepper + "Qty available" */}
            {orderType === 'limit' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Limit Price</span>
                  <div className="flex items-center gap-2 border border-border rounded-xl px-2 py-1.5">
                    <button type="button" onClick={() => setLimitPrice(p => Math.max(0.01, Math.round((p - 0.01) * 100) / 100))} className="w-6 h-6 flex items-center justify-center rounded-full border border-border hover:bg-muted transition-colors">
                      <Minus className="w-3 h-3 text-foreground" />
                    </button>
                    <span className="w-10 text-center text-sm font-medium">{formatPrice(limitPrice)}</span>
                    <button type="button" onClick={() => setLimitPrice(p => Math.min(0.99, Math.round((p + 0.01) * 100) / 100))} className="w-6 h-6 flex items-center justify-center rounded-full border border-border hover:bg-muted transition-colors">
                      <Plus className="w-3 h-3 text-foreground" />
                    </button>
                  </div>
                </div>
                <Slider
                  value={[limitPrice]}
                  onValueChange={(v) => setLimitPrice(Math.max(0.01, Math.min(0.99, Math.round(v[0] * 100) / 100)))}
                  min={0.01}
                  max={0.99}
                  step={0.01}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">43,098 Qty available</p>
              </div>
            )}

            {/* Quantity (limit) / Amount (market) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">{orderType === 'market' ? 'Amount' : 'Quantity'}</span>
                <div className="flex items-center gap-2 border border-border rounded-xl px-2 py-1.5">
                  <button type="button" onClick={() => setAmount(prev => Math.max(1, prev - 1))} className="w-6 h-6 flex items-center justify-center rounded-full border border-border hover:bg-muted transition-colors">
                    <Minus className="w-3 h-3 text-foreground" />
                  </button>
                  <Input
                    value={amount}
                    onChange={(e) => setAmount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
                    type="number"
                    min={1}
                    max={100}
                    className="w-10 h-7 border-0 bg-transparent text-center text-sm font-medium px-1"
                  />
                  <button type="button" onClick={() => setAmount(prev => Math.min(100, prev + 1))} className="w-6 h-6 flex items-center justify-center rounded-full border border-border hover:bg-muted transition-colors">
                    <Plus className="w-3 h-3 text-foreground" />
                  </button>
                </div>
              </div>
              <Slider
                value={[amount]}
                onValueChange={(v) => setAmount(Math.max(1, Math.min(100, v[0])))}
                min={1}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            {/* Auto cancel (Market tab only) */}
            {orderType === 'market' && (
              <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Auto cancel</span>
                  <Switch
                    checked={autoCancelEnabled}
                    onCheckedChange={setAutoCancelEnabled}
                    className="data-[state=checked]:bg-success"
                  />
                </div>
                {autoCancelEnabled && (
                  <>
                    <p className="text-sm text-muted-foreground">Auto cancel my trade after:</p>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={168}
                        value={autoCancelHours}
                        onChange={(e) => setAutoCancelHours(Math.max(0, Math.min(168, Number(e.target.value) || 0)))}
                        className="w-20 h-9 text-center"
                      />
                      <span className="text-sm text-muted-foreground">Hour</span>
                      <Input
                        type="number"
                        min={0}
                        max={59}
                        value={autoCancelMinutes}
                        onChange={(e) => setAutoCancelMinutes(Math.max(0, Math.min(59, Number(e.target.value) || 0)))}
                        className="w-20 h-9 text-center"
                      />
                      <span className="text-sm text-muted-foreground">Min</span>
                    </div>
                    <p className="text-sm text-destructive">
                      Auto cancel the trade on {format(new Date(Date.now() + autoCancelHours * 60 * 60 * 1000 + autoCancelMinutes * 60 * 1000), "dd MMM, h:mm a")} IST
                    </p>
                  </>
                )}
              </div>
            )}

            {/* You put / You Win summary */}
            <div className="rounded-xl bg-muted/50 p-4 space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>You put</span>
                <span className="text-foreground font-medium">${amount}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-1">You Win <Info className="w-3.5 h-3.5" /></span>
                <span className="text-success font-semibold">
                  ${Math.round(potentialReturn)}{' '}
                  <span className="text-xs">(+{Math.round((potentialReturn / amount - 1) * 100)}%)</span>
                </span>
              </div>
            </div>

            {/* Main CTA */}
            <button
              type="button"
              onClick={handleBuyClick}
              className={`w-full py-3.5 rounded-xl font-semibold text-primary-foreground transition-colors ${tradingSide === 'yes' ? 'bg-success hover:bg-success/90' : 'bg-destructive hover:bg-destructive/90'}`}
            >
              {tradingSide === 'yes' ? 'Yes' : 'No'} {formatPrice(effectivePrice)}
            </button>

            <p className="text-center text-sm text-muted-foreground">Balance: ${balance}</p>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Trade Success Modal - shown after API success */}
      <TradeSuccessModal
        isOpen={showConfirmation}
        onClose={() => {
          setShowConfirmation(false);
          setTradingOpen(false);
          setAmount(10);
        }}
      />
    </>
  );
}
