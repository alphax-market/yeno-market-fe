import { useEffect, useRef, useCallback, useState } from 'react';
import { apiClient } from '@/lib/api';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

interface WebSocketMessage {
  channel: string;
  data: unknown;
  timestamp: number;
}

type MessageHandler = (data: unknown) => void;

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handlers = useRef<Map<string, Set<MessageHandler>>>(new Map());
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    try {
      ws.current = new WebSocket(WS_URL);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        // If user has admin token, authenticate so admin channels (e.g. admin:markets) work
        const adminToken = apiClient.getAdminToken();
        if (adminToken && ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({ type: 'AUTH', token: adminToken }));
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          if (import.meta.env.DEV) {
            const label = message.channel ?? (message as { type?: string }).type ?? 'message';
            console.log('[WS]', label, message.channel ? (message.data as { type?: string })?.type : '', message.data ?? message);
          }
          const channelHandlers = handlers.current.get(message.channel);
          if (channelHandlers) {
            channelHandlers.forEach((handler) => handler(message.data));
          }
        } catch (err) {
          console.error('WebSocket message parse error:', err);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt to reconnect with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectAttempts.current++;
        
        reconnectTimeout.current = setTimeout(() => {
          connect();
        }, delay);
      };

      ws.current.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('Connection error');
      };
    } catch (err) {
      console.error('WebSocket connection failed:', err);
      setError('Failed to connect');
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    setIsConnected(false);
  }, []);

  const send = useCallback((message: Record<string, unknown>) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  }, []);

  const subscribe = useCallback((channel: string, handler: MessageHandler) => {
    if (!handlers.current.has(channel)) {
      handlers.current.set(channel, new Set());
    }
    handlers.current.get(channel)!.add(handler);

    // Tell server about subscription
    send({ type: 'SUBSCRIBE', channel });

    // Return unsubscribe function
    return () => {
      handlers.current.get(channel)?.delete(handler);
      if (handlers.current.get(channel)?.size === 0) {
        handlers.current.delete(channel);
        send({ type: 'UNSUBSCRIBE', channel });
      }
    };
  }, [send]);

  const subscribeToMarket = useCallback((marketId: string, handler: MessageHandler) => {
    const channels = [
      `market:${marketId}:trades`,
      `market:${marketId}:orders`,
      `market:${marketId}:price`,
      `market:${marketId}:orderbook`,
      `market:${marketId}:comments`,
    ];

    channels.forEach((channel) => {
      if (!handlers.current.has(channel)) {
        handlers.current.set(channel, new Set());
      }
      handlers.current.get(channel)!.add(handler);
    });

    console.log('[WS] Subscribing to market', marketId, channels);
    send({ type: 'SUBSCRIBE_MARKET', marketId });

    return () => {
      channels.forEach((channel) => {
        handlers.current.get(channel)?.delete(handler);
        if (handlers.current.get(channel)?.size === 0) {
          handlers.current.delete(channel);
        }
      });
      send({ type: 'UNSUBSCRIBE_MARKET', marketId });
    };
  }, [send]);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    error,
    subscribe,
    subscribeToMarket,
    send,
    connect,
    disconnect,
  };
}

// Hook for subscribing to a specific market's real-time updates
export function useMarketSubscription(
  marketId: string | null,
  onUpdate: (data: { type: string; [key: string]: unknown }) => void
) {
  const { subscribeToMarket, isConnected } = useWebSocket();

  useEffect(() => {
    if (!marketId || !isConnected) return;

    const unsubscribe = subscribeToMarket(marketId, (data) => {
      onUpdate(data as { type: string; [key: string]: unknown });
    });

    return unsubscribe;
  }, [marketId, isConnected, subscribeToMarket, onUpdate]);

  return { isConnected };
}
