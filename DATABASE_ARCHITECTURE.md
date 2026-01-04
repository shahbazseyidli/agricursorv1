# Database Architecture Reference

This document describes the current database schema and relationships for the **Agri-Food Price Intelligence Platform**.

**Last Updated:** 2026-01-02  
**Database:** SQLite (Prototype) / PostgreSQL (Production)  
**ORM:** Prisma

---

## 1. Overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           Database Schema v2.0                              │
├────────────────────────────────────────────────────────────────────────────┤
│  GLOBAL ENTITIES           │  AZ ENTITIES          │  EU ENTITIES           │
│  ──────────────────        │  ────────────         │  ────────────          │
│  • GlobalProduct           │  • Country (AZ)       │  • EuCountry           │
│  • GlobalProductMapping    │  • Market             │  • EuProduct           │
│  • Unit                    │  • MarketType         │  • EuPrice             │
│  • Currency                │  • Category           │                        │
│  • FxRateHistory           │  • Product            │                        │
│  • User                    │  • ProductType        │                        │
│  • Upload                  │  • Price              │                        │
│                            │  • AzPriceAggregate   │                        │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Global Entities

### 2.1 GlobalProduct

Unified product registry linking AZ and EU products.

```prisma
model GlobalProduct {
  id                       String    @id @default(cuid())
  slug                     String    @unique // apple, tomato, potato
  nameEn                   String    @map("name_en") // Apple
  nameAz                   String?   @map("name_az") // Alma
  nameRu                   String?   @map("name_ru") // Яблоко
  category                 String?   // Fruits, Vegetables
  faoCode                  String?   @map("fao_code") // FAO commodity code
  hsCode                   String?   @map("hs_code") // HS trade code
  eurostatCode             String?   @map("eurostat_code") // Eurostat code
  defaultUnit              String    @default("kg") @map("default_unit")
  image                    String?   // Product image URL
  isActive                 Boolean   @default(true) @map("is_active")
  
  // Rich content fields
  descriptionEn            String?   @map("description_en")
  descriptionAz            String?   @map("description_az")
  historyEn                String?   @map("history_en")
  historyAz                String?   @map("history_az")
  productionRegionsEn      String?   @map("production_regions_en")
  productionRegionsAz      String?   @map("production_regions_az")
  growingConditionsEn      String?   @map("growing_conditions_en")
  growingConditionsAz      String?   @map("growing_conditions_az")
  harvestingProcessEn      String?   @map("harvesting_process_en")
  harvestingProcessAz      String?   @map("harvesting_process_az")
  cultivationMethodsEn     String?   @map("cultivation_methods_en")
  cultivationMethodsAz     String?   @map("cultivation_methods_az")
  supplyChainEn            String?   @map("supply_chain_en")
  supplyChainAz            String?   @map("supply_chain_az")
  localLogisticsEn         String?   @map("local_logistics_en")
  localLogisticsAz         String?   @map("local_logistics_az")
  regulationsCertificationsEn String? @map("regulations_certifications_en")
  regulationsCertificationsAz String? @map("regulations_certifications_az")
  qualityStandardsEn       String?   @map("quality_standards_en")
  qualityStandardsAz       String?   @map("quality_standards_az")
  environmentalImpactEn    String?   @map("environmental_impact_en")
  environmentalImpactAz    String?   @map("environmental_impact_az")
  socialImpactEn           String?   @map("social_impact_en")
  socialImpactAz           String?   @map("social_impact_az")
  usesEn                   String?   @map("uses_en")
  usesAz                   String?   @map("uses_az")

  // Links to local & EU products
  localProducts            Product[]
  euProducts               EuProduct[]
}
```

| Field | Type | Description |
|-------|------|-------------|
| slug | String | Unique URL identifier (kebab-case) |
| nameEn | String | English name |
| nameAz | String? | Azerbaijani name |
| category | String? | Product category |
| faoCode | String? | FAO commodity code |
| hsCode | String? | Harmonized System trade code |
| eurostatCode | String? | Eurostat product code |
| image | String? | Product image URL |
| description* | String? | Product descriptions (EN/AZ) |
| history* | String? | Product history (EN/AZ) |
| uses* | String? | Product uses (EN/AZ) |

