import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Share2, Bookmark, ExternalLink, Clock, Users, TrendingUp, AlertCircle, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TradingWidget } from "@/components/market/TradingWidget";
import { PriceChart } from "@/components/market/PriceChart";
import { OrderBook } from "@/components/market/OrderBook";
import { Comments } from "@/components/market/Comments";
import { ResolutionInfo } from "@/components/market/ResolutionInfo";
import { RelevantSources } from "@/components/market/RelevantSources";
import { ashesMarkets, politicalMarkets } from "@/data/markets";
import { formatPrice } from "@/lib/utils";
import { multiOutcomeMarkets } from "@/data/multiOutcomeMarkets";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useMarket, useMarketTrades, useMarketPositions } from "@/hooks/useMarkets";
import { InlineTradingPanel } from "@/components/InlineTradingPanel";
import { AnimatePresence } from "framer-motion";

const allMarkets = [...ashesMarkets, ...politicalMarkets, ...multiOutcomeMarkets];

// Mock change data for outcomes
function getOutcomeChange(): { value: number; isPositive: boolean } {
  const change = (Math.random() - 0.4) * 10;
  return { value: Math.abs(change), isPositive: change >= 0 };
}

function formatVolume(volume: number): string {
  if (volume >= 1000000) {
    return `$${(volume / 1000000).toFixed(1)}M`;
  }
  return `$${(volume / 1000).toFixed(0)}K`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getEndDateCountdown(endDate: string): { text: string; progressPct: number } {
  const end = new Date(endDate).getTime();
  const now = Date.now();
  const total = end - now;
  if (total <= 0) return { text: "Ended", progressPct: 100 };
  const days = Math.floor(total / (24 * 60 * 60 * 1000));
  const hours = Math.floor((total % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const text = days > 0 ? `${days}d ${hours}h left` : `${hours}h left`;
  // Progress: assume market started 30 days ago for display
  const assumedStart = end - 30 * 24 * 60 * 60 * 1000;
  const elapsed = now - assumedStart;
  const totalRange = end - assumedStart;
  const progressPct = Math.min(100, Math.max(0, (elapsed / totalRange) * 100));
  return { text, progressPct };
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

export default function MarketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toggleBookmark, isBookmarked: checkIsBookmarked } = useBookmarks();
  const [selectedOutcomeIndex, setSelectedOutcomeIndex] = useState<number | null>(null);
  const [tradingPanel, setTradingPanel] = useState<{ side: 'yes' | 'no'; outcome?: string } | null>(null);
  
  // Fetch market data from API
  const { data: apiMarket, isLoading, error } = useMarket(id || '');
  const isApiMarket = id ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) : false;
  const { data: tradesData } = useMarketTrades(id || '');
  const { data: positionsData } = useMarketPositions(id || '');
  const recentTrades = (tradesData?.pages?.[0]?.trades ?? []) as Array<{
    id: string;
    side: string;
    outcome: string;
    shares: number;
    price: number;
    totalAmount: number;
    createdAt: string;
    user?: { displayName?: string; id: string };
  }>;
  const topHolders = (positionsData ?? []) as Array<{
    id: string;
    outcome: string;
    shares: number;
    totalInvested: number;
    user?: { displayName?: string; walletAddress?: string };
  }>;

  // Fallback to mock data if API fails or while loading (optimistic)
  const mockMarket = allMarkets.find(m => m.id === id);
  
  // Normalize API market to match component expectations
  const market = apiMarket ? {
    ...apiMarket,
    description: apiMarket.description || '',
    image: apiMarket.imageUrl || '/placeholder.svg',
    outcomes: apiMarket.outcomes || [],
  } : mockMarket;
  
  if (isLoading && !market) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 container mx-auto px-4 flex justify-center py-20">
          <div className="animate-pulse">Loading market...</div>
        </main>
      </div>
    );
  }
  
  if (!market) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 container mx-auto px-4">
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Market Not Found</h1>
            <p className="text-muted-foreground mb-6">The market you're looking for doesn't exist.</p>
            <Button onClick={() => navigate("/")}>Back to Markets</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isBookmarked = checkIsBookmarked(market.id);
  const hasMultipleOutcomes = market.outcomes && market.outcomes.length > 2;
  
  // Generate mock change data for each outcome
  const outcomeChanges = hasMultipleOutcomes 
    ? market.outcomes!.map(() => getOutcomeChange())
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <div className="container mx-auto px-4 py-6">
          {/* Back button */}
          <button 
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Markets</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Market Header */}
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary">{market.category}</Badge>
                    {market.isLive && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        LIVE
                      </Badge>
                    )}
                    {(market as any).trending && (
                      <Badge className="bg-accent/20 text-accent border-accent/30">Trending</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => toggleBookmark(market.id)}
                    >
                      <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-primary text-primary' : ''}`} />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Share2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>


                <div className="flex items-start gap-3 mb-3">
                  {/* Logo/Thumbnail - always show image (API imageUrl or placeholder) */}
                  <img
                    src={market.imageUrl || `https://picsum.photos/seed/${encodeURIComponent(market.category + market.id)}/96/96`}
                    alt={market.title}
                    className="w-12 h-12 rounded-lg object-cover shrink-0"
                  />
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    {market.title}
                  </h1>
                </div>
                <p className="text-muted-foreground mb-4">{market.description}</p>

                {/* Price Chart - Below Question */}
                <div className="mb-6">
                  <PriceChart market={market} />
                </div>

                {/* Outcomes Display */}
                {hasMultipleOutcomes ? (
                  /* Multi-Outcome Display - Polymarket Style */
                  <div className="mb-6">
                    {/* Header Row */}
                    <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs text-muted-foreground font-medium border-b border-border mb-2">
                      <div className="col-span-5">Outcome</div>
                      <div className="col-span-2 text-right">Volume</div>
                      <div className="col-span-2 text-right">Chance</div>
                      <div className="col-span-3"></div>
                    </div>
                    
                    {/* Outcome Rows */}
                    <div className="space-y-2">
                      {market.outcomes!.map((outcome, index) => {
                        const percentage = Math.round(outcome.price * 100);
                        const change = outcomeChanges[index];
                        const outcomeVolume = Math.round(market.volume * outcome.price * 0.3);
                        const isSelected = selectedOutcomeIndex === index;
                        
                        return (
                          <div key={outcome.name}>
                            <button 
                              onClick={() => setSelectedOutcomeIndex(isSelected ? null : index)}
                              className={`w-full grid grid-cols-12 gap-4 items-center rounded-lg p-4 transition-colors ${
                                isSelected 
                                  ? "bg-primary/10 border-2 border-primary" 
                                  : "bg-secondary/50 hover:bg-secondary border-2 border-transparent"
                              }`}
                            >
                              <div className="col-span-5 flex items-center gap-3 min-w-0">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                  isSelected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                                }`}>
                                  {index + 1}
                                </div>
                                <span className="font-medium truncate text-left">{outcome.name}</span>
                              </div>
                              <div className="col-span-2 text-right">
                                <span className="text-sm text-muted-foreground">
                                  ${outcomeVolume >= 1000000 
                                    ? `${(outcomeVolume / 1000000).toFixed(1)}M` 
                                    : `${(outcomeVolume / 1000).toFixed(0)}K`}
                                </span>
                              </div>
                              <div className="col-span-2 text-right">
                                <div className="text-lg font-bold text-foreground">{percentage}%</div>
                                <div className={`text-xs flex items-center justify-end gap-0.5 ${
                                  change.isPositive ? "text-success" : "text-destructive"
                                }`}>
                                  {change.isPositive ? (
                                    <TrendingUp className="w-3 h-3" />
                                  ) : (
                                    <TrendingDown className="w-3 h-3" />
                                  )}
                                  {change.value.toFixed(1)}%
                                </div>
                              </div>
                              <div className="col-span-3 flex gap-2 justify-end">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="border-success text-success hover:bg-success hover:text-success-foreground text-xs px-3"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTradingPanel({ side: 'yes', outcome: outcome.name });
                                  }}
                                >
                                  Yes {formatPrice(percentage / 100)}
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground text-xs px-3"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTradingPanel({ side: 'no', outcome: outcome.name });
                                  }}
                                >
                                  No {formatPrice((100 - percentage) / 100)}
                                </Button>
                              </div>
                            </button>
                            
                            {/* Order Book & Resolution Tabs - Show when outcome is selected with animation */}
                            <div 
                              className={`grid transition-all duration-300 ease-out ${
                                isSelected ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                              }`}
                            >
                              <div className="overflow-hidden">
                                <div className="mt-3 ml-4 border-l-2 border-primary pl-4">
                                  <Tabs defaultValue="orderbook" className="w-full">
                                    <TabsList className="w-full grid grid-cols-2 bg-secondary/50 border border-border h-9">
                                      <TabsTrigger value="orderbook" className="text-xs">Order Book</TabsTrigger>
                                      <TabsTrigger value="resolution" className="text-xs">Resolution</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="orderbook" className="mt-3 animate-fade-in">
                                      <OrderBook market={market} />
                                    </TabsContent>
                                    <TabsContent value="resolution" className="mt-3 animate-fade-in">
                                      <ResolutionInfo market={market} />
                                    </TabsContent>
                                  </Tabs>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Binary Market - Yes/No Display */
                  <div className="mb-6">
                    {/* Header Row */}
                    <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs text-muted-foreground font-medium border-b border-border mb-2">
                      <div className="col-span-5">Outcome</div>
                      <div className="col-span-2 text-right">Volume</div>
                      <div className="col-span-2 text-right">Chance</div>
                      <div className="col-span-3"></div>
                    </div>
                    
                    {/* Yes/No Rows */}
                    <div className="space-y-2">
                      {/* Yes Row */}
                      <div className="w-full grid grid-cols-12 gap-4 items-center rounded-lg p-4 bg-success/10 border-2 border-success/20 hover:border-success/40 transition-colors">
                        <div className="col-span-5 flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-success/20 text-success">
                            ✓
                          </div>
                          <span className="font-medium text-left">Yes</span>
                        </div>
                        <div className="col-span-2 text-right">
                          <span className="text-sm text-muted-foreground">
                            {formatVolume(Math.round(market.volume * market.yesPrice))}
                          </span>
                        </div>
                        <div className="col-span-2 text-right">
                          <div className="text-lg font-bold text-success">{Math.round(market.yesPrice * 100)}%</div>
                          {(market as any).change24h && (
                            <div className={`text-xs flex items-center justify-end gap-0.5 ${
                              (market as any).change24h >= 0 ? "text-success" : "text-destructive"
                            }`}>
                              {(market as any).change24h >= 0 ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              {Math.abs((market as any).change24h).toFixed(1)}%
                            </div>
                          )}
                        </div>
                        <div className="col-span-3 flex justify-end">
                          <Button 
                            size="sm" 
                            className="bg-success hover:bg-success/90 text-success-foreground text-xs px-4"
                            onClick={() => setTradingPanel({ side: 'yes' })}
                          >
                            Buy Yes {formatPrice(market.yesPrice)}
                          </Button>
                        </div>
                      </div>

                      {/* No Row */}
                      <div className="w-full grid grid-cols-12 gap-4 items-center rounded-lg p-4 bg-destructive/10 border-2 border-destructive/20 hover:border-destructive/40 transition-colors">
                        <div className="col-span-5 flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-destructive/20 text-destructive">
                            ✗
                          </div>
                          <span className="font-medium text-left">No</span>
                        </div>
                        <div className="col-span-2 text-right">
                          <span className="text-sm text-muted-foreground">
                            {formatVolume(Math.round(market.volume * market.noPrice))}
                          </span>
                        </div>
                        <div className="col-span-2 text-right">
                          <div className="text-lg font-bold text-destructive">{Math.round(market.noPrice * 100)}%</div>
                          {(market as any).change24h && (
                            <div className={`text-xs flex items-center justify-end gap-0.5 ${
                              (market as any).change24h < 0 ? "text-success" : "text-destructive"
                            }`}>
                              {(market as any).change24h < 0 ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              {Math.abs((market as any).change24h).toFixed(1)}%
                            </div>
                          )}
                        </div>
                        <div className="col-span-3 flex justify-end">
                          <Button 
                            size="sm" 
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs px-4"
                            onClick={() => setTradingPanel({ side: 'no' })}
                          >
                            Buy No {formatPrice(market.noPrice)}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Order Book & Resolution Tabs */}
                    <div className="mt-6">
                      <Tabs defaultValue="orderbook" className="w-full">
                        <TabsList className="w-full grid grid-cols-2 bg-secondary/50 border border-border">
                          <TabsTrigger value="orderbook">Order Book</TabsTrigger>
                          <TabsTrigger value="resolution">Resolution</TabsTrigger>
                        </TabsList>
                        <TabsContent value="orderbook" className="mt-4">
                          <OrderBook market={market} />
                        </TabsContent>
                        <TabsContent value="resolution" className="mt-4">
                          <ResolutionInfo market={market} />
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>
                )}

                {/* Stats Row - Liquidity and End Date countdown */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-xs">Liquidity</span>
                    </div>
                    <p className="font-semibold">{formatVolume(market.liquidity)}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs">Time left</span>
                    </div>
                    <p className="font-semibold">{getEndDateCountdown(market.endDate).text}</p>
                    <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary/70 rounded-full transition-all"
                        style={{ width: `${getEndDateCountdown(market.endDate).progressPct}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(market.endDate)}</p>
                  </div>
                </div>
              </div>

              {/* Comments Section - Separate from outcome tabs */}
              <div className="bg-card rounded-xl border border-border">
                <Comments marketId={market.id} />
              </div>
            </div>

            {/* Trading Widget Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <div className="sticky top-24 space-y-6">
                <TradingWidget 
                  market={market} 
                  selectedOutcomeIndex={selectedOutcomeIndex}
                  onOutcomeChange={setSelectedOutcomeIndex}
                />
                
                {/* Activity & Top Holders — real data for API markets, empty state for new/fresh markets */}
                <div className="bg-card rounded-xl border border-border p-4">
                  <Tabs defaultValue="activity" className="w-full">
                    <TabsList className="w-full grid grid-cols-2 bg-secondary/50 border border-border">
                      <TabsTrigger value="activity">Activity</TabsTrigger>
                      <TabsTrigger value="holders">Top Holders</TabsTrigger>
                    </TabsList>
                    <TabsContent value="activity" className="mt-4 space-y-3">
                      {!isApiMarket || recentTrades.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2">No activity yet.</p>
                      ) : (
                        recentTrades.slice(0, 10).map((trade) => {
                          const action = `${trade.side === 'BUY' ? 'Bought' : 'Sold'} ${trade.outcome}`;
                          const uid = (trade.user as { id?: string })?.id ?? '—';
                          const short = uid.length > 10 ? `${uid.slice(0, 6)}...${uid.slice(-4)}` : uid;
                          const time = new Date(trade.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                          return (
                            <div key={trade.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                                  {short.slice(0, 2)}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{trade.user?.displayName || short}</p>
                                  <p className={`text-xs ${trade.outcome === 'YES' ? 'text-success' : 'text-destructive'}`}>
                                    {action}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">${Number(trade.totalAmount).toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground">{time}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </TabsContent>
                    <TabsContent value="holders" className="mt-4 space-y-3">
                      {!isApiMarket || topHolders.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2">No holders yet.</p>
                      ) : (
                        topHolders.slice(0, 10).map((holder, index) => {
                          const addr = holder.user?.walletAddress ?? holder.user?.id ?? '—';
                          const short = addr.length > 10 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;
                          return (
                            <div key={holder.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-primary-foreground">
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{holder.user?.displayName || short}</p>
                                  <p className={`text-xs ${holder.outcome === 'YES' ? 'text-success' : 'text-destructive'}`}>
                                    {holder.shares.toLocaleString()} {holder.outcome}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">${Number(holder.totalInvested).toFixed(2)}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Relevant sources / headlines / scores */}
                <RelevantSources market={market} />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Trading Panel Modal */}
      <AnimatePresence>
        {tradingPanel && market && (
          <InlineTradingPanel
            market={market}
            initialSide={tradingPanel.side}
            outcome={tradingPanel.outcome}
            onClose={() => setTradingPanel(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
