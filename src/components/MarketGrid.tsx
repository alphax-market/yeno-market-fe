import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Search, TrendingUp, Trophy, Clock, Vote, Globe, ChevronLeft, ChevronRight,
  LayoutGrid, List, SlidersHorizontal, Bookmark, X, Flame, Banknote,
  MessageSquare, Users
} from "lucide-react";
import { Market, ashesMarkets, politicalMarkets } from "@/data/markets";
import { multiOutcomeMarkets } from "@/data/multiOutcomeMarkets";
import { MarketCard } from "./MarketCard";
import { MultiOutcomeCard } from "./MultiOutcomeCard";
import { MarketListItem } from "./MarketListItem";
import { InlineTradingModal } from "./InlineTradingModal";
import { useBookmarks } from "@/hooks/useBookmarks";

interface TradingState {
  market: Market | null;
  outcome?: string;
  side: 'yes' | 'no';
}

interface MarketGridProps {
  onSelectMarket: (market: Market) => void;
}

const allMarkets = [...multiOutcomeMarkets, ...ashesMarkets, ...politicalMarkets];

// Main categories for the top nav bar
const mainCategories = [
  { id: 'trending', label: 'Trending', icon: TrendingUp },
  { id: 'breaking', label: 'Breaking', icon: Flame },
  { id: 'sports', label: 'Sports', icon: Trophy },
  { id: 'crypto', label: 'Crypto', icon: Banknote },
  { id: 'stocks', label: 'Stocks', icon: TrendingUp },
  { id: 'viral', label: 'Viral', icon: Users },
  { id: 'cricket', label: 'Cricket', icon: Trophy },
  { id: 'football', label: 'Football', icon: Trophy },
];

// Trending topic pills (like Polymarket's horizontal scrolling tags)
const trendingTopics = [
  'All', 'Trump', 'Venezuela', 'Iran', 'Greenland', 'Ukraine', 'Portugal Election',
  'Minnesota Fraud', 'Epstein', 'Fed', 'Tweet Markets', 'Golden Globes', 
  'Silver', 'China', 'AI', 'Ukraine Peace Deal', 'Weather', 'Super Bowl'
];

const sortOptions = [
  { value: '24h_volume', label: '24hr Volume' },
  { value: 'liquidity', label: 'Liquidity' },
  { value: 'newest', label: 'Newest' },
  { value: 'ending_soon', label: 'Ending Soon' },
];

const politicalCategories = ['US Politics', 'UK Politics', 'EU Politics', 'Tech Policy', 'Economic Policy', 'World Politics'];

