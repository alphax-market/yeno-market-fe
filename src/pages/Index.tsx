import { useState } from "react";
import { Header } from "@/components/Header";
import { StoryFeed } from "@/components/StoryFeed";
import { MarketModal } from "@/components/MarketModal";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { usePrivy } from "@privy-io/react-auth";
import { Market } from "@/data/markets";

const Index = () => {
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const { login, authenticated, ready } = usePrivy();

  const handleOpenWallet = async () => {
    if (!ready) return;
    if (authenticated) return;
    try {
      await login();
    } catch (error) {
      console.error("Failed to open wallet:", error);
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-[100dvh] bg-background pb-16 md:pb-0 overflow-hidden">
      <Header />
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-secondary">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
          <StoryFeed onSelectMarket={setSelectedMarket} />
        </div>
      </main>
      <BottomNav />
      <MarketModal 
        market={selectedMarket} 
        onClose={() => setSelectedMarket(null)}
        onOpenWallet={handleOpenWallet}
      />
    </div>
  );
};

export default Index;
