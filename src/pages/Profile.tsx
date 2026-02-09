import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useWallet } from "@/contexts/WalletContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Wallet, 
  Trophy, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Copy,
  Check,
  Settings,
  History,
  Star,
  Loader2,
  X,
  Clock,
  ShoppingCart
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { apiClient } from "@/lib/api";
import { formatPrice } from "@/lib/utils";

function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

interface Position {
  id: string;
  market_id: string | null;
  market_title: string | null;
  position: string;
  shares: number;
  avg_price: number;
  total_invested: number;
  created_at: string;
}

interface Trade {
  id: string;
  market_id: string | null;
  market_title: string | null;
  side: string;
  position: string;
  shares: number;
  price: number;
  total_amount: number;
  created_at: string;
  status?: string;
  tx_signature?: string;
}

interface OpenOrder {
  id: string;
  market_id: string | null;
  market_title: string | null;
  side: string;
  outcome: string;
  price: number;
  shares: number;
  filled_shares: number;
  total_value: number;
  expiration: string | null;
  status: string;
  created_at: string;
}

// Mock P&L data by time period
const pnlByPeriod = {
  "1D": { value: 127.50, percentage: 2.8 },
  "1W": { value: 523.45, percentage: 11.6 },
  "1M": { value: 1842.30, percentage: 40.8 },
  "ALL": { value: 4523.45, percentage: 100.2 },
};

// Mock data for leaderboard
const leaderboardData = [
  { rank: 1, address: "0x1a2b...3c4d", profit: 125430, trades: 342, winRate: 68.5 },
  { rank: 2, address: "0x5e6f...7g8h", profit: 98250, trades: 289, winRate: 65.2 },
  { rank: 3, address: "0x9i0j...1k2l", profit: 76890, trades: 198, winRate: 71.3 },
  { rank: 4, address: "0x3m4n...5o6p", profit: 54320, trades: 156, winRate: 59.8 },
  { rank: 5, address: "0x7q8r...9s0t", profit: 43210, trades: 134, winRate: 62.1 },
];

// Helper to get event name from trade or position
function getEventName(marketId: string | null, marketTitle?: string | null): string {
  if (marketTitle) return marketTitle;
  return marketId ? `Market ${marketId.slice(0, 8)}...` : "Unknown Market";
}

type PnlPeriod = "1D" | "1W" | "1M" | "ALL";

