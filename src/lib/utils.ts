import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format price (0–1) as dollar string, e.g. 0.65 → "$0.65" */
export function formatPrice(price: number): string {
  return "$" + Number(price).toFixed(2);
}

/** Format volume (handles string from API, small values) */
export function formatVolume(volume: number | string | undefined): string {
  const v = Number(volume ?? 0);
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

/** Cricket-related topic or title keywords */
const CRICKET_TOPICS = ["ipl", "t20", "ashes", "test series", "odi", "world test championship", "bilateral", "cricket"];
/** Football-related topic or title keywords */
const FOOTBALL_TOPICS = ["premier league", "la liga", "serie a", "bundesliga", "ligue 1", "champions league", "europa league", "fifa world cup", "football"];
/** Display category label: show Cricket / Football instead of Sports when applicable */
export function getCategoryDisplayName(market: { category?: string; topic?: string; title?: string }): string {
  const cat = (market.category ?? "").trim().toLowerCase();
  const topic = (market.topic ?? "").trim().toLowerCase();
  const title = (market.title ?? "").toLowerCase();
  if (cat !== "sports") {
    return market.category ?? "";
  }
  if (topic || title) {
    const combined = `${topic} ${title}`;
    if (CRICKET_TOPICS.some((k) => combined.includes(k))) return "Cricket";
    if (FOOTBALL_TOPICS.some((k) => combined.includes(k))) return "Football";
  }
  return "Cricket / Football";
}
