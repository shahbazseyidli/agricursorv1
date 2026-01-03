import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | string, currency = "AZN"): string {
  const num = typeof price === "string" ? parseFloat(price) : price;
  return new Intl.NumberFormat("az-AZ", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatDate(date: Date | string, locale = "az-AZ"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  // Use UTC to avoid timezone hydration mismatches
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  const day = d.getUTCDate();
  
  const months = [
    "yanvar", "fevral", "mart", "aprel", "may", "iyun",
    "iyul", "avqust", "sentyabr", "oktyabr", "noyabr", "dekabr"
  ];
  
  return `${day} ${months[month]} ${year}`;
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  // Use UTC to avoid timezone hydration mismatches
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${day}.${month}.${year}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[əƏ]/g, "e")
    .replace(/[ıİ]/g, "i")
    .replace(/[öÖ]/g, "o")
    .replace(/[üÜ]/g, "u")
    .replace(/[çÇ]/g, "c")
    .replace(/[şŞ]/g, "s")
    .replace(/[ğĞ]/g, "g")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export function calculatePriceChange(
  currentPrice: number,
  previousPrice: number
): { value: number; percentage: number; direction: "up" | "down" | "stable" } {
  const value = currentPrice - previousPrice;
  const percentage = previousPrice !== 0 ? (value / previousPrice) * 100 : 0;
  const direction = value > 0 ? "up" : value < 0 ? "down" : "stable";
  return { value, percentage, direction };
}

