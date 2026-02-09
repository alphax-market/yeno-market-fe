import { useState } from "react";
import { X, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { Market } from "@/data/markets";
import { useWallet } from "@/contexts/WalletContext";
import { usePrivy } from "@privy-io/react-auth";
import { TradeConfirmationModal } from "@/components/TradeConfirmationModal";
import { formatDistanceToNow, isPast } from "date-fns";
import { formatPrice } from "@/lib/utils";

interface InlineTradingPanelProps {
  market: Market;
  initialSide: 'yes' | 'no';
  outcome?: string; // For multi-outcome markets
  onClose: () => void;
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

// Half dial gauge component with percentage inside
function HalfDial({ percentage }: { percentage: number }) {
  return (
    <div className="relative w-16 h-10 shrink-0">
      <svg viewBox="0 0 100 65" className="w-full h-full">
        <path
          d="M 8 55 A 42 42 0 0 1 92 55"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M 8 55 A 42 42 0 0 1 92 55"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(percentage / 100) * 132} 132`}
        />
        <text
          x="50"
          y="50"
          textAnchor="middle"
          className="fill-foreground font-bold"
          fontSize="20"
        >
          {percentage}%
        </text>
        <text
          x="50"
          y="63"
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize="9"
        >
          chance
        </text>
      </svg>
    </div>
  );
}

// Category to emoji mapping
const categoryThumbnails: Record<string, string> = {
  politics: "🏛️",
  "us politics": "🇺🇸",
  "uk politics": "🇬🇧",
  "eu politics": "🇪🇺",
  "economic policy": "💰",
  cricket: "🏏",
  sports: "⚽",
  default: "📊"
};

function getCategoryThumbnail(category: string): string {
  return categoryThumbnails[category.toLowerCase()] || categoryThumbnails.default;
}

export function InlineTradingPanel({ market, initialSide, outcome, onClose }: InlineTradingPanelProps) {
  const { isConnected } = useWallet();
  const [side, setSide] = useState<'yes' | 'no'>(initialSide);
  const [amount, setAmount] = useState(10);
  const { login } = usePrivy();
  const [showConfirmation, setShowConfirmation] = useState(false);

  // For multi-outcome markets, find the specific outcome price
  const outcomeData = outcome && market.outcomes 
    ? market.outcomes.find(o => o.name === outcome)
    : null;
  
  const currentPrice = outcomeData 
    ? (side === 'yes' ? outcomeData.price : 1 - outcomeData.price)
    : (side === 'yes' ? market.yesPrice : market.noPrice);
  
  const percentage = Math.round(currentPrice * 100);
  const shares = amount / currentPrice;
  const potentialReturn = shares * 1;

  const handleBuyClick = () => {
    if (!isConnected) {
      login();
    } else {
      setShowConfirmation(true);
    }
  };

  const displayTitle = outcome ? `${outcome}` : market.title;
  const displaySubtitle = outcome ? market.title : null;
  return (
    <>
      {/* Modal Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-card border border-border rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-start gap-3 p-4 pb-3">
          <HalfDial percentage={percentage} />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-foreground leading-snug line-clamp-2">
              {displayTitle}
            </h3>
            {displaySubtitle && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {displaySubtitle}
              </p>
            )}
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span>{formatVolume(market.volume)} Vol.</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatEndDate(market.endDate)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-secondary transition-colors shrink-0"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Yes/No Toggle */}
        <div className="px-4 pb-3">
          <div className="flex gap-2">
            <button
              onClick={() => setSide('yes')}
              className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                side === 'yes'
                  ? 'bg-success text-white'
                  : 'bg-success/20 text-success hover:bg-success/30'
              }`}
            >
              Yes {formatPrice(outcomeData ? outcomeData.price : market.yesPrice)}
            </button>
            <button
              onClick={() => setSide('no')}
              className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                side === 'no'
                  ? 'bg-destructive text-white'
                  : 'bg-destructive/20 text-destructive hover:bg-destructive/30'
              }`}
            >
              No {formatPrice(outcomeData ? 1 - outcomeData.price : market.noPrice)}
            </button>
          </div>
        </div>

        {/* Amount Input Section */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2">
            {/* Amount Display */}
            <div className="bg-secondary rounded-lg px-4 py-2.5 min-w-[80px]">
              <span className="text-lg font-bold text-foreground">${amount}</span>
            </div>
            
            {/* Quick Add Buttons */}
            <button
              onClick={() => setAmount(prev => prev + 1)}
              className="px-3 py-2.5 rounded-lg bg-secondary text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
            >
              +1
            </button>
            <button
              onClick={() => setAmount(prev => prev + 10)}
              className="px-3 py-2.5 rounded-lg bg-secondary text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
            >
              +10
            </button>
            
            {/* Slider */}
            <div className="flex-1 px-2">
              <Slider
                value={[amount]}
                onValueChange={handleSliderChange}
                min={1}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Buy Button */}
        <div className="px-4 pb-4">
          <button
            onClick={handleBuyClick}
            className={`w-full py-4 rounded-xl font-semibold text-center transition-colors ${
              side === 'yes'
                ? 'bg-success hover:bg-success/90 text-success-foreground'
                : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
            }`}
          >
            <div className="text-base font-bold">
              Buy {side === 'yes' ? 'Yes' : 'No'}
            </div>
            <div className="text-sm opacity-90">
              You can win <span className="text-lg font-bold">${potentialReturn.toFixed(2)}</span>
            </div>
          </button>
        </div>
        </div>
      </motion.div>

      {/* Wallet Modal */}

      {/* Trade Confirmation Modal */}
      <TradeConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        market={market}
        side={side}
        amount={amount}
        shares={shares}
        avgPrice={currentPrice}
        potentialReturn={potentialReturn}
        outcome={outcome}
        orderType="limit"
        limitPrice={currentPrice}
        expiration={null}
      />
    </>
  );
}
