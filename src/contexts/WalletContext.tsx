import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { apiClient } from "@/lib/api";

export type WalletType = "phantom" | "metamask" | "coinbase" | "privy_embedded" | null;

interface WalletContextType {
  isConnected: boolean;
  walletAddress: string | null;
  walletType: WalletType;
  balance: number;
  connect: (type?: WalletType) => Promise<void>;
  disconnect: () => void;
  isConnecting: boolean;
  user: {
    id?: string;
    email?: string;
    name?: string;
    avatar?: string;
  } | null;
  showDepositModal: boolean;
  setShowDepositModal: (show: boolean) => void;
  ready: boolean;
  authenticated: boolean;
  /** Dev bypass: login without wallet. Creates demo user and sets API token. */
  loginAsDevUser: () => Promise<void>;
  /** Create another random demo user and log in as them (for testing second side of trade). */
  loginAsNewRandomUser: () => Promise<void>;
  /** True when logged in via dev/demo (no wallet). */
  isDevUser: boolean;
  /** Retry syncing with trading backend (e.g. after Privy login). Call when user is connected but trades fail for missing token. */
  retrySyncWithBackend: () => Promise<boolean>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const {
    ready,
    authenticated,
    user: privyUser,
    login,
    logout,
  } = usePrivy();
  const { wallets: privyWallets } = useWallets();

  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<WalletType>(null);
  const [balance, setBalance] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [user, setUser] = useState<WalletContextType["user"]>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);
  const [isDevUser, setIsDevUser] = useState(false);

  // Sync user and wallet data with backend when authenticated
  useEffect(() => {
    if (ready && authenticated && privyUser && !hasSynced) {
      syncUserData();
    } else if (!authenticated && !isDevUser) {
      // Clear state on logout (only if not dev user; dev user is cleared in disconnect)
      setIsConnected(false);
      setWalletAddress(null);
      setWalletType(null);
      setBalance(0);
      setUser(null);
      setHasSynced(false);
    }
  }, [ready, authenticated, privyUser, hasSynced, isDevUser]);

  // Update wallet address when Privy wallets change
  useEffect(() => {
    if (privyWallets && privyWallets.length > 0) {
      const primaryWallet = privyWallets.find((w) => w.walletClientType === 'privy') || privyWallets[0];
      if (primaryWallet) {
        setWalletAddress(primaryWallet.address);
        setIsConnected(true);
        
        // Determine wallet type
        if (primaryWallet.walletClientType === 'privy') {
          setWalletType('privy_embedded');
        } else if (primaryWallet.walletClientType === 'metamask') {
          setWalletType('metamask');
        } else if (primaryWallet.walletClientType === 'coinbase_wallet') {
          setWalletType('coinbase');
        } else if (primaryWallet.walletClientType === 'phantom') {
          setWalletType('phantom');
        }
      }
    } else if (!authenticated) {
      setWalletAddress(null);
      setIsConnected(false);
      setWalletType(null);
    }
  }, [privyWallets, authenticated]);

  const syncUserData = async () => {
    try {
      const primaryWallet = privyWallets?.find((w) => w.walletClientType === 'privy') || privyWallets?.[0];
      const walletAddress = primaryWallet?.address;

      // Sync with yeno-market-view backend to get JWT (required for trades)
      const data = await apiClient.syncUser({
        privyId: privyUser?.id,
        walletAddress: walletAddress || undefined,
        email: privyUser?.email?.address,
        displayName: privyUser?.name ?? undefined,
      });

      setUser({
        id: data.user.id,
        email: data.user.email || undefined,
        name: data.user.displayName ?? privyUser?.name ?? undefined,
        avatar: data.user.avatarUrl ?? undefined,
      });

      if (primaryWallet) {
        setWalletAddress(primaryWallet.address);
        setWalletType(primaryWallet.walletClientType === 'privy' ? 'privy_embedded' : (primaryWallet.walletClientType as WalletType));
        setIsConnected(true);
      }

      setHasSynced(true);
    } catch (error) {
      const isNetworkError =
        error instanceof TypeError && (error.message === "Failed to fetch" || error.message === "Network error");
      if (isNetworkError) {
        setUser({
          id: privyUser?.id,
          email: privyUser?.email?.address,
          name: privyUser?.name ?? undefined,
          avatar: privyUser?.avatar ?? undefined,
        });
      } else {
        console.error("Error syncing user data:", error);
      }
      setHasSynced(true);
    }
  };

  const retrySyncWithBackend = useCallback(async (): Promise<boolean> => {
    if (!authenticated || !privyUser) return false;
    try {
      await syncUserData();
      return !!apiClient.getToken();
    } catch {
      return false;
    }
  }, [authenticated, privyUser]);

  const connect = useCallback(async (type?: WalletType) => {
    setIsConnecting(true);
    
    try {
      if (!authenticated) {
        // Login with Privy - it will handle all wallet connections
        await login();
      } else {
        // If already authenticated, Privy handles wallet connections through its UI
        // This is typically handled by Privy's built-in wallet connection flow
        console.log("Already authenticated. Use Privy's wallet connection UI.");
      }
    } catch (error) {
      console.error("Failed to connect:", error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [authenticated, login]);

  const loginAsDevUser = useCallback(async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
      const res = await fetch(`${API_BASE}/users/demo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 1 }),
      });
      const json = await res.json();
      if (!json.success || !json.data?.length) throw new Error("Failed to create demo user");
      const demoUser = json.data[0];
      const tokenRes = await fetch(`${API_BASE}/users/demo-token/${demoUser.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const tokenJson = await tokenRes.json();
      if (!tokenJson.success || !tokenJson.data?.token) throw new Error("Failed to get demo token");
      apiClient.setToken(tokenJson.data.token);
      setUser({
        id: demoUser.id,
        email: demoUser.email ?? undefined,
        name: demoUser.displayName ?? "Dev User",
        avatar: demoUser.avatarUrl ?? undefined,
      });
      setWalletAddress(`dev:${demoUser.id.slice(0, 8)}`);
      setWalletType(null);
      setIsConnected(true);
      setIsDevUser(true);
    } catch (error) {
      console.error("Dev login failed:", error);
      throw error;
    }
  }, []);

  const loginAsNewRandomUser = useCallback(async () => {
    try {
      const data = await apiClient.createRandomDemoUser();
      setUser({
        id: data.user.id,
        email: data.user.email ?? undefined,
        name: data.user.displayName ?? "Demo User",
        avatar: data.user.avatarUrl ?? undefined,
      });
      setWalletAddress(`dev:${data.user.id.slice(0, 8)}`);
      setWalletType(null);
      setIsConnected(true);
      setIsDevUser(true);
    } catch (error) {
      console.error("New random user login failed:", error);
      throw error;
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (isDevUser) {
      apiClient.setToken(null);
      setIsConnected(false);
      setWalletAddress(null);
      setWalletType(null);
      setBalance(0);
      setUser(null);
      setHasSynced(false);
      setIsDevUser(false);
      return;
    }
    try {
      await logout();
      setIsConnected(false);
      setWalletAddress(null);
      setWalletType(null);
      setBalance(0);
      setUser(null);
      setHasSynced(false);
    } catch (error) {
      console.error("Failed to disconnect:", error);
      throw error;
    }
  }, [logout, isDevUser]);

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        walletAddress,
        walletType,
        balance,
        connect,
        disconnect,
        isConnecting,
        user,
        showDepositModal,
        setShowDepositModal,
        ready,
        authenticated,
        loginAsDevUser,
        loginAsNewRandomUser,
        isDevUser,
        retrySyncWithBackend,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}

/** Use when Privy is not configured (e.g. VITE_PRIVY_APP_ID empty). Only Dev Login is available. */
export function WalletProviderDevOnly({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<WalletContextType["user"]>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isDevUser, setIsDevUser] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);

  const loginAsDevUser = useCallback(async () => {
    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
    const res = await fetch(`${API_BASE}/users/demo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count: 1 }),
    });
    const json = await res.json();
    if (!json.success || !json.data?.length) throw new Error("Failed to create demo user");
    const demoUser = json.data[0];
    const tokenRes = await fetch(`${API_BASE}/users/demo-token/${demoUser.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const tokenJson = await tokenRes.json();
    if (!tokenJson.success || !tokenJson.data?.token) throw new Error("Failed to get demo token");
    apiClient.setToken(tokenJson.data.token);
    setUser({
      id: demoUser.id,
      email: demoUser.email ?? undefined,
      name: demoUser.displayName ?? "Dev User",
      avatar: demoUser.avatarUrl ?? undefined,
    });
    setWalletAddress(`dev:${demoUser.id.slice(0, 8)}`);
    setIsConnected(true);
    setIsDevUser(true);
  }, []);

  const loginAsNewRandomUser = useCallback(async () => {
    const data = await apiClient.createRandomDemoUser();
    setUser({
      id: data.user.id,
      email: data.user.email ?? undefined,
      name: data.user.displayName ?? "Demo User",
      avatar: data.user.avatarUrl ?? undefined,
    });
    setWalletAddress(`dev:${data.user.id.slice(0, 8)}`);
    setIsConnected(true);
    setIsDevUser(true);
  }, []);

  const disconnect = useCallback(() => {
    apiClient.setToken(null);
    setUser(null);
    setWalletAddress(null);
    setIsConnected(false);
    setIsDevUser(false);
  }, []);

  const value: WalletContextType = {
    isConnected,
    walletAddress,
    walletType: null,
    balance: 0,
    connect: async () => {},
    disconnect,
    isConnecting: false,
    user,
    showDepositModal,
    setShowDepositModal,
    ready: true,
    authenticated: false,
    loginAsDevUser,
    loginAsNewRandomUser,
    isDevUser,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}
