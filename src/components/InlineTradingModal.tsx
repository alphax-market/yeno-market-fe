import { useState } from "react";
import { X, Minus, Plus, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Market } from "@/data/markets";
import { useWallet } from "@/contexts/WalletContext";
import { usePrivy } from "@privy-io/react-auth";
import { TradeConfirmationModal } from "@/components/TradeConfirmationModal";
import { formatPrice } from "@/lib/utils";

interface InlineTradingModalProps {
  market: Market | null;
  outcome?: string;
  initialSide: 'yes' | 'no';
  onClose: () => void;
}

export function InlineTradingModal({ market, outcome, initialSide, onClose }: InlineTradingModalProps) {
  const { isConnected } = useWallet();
  const [side, setSide] = useState<'yes' | 'no'>(initialSide);
  const [amount, setAmount] = useState(10);
  const [targetPriceEnabled, setTargetPriceEnabled] = useState(false);
  const [targetPrice, setTargetPrice] = useState(55);
  const { login } = usePrivy();
  const [showConfirmation, setShowConfirmation] = useState(false);

  if (!market) return null;

  const currentPrice = side === 'yes' ? market.yesPrice : market.noPrice;
  const priceInCents = Math.round(currentPrice * 100);
  const shares = amount / currentPrice;
  const potentialReturn = shares * 1; // Each share worth $1 on win
  const profit = potentialReturn - amount;

  const presetAmounts = [1, 5, 10, 25, 50];

  const handleBuyClick = () => {
    if (!isConnected) {
      login();
    } else {
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
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full sm:max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <div className="flex-1 min-w-0 pr-2">
                <h3 className="text-base font-semibold text-foreground line-clamp-2">
                  {market.title}
                </h3>
                {outcome && (
                  <p className="text-sm text-muted-foreground mt-0.5">{outcome}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Yes/No Toggle Tabs - Polymarket Style */}
              <div className="flex rounded-xl bg-secondary p-1">
                <button
                  onClick={() => setSide('yes')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold text-base transition-all ${
                    side === 'yes'
                      ? 'bg-success text-success-foreground shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Yes {formatPrice(market.yesPrice)}
                </button>
                <button
                  onClick={() => setSide('no')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold text-base transition-all ${
                    side === 'no'
                      ? 'bg-destructive text-destructive-foreground shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  No {formatPrice(market.noPrice)}
                </button>
              </div>

              {/* Set Target Price Toggle */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">Set target price</span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${targetPriceEnabled ? 'rotate-180' : ''}`} />
                </div>
                <Switch
                  checked={targetPriceEnabled}
                  onCheckedChange={setTargetPriceEnabled}
                />
              </div>

              {/* Target Price Slider */}
              {targetPriceEnabled && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-4 pb-2"
                >
                  <div className="bg-secondary rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Target Price</span>
                      <span className="text-lg font-bold">{formatPrice(targetPrice / 100)}</span>
                    </div>
                    <Slider
                      value={[targetPrice]}
                      onValueChange={(value) => setTargetPrice(value[0])}
                      min={5}
                      max={95}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatPrice(0.05)}</span>
                      <span>{formatPrice(0.95)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Order will execute when price reaches {formatPrice(targetPrice / 100)}
                  </p>
                </motion.div>
              )}

              {/* Amount Section - Polymarket Style */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Amount</span>
                  <span className="text-sm text-muted-foreground">Balance: $1,000</span>
                </div>
                
                {/* Amount Input */}
                <div className="flex items-center gap-3 bg-secondary rounded-xl p-3">
                  <button
                    onClick={() => setAmount(Math.max(1, amount - 5))}
                    className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="flex-1 text-center">
                    <div className="flex items-center justify-center">
                      <span className="text-xl text-muted-foreground">$</span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        className="w-20 text-2xl font-bold text-center bg-transparent outline-none"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => setAmount(amount + 5)}
                    className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Preset Amounts */}
                <div className="flex gap-2">
                  {presetAmounts.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setAmount(preset)}
                      className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                        amount === preset
                          ? side === 'yes' 
                            ? 'bg-success text-success-foreground' 
                            : 'bg-destructive text-destructive-foreground'
                          : 'bg-secondary text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      ${preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Summary - Polymarket Style */}
              <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg price</span>
                  <span className="font-medium">{formatPrice(priceInCents / 100)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shares</span>
                  <span className="font-medium">{shares.toFixed(2)}</span>
                </div>
                <div className="border-t border-border/50 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Potential return</span>
                    <div className="text-right">
                      <span className={`font-bold text-lg ${side === 'yes' ? 'text-success' : 'text-destructive'}`}>
                        ${potentialReturn.toFixed(2)}
                      </span>
                      <span className="text-xs text-success ml-1">
                        (+${profit.toFixed(2)})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button - Shows potential winnings */}
              <Button
                onClick={handleBuyClick}
                className={`w-full h-14 text-lg font-semibold rounded-xl ${
                  side === 'yes'
                    ? 'bg-success hover:bg-success/90 text-success-foreground'
                    : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
                }`}
                size="lg"
              >
                Buy {side === 'yes' ? 'Yes' : 'No'} — You can win <span className="text-xl font-bold">${potentialReturn.toFixed(2)}</span>
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Wallet Modal */}

      {/* Trade Confirmation Modal */}
      <TradeConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        market={market}
        side={side}
        amount={amount}
        shares={targetPriceEnabled ? amount / (targetPrice / 100) : shares}
        avgPrice={targetPriceEnabled ? targetPrice / 100 : currentPrice}
        potentialReturn={targetPriceEnabled ? amount / (targetPrice / 100) : potentialReturn}
        outcome={outcome}
        orderType={targetPriceEnabled ? "limit" : "market"}
        limitPrice={targetPriceEnabled ? targetPrice / 100 : undefined}
        expiration={null}
      />
    </>
  );
}
