import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, TrendingUp, Flame, Clock, Sparkles, 
  ChevronUp, X
} from "lucide-react";
import { Market, ashesMarkets, politicalMarkets } from "@/data/markets";
import { multiOutcomeMarkets } from "@/data/multiOutcomeMarkets";
import { MarketCard } from "./MarketCard";
import { MultiOutcomeCard } from "./MultiOutcomeCard";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useMarkets } from "@/hooks/useMarkets";
import { Button } from "@/components/ui/button";

interface StoryFeedProps {
  onSelectMarket: (market: Market) => void;
}

const mockMarkets = [...multiOutcomeMarkets, ...ashesMarkets, ...politicalMarkets];

const categories = [
  { id: 'trending', label: 'Trending', icon: TrendingUp },
  { id: 'breaking', label: 'Breaking', icon: Flame },
  { id: 'sports', label: 'Sports', icon: null },
  { id: 'crypto', label: 'Crypto', icon: null },
  { id: 'stocks', label: 'Stocks', icon: null },
  { id: 'viral', label: 'Viral', icon: Sparkles },
  { id: 'cricket', label: 'Cricket', icon: null },
  { id: 'football', label: 'Football', icon: null },
];

export function StoryFeed({ onSelectMarket }: StoryFeedProps) {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const { toggleBookmark, isBookmarked } = useBookmarks();
  const feedRef = useRef<HTMLDivElement>(null);

  // Prefer API markets so demo users can trade on all listed markets (not just empty test event)
  const { data: marketsData } = useMarkets({ status: "ACTIVE", limit: 50, sort: "newest" });
  const apiMarkets = marketsData?.pages?.flatMap((p) => p.markets) ?? [];
  const normalizedApiMarkets: Market[] = apiMarkets.map((m) => ({
    ...m,
    description: m.description ?? "",
    image: m.imageUrl ?? "/placeholder.svg",
    outcomes: [],
  }));
  const allMarkets = normalizedApiMarkets.length > 0 ? normalizedApiMarkets : mockMarkets;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter markets
  const filteredMarkets = allMarkets.filter((market) => {
    // No filter selected = show all
    if (!activeCategory) {
      const matchesSearch = 
        !searchQuery ||
        market.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        market.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    }

    // Handle special filters: trending, breaking, new
    if (activeCategory === 'trending') {
      return market.trending === true;
    } else if (activeCategory === 'breaking') {
      return market.isLive === true;
    } else if (activeCategory === 'new') {
      const endDate = new Date(market.endDate);
      const now = new Date();
      const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilEnd <= 30 && daysUntilEnd > 0;
    }

    // Category filter
    const matchesCategory = 
      market.category.toLowerCase().includes(activeCategory.toLowerCase()) ||
      market.title.toLowerCase().includes(activeCategory.toLowerCase());
    
    const matchesSearch = 
      !searchQuery ||
      market.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      market.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  }).sort((a, b) => b.volume - a.volume);

  return (
    <section className="min-h-screen">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Combined Filters Row - Categories + Trending/Breaking/New */}
        <div className="flex items-center justify-between pt-0.5 pb-2 sm:pb-2.5 mb-2 border-b border-border/30">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-all ${
                    activeCategory === cat.id
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  {cat.label}
                </button>
              );
            })}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSearch(!showSearch)}
            className={showSearch ? 'text-primary' : 'text-muted-foreground'}
          >
            {showSearch ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="relative py-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search markets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-lg bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                  autoFocus
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Markets Grid - Polymarket style */}
        <div 
          ref={feedRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          {filteredMarkets.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <Sparkles className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No markets found</p>
              <button
                onClick={() => {
                  setActiveCategory(null);
                  setSearchQuery('');
                }}
                className="text-sm text-primary hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            filteredMarkets.map((market, index) => {
              const hasMultipleOutcomes = market.outcomes && market.outcomes.length > 0;
              
              if (hasMultipleOutcomes) {
                return (
                  <MultiOutcomeCard
                    key={market.id}
                    market={market}
                    index={index}
                    onSelect={(m) => {
                      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(m.id))) {
                        navigate(`/market/${m.id}`);
                        return;
                      }
                      onSelectMarket(m);
                    }}
                    isBookmarked={isBookmarked(market.id)}
                    onToggleBookmark={toggleBookmark}
                  />
                );
              }
              
              return (
                <MarketCard
                  key={market.id}
                  market={market}
                  index={index}
                  onSelect={(m) => {
                    // API markets (UUID): go to detail page so demo users can trade
                    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(m.id))) {
                      navigate(`/market/${m.id}`);
                      return;
                    }
                    onSelectMarket(m);
                  }}
                  isBookmarked={isBookmarked(market.id)}
                  onToggleBookmark={toggleBookmark}
                />
              );
            })
          )}
        </div>

        {/* Load more indicator */}
        {filteredMarkets.length > 0 && (
          <div className="text-center py-12 text-sm text-muted-foreground">
            <p>Showing {filteredMarkets.length} markets</p>
          </div>
        )}
      </div>

      {/* Scroll to top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-24 right-6 w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors z-30"
          >
            <ChevronUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </section>
  );
}
