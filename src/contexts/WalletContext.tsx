import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

export type WalletType = "phantom" | "metamask" | "coinbase" | "google" | null;

interface WalletContextType {
  isConnected: boolean;
  walletAddress: string | null;
  walletType: WalletType;
  balance: number;
  connect: (type: WalletType) => Promise<void>;
  disconnect: () => void;
  isConnecting: boolean;
  user: User | null;
  session: Session | null;
  showDepositModal: boolean;
  setShowDepositModal: (show: boolean) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<WalletType>(null);
  const [balance, setBalance] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [hasShownDepositModal, setHasShownDepositModal] = useState(false);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Only show deposit modal on fresh sign in (not session restoration)
          if (event === 'SIGNED_IN' && !hasShownDepositModal) {
            // Check if this is a fresh OAuth callback by looking at URL
            const isOAuthCallback = window.location.hash.includes('access_token') || 
                                     window.location.search.includes('code=');
            if (isOAuthCallback) {
              setShowDepositModal(true);
              setHasShownDepositModal(true);
            }
          }
          // Fetch user's embedded wallet after auth
          setTimeout(() => {
            fetchUserWallet(session.user.id);
          }, 0);
        } else {
          // Clear wallet state on logout
          setWalletAddress(null);
          setWalletType(null);
          setIsConnected(false);
          setBalance(0);
          setHasShownDepositModal(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserWallet(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [hasShownDepositModal]);

  const fetchUserWallet = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_wallets" as any)
        .select("*")
        .eq("user_id", userId)
        .eq("is_primary", true)
        .maybeSingle();

      if (data && !error) {
        setWalletAddress((data as any).wallet_address);
        setWalletType("google");
        setIsConnected(true);
        setBalance(Math.random() * 100); // Mock balance
      }
    } catch (err) {
      console.error("Error fetching wallet:", err);
    }
  };

  const connect = useCallback(async (type: WalletType) => {
    if (!type) return;
    
    setIsConnecting(true);
    
    try {
      let address: string | null = null;

      if (type === "google") {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/`,
          },
        });
        
        if (error) throw error;
        // Auth state listener will handle the rest
        return;
      } else if (type === "phantom") {
        const phantom = (window as any).phantom?.solana;
        
        if (phantom?.isPhantom) {
          const response = await phantom.connect();
          address = response.publicKey.toString();
        } else {
          window.open("https://phantom.app/", "_blank");
          throw new Error("Phantom wallet not installed");
        }
      } else if (type === "metamask") {
        const ethereum = (window as any).ethereum;
        
        if (ethereum?.isMetaMask) {
          const accounts = await ethereum.request({ method: "eth_requestAccounts" });
          address = accounts[0];
        } else {
          window.open("https://metamask.io/download/", "_blank");
          throw new Error("MetaMask not installed");
        }
      } else if (type === "coinbase") {
        const coinbase = (window as any).coinbaseWalletExtension || (window as any).ethereum?.isCoinbaseWallet;
        
        if (coinbase || (window as any).ethereum?.isCoinbaseWallet) {
          const ethereum = (window as any).ethereum;
          const accounts = await ethereum.request({ method: "eth_requestAccounts" });
          address = accounts[0];
        } else {
          window.open("https://www.coinbase.com/wallet", "_blank");
          throw new Error("Coinbase Wallet not installed");
        }
      }

      if (address) {
        setWalletAddress(address);
        setWalletType(type);
        setIsConnected(true);
        setBalance(Math.random() * 100);
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    // Sign out from Supabase if logged in with Google
    if (user) {
      await supabase.auth.signOut();
    }

    setIsConnected(false);
    setWalletAddress(null);
    setWalletType(null);
    setBalance(0);

    // Disconnect from Phantom if connected
    const phantom = (window as any).phantom?.solana;
    if (phantom?.isConnected) {
      phantom.disconnect();
    }
  }, [user]);

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
        session,
        showDepositModal,
        setShowDepositModal,
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
