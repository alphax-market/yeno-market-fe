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
import { ashesMarkets, politicalMarkets } from "@/data/markets";
import { multiOutcomeMarkets } from "@/data/multiOutcomeMarkets";
import { useBookmarks } from "@/hooks/useBookmarks";
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
  
  const market = allMarkets.find(m => m.id === id);
  
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
                    {market.trending && (
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
                  {/* Logo/Thumbnail */}
                  {market.imageUrl ? (
                    <img 
                      src={market.imageUrl} 
                      alt={market.title}
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center text-2xl shrink-0">
                      {getCategoryThumbnail(market.category)}
                    </div>
                  )}
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
                                  Yes {percentage}¢
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
                                  No {100 - percentage}¢
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
                          {market.change24h && (
                            <div className={`text-xs flex items-center justify-end gap-0.5 ${
                              market.change24h >= 0 ? "text-success" : "text-destructive"
                            }`}>
                              {market.change24h >= 0 ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              {Math.abs(market.change24h).toFixed(1)}%
                            </div>
                          )}
                        </div>
                        <div className="col-span-3 flex justify-end">
                          <Button 
                            size="sm" 
                            className="bg-success hover:bg-success/90 text-success-foreground text-xs px-4"
                            onClick={() => setTradingPanel({ side: 'yes' })}
                          >
                            Buy Yes {Math.round(market.yesPrice * 100)}¢
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
                          {market.change24h && (
                            <div className={`text-xs flex items-center justify-end gap-0.5 ${
                              market.change24h < 0 ? "text-success" : "text-destructive"
                            }`}>
                              {market.change24h < 0 ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              {Math.abs(market.change24h).toFixed(1)}%
                            </div>
                          )}
                        </div>
                        <div className="col-span-3 flex justify-end">
                          <Button 
                            size="sm" 
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs px-4"
                            onClick={() => setTradingPanel({ side: 'no' })}
                          >
                            Buy No {Math.round(market.noPrice * 100)}¢
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

                {/* Stats Row - Only Liquidity and End Date */}
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
                      <span className="text-xs">End Date</span>
                    </div>
                    <p className="font-semibold">{formatDate(market.endDate)}</p>
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
                
                {/* Activity & Top Holders Tabs */}
                <div className="bg-card rounded-xl border border-border p-4">
                  <Tabs defaultValue="activity" className="w-full">
                    <TabsList className="w-full grid grid-cols-2 bg-secondary/50 border border-border">
                      <TabsTrigger value="activity">Activity</TabsTrigger>
                      <TabsTrigger value="holders">Top Holders</TabsTrigger>
                    </TabsList>
                    <TabsContent value="activity" className="mt-4 space-y-3">
                      {/* Mock Activity Items */}
                      {[
                        { user: "0x7a3...4f2", action: "Bought Yes", amount: "$250", time: "2m ago" },
                        { user: "0x9c1...8e3", action: "Sold No", amount: "$180", time: "5m ago" },
                        { user: "0x2b4...7d1", action: "Bought Yes", amount: "$520", time: "12m ago" },
                        { user: "0x5e8...2a9", action: "Bought No", amount: "$90", time: "18m ago" },
                        { user: "0x1f6...3c5", action: "Sold Yes", amount: "$340", time: "25m ago" },
                      ].map((activity, index) => (
                        <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                              {activity.user.slice(2, 4)}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{activity.user}</p>
                              <p className={`text-xs ${activity.action.includes('Yes') ? 'text-success' : 'text-destructive'}`}>
                                {activity.action}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{activity.amount}</p>
                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </TabsContent>
                    <TabsContent value="holders" className="mt-4 space-y-3">
                      {/* Mock Top Holders */}
                      {[
                        { user: "0x4d2...9a1", position: "Yes", shares: "12,450", value: "$6,225" },
                        { user: "0x8f7...1b3", position: "No", shares: "8,920", value: "$4,460" },
                        { user: "0x3c5...6e8", position: "Yes", shares: "7,350", value: "$3,675" },
                        { user: "0x1a9...4d2", position: "Yes", shares: "5,200", value: "$2,600" },
                        { user: "0x6b3...8f1", position: "No", shares: "4,100", value: "$2,050" },
                      ].map((holder, index) => (
                        <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-primary-foreground">
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{holder.user}</p>
                              <p className={`text-xs ${holder.position === 'Yes' ? 'text-success' : 'text-destructive'}`}>
                                {holder.shares} {holder.position}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{holder.value}</p>
                          </div>
                        </div>
                      ))}
                    </TabsContent>
                  </Tabs>
                </div>
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