---

### 2.2 Unit

Measurement units with conversion rates.

```prisma
model Unit {
  id              String   @id @default(cuid())
  code            String   @unique // kg, 100kg, lb, ton
  nameEn          String   @map("name_en")
  nameAz          String?  @map("name_az")
  symbol          String   // kg, lb, t
  category        String   // weight, volume, piece
  conversionToKg  Decimal  @map("conversion_to_kg") // 1 kg = 1, 1 lb = 0.453592
  isActive        Boolean  @default(true) @map("is_active")
  sortOrder       Int      @default(0) @map("sort_order")
}
```

| Code | Name | Symbol | Conversion to kg |
|------|------|--------|------------------|
| kg | Kiloqram | kg | 1.0 |
| 100kg | 100 Kiloqram | 100kg | 100.0 |
| lb | Funt | lb | 0.453592 |
| ton | Ton | t | 1000.0 |

---

### 2.3 Currency

Currency exchange rates (from CBAR and ExchangeRate-API).

```prisma
model Currency {
  id          String   @id @default(cuid())
  code        String   @unique // AZN, EUR, USD
  symbol      String   // $, €, ₼
  nameEn      String   @map("name_en")
  nameAz      String?  @map("name_az")
  rateToUSD   Decimal  @map("rate_to_usd") // Exchange rate: 1 USD = X of this currency
  source      String?  // ExchangeRate-API
  isBase      Boolean  @default(false) @map("is_base") // USD is base
  isActive    Boolean  @default(true) @map("is_active")
  updatedAt   DateTime @updatedAt
}
```

| Code | Symbol | Name (AZ) | Source |
|------|--------|-----------|--------|
| AZN | ₼ | Azərbaycan manatı | Base |
| EUR | € | Avro | CBAR |
| USD | $ | ABŞ dolları | CBAR |
| RUB | ₽ | Rusiya rublu | CBAR |
| TRY | ₺ | Türk lirəsi | CBAR |

---

### 2.4 FxRateHistory

Historical exchange rate tracking.

```prisma
model FxRateHistory {
  id           String   @id @default(cuid())
  currencyCode String   @map("currency_code")
  rateToUSD    Decimal  @map("rate_to_usd") // 1 USD = X of this currency
  fetchedAt    DateTime @map("fetched_at")
  source       String?  // exchangerate-api
  createdAt    DateTime @default(now())

  @@unique([currencyCode, date])
}
```

---

## 3. Azerbaijan Entities

### 3.1 Country

Scopes all AZ data. Currently seeded with `AZ` (Azerbaijan).

```prisma
model Country {
  id        String   @id @default(cuid())
  iso2      String   @unique
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  marketTypes  MarketType[]
  markets      Market[]
  categories   Category[]
  products     Product[]
  prices       Price[]
}
```

**Seeded Data:**
- AZ: Azərbaycan

---

### 3.2 MarketType

Fixed categories of markets (4 types).

```prisma
model MarketType {
  id        String   @id @default(cuid())
  code      String   @unique
  nameAz    String
  nameEn    String?
  nameRu    String?
  countryId String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  country   Country  @relation(fields: [countryId], references: [id])
  markets   Market[]
}
```

| Code | Name (AZ) | EU Equivalent |
|------|-----------|---------------|
| WHOLESALE | Topdansatış | WHOLESALE / EX_PACKAGING |
| PROCESSING | Müəssisə tərəfindən alış | PRODUCER |
| RETAIL | Pərakəndə satış | RETAIL_SELLING |
| FIELD | Sahədən satış | PRODUCER |

---

### 3.3 Market

Physical trading locations.

```prisma
model Market {
  id           String   @id @default(cuid())
  name         String
  nameEn       String?
  nameRu       String?
  aliases      String?
  countryId    String
  marketTypeId String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  country      Country    @relation(fields: [countryId], references: [id])
  marketType   MarketType @relation(fields: [marketTypeId], references: [id], onDelete: Cascade)
  prices       Price[]

  @@unique([name, marketTypeId, countryId])
}
```