export function MarketGrid({ onSelectMarket }: MarketGridProps) {
  const [activeCategory, setActiveCategory] = useState('trending');
  const [activeTopic, setActiveTopic] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('24h_volume');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [hideSports, setHideSports] = useState(false);
  const [hideCrypto, setHideCrypto] = useState(false);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [tradingState, setTradingState] = useState<TradingState>({ market: null, side: 'yes' });
  
  const { bookmarks, toggleBookmark, isBookmarked } = useBookmarks();
  const topicsRef = useRef<HTMLDivElement>(null);

  const handleTrade = (market: Market, side: 'yes' | 'no', outcome?: string) => {
    setTradingState({ market, side, outcome });
  };

  const closeTradingModal = () => {
    setTradingState({ market: null, side: 'yes' });
  };

  const scrollTopics = (direction: 'left' | 'right') => {
    if (topicsRef.current) {
      const scrollAmount = 200;
      topicsRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const filteredMarkets = allMarkets.filter((market) => {
    // Bookmarks filter
    if (showBookmarksOnly && !isBookmarked(market.id)) return false;
    
    // Hide toggles
    if (hideSports && (market.category.includes('Sports') || market.category.includes('Match') || market.category.includes('Series') || market.category.includes('Player'))) return false;
    if (hideCrypto && market.category.toLowerCase().includes('crypto')) return false;
    
    // Category filter
    const isPolitical = politicalCategories.includes(market.category);
    const matchesCategory = 
      activeCategory === 'trending' ||
      (activeCategory === 'politics' && isPolitical) ||
      (activeCategory === 'sports' && (market.category.includes('Sports') || market.category.includes('Match') || market.category.includes('Series') || market.category.includes('Cricket') || market.category.includes('Football'))) ||
      (activeCategory === 'cricket' && market.category.includes('Cricket')) ||
      (activeCategory === 'football' && market.category.includes('Football')) ||
      (activeCategory === 'crypto' && market.category.toLowerCase().includes('crypto')) ||
      (activeCategory === 'stocks' && (market.category.includes('Stock') || market.category.includes('Finance') || market.category.includes('Economic'))) ||
      (activeCategory === 'viral' && market.trending) ||
      (activeCategory === 'tech' && market.category.includes('Tech')) ||
      (activeCategory === 'finance' && (market.category.includes('Economic') || market.category.includes('Finance'))) ||
      (activeCategory === 'world' && market.category.includes('World')) ||
      (activeCategory === 'breaking' && market.isLive);
    
    // Topic filter
    const matchesTopic = 
      activeTopic === 'All' ||
      market.title.toLowerCase().includes(activeTopic.toLowerCase()) ||
      market.category.toLowerCase().includes(activeTopic.toLowerCase());
    
    // Search filter
    const matchesSearch = 
      market.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      market.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesTopic && matchesSearch;
  }).sort((a, b) => {
    switch (sortBy) {
      case '24h_volume':
        return b.volume - a.volume;
      case 'liquidity':
        return b.liquidity - a.liquidity;
      case 'newest':
        return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
      case 'ending_soon':
        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      default:
        return 0;
    }
  });

  const multiOutcome = filteredMarkets.filter(m => m.outcomes && m.outcomes.length > 0);
  const binaryMarkets = filteredMarkets.filter(m => !m.outcomes || m.outcomes.length === 0);

  return (
    <section id="markets" className="py-8">
      <div className="container mx-auto px-4">
        {/* Main Category Nav */}
        <div className="flex items-center gap-4 mb-6 border-b border-border/50 pb-4 overflow-x-auto">
          {mainCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-1 py-2 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-[17px] ${
                activeCategory === cat.id
                  ? 'text-foreground border-primary'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              <cat.icon className="w-4 h-4" />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Trending Topics Scroll */}
        <div className="relative mb-6">
          <button 
            onClick={() => scrollTopics('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-background/80 rounded-full shadow-md hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div 
            ref={topicsRef}
            className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-8 py-1"
          >
            {trendingTopics.map((topic) => (
              <button
                key={topic}
                onClick={() => setActiveTopic(topic)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-all ${
                  activeTopic === topic
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
          
          <button 
            onClick={() => scrollTopics('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-background/80 rounded-full shadow-md hover:bg-secondary transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Controls Row */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-lg bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-9 px-3 rounded-lg bg-secondary border border-border text-sm font-medium focus:outline-none focus:border-primary"
            >
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* View Mode */}
          <div className="flex items-center bg-secondary rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 h-9 px-3 rounded-lg border transition-colors ${
              showFilters ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-sm">Filters</span>
          </button>

          {/* Bookmarks */}
          <button
            onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
            className={`flex items-center gap-1.5 h-9 px-3 rounded-lg border transition-colors ${
              showBookmarksOnly ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${showBookmarksOnly ? 'fill-current' : ''}`} />
            <span className="text-sm hidden sm:inline">{bookmarks.size}</span>
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-secondary/50 rounded-lg border border-border/50"
          >
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={hideSports}
                onChange={(e) => setHideSports(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-muted-foreground">Hide sports?</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={hideCrypto}
                onChange={(e) => setHideCrypto(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-muted-foreground">Hide crypto?</span>
            </label>
            <div className="flex-1" />
            <button
              onClick={() => {
                setHideSports(false);
                setHideCrypto(false);
                setActiveTopic('All');
                setSearchQuery('');
              }}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear all
            </button>
          </motion.div>
        )}

        {/* Market Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {/* Multi-outcome markets first */}
            {multiOutcome.map((market, index) => (
              <MultiOutcomeCard
                key={market.id}
                market={market}
                index={index}
                onSelect={onSelectMarket}
                isBookmarked={isBookmarked(market.id)}
                onToggleBookmark={toggleBookmark}
              />
            ))}
            {/* Binary markets */}
            {binaryMarkets.map((market, index) => (
              <MarketCard
                key={market.id}
                market={market}
                index={multiOutcome.length + index}
                onSelect={onSelectMarket}
                isBookmarked={isBookmarked(market.id)}
                onToggleBookmark={toggleBookmark}
                onTrade={handleTrade}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMarkets.map((market, index) => (
              <MarketListItem
                key={market.id}
                market={market}
                index={index}
                onSelect={onSelectMarket}
                isBookmarked={isBookmarked(market.id)}
                onToggleBookmark={toggleBookmark}
                onTrade={handleTrade}
              />
            ))}
          </div>
        )}

        {filteredMarkets.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">No markets found</p>
            <button
              onClick={() => {
                setActiveTopic('All');
                setSearchQuery('');
                setShowBookmarksOnly(false);
              }}
              className="text-sm text-primary hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Results count */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Showing {filteredMarkets.length} markets
        </div>
      </div>

      {/* Inline Trading Modal */}
      <InlineTradingModal
        market={tradingState.market}
        outcome={tradingState.outcome}
        initialSide={tradingState.side}
        onClose={closeTradingModal}
      />
    </section>
  );
}
