import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductPageClient } from "./client";
import { Leaf, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ country?: string }>;
}

async function getProductData(slug: string, countryCode?: string) {
  // First, try to find GlobalProduct
  const globalProduct = await prisma.globalProduct.findUnique({
    where: { slug },
    include: {
      localProducts: {
        include: {
          category: true,
          productTypes: true,
          country: true,
        }
      },
      euProducts: {
        include: {
          prices: {
            take: 100,
            orderBy: { year: "desc" },
            include: { country: true }
          }
        }
      }
    }
  });

  // If GlobalProduct found, use it
  if (globalProduct) {
    // Get AZ product data if available
    const azProduct = globalProduct.localProducts[0];
    
    // Determine which country to show by default
    const selectedCountry = countryCode?.toUpperCase() || "AZ";
    
    // Get markets (only for AZ)
    let markets: Awaited<ReturnType<typeof prisma.market.findMany>> = [];
    let latestPrices: Awaited<ReturnType<typeof prisma.price.findMany>> = [];
    
    if (azProduct && selectedCountry === "AZ") {
      markets = await prisma.market.findMany({
        where: {
          prices: {
            some: { productId: azProduct.id },
          },
        },
        include: {
          marketType: true,
        },
      });

      latestPrices = await prisma.price.findMany({
        where: { productId: azProduct.id },
        orderBy: { date: "desc" },
        take: 50,
        include: {
          market: {
            include: {
              marketType: true,
            },
          },
        },
        distinct: ["marketId"],
      });
    }

    // Get related products
    const relatedProducts = azProduct ? await prisma.product.findMany({
      where: {
        categoryId: azProduct.categoryId,
        id: { not: azProduct.id },
      },
      take: 5,
      include: {
        _count: { select: { prices: true } },
      },
    }) : [];

    // Get all products for dropdown
    const allProducts = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        categoryId: true,
        globalProductId: true,
        globalProduct: { select: { slug: true } }
      },
      orderBy: { name: "asc" },
    });

    // Get all categories
    const allCategories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        products: {
          take: 1,
          select: { slug: true, globalProduct: { select: { slug: true } } },
        },
      },
      orderBy: { name: "asc" },
    });

    // Get all countries (AZ + EU + FAO + FPMA)
    const azCountry = await prisma.country.findFirst({ where: { iso2: "AZ" } });
    const euCountries = await prisma.euCountry.findMany({
      where: { isActive: true },
      orderBy: { nameEn: "asc" }
    });
    const faoCountries = await prisma.faoCountry.findMany({
      where: { isActive: true },
      orderBy: { nameEn: "asc" }
    });
    const fpmaCountries = await prisma.fpmaCountry.findMany({
      where: { isActive: true },
      orderBy: { nameEn: "asc" }
    });

    // Create unified country list with deduplication
    const countryMap = new Map<string, { id: string; name: string; iso2: string; type: "local" | "eu" | "fao" | "fpma" }>();
    
    // Add AZ first
    if (azCountry) {
      countryMap.set("AZ", {
        id: azCountry.id,
        name: azCountry.name,
        iso2: "AZ",
        type: "local"
      });
    }
    
    // Add EU countries
    euCountries.forEach(c => {
      if (!countryMap.has(c.code)) {
        countryMap.set(c.code, {
          id: c.id,
          name: c.nameAz || c.nameEn,
          iso2: c.code,
          type: "eu"
        });
      }
    });
    
    // Add FAO countries
    faoCountries.forEach(c => {
      const iso2 = c.iso2 || c.code.substring(0, 2);
      if (!countryMap.has(iso2)) {
        countryMap.set(iso2, {
          id: c.id,
          name: c.nameAz || c.nameEn,
          iso2: iso2,
          type: "fao"
        });
      }
    });
    
    // Add FPMA countries
    fpmaCountries.forEach(c => {
      const iso2 = c.iso2 || c.iso3.substring(0, 2);
      if (!countryMap.has(iso2)) {
        countryMap.set(iso2, {
          id: c.id,
          name: c.nameAz || c.nameEn,
          iso2: iso2,
          type: "fpma"
        });
      }
    });

    const allCountries = Array.from(countryMap.values()).sort((a, b) => {
      // AZ first
      if (a.iso2 === "AZ") return -1;
      if (b.iso2 === "AZ") return 1;
      return a.name.localeCompare(b.name, "az");
    });

    // Get EU price data for this product
    const euPriceData = globalProduct.euProducts.flatMap(ep => 
      ep.prices.map(p => ({
        countryCode: p.country.code,
        countryName: p.country.nameAz || p.country.nameEn,
        price: p.price,
        year: p.year,
        source: p.source
      }))
    );

    return {
      isGlobal: true,
      globalProduct,
      product: azProduct || {
        id: globalProduct.id,
        name: globalProduct.nameAz || globalProduct.nameEn,
        nameEn: globalProduct.nameEn,
        slug: globalProduct.slug,
        unit: globalProduct.defaultUnit,
        category: { id: "", name: globalProduct.category || "Digər", slug: globalProduct.category?.toLowerCase() || "other" },
        productTypes: [],
        country: azCountry || { id: "", name: "Azərbaycan", iso2: "AZ" }
      },
      markets,
      latestPrices,
      relatedProducts,
      allProducts,
      allCategories,
      allCountries,
      selectedCountry,
      euPriceData,
      hasAzData: !!azProduct,
      hasEuData: globalProduct.euProducts.length > 0
    };
  }

  // Fall back to local AZ product
  const product = await prisma.product.findFirst({
    where: { slug },
    include: {
      category: true,
      productTypes: true,
      country: true,
    },
  });

  if (!product) return null;

  const markets = await prisma.market.findMany({
    where: {
      prices: {
        some: { productId: product.id },
      },
    },
    include: {
      marketType: true,
    },
  });

  const latestPrices = await prisma.price.findMany({
    where: { productId: product.id },
    orderBy: { date: "desc" },
    take: 50,
    include: {
      market: {
        include: {
          marketType: true,
        },
      },
    },
    distinct: ["marketId"],
  });

  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
    },
    take: 5,
    include: {
      _count: { select: { prices: true } },
    },
  });

  const allProducts = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      categoryId: true,
      globalProductId: true,
      globalProduct: { select: { slug: true } }
    },
    orderBy: { name: "asc" },
  });

  const allCategories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      products: {
        take: 1,
        select: { slug: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const allCountries = await prisma.country.findMany({
    select: {
      id: true,
      name: true,
      iso2: true,
    },
    orderBy: { name: "asc" },
  });

  return {
    isGlobal: false,
    globalProduct: null,
    product,
    markets,
    latestPrices,
    relatedProducts,
    allProducts,
    allCategories,
    allCountries: allCountries.map(c => ({ ...c, type: "local" as const })),
    selectedCountry: "AZ",
    euPriceData: [],
    hasAzData: true,
    hasEuData: false
  };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { country } = await searchParams;
  const data = await getProductData(slug, country);

  if (!data) {
    notFound();
  }

  const { product, markets, latestPrices, relatedProducts, allProducts, allCategories, allCountries, selectedCountry, hasAzData, hasEuData, globalProduct } = data;

  // Prepare product info for Tridge-style rich content
  const productInfo = globalProduct ? {
    descriptionAz: globalProduct.descriptionAz,
    descriptionEn: globalProduct.descriptionEn,
    history: globalProduct.history,
    uses: globalProduct.uses,
    nutrition: globalProduct.nutrition,
    varieties: globalProduct.varieties,
    storage: globalProduct.storage,
    seasonality: globalProduct.seasonality,
    image: globalProduct.image,
    faoCode: globalProduct.faoCode,
    hsCode: globalProduct.hsCode,
    eurostatCode: globalProduct.eurostatCode,
  } : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-900">AgriPrice</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link
                href="/categories"
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Kateqoriyalar
              </Link>
              <Link
                href="/products"
                className="text-sm font-medium text-emerald-600"
              >
                Məhsullar
              </Link>
              <Link
                href="/countries"
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Ölkələr
              </Link>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Dashboard
              </Link>
            </nav>
            <Button asChild>
              <Link href="/login">Daxil ol</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="hover:text-slate-700">
              Ana səhifə
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/products" className="hover:text-slate-700">
              Məhsullar
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link
              href={`/categories/${product.category?.slug || "other"}`}
              className="hover:text-slate-700"
            >
              {product.category?.name || "Digər"}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900 font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      <ProductPageClient
        product={product}
        markets={markets}
        latestPrices={latestPrices}
        relatedProducts={relatedProducts}
        allProducts={allProducts}
        allCategories={allCategories}
        allCountries={allCountries}
        selectedCountry={selectedCountry}
        hasAzData={hasAzData}
        hasEuData={hasEuData}
        productInfo={productInfo}
      />
    </div>
  );
}
