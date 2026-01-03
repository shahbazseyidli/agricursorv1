/**
 * Price Converter Utility
 * 
 * Frontend-side price conversion for currency and unit.
 * Uses conversion rates fetched from API.
 * 
 * Base: AZN/kg
 */

export interface ConversionRates {
  currencies: {
    [code: string]: {
      code: string;
      symbol: string;
      rateToAZN: number; // 1 AZN = X of this currency
      rateFromAZN: number; // 1 of this currency = X AZN
    };
  };
  units: {
    [code: string]: {
      code: string;
      nameAz: string;
      nameEn: string;
      conversionRate: number; // Rate to convert from kg (e.g., 0.01 for 100kg means 1kg = 0.01 * 100kg)
      baseUnit: string;
    };
  };
}

export interface PriceData {
  value: number;
  currency: string; // Original currency (AZN, EUR, USD)
  unit: string; // Original unit (kg, 100kg, tonne)
}

/**
 * Convert price from original currency/unit to target currency/unit
 */
export function convertPrice(
  price: PriceData,
  targetCurrency: string,
  targetUnit: string,
  rates: ConversionRates
): number {
  if (!rates.currencies[price.currency] || !rates.currencies[targetCurrency]) {
    console.warn(`Currency not found: ${price.currency} or ${targetCurrency}`);
    return price.value;
  }

  if (!rates.units[normalizeUnit(price.unit)] || !rates.units[targetUnit]) {
    console.warn(`Unit not found: ${price.unit} or ${targetUnit}`);
    return price.value;
  }

  // Step 1: Convert to base currency (AZN)
  const sourceRate = rates.currencies[price.currency];
  const priceInAZN = price.value * sourceRate.rateFromAZN;

  // Step 2: Convert to target currency
  const targetCurrencyRate = rates.currencies[targetCurrency];
  const priceInTargetCurrency = priceInAZN * targetCurrencyRate.rateToAZN;

  // Step 3: Convert unit (from original to kg, then to target)
  const sourceUnit = rates.units[normalizeUnit(price.unit)];
  const targetUnitData = rates.units[targetUnit];

  // Convert to kg first
  // If source is 100kg, conversionRate = 0.01, so pricePerKg = price * 0.01 * 100 = price
  // Actually: price per 100kg → price per kg = price / 100
  // conversionRate for 100kg = 0.01 means: 1kg = 0.01 * 100kg base
  // So to get kg from 100kg: price_per_kg = price_per_100kg / 100
  
  let pricePerKg: number;
  if (sourceUnit.baseUnit === "kg") {
    // conversionRate = how many kg in 1 of this unit
    // For 100kg: conversionRate = 0.01, meaning 1 unit of 100kg = 100 kg
    // Wait, that's inverted. Let me reconsider.
    // Our Unit table has: 100kg with conversionRate = 0.01
    // This means: to convert FROM 100kg TO kg, multiply by 100 (or divide by 0.01)
    pricePerKg = priceInTargetCurrency / (1 / sourceUnit.conversionRate);
  } else {
    pricePerKg = priceInTargetCurrency;
  }

  // Step 4: Convert from kg to target unit
  // If target is 100kg, we need: pricePerKg * 100
  let finalPrice: number;
  if (targetUnitData.baseUnit === "kg") {
    finalPrice = pricePerKg * (1 / targetUnitData.conversionRate);
  } else {
    finalPrice = pricePerKg;
  }

  return finalPrice;
}

/**
 * Simplified conversion: just currency and unit multipliers
 */
