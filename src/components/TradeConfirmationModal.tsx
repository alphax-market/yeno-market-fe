import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Loader2, ExternalLink, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Market } from "@/data/markets";
import { useWallet } from "@/contexts/WalletContext";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";
import { formatPrice } from "@/lib/utils";

type TradeStatus = "confirming" | "processing" | "success" | "error";

interface TradeConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  market: Market;
  side: "yes" | "no";
  amount: number;
  shares: number;
  avgPrice: number;
  potentialReturn: number;
  outcome?: string;
  orderType?: "market" | "limit";
  limitPrice?: number;
  expiration?: Date | null;
}

export function TradeConfirmationModal({
  isOpen,
  onClose,
  market,
  side,
  amount,
  shares,
  avgPrice,
  potentialReturn,
  outcome,
  orderType = "market",
  limitPrice,
  expiration,
}: TradeConfirmationModalProps) {
  const { user, retrySyncWithBackend, isConnected, isDevUser } = useWallet();
  const [status, setStatus] = useState<TradeStatus>("confirming");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStatus("confirming");
      setTxHash(null);
      setErrorMessage(null);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!user?.id) {
      setErrorMessage("Please connect your wallet first");
      setStatus("error");
      return;
    }

    const marketId = market?.id;
    const isValidUUID = marketId ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(marketId)) : false;
    const isBinaryOutcome = !outcome || outcome.toLowerCase() === "yes" || outcome.toLowerCase() === "no";
    let token = apiClient.getToken();
    if (isValidUUID && isBinaryOutcome && isConnected && user?.id && !token && !isDevUser) {
      const ok = await retrySyncWithBackend();
      if (ok) token = apiClient.getToken();
    }
    const useBackendApi = isValidUUID && isBinaryOutcome && !!token;

    if (useBackendApi) {
      setStatus("processing");
      try {
        const outcomeApi = (outcome || side).toLowerCase() === "yes" ? "YES" : "NO";
        if (orderType === "limit" && limitPrice !== undefined) {
          const order = await apiClient.placeOrder({
            marketId: marketId as string,
            side: "BUY",
            outcome: outcomeApi as "YES" | "NO",
            shares: Number(shares),
            price: Number(limitPrice),
            expiresAt: expiration?.toISOString(),
          });
          setTxHash(order.id);
          setStatus("success");
          toast.success("Limit order placed successfully!");
        } else {
          const trade = await apiClient.executeTrade({
            marketId: marketId as string,
            side: "BUY",
            outcome: outcomeApi as "YES" | "NO",
            shares: Number(shares),
          });
          setTxHash(trade.txSignature || trade.id);
          setStatus("success");
          toast.success("Trade executed successfully!");
        }
      } catch (err) {
        console.error("Trade execution failed:", err);
        setErrorMessage(err instanceof Error ? err.message : "Failed to execute trade");
        setStatus("error");
      }
      return;
    }

    if (isValidUUID && isBinaryOutcome && !apiClient.getToken()) {
      setErrorMessage(
        isConnected
          ? "Trading backend unavailable. Please refresh the page and try again, or check that the API is running."
          : "Connect your wallet so we can sync with the trading backend."
      );
      setStatus("error");
      return;
    }

    if (!isValidUUID && apiClient.getToken()) {
      setErrorMessage("This market is for display only. To trade, open a market from the homepage (markets that load from the API).");
      setStatus("error");
      return;
    }

    setErrorMessage(
      isConnected
        ? "This market is not available for trading. Open a tradable market from the homepage."
        : "Connect your wallet or use Dev Login, then open a tradable market from the homepage to trade."
    );
    setStatus("error");
  };

  const handleRetry = () => {
    setStatus("confirming");
    setTxHash(null);
    setErrorMessage(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="text-lg font-semibold">
              {status === "confirming" && "Confirm Order"}
              {status === "processing" && "Processing..."}
              {status === "success" && "Order Placed!"}
              {status === "error" && "Order Failed"}
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <div className="p-6">
            {/* Status Icon */}
            <div className="flex justify-center mb-6">
              {status === "confirming" && (
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  side === "yes" ? "bg-success/20" : "bg-destructive/20"
                }`}>
                  <span className={`text-2xl font-bold ${
                    side === "yes" ? "text-success" : "text-destructive"
                  }`}>
                    {side === "yes" ? "Yes" : "No"}
                  </span>
                </div>
              )}
              {status === "processing" && (
                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-accent animate-spin" />
                </div>
              )}
              {status === "success" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 15, stiffness: 300 }}
                  className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center"
                >
                  <Check className="w-8 h-8 text-success" />
                </motion.div>
              )}
              {status === "error" && (
                <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
              )}
            </div>

            {/* Market Info */}
            <div className="text-center mb-6">
              <p className="text-sm text-muted-foreground mb-1">{market.category}</p>
              <h4 className="font-semibold line-clamp-2">{market.title}</h4>
              {outcome && (
                <p className="text-sm text-primary mt-1">{outcome}</p>
              )}
            </div>

            {/* Order Details */}
            <div className="bg-secondary/50 rounded-xl p-4 space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Position</span>
                <span className={`font-semibold ${
                  side === "yes" ? "text-success" : "text-destructive"
                }`}>
                  {side === "yes" ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">${amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg Price</span>
                <span className="font-medium">{formatPrice(avgPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shares</span>
                <span className="font-medium">{shares.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm pt-3 border-t border-border">
                <span className="text-muted-foreground">Potential Return</span>
                <span className="font-bold text-success">
                  ${potentialReturn.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Transaction / reference (on success) */}
            {status === "success" && txHash && (
              <div className="bg-muted/50 rounded-lg p-3 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{txHash.startsWith("0x") ? "Transaction" : "Reference"}</span>
                  {txHash.startsWith("0x") && (
                    <a
                      href={`https://solscan.io/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-accent hover:underline"
                    >
                      View on Solscan
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <p className="text-xs font-mono text-muted-foreground mt-1 truncate">
                  {txHash}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            {status === "confirming" && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  className={`flex-1 ${
                    side === "yes"
                      ? "bg-success hover:bg-success/90 text-success-foreground"
                      : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  }`}
                  onClick={handleConfirm}
                >
                  Confirm Order
                </Button>
              </div>
            )}

            {status === "processing" && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Please wait while your order is being processed...
                </p>
              </div>
            )}

            {status === "success" && (
              <div className="space-y-3">
                <Button
                  className="w-full bg-success hover:bg-success/90 text-success-foreground"
                  onClick={onClose}
                >
                  Done
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  {orderType === "limit" 
                    ? "Your limit order is now active. View it in Open Orders on your profile."
                    : "Your position is now active. View it in your portfolio."
                  }
                </p>
              </div>
            )}

            {status === "error" && (
              <div className="space-y-3">
                <p className="text-sm text-center text-muted-foreground mb-4">
                  {errorMessage || "Something went wrong. Please try again."}
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={handleRetry}>
                    Try Again
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
