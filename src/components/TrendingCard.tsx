import { BarChart2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, formatVolume } from "@/lib/utils";

export interface TrendingCardProps {
  /** Question or market title */
  title: string;
  /** Yes outcome price (0–1) for display and multiplier */
  yesPrice: number;
  /** No outcome price (0–1) for display and multiplier */
  noPrice: number;
  /** Trade amount / volume (number or pre-formatted string) */
  tradeAmount: number | string;
  /** Display date, e.g. "21 Feb" */
  date: string;
  /** Optional: navigate or open market on card click */
  onClick?: () => void;
  /** Optional: when Yes is clicked */
  onYes?: (e: React.MouseEvent) => void;
  /** Optional: when No is clicked */
  onNo?: (e: React.MouseEvent) => void;
}

export function TrendingCard({
  title,
  yesPrice,
  noPrice,
  tradeAmount,
  date,
  onClick,
  onYes,
  onNo,
}: TrendingCardProps) {
  const yesMultiplier = yesPrice > 0 ? (1 / yesPrice).toFixed(1) : "—";
  const noMultiplier = noPrice > 0 ? (1 / noPrice).toFixed(1) : "—";
  const amountStr =
    typeof tradeAmount === "number"
      ? formatVolume(tradeAmount)
      : String(tradeAmount);

  return (
    <article
      onClick={onClick}
      className="flex-shrink-0 w-[320px] sm:w-[320px] bg-card border border-border rounded-xl p-3 flex flex-row gap-3 hover:border-primary/30 transition-colors cursor-pointer"
    >

      <div className="flex flex-col gap-4">
      <h3 className="font-plus-jakarta font-semibold text-[14px] leading-[20px] text-foreground line-clamp-2">
        {title}
      </h3>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
          <BarChart2 className="w-3.5 h-3.5 shrink-0" />
          <span>{amountStr}</span>
          <span className="opacity-50">·</span>
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span>{date}</span>
        </div>

        </div>

      <div className="flex justify-between items-center gap-4">
        

        <div className="flex flex-col gap-3  shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground w-6 text-right">
              {yesMultiplier}X
            </span>
            <Button
              size="sm"
              className="h-8 px-3 bg-success hover:bg-success/90 text-success-foreground font-semibold text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onYes?.(e);
              }}
            >
              Yes {formatPrice(yesPrice)}
            </Button>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground w-6 text-right">
              {noMultiplier}X
            </span>
            <Button
              size="sm"
              className="h-8 px-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onNo?.(e);
              }}
            >
              No {formatPrice(noPrice)}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
