import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Bookmark, Gift, Calendar, X, Info, ChevronUp, ChevronDown } from "lucide-react";
import { Market } from "@/data/markets";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { useWallet } from "@/contexts/WalletContext";
import { usePrivy } from "@privy-io/react-auth";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";
import { TradeSuccessModal } from "@/components/TradeSuccessModal";
import { formatPrice, formatVolume, getCategoryDisplayName } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Drawer, DrawerContent, DrawerHeader } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";

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

function getCategoryThumbnail(category: string): string {
  return categoryThumbnails[category.toLowerCase()] || categoryThumbnails.default;
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
  const shares = amount / currentPrice;
  const potentialReturn = shares * 1;

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
            price: Number(currentPrice),
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

  const endTimeText = formatEndDate(market.endDate);

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
            <div className="flex rounded-lg overflow-hidden border border-border bg-muted/30 p-0.5">
              <button
                type="button"
                onClick={() => setTradingSide('yes')}
                className={`flex-1 py-2.5 rounded-md font-medium transition-colors ${tradingSide === 'yes' ? 'bg-success text-primary-foreground' : 'text-muted-foreground'}`}
              >
                Yes {formatPrice(Number(market.yesPrice))}
              </button>
              <button
                type="button"
                onClick={() => setTradingSide('no')}
                className={`flex-1 py-2.5  rounded-md font-medium transition-colors ${tradingSide === 'no' ? 'bg-destructive text-primary-foreground' : 'text-muted-foreground'}`}
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
              <div className="flex rounded-lg overflow-hidden border border-border bg-muted/30 p-0.5">
                <button
                  type="button"
                  onClick={() => setOrderType('limit')}
                  className={`px-16 py-2 rounded-md text-sm font-medium transition-colors ${orderType === 'limit' ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
                >
                  Limit
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('market')}
                  className={`px-16 py-2 rounded-md text-sm font-medium transition-colors ${orderType === 'market' ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
                >
                  Market
                </button>
              </div>
              <button type="button" className="p-1.5 rounded-full hover:bg-muted transition-colors" aria-label="Info">
                <Info className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Limit Price (when limit) */}
            {orderType === 'limit' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Limit Price</span>
                  <div className="flex items-center gap-1 bg-muted rounded-lg px-2 py-1.5">
                    <span className="text-sm font-medium">{formatPrice(currentPrice)}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">43,098 Qty available</p>
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">Quantity</span>
                <div className="flex items-center gap-1 bg-muted rounded-lg">
                  <button type="button" onClick={() => setAmount(prev => Math.max(1, prev - 1))} className="p-1.5">
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <Input
                    value={amount}
                    onChange={(e) => setAmount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
                    type="number"
                    min={1}
                    max={100}
                    className="w-14 h-8 border-0 bg-transparent text-center text-sm font-medium px-1"
                  />
                  <button type="button" onClick={() => setAmount(prev => Math.min(100, prev + 1))} className="p-1.5">
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
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

            {/* Win if you're right */}
            <div className="rounded-xl bg-muted/50 p-4 space-y-0.5 text-center">
              <p className="font-open-sauce-two font-medium text-[14px] leading-[20px] tracking-normal text-muted-foreground">Win if you&apos;re right</p>
              <p className="font-open-sauce-two font-semibold text-[30px] leading-[36px] tracking-[-0.025em]  text-foreground">${Math.round(potentialReturn)}</p>
              <p className="text-sm font-medium text-success">
                {(potentialReturn / amount).toFixed(1)}X Return
              </p>
            </div>

            {/* Main CTA */}
            <button
              type="button"
              onClick={handleBuyClick}
              className={`w-full py-3.5 rounded-xl font-semibold text-primary-foreground transition-colors ${tradingSide === 'yes' ? 'bg-success hover:bg-success/90' : 'bg-destructive hover:bg-destructive/90'}`}
            >
              {tradingSide === 'yes' ? 'Yes' : 'No'} {formatPrice(currentPrice)}
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
