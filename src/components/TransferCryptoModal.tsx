import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, ArrowLeft, ChevronDown, Info, DollarSign } from "lucide-react";
import { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

interface TransferCryptoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
}

type Token = {
  id: string;
  name: string;
  symbol: string;
  icon: React.ReactNode;
};

type Chain = {
  id: string;
  name: string;
  color: string;
  icon: React.ReactNode;
};

const tokens: Token[] = [
  {
    id: "usdc",
    name: "USD Coin",
    symbol: "USDC",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="16" fill="#2775CA"/>
        <path d="M20.5 18.5c0-2.1-1.3-2.8-3.8-3.1-1.8-.3-2.2-.6-2.2-1.4 0-.7.5-1.2 1.6-1.2 1 0 1.5.4 1.8 1.1.1.2.2.3.4.3h1c.2 0 .4-.2.3-.4-.2-1.1-1-2-2.3-2.3v-1.3c0-.2-.2-.4-.4-.4h-.8c-.2 0-.4.2-.4.4v1.2c-1.6.3-2.6 1.4-2.6 2.8 0 2 1.2 2.7 3.7 3 1.6.3 2.3.6 2.3 1.5 0 .9-.8 1.5-1.9 1.5-1.5 0-2-.6-2.2-1.4-.1-.2-.2-.3-.4-.3h-1c-.2 0-.4.2-.3.4.3 1.4 1.3 2.3 2.8 2.6v1.3c0 .2.2.4.4.4h.8c.2 0 .4-.2.4-.4v-1.2c1.7-.3 2.8-1.5 2.8-3.1z" fill="#fff"/>
      </svg>
    ),
  },
  {
    id: "usdt",
    name: "Tether",
    symbol: "USDT",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="16" fill="#26A17B"/>
        <path d="M17.9 17.2v-.1c-.1 0-.7-.1-2-.1-1 0-1.7 0-2 .1v.1c-3.7.2-6.5.8-6.5 1.5s2.8 1.3 6.5 1.5v4.8h3.9v-4.8c3.7-.2 6.5-.8 6.5-1.5s-2.8-1.3-6.4-1.5zm0-1.1v-2.3h4.4V10h-12.6v3.8h4.4v2.3c-4.2.2-7.4 1-7.4 2s3.2 1.8 7.4 2v.1-.1c4.2-.2 7.4-1 7.4-2s-3.2-1.8-7.6-2z" fill="#fff"/>
      </svg>
    ),
  },
  {
    id: "eth",
    name: "Ethereum",
    symbol: "ETH",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="16" fill="#627EEA"/>
        <path fill="#fff" d="M16 4l-.2.5v15.3l.2.2 7-4.1z"/>
        <path fill="#fff" fillOpacity="0.6" d="M16 4L9 15.9l7 4.1V4z"/>
        <path fill="#fff" d="M16 21.4l-.1.1v5.4l.1.3 7-9.9z"/>
        <path fill="#fff" fillOpacity="0.6" d="M16 27.2v-5.8L9 17.3z"/>
      </svg>
    ),
  },
];

