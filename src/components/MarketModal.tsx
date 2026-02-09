import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, Clock, Wallet, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Market } from "@/data/markets";
import { useWallet } from "@/contexts/WalletContext";
import { TradeConfirmationModal } from "@/components/TradeConfirmationModal";
import { formatPrice } from "@/lib/utils";

interface MarketModalProps {
  market: Market | null;
  onClose: () => void;
  onOpenWallet: () => void;
}

export function MarketModal({ market, onClose, onOpenWallet }: MarketModalProps) {
  const [selectedPosition, setSelectedPosition] = useState<'yes' | 'no'>('yes');
  const [amount, setAmount] = useState<string>('10');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { isConnected } = useWallet();

  if (!market) return null;

  const yesPercentage = Math.round(market.yesPrice * 100);
  const noPercentage = Math.round(market.noPrice * 100);
  const price = selectedPosition === 'yes' ? market.yesPrice : market.noPrice;
  const amountNum = parseFloat(amount) || 0;
  const shares = amountNum / price;
  const potentialPayout = shares;

  const handlePlaceTrade = () => {
    if (amountNum > 0) {
      setShowConfirmation(true);
    }
  };

  return (
    <>
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
            className="w-full max-w-lg bg-card border border-border rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-secondary text-muted-foreground">
                    {market.category}
                  </span>
                  <h2 className="text-xl font-bold mt-3">{market.title}</h2>
                  <p className="text-muted-foreground text-sm mt-2">{market.description}</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Current odds */}
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-success font-medium">Yes {yesPercentage}%</span>
                  <span className="text-destructive font-medium">No {noPercentage}%</span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden flex">
                  <div 
                    className="h-full bg-gradient-to-r from-success to-success/80"
                    style={{ width: `${yesPercentage}%` }}
                  />
                  <div 
                    className="h-full bg-gradient-to-r from-destructive/80 to-destructive"
                    style={{ width: `${noPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Trading panel */}
            <div className="p-6">
              {/* Position selector */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setSelectedPosition('yes')}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                    selectedPosition === 'yes'
                      ? 'bg-success text-success-foreground shadow-lg shadow-success/25'
                      : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                  }`}
                >
                  Yes {formatPrice(market.yesPrice)}
                </button>
                <button
                  onClick={() => setSelectedPosition('no')}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                    selectedPosition === 'no'
                      ? 'bg-destructive text-destructive-foreground shadow-lg shadow-destructive/25'
                      : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                  }`}
                >
                  No {formatPrice(market.noPrice)}
                </button>
              </div>

              {/* Amount input */}
              <div className="mb-6">
                <label className="text-sm text-muted-foreground mb-2 block">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full h-12 pl-8 pr-4 rounded-lg bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-lg font-medium"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {['10', '25', '50', '100'].map((val) => (
                    <button
                      key={val}
                      onClick={() => setAmount(val)}
                      className="flex-1 py-1.5 text-sm rounded-md bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                    >
                      ${val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-secondary/50 rounded-lg p-4 mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg. Price</span>
                  <span className="font-medium">{formatPrice(price)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shares</span>
                  <span className="font-medium">{isNaN(shares) ? '0' : shares.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-border">
                  <span className="text-muted-foreground">Potential Payout</span>
                  <span className="font-bold text-success">${isNaN(potentialPayout) ? '0' : potentialPayout.toFixed(2)}</span>
                </div>
              </div>

              {/* Submit button */}
              {isConnected ? (
                <Button 
                  onClick={handlePlaceTrade}
                  className={`w-full h-14 text-lg font-semibold gap-2 ${
                    selectedPosition === 'yes'
                      ? 'bg-success hover:bg-success/90 text-success-foreground'
                      : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
                  }`}
                  size="lg"
                  disabled={amountNum <= 0}
                >
                  <Wallet className="w-5 h-5" />
                  Buy {selectedPosition === 'yes' ? 'Yes' : 'No'} — Win ${potentialPayout.toFixed(2)}
                </Button>
              ) : (
                <Button 
                  variant="gradient" 
                  size="lg" 
                  className="w-full h-14 text-lg font-semibold gap-2"
                  onClick={() => {
                    onClose();
                    onOpenWallet();
                  }}
                >
                  <Wallet className="w-4 h-4" />
                  Connect Wallet to Trade
                </Button>
              )}

              {/* Info */}
              <div className="flex items-start gap-2 mt-4 p-3 rounded-lg bg-accent/10 text-accent text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Markets resolve based on official match results. Payouts are instant on Solana.</span>
              </div>
            </div>

            {/* Footer stats */}
            <div className="px-6 py-4 bg-secondary/30 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                <span>${(market.volume / 1000000).toFixed(1)}m Vol</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Ends {new Date(market.endDate).toLocaleDateString()}</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Trade Confirmation Modal */}
      <TradeConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        market={market}
        side={selectedPosition}
        amount={amountNum}
        shares={shares}
        avgPrice={price}
        potentialReturn={potentialPayout}
      />
    </>
  );
}
