import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Bookmark, Gift, Calendar, X } from "lucide-react";
import { Market } from "@/data/markets";
import { formatDistanceToNow, isPast } from "date-fns";
import { useWallet } from "@/contexts/WalletContext";
import { usePrivy } from "@privy-io/react-auth";
import { TradeConfirmationModal } from "@/components/TradeConfirmationModal";
import { Slider } from "@/components/ui/slider";

interface MultiOutcomeCardProps {
  market: Market;
  index: number;
  onSelect: (market: Market) => void;
  isBookmarked?: boolean;
  onToggleBookmark?: (marketId: string) => void;
  onTrade?: (market: Market, side: 'yes' | 'no', outcome?: string) => void;
}

function formatVolume(volume: number): string {
  if (volume >= 1000000) {
    return `$${(volume / 1000000).toFixed(1)}m`;
  }
  return `$${(volume / 1000).toFixed(0)}k`;
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
  default: "📊"
};

function getCategoryThumbnail(category: string): string {
  return categoryThumbnails[category.toLowerCase()] || categoryThumbnails.default;
}

export function MultiOutcomeCard({ market, index, onSelect, isBookmarked = false, onToggleBookmark, onTrade }: MultiOutcomeCardProps) {
  const navigate = useNavigate();
  const { isConnected } = useWallet();
  const allOutcomes = market.outcomes || [];

  // Inline trading state
  const [tradingOpen, setTradingOpen] = useState(false);
  const [tradingSide, setTradingSide] = useState<'yes' | 'no'>('yes');
  const [tradingOutcome, setTradingOutcome] = useState<string | null>(null);
  const [amount, setAmount] = useState(10);
  const { login, authenticated } = usePrivy();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Close trading when clicking outside the card (another card, backdrop, etc.)
  useEffect(() => {
    if (!tradingOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setTradingOpen(false);
        setTradingOutcome(null);
        setAmount(10);
      }
    };
    document.addEventListener("mousedown", handleMouseDown, true);
    return () => document.removeEventListener("mousedown", handleMouseDown, true);
  }, [tradingOpen]);

  const handleClick = () => {
    if (!tradingOpen) {
      navigate(`/market/${market.id}`);
    }
  };

  const handleTradeClick = (e: React.MouseEvent, side: 'yes' | 'no', outcomeName: string) => {
    e.stopPropagation();
    setTradingSide(side);
    setTradingOutcome(outcomeName);
    setTradingOpen(true);
  };

  const handleCloseTrading = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTradingOpen(false);
    setTradingOutcome(null);
    setAmount(10);
  };

  const outcomeData = tradingOutcome ? allOutcomes.find(o => o.name === tradingOutcome) : null;
  const currentPrice = outcomeData 
    ? (tradingSide === 'yes' ? outcomeData.price : 1 - outcomeData.price)
    : 0.5;
  const shares = amount / currentPrice;
  const potentialReturn = shares * 1;

  const handleBuyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isConnected) {
      login();
    } else {
      setShowConfirmation(true);
    }
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
          scale: tradingOpen ? 1.04 : 1,
        }}
        transition={{
          opacity: { duration: 0.2, delay: index * 0.02 },
          y: { duration: 0.2, delay: index * 0.02 },
          scale: { type: "tween", duration: 0.22, ease: [0.25, 0.1, 0.25, 1] },
        }}
        className={`group bg-card rounded-xl border border-border/50 overflow-hidden hover:border-primary hover:shadow-md hover:shadow-primary/10 hover:ring-2 hover:ring-primary/20 cursor-pointer h-[220px] flex flex-col origin-center ${tradingOpen ? "z-20 shadow-xl ring-2 ring-primary/30" : ""}`}
        onClick={handleClick}
      >
        <div className="p-3 flex flex-col flex-1 overflow-hidden min-h-0">
          {/* Title row with thumbnail */}
          <div className="flex items-start gap-3 mb-2">
            {/* Thumbnail - use image if available, otherwise emoji */}
            {market.imageUrl ? (
              <img 
                src={market.imageUrl} 
                alt={market.title}
                className="w-10 h-10 rounded-lg object-cover shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center text-xl shrink-0">
                {getCategoryThumbnail(market.category)}
              </div>
            )}
            {/* Title */}
            <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 flex-1">
              {market.title}
            </h3>
          </div>

          {/* Outcomes or Inline Trading */}
          <AnimatePresence mode="wait">
            {!tradingOpen ? (
              <motion.div 
                key="outcomes"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-y-auto space-y-1.5 mb-2 pr-1 scrollbar-thin max-h-[76px]"
                onClick={(e) => e.stopPropagation()}
              >
                {allOutcomes.map((outcome, idx) => {
                  const percentage = Math.round(outcome.price * 100);
                  const isLeading = idx === 0;
                  return (
                    <div 
                      key={outcome.name}
                      className={`flex items-center justify-between py-1.5 px-2.5 rounded-lg transition-colors ${
                        isLeading 
                          ? 'bg-primary/5 border border-primary/10' 
                          : 'bg-secondary/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className={`text-xs font-medium truncate ${isLeading ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {outcome.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${isLeading ? 'text-primary bg-primary/15' : 'text-muted-foreground bg-muted/50'}`}>
                          {percentage}%
                        </span>
                        <button 
                          className="px-2 py-0.5 rounded text-xs font-semibold bg-success/20 hover:bg-success/30 text-success transition-colors"
                          onClick={(e) => handleTradeClick(e, 'yes', outcome.name)}
                        >
                          Yes
                        </button>
                        <button 
                          className="px-1.5 py-0.5 rounded text-xs font-semibold bg-destructive/20 hover:bg-destructive/30 text-destructive transition-colors"
                          onClick={(e) => handleTradeClick(e, 'no', outcome.name)}
                        >
                          No
                        </button>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div 
                key="trading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col min-h-0"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header with selected outcome and close */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-foreground">
                    {tradingOutcome}
                  </span>
                  <button
                    onClick={handleCloseTrading}
                    className="p-0.5 rounded-md hover:bg-secondary transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                {/* Amount: row with slider */}
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="bg-secondary rounded-lg px-2 py-1.5 min-w-[50px]">
                    <span className="text-sm font-bold text-foreground">${amount}</span>
                  </div>
                  <button
                    onClick={() => setAmount(prev => Math.max(1, prev + 1))}
                    className="px-2 py-1.5 rounded-lg bg-secondary text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => setAmount(prev => prev + 10)}
                    className="px-2 py-1.5 rounded-lg bg-secondary text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    +10
                  </button>
                  <div className="flex-1 px-1 min-w-0">
                    <Slider
                      value={[amount]}
                      onValueChange={(v) => setAmount(Math.max(1, Math.min(100, v[0])))}
                      min={1}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Buy Button */}
                <button
                  onClick={handleBuyClick}
                  className="w-full py-2 rounded-lg font-semibold text-sm bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
                >
                  Buy
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer: Volume + End Time + Icons - Fixed at bottom */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1.5 border-t border-border/30 shrink-0 mt-auto">
            <div className="flex items-center gap-3">
              <span>{formatVolume(market.volume)} Vol.</span>
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
        </div>
      </motion.div>

      {/* Wallet Modal */}

      {/* Trade Confirmation Modal */}
      <TradeConfirmationModal
        isOpen={showConfirmation}
        onClose={() => {
          setShowConfirmation(false);
          setTradingOpen(false);
          setTradingOutcome(null);
          setAmount(10);
        }}
        market={market}
        side={tradingSide}
        amount={amount}
        shares={shares}
        avgPrice={currentPrice}
        potentialReturn={potentialReturn}
        outcome={tradingOutcome || undefined}
      />
    </>
  );
}
