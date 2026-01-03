import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MarketBriefClient } from "@/components/home/market-brief-client";

// Get real stats from database
async function getStats() {
  const [productCount, marketCount, euCountryCount, priceCount, faoCountryCount, globalProductCount] = await Promise.all([
    prisma.product.count(),
    prisma.market.count(),
    prisma.euCountry.count(),
    prisma.price.count(),
    prisma.faoCountry.count(),
    prisma.globalProduct.count(),
  ]);

  return {
    products: globalProductCount,
    markets: marketCount,
    euCountries: euCountryCount,
    faoCountries: faoCountryCount,
    prices: priceCount,
  };
}

// Get categories with product counts
async function getCategories() {
  const categories = await prisma.globalProduct.groupBy({
    by: ['category'],
    _count: { id: true },
    where: { isActive: true, category: { not: null } },
  });

  return categories.map(c => ({
    name: c.category!,
    count: c._count.id,
  })).sort((a, b) => b.count - a.count);
}

// Get trending products (with most price data)
async function getTrendingProducts() {
  const products = await prisma.globalProduct.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: {
          localProducts: true,
          euProducts: true,
          faoProducts: true,
        }
      }
    },
    take: 10,
  });

  return products
    .map(p => ({
      id: p.id,
      slug: p.slug,
      nameAz: p.nameAz,
      nameEn: p.nameEn,
      category: p.category,
      image: p.image,
      dataCount: p._count.localProducts + p._count.euProducts + p._count.faoProducts,
    }))
    .sort((a, b) => b.dataCount - a.dataCount)
    .slice(0, 8);
}

// Get latest price updates (AZ markets)
async function getLatestAzPrices() {
  const prices = await prisma.price.findMany({
    orderBy: { date: 'desc' },
    take: 5,
    include: {
      product: {
        include: {
          globalProduct: true,
        }
      },
      market: {
        include: {
          marketType: true,
        }
      },
    },
  });

  return prices.map(p => ({
    id: p.id,
    productName: p.product.globalProduct?.nameAz || p.product.name,
    productSlug: p.product.globalProduct?.slug || p.product.slug,
    marketName: p.market.name,
    marketType: p.market.marketType?.nameAz || 'Digər',
    price: p.priceAvg,
    date: p.date.toISOString(),
  }));
}

// Get EU price updates
async function getLatestEuPrices() {
  const prices = await prisma.euPrice.findMany({
    orderBy: [{ year: 'desc' }, { period: 'desc' }],
    take: 5,
    include: {
      product: {
        include: {
          globalProduct: true,
        }
      },
      country: true,
    },
  });

  return prices.map(p => ({
    id: p.id,
    productName: p.product.globalProduct?.nameAz || p.product.nameEn,
    productSlug: p.product.globalProduct?.slug,
    countryName: p.country.nameAz || p.country.nameEn,
    countryCode: p.country.code,
    price: p.price,
    year: p.year,
    period: p.period,
  }));
}

// Get FAO price updates
async function getLatestFaoPrices() {
  const prices = await prisma.faoPrice.findMany({
    orderBy: { year: 'desc' },
    take: 5,
    include: {
      product: {
        include: {
          globalProduct: true,
        }
      },
      country: true,
    },
  });

  return prices.map(p => ({
    id: p.id,
    productName: p.product.globalProduct?.nameAz || p.product.nameEn,
    productSlug: p.product.globalProduct?.slug,
    countryName: p.country.nameAz || p.country.nameEn,
    countryCode: p.country.iso2 || p.country.code,
    price: p.price,
    year: p.year,
    currency: p.currency,
    unit: p.unit,
  }));
}

// Get countries with data
async function getCountriesWithData() {
  const [euCountries, faoCountries] = await Promise.all([
    prisma.euCountry.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { prices: true } }
      }
    }),
    prisma.faoCountry.findMany({
      include: {
        _count: { select: { prices: true } }
      }
    }),
  ]);

  const countriesMap = new Map<string, { code: string; name: string; nameAz: string; euPrices: number; faoPrices: number }>();

  euCountries.forEach(c => {
    countriesMap.set(c.code, {
      code: c.code,
      name: c.nameEn,
      nameAz: c.nameAz || c.nameEn,
      euPrices: c._count.prices,
      faoPrices: 0,
    });
  });

  faoCountries.forEach(c => {
    const iso = c.iso2 || c.code;
    const existing = countriesMap.get(iso);
    if (existing) {
      existing.faoPrices = c._count.prices;
    } else {
      countriesMap.set(iso, {
        code: iso,
        name: c.nameEn,
        nameAz: c.nameAz || c.nameEn,
        euPrices: 0,
        faoPrices: c._count.prices,
      });
    }
  });

  return Array.from(countriesMap.values())
    .filter(c => c.euPrices > 0 || c.faoPrices > 0)
    .sort((a, b) => (b.euPrices + b.faoPrices) - (a.euPrices + a.faoPrices))
    .slice(0, 12);
}

export default async function HomePage() {
  const [stats, categories, trendingProducts, latestAzPrices, latestEuPrices, latestFaoPrices, countriesWithData] = await Promise.all([
    getStats(),
    getCategories(),
    getTrendingProducts(),
    getLatestAzPrices(),
    getLatestEuPrices(),
    getLatestFaoPrices(),
    getCountriesWithData(),
  ]);

  return (
    <MarketBriefClient
      stats={stats}
      categories={categories}
      trendingProducts={trendingProducts}
      latestAzPrices={latestAzPrices}
      latestEuPrices={latestEuPrices}
      latestFaoPrices={latestFaoPrices}
      countriesWithData={countriesWithData}
    />
  );
}
