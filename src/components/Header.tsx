import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Wallet, ChevronDown, LogOut, Copy, Check, Search, User, PlusCircle, UserPlus, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DepositModal } from "@/components/DepositModal";
import { TempLoginButton } from "@/components/TempLoginButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useWallet } from "@/contexts/WalletContext";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

function formatAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [creatingTestEvent, setCreatingTestEvent] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { isConnected, walletAddress, walletType, balance, disconnect, showDepositModal, setShowDepositModal, isDevUser, user, ready, connect, loginAsNewRandomUser } = useWallet();
  const navigate = useNavigate();

  useEffect(() => setMounted(true), []);

  // Position dropdown when it opens (for portal)
  useEffect(() => {
    if (!isDropdownOpen || !triggerRef.current || !mounted) return;
    const updatePosition = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setDropdownPosition({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
      }
    };
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isDropdownOpen, mounted]);

  // Close dropdown on Escape
  useEffect(() => {
    if (!isDropdownOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsDropdownOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDropdownOpen]);

  // Close dropdown when connection state changes (e.g. disconnect) so it never stays stuck
  useEffect(() => {
    if (!isConnected && !isDevUser) setIsDropdownOpen(false);
  }, [isConnected, isDevUser]);

  const handleNewRandomUser = async () => {
    setIsDropdownOpen(false);
    try {
      await loginAsNewRandomUser();
      toast.success("Logged in as new random user. Place a trade to see orderbook/graph update from the other side.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create new user");
    }
  };

  const handleOpenTestEvent = async () => {
    setIsDropdownOpen(false);
    setCreatingTestEvent(true);
    try {
      const market = await apiClient.createEmptyTestEvent();
      navigate(`/market/${market.id}`);
      toast.success("Opened empty test event. Trade to see orderbook, graph and price update.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create test event");
    } finally {
      setCreatingTestEvent(false);
    }
  };

  const handleConnect = async () => {
    if (!ready) {
      toast.error("Not ready yet");
      return;
    }
    if (isConnected) {
      toast.info("You are already connected");
      return;
    }
    try {
      await connect();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to connect");
    }
  };

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
      case "privy_embedded": return "🔷";
      default: return "👛";
    }
  };

  if (!mounted) return null;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50 relative h-14 sm:h-16">
        <a href="/" className="absolute left-0 top-0 h-full w-auto min-w-[50px] sm:min-w-[60px] md:min-w-[80px] overflow-hidden flex items-center pl-1 sm:pl-2">
          <img
            src="/og-image.jpeg"
            alt="Logo"
            className="h-8 sm:h-10 md:h-11 w-auto object-contain object-left"
          />
        </a>
        <div className="container mx-auto px-2 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Spacer for balance with right side */}
          <div className="w-10 sm:w-12 md:w-14 shrink-0" />

          {/* Search bar - centered in header */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden sm:flex w-56 sm:w-64 md:w-72">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search markets"
                className="w-full h-9 pl-9 pr-4 rounded-lg bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">/</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />
            {isConnected && (walletAddress || isDevUser) ? (
              <div className="relative">
                <button
                  ref={triggerRef}
                  type="button"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary border border-border hover:border-primary/50 transition-all"
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="true"
                >
                  <span className="text-lg">{isDevUser ? "🧪" : getWalletIcon()}</span>
                  <div className="text-left hidden sm:block">
                    <div className="text-sm font-medium">
                      {isDevUser ? (user?.name || "Dev User") : formatAddress(walletAddress!)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {isDevUser ? "Demo" : `${balance.toFixed(2)} SOL`}
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && mounted && createPortal(
                  <>
                    <div
                      className="fixed inset-0 z-[9998]"
                      onClick={() => setIsDropdownOpen(false)}
                      aria-hidden="true"
                    />
                    <div
                      className="fixed w-64 bg-card border border-border rounded-xl shadow-xl z-[9999] overflow-hidden"
                      style={{ top: dropdownPosition.top, right: dropdownPosition.right }}
                      role="menu"
                    >
                      <div className="p-4 border-b border-border">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{isDevUser ? "🧪" : getWalletIcon()}</span>
                          <div>
                            <div className="font-medium">{isDevUser ? "Dev User" : `${walletType ? walletType.charAt(0).toUpperCase() + walletType.slice(1) : "Wallet"}`}</div>
                            <div className="text-sm text-muted-foreground">
                              {isDevUser ? (user?.email || walletAddress) : formatAddress(walletAddress!)}
                            </div>
                          </div>
                        </div>
                        {!isDevUser && (
                          <div className="mt-3 p-3 rounded-lg bg-secondary/50">
                            <div className="text-xs text-muted-foreground mb-1">Balance</div>
                            <div className="text-xl font-bold">{balance.toFixed(4)} SOL</div>
                            <div className="text-sm text-muted-foreground">≈ ${(balance * 180).toFixed(2)} USD</div>
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        {!isDevUser && (
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
                        )}
                        <button
                          onClick={handleNewRandomUser}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors text-left"
                        >
                          <UserPlus className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">New random user</span>
                        </button>
                        <button
                          onClick={handleOpenTestEvent}
                          disabled={creatingTestEvent}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors text-left disabled:opacity-50"
                        >
                          <FlaskConical className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{creatingTestEvent ? "Creating…" : "Open test event (empty)"}</span>
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
                  </>,
                  document.body
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <TempLoginButton />
                <Button 
                  variant="gradient" 
                  className="gap-2"
                  onClick={handleConnect}
                >
                  <Wallet className="w-4 h-4" />
                  <span className="hidden sm:inline">Connect Wallet</span>
                  <span className="sm:hidden">Connect</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <DepositModal 
        isOpen={showDepositModal} 
        onClose={() => setShowDepositModal(false)} 
      />
    </>
  );
}
