# Product Specification Document
## Agri-Food Price Intelligence Platform - User Features

**Version:** 2.0.0  
**Date:** January 2, 2026  
**Scope:** Public & Registered User Features Only  
**Platform:** Web Application (Next.js)  
**Base URL:** http://localhost:3000

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [User Roles](#2-user-roles)
3. [Public Pages](#3-public-pages)
4. [User Dashboard](#4-user-dashboard)
5. [User Flows](#5-user-flows)
6. [Page Specifications](#6-page-specifications)
7. [API Endpoints](#7-api-endpoints)
8. [Test Scenarios](#8-test-scenarios)
9. [Accessibility & UX](#9-accessibility--ux)

---

## 1. Executive Summary

### 1.1 Purpose
AgriPrice is a **global** web-based platform for monitoring and analyzing agricultural commodity prices. Initially focused on Azerbaijan, it now supports **multiple countries** including EU member states. Users can view price data, compare markets and countries, and analyze price trends.

### 1.2 Key User Features
- View agricultural product listings (Azerbaijan + EU products)
- Browse product detail pages with interactive price charts
- **Multi-country support** - Switch between AZ and EU countries
- **Unit conversion** - View prices in kg, 100kg, lb, ton
- **Currency conversion** - View prices in AZN, EUR, USD, RUB, TRY
- Filter prices by market type, market, product type, and date range
- Compare prices between different markets (AZ only)
- **Compare prices between countries** (AZ vs EU)
- View cheapest and most expensive markets
- Track price trends (30 days, 6 months, 1 year)
- **Rich product information** - History, uses, nutrition, varieties

### 1.3 Supported Languages
- Primary: Azerbaijani (AZ)
- UI elements are in Azerbaijani
- Product names available in AZ/EN

### 1.4 Data Sources
| Source | Coverage | Update Frequency |
|--------|----------|------------------|
| agro.gov.az | Azerbaijan | Daily/Weekly |
| Eurostat | 27 EU Countries | Annually |
| EC Agri-food Portal | EU Countries | Weekly |

---

## 2. User Roles

### 2.1 Guest User (Unauthenticated)

**Access Level:** Public pages only

**Capabilities:**
- ✅ View home page
- ✅ View product listings (AZ + EU)
- ✅ View product detail pages with price charts
- ✅ Filter prices by market type, market, product type
- ✅ **Switch between countries** (AZ and EU)
- ✅ **Change currency** (AZN, EUR, USD, etc.)
- ✅ **Change unit** (kg, 100kg, lb, ton)
- ✅ Compare prices between markets
- ✅ **Compare AZ prices with EU country prices**
- ✅ View price trends and statistics
- ✅ View country detail pages
- ✅ View category listings
- ❌ Cannot access dashboard
- ❌ Cannot save preferences

### 2.2 Registered User (Authenticated)

**Access Level:** Public pages + User Dashboard

**Test Account:**
| Field | Value |
|-------|-------|
| Email | user@agriprice.az |
| Password | user123 |

**Capabilities:**
- ✅ All guest capabilities
- ✅ Access personal dashboard
- ✅ View comparison tools
- ✅ Access market explorer
- ✅ View full price history (guests limited)

---

## 3. Public Pages

### 3.1 Home Page
**URL:** `/`

Landing page with platform introduction, featured products, and quick access links.

### 3.2 Products Listing
**URL:** `/products`

Grid of all available agricultural products showing:
- **AZ products** - From Azerbaijan with 🇦🇿 badge
- **EU products** - From European countries with 🇪🇺 badge
- **Combined products** - Products with both AZ and EU data with 🌍 badge
- Product images
- Search functionality
- Category filtering
- Data source filtering (All/AZ only/EU only/Both)

### 3.3 Product Detail
**URL:** `/products/[slug]?country=[code]`

**Examples:**
- `/products/apple` - Apple (default country: AZ)
- `/products/apple?country=az` - Apple in Azerbaijan
- `/products/apple?country=be` - Apple in Belgium
- `/products/tomato?country=de` - Tomato in Germany

Comprehensive product page with:
- **Country selector** - Switch between AZ and EU countries
- **Currency selector** - AZN, EUR, USD, RUB, TRY
- **Unit selector** - kg, 100kg, lb, ton
- Price chart with confidence bands
- Multiple filters (market type, market, product type, date range)
- Market comparison (AZ only)
- **Country comparison** - Compare with EU countries
- Price statistics
- **Rich content** - Description, history, uses, nutrition, varieties, storage, seasonality

### 3.4 Countries Listing
**URL:** `/countries`

Grid of all available countries:
- 🇦🇿 Azerbaijan (featured)
- 🇪🇺 EU Countries grouped by region (Western, Eastern, Southern, Northern)
- Product count per country
- Price record count

### 3.5 Country Detail
**URL:** `/countries/[code]`

**Examples:**
- `/countries/az` - Azerbaijan
- `/countries/be` - Belgium
- `/countries/de` - Germany

Tridge-style country page with:
- Flag and country name
- **About section** - Country description
- **Key facts** - Population, area, capital, currency, agriculture GDP share
- **Agriculture section** - Farming overview
- **Climate section** - Climate zones
- **Top exports** - Main export products
- Data sources with counts
- Products by category with price counts

### 3.6 Categories Listing
**URL:** `/categories`

List of product categories:
- Meyvə (Fruits)
- Tərəvəz (Vegetables)
- Bostan (Gourds/Melons)
- etc.

### 3.7 Category Detail
**URL:** `/categories/[slug]`

Products within a specific category.

### 3.8 Login Page
**URL:** `/login`

Authentication page for registered users.

### 3.9 Register Page
**URL:** `/register`

Registration page for new users.

---

## 4. User Dashboard

### 4.1 Dashboard Home
**URL:** `/dashboard`

**Requires:** Authentication

Personal overview page for logged-in users.

### 4.2 Compare Tool
**URL:** `/dashboard/compare`

**Requires:** Authentication

Advanced comparison tool for price analysis.

---

## 5. User Flows

### 5.1 Browse Products (Guest)

```
1. User opens http://localhost:3000
2. User sees home page with featured products
3. User clicks "Məhsullar" (Products) in navigation
4. System navigates to /products
5. User sees product grid with categories
6. User sees badges: 🇦🇿 (AZ), 🇪🇺 (EU), 🌍 (Both)
7. User can search or filter by category
8. User can filter by data source (All/AZ/EU/Both)
9. User clicks on a product card
10. System navigates to /products/[slug]
```

### 5.2 View Product Prices (Guest)

```
1. User navigates to /products/apple
2. System loads product data
3. System auto-selects defaults:
   - Country: "Azərbaycan" (or last viewed)
   - Currency: AZN
   - Unit: kg
   - Market Type: "Pərakəndə satış" (Retail) if available
   - Market: First with data (alphabetically)
   - Product Type: First with data
   - Date Range: "6 ay" (6 months)
4. User sees:
   - Left sidebar: Product info, selectors, related products
   - Main area: Price chart, statistics, market tables
   - Rich content: Description, history, uses, etc.
5. Chart displays price line with min/max confidence band
```

### 5.3 Change Country (Guest)

```
1. User is on product detail page (e.g., /products/apple)
2. User clicks "Ölkə" (Country) dropdown in sidebar
3. User selects "Belçika" (Belgium)
4. System updates URL to /products/apple?country=be
5. Chart updates with Belgium price data
6. Market filters become hidden (EU countries have no markets)
7. Currency auto-adjusts or stays same
8. "Başqa ölkə ilə müqayisə" section available
```

### 5.4 Change Currency (Guest)

```
1. User is on product detail page
2. User clicks "Valyuta" (Currency) dropdown
3. User selects "EUR" (Euro)
4. System fetches conversion rate from database
5. All prices recalculate and display in EUR
6. Chart and all statistics update
7. Currency symbol changes throughout page
```

### 5.5 Change Unit (Guest)

```
1. User is on product detail page
2. User clicks "Ölçü vahidi" (Unit) dropdown
3. Options: kg, 100kg, lb (Funt), t (Ton)
4. User selects "100kg"
5. All prices recalculate (price per kg × 100)
6. Chart Y-axis and all values update
7. Unit label changes throughout page
```

### 5.6 Filter Prices (Guest - AZ Only)

```
1. User is on product detail page with country=AZ
2. User clicks "Bazar növü" (Market Type) dropdown
3. User selects "Topdansatış" (Wholesale)
4. System fetches wholesale market data
5. Chart updates with wholesale prices
6. Market filter updates to show only wholesale markets
7. User can further filter by specific market
```

### 5.7 Compare Markets (Guest - AZ Only)

```
1. User is on product detail page with a market selected
2. User finds "Müqayisə" (Comparison) section
3. User opens comparison market dropdown
4. User selects a different market
5. System fetches comparison data
6. Chart updates with two lines:
   - Primary color: Selected market
   - Secondary color: Comparison market
7. Trend cards (30d, 6m, 1y) are hidden
8. Tooltip shows both market prices
9. User clicks "Müqayisə etmə" to remove comparison
10. Comparison line removed, trend cards reappear
```

### 5.8 Compare Countries (Guest)

```
1. User is on product detail page
2. User finds "Başqa ölkə ilə müqayisə" card in sidebar
3. User clicks country dropdown
4. User sees available EU countries with price data
5. User selects "Almaniya" (Germany)
6. System fetches comparison data:
   - AZ aggregate price for selected market type
   - Germany price for equivalent price stage
7. Comparison chart appears showing both lines
8. Summary cards show:
   - AZ average price
   - EU country average price
   - Difference (% and absolute)
9. User can change comparison country
```

### 5.9 Change Date Range (Guest)

```
1. User is on product detail page
2. User clicks date range selector
3. Options available:
   - "1 ay" (1 month)
   - "3 ay" (3 months)
   - "6 ay" (6 months)
   - "1 il" (1 year)
   - "Hamısı" (All)
   - "Xüsusi" (Custom) → opens year-month pickers
4. User selects "6 ay"
5. Chart updates to show last 6 months only
```

### 5.10 Custom Date Range (Guest)

```
1. User clicks "Xüsusi" in date range selector
2. Two dropdowns appear: Start (Year-Month) and End (Year-Month)
3. User selects:
   - Start: 2023 / Yanvar
   - End: 2024 / Dekabr
4. Chart updates to show selected range
5. Custom range persists until changed
```

### 5.11 View Country Page (Guest)

```
1. User clicks "Ölkələr" in navigation
2. System navigates to /countries
3. User sees country grid with AZ featured
4. User clicks on "Belçika" (Belgium)
5. System navigates to /countries/be
6. User sees:
   - Country flag and name
   - Statistics: price records, products, date range
   - About section with country info
   - Key facts
   - Agriculture and climate info
   - Data sources
   - Products grouped by category
```

### 5.12 View Rich Product Content (Guest)

```
1. User is on product detail page (e.g., /products/apple)
2. User scrolls down past charts
3. User sees "Alma haqqında" (About Apple) section
4. Content includes:
   - Təsvir (Description)
   - Tarixi (History)
   - İstifadəsi (Uses)
   - Qida dəyəri (Nutrition)
   - Növləri (Varieties)
   - Mövsüm (Seasonality)
   - Saxlanma şəraiti (Storage)
   - Beynəlxalq kodlar (FAO, HS, Eurostat codes)
```

### 5.13 User Login

```
1. User clicks "Daxil ol" (Login) in header
2. System navigates to /login
3. User enters:
   - Email: user@agriprice.az
   - Password: user123
4. User clicks "Daxil ol" button
5. System authenticates user
6. System redirects to /dashboard
7. Header shows user name/avatar
```

---

## 6. Page Specifications

### 6.1 Home Page (/)

| Section | Elements |
|---------|----------|
| Header | Logo, Navigation (Kateqoriyalar, Məhsullar, Ölkələr, Dashboard), Login button |
| Hero | Platform title, description, CTA button |
| Featured Products | Grid of featured products with images |
| Statistics | Quick stats cards (products, countries, price records) |
| Footer | Copyright, links |

**Navigation Items:**
- "Kateqoriyalar" → /categories
- "Məhsullar" → /products
- "Ölkələr" → /countries
- "Dashboard" → /dashboard (if logged in)
- "Daxil ol" → /login

---

### 6.2 Products Listing (/products)

| Element | Description |
|---------|-------------|
| Page Title | "Məhsullar" with count |
| Stats Cards | 🇦🇿 AZ products, 🇪🇺 EU products, 🌍 Combined products |
| Search Bar | Text input for product name search |
| Category Filter | Dropdown: "Bütün kateqoriyalar" + categories |
| Data Source Filter | Dropdown: Hamısı / 🇦🇿 Yalnız Azərbaycan / 🇪🇺 Yalnız Avropa / 🌍 Müqayisəli |
| Product Grid | Cards in responsive grid (1-4 columns) |

**Product Card Structure:**
```
┌─────────────────────────────┐
│  [Image]      [🇦🇿] [🇪🇺]   │
│                             │
│  Product Name (AZ)          │
│  Product Name (EN)          │
│  Category                   │
│                             │
│  📊 1234  [Müqayisə badge]  │
└─────────────────────────────┘
```

---

### 6.3 Product Detail (/products/[slug])

#### Left Sidebar

| Element | Description |
|---------|-------------|
| Product Image | Product photo (if available) |
| Product Card | Name, category, image |
| Unit Selector | Dropdown: kg, 100kg, lb, ton |
| Currency Selector | Dropdown: AZN, EUR, USD, RUB, TRY |
| Country Selector | Dropdown: Azərbaycan + EU countries |
| Product Types | List of variants as badges |
| Quick Links | Category, related products |
| EU Comparison Card | "Başqa ölkə ilə müqayisə" with country selector |

**Sidebar Info Card:**
```
┌─────────────────────────────┐
│  [Product Image]            │
│                             │
│  PRODUCT NAME               │
│  [Category Badge]           │
│                             │
│  Ölçü vahidi: [kg ▾]        │
│  Valyuta: [AZN ▾]           │
│  Ölkə: [Azərbaycan ▾]       │
│                             │
│  📍 Bazarlar: 27            │
│  (only for AZ)              │
└─────────────────────────────┘
```

#### Main Content Area

**Row 1: Filter Bar**
```
┌─────────────────────────────────────────────────────────────┐
│ [Bazar növü ▾] [Bazar ▾] [Məhsul növü ▾] [Tarix: 6 ay ▾]   │
│ (Market filters only shown for AZ)                          │
└─────────────────────────────────────────────────────────────┘
```

**Row 2: Main Price Card (Large)**
```
┌─────────────────────────────────────────────────────────────┐
│  Son qiymət                                    [Date]       │
│                                                             │
│  ₼ 1.75 / kg                                  ▲ +5.2%      │
│  AVERAGE                                                    │
│                                                             │
│  Min: ₼ 1.50    Max: ₼ 2.00                                │
│  Market: Bakı-8km bazarı                                    │
└─────────────────────────────────────────────────────────────┘
```

**Row 3: Market Type Cards (4 Medium Cards) - AZ Only**

Shows country average by market type (only if data exists):

| Card | Icon | Content |
|------|------|---------|
| Pərakəndə satış | 🏪 | Avg price, Min, Max, Date |
| Topdansatış | 🏭 | Avg price, Min, Max, Date |
| Müəssisə tərəfindən alış | 🏢 | Avg price, Min, Max, Date |
| Sahədən satış | 🌾 | Avg price, Min, Max, Date |

**Row 4: Trend Cards (3 Small Cards)**

Hidden when comparison is active:

| Card | Content |
|------|---------|
| Son 30 gün | % change, up/down arrow, color coded |
| Son 6 ay | % change, up/down arrow, color coded |
| Son 1 il | % change, up/down arrow, color coded |

**Row 5: Chart Section**

| Element | Description |
|---------|-------------|
| Chart | Line chart with confidence band (min/max shaded area) |
| Tooltip | Date, Price (Avg), Min, Max, Market name |
| Y-axis | Price in selected currency/unit |
| X-axis | Date (formatted by range) |

**Row 6: Comparison Row (AZ Only)**
```
┌─────────────────────────────────────────────────────────────┐
│ 🔄 Müqayisə: [Bazar seçin... ▾]                            │
└─────────────────────────────────────────────────────────────┘
```

**Row 7: Market Tables (2 Cards) - AZ Only**

| Card | Content |
|------|---------|
| Ən ucuz 5 bazar | Table: Rank, Market, Type Badge, Price |
| Ən baha 5 bazar | Table: Rank, Market, Type Badge, Price |

**Row 8: Rich Content Section**

```
┌─────────────────────────────────────────────────────────────┐
│  📦 Alma haqqında                                           │
│                                                             │
│  ┌──────────────────┐ ┌──────────────────┐                 │
│  │ Təsvir           │ │ Tarixi           │                 │
│  │ [Description]    │ │ [History text]   │                 │
│  └──────────────────┘ └──────────────────┘                 │
│                                                             │
│  ┌──────────────────┐ ┌──────────────────┐                 │
│  │ İstifadəsi       │ │ Qida dəyəri      │                 │
│  │ [Uses text]      │ │ [Nutrition]      │                 │
│  └──────────────────┘ └──────────────────┘                 │
│                                                             │
│  ┌──────────────────┐ ┌──────────────────┐                 │
│  │ Növləri          │ │ Mövsüm           │                 │
│  │ [Varieties]      │ │ [Seasonality]    │                 │
│  └──────────────────┘ └──────────────────┘                 │
│                                                             │
│  ┌────────────────────────────────────────┐                │
│  │ Saxlanma şəraiti                        │                │
│  │ [Storage info]                          │                │
│  └────────────────────────────────────────┘                │
│                                                             │
│  Beynəlxalq kodlar: [FAO: xxx] [HS: xxx] [Eurostat: xxx]   │
└─────────────────────────────────────────────────────────────┘
```

---

### 6.4 Country Detail (/countries/[code])

| Section | Elements |
|---------|----------|
| Hero | Flag emoji (large), Country name (AZ/EN), Region badge, Country code |
| Stats Row | 4 cards: Price records, Products, Date range, Data sources |
| About Section | General info, Agriculture, Climate |
| Key Facts Sidebar | Population, Area, Capital, Currency, Agriculture GDP share |
| Top Exports | Badge list of main export products |
| Data Sources | Cards for each source with record counts |
| Products Grid | Products grouped by category with images and price counts |

---

### 6.5 Login Page (/login)

| Element | Description |
|---------|-------------|
| Title | "Daxil ol" |
| Email Input | placeholder: "Email" |
| Password Input | placeholder: "Şifrə", type: password |
| Submit Button | "Daxil ol" |
| Register Link | "Hesabınız yoxdur? Qeydiyyatdan keçin" → /register |
| Error Message | Red text for invalid credentials |

---

### 6.6 Register Page (/register)

| Element | Description |
|---------|-------------|
| Title | "Qeydiyyat" |
| Name Input | placeholder: "Ad" |
| Email Input | placeholder: "Email" |
| Password Input | placeholder: "Şifrə", type: password |
| Submit Button | "Qeydiyyatdan keç" |
| Login Link | "Artıq hesabınız var? Daxil olun" → /login |

---

## 7. API Endpoints

### 7.1 GET /api/products/[slug]/prices

**Description:** Get price data with filters and statistics

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| range | string | No | "6m" | 1m, 3m, 6m, 1y, all, custom |
| startDate | string | No | - | For custom range: YYYY-MM-DD |
| endDate | string | No | - | For custom range: YYYY-MM-DD |
| marketType | string | No | - | Market type ID |
| market | string | No | - | Market ID |
| productType | string | No | - | Product type ID |
| compareMarkets | string | No | - | Market ID for comparison |
| currency | string | No | "AZN" | Target currency code |
| unit | string | No | "kg" | Target unit: kg, 100kg, lb, ton |
| country | string | No | "AZ" | Country code: AZ, BE, DE, etc. |
| guest | boolean | No | false | Limit data for guests |

**Example:** 
```
GET /api/products/apple/prices?range=6m&country=az&currency=EUR&unit=kg
GET /api/products/apple/prices?country=be&range=all
```

---

### 7.2 GET /api/comparison

**Description:** Compare AZ aggregate price with EU country price

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| productSlug | string | Yes | Global product slug |
| marketType | string | No | AZ market type: RETAIL, WHOLESALE, PROCESSING, FIELD |
| euCountry | string | No | EU country code for comparison |
| currency | string | No | Target currency |

**Response:**
```json
{
  "product": { "slug": "apple", "nameAz": "Alma" },
  "marketType": { "code": "RETAIL", "name": "Pərakəndə satış" },
  "az": {
    "chartData": [...],
    "latestPrice": { "avgPrice": 1.75, "date": "2025-12-15" }
  },
  "eu": {
    "country": { "code": "BE", "name": "Belçika" },
    "chartData": [...],
    "latestPrice": { "avgPrice": 0.85, "date": "2024-01-01" }
  },
  "comparison": {
    "priceDifference": { "absolute": 0.90, "percentage": 105.8, "azHigher": true },
    "availableEuCountries": [...]
  }
}
```

---

### 7.3 GET /api/currencies

**Description:** Get available currencies with exchange rates

**Response:**
```json
{
  "data": [
    { "code": "AZN", "symbol": "₼", "nameAz": "Azərbaycan manatı", "rateToAZN": 1 },
    { "code": "EUR", "symbol": "€", "nameAz": "Avro", "rateToAZN": 0.54 },
    { "code": "USD", "symbol": "$", "nameAz": "ABŞ dolları", "rateToAZN": 0.59 }
  ]
}
```

---

### 7.4 GET /api/units

**Description:** Get available units with conversion rates

**Response:**
```json
{
  "data": [
    { "code": "kg", "nameAz": "Kiloqram", "symbol": "kg", "conversionRate": 1 },
    { "code": "100kg", "nameAz": "100 Kiloqram", "symbol": "100kg", "conversionRate": 0.01 },
    { "code": "lb", "nameAz": "Funt", "symbol": "lb", "conversionRate": 2.20462 },
    { "code": "ton", "nameAz": "Ton", "symbol": "t", "conversionRate": 0.001 }
  ],
  "grouped": { "weight": [...], "volume": [...] }
}
```

---

## 8. Test Scenarios

### 8.1 Navigation Tests

| ID | Scenario | Steps | Expected Result |
|----|----------|-------|-----------------|
| NAV-001 | Navigate to home | Open http://localhost:3000 | Home page loads with header and content |
| NAV-002 | Navigate to products | Click "Məhsullar" in header | Products listing page loads with grid |
| NAV-003 | Navigate to product detail | Click on product card | Product detail page loads with chart |
| NAV-004 | Navigate to countries | Click "Ölkələr" in header | Countries listing page loads |
| NAV-005 | Navigate to country detail | Click on country card | Country detail page loads |
| NAV-006 | Navigate to categories | Click "Kateqoriyalar" in header | Categories listing page loads |
| NAV-007 | Navigate to login | Click "Daxil ol" | Login page loads |
| NAV-008 | Navigate back | Click browser back | Previous page loads |

### 8.2 Product Listing Tests

| ID | Scenario | Steps | Expected Result |
|----|----------|-------|-----------------|
| LIST-001 | View all products | Navigate to /products | Product grid displays with images |
| LIST-002 | View stats cards | Check stats section | Shows AZ, EU, and combined product counts |
| LIST-003 | Search product | Type "Alma" in search | Matching products shown |
| LIST-004 | Filter by category | Select "Meyvə" | Only fruit products shown |
| LIST-005 | Filter by data source | Select "🇦🇿 Yalnız Azərbaycan" | Only AZ products shown |
| LIST-006 | Filter by EU | Select "🇪🇺 Yalnız Avropa" | Only EU products shown |
| LIST-007 | Clear filter | Select "Hamısı" | All products shown |
| LIST-008 | View product badges | Check product cards | 🇦🇿, 🇪🇺, 🌍 badges visible |
| LIST-009 | View product images | Check product cards | Product images displayed |

### 8.3 Product Detail Tests

| ID | Scenario | Steps | Expected Result |
|----|----------|-------|-----------------|
| DET-001 | Load product page | Navigate to /products/apple | Product info and chart load |
| DET-002 | View sidebar | Check left sidebar | Product name, image, selectors visible |
| DET-003 | View main price | Check main card | Latest price with min/max shown |
| DET-004 | View market type cards | Check 4 medium cards | Country averages by type shown (AZ only) |
| DET-005 | View trend cards | Check 3 small cards | 30d, 6m, 1y changes shown |
| DET-006 | View chart | Check chart area | Line chart with data displayed |
| DET-007 | View market tables | Check bottom cards | Cheapest and expensive markets listed (AZ only) |
| DET-008 | View rich content | Scroll to bottom | Description, history, uses, etc. visible |
| DET-009 | View trade codes | Check codes section | FAO, HS, Eurostat codes visible |

### 8.4 Country Selector Tests

| ID | Scenario | Steps | Expected Result |
|----|----------|-------|-----------------|
| CNT-001 | View country selector | Check sidebar | "Ölkə" dropdown visible |
| CNT-002 | Open country dropdown | Click country selector | List of countries appears |
| CNT-003 | Select EU country | Select "Belçika" | URL updates to ?country=be |
| CNT-004 | Data changes for EU | After selecting BE | Chart shows Belgium data |
| CNT-005 | Markets hidden for EU | After selecting BE | Market filters disappear |
| CNT-006 | Switch back to AZ | Select "Azərbaycan" | Market filters reappear |
| CNT-007 | Country in URL | Navigate to /products/apple?country=de | Germany data loads |

### 8.5 Currency Selector Tests

| ID | Scenario | Steps | Expected Result |
|----|----------|-------|-----------------|
| CUR-001 | View currency selector | Check sidebar | "Valyuta" dropdown visible |
| CUR-002 | Open currency dropdown | Click currency selector | List of currencies appears |
| CUR-003 | Select EUR | Select "€ EUR" | All prices convert to EUR |
| CUR-004 | Chart updates | After currency change | Y-axis shows EUR values |
| CUR-005 | Price cards update | After currency change | All cards show EUR prices |
| CUR-006 | Symbol changes | After currency change | € symbol shown instead of ₼ |

### 8.6 Unit Selector Tests

| ID | Scenario | Steps | Expected Result |
|----|----------|-------|-----------------|
| UNT-001 | View unit selector | Check sidebar | "Ölçü vahidi" dropdown visible |
| UNT-002 | Open unit dropdown | Click unit selector | kg, 100kg, lb, ton options |
| UNT-003 | Select 100kg | Select "100kg" | Prices multiply by 100 |
| UNT-004 | Select lb | Select "lb (Funt)" | Prices convert to per-pound |
| UNT-005 | Chart updates | After unit change | Y-axis shows new unit values |
| UNT-006 | Label changes | After unit change | "₼/100kg" or "₼/lb" shown |

### 8.7 Filter Tests (AZ Only)

| ID | Scenario | Steps | Expected Result |
|----|----------|-------|-----------------|
| FIL-001 | Filter by market type | Select "Topdansatış" | Chart shows wholesale data |
| FIL-002 | Filter by market | Select specific market | Chart shows single market data |
| FIL-003 | Filter by product type | Select product variant | Chart shows variant data |
| FIL-004 | Filter by date range | Select "1 ay" | Chart shows last month |
| FIL-005 | Custom date range | Select "Xüsusi", set dates | Chart shows custom range |
| FIL-006 | Combine filters | Select type + market + range | Chart reflects all filters |
| FIL-007 | Filters hidden for EU | Select BE country | Market type/market filters hidden |

### 8.8 Market Comparison Tests (AZ Only)

| ID | Scenario | Steps | Expected Result |
|----|----------|-------|-----------------|
| CMP-001 | View comparison section | Check filter area | "Müqayisə" section visible |
| CMP-002 | Start comparison | Select comparison market | Second line appears on chart |
| CMP-003 | View comparison tooltip | Hover on chart | Both market prices shown |
| CMP-004 | Trend cards hidden | Start comparison | 30d/6m/1y cards disappear |
| CMP-005 | Clear comparison | Select "Müqayisə etmə" | Second line removed |
| CMP-006 | Trend cards return | Clear comparison | 30d/6m/1y cards reappear |

### 8.9 Country Comparison Tests

| ID | Scenario | Steps | Expected Result |
|----|----------|-------|-----------------|
| EUCMP-001 | View EU comparison card | Check sidebar | "Başqa ölkə ilə müqayisə" card visible |
| EUCMP-002 | Open country selector | Click dropdown | Available EU countries listed |
| EUCMP-003 | Select comparison country | Select "Almaniya" | Comparison data loads |
| EUCMP-004 | View comparison chart | Check comparison card | Two-line chart appears |
| EUCMP-005 | View price difference | Check summary | AZ vs EU prices and % diff shown |
| EUCMP-006 | Change comparison country | Select different country | Data updates |

### 8.10 Country Page Tests

| ID | Scenario | Steps | Expected Result |
|----|----------|-------|-----------------|
| CNTRY-001 | View countries list | Navigate to /countries | Grid of countries shown |
| CNTRY-002 | View AZ card | Check countries grid | Azerbaijan with stats visible |
| CNTRY-003 | View EU countries | Check countries grid | EU countries grouped by region |
| CNTRY-004 | Open AZ detail | Click Azerbaijan card | /countries/az loads |
| CNTRY-005 | View about section | Check AZ detail page | Description, agriculture, climate visible |
| CNTRY-006 | View key facts | Check sidebar | Population, area, capital visible |
| CNTRY-007 | View products | Scroll to products | Products grouped by category |
| CNTRY-008 | Click product | Click product card | Navigates to /products/[slug]?country=az |

### 8.11 Rich Content Tests

| ID | Scenario | Steps | Expected Result |
|----|----------|-------|-----------------|
| RICH-001 | View description | Check Təsvir section | Product description in AZ |
| RICH-002 | View history | Check Tarixi section | Product history text |
| RICH-003 | View uses | Check İstifadəsi section | Culinary uses described |
| RICH-004 | View nutrition | Check Qida dəyəri section | Nutritional info shown |
| RICH-005 | View varieties | Check Növləri section | Local and international varieties |
| RICH-006 | View seasonality | Check Mövsüm section | Harvest season info |
| RICH-007 | View storage | Check Saxlanma section | Storage conditions |
| RICH-008 | No content fallback | View product without content | Sections not shown |

### 8.12 Authentication Tests

| ID | Scenario | Steps | Expected Result |
|----|----------|-------|-----------------|
| AUTH-001 | Login success | Enter valid credentials | Redirect to dashboard |
| AUTH-002 | Login failure | Enter wrong password | Error message shown |
| AUTH-003 | Register new user | Fill registration form | Account created |
| AUTH-004 | Access dashboard | Navigate to /dashboard when logged in | Dashboard loads |
| AUTH-005 | Dashboard redirect | Navigate to /dashboard when not logged in | Redirect to login |
| AUTH-006 | Logout | Click logout | Redirect to home, logged out |

### 8.13 Edge Case Tests

| ID | Scenario | Steps | Expected Result |
|----|----------|-------|-----------------|
| EDGE-001 | No price data | View product without prices | "Bu dövr üçün məlumat yoxdur" message |
| EDGE-002 | No product types | View product without types | No type filter shown |
| EDGE-003 | Invalid product slug | Navigate to /products/invalid | 404 or error page |
| EDGE-004 | Invalid country code | Navigate to /countries/invalid | 404 or error page |
| EDGE-005 | EU product only | View product with only EU data | AZ filters hidden |
| EDGE-006 | AZ product only | View product with only AZ data | EU comparison empty |
| EDGE-007 | No rich content | View product without descriptions | Rich content section hidden |

### 8.14 Responsive Tests

| ID | Scenario | Viewport | Expected Result |
|----|----------|----------|-----------------|
| RES-001 | Desktop view | 1920x1080 | Full layout with sidebar |
| RES-002 | Tablet view | 768x1024 | Condensed layout |
| RES-003 | Mobile view | 375x812 | Stacked layout, hamburger menu |
| RES-004 | Chart responsive | All sizes | Chart resizes appropriately |

---

## 9. Accessibility & UX

### 9.1 Keyboard Navigation
- All interactive elements accessible via Tab
- Dropdowns navigable with Arrow keys
- Enter to select, Escape to close
- Focus visible on all elements

### 9.2 Loading States
- Skeleton loaders for charts
- Spinner for data fetching
- Disabled state during submission
- "Yüklənir..." text indicators

### 9.3 Error States
- Form validation messages in Azerbaijani
- Network error messages
- Empty state messages with helpful text
- 404 pages with navigation

### 9.4 Visual Indicators
- Active filter highlighting
- Hover states on cards and buttons
- Focus outlines on inputs
- Price trend arrows (▲ up green, ▼ down red)
- Country flags as emojis
- Data source badges (🇦🇿, 🇪🇺, 🌍)

---

## Appendix A: Test Data

### Available Products (Examples)

| Slug | Name (AZ) | Category | Has AZ | Has EU |
|------|-----------|----------|--------|--------|
| apple | Alma | Meyvə | ✅ | ✅ |
| tomato | Pomidor | Tərəvəz | ✅ | ✅ |
| grape | Üzüm | Meyvə | ✅ | ✅ |
| pomegranate | Nar | Meyvə | ✅ | ❌ |
| potato | Kartof | Tərəvəz | ✅ | ✅ |
| onion | Soğan | Tərəvəz | ✅ | ✅ |

### Available Countries

| Code | Name (AZ) | Type | Products |
|------|-----------|------|----------|
| AZ | Azərbaycan | Local | 52+ |
| BE | Belçika | EU | 30+ |
| DE | Almaniya | EU | 35+ |
| FR | Fransa | EU | 40+ |
| IT | İtaliya | EU | 38+ |
| ES | İspaniya | EU | 42+ |
| PL | Polşa | EU | 28+ |

### Market Types (AZ)

| Code | Name (AZ) | EU Equivalent |
|------|-----------|---------------|
| RETAIL | Pərakəndə satış | RETAIL |
| WHOLESALE | Topdansatış | WHOLESALE |
| PROCESSING | Müəssisə tərəfindən alış | PRODUCER |
| FIELD | Sahədən satış | PRODUCER |

### Currencies

| Code | Symbol | Name (AZ) |
|------|--------|-----------|
| AZN | ₼ | Azərbaycan manatı |
| EUR | € | Avro |
| USD | $ | ABŞ dolları |
| RUB | ₽ | Rusiya rublu |
| TRY | ₺ | Türk lirəsi |

### Units

| Code | Name (AZ) | Symbol | Conversion |
|------|-----------|--------|------------|
| kg | Kiloqram | kg | 1.0 |
| 100kg | 100 Kiloqram | 100kg | 0.01 |
| lb | Funt | lb | 2.20462 |
| ton | Ton | t | 0.001 |

---

## Appendix B: UI Text (Azerbaijani)

| Key | Text |
|-----|------|
| header.categories | Kateqoriyalar |
| header.products | Məhsullar |
| header.countries | Ölkələr |
| header.login | Daxil ol |
| header.register | Qeydiyyat |
| sidebar.unit | Ölçü vahidi |
| sidebar.currency | Valyuta |
| sidebar.country | Ölkə |
| filter.marketType | Bazar növü |
| filter.market | Bazar |
| filter.productType | Məhsul növü |
| filter.dateRange | Tarix aralığı |
| filter.all | Hamısı |
| filter.custom | Xüsusi |
| compare.label | Müqayisə |
| compare.clear | Müqayisə etmə |
| compare.country | Başqa ölkə ilə müqayisə |
| price.latest | Son qiymət |
| price.min | Min |
| price.max | Max |
| price.avg | Orta |
| trend.30days | Son 30 gün |
| trend.6months | Son 6 ay |
| trend.1year | Son 1 il |
| markets.cheapest | Ən ucuz 5 bazar |
| markets.expensive | Ən baha 5 bazar |
| markets.count | Bazarlar |
| about.title | haqqında |
| about.description | Təsvir |
| about.history | Tarixi |
| about.uses | İstifadəsi |
| about.nutrition | Qida dəyəri |
| about.varieties | Növləri |
| about.seasonality | Mövsüm |
| about.storage | Saxlanma şəraiti |
| about.codes | Beynəlxalq kodlar |
| country.az | Azərbaycan |
| data.azOnly | 🇦🇿 Yalnız Azərbaycan |
| data.euOnly | 🇪🇺 Yalnız Avropa |
| data.both | 🌍 Müqayisəli |
| noData | Bu dövr üçün məlumat yoxdur |
| loading | Yüklənir... |

---

## Appendix C: Data Sources

| Source | URL | Data Type | Update |
|--------|-----|-----------|--------|
| agro.gov.az | https://agro.gov.az | AZ prices | Weekly |
| Eurostat | https://ec.europa.eu/eurostat | EU annual prices | Yearly |
| EC Agri-food | https://agridata.ec.europa.eu | EU weekly prices | Weekly |
| CBAR | https://cbar.az | Official AZN exchange rates | 4x daily |
| ExchangeRate-API | https://exchangerate-api.com | 166 world currencies | Daily |

---

**Document End**

*This document is intended for TestSprite automated testing of user-facing features only. Admin panel features are documented separately in ADMIN_PANEL_GUIDE.md.*

*Version 2.0.0 - Updated January 2, 2026*
- Added multi-country support (AZ + EU)
- Added currency and unit selectors
- Added country comparison feature
- Added rich product content
- Added country detail pages
- Added product images
- Updated all test scenarios
