import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, BarChart2, Clock, Search, X, Info, ChevronUp, ChevronDown } from "lucide-react";
import { Header } from "@/components/Header";
import { formatPrice, formatVolume, formatEndDateTime } from "@/lib/utils";
import { useMarkets } from "@/hooks/useMarkets";
import { useWallet } from "@/contexts/WalletContext";
import { usePrivy } from "@privy-io/react-auth";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Drawer, DrawerContent, DrawerHeader } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { TradeSuccessModal } from "@/components/TradeSuccessModal";
import { toast } from "sonner";
import type { Market } from "@/data/markets";
import YenoLogo from "@/assets/svg/yeno-logo-header.svg?react";
import BackgroundImage from "@/assets/png/Section.png";
import EmptyImage from "@/assets/svg/empty-part.svg?react";


function SearchEventCard({ market }: { market: Market }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isConnected, balance, user, isDevUser, retrySyncWithBackend } = useWallet();
  const { ready, authenticated, login } = usePrivy();
  const multiplier = (1 / (market.yesPrice || 0.5)).toFixed(1);

  const [tradingOpen, setTradingOpen] = useState(false);
  const [tradingSide, setTradingSide] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState(10);
  const [orderType, setOrderType] = useState<"limit" | "market">("limit");
  const [showConfirmation, setShowConfirmation] = useState(false);

  const currentPrice = tradingSide === "yes" ? market.yesPrice : market.noPrice;
  const shares = currentPrice > 0 ? amount / currentPrice : 0;
  const potentialReturn = shares * 1;

  const handleTradeClick = (e: React.MouseEvent, side: "yes" | "no") => {
    e.stopPropagation();
    setTradingSide(side);
    setTradingOpen(true);
  };

  const handleBuyClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isConnected) {
      if (ready && !authenticated) {
        try {
          await login();
        } catch (err) {
          console.error("Failed to connect:", err);
        }
      }
      return;
    }

    const marketId = market.id;
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(marketId));
    let token = apiClient.getToken();
    if (isValidUUID && user?.id && !token && !isDevUser) {
      const ok = await retrySyncWithBackend();
      if (ok) token = apiClient.getToken();
    }
    const useBackendApi = isValidUUID && !!token;

    if (useBackendApi) {
      try {
        const outcomeApi = tradingSide === "yes" ? "YES" : "NO";
        const price = Number(tradingSide === "yes" ? market.yesPrice : market.noPrice);
        if (orderType === "limit") {
          await apiClient.placeOrder({
            marketId: marketId as string,
            side: "BUY",
            outcome: outcomeApi,
            shares: Number(shares),
            price,
            expiresAt: undefined,
          });
          toast.success("Limit order placed successfully!");
        } else {
          await apiClient.executeTrade({
            marketId: marketId as string,
            side: "BUY",
            outcome: outcomeApi,
            shares: Number(shares),
          });
          toast.success("Trade executed successfully!");
        }
        setTradingOpen(false);
        setShowConfirmation(true);
        queryClient.invalidateQueries({ queryKey: ["market", marketId] });
        queryClient.invalidateQueries({ queryKey: ["market", marketId, "trades"] });
        queryClient.invalidateQueries({ queryKey: ["market", marketId, "positions"] });
        queryClient.invalidateQueries({ queryKey: ["market", marketId, "chart"] });
        queryClient.invalidateQueries({ queryKey: ["trades", "orderbook", marketId] });
        queryClient.invalidateQueries({ queryKey: ["markets"] });
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

    setTradingOpen(false);
    setShowConfirmation(true);
  };

  const marketImage =
    (market as { imageUrl?: string }).imageUrl ||
    (market as { image?: string }).image ||
    `https://picsum.photos/seed/${encodeURIComponent(market.category + market.id)}/80/80`;

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() =>
          /^[0-9a-f-]{36}$/i.test(String(market.id))
            ? navigate(`/market/${market.id}`)
            : undefined
        }
        onKeyDown={(e) =>
          e.key === "Enter" &&
          /^[0-9a-f-]{36}$/i.test(String(market.id)) &&
          navigate(`/market/${market.id}`)
        }
        className="rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow text-left"
      >
        <div className="flex gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-foreground line-clamp-2 mb-2">
              {market.title}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <BarChart2 className="h-3.5 w-3.5" />
                {formatVolume(market.volume ?? 0)}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatEndDateTime(market.endDate)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {multiplier}X
            </p>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <button
              type="button"
              onClick={(e) => handleTradeClick(e, "yes")}
              className="px-4 py-2 rounded-lg bg-success text-primary-foreground font-semibold text-sm whitespace-nowrap"
            >
              Yes {formatPrice(market.yesPrice ?? 0)}
            </button>
            <button
              type="button"
              onClick={(e) => handleTradeClick(e, "no")}
              className="px-4 py-2 rounded-lg bg-destructive text-primary-foreground font-semibold text-sm whitespace-nowrap"
            >
              No {formatPrice(market.noPrice ?? 0)}
            </button>
          </div>
        </div>
      </div>

      {/* Trade bottom sheet */}
      <Drawer
        open={tradingOpen}
        onOpenChange={(open) => {
          setTradingOpen(open);
          if (!open) setAmount(10);
        }}
      >
        <DrawerContent className="rounded-t-2xl border-t max-h-[90vh] flex flex-col">
          <DrawerHeader className="p-0 px-4 pt-2 pb-2 flex flex-row items-center justify-center relative">
            <button
              type="button"
              onClick={() => {
                setTradingOpen(false);
                setAmount(10);
              }}
              className="absolute left-1/2 -translate-x-1/2 -top-16 p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </DrawerHeader>
          <div className="flex flex-col gap-4 px-4 pb-6 overflow-y-auto font-open-sauce-two text-[14px] leading-[20px]">
            {/* Yes / No segmented */}
            <div className="flex rounded-lg overflow-hidden border border-border bg-muted/30 p-0.5">
              <button
                type="button"
                onClick={() => setTradingSide("yes")}
                className={`flex-1 py-2.5 rounded-md font-medium transition-colors ${
                  tradingSide === "yes"
                    ? "bg-success text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Yes {formatPrice(Number(market.yesPrice))}
              </button>
              <button
                type="button"
                onClick={() => setTradingSide("no")}
                className={`flex-1 py-2.5 rounded-md font-medium transition-colors ${
                  tradingSide === "no"
                    ? "bg-destructive text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                No {formatPrice(Number(market.noPrice))}
              </button>
            </div>

            {/* Event row: thumbnail + question + "Yes at $x" */}
            <div className="flex gap-3">
              <img
                src={marketImage}
                alt=""
                className="w-14 h-14 rounded-lg object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground line-clamp-2">
                  {market.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {tradingSide === "yes" ? "Yes" : "No"} at{" "}
                  {formatPrice(currentPrice)}
                </p>
              </div>
            </div>

            {/* Order type: Limit / Market */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex rounded-lg overflow-hidden border border-border bg-muted/30 p-0.5">
                <button
                  type="button"
                  onClick={() => setOrderType("limit")}
                  className={`px-16 py-2 rounded-md text-sm font-medium transition-colors ${
                    orderType === "limit"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  Limit
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType("market")}
                  className={`px-16 py-2 rounded-md text-sm font-medium transition-colors ${
                    orderType === "market"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  Market
                </button>
              </div>
              <button
                type="button"
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
                aria-label="Info"
              >
                <Info className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Limit Price (when limit) */}
            {orderType === "limit" && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">
                    Limit Price
                  </span>
                  <div className="flex items-center gap-1 bg-muted rounded-lg px-2 py-1.5">
                    <span className="text-sm font-medium">
                      {formatPrice(currentPrice)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  43,098 Qty available
                </p>
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">Quantity</span>
                <div className="flex items-center gap-1 bg-muted rounded-lg">
                  <button
                    type="button"
                    onClick={() =>
                      setAmount((prev) => Math.max(1, prev - 1))
                    }
                    className="p-1.5"
                  >
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <Input
                    value={amount}
                    onChange={(e) =>
                      setAmount(
                        Math.max(
                          1,
                          Math.min(100, Number(e.target.value) || 1)
                        )
                      )
                    }
                    type="number"
                    min={1}
                    max={100}
                    className="w-14 h-8 border-0 bg-transparent text-center text-sm font-medium px-1"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setAmount((prev) => Math.min(100, prev + 1))
                    }
                    className="p-1.5"
                  >
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
              <Slider
                value={[amount]}
                onValueChange={(v) =>
                  setAmount(Math.max(1, Math.min(100, v[0])))
                }
                min={1}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            {/* Win if you're right */}
            <div className="rounded-xl bg-muted/50 p-4 space-y-0.5 text-center">
              <p className="font-open-sauce-two font-medium text-[14px] leading-[20px] tracking-normal text-muted-foreground">
                Win if you&apos;re right
              </p>
              <p className="font-open-sauce-two font-semibold text-[30px] leading-[36px] tracking-[-0.025em] text-foreground">
                ${Math.round(potentialReturn)}
              </p>
              <p className="text-sm font-medium text-success">
                {(potentialReturn / amount).toFixed(1)}X Return
              </p>
            </div>

            {/* Main CTA */}
            <button
              type="button"
              onClick={handleBuyClick}
              className={`w-full py-3.5 rounded-xl font-semibold text-primary-foreground transition-colors ${
                tradingSide === "yes"
                  ? "bg-success hover:bg-success/90"
                  : "bg-destructive hover:bg-destructive/90"
              }`}
            >
              {tradingSide === "yes" ? "Yes" : "No"}{" "}
              {formatPrice(currentPrice)}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              Balance: ${balance}
            </p>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Trade Success Modal */}
      <TradeSuccessModal
        isOpen={showConfirmation}
        onClose={() => {
          setShowConfirmation(false);
          setTradingOpen(false);
          setAmount(10);
        }}
      />
    </>
  );
}

export default function SearchResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = (searchParams.get("q") ?? "").trim();
  const hasQuery = q.length >= 2;

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useMarkets({
      status: "ACTIVE",
      search: hasQuery ? q : undefined,
      sort: "newest",
      limit: 20,
    });

  const markets = data?.pages?.flatMap((p) => p.markets) ?? [];
  const normalizedMarkets: Market[] = markets.map((m) => ({
    ...m,
    description: m.description ?? "",
    image: m.imageUrl ?? "/placeholder.svg",
    outcomes: (m as { outcomes?: { name: string; price: number }[] }).outcomes ?? [],
  }));

  return (
    <>
    <Header />
    <div className="bg-secondary min-h-screen flex flex-col justify-between">

          <div className="container mx-auto px-4 py-6">
          {/* Back + search results title */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">
              Events search Results for{" "}
              <span className="font-bold text-foreground">&quot;{q || "…"}&quot;</span>
            </span>
          </button>

          {!hasQuery ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Enter a search term above</p>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="mt-4 text-sm text-primary hover:underline"
              >
                Go to Home
              </button>
            </div>
          ) : isLoading ? (
            <div className="py-16 text-center">
              <div className="animate-pulse flex flex-col items-center gap-4">
                <Search className="h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">Searching…</p>
              </div>
            </div>
          ) : normalizedMarkets.length === 0 ? (
            /* No results state */
            <div className="flex flex-col items-center justify-center py-16">
              <EmptyImage className="w-full max-w-[200px] h-auto" aria-hidden />
              <p className="text-xl font-bold text-foreground mt-6">
                No results for &quot;{q}&quot;
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {normalizedMarkets.map((market) => (
                  <SearchEventCard key={market.id} market={market} />
                ))}
              </div>

              {hasNextPage && (
                <div className="flex justify-center py-8">
                  <button
                    type="button"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="px-6 py-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-medium transition-colors disabled:opacity-50"
                  >
                    {isFetchingNextPage ? "Loading…" : "Show More"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer - same as StoryFeed */}
        <div className="relative rounded-3xl overflow-hidden flex flex-col items-center mt-8">
          <img
            src={BackgroundImage}
            alt=""
            className="w-full h-full object-cover"
          />
          <div
            className="relative z-10 w-full mx-auto bg-background py-8 px-6 flex flex-col items-center gap-6"
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
              <p className="text-sm font-medium">Yeno Technologies Inc</p>
            </div>
            <nav className="flex flex-col items-center gap-2 text-sm font-semibold">
              <div className="flex justify-center gap-x-6">
                <a href="/about" className="hover:underline">
                  About Us
                </a>
                <a href="/terms" className="hover:underline">
                  Terms and Conditions
                </a>
              </div>
              <a href="/privacy" className="hover:underline">
                Privacy Policy
              </a>
            </nav>
            <p className="text-sm text-muted-foreground">
              Powered by{" "}
              <span className="font-semibold text-foreground">Solana</span>
            </p>
          </div>
        </div>

      </div>
      </>
  );
}
