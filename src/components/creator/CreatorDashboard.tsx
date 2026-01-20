import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Users, DollarSign, BarChart3, Eye, Zap, Activity } from "lucide-react";

// Mock data - will be replaced with real data from Supabase
const dashboardStats = {
  totalMarkets: 12,
  activeMarkets: 8,
  totalVolume: 45230,
  totalParticipants: 1847,
  totalRevenue: 2261.50,
  pendingPayouts: 450.00,
  weeklyChange: 23.5,
  avgParticipation: 154
};

const recentActivity = [
  { id: 1, type: "trade", market: "Bitcoin $100k by March?", user: "0x7a3...f2d", amount: 250, time: "2m ago" },
  { id: 2, type: "new_participant", market: "ETF Approval Date", user: "0x9b1...e4a", amount: 100, time: "5m ago" },
  { id: 3, type: "trade", market: "Fed Rate Decision", user: "0x2c4...b8f", amount: 500, time: "12m ago" },
  { id: 4, type: "resolution", market: "Tech Earnings Beat", result: "Yes", payout: 1200, time: "1h ago" },
];

export const CreatorDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Markets</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalMarkets}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">{dashboardStats.activeMarkets} active</span> markets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${dashboardStats.totalVolume.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+{dashboardStats.weeklyChange}%</span> this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalParticipants.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ~{dashboardStats.avgParticipation} avg per market
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${dashboardStats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-yellow-500">${dashboardStats.pendingPayouts}</span> pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest trades and events on your markets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.type === 'trade' ? 'bg-blue-500/10 text-blue-500' :
                      activity.type === 'new_participant' ? 'bg-green-500/10 text-green-500' :
                      'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      {activity.type === 'trade' && <TrendingUp className="w-4 h-4" />}
                      {activity.type === 'new_participant' && <Users className="w-4 h-4" />}
                      {activity.type === 'resolution' && <Zap className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{activity.market}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.type === 'resolution' 
                          ? `Resolved: ${activity.result}` 
                          : activity.user}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {activity.type === 'resolution' 
                        ? `$${activity.payout}` 
                        : `$${activity.amount}`}
                    </p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Quick Stats
            </CardTitle>
            <CardDescription>Performance overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Avg. Market Duration</span>
              <Badge variant="secondary">7 days</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Resolution Rate</span>
              <Badge variant="secondary" className="bg-green-500/10 text-green-500">98%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Twitter Posts</span>
              <Badge variant="secondary">24</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">News Markets</span>
              <Badge variant="secondary">5</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Revenue Share</span>
              <Badge variant="secondary" className="bg-primary/10 text-primary">5%</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
