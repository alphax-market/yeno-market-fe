import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { TrendingUp, MessageCircle, Share2, Bookmark, ExternalLink } from "lucide-react";
import { Market } from "@/data/markets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface StoryCardProps {
  market: Market;
  index: number;
  isBookmarked?: boolean;
  onToggleBookmark?: (marketId: string) => void;
  onTrade?: (market: Market, side: 'yes' | 'no') => void;
}


export function StoryCard({ market, index, isBookmarked = false, onToggleBookmark, onTrade }: StoryCardProps) {
  const navigate = useNavigate();

  const hasMultipleOutcomes = market.outcomes && market.outcomes.length > 0;
  const yesPercentage = hasMultipleOutcomes 
    ? Math.round((market.outcomes![0]?.price || 0) * 100)
    : Math.round(market.yesPrice * 100);
  
  // Calculate return multipliers
  const yesMultiplier = market.yesPrice > 0 ? (1 / market.yesPrice).toFixed(2) : '∞';
  const noMultiplier = market.noPrice > 0 ? (1 / market.noPrice).toFixed(2) : '∞';

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="story-card bg-card border border-border/50 rounded-xl overflow-hidden hover:border-primary/30 transition-all duration-300"
    >
      {/* Story Header - Compact for mobile */}
      <div className="p-3 sm:p-5 pb-2 sm:pb-4">
        <div className="flex items-start justify-between gap-2 sm:gap-4 mb-2 sm:mb-4">
          <div className="flex-1 min-w-0">
            {/* Category & Status */}
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 flex-wrap">
              <Badge variant="outline" className="text-[10px] sm:text-xs font-medium px-1.5 py-0">
                {market.category}
              </Badge>
              {market.isLive && (
                <Badge className="bg-destructive/20 text-destructive border-destructive/30 animate-pulse text-[10px] sm:text-xs px-1.5 py-0">
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-destructive mr-1" />
                  LIVE
                </Badge>
              )}
              {market.trending && (
                <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] sm:text-xs px-1.5 py-0 hidden sm:flex">
                  <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                  Trending
                </Badge>
              )}
            </div>
            
            {/* Title */}
            <h2 
              className="text-sm sm:text-lg font-bold text-foreground leading-tight cursor-pointer hover:text-primary transition-colors line-clamp-2"
              onClick={() => navigate(`/market/${market.id}`)}
            >
              {market.title}
            </h2>
          </div>

          {/* Probability Ring - Compact on mobile */}
          <div className="relative flex flex-col items-center bg-primary/10 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-primary/20 shrink-0">
            <div className="relative w-10 h-10 sm:w-16 sm:h-16">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="3"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  strokeDasharray={`${yesPercentage * 0.94} 100`}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm sm:text-xl font-bold text-primary">{yesPercentage}%</span>
              </div>
            </div>
            <span className="text-[8px] sm:text-[10px] font-semibold text-primary/80 mt-0.5 sm:mt-1">YES</span>
          </div>
        </div>
      </div>

      {/* Trading Actions - Compact */}
      <div className="px-3 sm:px-5 pb-3 sm:pb-4">
        {hasMultipleOutcomes ? (
          /* Multi-outcome display - Compact */
          <div className="space-y-1.5 sm:space-y-2 mb-2 sm:mb-4">
            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mb-1 sm:mb-2">Top Outcomes</p>
            {market.outcomes!.slice(0, 3).map((outcome, idx) => {
              const outcomePercentage = Math.round(outcome.price * 100);
              const outcomeMultiplier = outcome.price > 0 ? (1 / outcome.price).toFixed(2) : '∞';
              return (
                <div 
                  key={outcome.name}
                  className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                  onClick={() => navigate(`/market/${market.id}`)}
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/20 text-primary text-[10px] sm:text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <span className="font-medium text-xs sm:text-sm truncate">{outcome.name}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span className="font-bold text-primary text-xs sm:text-sm">{outcomePercentage}%</span>
                    <Badge variant="outline" className="text-[10px] sm:text-xs bg-primary/10 text-primary border-primary/30 px-1.5">
                      {outcomeMultiplier}x
                    </Badge>
                  </div>
                </div>
              );
            })}
            {market.outcomes!.length > 3 && (
              <button 
                onClick={() => navigate(`/market/${market.id}`)}
                className="w-full text-center text-[10px] sm:text-xs text-primary hover:underline py-1.5 sm:py-2"
              >
                +{market.outcomes!.length - 3} more
              </button>
            )}
          </div>
        ) : (
          /* Binary Yes/No rows - Compact */
          <div className="space-y-1.5 sm:space-y-2 mb-2 sm:mb-4">
            {/* Yes Row */}
            <div 
              className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
              onClick={(e) => { e.stopPropagation(); onTrade?.(market, 'yes'); }}
            >
              <span className="font-medium text-foreground text-xs sm:text-sm">Yes</span>
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-success/50 text-success font-semibold text-[10px] sm:text-sm">
                  {yesPercentage}%
                </span>
                <span className="text-[10px] sm:text-sm text-muted-foreground">{yesMultiplier}x</span>
              </div>
            </div>
            
            {/* No Row */}
            <div 
              className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
              onClick={(e) => { e.stopPropagation(); onTrade?.(market, 'no'); }}
            >
              <span className="font-medium text-foreground text-xs sm:text-sm">No</span>
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-destructive/50 text-destructive font-semibold text-[10px] sm:text-sm">
                  {100 - yesPercentage}%
                </span>
                <span className="text-[10px] sm:text-sm text-muted-foreground">{noMultiplier}x</span>
              </div>
            </div>
          </div>
        )}

        {/* Social Actions - Compact */}
        <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-border/50">
          <div className="flex items-center gap-0.5 sm:gap-1">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-7 sm:h-8 px-1.5 sm:px-2">
              <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
              <span className="text-[10px] sm:text-xs">{Math.floor(Math.random() * 50) + 5}</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-7 sm:h-8 px-1.5 sm:px-2">
              <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-7 sm:h-8 px-1.5 sm:px-2 ${isBookmarked ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => onToggleBookmark?.(market.id)}
            >
              <Bookmark className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </Button>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:text-primary h-7 sm:h-8"
            onClick={() => navigate(`/market/${market.id}`)}
          >
            <span className="text-[10px] sm:text-xs mr-0.5 sm:mr-1">Details</span>
            <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
