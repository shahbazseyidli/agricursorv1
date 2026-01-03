# AgriPrice - Global Agri-Food Price Intelligence Platform

A comprehensive agricultural commodity price monitoring and analytics platform supporting **Azerbaijan and 27 EU countries**.

## 🚀 Features

### 🌍 Multi-Country Support
- **Azerbaijan (AZ)**: Daily price data from agro.gov.az
- **European Union (EU)**: Annual data from Eurostat, weekly data from EC Agri-food Portal
- **Country Comparison**: Compare AZ prices with EU country prices
- **Universal Product Pages**: Single product page for all countries

### 💰 Currency & Unit Conversion
- **5+ Currencies**: AZN, EUR, USD, RUB, TRY (via CBAR & FreeCurrencyAPI)
- **Multiple Units**: kg, 100kg, lb, ton
- **Real-time Conversion**: Prices automatically converted based on selection

### 📊 Product Pages (Tridge-style)
- **Price Charts**: Line charts with confidence bands (min/avg/max)
- **Market Comparison**: Compare prices across markets (AZ only)
- **Country Comparison**: Compare AZ prices with EU countries
- **Rich Content**: Product descriptions, history, uses, nutrition, varieties
- **Product Images**: High-quality product photos

### 🏛 Country Pages
- **Detailed Info**: About, agriculture, climate, key facts
- **Data Sources**: Eurostat, EC Agrifood, agro.gov.az
- **Product Listings**: Products with price counts and images

### 👤 Admin Panel
- **Data Upload**: Excel-based price, product, and market data ingestion
- **CRUD Operations**: Full create, read, update, delete for all entities
- **EU Data Management**: Import and manage EU price data
- **Currency Management**: Automatic exchange rate updates

## 📋 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | SQLite (Prototype) / PostgreSQL (Production) |
| ORM | Prisma |
| Auth | NextAuth.js v4 |
| Charts | Recharts |
| Excel Parsing | xlsx (SheetJS) |
| External APIs | CBAR, FreeCurrencyAPI, Eurostat, EC Agrifood |

## 🛠 Installation

### Prerequisites
- Node.js 18.x or higher
- npm or yarn

### 1. Clone and Install

```bash
cd proto-3-crsr
npm install
```

### 2. Environment Configuration

Create `.env` file:

```env
# Database (SQLite for prototype)
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Currency APIs
FREE_CURRENCY_API_KEY="your-key"

# App
NODE_ENV="development"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed initial data
npm run db:seed
```

### 4. Seed Additional Data

```bash
# Seed EU countries and products
npx tsx scripts/seed-eu-data.ts

# Calculate AZ aggregate prices
npx tsx scripts/calculate-az-aggregates.ts

# Add product content
npx tsx scripts/seed-product-content.ts

# Add product images
npx tsx scripts/fetch-product-images.ts
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login, Register pages
│   ├── admin/               # Admin panel
│   │   ├── markets/         # Markets CRUD
│   │   ├── products/        # Products CRUD
│   │   ├── prices/          # Price management
│   │   └── upload/          # Excel upload
│   ├── dashboard/           # User dashboard
│   ├── products/            # Product listing & detail
│   │   └── [slug]/          # Product detail page
│   ├── countries/           # Country listing & detail
│   │   └── [code]/          # Country detail page
│   ├── categories/          # Category pages
│   └── api/
│       ├── admin/           # Admin APIs
│       ├── products/        # Product APIs
│       ├── comparison/      # Country comparison API
│       ├── currencies/      # Currency API
│       └── units/           # Units API
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── charts/              # Price chart components
│   ├── products/            # Product components (EU comparison)
│   └── layout/              # Layout components
├── lib/
│   ├── prisma.ts            # Prisma client
│   ├── auth.ts              # NextAuth config
│   ├── utils.ts             # Utility functions
│   └── utils/
│       └── unit-converter.ts # Unit conversion utilities
└── types/                   # TypeScript types

scripts/
├── seed-eu-data.ts          # Seed EU countries and products
├── calculate-az-aggregates.ts # Calculate AZ price aggregates
├── seed-product-content.ts  # Add rich product content
├── fetch-product-images.ts  # Add product images
└── seed-units.ts            # Seed unit conversion table
```

## 🔐 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@agriprice.az | admin123 |
| User | user@agriprice.az | user123 |

## 📊 Data Models

### Core Entities

