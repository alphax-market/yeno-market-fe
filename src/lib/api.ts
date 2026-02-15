// API client for Market View backend communication
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Types
export interface Market {
  id: string;
  title: string;
  description?: string;
  category: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'RESOLVED' | 'CANCELLED';
  resolution: 'PENDING' | 'YES' | 'NO' | 'INVALID';
  yesPrice: number;
  noPrice: number;
  volume: number;
  liquidity: number;
  endDate: string;
  isLive: boolean;
  trendingScore?: number;
  imageUrl?: string;
  resolutionSource?: string;
  createdAt: string;
}

export interface MarketDetail extends Market {
  _count: {
    trades: number;
    comments: number;
    positions: number;
  };
  userPosition?: Position[];
}

export interface PriceSnapshot {
  yesPrice: number;
  noPrice: number;
  volume: number;
  timestamp: string;
}

export interface Trade {
  id: string;
  marketId: string;
  userId: string;
  side: 'BUY' | 'SELL';
  outcome: 'YES' | 'NO';
  shares: number;
  price: number;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  txSignature?: string;
  createdAt: string;
  user?: {
    id: string;
    displayName?: string;
    avatarUrl?: string;
  };
  market?: {
    id: string;
    title: string;
    category: string;
  };
}

export interface Position {
  id: string;
  marketId: string;
  userId: string;
  outcome: 'YES' | 'NO';
  shares: number;
  avgPrice: number;
  totalInvested: number;
  market?: {
    id: string;
    title: string;
    category: string;
    status: string;
    resolution: string;
    yesPrice: number;
    noPrice: number;
    endDate: string;
  };
}

export interface Order {
  id: string;
  marketId: string;
  userId: string;
  side: 'BUY' | 'SELL';
  outcome: 'YES' | 'NO';
  price: number;
  shares: number;
  filledShares: number;
  status: 'OPEN' | 'PARTIAL' | 'FILLED' | 'CANCELLED' | 'EXPIRED';
  expiresAt?: string;
  createdAt: string;
  market?: {
    id: string;
    title: string;
    yesPrice: number;
    noPrice: number;
  };
}

export interface MarketComment {
  id: string;
  marketId: string;
  userId: string;
  content: string;
  parentId?: string;
  createdAt: string;
  user: {
    id: string;
    displayName?: string;
    avatarUrl?: string;
  };
  replies?: MarketComment[];
  totalReplies?: number;
}

export interface ApiUser {
  id: string;
  privyId?: string;
  walletAddress?: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt: string;
  _count?: {
    positions: number;
    trades: number;
    comments: number;
  };
}

