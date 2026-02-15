import { useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronUp, X, Sparkles } from "lucide-react";
import { Market } from "@/data/markets";
import { MarketCard } from "./MarketCard";
import { MultiOutcomeCard } from "./MultiOutcomeCard";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useMarkets, useCategories } from "@/hooks/useMarkets";
import { Button } from "@/components/ui/button";

interface StoryFeedProps {
  onSelectMarket: (market: Market) => void;
}

const staticFilters = [
  { id: 'hot', label: '🔥 Hot', sort: 'hot' as const },
  { id: 'trending', label: 'Trending', sort: 'trending' as const },
  { id: 'newest', label: 'New', sort: 'newest' as const },
  { id: 'volume', label: 'Volume', sort: 'volume' as const },
  { id: 'ending_soon', label: 'Ending Soon', sort: 'ending_soon' as const },
];

export function StoryFeed({ onSelectMarket }: StoryFeedProps) {
  const navigate = useNavigate();
  const [activeSort, setActiveSort] = useState<string>('newest');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const { toggleBookmark, isBookmarked } = useBookmarks();
  const feedRef = useRef<HTMLDivElement>(null);

  const { data: categoriesData } = useCategories();
  const apiCategories = categoriesData ?? [];

  // Build query params from filters
  const queryParams = useMemo(() => ({
    status: "ACTIVE" as const,
    limit: 50,
    sort: (activeSort || 'newest') as 'trending' | 'newest' | 'ending_soon' | 'volume' | 'liquidity' | 'hot',
    category: activeCategory ?? undefined,
    search: searchQuery.trim().length >= 2 ? searchQuery.trim() : undefined,
    refetchInterval: 15 * 1000,
  }), [activeSort, activeCategory, searchQuery]);

  const { data: marketsData, isLoading: marketsLoading } = useMarkets(queryParams);
  const apiMarkets = marketsData?.pages?.flatMap((p) => p.markets) ?? [];
  const normalizedApiMarkets: Market[] = apiMarkets.map((m) => ({
    ...m,
    description: m.description ?? "",
    image: m.imageUrl ?? "/placeholder.svg",
    outcomes: [],
  }));
  const filteredMarkets = normalizedApiMarkets;

  const filters = useMemo(() => {
    const cats = apiCategories.map((c: { category: string }) => ({
      id: `cat-${c.category}`,
      label: c.category.charAt(0).toUpperCase() + c.category.slice(1),
      isCategory: true as const,
      category: c.category,
    }));
    return [
      ...staticFilters.map((f) => ({ ...f, isCategory: false as const })),
      ...cats,
    ];
  }, [apiCategories]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterClick = (item: { sort?: string; category?: string; isCategory?: boolean }) => {
    if (item.isCategory && item.category) {
      setActiveCategory(activeCategory === item.category ? null : item.category);
      setActiveSort('newest');
    } else if (item.sort) {
      setActiveSort(activeSort === item.sort ? 'newest' : item.sort);
      setActiveCategory(null);
    }
  };

  const isFilterActive = (item: { sort?: string; category?: string; isCategory?: boolean }) => {
    if (item.isCategory && item.category) return activeCategory === item.category;
    if (item.sort) return activeSort === item.sort;
    return false;
  };

  return (
    <section className="min-h-screen">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Filters: Hot, Trending, Categories, Search */}
        <div className="flex items-center justify-between pt-0.5 pb-2 sm:pb-2.5 mb-2 border-b border-border/30">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {filters.map((item) => (
              <button
                key={item.id}
                onClick={() => handleFilterClick(item)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-all ${
                  isFilterActive(item)
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                {item.label}
              </button>
            ))}
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
          {marketsLoading ? (
            <div className="col-span-full text-center py-16">
              <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="h-8 w-48 bg-muted rounded" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-4xl mx-auto">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-48 bg-muted rounded-xl" />
                  ))}
                </div>
              </div>
            </div>
          ) : filteredMarkets.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <Sparkles className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4 shrink-0" />
              <p className="text-muted-foreground mb-2">No markets found</p>
              <button
                onClick={() => {
                  setActiveCategory(null);
                  setActiveSort('newest');
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
        {!marketsLoading && filteredMarkets.length > 0 && (
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
