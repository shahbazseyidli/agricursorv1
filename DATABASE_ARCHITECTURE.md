# Database Architecture Reference

This document describes the current database schema and relationships for the **Agri-Food Price Intelligence Platform**.

**Last Updated:** 2026-01-04  
**Database:** SQLite (Prototype) / PostgreSQL (Production)  
**ORM:** Prisma  
**Schema Version:** 3.0 - Added FPMA, GlobalCategory, GlobalProductVariety, GlobalCountry, GlobalPriceStage, GlobalMarket

---

## 1. Overview

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               Database Schema v3.0                                       │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  GLOBAL ENTITIES                 │  AZ ENTITIES          │  EU ENTITIES               │
│  ────────────────────────        │  ────────────         │  ────────────              │
│  • GlobalCountry                 │  • Country (AZ)       │  • EuCountry               │
│  • GlobalProduct                 │  • Market             │  • EuProduct               │
│  • GlobalProductVariety          │  • MarketType         │  • EuPrice                 │
│  • GlobalCategory                │  • Category           │                            │
│  • GlobalPriceStage              │  • Product            │  FAO ENTITIES              │
│  • GlobalMarket                  │  • ProductType        │  ────────────              │
│  • Unit                          │  • Price              │  • FaoCountry              │
│  • Currency                      │  • AzPriceAggregate   │  • FaoProduct              │
│  • FxRateHistory                 │                       │  • FaoPrice                │
│  • User                          │                       │                            │
│                                  │                       │  FPMA ENTITIES             │
│                                  │                       │  ────────────              │
│                                  │                       │  • FpmaCountry             │
│                                  │                       │  • FpmaCommodity           │
│                                  │                       │  • FpmaMarket              │
│                                  │                       │  • FpmaSerie               │
│                                  │                       │  • FpmaPrice               │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Global Entities

### 2.1 GlobalCountry

Universal country registry linking all data sources.

```prisma
model GlobalCountry {
  id          String   @id @default(cuid())
  iso2        String   @unique // ISO 3166-1 alpha-2: AZ, US, DE
  iso3        String   @unique // ISO 3166-1 alpha-3: AZE, USA, DEU
  numericCode String?  // ISO 3166-1 numeric: 031, 840, 276
  
  nameEn      String   // English name
  nameAz      String?  // Azerbaijani name
  nameRu      String?  // Russian name
  
  region      String   // Asia, Europe, Africa, Americas, Oceania
  subRegion   String?  // Western Asia, Eastern Europe, etc.
  
  flagEmoji   String?  // 🇦🇿
  flagUrl     String?  // Custom flag image URL
  
  isActive    Boolean  @default(true)
  isFeatured  Boolean  @default(false) // Featured countries (AZ)
  sortOrder   Int      @default(0)

  // Relations to source-specific country tables
  azCountries    Country[]
  euCountries    EuCountry[]
  faoCountries   FaoCountry[]
  fpmaCountries  FpmaCountry[]
  globalMarkets  GlobalMarket[]
}
```

| Field | Type | Description |
|-------|------|-------------|
| iso2 | String | ISO 3166-1 alpha-2 code (unique) |
| iso3 | String | ISO 3166-1 alpha-3 code (unique) |
| region | String | UN M49 region (Asia, Europe, etc.) |
| subRegion | String? | UN M49 sub-region |
| isFeatured | Boolean | Featured countries shown first |

---

### 2.2 GlobalProduct

Unified product registry linking all data sources.

```prisma
model GlobalProduct {
  id               String  @id @default(cuid())
  slug             String  @unique // apple, tomato, potato
  hsCode           String? // HS6: "070190", "080810"
  
  nameEn           String  // Apple
  nameAz           String? // Alma
  nameRu           String? // Яблоко
  
  globalCategoryId String? // Link to GlobalCategory
  category         String? // Legacy: Fruits, Vegetables
  
  faoCode          String? // FAO Item Code (e.g., "515")
  cpcCode          String? // CPC classification code
  eurostatCode     String? // Eurostat code
  fpmaCode         String? // FPMA base commodity code
  
  defaultUnit      String  @default("kg")
  image            String?
  
  // Rich content
  descriptionAz    String?
  descriptionEn    String?
  history          String?
  uses             String?
  nutrition        String?
  storage          String?
  seasonality      String?

  // Relations
  productVarieties GlobalProductVariety[]
  localProducts    Product[]      // AZ products
  euProducts       EuProduct[]    // EU products
  faoProducts      FaoProduct[]   // FAO products
  fpmaCommodities  FpmaCommodity[] // FPMA commodities
}
```

