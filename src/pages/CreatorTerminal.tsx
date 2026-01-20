import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WalletModal } from "@/components/WalletModal";
import { useWallet } from "@/contexts/WalletContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, 
  Plus, 
  TrendingUp, 
  DollarSign, 
  Twitter, 
  Newspaper,
  BarChart3,
  Settings,
  Eye,
  Users,
  Zap
} from "lucide-react";
import { CreatorDashboard } from "@/components/creator/CreatorDashboard";
import { MarketManager } from "@/components/creator/MarketManager";
import { CreateMarketForm } from "@/components/creator/CreateMarketForm";
import { TwitterIntegration } from "@/components/creator/TwitterIntegration";
import { NewsIntegration } from "@/components/creator/NewsIntegration";
import { RevenuePanel } from "@/components/creator/RevenuePanel";

const CreatorTerminal = () => {
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const { isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState("dashboard");

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-16">
          <div className="container mx-auto px-4 py-16">
            <Card className="max-w-lg mx-auto text-center">
              <CardHeader>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Creator Terminal</CardTitle>
                <CardDescription>
                  Connect your wallet to access the Creator Terminal and start running your own prediction markets.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={() => setWalletModalOpen(true)}
                >
                  Connect Wallet
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
        <WalletModal isOpen={walletModalOpen} onClose={() => setWalletModalOpen(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 py-8">
          {/* Terminal Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary-foreground" />
                </div>
                Creator Terminal
              </h1>
              <p className="text-muted-foreground mt-1">
                Create, manage, and monetize your prediction markets
              </p>
            </div>
            <Button onClick={() => setActiveTab("create")}>
              <Plus className="w-4 h-4 mr-2" />
              New Market
            </Button>
          </div>

          {/* Main Terminal Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-6 w-full max-w-3xl">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="markets" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Markets</span>
              </TabsTrigger>
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create</span>
              </TabsTrigger>
              <TabsTrigger value="twitter" className="flex items-center gap-2">
                <Twitter className="w-4 h-4" />
                <span className="hidden sm:inline">Twitter</span>
              </TabsTrigger>
              <TabsTrigger value="news" className="flex items-center gap-2">
                <Newspaper className="w-4 h-4" />
                <span className="hidden sm:inline">News</span>
              </TabsTrigger>
              <TabsTrigger value="revenue" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span className="hidden sm:inline">Revenue</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <CreatorDashboard />
            </TabsContent>

            <TabsContent value="markets">
              <MarketManager />
            </TabsContent>

            <TabsContent value="create">
              <CreateMarketForm onSuccess={() => setActiveTab("markets")} />
            </TabsContent>

            <TabsContent value="twitter">
              <TwitterIntegration />
            </TabsContent>

            <TabsContent value="news">
              <NewsIntegration />
            </TabsContent>

            <TabsContent value="revenue">
              <RevenuePanel />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
      <WalletModal isOpen={walletModalOpen} onClose={() => setWalletModalOpen(false)} />
    </div>
  );
};

export default CreatorTerminal;
