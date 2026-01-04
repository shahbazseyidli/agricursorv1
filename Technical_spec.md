# TECHNICAL_SPEC.md

## 1. SCOPE & PRINCIPLES

**Project:** Agri-Food Price Intelligence Platform  
**Stage:** Prototype  
**Version:** 2.0.0  
**Last Updated:** 2026-01-02

### 1.1 Current Scope
- **Countries:** AZ (Azerbaijan) + 27 EU member states
- **Primary data sources:** 
  - **agro.gov.az** (Excel uploads) - AZ data
  - **Eurostat API** - EU annual prices
  - **EC Agri-food Portal API** - EU weekly prices
- **Currency APIs:** CBAR (primary), ExchangeRate-API (secondary - 166 currencies)
- **Price data:** min / average / max (confidence bands)
- **Market-driven visualization and comparison**
- **Cross-country comparison**
- **Database-first design**

### 1.2 Product Direction (V2 - Current)
The platform is now a **global product-centric intelligence hub** with:
- Multi-country support (AZ + EU)
- Currency and unit conversion
- Cross-country price comparison
- Rich product content (descriptions, history, uses, etc.)
- Product images
- Tridge-style product and country pages

### 1.3 V3+ Roadmap
- FAO, IMF, World Bank data integration
- Import/Export trade data
- Additional countries (CIS, Middle East, APAC)
- Multi-language support (AZ, EN, RU)
- AI-powered price forecasting
- Mobile application

### 1.4 Single Source of Truth
This document is the **ONLY reference**.  
No assumptions or deviations allowed. Any change must:
1. Be explicitly requested by the user  
2. Update this document  
3. Then be implemented

---

## 2. COUNTRIES & GLOBAL MODEL

### 2.1 Local Country (AZ)

All AZ data is **country-scoped**.

Seeded country:
- **ISO2:** AZ
- **Name:** Azərbaycan (Azerbaijan)

### 2.2 EU Countries (27 Member States)

Stored in `EuCountry` table with:
- ISO2 code
- English and Azerbaijani names
- Eurostat country code
- Regional grouping (Western, Eastern, Southern, Northern Europe)

### 2.3 Global Product Registry

`GlobalProduct` serves as unified product registry:
- Links AZ `Product` and EU `EuProduct` via foreign keys
- Contains rich content (descriptions, history, uses, nutrition, etc.)
- Contains product images
- Stores FAO, HS, and Eurostat codes

---

## 3. MARKET STRUCTURE (AZ ONLY)

### 3.1 MARKET TYPES (FIXED, AZ ONLY)

Exactly 4 market types exist (seeded at DB init, not dynamic).

| CODE | NAME_AZ | EU EQUIVALENT |
|------|---------|---------------|
| WHOLESALE | Topdansatış | EX_PACKAGING |
| PROCESSING | Müəssisə tərəfindən alış | PRODUCER |
| RETAIL | Pərakəndə satış | RETAIL_SELLING |
| FIELD | Sahədən satış | PRODUCER |

Rules:
- Each price upload maps to exactly one market type
- Market types are **seeded** and **not editable via UI**
- Each market type has separate price upload file

### 3.2 MARKETS (MASTER CATALOG)

Imported from: `markets.xlsx`

Rules:
- Country-scoped (AZ only)
- Market-type-scoped
- Upsert on import (based on name + marketTypeId + countryId)

**Admin CRUD Operations:**
- Create new market (select country, market type)
- Edit existing market
- Delete individual market
- Clear all markets (with confirmation)

---

## 4. PRODUCT STRUCTURE

### 4.1 GLOBAL PRODUCTS

Unified product registry linking AZ and EU products.

Key fields:
- `slug` - Unique URL identifier (kebab-case: apple, tomato)
- `nameEn`, `nameAz`, `nameRu` - Localized names
- `category` - Product category
- `faoCode`, `hsCode`, `eurostatCode` - International codes
- `image` - Product image URL
- Rich content fields (description, history, uses, nutrition, etc.)