const Profile = () => {
  const { isConnected, walletAddress, balance, walletType, user, isDevUser } = useWallet();
  const [copied, setCopied] = useState(false);
  const [pnlPeriod, setPnlPeriod] = useState<PnlPeriod>("ALL");
  const [positions, setPositions] = useState<Position[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [openOrders, setOpenOrders] = useState<OpenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({
    totalWinnings: 0,
    totalVolume: 0,
    totalTrades: 0,
    winRate: 0,
    openPositions: 0,
  });

  const currentPnl = pnlByPeriod[pnlPeriod];

  useEffect(() => {
    if (user) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      if (apiClient.getToken()) {
        const [positionsRes, tradesRes, ordersRes] = await Promise.all([
          apiClient.getMyPositions(),
          apiClient.getMyTrades(),
          apiClient.getMyOrders(),
        ]);

        const apiPositions: Position[] = (positionsRes || []).map((p) => ({
          id: p.id,
          market_id: p.marketId,
          market_title: p.market?.title ?? null,
          position: p.outcome,
          shares: Number(p.shares),
          avg_price: Number(p.avgPrice),
          total_invested: Number(p.totalInvested),
          created_at: (p as any).createdAt ?? new Date().toISOString(),
        }));

        const tradesList = (tradesRes as any)?.trades ?? (Array.isArray(tradesRes) ? tradesRes : []);
        const apiTrades: Trade[] = tradesList.map((t: any) => ({
          id: t.id,
          market_id: t.marketId,
          market_title: t.market?.title ?? null,
          side: t.side?.toLowerCase() ?? "buy",
          position: t.outcome ?? "",
          shares: Number(t.shares),
          price: Number(t.price),
          total_amount: Number(t.totalAmount),
          created_at: t.createdAt ?? new Date().toISOString(),
          status: t.status,
          tx_signature: t.txSignature,
        }));

        const ordersList = Array.isArray(ordersRes) ? ordersRes : ordersRes ?? [];
        const apiOrders: OpenOrder[] = (ordersList as any[])
          .filter((o: any) => o.status === "OPEN" || o.status === "PARTIAL")
          .map((o: any) => ({
            id: o.id,
            market_id: o.marketId,
            market_title: o.market?.title ?? null,
            side: o.side?.toLowerCase() ?? "buy",
            outcome: o.outcome ?? "",
            price: Number(o.price),
            shares: Number(o.shares),
            filled_shares: Number(o.filledShares) ?? 0,
            total_value: Number(o.price) * Number(o.shares),
            expiration: o.expiresAt ?? null,
            status: (o.status ?? "open").toLowerCase(),
            created_at: o.createdAt ?? new Date().toISOString(),
          }));

        setPositions(apiPositions);
        setTrades(apiTrades);
        setOpenOrders(apiOrders);

        const totalVolume = apiTrades.reduce((sum, t) => sum + Number(t.total_amount), 0);
        setUserStats({
          totalWinnings: 0,
          totalVolume,
          totalTrades: apiTrades.length,
          winRate: 0,
          openPositions: apiPositions.length,
        });
      } else {
        // No backend token: show empty profile (use Dev Login to see positions/trades)
        setPositions([]);
        setTrades([]);
        setOpenOrders([]);
        setUserStats({
          totalWinnings: 0,
          totalVolume: 0,
          totalTrades: 0,
          winRate: 0,
          openPositions: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      if (apiClient.getToken()) {
        await apiClient.cancelOrder(orderId);
        setOpenOrders((prev) => prev.filter((o) => o.id !== orderId));
        toast.success("Order cancelled");
      } else {
        toast.error("Connect with Dev Login to cancel orders.");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error("Failed to cancel order");
    }
  };

  const handleSellPosition = (positionId: string) => {
    toast.success("Sell order placed");
    // In real implementation, this would create a sell order
  };

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      toast.success("Address copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getWalletIcon = () => {
    switch (walletType) {
      case "phantom": return "🟣";
      case "metamask": return "🦊";
      case "coinbase": return "🔵";
      case "google": return "🔷";
      default: return "👛";
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return rank;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Profile Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 p-6 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl">
                  {isConnected ? getWalletIcon() : "👤"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">
                      {isConnected ? (isDevUser ? (user?.name || "Dev User") : walletAddress ? formatAddress(walletAddress) : "User") : "Guest User"}
                    </h1>
                    {isConnected && walletAddress && (
                      <button
                        onClick={copyAddress}
                        className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                      >
                        {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                      </button>
                    )}
                  </div>
                  <p className="text-muted-foreground">
                    {isConnected ? (isDevUser ? "Demo (no wallet)" : `${walletType?.charAt(0).toUpperCase()}${walletType?.slice(1) || "Wallet"} Wallet`) : "Connect wallet or use Dev Login to view profile"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </Button>
              </div>
            </div>
          </div>

          {/* Profit/Loss Card */}
          <div className="mb-8 p-6 rounded-2xl bg-card border border-border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">Profit / Loss</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className={`text-3xl font-bold ${currentPnl.value >= 0 ? "text-success" : "text-destructive"}`}>
                    {currentPnl.value >= 0 ? "+" : ""}${currentPnl.value.toLocaleString()}
                  </span>
                  <span className={`flex items-center gap-1 text-sm font-medium ${currentPnl.percentage >= 0 ? "text-success" : "text-destructive"}`}>
                    {currentPnl.percentage >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {currentPnl.percentage >= 0 ? "+" : ""}{currentPnl.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary/50">
                {(["1D", "1W", "1M", "ALL"] as PnlPeriod[]).map((period) => (
                  <button
                    key={period}
                    onClick={() => setPnlPeriod(period)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      pnlPeriod === period 
                        ? "bg-primary text-primary-foreground" 
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Wallet className="w-4 h-4" />
                <span className="text-sm">Balance</span>
              </div>
              <div className="text-2xl font-bold">${(balance * 180).toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">{balance.toFixed(4)} SOL</div>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="text-sm">Total Winnings</span>
              </div>
              <div className="text-2xl font-bold text-success">${userStats.totalWinnings.toLocaleString()}</div>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Volume Traded</span>
              </div>
              <div className="text-2xl font-bold">${userStats.totalVolume.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">{userStats.totalTrades} trades</div>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Star className="w-4 h-4" />
                <span className="text-sm">Open Positions</span>
              </div>
              <div className="text-2xl font-bold">{userStats.openPositions}</div>
            </div>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="positions" className="space-y-6">
            <TabsList className="bg-card border border-border p-1 flex-wrap h-auto">
              <TabsTrigger value="positions" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <TrendingUp className="w-4 h-4" />
                Positions
              </TabsTrigger>
              <TabsTrigger value="open-orders" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <ShoppingCart className="w-4 h-4" />
                Open Orders
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <History className="w-4 h-4" />
                History
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Star className="w-4 h-4" />
                Leaderboard
              </TabsTrigger>
            </TabsList>

            {/* Positions Tab - Polymarket Style */}
            <TabsContent value="positions" className="space-y-4">
              <div className="rounded-xl bg-card border border-border overflow-hidden">
                {loading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground mt-2">Loading positions...</p>
                  </div>
                ) : positions.length === 0 ? (
                  <div className="p-8 text-center">
                    <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Positions Yet</h3>
                    <p className="text-muted-foreground">Start trading to see your positions here.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-secondary/50 border-b border-border">
                        <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                          <th className="px-4 py-3 font-medium">Event</th>
                          <th className="px-4 py-3 font-medium text-center">Outcome</th>
                          <th className="px-4 py-3 font-medium text-right">Avg</th>
                          <th className="px-4 py-3 font-medium text-right">Current</th>
                          <th className="px-4 py-3 font-medium text-right">Bet</th>
                          <th className="px-4 py-3 font-medium text-right">To Win</th>
                          <th className="px-4 py-3 font-medium text-right">Value</th>
                          <th className="px-4 py-3 font-medium text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {positions.map((position) => {
                          const currentPrice = 0.5 + (Math.random() * 0.3 - 0.15); // Mock current price
                          const avgPrice = Number(position.avg_price);
                          const shares = Number(position.shares);
                          const bet = Number(position.total_invested);
                          const toWin = shares * 1; // $1 per share if wins
                          const currentValue = shares * currentPrice;
                          const pnlPercent = ((currentPrice - avgPrice) / avgPrice) * 100;
                          
                          return (
                            <tr key={position.id} className="hover:bg-secondary/30 transition-colors">
                              <td className="px-4 py-4">
                                <div className="max-w-[200px]">
                                  <p className="font-medium text-sm truncate">{getEventName(position.market_id, position.market_title)}</p>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                  position.position.toLowerCase() === "yes" 
                                    ? "bg-success/20 text-success" 
                                    : "bg-destructive/20 text-destructive"
                                }`}>
                                  {position.position}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <span className="text-sm font-medium">{formatPrice(avgPrice)}</span>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <div className="flex flex-col items-end">
                                  <span className="text-sm font-medium">{formatPrice(currentPrice)}</span>
                                  <span className={`text-xs ${pnlPercent >= 0 ? "text-success" : "text-destructive"}`}>
                                    {pnlPercent >= 0 ? "+" : ""}{pnlPercent.toFixed(1)}%
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <span className="text-sm font-medium">${bet.toFixed(2)}</span>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <span className="text-sm font-semibold text-success">${toWin.toFixed(2)}</span>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <span className="text-sm font-medium">${currentValue.toFixed(2)}</span>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="h-8 px-3 text-xs font-medium border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                  onClick={() => handleSellPosition(position.id)}
                                >
                                  Sell
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Open Orders Tab - Polymarket Style */}
            <TabsContent value="open-orders" className="space-y-4">
              <div className="rounded-xl bg-card border border-border overflow-hidden">
                {loading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground mt-2">Loading orders...</p>
                  </div>
                ) : openOrders.length === 0 ? (
                  <div className="p-8 text-center">
                    <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Open Orders</h3>
                    <p className="text-muted-foreground">Your pending orders will appear here.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-secondary/50 border-b border-border">
                        <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                          <th className="px-4 py-3 font-medium">Event</th>
                          <th className="px-4 py-3 font-medium text-center">Side</th>
                          <th className="px-4 py-3 font-medium text-center">Outcome</th>
                          <th className="px-4 py-3 font-medium text-right">Price</th>
                          <th className="px-4 py-3 font-medium text-right">Filled</th>
                          <th className="px-4 py-3 font-medium text-right">Total</th>
                          <th className="px-4 py-3 font-medium text-right">Expiration</th>
                          <th className="px-4 py-3 font-medium text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {openOrders.map((order) => {
                          const filledPercent = order.shares > 0 
                            ? (Number(order.filled_shares) / Number(order.shares)) * 100 
                            : 0;
                          const expirationText = order.expiration 
                            ? formatDistanceToNow(new Date(order.expiration), { addSuffix: true })
                            : "No expiration";
                          
                          return (
                            <tr key={order.id} className="hover:bg-secondary/30 transition-colors">
                              <td className="px-4 py-4">
                                <div className="max-w-[200px]">
                                  <p className="font-medium text-sm truncate">{getEventName(order.market_id, order.market_title)}</p>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className={`px-2.5 py-1 rounded text-xs font-semibold ${
                                  order.side === "buy" 
                                    ? "bg-success/20 text-success" 
                                    : "bg-destructive/20 text-destructive"
                                }`}>
                                  {order.side.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                  order.outcome.toLowerCase() === "yes" 
                                    ? "bg-success/20 text-success" 
                                    : order.outcome.toLowerCase() === "no"
                                    ? "bg-destructive/20 text-destructive"
                                    : "bg-secondary text-foreground"
                                }`}>
                                  {order.outcome}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <span className="text-sm font-medium">{formatPrice(Number(order.price))}</span>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <div className="flex flex-col items-end">
                                  <span className="text-sm">{Number(order.filled_shares).toFixed(1)}/{Number(order.shares).toFixed(1)}</span>
                                  <div className="w-16 h-1.5 bg-secondary rounded-full mt-1">
                                    <div 
                                      className="h-full bg-primary rounded-full transition-all"
                                      style={{ width: `${filledPercent}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <span className="text-sm font-medium">${Number(order.total_value).toFixed(2)}</span>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  <span>{expirationText}</span>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <button
                                  onClick={() => handleCancelOrder(order.id)}
                                  className="p-1.5 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* History Tab - Polymarket Style */}
            <TabsContent value="history" className="space-y-4">
              <div className="rounded-xl bg-card border border-border overflow-hidden">
                {loading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground mt-2">Loading history...</p>
                  </div>
                ) : trades.length === 0 ? (
                  <div className="p-8 text-center">
                    <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Trade History</h3>
                    <p className="text-muted-foreground">Your trading history will appear here.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-secondary/50 border-b border-border">
                        <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                          <th className="px-4 py-3 font-medium">Activity</th>
                          <th className="px-4 py-3 font-medium">Event</th>
                          <th className="px-4 py-3 font-medium text-center">Outcome</th>
                          <th className="px-4 py-3 font-medium text-right">Shares</th>
                          <th className="px-4 py-3 font-medium text-right">Price</th>
                          <th className="px-4 py-3 font-medium text-right">Value</th>
                          <th className="px-4 py-3 font-medium text-right">Status</th>
                          <th className="px-4 py-3 font-medium text-right">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {trades.map((trade) => {
                          const isBuy = trade.side === "yes" || trade.side === "buy";
                          return (
                            <tr key={trade.id} className="hover:bg-secondary/30 transition-colors">
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    isBuy ? "bg-success/20" : "bg-destructive/20"
                                  }`}>
                                    {isBuy ? (
                                      <ArrowUpRight className="w-4 h-4 text-success" />
                                    ) : (
                                      <ArrowDownRight className="w-4 h-4 text-destructive" />
                                    )}
                                  </div>
                                  <span className={`text-sm font-semibold ${isBuy ? "text-success" : "text-destructive"}`}>
                                    {isBuy ? "Bought" : "Sold"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="max-w-[200px]">
                                  <p className="font-medium text-sm truncate">{getEventName(trade.market_id, trade.market_title)}</p>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                  trade.position.toLowerCase() === "yes" 
                                    ? "bg-success/20 text-success" 
                                    : "bg-destructive/20 text-destructive"
                                }`}>
                                  {trade.position}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <span className="text-sm font-medium">{Number(trade.shares).toFixed(2)}</span>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <span className="text-sm font-medium">{formatPrice(Number(trade.price))}</span>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <span className="text-sm font-semibold">${Number(trade.total_amount).toFixed(2)}</span>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <span className={`text-xs font-medium ${trade.status === "CONFIRMED" ? "text-success" : trade.status === "PENDING" ? "text-amber-500" : "text-muted-foreground"}`}>
                                  {trade.status ?? "—"}
                                </span>
                                {trade.tx_signature && (
                                  <p className="text-xs font-mono text-muted-foreground truncate max-w-[120px]" title={trade.tx_signature}>
                                    {trade.tx_signature.startsWith("0x") ? `${trade.tx_signature.slice(0, 10)}…` : trade.tx_signature}
                                  </p>
                                )}
                              </td>
                              <td className="px-4 py-4 text-right">
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(trade.created_at), { addSuffix: true })}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Leaderboard Tab */}
            <TabsContent value="leaderboard" className="space-y-4">
              <div className="rounded-xl bg-card border border-border overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold">Top Traders</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary/50">
                      <tr className="text-left text-sm text-muted-foreground">
                        <th className="px-4 py-3 font-medium">Rank</th>
                        <th className="px-4 py-3 font-medium">Trader</th>
                        <th className="px-4 py-3 font-medium text-right">Profit</th>
                        <th className="px-4 py-3 font-medium text-right">Trades</th>
                        <th className="px-4 py-3 font-medium text-right">Win Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {leaderboardData.map((trader) => (
                        <tr key={trader.rank} className="hover:bg-secondary/30 transition-colors">
                          <td className="px-4 py-3">
                            <span className="text-lg">{getRankBadge(trader.rank)}</span>
                          </td>
                          <td className="px-4 py-3 font-medium">{trader.address}</td>
                          <td className="px-4 py-3 text-right text-success font-semibold">
                            ${trader.profit.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground">{trader.trades}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={trader.winRate >= 60 ? "text-success" : "text-muted-foreground"}>
                              {trader.winRate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
