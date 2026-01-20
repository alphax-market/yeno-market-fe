import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Loader2, ExternalLink, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Market } from "@/data/markets";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@/contexts/WalletContext";
import { toast } from "sonner";

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
  const { user } = useWallet();
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
    if (!user) {
      setErrorMessage("Please connect your wallet first");
      setStatus("error");
      return;
    }

    setStatus("processing");
    
    try {
      // Generate mock transaction hash
      const mockTxHash = `0x${Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join("")}`;
      
      const position = outcome || side;
      
      // Check if market.id exists and is a valid UUID (from database) or mock data
      const marketId = market?.id;
      console.log("Market ID:", marketId, "Type:", typeof marketId, "Order type:", orderType);
      
      const isValidUUID = marketId ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(marketId)) : false;
      console.log("Is valid UUID:", isValidUUID);
      
      // For limit orders, insert into open_orders table
      if (orderType === "limit" && limitPrice !== undefined) {
        const orderData: {
          user_id: string;
          side: string;
          outcome: string;
          price: number;
          shares: number;
          total_value: number;
          expiration: string | null;
          market_id?: string;
          market_title: string;
        } = {
          user_id: user.id,
          side: "buy",
          outcome: position,
          price: limitPrice,
          shares: shares,
          total_value: amount,
          expiration: expiration?.toISOString() || null,
          market_title: market.title,
        };

        if (isValidUUID) {
          orderData.market_id = marketId;
        }

        const { error: orderError } = await supabase
          .from("open_orders")
          .insert(orderData);

        if (orderError) {
          console.error("Order error:", orderError);
          throw new Error(orderError.message);
        }
      }
      
      // Insert trade into market_trades (for history) - for both market and limit orders
      console.log("Inserting trade into market_trades...", { position, shares, avgPrice, amount });
      
      // Insert trade with market_id (if valid UUID) or just market_title (for mock markets)
      const tradeData: {
        user_id: string;
        side: string;
        position: string;
        shares: number;
        price: number;
        total_amount: number;
        market_id?: string;
        market_title: string;
      } = {
        user_id: user.id,
        side: "buy", // Always 'buy' when placing new orders (sell would be for closing positions)
        position: position,
        shares: shares,
        price: avgPrice,
        total_amount: amount,
        market_title: market.title,
      };
      
      if (isValidUUID) {
        tradeData.market_id = marketId;
      }
      
      const { error: tradeError } = await supabase
        .from("market_trades")
        .insert(tradeData);

      if (tradeError) {
        console.error("Trade error:", tradeError);
        throw new Error(tradeError.message);
      }
      
      console.log("Trade inserted successfully, now checking positions...");
      
      // Check if user already has a position in this market (by market_id or market_title for mock markets)
      const positionQuery = supabase
        .from("market_participants")
        .select("*")
        .eq("user_id", user.id)
        .eq("position", position);
      
      if (isValidUUID) {
        positionQuery.eq("market_id", marketId);
      } else {
        positionQuery.eq("market_title", market.title);
      }
      
      const { data: existingPosition } = await positionQuery.maybeSingle();

      if (existingPosition) {
        // Update existing position
        const newShares = existingPosition.shares + shares;
        const newTotalInvested = existingPosition.total_invested + amount;
        const newAvgPrice = newTotalInvested / newShares;

        const { error: updateError } = await supabase
          .from("market_participants")
          .update({
            shares: newShares,
            total_invested: newTotalInvested,
            avg_price: newAvgPrice,
          })
          .eq("id", existingPosition.id);

        if (updateError) {
          console.error("Update position error:", updateError);
          throw new Error(updateError.message);
        }
      } else {
        // Create new position
        const positionData: {
          user_id: string;
          position: string;
          shares: number;
          avg_price: number;
          total_invested: number;
          market_title: string;
          market_id?: string;
        } = {
          user_id: user.id,
          position: position,
          shares: shares,
          avg_price: avgPrice,
          total_invested: amount,
          market_title: market.title,
        };
        
        if (isValidUUID) {
          positionData.market_id = marketId;
        }
        
        const { error: insertError } = await supabase
          .from("market_participants")
          .insert(positionData);

        if (insertError) {
          console.error("Insert position error:", insertError);
          throw new Error(insertError.message);
        }
      }
      
      // Small delay for UX feedback
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setTxHash(mockTxHash);
      setStatus("success");
      toast.success(orderType === "limit" ? "Limit order placed successfully!" : "Trade executed successfully!");
    } catch (error) {
      console.error("Trade execution failed:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to execute trade");
      setStatus("error");
    }
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
                <span className="font-medium">{Math.round(avgPrice * 100)}¢</span>
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

            {/* Transaction Hash (on success) */}
            {status === "success" && txHash && (
              <div className="bg-muted/50 rounded-lg p-3 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Transaction</span>
                  <a
                    href={`https://solscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-accent hover:underline"
                  >
                    View on Solscan
                    <ExternalLink className="w-3 h-3" />
                  </a>
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
