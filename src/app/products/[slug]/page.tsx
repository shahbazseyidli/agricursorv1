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
  // First, try to find GlobalProduct with all relations
  const globalProduct = await prisma.globalProduct.findUnique({
    where: { slug },
    include: {
      // Global Category
      globalCategory: true,
      // Product varieties
      productVarieties: {
        where: { isActive: true },
        orderBy: { slug: "asc" },
      },
      // Local AZ products
      localProducts: {
        include: {
          category: true,
          productTypes: {
            include: {
              globalProductVariety: true,
            }
          },
          country: true,
        }
      },
      // EU products
      euProducts: {
        include: {
          prices: {
            take: 100,
            orderBy: { year: "desc" },
            include: { country: true }
          }
        }
      },
      // FAO products
      faoProducts: {
        include: {
          prices: {
            take: 100,
            orderBy: { year: "desc" },
            include: { country: true }
          }
        }
      },
      // FPMA commodities
      fpmaCommodities: {
        include: {
          series: {
            include: {
              country: {
                include: { globalCountry: true }
              },
              market: {
                include: { globalMarket: true }
              },
              globalPriceStage: true,
              prices: {
                take: 500,
                orderBy: { date: "desc" },
              }
            }
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
    // Priority: 1) URL country, 2) AZ if has data, 3) First country with FPMA data
    let selectedCountry = countryCode?.toUpperCase();
    
    if (!selectedCountry) {
      // No country in URL - find first country with data
      if (azProduct) {
        selectedCountry = "AZ"; // AZ has data
      } else {
        // Check FPMA countries
        const fpmaCountries = globalProduct.fpmaCommodities.flatMap(c => 
          c.series.filter(s => s.prices && s.prices.length > 0).map(s => s.country.iso2 || s.country.iso3)
        );
        selectedCountry = fpmaCountries[0]?.toUpperCase() || "AZ";
      }
    }
    
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

    // Get related products from GlobalProduct (same category)
    const relatedProducts = globalProduct.globalCategoryId 
      ? await prisma.globalProduct.findMany({
          where: {
            globalCategoryId: globalProduct.globalCategoryId,
            id: { not: globalProduct.id },
            isActive: true,
          },
          take: 5,
          select: {
            id: true,
            slug: true,
            nameAz: true,
            nameEn: true,
            image: true,
            _count: {
              select: {
                localProducts: true,
                euProducts: true,
                faoProducts: true,
                fpmaCommodities: true,
              }
            }
          }
        })
      : [];

    // Get all global products for dropdown
    const allProducts = await prisma.globalProduct.findMany({
      where: { isActive: true },
      select: {
        id: true,
        slug: true,
        nameAz: true,
        nameEn: true,
        globalCategoryId: true,
        globalCategory: { select: { slug: true, nameAz: true } }
      },
      orderBy: { nameAz: "asc" },
    });

    // Get all global categories
    const allCategories = await prisma.globalCategory.findMany({
      where: { isActive: true },
      select: {
        id: true,
        slug: true,
        nameAz: true,
        nameEn: true,
        _count: { select: { globalProducts: true } }
      },
      orderBy: { sortOrder: "asc" },
    });

    // Get all countries from GlobalCountry
    const globalCountries = await prisma.globalCountry.findMany({
      where: { isActive: true },
      orderBy: [
        { isFeatured: "desc" },
        { sortOrder: "asc" },
        { nameEn: "asc" }
      ],
      select: {
        id: true,
        iso2: true,
        iso3: true,
        nameEn: true,
        nameAz: true,
        flagEmoji: true,
        region: true,
      }
    });

    // Map to unified format
    const allCountries = globalCountries.map(c => ({
      id: c.id,
      name: c.nameAz || c.nameEn,
      iso2: c.iso2,
      type: "global" as const,
      flagEmoji: c.flagEmoji,
      region: c.region,
    }));

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

    // Check data availability per source
    const hasAzData = globalProduct.localProducts.length > 0;
    const hasEuData = globalProduct.euProducts.length > 0;
    const hasFaoData = globalProduct.faoProducts.length > 0;
    const hasFpmaData = globalProduct.fpmaCommodities.length > 0;

    // Get available data sources
    const dataSources = [];
    if (hasAzData) dataSources.push({ code: "AGRO_AZ", name: "Agro.gov.az", icon: "🇦🇿" });
    if (hasEuData) dataSources.push({ code: "EUROSTAT", name: "Eurostat", icon: "🇪🇺" });
    if (hasFaoData) dataSources.push({ code: "FAOSTAT", name: "FAOSTAT", icon: "🌍" });
    if (hasFpmaData) dataSources.push({ code: "FAO_FPMA", name: "FAO FPMA", icon: "📊" });

    // Get all GlobalPriceStages from database for filtering
    const allGlobalPriceStages = await prisma.globalPriceStage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        code: true,
        nameAz: true,
        nameEn: true,
      }
    });

    // Get FPMA price stages available for this product
    const fpmaSeriesWithPrices = globalProduct.fpmaCommodities.flatMap(c => c.series);
    const fpmaPriceStages = [...new Set(fpmaSeriesWithPrices
      .filter(s => s.globalPriceStage)
      .map(s => s.globalPriceStage!.code)
    )];

    // Get AZ market types (which are linked to GlobalPriceStage)
    const azMarketTypeCodes = azProduct?.productTypes 
      ? [...new Set(markets.map(m => m.marketType?.code).filter(Boolean))]
      : [];

    // Combine all available price stages
    const availablePriceStages = allGlobalPriceStages.filter(stage => 
      fpmaPriceStages.includes(stage.code) || 
      azMarketTypeCodes.includes(stage.code) ||
      hasAzData // Include all for AZ as they use aggregates
    );

    // Get FPMA markets available for this product (filtered by country if selected)
    const availableFpmaMarkets = [...new Set(fpmaSeriesWithPrices
      .filter(s => s.market && (!countryCode || s.country.iso3?.toLowerCase() === countryCode.toLowerCase() || s.country.iso2?.toLowerCase() === countryCode.toLowerCase()))
      .map(s => JSON.stringify({
        id: s.market.id,
        name: s.market.name,
        globalMarketId: s.market.globalMarketId,
        countryIso3: s.country.iso3,
      }))
    )].map(s => JSON.parse(s));

    // Get FPMA countries with data
    const fpmaCountriesWithData = [...new Set(fpmaSeriesWithPrices
      .filter(s => s.prices && s.prices.length > 0)
      .map(s => JSON.stringify({
        iso3: s.country.iso3,
        iso2: s.country.iso2 || s.country.globalCountry?.iso2,
        name: s.country.nameEn,
      }))
    )].map(s => JSON.parse(s));

    // Prepare category info from GlobalCategory
    const categoryInfo = globalProduct.globalCategory ? {
      id: globalProduct.globalCategory.id,
      name: globalProduct.globalCategory.nameAz || globalProduct.globalCategory.nameEn,
      slug: globalProduct.globalCategory.slug,
    } : { id: "", name: "Digər", slug: "other" };

    // Prepare product varieties
    const productVarieties = globalProduct.productVarieties.map(v => ({
      id: v.id,
      slug: v.slug,
      name: v.nameAz || v.nameEn,
      hsCode: v.hsCode,
    }));

    return {
      isGlobal: true,
      globalProduct,
      product: {
        id: globalProduct.id,
        name: globalProduct.nameAz || globalProduct.nameEn,
        nameEn: globalProduct.nameEn,
        slug: globalProduct.slug,
        unit: globalProduct.defaultUnit,
        category: categoryInfo,
        productTypes: azProduct?.productTypes || [],
        country: { id: "", name: "Azərbaycan", iso2: "AZ" }
      },
      markets,
      latestPrices,
      relatedProducts: relatedProducts.map(p => ({
        id: p.id,
        name: p.nameAz || p.nameEn,
        slug: p.slug,
        image: p.image,
        _count: { 
          prices: p._count.localProducts + p._count.euProducts + p._count.faoProducts + p._count.fpmaCommodities 
        }
      })),
      allProducts: allProducts.map(p => ({
        id: p.id,
        name: p.nameAz || p.nameEn,
        slug: p.slug,
        categoryId: p.globalCategoryId,
        globalProductId: p.id,
        globalProduct: { slug: p.slug }
      })),
      allCategories: allCategories.map(c => ({
        id: c.id,
        name: c.nameAz || c.nameEn,
        slug: c.slug,
        products: [{ slug: c.slug }]
      })),
      allCountries,
      selectedCountry,
      euPriceData,
      hasAzData,
      hasEuData,
      hasFaoData,
      hasFpmaData,
      dataSources,
      productVarieties,
      availablePriceStages,
      availableFpmaMarkets,
      fpmaCountriesWithData,
      productImage: globalProduct.image,
    };
  }

  // Fall back to local AZ product (and create GlobalProduct reference if needed)
  const product = await prisma.product.findFirst({
    where: { slug },
    include: {
      category: {
        include: { globalCategory: true }
      },
      productTypes: true,
      country: true,
      globalProduct: true,
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

  // Get all global products for dropdown
  const allProducts = await prisma.globalProduct.findMany({
    where: { isActive: true },
    select: {
      id: true,
      slug: true,
      nameAz: true,
      nameEn: true,
      globalCategoryId: true,
    },
    orderBy: { nameAz: "asc" },
  });

  // Get all global categories
  const allCategories = await prisma.globalCategory.findMany({
    where: { isActive: true },
    select: {
      id: true,
      slug: true,
      nameAz: true,
      nameEn: true,
    },
    orderBy: { sortOrder: "asc" },
  });

  // Get all countries from GlobalCountry
  const globalCountries = await prisma.globalCountry.findMany({
    where: { isActive: true },
    orderBy: [{ isFeatured: "desc" }, { nameEn: "asc" }],
    select: {
      id: true,
      iso2: true,
      nameEn: true,
      nameAz: true,
      flagEmoji: true,
    }
  });

  return {
    isGlobal: false,
    globalProduct: product.globalProduct,
    product: {
      ...product,
      category: product.category.globalCategory 
        ? { 
            id: product.category.globalCategory.id, 
            name: product.category.globalCategory.nameAz || product.category.globalCategory.nameEn,
            slug: product.category.globalCategory.slug 
          }
        : { id: product.category.id, name: product.category.name, slug: product.category.slug }
    },
    markets,
    latestPrices,
    relatedProducts: relatedProducts.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      image: null,
      _count: p._count
    })),
    allProducts: allProducts.map(p => ({
      id: p.id,
      name: p.nameAz || p.nameEn,
      slug: p.slug,
      categoryId: p.globalCategoryId,
      globalProductId: p.id,
      globalProduct: { slug: p.slug }
    })),
    allCategories: allCategories.map(c => ({
      id: c.id,
      name: c.nameAz || c.nameEn,
      slug: c.slug,
      products: [{ slug: c.slug }]
    })),
    allCountries: globalCountries.map(c => ({
      id: c.id,
      name: c.nameAz || c.nameEn,
      iso2: c.iso2,
      type: "global" as const,
      flagEmoji: c.flagEmoji,
    })),
    selectedCountry: "AZ",
    euPriceData: [],
    hasAzData: true,
    hasEuData: false,
    hasFaoData: false,
    hasFpmaData: false,
    dataSources: [{ code: "AGRO_AZ", name: "Agro.gov.az", icon: "🇦🇿" }],
    productVarieties: [],
    availablePriceStages: [],
    availableFpmaMarkets: [],
    fpmaCountriesWithData: [],
    productImage: null,
  };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { country } = await searchParams;
  const data = await getProductData(slug, country);

  if (!data) {
    notFound();
  }

  const { 
    product, 
    markets, 
    latestPrices, 
    relatedProducts, 
    allProducts, 
    allCategories, 
    allCountries, 
    selectedCountry, 
    hasAzData, 
    hasEuData,
    hasFaoData,
    hasFpmaData,
    dataSources,
    productVarieties,
    globalProduct,
    availablePriceStages,
    availableFpmaMarkets,
    fpmaCountriesWithData,
    productImage,
  } = data;

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
    fpmaCode: globalProduct.fpmaCode,
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
        hasFaoData={hasFaoData}
        hasFpmaData={hasFpmaData}
        dataSources={dataSources}
        productVarieties={productVarieties}
        productInfo={productInfo}
        availablePriceStages={availablePriceStages}
        availableFpmaMarkets={availableFpmaMarkets}
        fpmaCountriesWithData={fpmaCountriesWithData}
        productImage={productImage}
      />
    </div>
  );
}