const chains: Chain[] = [
  {
    id: "ethereum",
    name: "Ethereum",
    color: "#627EEA",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 256 417" fill="none">
        <path fill="#fff" d="M127.961 0l-2.795 9.5v275.668l2.795 2.79 127.962-75.638z"/>
        <path fill="#fff" fillOpacity="0.6" d="M127.962 0L0 212.32l127.962 75.639V154.158z"/>
      </svg>
    ),
  },
  {
    id: "polygon",
    name: "Polygon",
    color: "#8247E5",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 38 33" fill="none">
        <path d="M28.8 12.5c-.7-.4-1.6-.4-2.2 0l-5.1 3-3.5 2-5.1 3c-.7.4-1.6.4-2.2 0l-4-2.4c-.7-.4-1.1-1.1-1.1-1.9v-4.6c0-.8.4-1.5 1.1-1.9l4-2.3c.7-.4 1.5-.4 2.2 0l4 2.3c.7.4 1.1 1.1 1.1 1.9v3l3.5-2v-3c0-.8-.4-1.5-1.1-1.9l-7.4-4.3c-.7-.4-1.6-.4-2.2 0L3.4 8.2C2.7 8.6 2.3 9.3 2.3 10v8.7c0 .8.4 1.5 1.1 1.9l7.5 4.3c.7.4 1.6.4 2.2 0l5.1-2.9 3.5-2 5.1-2.9c.7-.4 1.6-.4 2.2 0l4 2.3c.7.4 1.1 1.1 1.1 1.9v4.6c0 .8-.4 1.5-1.1 1.9l-4 2.4c-.7.4-1.5.4-2.2 0l-4-2.3c-.7-.4-1.1-1.1-1.1-1.9v-3l-3.5 2v3c0 .8.4 1.5 1.1 1.9l7.5 4.3c.7.4 1.6.4 2.2 0l7.5-4.3c.7-.4 1.1-1.1 1.1-1.9V17c0-.8-.4-1.5-1.1-1.9l-7.6-4.6z" fill="#fff"/>
      </svg>
    ),
  },
  {
    id: "arbitrum",
    name: "Arbitrum",
    color: "#28A0F0",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 40 40" fill="none">
        <path d="M20 40c11 0 20-9 20-20S31 0 20 0 0 9 0 20s9 20 20 20z" fill="#28A0F0"/>
        <path d="M24.5 26.2l-4.5 7.2-4.5-7.2h9zm-4.5-18l8.7 13.9h-4.6l-4.1-6.6-4.1 6.6h-4.6L20 8.2z" fill="#fff"/>
      </svg>
    ),
  },
  {
    id: "base",
    name: "Base",
    color: "#0052FF",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 111 111" fill="none">
        <circle cx="55.5" cy="55.5" r="55.5" fill="#0052FF"/>
        <path d="M55.5 95c21.8 0 39.5-17.7 39.5-39.5S77.3 16 55.5 16 16 33.7 16 55.5 33.7 95 55.5 95z" fill="#0052FF"/>
        <path d="M55.2 85c16.3 0 29.5-13.2 29.5-29.5S71.5 26 55.2 26 25.7 39.2 25.7 55.5 38.9 85 55.2 85z" fill="#fff"/>
      </svg>
    ),
  },
  {
    id: "optimism",
    name: "Optimism",
    color: "#FF0420",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="14" fill="#FF0420"/>
        <path d="M9.5 18c-2 0-3.5-1.6-3.5-4.5S7.5 9 9.5 9c2 0 3.5 1.6 3.5 4.5S11.5 18 9.5 18zm0-2c.8 0 1.5-.9 1.5-2.5S10.3 11 9.5 11s-1.5.9-1.5 2.5.7 2.5 1.5 2.5zM14 9h3.5c2 0 3.5 1.3 3.5 3s-1.5 3-3.5 3H16v3h-2V9zm2 4h1.5c.8 0 1.5-.4 1.5-1s-.7-1-1.5-1H16v2z" fill="#fff"/>
      </svg>
    ),
  },
  {
    id: "solana",
    name: "Solana",
    color: "#9945FF",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 128 128" fill="none">
        <path d="M25.6 96.3a4.4 4.4 0 013-1.3h95.8c1.9 0 2.8 2.3 1.5 3.6l-19.3 19.3a4.4 4.4 0 01-3 1.3H7.8c-1.9 0-2.8-2.3-1.5-3.6l19.3-19.3z" fill="url(#s1)"/>
        <path d="M25.6 9.8a4.4 4.4 0 013-1.3h95.8c1.9 0 2.8 2.3 1.5 3.6L106.6 31.4a4.4 4.4 0 01-3 1.3H7.8c-1.9 0-2.8-2.3-1.5-3.6L25.6 9.8z" fill="url(#s2)"/>
        <path d="M106.6 52.8a4.4 4.4 0 00-3-1.3H7.8c-1.9 0-2.8 2.3-1.5 3.6l19.3 19.3a4.4 4.4 0 003 1.3h95.8c1.9 0 2.8-2.3 1.5-3.6L106.6 52.8z" fill="url(#s3)"/>
        <defs>
          <linearGradient id="s1" x1="117" y1="8" x2="35" y2="135" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00FFA3"/><stop offset="1" stopColor="#DC1FFF"/>
          </linearGradient>
          <linearGradient id="s2" x1="82" y1="-17" x2="0" y2="111" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00FFA3"/><stop offset="1" stopColor="#DC1FFF"/>
          </linearGradient>
          <linearGradient id="s3" x1="99" y1="-4" x2="17" y2="123" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00FFA3"/><stop offset="1" stopColor="#DC1FFF"/>
          </linearGradient>
        </defs>
      </svg>
    ),
  },
];

