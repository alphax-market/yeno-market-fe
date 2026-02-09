import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format price (0–1) as dollar string, e.g. 0.65 → "$0.65" */
export function formatPrice(price: number): string {
  return "$" + Number(price).toFixed(2);
}
