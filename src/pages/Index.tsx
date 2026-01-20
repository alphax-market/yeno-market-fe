import { useState } from "react";
import { Header } from "@/components/Header";
import { StoryFeed } from "@/components/StoryFeed";
import { MarketModal } from "@/components/MarketModal";
import { Footer } from "@/components/Footer";
import { WalletModal } from "@/components/WalletModal";
import { BottomNav } from "@/components/BottomNav";
import { Market } from "@/data/markets";

const Index = () => {
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      <main className="pt-16">
        <StoryFeed onSelectMarket={setSelectedMarket} />
      </main>
      <BottomNav />
      <MarketModal 
        market={selectedMarket} 
        onClose={() => setSelectedMarket(null)}
        onOpenWallet={() => setIsWalletModalOpen(true)}
      />
      <WalletModal 
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </div>
  );
};

export default Index;
