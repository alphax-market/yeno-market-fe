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