---

### 3.4 Product

AZ agricultural products linked to GlobalProduct.

```prisma
model Product {
  id              String   @id @default(cuid())
  name            String
  nameEn          String?
  nameRu          String?
  slug            String
  aliases         String?
  hsCode          String?
  unit            String   @default("kg")
  countryId       String
  categoryId      String
  globalProductId String?  @map("global_product_id")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  country       Country        @relation(fields: [countryId], references: [id])
  category      Category       @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  globalProduct GlobalProduct? @relation(fields: [globalProductId], references: [id])
  productTypes  ProductType[]
  prices        Price[]

  @@unique([countryId, slug])
}
```

---

### 3.5 Price

Core fact table for AZ price observations.

```prisma
model Price {
  id            String    @id @default(cuid())
  countryId     String
  productId     String
  productTypeId String?
  marketId      String
  date          DateTime
  priceMin      Decimal
  priceAvg      Decimal
  priceMax      Decimal
  unit          String
  currency      String    @default("AZN")
  source        String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  country       Country      @relation(fields: [countryId], references: [id])
  product       Product      @relation(fields: [productId], references: [id], onDelete: Cascade)
  productType   ProductType? @relation(fields: [productTypeId], references: [id], onDelete: Cascade)
  market        Market       @relation(fields: [marketId], references: [id], onDelete: Cascade)

  @@unique([countryId, productId, productTypeId, marketId, date])
  @@index([productId, date])
  @@index([marketId, date])
  @@index([productId, marketId, date])
}
```

---

### 3.6 AzPriceAggregate

Weekly/monthly average prices by market type for comparison.

```prisma
model AzPriceAggregate {
  id            String   @id @default(cuid())
  productId     String   @map("product_id")
  productTypeId String?  @map("product_type_id")
  marketTypeCode String  @map("market_type_code") // RETAIL, WHOLESALE, etc.
  countryId     String   @map("country_id")
  year          Int
  week          Int      // ISO week number (1-53)
  avgPrice      Decimal  @map("avg_price")
  minPrice      Decimal  @map("min_price")
  maxPrice      Decimal  @map("max_price")
  recordCount   Int      @map("record_count")
  unit          String   @default("kg")
  currency      String   @default("AZN")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([productId, productTypeId, marketTypeCode, countryId, year, week])
  @@index([productId, marketTypeCode])
  @@index([year, week])
}
```

| Field | Type | Description |
|-------|------|-------------|
| marketTypeCode | String | RETAIL, WHOLESALE, PROCESSING, FIELD |
| year | Int | Calendar year |
| week | Int | ISO week number (1-53) |
| avgPrice | Decimal | Average price for the week |
| recordCount | Int | Number of price records aggregated |

---

## 4. European Union Entities

### 4.1 EuCountry

EU member states (27 countries).

```prisma
model EuCountry {
  id           String   @id @default(cuid())
  iso2         String   @unique // BE, DE, FR...
  nameEn       String   @map("name_en")
  nameAz       String?  @map("name_az")
  eurostatCode String?  @map("eurostat_code")
  region       String?  // Western Europe, Eastern Europe, etc.
  population   Int?
  isActive     Boolean  @default(true) @map("is_active")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  products     EuProduct[]
  prices       EuPrice[]
}
```

| ISO2 | Name (EN) | Name (AZ) | Region |
|------|-----------|-----------|--------|
| BE | Belgium | Belçika | Western Europe |
| DE | Germany | Almaniya | Western Europe |
| FR | France | Fransa | Western Europe |
| IT | Italy | İtaliya | Southern Europe |
| ES | Spain | İspaniya | Southern Europe |
| PL | Poland | Polşa | Eastern Europe |

---

### 4.2 EuProduct

EU agricultural products linked to GlobalProduct.

```prisma
model EuProduct {
  id              String   @id @default(cuid())
  eurostatCode    String   @map("eurostat_code") // A.1.1.1, etc.
  nameEn          String   @map("name_en")
  nameAz          String?  @map("name_az")
  category        String?
  unit            String   @default("EUR/100kg")
  globalProductId String?  @map("global_product_id")
  isActive        Boolean  @default(true) @map("is_active")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  globalProduct   GlobalProduct? @relation(fields: [globalProductId], references: [id])
  prices          EuPrice[]

  @@index([eurostatCode])
  @@index([globalProductId])
}
```