---

### 2.3 GlobalProductVariety

Product varieties/types linked to data sources.

```prisma
model GlobalProductVariety {
  id              String @id @default(cuid())
  globalProductId String
  
  slug            String // base, red, white, imported, organic
  nameEn          String // "Red", "White", "Base"
  nameAz          String?
  nameRu          String?
  
  hsCode          String? // HS code for this variety
  description     String?
  image           String?
  
  fpmaVarietyCode String? // "070190_2"
  isAutoMatched   Boolean @default(false)
  matchScore      Float?
  
  sortOrder       Int     @default(0)

  // Relations
  globalProduct   GlobalProduct @relation
  productTypes    ProductType[]     // AZ product types
  fpmaCommodities FpmaCommodity[]   // FPMA commodities
  euProducts      EuProduct[]       // EU products
  faoProducts     FaoProduct[]      // FAO products
}
```

| Field | Type | Description |
|-------|------|-------------|
| slug | String | Unique within product (base, red, white) |
| isAutoMatched | Boolean | Auto-matched vs manual mapping |
| matchScore | Float? | Confidence score for auto-match |

**Important:** Every GlobalProduct should have at least one "base" variety.

---

### 2.4 GlobalCategory

Universal product categories.

```prisma
model GlobalCategory {
  id            String   @id @default(cuid())
  code          String   @unique // HS2 code: "07", "08", "10"
  slug          String   @unique // vegetables, fruits, cereals
  
  nameEn        String
  nameAz        String?
  nameRu        String?
  
  description   String?
  descriptionAz String?
  icon          String?  // emoji or icon name
  image         String?
  sortOrder     Int      @default(0)

  globalProducts  GlobalProduct[]
  localCategories Category[]
}
```

---

### 2.5 GlobalPriceStage

Universal price stage system (Wholesale, Retail, Producer, Processing).

```prisma
model GlobalPriceStage {
  id          String   @id @default(cuid())
  code        String   @unique // WHOLESALE, RETAIL, PRODUCER, PROCESSING
  
  nameEn      String   // Wholesale, Retail, Producer, Processing
  nameAz      String?  // Topdan, Pərakəndə, İstehsalçı, Xammal alışı
  nameRu      String?
  
  description String?
  sortOrder   Int      @default(0)

  // Source mappings
  azMarketTypes  MarketType[]  // AZ market types
  euPrices       EuPrice[]     // EU prices
  faoPrices      FaoPrice[]    // FAO prices
  fpmaSeries     FpmaSerie[]   // FPMA series
}
```

| Code | Name (EN) | Name (AZ) | AZ Mapping |
|------|-----------|-----------|------------|
| WHOLESALE | Wholesale | Topdan | Topdansatış |
| RETAIL | Retail | Pərakəndə | Pərakəndə satış |
| PRODUCER | Producer | İstehsalçı | Sahədən satış |
| PROCESSING | Processing | Xammal alışı | Müəssisə tərəfindən alış |

---

### 2.6 GlobalMarket

Universal market system.

```prisma
model GlobalMarket {
  id              String   @id @default(cuid())
  
  name            String   // National Average, Baku
  nameEn          String?
  nameAz          String?
  nameRu          String?
  
  globalCountryId String
  region          String?  // Region within country
  city            String?
  
  marketType      String?  // PHYSICAL, NATIONAL_AVERAGE, REGIONAL
  isNationalAvg   Boolean  @default(false)
  aggregationType String?  // WEEKLY, MONTHLY

  // Relations
  globalCountry   GlobalCountry @relation
  azMarkets       Market[]      // AZ markets
  fpmaMarkets     FpmaMarket[]  // FPMA markets
}
```

---

### 2.7 Unit

Measurement units with conversion rates.