### 4.2 AZ PRODUCTS

Canonical products for Azerbaijan.

Imported from: `products.xlsx`

**Required columns:**
- `product_name` (AZ display name, e.g. Alma)
- `category`
- `slug` (**EN canonical**, stable, kebab-case)

**Optional columns:**
- `name_en`, `name_ru`
- `aliases` (comma-separated for import matching)
- `hsCode`
- `globalProductId` - Link to GlobalProduct

### 4.3 EU PRODUCTS

Products from Eurostat/EC Agrifood.

Key fields:
- `eurostatCode` - Eurostat product code
- `nameEn`, `nameAz` - Product names
- `globalProductId` - Link to GlobalProduct

### 4.4 PRODUCT TYPES (AZ ONLY)

Variants of a product.

Examples:
- Product: **Alma** (Apple)
  - Product types: **Alma qırmızı** (Red), **Yay alması** (Summer)

---

## 5. PRICE DATA STRUCTURE

### 5.1 AZ PRICE DATA (from agro.gov.az)

| Column | Type | Description |
|--------|------|-------------|
| product_name | string | Məhsul adı (AZ) |
| product_type | string | Məhsul növü (optional) |
| date | date | DD.MM.YYYY |
| market | string | Bazar adı |
| price_min | decimal | Minimum qiymət |
| price_avg | decimal | Orta qiymət |
| price_max | decimal | Maksimum qiymət |
| unit | string | Ölçü vahidi (kg) |
| currency | string | AZN |
| source | string | agro.gov.az |

### 5.2 EU PRICE DATA

**Eurostat (Annual):**
- Product, Country, Year
- Price in EUR/100kg
- Price stage: PRODUCER, RETAIL_SELLING

**EC Agri-food (Weekly):**
- Product, Country, Year, Week
- Price in EUR/100kg or EUR/piece
- Multiple varieties

### 5.3 AZ PRICE AGGREGATES

`AzPriceAggregate` stores weekly averages by market type:
- Used for cross-country comparison
- Calculated from raw `Price` records
- Grouped by: product, product_type, market_type, year, week

### 5.4 PRICE UPLOAD FILES (AZ)

| Market Type | File Name |
|-------------|-----------|
| RETAIL | upload_retail.xlsx |
| WHOLESALE | upload_wholesale.xlsx |
| PROCESSING | upload_processing.xlsx |
| FIELD | upload_field.xlsx |

---

## 6. CURRENCY & UNIT CONVERSION

### 6.1 CURRENCIES

Stored in `Currency` table with exchange rates.

Sources (in priority order):
1. **CBAR** (Azerbaijan Central Bank) - Primary, official AZN rates
2. **ExchangeRate-API** - Secondary, 166 world currencies (free tier, no API key)

Update frequency: 4 times daily (UTC+4: 10am, 2pm, 7pm, 2am)

| Code | Symbol | Name (AZ) |
|------|--------|-----------|
| AZN | ₼ | Azərbaycan manatı |
| EUR | € | Avro |
| USD | $ | ABŞ dolları |
| RUB | ₽ | Rusiya rublu |
| TRY | ₺ | Türk lirəsi |

### 6.2 UNITS

Stored in `Unit` table with conversion rates.

| Code | Symbol | Conversion to kg |
|------|--------|------------------|
| kg | kg | 1.0 |
| 100kg | 100kg | 100.0 |
| lb | lb | 0.453592 |
| ton | t | 1000.0 |

### 6.3 CONVERSION LOGIC

**Currency conversion (USD-based):**
```
priceInTargetCurrency = priceInSourceCurrency / sourceCurrency.rateToUSD * targetCurrency.rateToUSD
```

Example: Convert 100 TRY to EUR
```
priceInUSD = 100 TRY / 32.0 = 3.125 USD
priceInEUR = 3.125 USD * 0.92 = 2.875 EUR
```

