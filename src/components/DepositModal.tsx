import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Link2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { toast } from "sonner";
import { CoinbaseIcon } from "@/components/icons/WalletIcons";
import { TransferCryptoModal } from "@/components/TransferCryptoModal";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Crypto network icons for Transfer Crypto option
const CryptoNetworkIcons = () => (
  <div className="flex items-center -space-x-1">
    {/* Ethereum */}
    <div className="w-6 h-6 rounded-full bg-[#627EEA] flex items-center justify-center border-2 border-card">
      <svg className="w-3 h-3" viewBox="0 0 256 417" fill="none">
        <path fill="#fff" d="M127.961 0l-2.795 9.5v275.668l2.795 2.79 127.962-75.638z"/>
        <path fill="#fff" fillOpacity="0.6" d="M127.962 0L0 212.32l127.962 75.639V154.158z"/>
      </svg>
    </div>
    {/* Polygon */}
    <div className="w-6 h-6 rounded-full bg-[#8247E5] flex items-center justify-center border-2 border-card">
      <span className="text-white text-[8px] font-bold">P</span>
    </div>
    {/* Solana */}
    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center border-2 border-card">
      <span className="text-white text-[8px] font-bold">S</span>
    </div>
    {/* Arbitrum */}
    <div className="w-6 h-6 rounded-full bg-[#28A0F0] flex items-center justify-center border-2 border-card">
      <span className="text-white text-[8px] font-bold">A</span>
    </div>
    {/* Base */}
    <div className="w-6 h-6 rounded-full bg-[#0052FF] flex items-center justify-center border-2 border-card">
      <span className="text-white text-[8px] font-bold">B</span>
    </div>
    {/* More indicator */}
    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center border-2 border-card">
      <span className="text-muted-foreground text-[8px] font-bold">+5</span>
    </div>
  </div>
);

export function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const { balance } = useWallet();
  const [isConnectingExchange, setIsConnectingExchange] = useState(false);
  const [showTransferCrypto, setShowTransferCrypto] = useState(false);

  const handleTransferCrypto = () => {
    setShowTransferCrypto(true);
  };

  const handleBackFromTransfer = () => {
    setShowTransferCrypto(false);
  };

  const handleConnectExchange = async () => {
    setIsConnectingExchange(true);
    try {
      // For now, just open Coinbase
      window.open("https://www.coinbase.com/", "_blank");
      toast.success("Opening Coinbase - connect your account");
    } catch (err) {
      toast.error("Failed to connect exchange");
    } finally {
      setIsConnectingExchange(false);
    }
  };

  if (!isOpen) return null;

  // Show Transfer Crypto modal if selected
  if (showTransferCrypto) {
    return (
      <TransferCryptoModal
        isOpen={true}
        onClose={onClose}
        onBack={handleBackFromTransfer}
      />
    );
  }

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
              <div className="text-center flex-1">
                <h2 className="text-xl font-bold">Deposit</h2>
                <p className="text-sm text-muted-foreground">
                  AlphaX Balance: ${balance.toFixed(2)}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-secondary transition-colors absolute right-4 top-4"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Deposit options */}
          <div className="p-4 space-y-3">
            {/* Transfer Crypto */}
            <button
              onClick={handleTransferCrypto}
              className="w-full p-4 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-primary/50 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-amber-500" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-foreground">Transfer Crypto</span>
                    <p className="text-sm text-muted-foreground">No limit • Instant</p>
                  </div>
                </div>
                <CryptoNetworkIcons />
              </div>
            </button>

            {/* Connect Exchange */}
            <button
              onClick={handleConnectExchange}
              disabled={isConnectingExchange}
              className="w-full p-4 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-primary/50 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                    <Link2 className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-foreground">Connect Exchange</span>
                    <p className="text-sm text-muted-foreground">No limit • 2 min</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {isConnectingExchange ? (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  ) : (
                    <div className="w-8 h-8 rounded-full overflow-hidden">
                      <CoinbaseIcon className="w-full h-full" />
                    </div>
                  )}
                </div>
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="p-4 bg-secondary/30 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              More deposit options coming soon
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