export function TransferCryptoModal({ isOpen, onClose, onBack }: TransferCryptoModalProps) {
  const { walletAddress, balance } = useWallet();
  const [copied, setCopied] = useState(false);
  const [selectedToken, setSelectedToken] = useState<Token>(tokens[0]); // USDC default
  const [selectedChain, setSelectedChain] = useState<Chain>(chains[0]); // Ethereum default
  const [isTokenDropdownOpen, setIsTokenDropdownOpen] = useState(false);
  const [isChainDropdownOpen, setIsChainDropdownOpen] = useState(false);

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      toast.success("Address copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
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
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <button
                onClick={onBack}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              </button>
              <div className="text-center">
                <h2 className="text-lg font-bold">Transfer Crypto</h2>
                <p className="text-sm text-muted-foreground">AlphaX Balance: ${balance.toFixed(2)}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Token & Chain Selectors */}
          <div className="p-4 border-b border-border">
            <div className="grid grid-cols-2 gap-3">
              {/* Token Selector */}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Supported token</label>
                <div className="relative">
                  <button
                    onClick={() => {
                      setIsTokenDropdownOpen(!isTokenDropdownOpen);
                      setIsChainDropdownOpen(false);
                    }}
                    className="w-full p-3 rounded-xl bg-secondary border border-border hover:border-primary/50 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {selectedToken.icon}
                      <span className="font-medium">{selectedToken.symbol}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isTokenDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isTokenDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsTokenDropdownOpen(false)}
                      />
                      <div className="absolute left-0 right-0 top-full mt-2 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                        {tokens.map((token) => (
                          <button
                            key={token.id}
                            onClick={() => {
                              setSelectedToken(token);
                              setIsTokenDropdownOpen(false);
                            }}
                            className={`w-full p-3 flex items-center gap-2 hover:bg-secondary transition-colors ${
                              selectedToken.id === token.id ? 'bg-secondary' : ''
                            }`}
                          >
                            {token.icon}
                            <div className="text-left">
                              <div className="font-medium">{token.symbol}</div>
                              <div className="text-xs text-muted-foreground">{token.name}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Chain Selector */}
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <label className="text-sm text-muted-foreground">Supported chain</label>
                  <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                    Min $10
                    <Info className="w-3 h-3" />
                  </span>
                </div>
                <div className="relative">
                  <button
                    onClick={() => {
                      setIsChainDropdownOpen(!isChainDropdownOpen);
                      setIsTokenDropdownOpen(false);
                    }}
                    className="w-full p-3 rounded-xl bg-secondary border border-border hover:border-primary/50 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: selectedChain.color }}
                      >
                        {selectedChain.icon}
                      </div>
                      <span className="font-medium">{selectedChain.name}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isChainDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isChainDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsChainDropdownOpen(false)}
                      />
                      <div className="absolute left-0 right-0 top-full mt-2 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto">
                        {chains.map((chain) => (
                          <button
                            key={chain.id}
                            onClick={() => {
                              setSelectedChain(chain);
                              setIsChainDropdownOpen(false);
                            }}
                            className={`w-full p-3 flex items-center gap-2 hover:bg-secondary transition-colors ${
                              selectedChain.id === chain.id ? 'bg-secondary' : ''
                            }`}
                          >
                            <div 
                              className="w-5 h-5 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: chain.color }}
                            >
                              {chain.icon}
                            </div>
                            <span className="font-medium">{chain.name}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="p-6 flex flex-col items-center">
            <div className="relative p-4 bg-secondary/50 rounded-2xl mb-4 border border-border">
              <QRCodeSVG
                value={walletAddress || ""}
                size={160}
                level="H"
                includeMargin={false}
                bgColor="transparent"
                fgColor="currentColor"
                className="text-foreground"
              />
              {/* Chain icon overlay on QR */}
              <div 
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center border-4 border-card"
                style={{ backgroundColor: selectedChain.color }}
              >
                {selectedChain.icon}
              </div>
            </div>

            {/* Deposit Address Section */}
            <div className="w-full">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground">Your deposit address</span>
                  <Info className="w-3 h-3 text-muted-foreground" />
                </div>
                <a href="#" className="text-sm text-primary hover:underline">Terms apply</a>
              </div>
              <div className="p-3 bg-secondary rounded-xl border border-border">
                <code className="text-sm font-mono text-foreground break-all block text-center mb-2">
                  {walletAddress || "Generating..."}
                </code>
                <button
                  onClick={copyAddress}
                  className="w-full py-2 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  disabled={!walletAddress}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-green-500">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy address</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Price Impact */}
          <div className="px-4 pb-4">
            <div className="p-3 rounded-xl bg-secondary/50 border border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="text-sm">Price impact: 0.00%</span>
                <Info className="w-3 h-3 text-muted-foreground" />
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
