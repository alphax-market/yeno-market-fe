import { createContext, useContext, useState, useCallback, useEffect, ReactNode, useRef } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { apiClient } from "@/lib/api";

export type WalletType =
  | "phantom"
  | "metamask"
  | "coinbase"
  | "rabby"
  | "wallet_connect"
  | "privy_embedded"
  | null;

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
  showConnectModal: boolean;
  setShowConnectModal: (show: boolean) => void;
  ready: boolean;
  authenticated: boolean;
  isDevUser: boolean;
  loginAsDevUser: () => Promise<void>;
  loginAsNewRandomUser: () => Promise<void>;
  retrySyncWithBackend: () => Promise<boolean>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

function normalizeClientType(wallet: any): string {
  const wt = wallet?.walletClientType ?? wallet?.wallet_client_type ?? "";
  return String(wt).toLowerCase();
}

function normalizeChainType(wallet: any): string {
  const ct = wallet?.chainType ?? wallet?.chain_type ?? "";
  return String(ct).toLowerCase();
}

function isRabbyWallet(wallet: any): boolean {
  const hints: unknown[] = [
    wallet?.name,
    wallet?.connectorName,
    wallet?.connector_name,
    wallet?.walletName,
    wallet?.wallet_name,
    wallet?.metadata?.name,
    wallet?.metadata?.walletName,
    wallet?.metadata?.wallet_name,
  ];

  const text = hints
    .filter(Boolean)
    .map((x) => String(x).toLowerCase())
    .join(" ");

  return text.includes("rabby");
}

function mapPrivyWalletType(wallet: any): WalletType {
  const clientType = normalizeClientType(wallet);

  if (clientType === "privy") return "privy_embedded";
  if (clientType === "phantom") return "phantom";
  if (clientType === "coinbase_wallet") return "coinbase";
  if (clientType === "metamask") return "metamask";

  if (clientType === "wallet_connect") return isRabbyWallet(wallet) ? "rabby" : "wallet_connect";
  if (clientType === "detected_ethereum_wallets") return isRabbyWallet(wallet) ? "rabby" : "wallet_connect";

  return null;
}

/**
 * Desired order: phantom > coinbase > metamask > rabby > embedded
 * filtered by chain
 */
