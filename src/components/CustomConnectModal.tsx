import { usePrivy } from "@privy-io/react-auth";
import { useConnectWallet } from "@privy-io/react-auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PhantomIcon, MetaMaskIcon, CoinbaseIcon } from "@/components/icons/WalletIcons";
import { Wallet, Mail, MessageCircle } from "lucide-react";

const MAIN_WALLETS = [
  { id: "phantom", label: "Phantom", Icon: PhantomIcon },
  { id: "metamask", label: "Metamask", Icon: MetaMaskIcon },
  { id: "rabby_wallet", label: "Rabby", Icon: Wallet },
  { id: "coinbase_wallet", label: "Base", Icon: CoinbaseIcon },
] as const;

const SOCIAL_ROW = [
  { method: "twitter" as const, label: "Twitter", Icon: MessageCircle },
  { method: "telegram" as const, label: "Telegram", Icon: MessageCircle },
  { method: "email" as const, label: "Email", Icon: Mail },
] as const;

interface CustomConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomConnectModal({ open, onOpenChange }: CustomConnectModalProps) {
  const { login } = usePrivy();
  const { connectWallet } = useConnectWallet();

  const handleClose = () => onOpenChange(false);

  const handleGoogle = () => {
    handleClose();
    login({ loginMethods: ["google"] });
  };

  const handleWallet = (walletId: string) => {
    handleClose();
    connectWallet({ walletList: [walletId as any] });
  };

  const handleOtherWallet = () => {
    handleClose();
    connectWallet({
      walletList: [
        "detected_ethereum_wallets",
        "detected_solana_wallets",
        "wallet_connect",
      ],
    });
  };

  const handleSocial = (method: "twitter" | "telegram" | "email") => {
    handleClose();
    login({ loginMethods: [method] });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl font-semibold text-center">
            Connect
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6 space-y-3">
          {/* Google - full width */}
          <Button
            variant="outline"
            className="w-full h-12 justify-start gap-3 rounded-xl border-border bg-background hover:bg-muted/50"
            onClick={handleGoogle}
          >
            <GoogleIcon className="h-5 w-5 shrink-0" />
            <span>Continue with Google</span>
          </Button>

          {/* Phantom, Metamask, Rabby, Base - each its own row */}
          {MAIN_WALLETS.map(({ id, label, Icon }) => (
            <Button
              key={id}
              variant="outline"
              className="w-full h-12 justify-start gap-3 rounded-xl border-border bg-background hover:bg-muted/50"
              onClick={() => handleWallet(id)}
            >
                <Icon className="h-5 w-5 shrink-0" />
              <span>{label}</span>
            </Button>
          ))}

          {/* Continue with other wallet */}
          <Button
            variant="outline"
            className="w-full h-12 justify-start gap-3 rounded-xl border-border bg-background hover:bg-muted/50"
            onClick={handleOtherWallet}
          >
            <Wallet className="h-5 w-5 shrink-0" />
            <span>Continue with other wallet</span>
          </Button>

          {/* Twitter | Telegram | Email - 3 boxes side by side */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            {SOCIAL_ROW.map(({ method, label, Icon }) => (
              <Button
                key={method}
                variant="outline"
                size="sm"
                className="h-12 flex flex-col gap-1 rounded-xl border-border bg-background hover:bg-muted/50"
                onClick={() => handleSocial(method)}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="text-xs font-medium">{label}</span>
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