```prisma
model Unit {
  id             String   @id @default(cuid())
  code           String   @unique // kg, 100kg, lb, ton
  nameAz         String
  nameEn         String
  symbol         String?  // kg, lb, t
  baseUnit       String   @default("kg")
  conversionRate Float    @default(1) // Rate to convert to base unit
  category       String   @default("weight")
  fpmaAliases    String?  // JSON: ["Kg", "1 kg"]
}
```

| Code | Name | Symbol | Conversion to kg |
|------|------|--------|------------------|
| kg | Kiloqram | kg | 1.0 |
| 100kg | 100 Kiloqram | 100kg | 100.0 |
| lb | Funt | lb | 0.453592 |
| ton | Ton | t | 1000.0 |

---

### 2.8 Currency

Currency exchange rates (USD-based).

```prisma
model Currency {
  id          String   @id @default(cuid())
  code        String   @unique // USD, EUR, AZN
  symbol      String   // $, €, ₼
  nameAz      String
  nameEn      String?
  rateToUSD   Float    @default(1) // 1 USD = X of this currency
  isBase      Boolean  @default(false) // USD is base
  isActive    Boolean  @default(true)
  lastUpdated DateTime @default(now())
}
```

**Currency Source:** ExchangeRate-API (166+ world currencies, USD-based)

| Code | Symbol | Rate to USD | Source |
|------|--------|-------------|--------|
| USD | $ | 1.0 | Base |
| EUR | € | 0.92 | ExchangeRate-API |
| AZN | ₼ | 1.70 | ExchangeRate-API |
| RUB | ₽ | 89.5 | ExchangeRate-API |

---

## 3. Data Source Entities

### 3.1 AZ Data Source (Azerbaijan)

| Model | Description |
|-------|-------------|
| Country | AZ country record |
| MarketType | WHOLESALE, RETAIL, PROCESSING, FIELD |
| Market | Physical trading locations |
| Category | Product categories |
| Product | Agricultural products |
| ProductType | Product varieties |
| Price | Price observations |
| AzPriceAggregate | Weekly aggregated prices |

---

### 3.2 EU Data Source (Eurostat)

| Model | Description |
|-------|-------------|
| EuCountry | 27 EU member states |
| EuProduct | EU agricultural products |
| EuPrice | EU price observations |

---

### 3.3 FAO Data Source (FAOSTAT)

| Model | Description |
|-------|-------------|
| FaoCountry | FAO countries (245+) |
| FaoProduct | FAO agricultural products |
| FaoPrice | FAO price observations |

---

### 3.4 FPMA Data Source (FAO Food Price Monitoring)

| Model | Description |
|-------|-------------|
| FpmaCountry | FPMA countries |
| FpmaCommodity | FPMA commodities |
| FpmaMarket | FPMA markets |
| FpmaSerie | FPMA data series |
| FpmaPrice | FPMA price observations |

---

## 4. Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                          │
│  ┌─────────────────┐                                                                     │
│  │  GlobalCountry  │◀────────────────────────────────────────────────────────────────┐  │
│  └────────┬────────┘                                                                  │  │
│           │ 1:M                                                                       │  │
│           ▼                                                                           │  │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐   ┌──────────────┐│  │
│  │  Country (AZ)   │    │   EuCountry     │    │   FaoCountry    │   │ FpmaCountry  ││  │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘   └──────────────┘│  │
│                                                                                       │  │
│  ┌─────────────────┐                                                                  │  │
│  │  GlobalMarket   │◀───────────────────────────────────────────────────────────────┘│  │
│  └────────┬────────┘                                                                  │  │
│           │ 1:M                                                                       │  │
│           ▼                                                                           │  │
│  ┌─────────────────┐                              ┌─────────────────┐                 │  │
│  │   Market (AZ)   │                              │   FpmaMarket    │                 │  │
│  └─────────────────┘                              └─────────────────┘                 │  │
│                                                                                       │  │
│  ┌─────────────────┐                                                                  │  │
│  │ GlobalPriceStage│◀────────────────────────────────────────────────────────────────┐  │
│  └────────┬────────┘                                                                  │  │
│           │ 1:M                                                                       │  │
│           ▼                                                                           │  │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐                    │  │
│  │  MarketType(AZ) │    │   EuPrice.stage │    │  FpmaSerie      │                    │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘                    │  │
│                                                                                       │  │
│  ┌─────────────────┐                                                                  │  │
│  │ GlobalCategory  │                                                                  │  │
│  └────────┬────────┘                                                                  │  │
│           │ 1:M                                                                       │  │
│           ▼                                                                           │  │
│  ┌─────────────────┐◀─────────────────────────────────────────────────────────────────┐  │
│  │  GlobalProduct  │                                                                  │  │
│  └────────┬────────┘                                                                  │  │
│           │ 1:M                                                                       │  │
│           ▼                                                                           │  │
│  ┌─────────────────────┐                                                              │  │
│  │GlobalProductVariety │                                                              │  │
│  └─────────┬───────────┘                                                              │  │
│            │ 1:M                                                                      │  │
│            ▼                                                                          │  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐                          │  │
│  │ProductType│  │EuProduct │  │FaoProduct│  │FpmaCommodity │                          │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘                          │  │
│                                                                                       │  │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Relationships Summary