export interface Orderbook {
  yes: {
    bids: { price: number; shares: number }[];
    asks: { price: number; shares: number }[];
  };
  no: {
    bids: { price: number; shares: number }[];
    asks: { price: number; shares: number }[];
  };
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { message: string; code?: string };
  cached?: boolean;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('api_token', token);
    } else {
      localStorage.removeItem('api_token');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('api_token');
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data: ApiResponse<T> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'An error occurred');
    }

    return data.data as T;
  }

  async verifyToken(accessToken: string) {
    return this.request<{ user: any; wallets: any[] }>('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ accessToken }),
    });
  }
  
  async getOnrampUrl(data: { destinationAddress: string }) {
    return this.request<{ url: string }>("/onramp/url", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ===== Markets =====
  async getMarkets(params: {
    status?: string;
    category?: string;
    sort?: 'trending' | 'newest' | 'ending_soon' | 'volume' | 'liquidity' | 'hot';
    search?: string;
    cursor?: string;
    limit?: number;
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.set(key, String(value));
    });
    const query = searchParams.toString();
    return this.request<{
      markets: Market[];
      nextCursor: string | null;
      hasMore: boolean;
    }>(`/markets${query ? `?${query}` : ''}`);
  }

  async getTrendingMarkets() {
    return this.request<Market[]>('/markets/trending');
  }

  async getEndingSoonMarkets() {
    return this.request<Market[]>('/markets/ending-soon');
  }

  async getNewMarkets() {
    return this.request<Market[]>('/markets/new');
  }

  async searchMarkets(query: string) {
    return this.request<Market[]>(`/markets/search?q=${encodeURIComponent(query)}`);
  }

  async getMarket(id: string) {
    return this.request<MarketDetail>(`/markets/${id}`);
  }

  async getMarketChart(id: string, range: '1h' | '6h' | '24h' | '7d' | '30d' | 'all' = '24h') {
    return this.request<PriceSnapshot[]>(`/markets/${id}/chart?range=${range}`);
  }

  async getMarketTrades(id: string, cursor?: string, limit = 20) {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set('cursor', cursor);
    return this.request<{
      trades: Trade[];
      nextCursor: string | null;
      hasMore: boolean;
    }>(`/markets/${id}/trades?${params}`);
  }

  async getMarketPositions(id: string, limit = 20) {
    const params = new URLSearchParams({ limit: String(limit) });
    return this.request<Array<{
      id: string;
      outcome: string;
      shares: number;
      avgPrice: number;
      totalInvested: number;
      user: { id: string; displayName?: string; walletAddress?: string };
    }>>(`/markets/${id}/positions?${params}`);
  }

  async getCategories() {
    return this.request<{ category: string; _count: { id: number } }[]>('/markets/meta/categories');
  }

  // ===== Comments =====
  async getComments(marketId: string, cursor?: string) {
    const query = cursor ? `?cursor=${cursor}` : '';
    return this.request<{
      comments: MarketComment[];
      nextCursor: string | null;
      hasMore: boolean;
    }>(`/comments/market/${marketId}${query}`);
  }

  async createComment(marketId: string, content: string, parentId?: string) {
    return this.request<MarketComment>(`/comments/market/${marketId}`, {
      method: 'POST',
      body: JSON.stringify({ content, parentId }),
    });
  }

  async deleteComment(id: string) {
    return this.request<{ message: string }>(`/comments/${id}`, { method: 'DELETE' });
  }

  async reportComment(id: string, reason: string, details?: string) {
    return this.request<{ reported: boolean }>(`/comments/${id}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason, details }),
    });
  }

  // ===== Users =====
  async syncUser(data: {
    privyId?: string;
    walletAddress?: string;
    email?: string;
    displayName?: string;
  }) {
    const result = await this.request<{ user: ApiUser; token: string }>('/users/sync', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(result.token);
    return result;
  }

  async getCurrentUser() {
    return this.request<ApiUser>('/users/me');
  }

  async getMyPositions() {
    return this.request<Position[]>('/users/me/positions');
  }

  async getMyTrades(cursor?: string) {
    const query = cursor ? `?cursor=${cursor}` : '';
    return this.request<{
      trades: Trade[];
      nextCursor: string | null;
      hasMore: boolean;
    }>(`/users/me/trades${query}`);
  }

  async getMyOrders(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request<Order[]>(`/users/me/orders${query}`);
  }

  // ===== Trading =====
  async placeOrder(data: {
    marketId: string;
    side: 'BUY' | 'SELL';
    outcome: 'YES' | 'NO';
    shares: number;
    price: number;
    expiresAt?: string;
  }) {
    return this.request<Order>('/trades/order', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async executeTrade(data: {
    marketId: string;
    side: 'BUY' | 'SELL';
    outcome: 'YES' | 'NO';
    shares: number;
    txSignature?: string;
  }) {
    return this.request<Trade>('/trades/execute', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async cancelOrder(id: string) {
    return this.request<{ message: string }>(`/trades/order/${id}`, { method: 'DELETE' });
  }

  async getOrderbook(marketId: string) {
    return this.request<Orderbook>(`/trades/orderbook/${marketId}`);
  }

  /** Create one random demo user and return user + token (DEV). */
  async createRandomDemoUser() {
    const result = await this.request<{ user: ApiUser; token: string }>('/users/demo-random', {
      method: 'POST',
    });
    this.setToken(result.token);
    return result;
  }

  /** Create an empty test market (no trades/orders) for testing orderbook/graph/price updates. */
  async createEmptyTestEvent() {
    return this.request<Market>('/markets/empty-event', {
      method: 'POST',
    });
  }

  // ===== Admin API =====
  setAdminToken(token: string | null) {
    if (token) sessionStorage.setItem('admin_token', token);
    else sessionStorage.removeItem('admin_token');
  }

  getAdminToken(): string | null {
    return sessionStorage.getItem('admin_token');
  }

  private async adminRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getAdminToken();
    if (!token) throw new Error('Admin not logged in');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...((options.headers as Record<string, string>) || {}),
    };
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.error?.message || 'Admin request failed');
    return data.data as T;
  }

  async adminLogin(password: string) {
    const response = await fetch(`${API_BASE_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.error?.message || 'Invalid password');
    const token = data.data.token as string;
    this.setAdminToken(token);
    return { token };
  }

  async adminGetMarkets(status?: string) {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.adminRequest<Market[]>(`/admin/markets${q}`);
  }

  async adminCreateMarket(data: {
    title: string;
    description?: string;
    category?: string;
    yesPrice?: number;
    noPrice?: number;
    liquidity?: number;
    endDate: string;
    trendingScore?: number;
    isLive?: boolean;
    imageUrl?: string;
    resolutionSource?: string;
    resolutionSourceUrl?: string;
  }) {
    return this.adminRequest<Market>('/admin/markets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async adminUpdateMarket(id: string, data: Partial<{
    title: string;
    description?: string;
    category?: string;
    yesPrice?: number;
    noPrice?: number;
    liquidity?: number;
    endDate: string;
    trendingScore?: number;
    isLive?: boolean;
    imageUrl?: string;
    resolutionSource?: string;
    resolutionSourceUrl?: string;
  }>) {
    return this.adminRequest<Market>(`/admin/markets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async adminDeleteMarket(id: string, hard = false) {
    return this.adminRequest<{ deleted: boolean; marketId: string }>(`/admin/markets/${id}?hard=${hard}`);
  }

  async adminPauseMarket(id: string) {
    return this.adminRequest<Market>(`/admin/markets/${id}/pause`, { method: 'POST' });
  }

  async adminActivateMarket(id: string) {
    return this.adminRequest<Market>(`/admin/markets/${id}/activate`, { method: 'POST' });
  }

  async adminResolveMarket(id: string, resolution: 'YES' | 'NO' | 'INVALID') {
    return this.adminRequest<Market>(`/admin/markets/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolution }),
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;

