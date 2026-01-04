import { notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ProductPageClient } from "./client";
import { Leaf, ChevronRight, Star, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ country?: string }>;
}

// Get user's country from Vercel headers or fallback
async function getUserCountry(): Promise<string | null> {
  try {
    const headersList = await headers();
    const country = headersList.get("x-vercel-ip-country");
    return country?.toUpperCase() || null;
  } catch {
    return null;
  }
}

async function getProductData(slug: string, countryCode?: string, userCountry?: string | null) {
  // First, try to find GlobalProduct with all relations
  const globalProduct = await prisma.globalProduct.findUnique({
    where: { slug },
    include: {
      globalCategory: true,
      productVarieties: {
        where: { isActive: true },
        orderBy: { slug: "asc" },
      },
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
      euProducts: {
        include: {
          prices: {
            take: 100,
            orderBy: { year: "desc" },
            include: { country: true }
          }
        }
      },
      faoProducts: {
        include: {
          prices: {
            take: 100,
            orderBy: { year: "desc" },
            include: { country: true }
          }
        }
      },
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

  if (globalProduct) {
    const azProduct = globalProduct.localProducts[0];
    
    let selectedCountry = countryCode?.toUpperCase();
    
    const countriesWithData = new Set<string>();
    if (azProduct) {
      countriesWithData.add("AZ");
    }
    globalProduct.fpmaCommodities.forEach(c => {
      c.series.filter(s => s.prices && s.prices.length > 0).forEach(s => {
        if (s.country.iso2) countriesWithData.add(s.country.iso2.toUpperCase());
        if (s.country.iso3) countriesWithData.add(s.country.iso3.toUpperCase());
      });
    });
    
    if (!selectedCountry) {
      if (userCountry && countriesWithData.has(userCountry)) {
        selectedCountry = userCountry;
      } else if (azProduct) {
        selectedCountry = "AZ";
      } else {
        const fpmaCountries = Array.from(countriesWithData);
        selectedCountry = fpmaCountries[0] || "AZ";
      }
    }
    
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

    const allCountries = globalCountries.map(c => ({
      id: c.id,
      name: c.nameAz || c.nameEn,
      iso2: c.iso2,
      type: "global" as const,
      flagEmoji: c.flagEmoji,
      region: c.region,
    }));

    const euPriceData = globalProduct.euProducts.flatMap(ep => 
      ep.prices.map(p => ({
        countryCode: p.country.code,
        countryName: p.country.nameAz || p.country.nameEn,
        price: p.price,
        year: p.year,
        source: p.source
      }))
    );

    const hasAzData = globalProduct.localProducts.length > 0;
    const hasEuData = globalProduct.euProducts.length > 0;
    const hasFaoData = globalProduct.faoProducts.length > 0;
    const hasFpmaData = globalProduct.fpmaCommodities.length > 0;

    const dataSources = [];
    if (hasAzData) dataSources.push({ code: "AGRO_AZ", name: "Agro.gov.az", icon: "🇦🇿" });
    if (hasEuData) dataSources.push({ code: "EUROSTAT", name: "Eurostat", icon: "🇪🇺" });
    if (hasFaoData) dataSources.push({ code: "FAOSTAT", name: "FAOSTAT", icon: "🌍" });
    if (hasFpmaData) dataSources.push({ code: "FAO_FPMA", name: "FAO FPMA", icon: "📊" });

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

    const fpmaSeriesWithPrices = globalProduct.fpmaCommodities.flatMap(c => c.series);
    const fpmaPriceStages = [...new Set(fpmaSeriesWithPrices
      .filter(s => s.globalPriceStage)
      .map(s => s.globalPriceStage!.code)
    )];

    const azMarketTypeCodes = azProduct?.productTypes 
      ? [...new Set(markets.map(m => m.marketType?.code).filter(Boolean))]
      : [];

    const availablePriceStages = allGlobalPriceStages.filter(stage => 
      fpmaPriceStages.includes(stage.code) || 
      azMarketTypeCodes.includes(stage.code) ||
      hasAzData
    );

    let availableFpmaMarkets = [...new Set(fpmaSeriesWithPrices
      .filter(s => s.market && (!countryCode || s.country.iso3?.toLowerCase() === countryCode.toLowerCase() || s.country.iso2?.toLowerCase() === countryCode.toLowerCase()))
      .map(s => JSON.stringify({
        id: s.market.id,
        name: s.market.name,
        globalMarketId: s.market.globalMarketId,
        countryIso3: s.country.iso3,
      }))
    )].map(s => JSON.parse(s));
    
    if (selectedCountry === "AZ") {
      const azGlobalMarkets = await prisma.globalMarket.findMany({
        where: {
          globalCountry: { iso2: "AZ" },
          isActive: true,
        },
        orderBy: [
          { sortOrder: "asc" },
          { name: "asc" },
        ],
      });
      
      const azMarketsList = azGlobalMarkets.map(m => ({
        id: m.id,
        name: m.nameAz || m.name,
        globalMarketId: m.id,
        countryIso3: "AZE",
        isNationalAvg: m.isNationalAvg,
      }));
      
      availableFpmaMarkets = [
        ...azMarketsList.filter(m => m.isNationalAvg),
        ...azMarketsList.filter(m => !m.isNationalAvg),
      ];
    }

    const fpmaCountriesWithData = [...new Set(fpmaSeriesWithPrices
      .filter(s => s.prices && s.prices.length > 0)
      .map(s => JSON.stringify({
        iso3: s.country.iso3,
        iso2: s.country.iso2 || s.country.globalCountry?.iso2,
        name: s.country.nameEn,
      }))
    )].map(s => JSON.parse(s));

    const categoryInfo = globalProduct.globalCategory ? {
      id: globalProduct.globalCategory.id,
      name: globalProduct.globalCategory.nameAz || globalProduct.globalCategory.nameEn,
      slug: globalProduct.globalCategory.slug,
    } : { id: "", name: "Other", slug: "other" };

    const productVarieties = globalProduct.productVarieties.map(v => ({
      id: v.id,
      slug: v.slug,
      name: v.nameAz || v.nameEn,
      hsCode: v.hsCode,
    }));

    // Count data coverage
    const euCountries = new Set(globalProduct.euProducts.flatMap(ep => ep.prices.map(p => p.country.code))).size;
    const faoCountries = new Set(globalProduct.faoProducts.flatMap(fp => fp.prices.map(p => p.country.code))).size;

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
        country: { id: "", name: "Azerbaijan", iso2: "AZ" }
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
      countryCount: 1 + euCountries + faoCountries + fpmaCountriesWithData.length,
    };
  }

  // Fall back to local AZ product
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
    countryCount: 1,
  };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { country } = await searchParams;
  
  const userCountry = await getUserCountry();
  
  const data = await getProductData(slug, country, userCountry);

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
    countryCount,
  } = data;

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

  // Calculate latest price for hero KPI
  const latestPrice = latestPrices[0];
  const priceChange = latestPrices.length >= 2 
    ? ((latestPrices[0]?.priceAvg - latestPrices[1]?.priceAvg) / latestPrices[1]?.priceAvg * 100)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl text-slate-900">Agrai</span>
              </Link>
              
              {/* Breadcrumb in header */}
              <nav className="hidden md:flex items-center gap-2 text-sm text-slate-500 ml-4 pl-4 border-l border-slate-200">
                <Link href="/products" className="hover:text-emerald-600">Products</Link>
                <ChevronRight className="w-4 h-4" />
                <span className="font-medium text-slate-900">{product.name}</span>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="hidden md:flex items-center gap-2">
                <Star className="w-4 h-4" /> Follow
              </Button>
              <Button variant="outline" size="sm" className="hidden md:flex items-center gap-2">
                <Share2 className="w-4 h-4" /> Share
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with KPIs */}
      <section className="pt-20 pb-6 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-6 py-6">
            {/* Product Image */}
            <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {productImage ? (
                <img src={productImage} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl">🌾</span>
              )}
            </div>
            
            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">
                  {product.category?.name || "Other"}
                </Badge>
                {dataSources.map(ds => (
                  <Badge key={ds.code} variant="outline" className="text-xs">
                    {ds.icon} {ds.name}
                  </Badge>
                ))}
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{product.name}</h1>
              <p className="text-slate-500">{product.nameEn}</p>
            </div>

            {/* Hero KPIs */}
            <div className="hidden lg:flex items-center gap-6">
              <div className="text-center px-4 border-l border-slate-200">
                <div className="text-2xl font-bold text-slate-900">
                  {latestPrice ? `$${latestPrice.priceAvg?.toFixed(2) || "—"}` : "—"}
                </div>
                <div className="text-xs text-slate-500">Latest Price</div>
              </div>
              <div className="text-center px-4 border-l border-slate-200">
                <div className={`text-2xl font-bold ${priceChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {priceChange ? `${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(1)}%` : "—"}
                </div>
                <div className="text-xs text-slate-500">1Y Change</div>
              </div>
              <div className="text-center px-4 border-l border-slate-200">
                <div className="text-2xl font-bold text-slate-900">{countryCount}</div>
                <div className="text-xs text-slate-500">Countries</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content with Tabs */}
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

      {/* Footer */}
      <footer className="bg-slate-900 py-8 px-4 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-white">Agrai</span>
          </div>
          <div className="text-sm text-slate-400">
            © 2026 Agrai. Powered by FAO, Eurostat, FAOSTAT
          </div>
        </div>
      </footer>
    </div>
  );
}
