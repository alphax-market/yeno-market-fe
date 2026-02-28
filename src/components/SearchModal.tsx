import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Tv, Pin, ChevronRight } from "lucide-react";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { useSearchMarkets, useCategories } from "@/hooks/useMarkets";
import type { Market } from "@/data/markets";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUGGESTED_TOPICS = ["IPL 2026", "T20 World cup", "Cricket", "Politics", "Crypto"];

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const { data: searchResults } = useSearchMarkets(query);
  const { data: categoriesData } = useCategories();
  const apiCategories = categoriesData ?? [];

  const events = (searchResults ?? []).slice(0, 4);
  const allCategoryLabels =
  apiCategories
    .map((c: { category?: string; name?: string; slug?: string }) => {
      const raw = c.name ?? c.category ?? c.slug ?? "";
      if (!raw) return "";
      const label = raw.charAt(0).toUpperCase() + raw.slice(1);
      return label;
    })
    .filter(Boolean) as string[];

// Topics will always come from categories, optionally filtered by query
const topics =
  query.trim().length >= 2
    ? allCategoryLabels
        .filter((label) =>
          label.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 5)
    : allCategoryLabels.slice(0, 5);

  const handleNavigateToSearch = useCallback(
    (q: string) => {
      const trimmed = (q || query).trim();
      if (trimmed) {
        navigate(`/search?q=${encodeURIComponent(trimmed)}`);
        onClose();
        setQuery("");
      }
    },
    [navigate, onClose, query]
  );

  const handleEventClick = (market: Market & { id: string }) => {
    navigate(`/market/${market.id}`);
    onClose();
    setQuery("");
  };

  const handleTopicClick = (topic: string) => {
    setQuery(topic);
    handleNavigateToSearch(topic);
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="rounded-t-3xl border-b-0 max-h-[90vh] flex flex-col" aria-describedby="search-drawer-desc">
        <DrawerTitle className="sr-only">Search</DrawerTitle>
        <DrawerDescription id="search-drawer-desc" className="sr-only">Search events and topics.</DrawerDescription>
        <div className="flex flex-col px-4 pt-2 pb-6 overflow-auto">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search events and topics"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && handleNavigateToSearch(query)
              }
              className="flex-1 min-w-0 bg-transparent text-foreground font-medium placeholder:text-muted-foreground focus:outline-none text-base"
              autoFocus
            />
          </div>

          <div className="mt-6">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Events
            </h3>
            <div className="space-y-1">
              {events.length === 0 && query.trim().length < 2 ? (
                <p className="text-sm text-muted-foreground py-2">
                  Type to search events
                </p>
              ) : events.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No events found
                </p>
              ) : (
                events.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleEventClick(m as Market & { id: string })}
                    className="w-full flex items-center gap-3 px-2 py-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <Tv className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm font-normal text-foreground line-clamp-2 flex-1">
                      {m.title}
                    </span>
                  </button>
                ))
              )}
              {events.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleNavigateToSearch(query)}
                  className="w-full flex items-center gap-1 px-2 py-2 text-sm font-medium text-foreground hover:underline"
                >
                  View More
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="border-t border-border my-4" />

          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Topics
            </h3>
            <div className="space-y-1">
              {topics.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => handleTopicClick(topic)}
                  className="w-full flex items-center gap-3 px-2 py-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                >
                  <Pin className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm font-normal text-foreground">
                    {topic}
                  </span>
                </button>
              ))}
              {topics.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleNavigateToSearch(query)}
                  className="w-full flex items-center gap-1 px-2 py-2 text-sm font-medium text-foreground hover:underline"
                >
                  View More
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
