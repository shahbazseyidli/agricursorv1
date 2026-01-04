# API Reference

Agri-Food Price Intelligence Platform - Complete API Documentation

**Last Updated:** 2026-01-04  
**Base URL:** `http://localhost:3000/api`  
**Authentication:** NextAuth.js (Admin routes require session)

---

## Table of Contents

1. [Public APIs](#1-public-apis)
   - [Products](#11-products)
   - [Product Prices](#12-product-prices)
   - [Countries](#13-countries)
   - [Markets](#14-markets)
   - [Currencies](#15-currencies)
   - [Units](#16-units)
   - [Comparison](#17-comparison)
2. [AI APIs](#2-ai-apis)
   - [AI Search](#21-ai-search)
   - [AI Stream](#22-ai-stream)
3. [Admin APIs](#3-admin-apis)
   - [Global Products](#31-global-products)
   - [Global Countries](#32-global-countries)
   - [Global Varieties](#33-global-varieties)
   - [Global Categories](#34-global-categories)
   - [Global Price Stages](#35-global-price-stages)
   - [Global Markets](#36-global-markets)
4. [Data Sources](#4-data-sources)
5. [Response Formats](#5-response-formats)
6. [Error Handling](#6-error-handling)

---

## 1. Public APIs

### 1.1 Products

#### GET `/api/products`

List all AZ products with pagination.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| category | string | - | Filter by category slug |
| search | string | - | Search in name (AZ/EN) |
| limit | number | 50 | Items per page |
| offset | number | 0 | Skip items |

**Response:**

```json
{
  "data": [
    {
      "id": "clx123...",
      "name": "Alma",
      "nameEn": "Apple",
      "slug": "apple",
      "unit": "kg",
      "category": {
        "id": "clx456...",
        "name": "Meyvələr",
        "slug": "fruits"
      },
      "_count": {
        "prices": 1250
      }
    }
  ],
  "total": 65,
  "limit": 50,
  "offset": 0
}
```

---

#### GET `/api/products/[slug]`

Get single product details by slug.

**Path Parameters:**
- `slug` - Product slug (e.g., `apple`, `tomato`)

**Response:**

```json
{
  "data": {
    "id": "clx123...",
    "name": "Alma",
    "nameEn": "Apple",
    "nameRu": "Яблоко",
    "slug": "apple",
    "unit": "kg",
    "category": { "id": "...", "name": "Meyvələr" },
    "productTypes": [
      { "id": "...", "name": "Qızıl alma" },
      { "id": "...", "name": "Yaşıl alma" }
    ],
    "country": { "id": "...", "iso2": "AZ", "name": "Azərbaycan" }
  }
}
```

---

### 1.2 Product Prices

#### GET `/api/products/[slug]/prices`

**The most comprehensive API** - Returns price data with filtering, conversion, and statistics.

**Path Parameters:**
- `slug` - GlobalProduct slug (e.g., `apple`, `potato`, `wheat`)

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| **country** | string | `AZ` | Country code (ISO2 or ISO3) |
| **dataSource** | string | `auto` | `AGRO_AZ`, `FAO_FPMA`, `EU_DATA`, `auto` |
| **range** | string | `6m` | `1m`, `3m`, `6m`, `1y`, `all`, `custom` |
| startDate | string | - | For custom range (YYYY-MM-DD) |
| endDate | string | - | For custom range (YYYY-MM-DD) |
| **currency** | string | `USD` | Target currency code |
| **unit** | string | `kg` | Target unit code |
| market | string | - | Market ID (AZ) |
| marketType | string | - | MarketType ID (AZ) |
| productType | string | - | ProductType ID (AZ) |
| **priceStage** | string | - | GlobalPriceStage code: `WHOLESALE`, `RETAIL`, `PRODUCER`, `PROCESSING` |
| **globalMarket** | string | - | GlobalMarket ID |
| guest | boolean | false | Limit data for guest users |
| compareMarkets | string | - | Comma-separated market IDs for comparison |

**Data Sources:**

| Source | Countries | Currency | Unit | Period |
|--------|-----------|----------|------|--------|
| `AGRO_AZ` | Azerbaijan | AZN | kg | Weekly |
| `FAO_FPMA` | 136 countries | Local | Various | Weekly/Monthly |
| `EU_DATA` | 27 EU countries | EUR | 100kg | Annual |
| `FAOSTAT` | 245+ countries | USD | ton | Annual |

**Response Structure:**

```json
{
  "data": [
    {
      "date": "2025-01-15",
      "priceMin": 1.20,
      "priceAvg": 1.45,
      "priceMax": 1.70,
      "market": "Bakı",
      "marketId": "clx...",
      "marketType": "Pərakəndə satış",
      "marketTypeId": "clx...",
      "productType": "Qızıl alma",
      "productTypeId": "clx...",
      "priceStage": "RETAIL",
      "originalCurrency": "AZN",
      "originalUnit": "kg"
    }
  ],
  "comparisonData": [],
  "filters": {
    "marketTypes": [
      { "id": "...", "code": "RETAIL", "name": "Pərakəndə satış", "hasData": true }
    ],
    "markets": [
      { "id": "...", "name": "Bakı", "hasData": true, "isNationalAvg": false }
    ],
    "productTypes": [
      { "id": "...", "name": "Qızıl alma", "hasData": true }
    ],
    "priceStages": [
      { "id": "...", "code": "RETAIL", "name": "Pərakəndə satış", "hasData": true }
    ]
  },
  "stats": {
    "latestPrice": {
      "priceMin": 1.20,
      "priceAvg": 1.45,
      "priceMax": 1.70,
      "date": "2025-01-15T00:00:00.000Z",
      "currency": "USD",
      "currencySymbol": "$",
      "market": "Bakı",
      "marketType": "Pərakəndə satış"
    },
    "priceChange": {
      "value": 0.15,
      "percentage": 10.5,
      "direction": "up"
    },
    "totalRecords": 1250,
    "marketTypeStats": [],
    "priceChanges": {
      "days30": { "oldPrice": 1.30, "newPrice": 1.45, "percentage": 11.5 },
      "months6": { "oldPrice": 1.10, "newPrice": 1.45, "percentage": 31.8 },
      "year1": { "oldPrice": 1.25, "newPrice": 1.45, "percentage": 16.0 }
    },
    "dateRange": {
      "from": "2020-01-01T00:00:00.000Z",
      "to": "2025-01-15T00:00:00.000Z"
    },
    "isGuest": false,
    "currency": {
      "code": "USD",
      "symbol": "$",
      "fxRate": 1
    },
    "unit": {
      "code": "kg",
      "conversionRate": 1
    },
    "country": {
      "code": "AZ",
      "iso3": "AZE",
      "name": "Azərbaycan",
      "flag": "🇦🇿"
    },
    "source": "AGRO_AZ"
  }
}
```

**Usage Examples:**

```typescript
// Azerbaijan retail prices for Apple
GET /api/products/apple/prices?country=AZ&priceStage=RETAIL&range=1y

// Argentina FPMA wholesale prices for Wheat
GET /api/products/wheat/prices?country=AR&dataSource=FAO_FPMA&priceStage=WHOLESALE

// Germany EU annual prices for Potatoes in EUR
GET /api/products/potato/prices?country=DE&dataSource=EU_DATA&currency=EUR

// National average (aggregated) prices
GET /api/products/apple/prices?country=AZ&globalMarket=clx123_national_avg
```

---

### 1.3 Countries

#### GET `/api/v2/countries`

List all countries with their data sources.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| product | string | Filter by product slug (only countries with data) |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "code": "AZ",
      "name": "Azerbaijan",
      "nameAz": "Azərbaycan",
      "flag": "🇦🇿",
      "dataSources": [
        {
          "code": "AGRO_AZ",
          "name": "Agro.gov.az",
          "nameAz": "Azərbaycan Kənd Təsərrüfatı Nazirliyi",
          "hasData": true,
          "currency": "AZN",
          "unit": "kg",
          "periodTypes": ["WEEKLY", "MONTHLY", "ANNUAL"]
        }
      ]
    },
    {
      "code": "DE",
      "name": "Germany",
      "nameAz": "Almaniya",
      "flag": "🇩🇪",
      "dataSources": [
        {
          "code": "FAO_FPMA",
          "name": "FAO FPMA",
          "hasData": true,
          "currency": "Local",
          "unit": "kg",
          "periodTypes": ["WEEKLY", "MONTHLY"]
        },
        {
          "code": "EUROSTAT",
          "name": "EUROSTAT",
          "hasData": true,
          "currency": "EUR",
          "unit": "100kg",
          "periodTypes": ["ANNUAL"]
        }
      ]
    }
  ]
}
```

**Data Source Priority:**
1. `FAO_FPMA` - 136 countries, retail/wholesale, weekly/monthly
2. `FAOSTAT` - 245+ countries, producer prices, annual
3. `EUROSTAT` - 27 EU countries, various stages, annual
4. `AGRO_AZ` - Azerbaijan only, all market types, weekly

---

### 1.4 Markets

#### GET `/api/markets`

List AZ markets.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| type | string | MarketType code: `RETAIL`, `WHOLESALE`, `PROCESSING`, `FIELD` |
| search | string | Search by name |

**Response:**

```json
{
  "data": [
    {
      "id": "clx123...",
      "name": "Bakı - Əhmədli bazarı",
      "nameEn": "Baku - Ahmadli market",
      "marketType": {
        "id": "...",
        "code": "RETAIL",
        "nameAz": "Pərakəndə satış"
      },
      "country": { "iso2": "AZ" },
      "_count": { "prices": 5420 }
    }
  ]
}
```

---

### 1.5 Currencies

#### GET `/api/currencies`

List all active currencies with exchange rates.

**Response:**

```json
{
  "data": [
    {
      "id": "clx...",
      "code": "USD",
      "symbol": "$",
      "nameAz": "ABŞ dolları",
      "nameEn": "US Dollar",
      "rateToUSD": 1,
      "isBase": true,
      "isActive": true,
      "lastUpdated": "2025-01-15T10:00:00.000Z"
    },
    {
      "id": "clx...",
      "code": "EUR",
      "symbol": "€",
      "nameAz": "Avro",
      "rateToUSD": 0.92,
      "isBase": false,
      "isActive": true
    },
    {
      "id": "clx...",
      "code": "AZN",
      "symbol": "₼",
      "nameAz": "Azərbaycan manatı",
      "rateToUSD": 1.70,
      "isBase": false,
      "isActive": true
    }
  ],
  "lastUpdated": "2025-01-15T10:00:00.000Z"
}
```

**Currency Conversion Formula:**

```typescript
// Convert from sourceCode to targetCode via USD
const priceInUSD = priceInSource / sourceCurrency.rateToUSD;
const priceInTarget = priceInUSD * targetCurrency.rateToUSD;

// Example: 100 EUR to AZN
// EUR rateToUSD = 0.92
// AZN rateToUSD = 1.70
const priceInUSD = 100 / 0.92;  // = 108.70 USD
const priceInAZN = 108.70 * 1.70; // = 184.78 AZN
```

---

### 1.6 Units

#### GET `/api/units`

List all measurement units with conversion rates.

**Response:**

```json
{
  "data": [
    {
      "id": "clx...",
      "code": "kg",
      "nameAz": "Kiloqram",
      "nameEn": "Kilogram",
      "symbol": "kg",
      "baseUnit": "kg",
      "conversionRate": 1,
      "category": "weight",
      "isActive": true
    },
    {
      "id": "clx...",
      "code": "100kg",
      "nameAz": "100 Kiloqram",
      "nameEn": "100 Kilograms",
      "symbol": "100kg",
      "conversionRate": 0.01,
      "category": "weight"
    },
    {
      "id": "clx...",
      "code": "ton",
      "nameAz": "Ton",
      "nameEn": "Metric Ton",
      "symbol": "t",
      "conversionRate": 0.001,
      "category": "weight"
    },
    {
      "id": "clx...",
      "code": "lb",
      "nameAz": "Funt",
      "nameEn": "Pound",
      "symbol": "lb",
      "conversionRate": 2.20462,
      "category": "weight"
    }
  ],
  "grouped": {
    "weight": [...],
    "volume": [...],
    "piece": [...]
  },
  "defaultUnit": "kg"
}
```

**Unit Conversion:**

```typescript
// Price per targetUnit = Price per kg / conversionRate
// Example: 1.50 AZN/kg to AZN/lb
// lb conversionRate = 2.20462 (1 kg = 2.20462 lb)
const pricePerLb = 1.50 / 2.20462; // = 0.68 AZN/lb

// Example: 1.50 AZN/kg to AZN/100kg
// 100kg conversionRate = 0.01 (1 kg = 0.01 of 100kg)
const pricePer100kg = 1.50 / 0.01; // = 150 AZN/100kg
```

---

### 1.7 Comparison

#### GET `/api/comparison`

Compare AZ prices with EU country prices.

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| productSlug | string | Yes | GlobalProduct slug |
| marketType | string | No | `RETAIL`, `WHOLESALE`, `PRODUCER`, `FIELD` (default: RETAIL) |
| euCountry | string | No | EU country code (DE, FR, IT...) |
| currency | string | No | Target currency (default: AZN) |
| range | string | No | `all`, `1y`, `3y`, `5y` |

**Response:**

```json
{
  "product": {
    "slug": "apple",
    "nameAz": "Alma",
    "nameEn": "Apple"
  },
  "marketType": {
    "code": "RETAIL",
    "name": "Pərakəndə satış",
    "euEquivalent": "RETAIL"
  },
  "currency": {
    "code": "AZN",
    "symbol": "₼",
    "fxRate": 1.70
  },
  "az": {
    "chartData": [
      { "date": "2024-01-15", "year": 2024, "month": 1, "avgPrice": 1.45 }
    ],
    "latestPrice": {
      "avgPrice": 1.45,
      "date": "2025-01-15",
      "marketType": "Pərakəndə satış"
    },
    "dataCount": 24
  },
  "eu": {
    "country": { "code": "DE", "name": "Almaniya" },
    "chartData": [
      { "date": "2024-06-15", "year": 2024, "avgPrice": 2.10 }
    ],
    "latestPrice": {
      "avgPrice": 2.10,
      "date": "2024-12-31",
      "priceStage": "PRODUCER"
    },
    "dataCount": 5
  },
  "comparison": {
    "priceDifference": {
      "absolute": -0.65,
      "percentage": -30.9,
      "azHigher": false
    },
    "availableEuCountries": [
      { "code": "DE", "name": "Almaniya", "flag": "🇩🇪", "type": "eu" },
      { "code": "FR", "name": "Fransa", "flag": "🇫🇷", "type": "eu" }
    ]
  }
}
```

---

## 2. AI APIs

### 2.1 AI Search

#### POST `/api/ai/search`

Non-streaming AI search with DeepSeek R1.

**Request Body:**

```json
{
  "query": "Azərbaycanda alma qiymətləri necədir?",
  "productSlug": "apple"  // Optional: context hint
}
```

**Response:**

```json
{
  "success": true,
  "answer": "Azərbaycanda alma qiymətləri...",
  "reasoning": "...",  // DeepSeek reasoning trace
  "usage": {
    "prompt_tokens": 1500,
    "completion_tokens": 500,
    "total_tokens": 2000
  },
  "context": "📊 Alma - Azerbaijan Market Prices...",
  "timings": {
    "db_query_ms": 150,
    "ai_api_ms": 3500,
    "total_ms": 3650
  }
}
```

---

### 2.2 AI Stream

#### POST `/api/ai/stream`

Streaming AI response using Server-Sent Events.

**Request Body:**

```json
{
  "query": "Pomidor qiymətləri haqqında məlumat ver"
}
```

**Response:** Server-Sent Events stream

```
data: {"content":"Pomidor"}

data: {"content":" qiymətləri"}

data: {"content":" haqqında"}

data: [DONE]
```

**Frontend Usage:**

```typescript
const response = await fetch('/api/ai/stream', {
  method: 'POST',
  body: JSON.stringify({ query: 'Pomidor qiymətləri' })
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') break;
      const { content } = JSON.parse(data);
      // Append content to UI
    }
  }
}
```

---

## 3. Admin APIs

**Authentication:** All admin APIs require NextAuth session with `role: "ADMIN"`

### 3.1 Global Products

#### GET `/api/admin/global-products`

List global products with relations.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| categoryId | string | - | Filter by GlobalCategory |
| search | string | - | Search in name/slug |
| page | number | 1 | Page number |
| limit | number | 50 | Items per page |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "slug": "apple",
      "nameEn": "Apple",
      "nameAz": "Alma",
      "hsCode": "080810",
      "image": "/images/products/apple.jpg",
      "globalCategory": { "id": "...", "slug": "fruits", "nameEn": "Fruits" },
      "_count": {
        "productVarieties": 3,
        "localProducts": 1,
        "euProducts": 2,
        "faoProducts": 1,
        "fpmaCommodities": 5
      }
    }
  ],
  "pagination": {
    "total": 97,
    "page": 1,
    "limit": 50,
    "pages": 2
  }
}
```

#### POST `/api/admin/global-products`

Create new global product.

**Request Body:**

```json
{
  "slug": "strawberry",
  "nameEn": "Strawberry",
  "nameAz": "Çiyələk",
  "globalCategoryId": "clx...",
  "hsCode": "081010",
  "image": "/images/products/strawberry.jpg"
}
```

---

### 3.2 Global Countries

#### GET `/api/admin/global-countries`

List global countries.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| region | string | Filter by region (Asia, Europe...) |
| search | string | Search in name/ISO codes |
| page | number | Page number |
| limit | number | Items per page |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "iso2": "AZ",
      "iso3": "AZE",
      "nameEn": "Azerbaijan",
      "nameAz": "Azərbaycan",
      "region": "Asia",
      "subRegion": "Western Asia",
      "flagEmoji": "🇦🇿",
      "_count": {
        "azCountries": 1,
        "euCountries": 0,
        "faoCountries": 1,
        "fpmaCountries": 1,
        "globalMarkets": 15
      }
    }
  ],
  "regions": ["Africa", "Americas", "Asia", "Europe", "Oceania"],
  "pagination": { "total": 249, "page": 1, "limit": 50, "pages": 5 }
}
```

---

### 3.3 Global Varieties

#### GET `/api/admin/global-varieties`

List global product varieties.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| globalProductId | string | Filter by product |
| search | string | Search in name/slug |
| page | number | Page number |
| limit | number | Items per page |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "globalProductId": "clx...",
      "slug": "base",
      "nameEn": "Base",
      "nameAz": "Əsas",
      "isAutoMatched": false,
      "sortOrder": 0,
      "globalProduct": { "slug": "apple", "nameEn": "Apple" },
      "_count": {
        "productTypes": 5,
        "fpmaCommodities": 3,
        "euProducts": 1,
        "faoProducts": 1
      }
    }
  ]
}
```

---

### 3.4 Global Categories

#### GET `/api/admin/global-categories`

List global categories.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "code": "07",
      "slug": "vegetables",
      "nameEn": "Vegetables",
      "nameAz": "Tərəvəzlər",
      "icon": "🥕",
      "sortOrder": 1,
      "_count": { "globalProducts": 25 }
    }
  ]
}
```

---

### 3.5 Global Price Stages

#### GET `/api/admin/global-price-stages`

List price stages.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "code": "RETAIL",
      "nameEn": "Retail",
      "nameAz": "Pərakəndə",
      "sortOrder": 1,
      "linkedCounts": {
        "azMarketTypes": 1,
        "euPrices": 5420,
        "faoPrices": 0,
        "fpmaSeries": 8500
      },
      "totalLinked": 13921
    },
    {
      "id": "clx...",
      "code": "WHOLESALE",
      "nameEn": "Wholesale",
      "nameAz": "Topdan",
      "linkedCounts": { ... }
    },
    {
      "id": "clx...",
      "code": "PRODUCER",
      "nameEn": "Producer",
      "nameAz": "İstehsalçı",
      "linkedCounts": { ... }
    },
    {
      "id": "clx...",
      "code": "PROCESSING",
      "nameEn": "Processing",
      "nameAz": "Xammal alışı",
      "linkedCounts": { ... }
    }
  ]
}
```

---

### 3.6 Global Markets

#### GET `/api/admin/global-markets`

List global markets.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| countryId | string | Filter by GlobalCountry ID |
| countryCode | string | Filter by ISO2/ISO3 code |
| marketType | string | `PHYSICAL`, `NATIONAL_AVERAGE`, `REGIONAL` |
| search | string | Search by name |
| limit | number | Items per page (default: 100) |
| offset | number | Skip items |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "name": "National Average (Weekly)",
      "nameAz": "Milli Ortalama (Həftəlik)",
      "region": null,
      "city": null,
      "marketType": "NATIONAL_AVERAGE",
      "isNationalAvg": true,
      "country": {
        "iso2": "AZ",
        "nameEn": "Azerbaijan",
        "flagEmoji": "🇦🇿"
      },
      "linkedCounts": {
        "azMarkets": 0,
        "fpmaMarkets": 0
      }
    },
    {
      "id": "clx...",
      "name": "Baku",
      "marketType": "PHYSICAL",
      "isNationalAvg": false,
      "linkedCounts": {
        "azMarkets": 5,
        "fpmaMarkets": 1
      }
    }
  ],
  "pagination": { "total": 50, "limit": 100, "offset": 0, "hasMore": false }
}
```

---

## 4. Data Sources

### Available Data Sources

| Code | Name | Countries | Products | Prices | Period | Currency | Unit |
|------|------|-----------|----------|--------|--------|----------|------|
| `AGRO_AZ` | Azerbaijan Ministry | 1 | 65 | 100K+ | Weekly | AZN | kg |
| `FAO_FPMA` | FAO Food Price Monitoring | 136 | 147 | 500K+ | Weekly/Monthly | Local | Various |
| `EUROSTAT` | European Statistics | 27 | 65 | 50K+ | Annual | EUR | 100kg |
| `FAOSTAT` | FAO Statistics | 245+ | 45 | 100K+ | Annual | USD | ton |

### Data Source Selection Logic

```
if dataSource === "FAO_FPMA":
    → Use FPMA data
elif dataSource === "EU_DATA":
    → Use Eurostat data
elif dataSource === "AGRO_AZ":
    → Use Azerbaijan data
elif dataSource === "auto":
    if country === "AZ":
        → Use AGRO_AZ
    elif has FPMA data:
        → Use FAO_FPMA
    elif EU country:
        → Use EUROSTAT
```

---

## 5. Response Formats

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 50,
    "pages": 2
  }
}
```

### Alternative Format (some endpoints)

```json
{
  "data": [...],
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

### Error Response

```json
{
  "error": "Error message in Azerbaijani or English",
  "details": "Optional technical details"
}
```

---

## 6. Error Handling

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request - Missing or invalid parameters |
| 401 | Unauthorized - Admin session required |
| 404 | Not Found - Product/Country not found |
| 500 | Server Error - Database or internal error |

### Common Errors

```json
// Product not found
{ "error": "Məhsul tapılmadı", "status": 404 }

// Missing parameter
{ "error": "productSlug is required", "status": 400 }

// Unauthorized
{ "error": "Unauthorized", "status": 401 }

// Server error
{ "error": "Xəta baş verdi", "status": 500 }
```

---

## Quick Reference

### Most Used Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/products/[slug]/prices` | Get price data with all filters |
| `GET /api/v2/countries` | List countries with data sources |
| `GET /api/currencies` | Get exchange rates |
| `GET /api/units` | Get unit conversions |
| `POST /api/ai/stream` | AI chat (streaming) |
| `GET /api/comparison` | Compare AZ vs EU prices |

### Filter Combinations

```typescript
// Azerbaijan retail prices
/api/products/apple/prices?country=AZ&priceStage=RETAIL

// Any country FPMA data
/api/products/wheat/prices?country=AR&dataSource=FAO_FPMA

// EU country with currency conversion
/api/products/potato/prices?country=DE&currency=USD

// National average (aggregated)
/api/products/apple/prices?country=AZ&globalMarket=<national_avg_id>

// Compare markets
/api/products/apple/prices?country=AZ&compareMarkets=<id1>,<id2>
```

---

**Document End**

*Last Updated: January 4, 2026*

