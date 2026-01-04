/**
 * Price Converter Utility
 * 
 * Frontend-side price conversion for currency and unit.
 * Uses conversion rates fetched from API.
 * 
 * Base Currency: USD
 * Base Unit: kg
 */

export interface ConversionRates {
  currencies: {
    [code: string]: {
      code: string;
      symbol: string;
      rateToUSD: number; // 1 USD = X of this currency
      rateFromUSD: number; // 1 of this currency = X USD
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
  currency: string; // Original currency (USD, EUR, AZN)
  unit: string; // Original unit (kg, 100kg, tonne)
}

/**
 * Convert price from original currency/unit to target currency/unit
 * All conversions go through USD as the base currency
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

  // Step 1: Convert to base currency (USD)
  const sourceRate = rates.currencies[price.currency];
  const priceInUSD = price.value * sourceRate.rateFromUSD;

  // Step 2: Convert from USD to target currency
  const targetCurrencyRate = rates.currencies[targetCurrency];
  const priceInTargetCurrency = priceInUSD * targetCurrencyRate.rateToUSD;

  // Step 3: Convert unit (from original to kg, then to target)
  const sourceUnit = rates.units[normalizeUnit(price.unit)];
  const targetUnitData = rates.units[targetUnit];

  // Convert to kg first
  let pricePerKg: number;
  if (sourceUnit.baseUnit === "kg") {
    pricePerKg = priceInTargetCurrency / (1 / sourceUnit.conversionRate);
  } else {
    pricePerKg = priceInTargetCurrency;
  }

  // Step 4: Convert from kg to target unit
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
 * All currency conversions go through USD
 */
export function convertPriceSimple(
  price: number,
  fromCurrency: string,
  toCurrency: string,
  fromUnit: string,
  toUnit: string,
  rates: ConversionRates
): number {
  // Currency conversion (via USD)
  let convertedPrice = price;

  if (fromCurrency !== toCurrency) {
    // Convert: fromCurrency → USD → toCurrency
    const fromRate = rates.currencies[fromCurrency]?.rateFromUSD || 1; // X fromCurrency = 1 USD
    const toRate = rates.currencies[toCurrency]?.rateToUSD || 1; // 1 USD = X toCurrency
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
 * Default conversion rates (fallback) - USD based
 */
export const DEFAULT_RATES: ConversionRates = {
  currencies: {
    USD: { code: "USD", symbol: "$", rateToUSD: 1, rateFromUSD: 1 },
    EUR: { code: "EUR", symbol: "€", rateToUSD: 0.92, rateFromUSD: 1.09 },
    AZN: { code: "AZN", symbol: "₼", rateToUSD: 1.70, rateFromUSD: 0.59 },
    RUB: { code: "RUB", symbol: "₽", rateToUSD: 90.0, rateFromUSD: 0.011 },
    TRY: { code: "TRY", symbol: "₺", rateToUSD: 32.0, rateFromUSD: 0.031 },
    GBP: { code: "GBP", symbol: "£", rateToUSD: 0.79, rateFromUSD: 1.27 },
  },
  units: {
    kg: { code: "kg", nameAz: "Kiloqram", nameEn: "Kilogram", conversionRate: 1, baseUnit: "kg" },
    "100kg": { code: "100kg", nameAz: "100 Kiloqram", nameEn: "100 Kilograms", conversionRate: 0.01, baseUnit: "kg" },
    ton: { code: "ton", nameAz: "Ton", nameEn: "Tonne", conversionRate: 0.001, baseUnit: "kg" },
    lb: { code: "lb", nameAz: "Funt", nameEn: "Pound", conversionRate: 2.205, baseUnit: "kg" },
    g: { code: "g", nameAz: "Qram", nameEn: "Gram", conversionRate: 1000, baseUnit: "kg" },
  },
};
