import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Wallet, ChevronDown, LogOut, Copy, Check, Search, User, Zap, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletModal } from "@/components/WalletModal";
import { DepositModal } from "@/components/DepositModal";
import { useWallet } from "@/contexts/WalletContext";
import { toast } from "sonner";

function formatAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function Header() {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { isConnected, walletAddress, walletType, balance, disconnect, showDepositModal, setShowDepositModal } = useWallet();
  const navigate = useNavigate();

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      toast.success("Address copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setIsDropdownOpen(false);
    toast.success("Wallet disconnected");
  };

  const getWalletIcon = () => {
    switch (walletType) {
      case "phantom": return "🟣";
      case "metamask": return "🦊";
      case "coinbase": return "🔵";
      default: return "👛";
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-background font-bold text-xs">YN</span>
              </div>
              <span className="text-lg font-bold">YeNo</span>
            </a>
            
            {/* Search bar - Polymarket style */}
            <div className="hidden lg:flex relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search markets"
                className="w-64 h-9 pl-9 pr-4 rounded-lg bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">/</span>
            </div>

            {/* Creator Terminal Link */}
            <Link 
              to="/creator" 
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
            >
              <Zap className="w-4 h-4 text-primary" />
              <span>Creator Terminal</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            
            {isConnected && walletAddress ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary border border-border hover:border-primary/50 transition-all"
                >
                  <span className="text-lg">{getWalletIcon()}</span>
                  <div className="text-left hidden sm:block">
                    <div className="text-sm font-medium">{formatAddress(walletAddress)}</div>
                    <div className="text-xs text-muted-foreground">{balance.toFixed(2)} SOL</div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                      <div className="p-4 border-b border-border">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getWalletIcon()}</span>
                          <div>
                            <div className="font-medium capitalize">{walletType} Wallet</div>
                            <div className="text-sm text-muted-foreground">{formatAddress(walletAddress)}</div>
                          </div>
                        </div>
                        <div className="mt-3 p-3 rounded-lg bg-secondary/50">
                          <div className="text-xs text-muted-foreground mb-1">Balance</div>
                          <div className="text-xl font-bold">{balance.toFixed(4)} SOL</div>
                          <div className="text-sm text-muted-foreground">≈ ${(balance * 180).toFixed(2)} USD</div>
                        </div>
                      </div>
                      <div className="p-2">
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            setShowDepositModal(true);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors text-left"
                        >
                          <PlusCircle className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium text-primary">Deposit</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            navigate("/profile");
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors text-left"
                        >
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">Profile</span>
                        </button>
                        <button
                          onClick={copyAddress}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors text-left"
                        >
                          {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                          <span className="text-sm">{copied ? "Copied!" : "Copy Address"}</span>
                        </button>
                        <button
                          onClick={handleDisconnect}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-destructive/10 transition-colors text-left text-destructive"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm">Disconnect</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Button 
                variant="gradient" 
                className="gap-2"
                onClick={() => setIsWalletModalOpen(true)}
              >
                <Wallet className="w-4 h-4" />
                <span className="hidden sm:inline">Connect Wallet</span>
                <span className="sm:hidden">Connect</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <WalletModal 
        isOpen={isWalletModalOpen} 
        onClose={() => setIsWalletModalOpen(false)} 
      />

      <DepositModal 
        isOpen={showDepositModal} 
        onClose={() => setShowDepositModal(false)} 
      />
    </>
  );
}
