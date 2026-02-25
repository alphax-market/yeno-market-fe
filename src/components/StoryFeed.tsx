import { useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronUp, X, Sparkles, TrendingUp, Globe, ChevronRight, Filter, ArrowUpDown, Check } from "lucide-react";
import { Market } from "@/data/markets";
import { MarketCard } from "./MarketCard";
import { MultiOutcomeCard } from "./MultiOutcomeCard";
import { TrendingCard } from "./TrendingCard";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useMarkets, useCategories } from "@/hooks/useMarkets";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import TrendingCardRow from "./TrendingCardRow";
import YenoLogo from "@/assets/svg/yeno-logo-header.svg?react";
import BackgroundImage from "@/assets/png/Section.png";

interface StoryFeedProps {
  onSelectMarket: (market: Market) => void;
}

const sortOptions = [
  { id: "newest", label: "Newest", sort: "newest" as const },
  { id: "liquidity", label: "Liquidity", sort: "liquidity" as const },
  { id: "volume", label: "Volume", sort: "volume" as const },
];

const staticFilters = [
  {
    id: "trending",
    label: "Trending",
    sort: "trending" as const,
    icon: TrendingUp,
  },
  { id: "newest", label: "New", sort: "newest" as const },
];

export function StoryFeed({ onSelectMarket }: StoryFeedProps) {
  const navigate = useNavigate();
  const [activeSort, setActiveSort] = useState<string>("newest");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showLiveEvents, setShowLiveEvents] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const { toggleBookmark, isBookmarked } = useBookmarks();
  const feedRef = useRef<HTMLDivElement>(null);

  const { data: categoriesData } = useCategories();
  const apiCategories = categoriesData ?? [];

  // Send category as-is so backend filters: cricket → only cricket, football → only football
  const apiCategory = useMemo(() => {
    if (!activeCategory) return undefined;
    return activeCategory;
  }, [activeCategory]);

  // Build query params from filters (topic filters markets by market.topic)
  const queryParams = useMemo(
    () => ({
      status: "ACTIVE" as const,
      limit: 50,
      sort: (activeSort || "newest") as
        | "trending"
        | "newest"
        | "ending_soon"
        | "volume"
        | "liquidity"
        | "hot",
      category: apiCategory,
      topic: activeTopic ?? undefined,
      search: searchQuery.trim().length >= 2 ? searchQuery.trim() : undefined,
      refetchInterval: 15 * 1000,
    }),
    [activeSort, apiCategory, activeTopic, searchQuery],
  );

  const { data: marketsData, isLoading: marketsLoading } =
    useMarkets(queryParams);
  const apiMarkets = marketsData?.pages?.flatMap((p) => p.markets) ?? [];
  const normalizedApiMarkets: Market[] = apiMarkets.map((m) => {
    // Derive isLive from end date: live = not yet ended (end date in the future)
    const endDate = m.endDate ? new Date(m.endDate) : null;
    const derivedLive = endDate ? endDate > new Date() : false;
    const isLive = (m as { isLive?: boolean }).isLive ?? derivedLive;
    return {
      ...m,
      description: m.description ?? "",
      image: m.imageUrl ?? "/placeholder.svg",
      outcomes: [],
      isLive,
    };
  });

  const filteredMarkets = useMemo(() => {
    let list = normalizedApiMarkets;
    if (showLiveEvents) {
      list = list.filter((m) => (m as Market & { isLive?: boolean }).isLive === true);
    }
    // Sort trending and volume by volume (desc); leave other sorts to API order
    if (activeSort === "trending" || activeSort === "volume") {
      list = [...list].sort(
        (a, b) => (Number(b.volume) ?? 0) - (Number(a.volume) ?? 0)
      );
    } else if (activeSort === "liquidity") {
      list = [...list].sort(
        (a, b) => (Number(b.liquidity) ?? 0) - (Number(a.liquidity) ?? 0)
      );
    }
    return list;
  }, [normalizedApiMarkets, showLiveEvents, activeSort]);

  // Replace "sports" with Cricket and Football everywhere (pills + filter popover)
  const displayCategories = useMemo(() => {
    const entries = apiCategories.flatMap((c: { category: string }) => {
      const cat = c.category.toLowerCase();
      if (cat === "sports")
        return [
          { category: "cricket", label: "Cricket" },
          { category: "football", label: "Football" },
        ];
      return [
        {
          category: c.category,
          label: c.category.charAt(0).toUpperCase() + c.category.slice(1),
        },
      ];
    });
    const seen = new Set<string>();
    return entries.filter((e) => {
      if (seen.has(e.category)) return false;
      seen.add(e.category);
      return true;
    });
  }, [apiCategories]);

  const filters = useMemo(() => {
    const cats = displayCategories.map((c) => ({
      id: `cat-${c.category}`,
      label: c.label,
      isCategory: true as const,
      category: c.category,
    }));
    return [
      ...staticFilters.map((f) => ({ ...f, isCategory: false as const })),
      ...cats.map((c) => ({ ...c, icon: undefined })),
    ];
  }, [displayCategories]);

  // Topics for the active category (API has topics per category; map cricket/football -> Sports)
  const topicOptions = useMemo(() => {
    if (!activeCategory) return [];
    const apiCat = (activeCategory.toLowerCase() === "cricket" || activeCategory.toLowerCase() === "football")
      ? "Sports"
      : activeCategory;
    const found = (apiCategories as { category: string; topics?: string[] }[]).find(
      (c) => c.category === apiCat
    );
    return found?.topics ?? [];
  }, [activeCategory, apiCategories]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFilterClick = (item: {
    sort?: string;
    category?: string;
    isCategory?: boolean;
  }) => {
    if (item.isCategory && item.category) {
      setActiveCategory(
        activeCategory === item.category ? null : item.category,
      );
      setActiveTopic(null);
      setActiveSort("newest");
    } else if (item.sort) {
      setActiveSort(activeSort === item.sort ? "newest" : item.sort);
      setActiveCategory(null);
      setActiveTopic(null);
    }
  };

  // Only one tab active: sort tabs (Trending, New) active only when no category selected
  const isFilterActive = (item: {
    sort?: string;
    category?: string;
    isCategory?: boolean;
  }) => {
    if (item.isCategory && item.category)
      return activeCategory === item.category;
    if (item.sort)
      return activeCategory === null && activeSort === item.sort;
    return false;
  };

  return (
    <>
    <section className="min-h-screen">
       <div className="flex items-center justify-between pt-2 sm:pb-2.5  border-b border-border/30">
          <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide border-b px-4">
            {filters.map((item) => {
              const Icon = (item as any).icon;
              const active = isFilterActive(item);
              return (
                <button
                  key={item.id}
                  onClick={() => handleFilterClick(item)}
                  className={`relative flex items-center gap-2 pb-2.5 font-plus-jakarta font-semibold text-[16px] leading-[20px] tracking-normal whitespace-nowrap transition-all ${
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {item.label}
                  {active && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
          {/* <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSearch(!showSearch)}
            className={showSearch ? "text-primary" : "text-muted-foreground"}
          >
            {showSearch ? (
              <X className="w-4 h-4" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button> */}
        </div>

      <div className="container px-4 py-2 bg-secondary rounded-xl">
        {/* Trending Questions - horizontal scroll */}
      

        {/* Filters: Hot, Trending, Categories, Search */}
       

    
          <TrendingCardRow />

        {/* Live events toggle + Filter + Newest row */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-2 border-b border-border/30">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Live events</span>
            <Switch
              checked={showLiveEvents}
              onCheckedChange={setShowLiveEvents}
              className="data-[state=checked]:bg-success"
            />
          </div>
          <div className="flex items-center gap-2">
            <Popover
              open={filterOpen}
              onOpenChange={(open) => {
                setFilterOpen(open);
                if (open) setFilterCategory(activeCategory);
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-background border-border rounded-lg gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Filter
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                side="bottom"
                className="w-56 p-0 rounded-xl shadow-lg border border-border"
              >
                <div className="p-3 border-b border-border">
                  <h3 className="font-semibold text-foreground">Categories</h3>
                </div>
                <div className="max-h-[200px] overflow-y-auto py-1">
                  {displayCategories.map((c) => {
                    const selected = filterCategory === c.category;
                    return (
                      <button
                        key={c.category}
                        type="button"
                        onClick={() => {
                          const next = selected ? null : c.category;
                          setFilterCategory(next);
                          setActiveCategory(next);
                          setActiveTopic(null);
                          setActiveSort("newest");
                          setFilterOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors text-left"
                      >
                        {selected ? (
                          <Check className="w-4 h-4 text-primary shrink-0" />
                        ) : (
                          <span className="w-4 shrink-0" />
                        )}
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>

            <Popover open={sortOpen} onOpenChange={setSortOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`rounded-lg gap-2 bg-background border-border"
                  }`}
                >
                  <ArrowUpDown className="w-4 h-4" />
                  {sortOptions.find((o) => o.sort === activeSort)?.label ?? "Newest"}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                side="bottom"
                className="w-56 p-0 rounded-xl shadow-lg border border-border"
              >
                <div className="py-1">
                  {sortOptions.map((opt) => {
                    const selected = activeSort === opt.sort;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setActiveSort(opt.sort);
                          setSortOpen(false);
                        }}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors text-left"
                      >
                        {opt.label}
                        {selected ? (
                          <Check className="w-4 h-4 text-primary shrink-0" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Topic row: below event/filter row; pill style per design (active = solid grey, inactive = light bg + grey text) */}
        {activeCategory && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-2.5 border-b border-border/30">
            <button
              type="button"
              onClick={() => setActiveTopic(null)}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTopic === null
                  ? "bg-background text-foreground"
                  : "bg-transparent border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              All
            </button>
            {topicOptions.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => setActiveTopic(activeTopic === topic ? null : topic)}
                className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTopic === topic
                    ? "bg-background text-foreground"
                    : "bg-transparent border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        )}

        {/* Search Bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
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
                  setActiveTopic(null);
                  setActiveSort("newest");
                  setSearchQuery("");
                }}
                className="text-sm text-primary hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            filteredMarkets.map((market, index) => {
              const hasMultipleOutcomes =
                market.outcomes && market.outcomes.length > 0;

              if (hasMultipleOutcomes) {
                return (
                  <MultiOutcomeCard
                    key={market.id}
                    market={market}
                    index={index}
                    onSelect={(m) => {
                      if (
                        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                          String(m.id),
                        )
                      ) {
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
                    if (
                      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                        String(m.id),
                      )
                    ) {
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

        {/* Bottom footer: dark section with green glow + white card */}
       
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
     <div className="relative rounded-3xl overflow-hidden  flex flex-col items-center ">
     {/* Green glow at top */}
        <img
        src={BackgroundImage}
        alt="Background"
        className="w-full h-full object-cover"
      />

     {/* White card - only top corners rounded per design */}
     <div
       className="relative z-10 w-full mx-auto bg-background  py-8 px-6 flex flex-col items-center gap-6 overflow-hidden"
       style={{
         borderTopLeftRadius: "1.5rem",
         borderTopRightRadius: "1.5rem",
         borderBottomLeftRadius: 0,
         borderBottomRightRadius: 0,
         marginTop: "-30px",
       }}
     >
       <div className="flex flex-col items-center gap-2">
         <YenoLogo className="h-5 w-auto" aria-hidden />
         <p className="text-sm font-medium ">Yeno Technologies Inc</p>
       </div>
       <nav className="flex flex-col items-center gap-2 text-sm font-semibold">
         <div className="flex justify-center gap-x-6">
           <a href="/about" className="hover:underline">About Us</a>
           <a href="/terms" className="hover:underline">Terms and Conditions</a>
         </div>
         <a href="/privacy" className="hover:underline">Privacy Policy</a>
       </nav>
       <p className="text-sm text-muted-foreground">
         Powered by <span className="font-semibold text-foreground">Solana</span>
       </p>
     </div>
      </div>
      </>
  );
}
