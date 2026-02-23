import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Share2, Bookmark, ExternalLink, AlertCircle, TrendingDown, X, Info, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TradingWidget } from "@/components/market/TradingWidget";
import { PriceChart } from "@/components/market/PriceChart";
import { OrderBook } from "@/components/market/OrderBook";
import { AboutEventMarket } from "@/components/market/AboutEventMarket";
import { Comments } from "@/components/market/Comments";
import { ResolutionInfo } from "@/components/market/ResolutionInfo";
import { RelevantSources } from "@/components/market/RelevantSources";
import { SimilarEventsWidget } from "@/components/market/SimilarEventsWidget";
import { ashesMarkets, politicalMarkets } from "@/data/markets";
import { formatPrice } from "@/lib/utils";
import { multiOutcomeMarkets } from "@/data/multiOutcomeMarkets";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useMarket, useMarketTrades, useMarketPositions } from "@/hooks/useMarkets";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWallet } from "@/contexts/WalletContext";
import { useMarketSubscription } from "@/hooks/useWebSocket";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Drawer, DrawerContent, DrawerHeader } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { TradeSuccessModal } from "@/components/TradeSuccessModal";
import { usePrivy } from "@privy-io/react-auth";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import YenoLogo from "@/assets/svg/yeno-logo-header.svg?react";
import BackgroundImage from "@/assets/png/Section.png";

const allMarkets = [...ashesMarkets, ...politicalMarkets, ...multiOutcomeMarkets];

