import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import SuccessIcon from "@/assets/svg/success-tick.svg?react";

interface TradeSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TradeSuccessModal({ isOpen, onClose }: TradeSuccessModalProps) {
  const navigate = useNavigate();

  const handleViewPortfolio = () => {
    onClose();
    navigate("/portfolio");
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="rounded-t-3xl border-b-0 min-h-[70vh] items-center flex flex-col">
        {/* Close button - centered at top */}

          <button
            type="button"
            onClick={onClose}
            className="absolute left-1/2 -translate-x-1/2 -top-12 p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-foreground" />
          </button>


        <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-6  py-10 overflow-auto">
          <SuccessIcon className="shrink-0" />

          <div className="space-y-2">
            <h2 className="text-[30px] font-bold text-foreground">
              Trade placed successfully!
            </h2>
            <p className="text-sm text-muted-foreground">
              You can find all your trades in portfolio.
            </p>
          </div>

          <Button
            variant="secondary"
            className="w-full max-w-[200px] bg-muted hover:bg-muted/80 text-foreground font-medium rounded-lg"
            onClick={handleViewPortfolio}
          >
            View portfolio
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
