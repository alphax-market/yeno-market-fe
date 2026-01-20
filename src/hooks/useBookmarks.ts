import { useState, useEffect } from "react";

const BOOKMARKS_KEY = "alphax_bookmarks";

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(BOOKMARKS_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...bookmarks]));
  }, [bookmarks]);

  const toggleBookmark = (marketId: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(marketId)) {
        next.delete(marketId);
      } else {
        next.add(marketId);
      }
      return next;
    });
  };

  const isBookmarked = (marketId: string) => bookmarks.has(marketId);

  return { bookmarks, toggleBookmark, isBookmarked };
}
