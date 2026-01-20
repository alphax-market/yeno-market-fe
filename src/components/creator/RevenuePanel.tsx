import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  TrendingUp, 
  Wallet,
  ArrowUpRight,
  Clock,
  CheckCircle,
  BarChart3,
  Download
} from "lucide-react";

// Mock revenue data
const revenueStats = {
  totalEarned: 2261.50,
  pendingPayouts: 450.00,
  availableBalance: 1811.50,
  thisMonth: 892.30,
  lastMonth: 756.20,
  monthlyChange: 18.0
};

const mockPayouts = [
  { id: 1, market: "Bitcoin $100k March?", amount: 125.00, status: "completed", date: "2025-01-15" },
  { id: 2, market: "Fed Rate Decision", amount: 89.50, status: "completed", date: "2025-01-10" },
  { id: 3, market: "Tech Earnings Beat", amount: 234.00, status: "processing", date: "2025-01-18" },
  { id: 4, market: "SpaceX Orbital", amount: 67.80, status: "pending", date: "2025-01-20" },
];

const mockMarketRevenue = [
  { id: 1, market: "Bitcoin $100k by March?", volume: 12500, fees: 125.00, yourShare: 62.50, status: "active" },
  { id: 2, market: "Fed Rate Decision", volume: 8900, fees: 89.00, yourShare: 44.50, status: "active" },
  { id: 3, market: "Tesla Q4 Earnings", volume: 23400, fees: 234.00, yourShare: 117.00, status: "resolved" },
  { id: 4, market: "Apple AR Glasses", volume: 5600, fees: 56.00, yourShare: 28.00, status: "active" },
];

const statusConfig = {
  pending: { label: "Pending", variant: "secondary" as const, icon: Clock },
  processing: { label: "Processing", variant: "outline" as const, icon: Clock },
  completed: { label: "Completed", variant: "default" as const, icon: CheckCircle }
};

export const RevenuePanel = () => {
  const [withdrawAmount, setWithdrawAmount] = useState("");

  return (
    <div className="space-y-6">
      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${revenueStats.totalEarned.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime earnings from all markets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">${revenueStats.availableBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Ready to withdraw
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">${revenueStats.pendingPayouts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From active markets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${revenueStats.thisMonth.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+{revenueStats.monthlyChange}%</span> vs last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Withdraw Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Withdraw Funds
          </CardTitle>
          <CardDescription>
            Transfer your earnings to your connected wallet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="number"
                  placeholder="0.00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 rounded-md border bg-background"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Available: ${revenueStats.availableBalance.toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => setWithdrawAmount(revenueStats.availableBalance.toString())}
              >
                Max
              </Button>
              <Button disabled={!withdrawAmount || Number(withdrawAmount) <= 0}>
                Withdraw
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Details */}
      <Tabs defaultValue="markets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="markets">
            <BarChart3 className="w-4 h-4 mr-2" />
            Market Revenue
          </TabsTrigger>
          <TabsTrigger value="payouts">
            <DollarSign className="w-4 h-4 mr-2" />
            Payout History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="markets">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Revenue by Market</CardTitle>
                  <CardDescription>
                    Breakdown of fees earned from each market
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Market</TableHead>
                      <TableHead className="text-right">Volume</TableHead>
                      <TableHead className="text-right">Total Fees</TableHead>
                      <TableHead className="text-right">Your Share (5%)</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockMarketRevenue.map((market) => (
                      <TableRow key={market.id}>
                        <TableCell className="font-medium">{market.market}</TableCell>
                        <TableCell className="text-right">${market.volume.toLocaleString()}</TableCell>
                        <TableCell className="text-right">${market.fees.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-green-500 font-medium">
                          ${market.yourShare.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={market.status === "active" ? "default" : "secondary"}>
                            {market.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payout History</CardTitle>
                  <CardDescription>
                    Record of all your payouts
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Market</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockPayouts.map((payout) => {
                      const config = statusConfig[payout.status as keyof typeof statusConfig];
                      const StatusIcon = config?.icon || Clock;
                      return (
                        <TableRow key={payout.id}>
                          <TableCell className="font-medium">{payout.market}</TableCell>
                          <TableCell className="text-right">${payout.amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={config?.variant || "secondary"}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {config?.label || payout.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(payout.date).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
