# Product Specification Document
## Agri-Food Price Intelligence Platform (AgriPrice AZ)

**Version:** 1.0.0  
**Date:** January 1, 2026  
**Status:** Prototype  
**Platform:** Web Application (Next.js)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
3. [User Roles & Personas](#3-user-roles--personas)
4. [Functional Requirements](#4-functional-requirements)
5. [User Flows](#5-user-flows)
6. [Page Specifications](#6-page-specifications)
7. [API Specifications](#7-api-specifications)
8. [Data Models](#8-data-models)
9. [Business Rules](#9-business-rules)
10. [Test Scenarios](#10-test-scenarios)
11. [Non-Functional Requirements](#11-non-functional-requirements)

---

## 1. Executive Summary

### 1.1 Purpose
AgriPrice AZ is a web-based platform for monitoring and analyzing agricultural commodity prices in Azerbaijan. It provides real-time price data from government sources (agro.gov.az) with visualization tools for price comparison and trend analysis.

### 1.2 Target Audience
- **Primary:** Agricultural analysts, traders, buyers
- **Secondary:** Farmers, government officials, researchers
- **Admin:** Platform administrators for data management

### 1.3 Key Features
- Price monitoring with min/avg/max confidence bands
- Tridge-style product detail pages
- Market comparison tools
- Excel-based data ingestion
- Multi-market type support (Retail, Wholesale, Processing, Field)

---

## 2. Product Overview

### 2.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                      │
├─────────────────────────────────────────────────────────────┤
│  Public Pages  │  User Dashboard  │     Admin Panel          │
│  - Home        │  - Overview      │     - Upload             │
│  - Products    │  - Compare       │     - Markets CRUD       │
│  - Product     │  - Markets       │     - Products CRUD      │
│    Detail      │                  │     - Prices Mgmt        │
├─────────────────────────────────────────────────────────────┤
│                      API Layer (Next.js API Routes)          │
├─────────────────────────────────────────────────────────────┤
│                      Database (SQLite/PostgreSQL)            │
│                      via Prisma ORM                          │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 14 (App Router), React, TypeScript |
| Styling | Tailwind CSS, shadcn/ui components |
| Charts | Recharts |
| Database | SQLite (prototype), PostgreSQL (production) |
| ORM | Prisma |
| Authentication | NextAuth.js v4 |
| Excel Parsing | xlsx (SheetJS) |

### 2.3 Supported Browsers
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

---

## 3. User Roles & Personas

### 3.1 Guest User (Unauthenticated)
- **Access:** Public pages only
- **Capabilities:**
  - View product listings
  - View product detail pages with price charts
  - View price data and trends
  - Cannot access dashboard or admin features

### 3.2 Registered User (USER role)
- **Access:** Public pages + User Dashboard
- **Capabilities:**
  - All guest capabilities
  - Access personal dashboard
  - Create price comparisons
  - Save preferences (future)

### 3.3 Administrator (ADMIN role)
- **Access:** Full platform access
- **Capabilities:**
  - All user capabilities
  - Upload Excel data files
  - CRUD operations on Markets, Products, Categories, Product Types
  - Manage price data
  - Clear data with confirmation

### 3.4 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@agriprice.az | admin123 |
| User | user@agriprice.az | user123 |

---

## 4. Functional Requirements

### 4.1 Public Features

#### FR-PUB-001: Product Listing Page
- Display all products with search and filter
- Show category badges
- Pagination support
- Link to product detail page

#### FR-PUB-002: Product Detail Page
- Display product information (name, category, unit)
- Show price chart with confidence bands
- Filter by market type, market, product type, date range
- Compare prices between markets
- Display cheapest/most expensive markets
- Show price trend cards (30d, 6m, 1y)

#### FR-PUB-003: Price Comparison
- Select comparison market via dropdown
- Overlay comparison data on chart
- Hide trend cards during comparison
- Show both market prices in tooltip

### 4.2 Admin Features

#### FR-ADM-001: Data Upload
- Upload Excel files for prices, products, markets
- Show upload progress and statistics
- Display success/error counts
- Support multiple market types

#### FR-ADM-002: Markets Management
- List all markets with filters (country, market type)
- Create new market (select country, market type)
- Edit existing market
- Delete individual market
- Clear all markets (with confirmation dialog)

#### FR-ADM-003: Products Management
- List all products with category filter
- Create new product (name, slug, category)
- Edit existing product
- Delete individual product
- Clear all products (with confirmation dialog)

#### FR-ADM-004: Categories Management
- List all categories
- Create new category
- Edit existing category
- Delete category

#### FR-ADM-005: Product Types Management
- List all product types with product filter
- Create new product type (name, product, optional EN/RU names)
- Edit existing product type
- Delete product type

#### FR-ADM-006: Price Management
- View price statistics (total count, by market type)
- Upload prices per market type
- Clear all price data (with confirmation)

---

## 5. User Flows

### 5.1 View Product Prices (Guest)

```
1. User navigates to /products
2. User sees product listing with categories
3. User clicks on a product (e.g., "Alma")
4. System navigates to /products/apple
5. System loads product data and prices
6. System auto-selects:
   - Default market type: RETAIL (if available)
   - Default market: First with data (alphabetically)
   - Default product type: First with data
   - Default date range: "all"
7. User sees:
   - Product info card (left sidebar)
   - Price chart with filters
   - Market type price cards
   - Trend cards (30d, 6m, 1y)
   - Cheapest/Most expensive markets
```

### 5.2 Compare Markets (Guest)

```
1. User is on product detail page
2. User sees "Müqayisə" (Comparison) filter row
3. User opens comparison dropdown
4. User selects a different market
5. System fetches comparison data
6. Chart updates with two lines (different colors)
7. Trend cards (30d, 6m, 1y) are hidden
8. Tooltip shows both market prices
9. User clicks "Təmizlə" (Clear) to remove comparison
```

### 5.3 Upload Price Data (Admin)

```
1. Admin logs in with admin@agriprice.az / admin123
2. Admin navigates to /admin
3. Admin clicks "Qiymət Məlumatları" (Prices) in navigation
4. Admin sees price statistics and upload sections
5. Admin selects market type (e.g., "Pərakəndə satış")
6. Admin uploads Excel file (upload_retail.xlsx)
7. System parses and validates file
8. System shows progress
9. System displays results:
   - New records count
   - Updated records count
   - Skipped records count
   - Error count
10. Admin can upload more files or clear all prices
```

### 5.4 Create New Market (Admin)

```
1. Admin navigates to /admin/markets
2. Admin clicks "+ Yeni Bazar" (New Market)
3. Dialog opens with form:
   - Name (required)
   - Country dropdown (select Azerbaijan)
   - Market Type dropdown (select type)
4. Admin fills form and clicks "Əlavə et" (Add)
5. System creates market
6. Table refreshes with new market
7. Success toast is shown
```

### 5.5 Delete All Prices (Admin)

```
1. Admin navigates to /admin/prices
2. Admin clicks "Bütün qiymətləri sil" (Delete All Prices)
3. Confirmation dialog appears
4. Dialog shows count of records to be deleted
5. Admin types confirmation text or clicks confirm
6. System deletes all price records
7. Statistics refresh to show 0 prices
8. Success message displayed
```

---

## 6. Page Specifications

### 6.1 Home Page (/)

| Element | Description |
|---------|-------------|
| Header | Logo, navigation links, login button |
| Hero Section | Platform title and description |
| Featured Products | Grid of featured products (if any) |
| Statistics | Quick stats (products, markets, prices) |
| Footer | Copyright, links |

### 6.2 Products Listing (/products)

| Element | Description |
|---------|-------------|
| Search | Text search by product name |
| Category Filter | Dropdown to filter by category |
| Product Grid | Cards showing product name, category, latest price |
| Pagination | Page navigation |

### 6.3 Product Detail (/products/[slug])

#### Left Sidebar
| Element | Description |
|---------|-------------|
| Product Card | Name, category badge, unit, country, market count |
| Product Types | List of available variants as badges |
| Quick Links | "Müqayisə et" link |
| Related Products | Links to products in same category |

#### Main Content Area
| Element | Description |
|---------|-------------|
| Big Price Card | Latest price (AVG) with MIN/MAX, date, change percentage |
| Market Type Cards | 4 cards showing country average by market type |
| Trend Cards | 30-day, 6-month, 1-year price change (hidden in comparison mode) |
| Chart Card | Price line chart with filters |
| Chart Filters | Market Type, Market, Product Type, Date Range dropdowns |
| Comparison Row | Dropdown to select comparison market |
| Chart Legend | Shows selected markets |
| Market Tables | Cheapest 5, Most Expensive 5 markets |

### 6.4 Admin Dashboard (/admin)

| Element | Description |
|---------|-------------|
| Stats Cards | Total products, markets, prices, categories |
| Quick Actions | Links to main admin functions |
| Recent Uploads | List of recent upload operations |

### 6.5 Admin Markets (/admin/markets)

| Element | Description |
|---------|-------------|
| Filters | Country dropdown, Market Type dropdown |
| Actions Bar | "New Market" button, "Clear All" button |
| Markets Table | Name, Market Type, Country, Actions (Edit, Delete) |
| Pagination | If needed |

### 6.6 Admin Products (/admin/products)

| Element | Description |
|---------|-------------|
| Tabs | Products, Categories, Product Types |
| Products Tab | Table with Name, Slug, Category, Actions |
| Categories Tab | Table with Name, Product Count, Actions |
| Product Types Tab | Table with Name, Product, Actions |
| Dialogs | Create/Edit forms for each entity |

### 6.7 Admin Prices (/admin/prices)

| Element | Description |
|---------|-------------|
| Stats Cards | Total prices, prices by market type |
| Upload Sections | One per market type with file input |
| Upload Results | Shows new/updated/skipped/error counts |
| Clear Section | "Delete All Prices" button with confirmation |

---

## 7. API Specifications

### 7.1 GET /api/products/[slug]/prices

**Description:** Get price data for a product with filters and statistics.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| range | string | No | Time range: 1m, 3m, 6m, 1y, all (default: 6m) |
| marketType | string | No | Filter by market type ID |
| market | string | No | Filter by market ID |
| productType | string | No | Filter by product type ID |
| compareMarkets | string | No | Comma-separated market IDs for comparison |

**Response:**
```json
{
  "data": [
    {
      "date": "2025-12-25",
      "priceMin": 1.50,
      "priceAvg": 1.75,
      "priceMax": 2.00,
      "market": "Bakı-8km bazarı",
      "marketType": "Pərakəndə satış"
    }
  ],
  "comparisonData": [
    {
      "marketId": "xxx",
      "marketName": "Qazax bazarı",
      "marketType": "Pərakəndə satış",
      "data": [{ "date": "2025-12-25", "priceAvg": 1.60 }]
    }
  ],
  "stats": {
    "latestPrice": {
      "priceMin": 1.50,
      "priceAvg": 1.75,
      "priceMax": 2.00,
      "date": "2025-12-25T00:00:00.000Z",
      "currency": "AZN",
      "market": "Bakı-8km bazarı",
      "marketType": "Pərakəndə satış"
    },
    "priceChange": {
      "value": 0.05,
      "percentage": 2.94,
      "direction": "up"
    },
    "priceChanges": {
      "days30": { "percentage": 5.2, "direction": "up" },
      "months6": { "percentage": -3.1, "direction": "down" },
      "year1": { "percentage": 12.5, "direction": "up" }
    },
    "marketTypeStats": [
      {
        "marketTypeId": "xxx",
        "marketTypeName": "Pərakəndə satış",
        "marketTypeCode": "RETAIL",
        "avgPrice": 1.75,
        "minPrice": 1.50,
        "maxPrice": 2.00,
        "date": "2025-12-25",
        "marketCount": 21
      }
    ],
    "totalRecords": 150
  },
  "filters": {
    "marketTypes": [
      { "id": "xxx", "name": "Pərakəndə satış", "code": "RETAIL", "hasData": true }
    ],
    "markets": [
      { "id": "xxx", "name": "Bakı-8km bazarı", "marketTypeId": "xxx", "hasData": true }
    ],
    "productTypes": [
      { "id": "xxx", "name": "Alma", "hasData": true }
    ]
  }
}
```

### 7.2 POST /api/admin/upload/prices

**Description:** Upload price data from Excel file.

**Request:**
- Content-Type: multipart/form-data
- Body: `file` (Excel file), `marketType` (market type code)

**Response:**
```json
{
  "success": true,
  "message": "Yükləmə uğurla tamamlandı",
  "stats": {
    "totalRows": 500,
    "newRecords": 450,
    "updatedRecords": 30,
    "skippedRecords": 15,
    "errors": 5
  }
}
```

### 7.3 DELETE /api/admin/prices

**Description:** Clear all price data.

**Response:**
```json
{
  "success": true,
  "deletedCount": 50000,
  "message": "50000 qiymət silindi"
}
```

---

## 8. Data Models

### 8.1 Country
```
id: String (CUID)
iso2: String (unique, e.g., "AZ")
name: String ("Azərbaycan")
```

### 8.2 MarketType
```
id: String (CUID)
code: String (unique, e.g., "RETAIL")
nameAz: String ("Pərakəndə satış")
nameEn: String? ("Retail")
nameRu: String? ("Розничная торговля")
countryId: FK → Country
```

### 8.3 Market
```
id: String (CUID)
name: String ("Bakı-8km bazarı")
nameEn: String?
nameRu: String?
aliases: String? (comma-separated)
countryId: FK → Country
marketTypeId: FK → MarketType
UNIQUE(name, marketTypeId, countryId)
```

### 8.4 Category
```
id: String (CUID)
name: String ("Meyvə")
nameEn: String? ("Fruit")
nameRu: String? ("Фрукты")
slug: String ("fruit")
aliases: String?
countryId: FK → Country
UNIQUE(countryId, slug)
```

### 8.5 Product
```
id: String (CUID)
name: String ("Alma")
nameEn: String? ("Apple")
nameRu: String? ("Яблоко")
slug: String ("apple")
aliases: String?
hsCode: String?
unit: String ("kg")
countryId: FK → Country
categoryId: FK → Category
UNIQUE(countryId, slug)
```

### 8.6 ProductType
```
id: String (CUID)
name: String ("Qırmızı alma")
nameEn: String? ("Red Apple")
nameRu: String? ("Красное яблоко")
productId: FK → Product
```

### 8.7 Price
```
id: String (CUID)
countryId: FK → Country
productId: FK → Product
productTypeId: FK? → ProductType
marketId: FK → Market
date: DateTime
priceMin: Decimal
priceAvg: Decimal
priceMax: Decimal
unit: String
currency: String ("AZN")
source: String?
UNIQUE(countryId, productId, productTypeId, marketId, date)
```

---

## 9. Business Rules

### 9.1 Data Scoping
- All data is scoped by Country
- Currently only Azerbaijan (AZ) is supported
- Schema supports future multi-country expansion

### 9.2 Market Types
- Fixed set of 4 types: RETAIL, WHOLESALE, PROCESSING, FIELD
- Seeded at database initialization
- Cannot be modified via UI

### 9.3 Price Upload
- Each market type has separate upload file
- Duplicate detection based on: country + product + productType + market + date
- Existing records are updated, new records are created

### 9.4 Product Types
- Optional - products can exist without types
- Belongs to exactly one product
- If product has types, user must select one (no "All" option)

### 9.5 Deletion Rules
- Deleting a market cascades to prices
- Deleting a product cascades to product types and prices
- Deleting a category cascades to products
- Clear all operations require confirmation dialog

### 9.6 Default Selections
- Default market type: RETAIL (if has data)
- Default market: First alphabetically with data
- Default product type: First with data
- Default date range: "all"

---

## 10. Test Scenarios

### 10.1 Public Page Tests

| ID | Scenario | Steps | Expected Result |
|----|----------|-------|-----------------|
| T-PUB-001 | View product list | Navigate to /products | Product grid displays with categories |
| T-PUB-002 | View product detail | Click on "Alma" product | Product page loads with chart and filters |
| T-PUB-003 | Filter by market type | Select "Topdansatış" from dropdown | Chart updates with wholesale data |
| T-PUB-004 | Filter by market | Select specific market | Chart shows only that market's data |
| T-PUB-005 | Filter by date range | Select "1 ay" | Chart shows last month only |
| T-PUB-006 | Compare markets | Select comparison market | Two lines appear on chart |
| T-PUB-007 | Clear comparison | Click "Təmizlə" | Second line removed, trend cards reappear |

### 10.2 Admin Page Tests

| ID | Scenario | Steps | Expected Result |
|----|----------|-------|-----------------|
| T-ADM-001 | Admin login | Enter admin credentials | Redirect to /admin dashboard |
| T-ADM-002 | Create market | Fill form, submit | New market appears in table |
| T-ADM-003 | Edit market | Click edit, modify, save | Market updated |
| T-ADM-004 | Delete market | Click delete, confirm | Market removed |
| T-ADM-005 | Upload prices | Select file, upload | Success stats shown |
| T-ADM-006 | Clear all prices | Click delete, confirm | All prices removed |
| T-ADM-007 | Create product | Fill form with name, slug, category | Product created |
| T-ADM-008 | Create category | Fill form with name | Category created |
| T-ADM-009 | Create product type | Select product, enter name | Type created |

### 10.3 API Tests

| ID | Scenario | Endpoint | Expected |
|----|----------|----------|----------|
| T-API-001 | Get product prices | GET /api/products/apple/prices | 200 with data array |
| T-API-002 | Get with filters | GET /api/products/apple/prices?marketType=xxx | Filtered data |
| T-API-003 | Get comparison | GET /api/products/apple/prices?compareMarkets=xxx | comparisonData included |
| T-API-004 | List markets | GET /api/admin/markets | 200 with markets array |
| T-API-005 | Create market | POST /api/admin/markets | 201 with new market |
| T-API-006 | Delete prices | DELETE /api/admin/prices | 200 with deleted count |

### 10.4 Edge Cases

| ID | Scenario | Expected Result |
|----|----------|-----------------|
| T-EDGE-001 | Product with no prices | "Qiymət məlumatı yoxdur" message |
| T-EDGE-002 | Product with no types | No type filter shown |
| T-EDGE-003 | Empty market type | Dropdown option disabled |
| T-EDGE-004 | Duplicate upload | Updates existing, creates new |
| T-EDGE-005 | Invalid Excel format | Error message with details |

---

## 11. Non-Functional Requirements

### 11.1 Performance
- Page load time: < 3 seconds
- API response time: < 500ms
- Chart rendering: < 1 second
- Excel upload: Process 5000 rows in < 30 seconds

### 11.2 Security
- Authentication required for admin/dashboard
- Session-based auth with secure cookies
- Input validation on all forms
- SQL injection prevention via Prisma

### 11.3 Accessibility
- Semantic HTML structure
- Keyboard navigation support
- Color contrast compliance
- Screen reader compatibility

### 11.4 Responsive Design
- Desktop: Full layout (1200px+)
- Tablet: Condensed layout (768px-1199px)
- Mobile: Stacked layout (<768px)

### 11.5 Error Handling
- User-friendly error messages in Azerbaijani
- Validation errors shown inline
- Network errors with retry option
- 404/500 error pages

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| Market Type | Category of trading: Retail, Wholesale, Processing, Field |
| Product Type | Variant of a product (e.g., Red Apple vs Yellow Apple) |
| Confidence Band | Price range shown as min-max shaded area on chart |
| CUID | Collision-resistant Unique Identifier |

## Appendix B: File Upload Formats

### markets.xlsx
| Column | Required | Description |
|--------|----------|-------------|
| Market | Yes | Market name in Azerbaijani |
| type | Yes | Market type name (matches MarketType.nameAz) |

### products.xlsx
| Column | Required | Description |
|--------|----------|-------------|
| product_name | Yes | Product name in Azerbaijani |
| category | Yes | Category name |
| slug | Yes | URL-safe identifier (lowercase, kebab-case) |
| name_en | No | English name |
| name_ru | No | Russian name |

### upload_[type].xlsx (prices)
| Column | Required | Description |
|--------|----------|-------------|
| product_name | Yes | Product name |
| product_type | No | Variant name |
| date | Yes | Date (DD.MM.YYYY) |
| market | Yes | Market name |
| price_min | Yes | Minimum price |
| price_avg | Yes | Average price |
| price_max | Yes | Maximum price |
| unit | Yes | Measurement unit |
| currency | Yes | Currency code (AZN) |
| source | No | Data source |

---

**Document End**