**Unit conversion:**
```
pricePerKg = pricePerUnit * unit.conversionToKg
```

**EU 100kg to kg:**
```
pricePerKg = pricePerHundredKg / 100
```

---

## 7. USER & AUTH SYSTEM

### 7.1 USER ROLES

| Role | Access |
|------|--------|
| ADMIN | Full access: Excel uploads, data management |
| USER | Dashboard access: view prices, charts, comparisons |
| GUEST | Public pages only |

### 7.2 DEMO ACCOUNTS

| Role | Email | Password |
|------|-------|----------|
| ADMIN | admin@agriprice.az | admin123 |
| USER | user@agriprice.az | user123 |

---

## 8. UI/UX DESIGN

### 8.1 DESIGN SYSTEM
- **Style reference:** Tridge.com
- **Charts:** Line charts with confidence bands (min/max range)
- **Layout:** Left sidebar navigation for product pages
- **Colors:** Professional, data-focused palette (emerald/teal primary)

### 8.2 PAGE STRUCTURE

**Public Pages:**
- `/` - Landing page
- `/products` - Product listing with filters
- `/products/[slug]` - Product detail (multi-country support)
- `/categories` - Category listing
- `/categories/[slug]` - Category products
- `/countries` - Country listing
- `/countries/[code]` - Country detail (Tridge-style)

**User Dashboard:**
- `/dashboard` - Overview
- `/dashboard/compare` - Price comparison tool
- `/dashboard/markets` - Market explorer

**Admin Panel:**
- `/admin` - Admin dashboard with stats
- `/admin/upload` - Excel upload
- `/admin/products` - Product/Category CRUD
- `/admin/markets` - Market CRUD
- `/admin/prices` - Price management

### 8.3 PRODUCT PAGE FEATURES

**Sidebar:**
- Product image and name
- Unit selector (kg, 100kg, lb, ton)
- Currency selector (AZN, EUR, USD, RUB, TRY)
- Country selector (AZ, EU countries)
- Product types list
- Related products
- EU comparison card

**Filters (AZ only):**
- Market Type selector
- Market selector (filtered by type)
- Product Type selector
- Date range selector (1m, 3m, 6m, 1y, all, custom)

**Price Cards:**
- **Big Card:** Latest price with AVG, MIN, MAX
- **4 Medium Cards:** Price by market type (AZ only)
- **3 Small Cards:** 30-day, 6-month, 1-year trend

**Chart:**
- Line chart with confidence bands
- Multi-line comparison mode
- Year background bands for multi-year data

**Market Tables (AZ only):**
- Cheapest 5 markets
- Most expensive 5 markets

**Rich Content:**
- Description, History, Uses
- Nutrition, Varieties, Seasonality
- Storage, Trade codes

### 8.4 COUNTRY PAGE FEATURES

**Sections:**
- Hero with flag and stats
- About section
- Agriculture overview
- Key facts sidebar
- Climate information
- Data sources
- Products by category

---

## 9. TECH STACK

### 9.1 CORE TECHNOLOGIES

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | SQLite (prototype) / PostgreSQL (production) |
| ORM | Prisma |
| Auth | NextAuth.js v4 |
| Charts | Recharts |
| Excel | xlsx (SheetJS) |
| HTTP | Fetch API |
| XML Parsing | xml2js (for CBAR) |

### 9.2 EXTERNAL APIS

| API | Purpose | Frequency |
|-----|---------|-----------|
| CBAR | Exchange rates (official AZN) | 4x daily |
| ExchangeRate-API | Exchange rates (166 currencies) | Daily |
| Eurostat SDMX | EU annual prices | Monthly |
| EC Agri-food | EU weekly prices | Weekly |

---

## 10. API ENDPOINTS

### 10.1 PUBLIC API