| Model | Description |
|-------|-------------|
| Country | Local countries (AZ) |
| EuCountry | EU member states (27) |
| GlobalProduct | Unified product registry |
| Product | AZ products linked to GlobalProduct |
| EuProduct | EU products linked to GlobalProduct |
| Price | AZ price observations |
| EuPrice | EU price observations |
| AzPriceAggregate | Weekly/monthly AZ averages by market type |
| Currency | Exchange rates |
| Unit | Measurement units with conversion rates |

### Data Sources

| Source | Coverage | Frequency | Type |
|--------|----------|-----------|------|
| agro.gov.az | Azerbaijan | Weekly | Market prices |
| Eurostat | 27 EU countries | Yearly | Annual averages |
| EC Agrifood | EU countries | Weekly | Supply chain prices |
| CBAR | Currency | 4x daily | Exchange rates |
| FreeCurrencyAPI | Currency | Daily | Exchange rates |

## 🛡 API Endpoints

### Public APIs
```
GET /api/products                         - List all products (AZ + EU)
GET /api/products/[slug]                  - Product details
GET /api/products/[slug]/prices           - Price history with filters
    ?country=az|be|de...                  - Country filter
    ?currency=AZN|EUR|USD...              - Currency conversion
    ?unit=kg|100kg|lb|ton                 - Unit conversion
    ?range=1m|3m|6m|1y|all                - Date range
    
GET /api/comparison                       - Country price comparison
    ?productSlug=apple                    - Product to compare
    ?marketType=RETAIL                    - AZ market type
    ?euCountry=BE                         - EU country to compare
    
GET /api/currencies                       - List available currencies
GET /api/units                            - List available units
GET /api/eu/countries                     - List EU countries
```

### Admin APIs
```
POST /api/admin/upload/prices             - Upload price Excel
POST /api/admin/upload/products           - Upload products Excel
POST /api/admin/upload/markets            - Upload markets Excel
GET  /api/admin/markets                   - List/Create markets
GET  /api/admin/products                  - List/Create products
GET  /api/admin/categories                - List/Create categories
DELETE /api/admin/prices                  - Clear all prices
```

## 🚢 Deployment

### Production Build

```bash
npm run build
npm start
```

### Docker

```bash
docker build -t agriprice .
docker run -p 3000:3000 agriprice
```

## 📝 Scripts

```bash
npm run dev              # Development server (port 3000)
npm run build            # Production build
npm run start            # Production server
npm run lint             # ESLint
npm run db:generate      # Prisma generate
npm run db:push          # Prisma push schema
npm run db:seed          # Seed database
npm run db:studio        # Prisma Studio (port 5556)

# Custom scripts
npx tsx scripts/seed-eu-data.ts           # Seed EU data
npx tsx scripts/calculate-az-aggregates.ts # Calculate aggregates
npx tsx scripts/seed-product-content.ts    # Add product content
npx tsx scripts/fetch-product-images.ts    # Add product images
```

## 📄 Documentation

| Document | Description |
|----------|-------------|
| [PRODUCT_SPECIFICATION_USER.md](./PRODUCT_SPECIFICATION_USER.md) | User features for TestSprite |
| [PRODUCT_SPECIFICATION.md](./PRODUCT_SPECIFICATION.md) | Full technical specification |
| [ADMIN_PANEL_GUIDE.md](./ADMIN_PANEL_GUIDE.md) | Admin panel usage guide |
| [DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md) | Database schema reference |
| [Technical_spec.md](./Technical_spec.md) | Technical implementation details |

## 🔮 Roadmap

### Completed (v2.0)
- ✅ Multi-country support (AZ + 27 EU)
- ✅ Currency conversion (5+ currencies)
- ✅ Unit conversion (kg, 100kg, lb, ton)
- ✅ Country comparison feature
- ✅ Rich product content
- ✅ Product images
- ✅ Tridge-style country pages
- ✅ AZ price aggregates by market type

### Planned (v3.0+)
- [ ] FAO, IMF, World Bank data integration
- [ ] Import/Export trade data
- [ ] Multi-language support (AZ, EN, RU)
- [ ] Additional countries (CIS, Middle East)
- [ ] News/Analysis module
- [ ] Mobile application
- [ ] AI-powered price forecasting

## 📄 License

MIT License

---

**AgriPrice** © 2026 - Global Agricultural Price Intelligence