---

### 4.3 EuPrice

EU price observations from Eurostat and EC Agrifood.

```prisma
model EuPrice {
  id          String   @id @default(cuid())
  euCountryId String   @map("eu_country_id")
  euProductId String   @map("eu_product_id")
  year        Int
  week        Int?     // For EC Agrifood weekly data
  price       Decimal
  unit        String   @default("EUR/100kg")
  currency    String   @default("EUR")
  priceStage  String?  @map("price_stage") // PRODUCER, RETAIL_SELLING, WHOLESALE
  source      String   // eurostat, ec_agrifood
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  euCountry   EuCountry @relation(fields: [euCountryId], references: [id])
  euProduct   EuProduct @relation(fields: [euProductId], references: [id])

  @@unique([euCountryId, euProductId, year, week, priceStage])
  @@index([euProductId, year])
  @@index([euCountryId, year])
}
```

| Field | Type | Description |
|-------|------|-------------|
| year | Int | Data year (2020-2025) |
| week | Int? | Week number for EC Agrifood data |
| priceStage | String? | PRODUCER, RETAIL_SELLING, WHOLESALE, EX_PACKAGING |
| source | String | eurostat or ec_agrifood |

---

## 5. Entity Relationship Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌───────────────┐                              ┌───────────────┐          │
│  │ GlobalProduct │◀─────────────────────────────│   EuProduct   │          │
│  └───────┬───────┘         1:M                  └───────┬───────┘          │
│          │                                              │                   │
│          │ 1:M                                          │ 1:M              │
│          ▼                                              ▼                   │
│  ┌───────────────┐                              ┌───────────────┐          │
│  │    Product    │                              │    EuPrice    │◀────┐    │
│  └───────┬───────┘                              └───────────────┘     │    │
│          │                                                            │    │
│          │ 1:M                                                        │    │
│          ▼                                                            │    │
│  ┌───────────────┐                              ┌───────────────┐     │    │
│  │  ProductType  │                              │   EuCountry   │─────┘    │
│  └───────┬───────┘                              └───────────────┘   1:M    │
│          │                                                                  │
│          │                                                                  │
│          ▼                                                                  │
│  ┌───────────────┐       ┌───────────────┐       ┌───────────────┐         │
│  │     Price     │◀──────│    Market     │◀──────│  MarketType   │         │
│  └───────────────┘  M:1  └───────────────┘  M:1  └───────────────┘         │
│          ▲                      ▲                       ▲                   │
│          │                      │                       │                   │
│          └──────────────────────┴───────────────────────┘                   │
│                                  │                                          │
│                                  ▼                                          │
│                          ┌───────────────┐                                  │
│                          │    Country    │                                  │
│                          └───────────────┘                                  │
│                                                                             │
│  ┌────────────────────┐    ┌───────────────┐    ┌───────────────┐          │
│  │  AzPriceAggregate  │    │    Currency   │    │     Unit      │          │
│  └────────────────────┘    └───────────────┘    └───────────────┘          │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Relationships Summary

### AZ Entities

| From | To | Type | Description |
|------|-----|------|-------------|
| Country | MarketType | 1:M | Country has many market types |
| Country | Market | 1:M | Country has many markets |
| Country | Category | 1:M | Country has many categories |
| Country | Product | 1:M | Country has many products |
| MarketType | Market | 1:M | Market type has many markets |
| Category | Product | 1:M | Category has many products |
| Product | ProductType | 1:M | Product has many types |
| Product | Price | 1:M | Product has many prices |
| Market | Price | 1:M | Market has many prices |
| GlobalProduct | Product | 1:M | GlobalProduct links to AZ products |

### EU Entities

| From | To | Type | Description |
|------|-----|------|-------------|
| EuCountry | EuPrice | 1:M | EU country has many prices |
| EuProduct | EuPrice | 1:M | EU product has many prices |
| GlobalProduct | EuProduct | 1:M | GlobalProduct links to EU products |

