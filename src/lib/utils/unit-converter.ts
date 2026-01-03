/**
 * Unit Conversion Utility
 * Converts prices between different units (kg, 100kg, lb, etc.)
 */

export interface UnitInfo {
  code: string;
  nameAz: string;
  nameEn: string;
  symbol: string;
  baseUnit: string;
  conversionRate: number;
  category: string;
}

// Hardcoded fallback units for when DB is not available
const FALLBACK_UNITS: Record<string, UnitInfo> = {
  "kg": { code: "kg", nameAz: "Kiloqram", nameEn: "Kilogram", symbol: "kg", baseUnit: "kg", conversionRate: 1, category: "weight" },
  "100kg": { code: "100kg", nameAz: "100 Kiloqram", nameEn: "100 Kilograms", symbol: "100kg", baseUnit: "kg", conversionRate: 0.01, category: "weight" },
  "g": { code: "g", nameAz: "Qram", nameEn: "Gram", symbol: "g", baseUnit: "kg", conversionRate: 1000, category: "weight" },
  "ton": { code: "ton", nameAz: "Ton", nameEn: "Tonne", symbol: "t", baseUnit: "kg", conversionRate: 0.001, category: "weight" },
  "lb": { code: "lb", nameAz: "Funt", nameEn: "Pound", symbol: "lb", baseUnit: "kg", conversionRate: 2.20462, category: "weight" },
  "l": { code: "l", nameAz: "Litr", nameEn: "Liter", symbol: "L", baseUnit: "L", conversionRate: 1, category: "volume" },
  "100l": { code: "100l", nameAz: "100 Litr", nameEn: "100 Liters", symbol: "100L", baseUnit: "L", conversionRate: 0.01, category: "volume" },
  "piece": { code: "piece", nameAz: "Ədəd", nameEn: "Piece", symbol: "ədəd", baseUnit: "piece", conversionRate: 1, category: "piece" },
};

/**
 * Convert price from one unit to another
 * 
 * @param price - The price value
 * @param fromUnit - Source unit code (e.g., "100kg", "€/100kg")
 * @param toUnit - Target unit code (e.g., "kg")
 * @param units - Unit lookup table (optional, uses fallback if not provided)
 * @returns Converted price or original if conversion not possible
 */
export function convertPrice(
  price: number,
  fromUnit: string,
  toUnit: string,
  units: Record<string, UnitInfo> = FALLBACK_UNITS
): number {
  // Normalize unit codes (remove currency prefix like "€/")
  const normalizedFrom = normalizeUnitCode(fromUnit);
  const normalizedTo = normalizeUnitCode(toUnit);
  
  // Same unit, no conversion needed
  if (normalizedFrom === normalizedTo) {
    return price;
  }
  
  const fromInfo = units[normalizedFrom] || FALLBACK_UNITS[normalizedFrom];
  const toInfo = units[normalizedTo] || FALLBACK_UNITS[normalizedTo];
  
  if (!fromInfo || !toInfo) {
    console.warn(`Unknown unit: ${normalizedFrom} or ${normalizedTo}`);
    return price;
  }
  
  // Different base units can't be converted (weight vs volume)
  if (fromInfo.baseUnit !== toInfo.baseUnit) {
    console.warn(`Cannot convert between different base units: ${fromInfo.baseUnit} and ${toInfo.baseUnit}`);
    return price;
  }
  
  // Convert: price in fromUnit -> base unit -> toUnit
  // Formula: pricePerToUnit = pricePerFromUnit * (toConversionRate / fromConversionRate)
  const convertedPrice = price * (toInfo.conversionRate / fromInfo.conversionRate);
  
  return convertedPrice;
}

/**
 * Normalize unit code by removing currency prefixes
 * "€/100kg" -> "100kg"
 * "₼/kg" -> "kg"
 */
function normalizeUnitCode(unit: string): string {
  // Remove common currency prefixes
  const cleaned = unit
    .toLowerCase()
    .replace(/[€₼$₽₺]/g, "") // Remove currency symbols
    .replace(/\//g, "")       // Remove slashes
    .replace(/per/gi, "")     // Remove "per"
    .trim();
  
  return cleaned;
}

/**
 * Format price with unit for display
 */
export function formatPriceWithUnit(
  price: number,
  currency: string,
  unit: string,
  locale: string = "az-AZ"
): string {
  const currencySymbols: Record<string, string> = {
    "AZN": "₼",
    "EUR": "€",
    "USD": "$",
    "RUB": "₽",
    "TRY": "₺"
  };
  
  const symbol = currencySymbols[currency] || currency;
  const formattedPrice = price.toLocaleString(locale, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
  
  return `${formattedPrice} ${symbol}/${unit}`;
}

/**
 * Get display name for unit in specified language
 */
export function getUnitDisplayName(
  unitCode: string,
  language: "az" | "en" | "ru" = "az",
  units: Record<string, UnitInfo> = FALLBACK_UNITS
): string {
  const normalizedCode = normalizeUnitCode(unitCode);
  const unitInfo = units[normalizedCode] || FALLBACK_UNITS[normalizedCode];
  
  if (!unitInfo) return unitCode;
  
  switch (language) {
    case "en": return unitInfo.nameEn;
    case "ru": return unitInfo.nameEn; // TODO: Add nameRu support
    default: return unitInfo.nameAz;
  }
}

/**
 * Example: Convert EU price (€/100kg) to per-kg price
 * 
 * EU data: 150 €/100kg
 * Converted: 1.5 €/kg
 */
export function convertEuPriceToKg(pricePerHundredKg: number): number {
  return convertPrice(pricePerHundredKg, "100kg", "kg");
}

/**
 * Example: Convert per-kg price to €/100kg for comparison with EU
 */
export function convertKgToEuPrice(pricePerKg: number): number {
  return convertPrice(pricePerKg, "kg", "100kg");
}



