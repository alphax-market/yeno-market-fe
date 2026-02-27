import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/useWebSocket";
import { apiClient } from "@/lib/api";

/**
 * When user is admin (has token), subscribes to admin:markets WebSocket channel
 * and invalidates markets query when admin adds/edits/deletes markets.
 * Non-admin users never subscribe, so they don't get "Admin subscription requires authentication".
 */
export function MarketsRealtimeSync() {
  const queryClient = useQueryClient();
  const { subscribe, isConnected } = useWebSocket();

  useEffect(() => {
    if (!isConnected) return;
    // Only subscribe to admin channel when authenticated as admin (AUTH sent on connect from useWebSocket)
    if (!apiClient.getAdminToken()) return;
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
