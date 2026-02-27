import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Wallet,
  ChevronDown,
  Menu,
  LogOut,
  Copy,
  Check,
  Search,
  User,
  PlusCircle,
  UserPlus,
  FlaskConical,
  Moon,
  Sun,
  ChevronRight,
  Bell,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DepositModal } from "@/components/DepositModal";
import { SearchModal } from "@/components/SearchModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";
import { useWallet } from "@/contexts/WalletContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useCategories } from "@/hooks/useMarkets";
import { useMemo } from "react";
import YenoLogoHeader from "@/assets/svg/yeno-logo-header.svg?react";
import Avatar from "@/assets/svg/Avatar.svg?react";

function formatAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}


interface HeaderProps {
  activeCategory?: string;
  onCategoryChange?: (cat: string) => void;
}

export function Header({ activeCategory = 'trending', onCategoryChange }: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [creatingTestEvent, setCreatingTestEvent] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simulatingBulk, setSimulatingBulk] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    right: 0,
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const { theme, setTheme } = useTheme();
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  const {
    isConnected,
    walletAddress,
    walletType,
    balance,
    disconnect,
    showDepositModal,
    setShowDepositModal,
    isDevUser,
    user,
    ready,
    connect,
    loginAsNewRandomUser,
  } = useWallet();
  const isMobile = useIsMobile();

  const { data: categoriesData } = useCategories();
  const navCategories = useMemo(() => {
    const apiCategories = categoriesData ?? [];
    const entries = apiCategories.flatMap((c: { category?: string; name?: string; slug?: string }) => {
      const cat = (c.name ?? c.slug ?? c.category ?? "").toLowerCase();
      if (!cat) return [];
      if (cat === "sports")
        return [
          { id: "cricket", label: "Cricket" },
          { id: "football", label: "Football" },
        ];
      const label = c.name ?? c.slug ?? c.category ?? "";
      return [{ id: cat, label: label.charAt(0).toUpperCase() + label.slice(1) }];
    });
    const seen = new Set<string>();
    const deduped = entries.filter((e) => {
      if (!e.id || seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });
    return [{ id: "trending", label: "Trending", icon: TrendingUp }, ...deduped.map(d => ({ ...d, icon: undefined }))];
  }, [categoriesData]);


  console.log(
    "anant",
    isConnected,
    walletAddress,
    walletType,
    balance,
    disconnect,
    showDepositModal,
    setShowDepositModal,
    isDevUser,
    user,
    ready,
    connect,
    loginAsNewRandomUser,
  );
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const marketIdMatch = location.pathname.match(/^\/market\/([a-f0-9-]{36})$/i);
  const currentMarketId = marketIdMatch ? marketIdMatch[1] : null;

  useEffect(() => setMounted(true), []);

  // Position dropdown when it opens (for portal)
  useEffect(() => {
    if (!isDropdownOpen || !triggerRef.current || !mounted) return;
    const updatePosition = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 8,
          right: window.innerWidth - rect.right,
        });
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

  // Position menu overlay when it opens
  useEffect(() => {
    if (!menuOpen || !menuTriggerRef.current || !mounted) return;
    const updatePosition = () => {
      if (menuTriggerRef.current) {
        const rect = menuTriggerRef.current.getBoundingClientRect();
        setMenuPosition({
          top: rect.bottom + 8,
          right: window.innerWidth - rect.right,
        });
      }
    };
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [menuOpen, mounted]);

  // Close menu on Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const handleNewRandomUser = async () => {
    setIsDropdownOpen(false);
    try {
      await loginAsNewRandomUser();
      toast.success(
        "Logged in as new random user. Place a trade to see orderbook/graph update from the other side.",
      );
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
      toast.success(
        "Opened empty test event. Trade to see orderbook, graph and price update.",
      );
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to create test event",
      );
    } finally {
      setCreatingTestEvent(false);
    }
  };

  const handleSimulateTrades = async () => {
    setIsDropdownOpen(false);
    if (!currentMarketId) {
      toast.error("Open a market first to simulate trades.");
      return;
    }
    setSimulating(true);
    try {
      await apiClient.simulateTrades(currentMarketId, 5);
      toast.success(
        "Simulated 5 trades. Volume, prices, activity and orderbook should update.",
      );
      queryClient.invalidateQueries({ queryKey: ["market", currentMarketId] });
      queryClient.invalidateQueries({
        queryKey: ["market", currentMarketId, "trades"],
      });
      queryClient.invalidateQueries({
        queryKey: ["market", currentMarketId, "positions"],
      });
      queryClient.invalidateQueries({
        queryKey: ["market", currentMarketId, "chart"],
      });
      queryClient.invalidateQueries({
        queryKey: ["trades", "orderbook", currentMarketId],
      });
      queryClient.invalidateQueries({ queryKey: ["markets"] });
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Simulate failed (dev users only)",
      );
    } finally {
      setSimulating(false);
    }
  };

  const handleSimulateBulkTrades = async () => {
    setIsDropdownOpen(false);
    if (!currentMarketId) {
      toast.error("Open a market first to simulate trades.");
      return;
    }
    setSimulatingBulk(true);
    try {
      const res = await apiClient.simulateBulkTrades(currentMarketId, 3, 4);
      toast.success(
        `Simulated ${res.executed} trades from ${res.users} traders.`,
      );
      queryClient.invalidateQueries({ queryKey: ["market", currentMarketId] });
      queryClient.invalidateQueries({
        queryKey: ["market", currentMarketId, "trades"],
      });
      queryClient.invalidateQueries({
        queryKey: ["market", currentMarketId, "positions"],
      });
      queryClient.invalidateQueries({
        queryKey: ["market", currentMarketId, "chart"],
      });
      queryClient.invalidateQueries({
        queryKey: ["trades", "orderbook", currentMarketId],
      });
      queryClient.invalidateQueries({ queryKey: ["markets"] });
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : "Simulate bulk failed (dev users only)",
      );
    } finally {
      setSimulatingBulk(false);
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

  if (!mounted) return null;

  return (
    <>
      <header className="top-0 left-0 right-0 z-50 relative bg-background">
        {/* Top row: logo + actions */}
        <div className="flex flex-row items-center justify-between px-4 sm:px-6 h-14 sm:h-16">
        <a href="/" className=" pl-1 sm:pl-2">
          {/* <img
            src="/og-image.jpeg"
            alt="Logo"
            className="h-8 sm:h-10 md:h-11 w-auto object-contain object-left"
          /> */}
          <YenoLogoHeader />
        </a>
        <div className="mx-auto w-full sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Spacer for balance with right side */}
          <div className="w-10 sm:w-12 md:w-14 shrink-0" />

          <div className="flex items-center gap-4 shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="p-1 rounded-lg hover:bg-muted transition-colors sm:hidden"
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-foreground" />
            </button>
            {/* Hide theme toggle on mobile when logged in */}
            {!(isConnected && isMobile) && <ThemeToggle />}
            {isConnected && (walletAddress || isDevUser) ? (
              <div className="relative flex items-center gap-2">
                {isMobile ? (
                  /* Mobile: wallet pill (display only) + bell + menu (dropdown trigger) */
                  <>
                    <span className="flex items-center gap-2 rounded-full bg-background border border-border px-3 py-2 text-foreground">
                      <Wallet className="w-4 h-4 text-foreground" />
                      <span className="text-sm font-semibold">
                        ${(balance * 180).toFixed(0)}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {}}
                      className="p-1 rounded-lg hover:bg-muted transition-colors"
                      aria-label="Notifications"
                    >
                      <Bell className="w-5 h-5 text-foreground" />
                    </button>
                    <button
                      ref={triggerRef}
                      type="button"
                      onClick={() => setIsDropdownOpen((prev) => !prev)}
                      className="p-1 rounded-lg hover:bg-muted transition-colors"
                      aria-expanded={isDropdownOpen}
                      aria-haspopup="true"
                      aria-label="Menu"
                    >
                      <Avatar className="w-7 h-7 text-foreground" />
                    </button>
                  </>
                ) : (
                  <button
                    ref={triggerRef}
                    type="button"
                    onClick={() => setIsDropdownOpen((prev) => !prev)}
                    className="flex items-center gap-2 px-1 py-2 rounded-lg"
                    aria-expanded={isDropdownOpen}
                    aria-haspopup="true"
                  >
                    <span className="text-lg">
                      {isDevUser ? "aa" : <Avatar />}
                    </span>
                    <div className="text-left">
                      <div className="text-sm font-medium">
                        {isDevUser
                          ? user?.name || "Dev User"
                          : formatAddress(walletAddress!)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {isDevUser ? "Demo" : `${balance.toFixed(2)} SOL`}
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                )}

                {isDropdownOpen &&
                  mounted &&
                  createPortal(
                    <>
                      <div
                        className="fixed inset-0 z-[9998]"
                        onClick={() => setIsDropdownOpen(false)}
                        aria-hidden="true"
                      />
                      <div
                        className="fixed w-64 bg-card border border-border rounded-xl shadow-xl z-[9999] overflow-hidden"
                        style={{
                          top: dropdownPosition.top,
                          right: dropdownPosition.right,
                        }}
                        role="menu"
                      >
                        <div className="p-4 border-b border-border">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">
                              {isDevUser ? "🧪" : <Avatar />}
                            </span>
                            <div>
                              <div className="font-medium">
                                {isDevUser
                                  ? "Dev User"
                                  : `${walletType ? walletType.charAt(0).toUpperCase() + walletType.slice(1) : "Wallet"}`}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {isDevUser
                                  ? user?.email || walletAddress
                                  : formatAddress(walletAddress!)}
                              </div>
                            </div>
                          </div>
                          {!isDevUser && (
                            <div className="mt-3 p-3 rounded-lg bg-secondary/50">
                              <div className="text-xs text-muted-foreground mb-1">
                                Balance
                              </div>
                              <div className="text-xl font-bold">
                                {balance.toFixed(4)} SOL
                              </div>
                              <div className="text-sm text-muted-foreground">
                                ≈ ${(balance * 180).toFixed(2)} USD
                              </div>
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
                              <span className="text-sm font-medium text-primary">
                                Deposit
                              </span>
                            </button>
                          )}
                          {/* <button
                          onClick={handleNewRandomUser}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors text-left"
                        >
                          <UserPlus className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">New random user</span>
                        </button> */}
                          {/* <button
                          onClick={handleOpenTestEvent}
                          disabled={creatingTestEvent}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors text-left disabled:opacity-50"
                        >
                          <FlaskConical className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{creatingTestEvent ? "Creating…" : "Open test event (empty)"}</span>
                        </button> */}
                          {isDevUser && (
                            <>
                              {/* <button
                              onClick={handleSimulateTrades}
                              disabled={simulating || simulatingBulk || !currentMarketId}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors text-left disabled:opacity-50"
                              title={!currentMarketId ? "Open a market first" : "Run 5 synthetic trades"}
                            >
                              <FlaskConical className="w-4 h-4 text-amber-500" />
                              <span className="text-sm">{simulating ? "Simulating…" : "Simulate 5 Trades"}</span>
                            </button> */}
                              {/* <button
                              onClick={handleSimulateBulkTrades}
                              disabled={simulating || simulatingBulk || !currentMarketId}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors text-left disabled:opacity-50"
                              title={!currentMarketId ? "Open a market first" : "12 trades from 3 different traders"}
                            >
                              <FlaskConical className="w-4 h-4 text-emerald-500" />
                              <span className="text-sm">{simulatingBulk ? "Simulating…" : "Simulate Multi-Trader"}</span>
                            </button> */}
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setTheme(isDark ? "light" : "dark");
                            }}
                            className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg hover:bg-secondary transition-colors text-left"
                          >
                            <ThemeToggle />{" "}
                            <span className="text-sm">Theme</span>
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
                            {copied ? (
                              <Check className="w-4 h-4 text-success" />
                            ) : (
                              <Copy className="w-4 h-4 text-muted-foreground" />
                            )}
                            <span className="text-sm">
                              {copied ? "Copied!" : "Copy Address"}
                            </span>
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
                    document.body,
                  )}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                {/* <TempLoginButton />
                
                <Button 
                  variant="default" 
                  className="gap-2"
                  onClick={handleConnect}
                >
                  <Wallet className="w-4 h-4" />
                  <span className="hidden sm:inline">Connect Wallet</span>
                  <span className="sm:hidden">Connect</span>
                </Button> */}

                <Button
                  variant="default"
                  className="gap-2"
                  onClick={handleConnect}
                >
                  Sign In
                </Button>
                <div className="relative">
                  <button
                    ref={menuTriggerRef}
                    type="button"
                    onClick={() => setMenuOpen((prev) => !prev)}
                    className="p-1 rounded-lg hover:bg-muted transition-colors"
                    aria-expanded={menuOpen}
                    aria-haspopup="true"
                    aria-label="Menu"
                  >
                    <Menu className="w-5 h-5 text-foreground" />
                  </button>
                  {menuOpen &&
                    mounted &&
                    createPortal(
                      <>
                        <div
                          className="fixed inset-0 z-[9998]"
                          onClick={() => setMenuOpen(false)}
                          aria-hidden="true"
                        />
                        <div
                          className="fixed bg-card border border-border rounded-xl shadow-lg z-[9999] overflow-hidden min-w-[160px]"
                          style={{
                            top: menuPosition.top,
                            right: menuPosition.right,
                          }}
                          role="menu"
                        >
                          <div className="py-1">
                            <button
                              type="button"
                              onClick={() => {
                                setTheme(isDark ? "light" : "dark");
                                setMenuOpen(false);
                              }}
                              className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors text-left"
                            >
                              {isDark ? "Light mode" : "Dark mode"}
                              {isDark ? (
                                <Sun className="w-4 h-4 text-muted-foreground shrink-0" />
                              ) : (
                                <Moon className="w-4 h-4 text-muted-foreground shrink-0" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setMenuOpen(false);
                                handleConnect();
                              }}
                              className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors text-left"
                            >
                              Sign In
                              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                            </button>
                          </div>
                        </div>
                      </>,
                      document.body,
                    )}
                </div>
              </div>
            )}
          </div>
        </div>
        </div>

        {/* Second row: Category navbar — desktop only */}
        <nav className="hidden sm:flex items-center overflow-x-auto scrollbar-hide border-b border-border/40 px-4 sm:px-6">
          {navCategories.map((cat) => {
            const Icon = cat.icon;
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onCategoryChange?.(cat.id)}
                className={`relative flex items-center gap-1.5 px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                {cat.label}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </header>

      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
      />
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
``;