// Mock change data for outcomes
function getOutcomeChange(): { value: number; isPositive: boolean } {
  const change = (Math.random() - 0.4) * 10;
  return { value: Math.abs(change), isPositive: change >= 0 };
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
  const [drawerAmount, setDrawerAmount] = useState(10);
  const [drawerOrderType, setDrawerOrderType] = useState<'limit' | 'market'>('limit');
  const [drawerSide, setDrawerSide] = useState<'yes' | 'no'>('yes');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const queryClient = useQueryClient();
  const { isDevUser, balance, isConnected, user, retrySyncWithBackend } = useWallet();
  const { ready, authenticated, login } = usePrivy();
  const [simulating, setSimulating] = useState(false);
  const [simulatingBulk, setSimulatingBulk] = useState(false);
  const [showStickyNav, setShowStickyNav] = useState(false);
  const [activeStickyLabel, setActiveStickyLabel] = useState("Price chart");

  const priceChartRef = useRef<HTMLDivElement>(null);
  const orderbookRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const commentsRef = useRef<HTMLDivElement>(null);
  const isDesktop = !useIsMobile();

  useEffect(() => {
    if (tradingPanel) setDrawerSide(tradingPanel.side);
  }, [tradingPanel]);

  useEffect(() => {
    const onScroll = () => setShowStickyNav(window.scrollY > 120);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>, label: string) => {
    setActiveStickyLabel(label);
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const { data: apiMarket, isLoading, error } = useMarket(id || '');
  const { data: tradesData } = useMarketTrades(id || '');
  const { data: positionsData } = useMarketPositions(id || '');
  
  const onWsUpdate = useCallback((data?: unknown) => {
    if (!id) return;
    const payload = data as {
      type?: string;
      yesPrice?: number;
      noPrice?: number;
      volume?: number;
      liquidity?: number;
      trade?: { id: string; side: string; outcome: string; shares: number; price: number; totalAmount: number; createdAt: string; user?: { id: string; displayName?: string } };
    } | undefined;

    if (payload?.type === 'PRICE_UPDATE') {
      const hasPrices = typeof payload.yesPrice === 'number' && typeof payload.noPrice === 'number';
      const hasLiquidity = typeof payload.liquidity === 'number';
      if (hasPrices || hasLiquidity) {
        queryClient.setQueryData(['market', id], (prev: unknown) => {
          if (prev && typeof prev === 'object') {
            const p = prev as Record<string, unknown>;
            const next: Record<string, unknown> = { ...p };
            if (hasPrices) {
              next.yesPrice = payload.yesPrice;
              next.noPrice = payload.noPrice;
              if (typeof payload.volume === 'number') next.volume = payload.volume;
            }
            if (hasLiquidity) next.liquidity = payload.liquidity;
            return next;
          }
          return prev;
        });
      }
      if (hasPrices) queryClient.invalidateQueries({ queryKey: ['market', id, 'chart'] });
    }

    if (payload?.type === 'NEW_TRADE' && payload.trade) {
      const trade = payload.trade;
      queryClient.setQueryData(['market', id], (prev: unknown) => {
        if (prev && typeof prev === 'object' && '_count' in prev) {
          const p = prev as { _count?: { trades?: number } };
          return { ...prev, _count: p._count ? { ...p._count, trades: (p._count.trades ?? 0) + 1 } : { trades: 1, comments: 0, positions: 0 } };
        }
        return prev;
      });
      queryClient.setQueryData(['market', id, 'trades'], (old: { pages: Array<{ trades: unknown[] }> } | undefined) => {
        if (!old?.pages?.length) return old;
        const first = old.pages[0];
        const trades = first?.trades ?? [];
        if (trades.some((t: { id?: string }) => t.id === trade.id)) return old;
        return {
          ...old,
          pages: [{ ...first, trades: [trade, ...trades] }, ...old.pages.slice(1)],
        };
      });
      queryClient.invalidateQueries({ queryKey: ['market', id, 'positions'] });
      queryClient.invalidateQueries({ queryKey: ['market', id, 'chart'] });
    }

    if (payload?.type === 'NEW_ORDER' || payload?.type === 'ORDER_CANCELLED') {
      queryClient.invalidateQueries({ queryKey: ['trades', 'orderbook', id] });
    }

    if (payload?.type === 'COMMENT_ADDED' || payload?.type === 'COMMENT_DELETED') {
      queryClient.invalidateQueries({ queryKey: ['comments', id] });
    }

    // Refetch for unknown event types or as confirmation
    if (payload?.type && !['PRICE_UPDATE', 'NEW_TRADE', 'NEW_ORDER', 'ORDER_CANCELLED', 'COMMENT_ADDED', 'COMMENT_DELETED'].includes(payload.type)) {
      queryClient.invalidateQueries({ queryKey: ['market', id] });
      queryClient.invalidateQueries({ queryKey: ['market', id, 'trades'] });
      queryClient.invalidateQueries({ queryKey: ['market', id, 'positions'] });
      queryClient.invalidateQueries({ queryKey: ['market', id, 'chart'] });
      queryClient.invalidateQueries({ queryKey: ['trades', 'orderbook', id] });
    }
  }, [id, queryClient]);
  const isApiMarket = id ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) : false;
  useMarketSubscription(isApiMarket && id ? id : null, onWsUpdate);

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

  const drawerPrice = market ? (drawerSide === 'yes' ? Number(market.yesPrice ?? 0) : Number(market.noPrice ?? 0)) : 0;
  const drawerShares = drawerPrice > 0 ? drawerAmount / drawerPrice : 0;
  const drawerPotentialReturn = drawerShares * 1;

  const handleDrawerBuyClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!market) return;
    if (!isConnected) {
      if (ready && !authenticated) {
        try {
          await login();
        } catch (error) {
          console.error("Failed to connect:", error);
        }
      }
      return;
    }

    const marketId = market.id;
    const isValidUUID = marketId ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(marketId)) : false;
    const isBinaryOutcome = true;
    let token = apiClient.getToken();
    if (isValidUUID && isConnected && user?.id && !token && !isDevUser) {
      const ok = await retrySyncWithBackend();
      if (ok) token = apiClient.getToken();
    }
    const useBackendApi = isValidUUID && isBinaryOutcome && !!token;

    if (useBackendApi) {
      try {
        const outcomeApi = drawerSide === "yes" ? "YES" : "NO";
        if (drawerOrderType === "limit") {
          await apiClient.placeOrder({
            marketId: marketId as string,
            side: "BUY",
            outcome: outcomeApi,
            shares: Number(drawerShares),
            price: Number(drawerPrice),
            expiresAt: undefined,
          });
          toast.success("Limit order placed successfully!");
        } else {
          await apiClient.executeTrade({
            marketId: marketId as string,
            side: "BUY",
            outcome: outcomeApi,
            shares: Number(drawerShares),
          });
          toast.success("Trade executed successfully!");
        }
        setTradingPanel(null);
        setShowSuccessModal(true);
      } catch (err) {
        console.error("Trade execution failed:", err);
        toast.error(err instanceof Error ? err.message : "Failed to execute trade");
      }
      return;
    }

    if (isValidUUID && !apiClient.getToken()) {
      toast.error(
        isConnected
          ? "Trading backend unavailable. Please refresh and try again."
          : "Connect your wallet so we can sync with the trading backend."
      );
      return;
    }

    toast.error(
      isConnected
        ? "This market is not available for trading. Open a tradable market from the homepage."
        : "Connect your wallet, then open a tradable market from the homepage to trade."
    );
  };

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
            <Button onClick={() => navigate("/")}>Markets</Button>
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

  const stickyNavItems = [
    { label: "Price chart", ref: priceChartRef },
    { label: "Order book", ref: orderbookRef },
    { label: "About", ref: aboutRef },
    { label: "Comments", ref: commentsRef },
  ];

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = market?.title ?? "";
    const shareData = { title, url, text: title };
    if (typeof navigator !== "undefined" && navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          toast.error("Share failed");
        }
      }
    } else {
      if (url) {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Sticky top nav - appears on scroll, anchor links to sections */}
      <AnimatePresence>
        {showStickyNav && (
          <motion.nav
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed top-0 left-0 right-0 z-40 bg-background"
          >
            <div className="max-w-2xl mx-auto bg-secondary border border-border p-2 shadow-sm">
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
                {stickyNavItems.map((item) => {
                  const isActive = activeStickyLabel === item.label;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => scrollToSection(item.ref, item.label)}
                      className={`shrink-0 px-4 py-2 rounded-lg text-md font-medium transition-colors ${
                        isActive
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      <main className="bg-secondary">
        <div className="container mx-auto px-3 py-6">
          {/* Back button */}
          <button 
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Markets</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Market Header */}
              <div className="rounded-xl px-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center rounded-full border-0 px-3 py-1 text-xs font-medium bg-zinc-700 text-zinc-100 dark:bg-zinc-600 dark:text-zinc-100">
                      {market.category}
                    </span>
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
                  <div className="flex items-center gap-4">
                   
                      <Bookmark className={`w-6 h-6 ${isBookmarked ? 'fill-primary text-primary' : ''}`}     onClick={() => toggleBookmark(market.id)}/>
                    <button
                      type="button"
                      onClick={handleShare}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Share"
                    >
                      <Share2 className="w-6 h-6" />
                    </button>
                  </div>
                </div>


                <div className="flex items-center gap-3">
                  {/* Logo/Thumbnail - always show image (API imageUrl or placeholder) */}
                  <img
                    src={market.imageUrl || `https://picsum.photos/seed/${encodeURIComponent(market.category + market.id)}/96/96`}
                    alt={market.title}
                    className="w-12 h-full rounded-lg object-cover shrink-0"
                  />
                  <h1 className="text-2xl md:text-3xl font-bold text-primary">
                    {market.title}
                  </h1>
                </div>
                <p className="pt-2 text-sm font-medium text-muted-foreground mb-4">{market.description} <span className="text-xs font-semibold text-success"> Read More</span></p>

                {/* Price Chart - Below Question */}
                <div id="section-price-chart" ref={priceChartRef} className="mb-6 scroll-mt-24">
                  <PriceChart market={market} />
                </div>

                {/* Outcomes Display */}
                {hasMultipleOutcomes ? (
                  /* Multi-Outcome Display - Polymarket Style */
                  <div className="mb-6">
                    {/* Header Row */}
                  
                  </div>
                ) : (
                  /* Binary Market - Yes/No Display */
                  <div className="mb-6">
                    {/* Header Row */}
                  

                    {/* Order Book & Resolution Tabs */}
                    <div id="section-orderbook" ref={orderbookRef} className="mt-6 scroll-mt-24">
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

                {/* About the event */}
                <div id="section-about" ref={aboutRef} className="scroll-mt-24 pt-4 border-t border-border">
                  <AboutEventMarket market={market} />
                </div>

                {/* Simulate buttons - dev users only */}
                {isDevUser && isApiMarket && (
                  <div className="pt-4 border-t border-border flex flex-wrap gap-2">
                    <button
                      onClick={async () => {
                        if (!id || simulating) return;
                        setSimulating(true);
                        try {
                          await apiClient.simulateTrades(id, 5);
                          queryClient.invalidateQueries({ queryKey: ['market', id] });
                          queryClient.invalidateQueries({ queryKey: ['market', id, 'trades'] });
                          queryClient.invalidateQueries({ queryKey: ['market', id, 'positions'] });
                          queryClient.invalidateQueries({ queryKey: ['market', id, 'chart'] });
                          queryClient.invalidateQueries({ queryKey: ['trades', 'orderbook', id] });
                          queryClient.invalidateQueries({ queryKey: ['markets'] });
                        } catch (e) {
                          console.error('Simulate failed:', e);
                        } finally {
                          setSimulating(false);
                        }
                      }}
                      disabled={simulating || simulatingBulk}
                      className="text-sm px-4 py-2 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/30 transition-colors disabled:opacity-50"
                    >
                      {simulating ? 'Simulating…' : 'Simulate 5 Trades'}
                    </button>
                    <button
                      onClick={async () => {
                        if (!id || simulatingBulk) return;
                        setSimulatingBulk(true);
                        try {
                          await apiClient.simulateBulkTrades(id, 3, 4);
                          queryClient.invalidateQueries({ queryKey: ['market', id] });
                          queryClient.invalidateQueries({ queryKey: ['market', id, 'trades'] });
                          queryClient.invalidateQueries({ queryKey: ['market', id, 'positions'] });
                          queryClient.invalidateQueries({ queryKey: ['market', id, 'chart'] });
                          queryClient.invalidateQueries({ queryKey: ['trades', 'orderbook', id] });
                          queryClient.invalidateQueries({ queryKey: ['markets'] });
                        } catch (e) {
                          console.error('Simulate bulk failed:', e);
                        } finally {
                          setSimulatingBulk(false);
                        }
                      }}
                      disabled={simulating || simulatingBulk}
                      className="text-sm px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                    >
                      {simulatingBulk ? 'Simulating…' : 'Simulate Multi-Trader (12 trades)'}
                    </button>
                  </div>
                )}
              </div>

            
            </div>

            {/* Trading Widget Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <div className="sticky top-24 space-y-6">
                {isDesktop && <TradingWidget
                  market={market}
                  selectedOutcomeIndex={selectedOutcomeIndex}
                  onOutcomeChange={setSelectedOutcomeIndex}
                />}
                
                {/* Activity & Top Holders — real data for API markets, empty state for new/fresh markets */}
                <div id="section-comments" ref={commentsRef}   className="bg-card rounded-xl border border-border p-4">
                  <Tabs defaultValue="comments" className="w-full">
                    <TabsList className="w-full grid grid-cols-3 bg-secondary/50 border border-border">
                      <TabsTrigger value="comments">Comments</TabsTrigger>
                      <TabsTrigger value="activity">Activity</TabsTrigger>
                      <TabsTrigger value="holders">Top Holders</TabsTrigger>
               
                    </TabsList>
                    <TabsContent value="comments" className="mt-4 space-y-3">
                      <Comments marketId={market.id} />
                    </TabsContent>
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
        <SimilarEventsWidget />
      </main>
      <div className="relative rounded-3xl overflow-hidden pb-[120px] flex flex-col items-center ">
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

      {/* Sticky bottom Yes/No bar - mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-background border-t border-border p-3 safe-area-pb">
        <div className="flex gap-2 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => setTradingPanel({ side: "yes" })}
            className="flex-1 py-3 rounded-xl font-semibold text-primary-foreground bg-success hover:bg-success/90 transition-colors"
          >
            Yes {formatPrice(market.yesPrice)}
          </button>
          <button
            type="button"
            onClick={() => setTradingPanel({ side: "no" })}
            className="flex-1 py-3 rounded-xl font-semibold text-primary-foreground bg-destructive hover:bg-destructive/90 transition-colors"
          >
            No {formatPrice(market.noPrice)}
          </button>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-1.5">Balance: ${balance}</p>
      </div>

      {/* Trading Panel Modal */}
      {/* Trading drawer (same as MarketCard) - opened by sticky Yes/No */}
      <Drawer
        open={!!tradingPanel}
        onOpenChange={(open) => {
          if (!open) {
            setTradingPanel(null);
            setDrawerAmount(10);
          }
        }}
      >
        <DrawerContent className="rounded-t-2xl border-t max-h-[90vh] flex flex-col">
          <DrawerHeader className="p-0 px-4 pt-2 pb-2 flex flex-row items-center justify-center relative">
            <button
              type="button"
              onClick={() => {
                setTradingPanel(null);
                setDrawerAmount(10);
              }}
              className="absolute left-1/2 -translate-x-1/2 -top-16 p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </DrawerHeader>
          <div className="flex flex-col gap-4 px-4 pb-6 overflow-y-auto font-open-sauce-two text-[14px] leading-[20px]">
            <div className="flex rounded-lg overflow-hidden border border-border bg-muted/30 p-0.5">
              <button
                type="button"
                onClick={() => setDrawerSide("yes")}
                className={`flex-1 py-2.5 rounded-md font-medium transition-colors ${drawerSide === "yes" ? "bg-success text-primary-foreground" : "text-muted-foreground"}`}
              >
                Yes {formatPrice(Number(market.yesPrice))}
              </button>
              <button
                type="button"
                onClick={() => setDrawerSide("no")}
                className={`flex-1 py-2.5 rounded-md font-medium transition-colors ${drawerSide === "no" ? "bg-destructive text-primary-foreground" : "text-muted-foreground"}`}
              >
                No {formatPrice(Number(market.noPrice))}
              </button>
            </div>

            <div className="flex gap-3">
              <img
                src={(market as { imageUrl?: string; category?: string }).imageUrl || `https://picsum.photos/seed/${encodeURIComponent(((market as { category?: string }).category ?? "") + market.id)}/80/80`}
                alt=""
                className="w-14 h-14 rounded-lg object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground line-clamp-2">{market.title}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {drawerSide === "yes" ? "Yes" : "No"} at {formatPrice(drawerPrice)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex rounded-lg overflow-hidden border border-border bg-muted/30 p-0.5">
                <button
                  type="button"
                  onClick={() => setDrawerOrderType("limit")}
                  className={`px-16 py-2 rounded-md text-sm font-medium transition-colors ${drawerOrderType === "limit" ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                >
                  Limit
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerOrderType("market")}
                  className={`px-16 py-2 rounded-md text-sm font-medium transition-colors ${drawerOrderType === "market" ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                >
                  Market
                </button>
              </div>
              <button type="button" className="p-1.5 rounded-full hover:bg-muted transition-colors" aria-label="Info">
                <Info className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {drawerOrderType === "limit" && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Limit Price</span>
                  <div className="flex items-center gap-1 bg-muted rounded-lg px-2 py-1.5">
                    <span className="text-sm font-medium">{formatPrice(drawerPrice)}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">43,098 Qty available</p>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">Quantity</span>
                <div className="flex items-center gap-1 bg-muted rounded-lg">
                  <button type="button" onClick={() => setDrawerAmount((prev) => Math.max(1, prev - 1))} className="p-1.5">
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <Input
                    value={drawerAmount}
                    onChange={(e) => setDrawerAmount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
                    type="number"
                    min={1}
                    max={100}
                    className="w-14 h-8 border-0 bg-transparent text-center text-sm font-medium px-1"
                  />
                  <button type="button" onClick={() => setDrawerAmount((prev) => Math.min(100, prev + 1))} className="p-1.5">
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
              <Slider
                value={[drawerAmount]}
                onValueChange={(v) => setDrawerAmount(Math.max(1, Math.min(100, v[0])))}
                min={1}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            <div className="rounded-xl bg-muted/50 p-4 space-y-0.5 text-center">
              <p className="font-open-sauce-two font-medium text-[14px] leading-[20px] tracking-normal text-muted-foreground">Win if you&apos;re right</p>
              <p className="font-open-sauce-two font-semibold text-[30px] leading-[36px] tracking-[-0.025em] text-foreground">${Math.round(drawerPotentialReturn)}</p>
              <p className="text-sm font-medium text-success">
                {(drawerPotentialReturn / drawerAmount).toFixed(1)}X Return
              </p>
            </div>

            <button
              type="button"
              onClick={handleDrawerBuyClick}
              className={`w-full py-3.5 rounded-xl font-semibold text-primary-foreground transition-colors ${drawerSide === "yes" ? "bg-success hover:bg-success/90" : "bg-destructive hover:bg-destructive/90"}`}
            >
              {drawerSide === "yes" ? "Yes" : "No"} {formatPrice(drawerPrice)}
            </button>

            <p className="text-center text-sm text-muted-foreground">Balance: ${balance}</p>
          </div>
        </DrawerContent>
      </Drawer>

      <TradeSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      />
    </div>
  );
}
