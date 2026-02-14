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
  ready: boolean;
  authenticated: boolean;
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
  const [hasSynced, setHasSynced] = useState(false);

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
    } else if (!authenticated) {
      clearWallet();
      setBalance(0);
      setUser(null);
      setHasSynced(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, authenticated, privyUser, hasSynced]);

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
      const token = await getAccessToken();
      if (token) apiClient.setToken(token);

      // verify user in backend (optional, but keeps your DB wallets in sync)
      if (token) {
        const data = await apiClient.verifyToken(token);
        setUser({
          id: data.user.id,
          email: data.user.email || undefined,
          name: data.user.name || undefined,
          avatar: data.user.avatar || undefined,
        });
      } else {
        setUser({
          id: privyUser?.id,
          email: privyUser?.email?.address,
          name: privyUser?.name ?? undefined,
          avatar: privyUser?.avatar ?? undefined,
        });
      }

      setHasSynced(true);

      // ✅ silent wallet selection
      await ensureWalletConnectedSilently();
    } catch {
      setUser({
        id: privyUser?.id,
        email: privyUser?.email?.address,
        name: privyUser?.name ?? undefined,
        avatar: privyUser?.avatar ?? undefined,
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
          await login();
          // syncUserData will run from effect and connect silently
          return;
        }
        await ensureWalletConnectedSilently();
      } finally {
        setIsConnecting(false);
      }
    },
    [authenticated, login, ensureWalletConnectedSilently]
  );

  const disconnect = useCallback(async () => {
    await logout();
    clearWallet();
    setBalance(0);
    setUser(null);
    setHasSynced(false);
  }, [logout, clearWallet]);

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