---

## 7. Cascade Delete Rules

| Parent | Child | On Delete |
|--------|-------|-----------|
| Category | Product | CASCADE |
| Product | ProductType | CASCADE |
| Product | Price | CASCADE |
| ProductType | Price | CASCADE |
| Market | Price | CASCADE |
| MarketType | Market | CASCADE |
| EuProduct | EuPrice | CASCADE |

---

## 8. Data Sources

| Source | Model | Frequency | Fields |
|--------|-------|-----------|--------|
| agro.gov.az | Price | Weekly | priceMin, priceAvg, priceMax |
| Eurostat | EuPrice | Yearly | price (annual average) |
| EC Agrifood | EuPrice | Weekly | price (weekly) |
| ExchangeRate-API | Currency | Daily | 166+ world currencies (USD-based) |

---

## 9. Database Commands

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

### Production

```bash
# Create migration
npx prisma migrate dev --name description

# Apply migrations
npx prisma migrate deploy
```

### Custom Scripts

```bash
# Seed EU data
npx tsx scripts/seed-eu-data.ts

# Calculate AZ aggregates
npx tsx scripts/calculate-az-aggregates.ts

# Seed product content
npx tsx scripts/seed-product-content.ts

# Fetch product images
npx tsx scripts/fetch-product-images.ts

# Seed units
npx tsx scripts/seed-units.ts

# Update currencies
npx tsx scripts/update-currencies.ts
```

---

## 10. Query Examples

### Get Product with Prices (AZ)

```typescript
const product = await prisma.product.findFirst({
  where: { slug: "apple" },
  include: {
    category: true,
    productTypes: true,
    globalProduct: true,
    prices: {
      orderBy: { date: "desc" },
      take: 100,
      include: { market: { include: { marketType: true } } }
    }
  }
});
```

### Get EU Product Prices

```typescript
const euPrices = await prisma.euPrice.findMany({
  where: {
    euProduct: { globalProductId: globalProductId },
    euCountryId: euCountryId,
    year: { gte: 2020 }
  },
  orderBy: { year: "desc" },
  include: {
    euCountry: true,
    euProduct: true
  }
});
```

### Get AZ Aggregate for Comparison

```typescript
const azAggregate = await prisma.azPriceAggregate.findMany({
  where: {
    productId: productId,
    marketTypeCode: "RETAIL",
    year: { gte: 2023 }
  },
  orderBy: [{ year: "desc" }, { week: "desc" }],
  take: 52 // Last year of weekly data
});
```

### Currency Conversion

```typescript
const currencies = await prisma.currency.findMany({
  where: { isActive: true },
  orderBy: { code: "asc" }
});

// Convert price from TRY to EUR (via USD)
const priceInUSD = priceInTRY / tryCurrency.rateToUSD;  // TRY → USD
const priceInEUR = priceInUSD * eurCurrency.rateToUSD;  // USD → EUR
```

### Unit Conversion

```typescript
const units = await prisma.unit.findMany({
  where: { isActive: true },
  orderBy: { sortOrder: "asc" }
});

// Convert price from EUR/100kg to EUR/kg
const pricePerKg = pricePerHundredKg / 100;

// Convert price from kg to lb
const pricePerLb = pricePerKg * 0.453592;
```

---

## 11. Performance Considerations

### Indexes
- All foreign keys are indexed by default
- Custom indexes on (productId, date), (marketId, date)
- Custom indexes on (euProductId, year), (euCountryId, year)
- Composite unique constraints provide indexes

### Query Optimization
- Use `select` to limit fields returned
- Use pagination with `skip` and `take`
- Avoid N+1 queries with `include`
- Pre-calculate aggregates in `AzPriceAggregate`

### Caching Considerations
- Cache exchange rates (update 4x daily)
- Cache product metadata (low change frequency)
- Cache filter options per product

---

**Document End**

*Last Updated: January 2, 2026 - Added GlobalProduct, EuCountry, EuProduct, EuPrice, AzPriceAggregate, Currency, Unit models*
