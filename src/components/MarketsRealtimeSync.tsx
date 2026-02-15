import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/useWebSocket";

/**
 * Subscribes to admin:markets WebSocket channel and invalidates markets query
 * when admin adds/edits/deletes markets, so the main page updates in real time.
 */
export function MarketsRealtimeSync() {
  const queryClient = useQueryClient();
  const { subscribe, isConnected } = useWebSocket();

  useEffect(() => {
    if (!isConnected) return;
    const unsubscribe = subscribe("admin:markets", (data) => {
      const payload = data as { type?: string } | undefined;
      if (payload?.type === "MARKETS_UPDATED" || payload?.type === "MARKET_ACTIVITY") {
        queryClient.invalidateQueries({ queryKey: ["markets"] });
      }
    });
    return unsubscribe;
  }, [isConnected, subscribe, queryClient]);

  return null;
}
