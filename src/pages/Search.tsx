// src/pages/Search.tsx
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BackpackIcon, Search as SearchIcon, TrendingUp } from "lucide-react";
import { useCategories, useSearchMarkets } from "@/hooks/useMarkets";
import type { Market as ApiMarket } from "@/lib/api";
import type { Market as UiMarket } from "@/data/markets";
import { MarketCard } from "@/components/MarketCard";
import { YenoLoader } from "@/components/YenoLoader";
import BackgroundImage from "@/assets/png/Section.png";
import YenoLogo from "@/assets/svg/yeno-logo-header.svg?react";
import { SearchTradeCard } from "@/components/SearchTradeCard";
import { Header } from "@/components/Header";
import { motion } from "framer-motion";
import { IconLeft, IconRight } from "react-day-picker";

function normalizeMarkets(markets: ApiMarket[]): UiMarket[] {
  return markets.map((m) => {
    const yesPrice = Number(m.yesPrice ?? 0);
    const noPrice = Number(m.noPrice ?? 1 - yesPrice);
    const endDate = m.endDate;
    const isLive =
      typeof m.isLive === "boolean"
        ? m.isLive
        : endDate
          ? new Date(endDate) > new Date()
          : false;

    return {
      id: m.id,
      title: m.title,
      description: m.description ?? "",
      category: m.category,
      yesPrice,
      noPrice,
      volume: Number(m.volume ?? 0),
      liquidity: Number(m.liquidity ?? 0),
      endDate,
      imageUrl: m.imageUrl,
      isLive,
      outcomes: m.outcomes,
      change24h: undefined,
    };
  });
}

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = (searchParams.get("q") || "").trim();
  const [activeSort, setActiveSort] = useState<string>("newest");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  const staticFilters = [
    {
      id: "trending",
      label: "Trending",
      sort: "trending" as const,
      icon: TrendingUp,
    },
    { id: "newest", label: "New", sort: "newest" as const },
  ];

  const { data, isLoading } = useSearchMarkets(query);
  const markets: UiMarket[] = useMemo(
    () => normalizeMarkets((data as ApiMarket[] | undefined) ?? []),
    [data],
  );

  const { data: categoriesData } = useCategories();
  const apiCategories = categoriesData ?? [];

  // Send category as-is so backend filters: cricket → only cricket, football → only football
  const apiCategory = useMemo(() => {
    if (!activeCategory) return undefined;
    return activeCategory;
  }, [activeCategory]);
  const displayCategories = useMemo(() => {
    const entries = apiCategories.flatMap(
      (c: { category?: string; name?: string; slug?: string }) => {
        const cat = (c.name ?? c.slug ?? c.category ?? "").toLowerCase();
        if (cat === "sports")
          return [
            { category: "cricket", label: "Cricket" },
            { category: "football", label: "Football" },
          ];
        const label = c.name ?? c.slug ?? c.category ?? "";
        return [
          {
            category: cat || label,
            label: label ? label.charAt(0).toUpperCase() + label.slice(1) : "",
          },
        ];
      },
    );
    const seen = new Set<string>();
    return entries.filter((e) => {
      if (!e.category || seen.has(e.category)) return false;
      seen.add(e.category);
      return true;
    });
  }, [apiCategories]);

  const filters = useMemo(() => {
    const cats = displayCategories.map((c) => ({
      id: `cat-${c.category}`,
      label: c.label,
      isCategory: true as const,
      category: c.category,
    }));
    return [
      ...staticFilters.map((f) => ({ ...f, isCategory: false as const })),
      ...cats.map((c) => ({ ...c, icon: undefined })),
    ];
  }, [displayCategories]);
  const isFilterActive = (item: {
    sort?: string;
    category?: string;
    isCategory?: boolean;
  }) => {
    if (item.isCategory && item.category)
      return activeCategory === item.category;
    if (item.sort) return activeCategory === null && activeSort === item.sort;
    return false;
  };
  const handleFilterClick = (item: {
    sort?: string;
    category?: string;
    isCategory?: boolean;
  }) => {
    if (item.isCategory && item.category) {
      setActiveCategory(
        activeCategory === item.category ? null : item.category,
      );
      setActiveTopic(null);
      setActiveSort("newest");
    } else if (item.sort) {
      setActiveSort(activeSort === item.sort ? "newest" : item.sort);
      setActiveCategory(null);
      setActiveTopic(null);
    }
  };

  return (
    <section>
      <Header />
      <div className="sticky -top-[14px] md:-top-[20px] z-10 flex items-center justify-between pt-2 sm:pb-2.5 border-b border-border/30 bg-background">
        <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide border-b px-4">
          {filters.map((item) => {
            const Icon = item.icon;
            const active = isFilterActive(item);
            return (
              <button
                key={item.id}
                onClick={() => handleFilterClick(item)}
                className={`relative flex items-center gap-2 pb-2.5 font-plus-jakarta font-semibold text-[16px] leading-[20px] tracking-normal whitespace-nowrap transition-all ${
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {item.label}
                {active && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground"
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
      <main className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <section className="flex flex-row items-center justify-between w-full px-4 pt-4 pb-3  bg-background">
          <div
            className="flex items-center gap-2 "
            onClick={() => history.back()}
          >
            <IconLeft className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Search results for
            </p>
          </div>
          <h1 className="text-xl font-semibold text-foreground break-words">
            “{query || "Search"}”
          </h1>
        </section>

        {/* Results list */}
        <section className="flex-1 px-4 pb-3 space-y-3">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center ">
              <YenoLoader className="h-full rounded-none" />
            </div>
          ) : query.length < 2 ? (
            <p className="text-sm text-muted-foreground py-6">
              Type at least 2 characters to search.
            </p>
          ) : markets.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6">
              No markets found for “{query}”.
            </p>
          ) : (
            <div className="space-y-2.5">
              {markets.map((market) => (
                <SearchTradeCard key={market.id} market={market} />
              ))}
            </div>
          )}
        </section>

        {/* Footer section (same as home feed design) */}
        <section className="mt-6">
          <div className="relative rounded-3xl overflow-hidden flex flex-col items-center">
            <img
              src={BackgroundImage}
              alt="Background"
              className="w-full h-full object-cover"
            />
            <div
              className="relative z-10 w-full mx-auto bg-background py-8 px-6 flex flex-col items-center gap-6 overflow-hidden"
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
        </section>
      </main>
    </section>
  );
};

export default Search;
