import { formatPrice, formatVolume } from "@/lib/utils";
import { BarChart3, Clock } from "lucide-react";
import { Link } from "react-router-dom";

function formatEndDateShort(endDate: string) {
  if (!endDate) return "";
  const d = new Date(endDate);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  }); // e.g. "21 Feb"
}

export function SearchTradeCard({ market }: { market }) {
  const yes = Number(market.yesPrice ?? 0);
  const no = Number(market.noPrice ?? 1 - yes);

  return (
    <Link
      to={`/market/${market.id}`}
      className="flex items-stretch justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-sm hover:shadow-md hover:border-primary/60 transition-all"
    >
      {/* Left: title + meta */}
      <div className="flex-1 min-w-0 flex flex-col justify-evenly">
        <p className="font-open-sauce-two font-medium text-[16px] leading-[20px] tracking-normal text-foreground align-middle line-clamp-2">
          {market.title}
        </p>
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <BarChart3 className="w-3 h-3" />
            {formatVolume(market.volume)} Vol.
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatEndDateShort(market.endDate)}
          </span>
        </div>
      </div>

      {/* Right: Yes / No pills */}
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          className="px-5 py-2.5 rounded-lg bg-success/15 text-success text-xs font-semibold min-w-[72px] text-right"
        >
          Yes {formatPrice(yes)}
        </button>
        <button
          type="button"
          className="px-5 py-2.5 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold min-w-[72px] text-right"
        >
          No {formatPrice(no)}
        </button>
      </div>
    </Link>
  );
}
