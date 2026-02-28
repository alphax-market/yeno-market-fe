import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import Lottie from "lottie-react";
import { motion } from "framer-motion";
import confettiAnimation from "@/components/ui/desktop-confetti-blown-up.json";
import { useIsMobile } from "@/hooks/use-mobile";

interface TradeSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TradeSuccessModal({ isOpen, onClose }: TradeSuccessModalProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleViewPortfolio = () => {
    onClose();
    navigate("/portfolio");
  };

  const successContent = (
    <div className="relative w-full">
      {/* Confetti background animation */}
      <Lottie
        animationData={confettiAnimation}
        loop={false}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      <div className="relative flex flex-col items-center justify-center gap-6 text-center px-6 pt-12 pb-10 w-full z-20">
        {/* Animated tick */}
        <motion.div
          className="flex items-center justify-center w-24 h-24 rounded-full bg-[#22c55e]"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.15, 0.95, 1], opacity: 1 }}
          transition={{ duration: 0.5, times: [0, 0.5, 0.75, 1], ease: "easeOut" }}
        >
          <motion.svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <motion.path
              d="M10 25 L20 36 L38 14"
              stroke="white"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.35, ease: "easeInOut", delay: 0.3 }}
            />
          </motion.svg>
        </motion.div>

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
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="rounded-t-3xl border-b-0 items-center flex flex-col overflow-hidden min-h-[70vh]">
          <button
            type="button"
            onClick={onClose}
            className="absolute left-1/2 -translate-x-1/2 -top-12 p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex-1 w-full flex flex-col justify-center">
            {successContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px] p-0 rounded-2xl gap-0 overflow-visible [&>button:last-child]:hidden">
        <VisuallyHidden.Root><DialogTitle>Trade Success</DialogTitle></VisuallyHidden.Root>
        {/* Circular close button on the side */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -right-12 top-0 p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors z-50"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-foreground" />
        </button>
        <div className="overflow-hidden rounded-2xl">
          {successContent}
        </div>
      </DialogContent>
    </Dialog>
  );
}