export function convertPriceSimple(
  price: number,
  fromCurrency: string,
  toCurrency: string,
  fromUnit: string,
  toUnit: string,
  rates: ConversionRates
): number {
  // Currency conversion
  let convertedPrice = price;

  if (fromCurrency !== toCurrency) {
    const fromRate = rates.currencies[fromCurrency]?.rateFromAZN || 1;
    const toRate = rates.currencies[toCurrency]?.rateToAZN || 1;
    convertedPrice = price * fromRate * toRate;
  }

  // Unit conversion
  const normalizedFromUnit = normalizeUnit(fromUnit);
  const normalizedToUnit = normalizeUnit(toUnit);
  
  if (normalizedFromUnit !== normalizedToUnit) {
    const fromUnitData = rates.units[normalizedFromUnit];
    const toUnitData = rates.units[normalizedToUnit];

    if (fromUnitData && toUnitData) {
      // Convert to kg first, then to target
      // conversionRate: how to convert FROM this unit TO base (kg)
      // For 100kg: rate = 0.01 means price_per_100kg / 100 = price_per_kg
      // For tonne: rate = 0.001 means price_per_tonne / 1000 = price_per_kg
      
      const pricePerKg = convertedPrice * fromUnitData.conversionRate;
      convertedPrice = pricePerKg / toUnitData.conversionRate;
    }
  }

  return convertedPrice;
}

/**
 * Format price with currency code
 */
export function formatPrice(
  price: number,
  currency: string,
  decimals: number = 2
): string {
  return `${price.toFixed(decimals)} ${currency}`;
}

/**
 * Normalize unit code to match database
 */
function normalizeUnit(unit: string): string {
  const normalized = unit.toLowerCase().trim();
  
  const unitMap: Record<string, string> = {
    "kg": "kg",
    "kilogram": "kg",
    "kiloqram": "kg",
    "100kg": "100kg",
    "100 kg": "100kg",
    "€/100kg": "100kg",
    "eur/100kg": "100kg",
    "tonne": "ton",
    "ton": "ton",
    "t": "ton",
    "lb": "lb",
    "pound": "lb",
    "funt": "lb",
    "g": "g",
    "gram": "g",
    "qram": "g",
    "l": "l",
    "litre": "l",
    "litr": "l",
    "100l": "100l",
    "piece": "piece",
    "ədəd": "piece",
  };

  return unitMap[normalized] || normalized;
}

/**
 * Get unit multiplier for display (e.g., kg -> 100kg = 100x)
 */
export function getUnitMultiplier(fromUnit: string, toUnit: string, rates: ConversionRates): number {
  const from = rates.units[normalizeUnit(fromUnit)];
  const to = rates.units[normalizeUnit(toUnit)];
  
  if (!from || !to) return 1;
  
  return from.conversionRate / to.conversionRate;
}

/**
 * Default conversion rates (fallback)
 */
export const DEFAULT_RATES: ConversionRates = {
  currencies: {
    AZN: { code: "AZN", symbol: "₼", rateToAZN: 1, rateFromAZN: 1 },
    USD: { code: "USD", symbol: "$", rateToAZN: 0.59, rateFromAZN: 1.70 },
    EUR: { code: "EUR", symbol: "€", rateToAZN: 0.55, rateFromAZN: 1.82 },
    RUB: { code: "RUB", symbol: "₽", rateToAZN: 53.0, rateFromAZN: 0.019 },
    TRY: { code: "TRY", symbol: "₺", rateToAZN: 19.0, rateFromAZN: 0.053 },
  },
  units: {
    kg: { code: "kg", nameAz: "Kiloqram", nameEn: "Kilogram", conversionRate: 1, baseUnit: "kg" },
    "100kg": { code: "100kg", nameAz: "100 Kiloqram", nameEn: "100 Kilograms", conversionRate: 0.01, baseUnit: "kg" },
    ton: { code: "ton", nameAz: "Ton", nameEn: "Tonne", conversionRate: 0.001, baseUnit: "kg" },
    lb: { code: "lb", nameAz: "Funt", nameEn: "Pound", conversionRate: 2.205, baseUnit: "kg" },
    g: { code: "g", nameAz: "Qram", nameEn: "Gram", conversionRate: 1000, baseUnit: "kg" },
  },
};