function pickPreferredWalletByChain(privyWallets: any[], chain: "solana" | "ethereum"): any | null {
  if (!privyWallets?.length) return null;

  const isChain = (w: any) => normalizeChainType(w) === chain;

  const phantom = privyWallets.find((w) => normalizeClientType(w) === "phantom" && isChain(w));
  const coinbase = privyWallets.find((w) => normalizeClientType(w) === "coinbase_wallet" && isChain(w));
  const metamask = privyWallets.find((w) => normalizeClientType(w) === "metamask" && isChain(w));

  const wcWallets = privyWallets.filter((w) => normalizeClientType(w) === "wallet_connect" && isChain(w));
  const rabbyWc = wcWallets.find((w) => isRabbyWallet(w));

  const embedded = privyWallets.find((w) => normalizeClientType(w) === "privy" && isChain(w));

  return phantom || coinbase || metamask || rabbyWc || wcWallets[0] || embedded || null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function WalletProvider({ children }: { children: ReactNode }) {
  const { ready, authenticated, user: privyUser, login, logout, getAccessToken } = usePrivy();
  const { wallets: privyWallets } = useWallets();

  // keep a live ref so polling sees the latest array
  const walletsRef = useRef<any[]>([]);
  useEffect(() => {
    walletsRef.current = (privyWallets as any[]) || [];
  }, [privyWallets]);

  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<WalletType>(null);
  const [balance, setBalance] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [user, setUser] = useState<WalletContextType["user"]>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);
  const [isDevUser, setIsDevUser] = useState(false);

  const selectWallet = useCallback((w: any) => {
    setWalletAddress(w.address);
    setWalletType(mapPrivyWalletType(w));
    setIsConnected(true);
  }, []);

  const clearWallet = useCallback(() => {
    setIsConnected(false);
    setWalletAddress(null);
    setWalletType(null);
  }, []);

  /**
   * ✅ Silent wallet bootstrapping WITHOUT opening Privy "Select your wallet" modal:
   * - We rely on Privy embeddedWallets.createOnLogin to create wallets after social login.
   * - We poll for a Solana wallet first.
   * - If not found, fallback to ETH embedded.
   */
  const ensureWalletConnectedSilently = useCallback(async () => {
    // poll up to ~4 seconds for Privy to attach wallets post-login
    for (let i = 0; i < 8; i++) {
      const wallets = walletsRef.current;

      // 1) Prefer SOLANA wallet
      const sol = pickPreferredWalletByChain(wallets, "solana");
      if (sol) {
        selectWallet(sol);
        return;
      }

      // 2) If no Solana, prefer ETH embedded wallet
      const ethEmbedded = wallets.find(
        (w) => normalizeClientType(w) === "privy" && normalizeChainType(w) === "ethereum"
      );
      if (ethEmbedded) {
        selectWallet(ethEmbedded);
        return;
      }

      await sleep(500);
    }

    // final: if anything exists, pick embedded or first; else disconnect
    const wallets = walletsRef.current;
    const embeddedAny = wallets.find((w) => normalizeClientType(w) === "privy");
    if (embeddedAny) selectWallet(embeddedAny);
    else if (wallets[0]) selectWallet(wallets[0]);
    else clearWallet();
  }, [selectWallet, clearWallet]);

  useEffect(() => {
    if (ready && authenticated && privyUser && !hasSynced) {
      syncUserData();
    } else if (!authenticated && !isDevUser) {
      apiClient.setToken(null);
      clearWallet();
      setBalance(0);
      setUser(null);
      setHasSynced(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, authenticated, privyUser, hasSynced, isDevUser]);

  /**
   * You said: "I don’t want any default wallet"
   * => We do NOT auto-pick on wallet list changes.
   * We only select during the post-login bootstrap flow.
   */
  useEffect(() => {
    if (!authenticated) return;

    // If current selected wallet disappeared, clear it silently
    const wallets = (privyWallets as any[]) || [];
    if (walletAddress && !wallets.some((w) => w.address === walletAddress)) {
      clearWallet();
    }
  }, [authenticated, privyWallets, walletAddress, clearWallet]);

  const syncUserData = async () => {
    try {
      // Backend expects its own JWT (from /users/sync), not Privy's access token. Sync to get that token.
      apiClient.setToken(null);
      const wallets = walletsRef.current;
      const firstWallet = wallets?.[0];
      const walletAddr = firstWallet?.address ?? undefined;

      const result = await apiClient.syncUser({
        privyId: privyUser?.id,
        walletAddress: walletAddr,
        email: (privyUser as any)?.email?.address ?? (privyUser as any)?.email,
        displayName: (privyUser as any)?.name ?? undefined,
        avatarUrl: (privyUser as any)?.avatar ?? undefined,
      });

      setUser({
        id: result.user.id,
        email: result.user.email ?? undefined,
        name: result.user.displayName ?? undefined,
        avatar: result.user.avatarUrl ?? undefined,
      });
      setHasSynced(true);

      // ✅ silent wallet selection
      await ensureWalletConnectedSilently();
    } catch {
      setUser({
        id: privyUser?.id,
        email: (privyUser as any)?.email?.address ?? (privyUser as any)?.email,
        name: (privyUser as any)?.name ?? undefined,
        avatar: (privyUser as any)?.avatar ?? undefined,
      });
      setHasSynced(true);
      await ensureWalletConnectedSilently();
    }
  };

  const connect = useCallback(
    async (_type?: WalletType) => {
      setIsConnecting(true);
      try {
        if (!authenticated) {
          setShowConnectModal(true);
          return;
        }
        await ensureWalletConnectedSilently();
      } finally {
        setIsConnecting(false);
      }
    },
    [authenticated, ensureWalletConnectedSilently]
  );

  const loginAsDevUser = useCallback(async () => {
    const result = await apiClient.createRandomDemoUser();
    setUser({
      id: result.user.id,
      email: result.user.email ?? undefined,
      name: result.user.displayName ?? undefined,
      avatar: result.user.avatarUrl ?? undefined,
    });
    setIsDevUser(true);
    setIsConnected(true);
    setHasSynced(true);
  }, []);

  const loginAsNewRandomUser = useCallback(async () => {
    await loginAsDevUser();
  }, [loginAsDevUser]);

  const retrySyncWithBackend = useCallback(async (): Promise<boolean> => {
    if (isDevUser) {
      return !!apiClient.getToken();
    }
    if (!authenticated || !privyUser) return false;
    try {
      await apiClient.syncUser({
        privyId: privyUser.id,
        walletAddress: walletAddress ?? undefined,
        email: (privyUser as any)?.email?.address ?? (privyUser as any)?.email,
        displayName: (privyUser as any)?.name ?? undefined,
        avatarUrl: (privyUser as any)?.avatar ?? undefined,
      });
      return !!apiClient.getToken();
    } catch {
      return false;
    }
  }, [isDevUser, authenticated, privyUser, walletAddress]);

  const disconnect = useCallback(async () => {
    if (isDevUser) {
      apiClient.setToken(null);
      setIsDevUser(false);
      setUser(null);
      setIsConnected(false);
      setHasSynced(false);
      clearWallet();
      return;
    }
    apiClient.setToken(null);
    await logout();
    clearWallet();
    setBalance(0);
    setUser(null);
    setHasSynced(false);
  }, [logout, clearWallet, isDevUser]);

  // Restore dev user session on mount if we have api token and no Privy auth
  useEffect(() => {
    if (!ready || authenticated || isDevUser || hasSynced) return;
    const token = apiClient.getToken();
    if (!token) return;
    apiClient.getCurrentUser()
      .then((u) => {
        if (u?.walletAddress?.startsWith?.("demo_")) {
          setUser({
            id: u.id,
            email: u.email ?? undefined,
            name: u.displayName ?? undefined,
            avatar: u.avatarUrl ?? undefined,
          });
          setIsDevUser(true);
          setIsConnected(true);
          setHasSynced(true);
        }
      })
      .catch(() => {});
  }, [ready, authenticated, isDevUser, hasSynced]);

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
        showConnectModal,
        setShowConnectModal,
        ready,
        authenticated,
        isDevUser,
        loginAsDevUser,
        loginAsNewRandomUser,
        retrySyncWithBackend,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) throw new Error("useWallet must be used within a WalletProvider");
  return context;
}
