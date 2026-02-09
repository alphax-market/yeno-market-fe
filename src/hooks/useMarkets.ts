import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { apiClient, Market, MarketDetail, PriceSnapshot, Trade, Position, Order, MarketComment } from '@/lib/api';

// ===== Market Hooks =====

export function useMarkets(params: {
  status?: string;
  category?: string;
  sort?: 'trending' | 'newest' | 'ending_soon' | 'volume' | 'liquidity';
  search?: string;
  limit?: number;
} = {}) {
  return useInfiniteQuery({
    queryKey: ['markets', params],
    queryFn: ({ pageParam }) => apiClient.getMarkets({ ...params, cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useTrendingMarkets() {
  return useQuery({
    queryKey: ['markets', 'trending'],
    queryFn: () => apiClient.getTrendingMarkets(),
    staleTime: 30 * 1000,
  });
}

export function useEndingSoonMarkets() {
  return useQuery({
    queryKey: ['markets', 'ending-soon'],
    queryFn: () => apiClient.getEndingSoonMarkets(),
    staleTime: 60 * 1000,
  });
}

export function useNewMarkets() {
  return useQuery({
    queryKey: ['markets', 'new'],
    queryFn: () => apiClient.getNewMarkets(),
    staleTime: 60 * 1000,
  });
}

export function useSearchMarkets(query: string) {
  return useQuery({
    queryKey: ['markets', 'search', query],
    queryFn: () => apiClient.searchMarkets(query),
    enabled: query.length >= 2,
    staleTime: 60 * 1000,
  });
}

export function useMarket(id: string) {
  return useQuery({
    queryKey: ['market', id],
    queryFn: () => apiClient.getMarket(id),
    enabled: !!id,
    staleTime: 15 * 1000,
  });
}

export function useMarketChart(id: string, range: '1h' | '6h' | '24h' | '7d' | '30d' | 'all' = '24h') {
  return useQuery({
    queryKey: ['market', id, 'chart', range],
    queryFn: () => apiClient.getMarketChart(id, range),
    enabled: !!id,
    staleTime: range === '1h' ? 10 * 1000 : 60 * 1000,
    refetchInterval: range === '1h' ? 10 * 1000 : range === '24h' ? 30 * 1000 : false,
  });
}

export function useMarketTrades(id: string) {
  return useInfiniteQuery({
    queryKey: ['market', id, 'trades'],
    queryFn: ({ pageParam }) => apiClient.getMarketTrades(id, pageParam),
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
    enabled: !!id,
  });
}

export function useMarketPositions(id: string) {
  return useQuery({
    queryKey: ['market', id, 'positions'],
    queryFn: () => apiClient.getMarketPositions(id),
    enabled: !!id,
    staleTime: 15 * 1000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.getCategories(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ===== Comment Hooks =====

export function useComments(marketId: string) {
  return useInfiniteQuery({
    queryKey: ['comments', marketId],
    queryFn: ({ pageParam }) => apiClient.getComments(marketId, pageParam),
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
    enabled: !!marketId,
  });
}

export function useCreateComment(marketId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ content, parentId }: { content: string; parentId?: string }) =>
      apiClient.createComment(marketId, content, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', marketId] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}

export function useReportComment() {
  return useMutation({
    mutationFn: ({ id, reason, details }: { id: string; reason: string; details?: string }) =>
      apiClient.reportComment(id, reason, details),
  });
}

// ===== User Hooks =====

export function useSyncUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { privyId?: string; walletAddress?: string; email?: string; displayName?: string }) =>
      apiClient.syncUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => apiClient.getCurrentUser(),
    enabled: !!apiClient.getToken(),
    retry: false,
  });
}

export function useMyPositions() {
  return useQuery({
    queryKey: ['user', 'positions'],
    queryFn: () => apiClient.getMyPositions(),
    enabled: !!apiClient.getToken(),
  });
}

export function useMyTrades() {
  return useInfiniteQuery({
    queryKey: ['user', 'trades'],
    queryFn: ({ pageParam }) => apiClient.getMyTrades(pageParam),
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
    enabled: !!apiClient.getToken(),
  });
}

export function useMyOrders(status?: string) {
  return useQuery({
    queryKey: ['user', 'orders', status],
    queryFn: () => apiClient.getMyOrders(status),
    enabled: !!apiClient.getToken(),
  });
}

// ===== Trading Hooks =====

export function usePlaceOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: {
      marketId: string;
      side: 'BUY' | 'SELL';
      outcome: 'YES' | 'NO';
      shares: number;
      price: number;
      expiresAt?: string;
    }) => apiClient.placeOrder(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['trades', 'orderbook', variables.marketId] });
      queryClient.invalidateQueries({ queryKey: ['market', variables.marketId] });
    },
  });
}

export function useExecuteTrade() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: {
      marketId: string;
      side: 'BUY' | 'SELL';
      outcome: 'YES' | 'NO';
      shares: number;
      txSignature?: string;
    }) => apiClient.executeTrade(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['market', variables.marketId] });
      queryClient.invalidateQueries({ queryKey: ['market', variables.marketId, 'trades'] });
      queryClient.invalidateQueries({ queryKey: ['market', variables.marketId, 'positions'] });
      queryClient.invalidateQueries({ queryKey: ['trades', 'orderbook', variables.marketId] });
      queryClient.invalidateQueries({ queryKey: ['user', 'positions'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'trades'] });
      queryClient.invalidateQueries({ queryKey: ['markets'] });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.cancelOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'orders'] });
    },
  });
}

export function useOrderbook(marketId: string) {
  return useQuery({
    queryKey: ['trades', 'orderbook', marketId],
    queryFn: () => apiClient.getOrderbook(marketId),
    enabled: !!marketId,
    staleTime: 0, // Always refetch after invalidation (e.g. after trade from market detail)
    refetchInterval: 3 * 1000, // Poll every 3s so orderbook stays in sync
  });
}