### Global → Source Mappings

| Global Entity | AZ | EU | FAO | FPMA |
|--------------|-----|-----|-----|------|
| GlobalCountry | Country | EuCountry | FaoCountry | FpmaCountry |
| GlobalProduct | Product | EuProduct | FaoProduct | FpmaCommodity |
| GlobalProductVariety | ProductType | EuProduct | FaoProduct | FpmaCommodity |
| GlobalPriceStage | MarketType | EuPrice.priceStage | FaoPrice | FpmaSerie |
| GlobalMarket | Market | - | - | FpmaMarket |
| GlobalCategory | Category | - | - | - |

---

## 6. Data Statistics (Current)

| Entity | Count |
|--------|-------|
| GlobalCountry | 249 |
| GlobalProduct | 97 |
| GlobalProductVariety | 485 |
| GlobalCategory | 10 |
| GlobalPriceStage | 4 |
| GlobalMarket | 50+ |
| AZ Products | 65 |
| AZ ProductTypes | 372 |
| EU Products | 65 |
| FAO Products | 45 |
| FPMA Commodities | 147 |

---

## 7. Database Commands

### Development

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes (no migration)
npm run db:push

# Seed database
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

### Scripts

```bash
# Seed EU data
npx tsx scripts/seed-eu-data.ts

# Seed FAO data
npx tsx scripts/seed-fao-data.ts

# Seed FPMA data
npx tsx scripts/seed-fpma-data.ts

# Seed global countries
npx tsx scripts/seed-global-countries.ts

# Seed base varieties
npx tsx scripts/seed-base-varieties.ts

# Calculate AZ aggregates
npx tsx scripts/calculate-az-aggregates.ts

# Update currencies
npx tsx scripts/update-currencies.ts
```

---

## 8. Currency Conversion Logic

The system uses **USD as the base currency**.

### Converting between currencies:

```typescript
// Price in source currency → USD → target currency
const priceInUSD = priceInSource / sourceCurrency.rateToUSD;
const priceInTarget = priceInUSD * targetCurrency.rateToUSD;
```

### Example:

```typescript
// Convert 100 EUR to AZN
// EUR rateToUSD = 0.92 (1 USD = 0.92 EUR)
// AZN rateToUSD = 1.70 (1 USD = 1.70 AZN)

const priceInUSD = 100 / 0.92;  // 108.70 USD
const priceInAZN = 108.70 * 1.70; // 184.78 AZN
```

---

## 9. Performance Indexes

| Table | Index |
|-------|-------|
| prices | (productId, date), (marketId, date), (date) |
| eu_prices | (euProductId, year), (euCountryId, year) |
| fpma_prices | (serieId, date), (date) |
| global_products | (globalCategoryId), (category) |
| global_product_varieties | (globalProductId), (fpmaVarietyCode) |
| global_countries | (region), (subRegion) |

---

**Document End**

*Last Updated: January 4, 2026 - Added GlobalProductVariety, GlobalCountry, GlobalPriceStage, GlobalMarket, GlobalCategory models. Updated currency to USD-based system.*
