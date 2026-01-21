import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useWallet, WalletType } from "@/contexts/WalletContext";
import { toast } from "sonner";
import { PhantomIcon, MetaMaskIcon, CoinbaseIcon } from "@/components/icons/WalletIcons";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const wallets = [
  {
    id: "phantom" as WalletType,
    name: "Phantom",
    description: "Popular Solana wallet",
    Icon: PhantomIcon,
  },
  {
    id: "metamask" as WalletType,
    name: "MetaMask",
    description: "Ethereum & EVM compatible",
    Icon: MetaMaskIcon,
  },
  {
    id: "coinbase" as WalletType,
    name: "Coinbase Wallet",
    description: "By Coinbase Exchange",
    Icon: CoinbaseIcon,
  },
];

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { connect, isConnecting } = useWallet();
  const [connectingWallet, setConnectingWallet] = useState<WalletType>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (walletType: WalletType) => {
    setConnectingWallet(walletType);
    setError(null);
    
    try {
      await connect(walletType);
      toast.success(`Connected to ${walletType === 'google' ? 'Google' : wallets.find(w => w.id === walletType)?.name}`);
      onClose();
    } catch (err: any) {
      const errorMessage = err.message || "Failed to connect wallet";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setConnectingWallet(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md bg-card border border-border rounded-2xl overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-background font-bold text-sm">YN</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold">YeNo</h2>
                  <p className="text-sm text-muted-foreground">Login to your account</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Wallet options */}
          <div className="p-4 space-y-3">
            {/* Crypto wallets first */}
            {wallets.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => handleConnect(wallet.id)}
                disabled={isConnecting}
                className="w-full p-4 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-primary/50 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg">
                      <wallet.Icon className="w-full h-full" />
                    </div>
                    <div className="text-left">
                      <span className="font-semibold text-foreground">{wallet.name}</span>
                      <p className="text-sm text-muted-foreground">{wallet.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    {connectingWallet === wallet.id ? (
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    ) : (
                      <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                  </div>
                </div>
              </button>
            ))}

            {/* Divider */}
            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Google option at bottom */}
            <button
              onClick={() => handleConnect('google')}
              disabled={isConnecting}
              className="w-full p-4 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-primary/50 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-foreground">Continue with Google</span>
                    <p className="text-sm text-muted-foreground">Sign in & get an embedded wallet</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  {connectingWallet === 'google' ? (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  ) : (
                    <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                </div>
              </div>
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="mx-4 mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Footer */}
          <div className="p-4 bg-secondary/30 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              By connecting, you agree to our{" "}
              <a href="#" className="text-primary hover:underline">Terms of Service</a>
              {" "}and{" "}
              <a href="#" className="text-primary hover:underline">Privacy Policy</a>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