```
GET /api/products
  - List all products (AZ + EU)

GET /api/products/[slug]
  - Product details

GET /api/products/[slug]/prices
  Query params:
  - country: AZ, BE, DE, FR, etc.
  - range: 1m, 3m, 6m, 1y, all, custom
  - startDate, endDate: for custom range
  - marketType: market type ID
  - market: market ID
  - productType: product type ID
  - compareMarkets: market ID for comparison
  - currency: AZN, EUR, USD, etc.
  - unit: kg, 100kg, lb, ton

GET /api/comparison
  - AZ vs EU price comparison
  Query params:
  - productSlug
  - marketType: RETAIL, WHOLESALE, etc.
  - euCountry: BE, DE, etc.

GET /api/currencies
  - List available currencies with rates

GET /api/units
  - List available units with conversion rates

GET /api/eu/countries
  - List EU countries
```

### 10.2 ADMIN API

```
# Upload
POST /api/admin/upload/prices
POST /api/admin/upload/products
POST /api/admin/upload/markets

# Markets CRUD
GET/POST/DELETE /api/admin/markets
GET/PUT/DELETE  /api/admin/markets/[id]

# Products CRUD
GET/POST/DELETE /api/admin/products
GET/PUT/DELETE  /api/admin/products/[id]

# Categories CRUD
GET/POST       /api/admin/categories
GET/PUT/DELETE /api/admin/categories/[id]

# Product Types CRUD
GET/POST       /api/admin/product-types
GET/PUT/DELETE /api/admin/product-types/[id]

# Prices
GET/DELETE     /api/admin/prices
```

---

## 11. FILE STRUCTURE

```
/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── dev.db
├── scripts/
│   ├── seed-eu-data.ts
│   ├── calculate-az-aggregates.ts
│   ├── seed-product-content.ts
│   ├── fetch-product-images.ts
│   ├── seed-units.ts
│   └── update-currencies.ts
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── products/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/
│   │   │       ├── page.tsx
│   │   │       └── client.tsx
│   │   ├── countries/
│   │   │   ├── page.tsx
│   │   │   └── [code]/page.tsx
│   │   ├── categories/
│   │   ├── dashboard/
│   │   ├── admin/
│   │   └── api/
│   │       ├── products/
│   │       ├── comparison/
│   │       ├── currencies/
│   │       ├── units/
│   │       ├── eu/
│   │       └── admin/
│   ├── components/
│   │   ├── ui/
│   │   ├── charts/
│   │   ├── products/
│   │   └── layout/
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── utils.ts
│   │   └── utils/
│   │       └── unit-converter.ts
│   └── types/
├── data/
└── docs/
```

---

## 12. DATA MODELS

See `DATABASE_ARCHITECTURE.md` for complete schema documentation.

### Key Models:
- `GlobalProduct` - Unified product registry
- `Country` / `EuCountry` - Local and EU countries
- `Product` / `EuProduct` - Local and EU products
- `Price` / `EuPrice` - Local and EU prices
- `AzPriceAggregate` - Weekly AZ averages by market type
- `Currency` - Exchange rates
- `Unit` - Measurement units

---

## CHANGELOG

| Date | Change | Requested By |
|------|--------|--------------|
| 2026-01-01 | Initial spec created | User |
| 2026-01-01 | Added CRUD operations | User |
| 2026-01-01 | Added product page comparison | User |
| 2026-01-02 | Added EU countries and products | User |
| 2026-01-02 | Added Eurostat and EC Agrifood APIs | User |
| 2026-01-02 | Added currency conversion (CBAR, ExchangeRate-API) | User |
| 2026-01-02 | Added unit conversion | User |
| 2026-01-02 | Added cross-country comparison | User |
| 2026-01-02 | Added rich product content | User |
| 2026-01-02 | Added product images | User |
| 2026-01-02 | Added country detail pages | User |
| 2026-01-02 | Updated to v2.0.0 | User |
