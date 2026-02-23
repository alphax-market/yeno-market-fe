import { useState } from "react";
import { formatVolume } from "@/lib/utils";

/** Format as "DD Mon YY, HH:MM AM/PM" */
function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = String(date.getFullYear()).slice(-2);
  const time = date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${day} ${month} ${year}, ${time}`;
}

export interface AboutEventMarketMarket {
  tradersCount?: number;
  volume?: string | number;
  createdAt?: string;
  endDate?: string;
  resolutionSource?: string | null;
  resolutionSourceUrl?: string | null;
  description?: string | null;
}

interface AboutEventMarketProps {
  market: AboutEventMarketMarket;
}

export function AboutEventMarket({ market }: AboutEventMarketProps) {
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const description = market.description?.trim() ?? "";
  const showReadMore = description.length > 0 && description.length > 120;

  return (
    <div className="flex flex-col gap-4 bg-card rounded-xl border border-border p-4 font-open-sauce-two">
      <h3 className="text-lg font-semibold text-foreground">About the event</h3>

      {/* Event statistics: 2x2 grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-b border-border pb-4">
        <div>
          <p className="text-sm text-muted-foreground font-normal">Traders</p>
          <p className="text-md font-semibold text-foreground">
            {(market.tradersCount ?? 0).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground font-normal">Volume</p>
          <p className="text-md font-semibold text-foreground">
            {formatVolume(market.volume)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground font-normal">Started at</p>
          <p className="text-md font-semibold text-foreground">
            {market.createdAt ? formatDateTime(market.createdAt) : "—"}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground font-normal">Expires at</p>
          <p className="text-md font-semibold text-foreground">
            {market.endDate ? formatDateTime(market.endDate) : "—"}
          </p>
        </div>
      </div>


      {/* Source of truth - hardcoded for now */}
      <div className="border-b border-border pb-4">
        <p className="text-sm text-muted-foreground font-semibold">Source of truth</p>
        <p className="text-base font-medium text-[#00B233]">
          Times Magazine
        </p>
      </div>

      {/* Overview */}
      <div>
        <p className="text-sm text-muted-foreground font-semibold pb-1">Overview</p>
        {description ? (
          <>
            <p
              className={`text-sm font-normal text-foreground mt-0.5 ${
                !descriptionExpanded && showReadMore ? "line-clamp-4" : ""
              }`}
            >
              {description}
            </p>
            {showReadMore && (
              <button
                type="button"
                onClick={() => setDescriptionExpanded((e) => !e)}
                className="text-base font-normal text-primary hover:underline mt-1"
              >
                {descriptionExpanded ? "Read Less." : "Read More."}
              </button>
            )}
          </>
        ) : (
          <p className="text-base font-normal text-foreground mt-0.5">—</p>
        )}
      </div>
    </div>
  );
}
