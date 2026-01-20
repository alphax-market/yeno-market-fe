import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, Bookmark, Flame } from "lucide-react";
import { Market } from "@/data/markets";

interface MarketListItemProps {
  market: Market;
  index: number;
  onSelect: (market: Market) => void;
  isBookmarked: boolean;
  onToggleBookmark: (marketId: string) => void;
  onTrade?: (market: Market, side: 'yes' | 'no', outcome?: string) => void;
}

function formatVolume(volume: number): string {
  if (volume >= 1000000) {
    return `$${(volume / 1000000).toFixed(1)}m`;
  }
  return `$${(volume / 1000).toFixed(0)}k`;
}

export function MarketListItem({ market, index, onSelect, isBookmarked, onToggleBookmark, onTrade }: MarketListItemProps) {
  const navigate = useNavigate();
  const yesPercentage = Math.round(market.yesPrice * 100);
  const change = market.change24h || 0;

  const handleClick = () => {
    navigate(`/market/${market.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className="flex items-center gap-4 p-4 bg-card rounded-lg border border-border/50 hover:border-primary/30 transition-all cursor-pointer group"
      onClick={handleClick}
    >
      {/* Title & badges */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {market.trending && <Flame className="w-3.5 h-3.5 text-accent" />}
          <h3 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {market.title}
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="px-1.5 py-0.5 rounded bg-secondary">{market.category}</span>
          <span>{formatVolume(market.volume)} Vol</span>
        </div>
      </div>

      {/* Price */}
      <div className="text-right">
        <div className="text-lg font-semibold">{yesPercentage}%</div>
        {change !== 0 && (
          <div className={`flex items-center justify-end gap-0.5 text-xs ${change > 0 ? 'text-success' : 'text-destructive'}`}>
            {change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>

      {/* Quick buttons */}
      <div className="flex items-center gap-1.5">
        <button 
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-success/20 text-success hover:bg-success/30 transition-colors"
          onClick={(e) => { e.stopPropagation(); onTrade?.(market, 'yes'); }}
        >
          Yes
        </button>
        <button 
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
          onClick={(e) => { e.stopPropagation(); onTrade?.(market, 'no'); }}
        >
          No
        </button>
      </div>

      {/* Bookmark */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleBookmark(market.id); }}
        className={`p-2 rounded-md transition-colors ${isBookmarked ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
      >
        <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
      </button>
    </motion.div>
  );
}
