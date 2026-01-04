import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ChevronRight,
  Leaf,
  Package,
  MapPin,
  TrendingUp,
  Star,
  Share2,
  Database,
  Calendar,
  BarChart3,
  Store,
  Globe,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

interface Params {
  code: string;
}

// Country flag emoji from ISO code
function getFlagEmoji(countryCode: string) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

async function getCountryData(code: string) {
  const upperCode = code.toUpperCase();
  
  // First, try to find GlobalCountry
  const globalCountry = await prisma.globalCountry.findFirst({
    where: {
      OR: [
        { iso2: upperCode },
        { iso3: upperCode }
      ]
    },
    include: {
      globalMarkets: true,
    }
  });
  
  // Check if it's Azerbaijan (local country)
  if (upperCode === "AZ") {
    const country = await prisma.country.findFirst({
      where: { iso2: "AZ" },
      include: {
        _count: { select: { prices: true, markets: true } }
      }
    });

    if (!country) return null;

    const products = await prisma.product.findMany({
      where: { countryId: country.id },
      include: {
        category: true,
        globalProduct: true,
        _count: { select: { prices: true } }
      },
      orderBy: { name: "asc" }
    });

    const yearRange = await prisma.price.aggregate({
      where: { countryId: country.id },
      _min: { date: true },
      _max: { date: true }
    });

    const topProducts = products
      .sort((a, b) => b._count.prices - a._count.prices)
      .slice(0, 10);

    return {
      countryType: "local" as const,
      globalCountry,
      country: {
        id: country.id,
        code: "AZ",
        nameAz: globalCountry?.nameAz || country.name,
        nameEn: globalCountry?.nameEn || country.nameEn || "Azerbaijan",
        region: globalCountry?.region || "Asia",
        subRegion: globalCountry?.subRegion || "Western Asia",
        flagEmoji: globalCountry?.flagEmoji || "🇦🇿",
        _count: { prices: country._count.prices, markets: country._count.markets }
      },
      products: products.map(p => ({
        id: p.id,
        slug: p.globalProduct?.slug || p.slug,
        nameEn: p.nameEn || p.name,
        nameAz: p.name,
        category: p.category.name,
        priceCount: p._count.prices,
        image: p.globalProduct?.image
      })),
      yearRange: {
        min: yearRange._min.date?.getFullYear() || 2020,
        max: yearRange._max.date?.getFullYear() || new Date().getFullYear()
      },
      sources: [{ source: "AGRO_AZ", count: products.reduce((sum, p) => sum + p._count.prices, 0) }],
      marketCount: globalCountry?.globalMarkets?.length || country._count.markets,
      topProducts,
    };
  }

  // Try EU Country
  const euCountry = await prisma.euCountry.findUnique({
    where: { code: upperCode },
    include: {
      _count: { select: { prices: true } }
    }
  });

  if (euCountry) {
    const productsWithPrices = await prisma.euPrice.groupBy({
      by: ["productId"],
      where: { countryId: euCountry.id },
      _count: { id: true },
      _max: { year: true }
    });

    const productIds = productsWithPrices.map(p => p.productId);
    const products = await prisma.euProduct.findMany({
      where: { id: { in: productIds } },
      include: {
        globalProduct: true
      }
    });

    const productsWithCounts = products.map(product => {
      const priceInfo = productsWithPrices.find(p => p.productId === product.id);
      return {
        id: product.id,
        slug: product.globalProduct?.slug || product.id,
        nameEn: product.nameEn,
        nameAz: product.nameAz || product.globalProduct?.nameAz || product.nameEn,
        category: product.category || "Other",
        priceCount: priceInfo?._count.id || 0,
        image: product.globalProduct?.image
      };
    }).sort((a, b) => b.priceCount - a.priceCount);

    const yearRange = await prisma.euPrice.aggregate({
      where: { countryId: euCountry.id },
      _min: { year: true },
      _max: { year: true }
    });

    return {
      countryType: "eu" as const,
      globalCountry,
      country: {
        id: euCountry.id,
        code: euCountry.code,
        nameAz: globalCountry?.nameAz || euCountry.nameAz || euCountry.nameEn,
        nameEn: globalCountry?.nameEn || euCountry.nameEn,
        region: globalCountry?.region || "Europe",
        subRegion: globalCountry?.subRegion,
        flagEmoji: globalCountry?.flagEmoji,
        _count: { prices: euCountry._count.prices, markets: 0 }
      },
      products: productsWithCounts,
      yearRange: {
        min: yearRange._min.year || 2020,
        max: yearRange._max.year || new Date().getFullYear()
      },
      sources: [{ source: "EU", count: euCountry._count.prices }],
      marketCount: globalCountry?.globalMarkets?.length || 0,
      topProducts: productsWithCounts.slice(0, 10),
    };
  }

  // Try FPMA Country
  const fpmaCountry = await prisma.fpmaCountry.findFirst({
    where: { 
      OR: [
        { iso2: upperCode },
        { iso3: upperCode.length === 3 ? upperCode : undefined }
      ],
      isActive: true 
    },
    include: {
      _count: { select: { series: true } }
    }
  });

  if (fpmaCountry) {
    const series = await prisma.fpmaSerie.findMany({
      where: { countryId: fpmaCountry.id },
      include: {
        commodity: {
          include: {
            globalProduct: true
          }
        },
        _count: { select: { prices: true } }
      }
    });

    const productMap = new Map<string, any>();
    series.forEach(s => {
      if (s.commodity && s.commodity.globalProduct) {
        const gp = s.commodity.globalProduct;
        if (!productMap.has(gp.id)) {
          productMap.set(gp.id, {
            id: gp.id,
            slug: gp.slug,
            nameEn: gp.nameEn,
            nameAz: gp.nameAz || gp.nameEn,
            category: gp.category || "Other",
            priceCount: s._count.prices,
            image: gp.image
          });
        } else {
          productMap.get(gp.id).priceCount += s._count.prices;
        }
      }
    });

    const productsWithCounts = Array.from(productMap.values())
      .sort((a, b) => b.priceCount - a.priceCount);

    const allPriceCount = series.reduce((sum, s) => sum + s._count.prices, 0);

    return {
      countryType: "fpma" as const,
      globalCountry,
      country: {
        id: fpmaCountry.id,
        code: fpmaCountry.iso2 || fpmaCountry.iso3.substring(0, 2),
        nameAz: globalCountry?.nameAz || fpmaCountry.nameAz || fpmaCountry.nameEn,
        nameEn: globalCountry?.nameEn || fpmaCountry.nameEn,
        region: globalCountry?.region || "Other",
        subRegion: globalCountry?.subRegion,
        flagEmoji: globalCountry?.flagEmoji,
        _count: { prices: allPriceCount, markets: 0 }
      },
      products: productsWithCounts,
      yearRange: {
        min: 2000,
        max: new Date().getFullYear()
      },
      sources: [{ source: "FPMA", count: allPriceCount }],
      marketCount: globalCountry?.globalMarkets?.length || 0,
      topProducts: productsWithCounts.slice(0, 10),
    };
  }

  // Try FAO Country
  const faoCountry = await prisma.faoCountry.findFirst({
    where: { 
      OR: [
        { iso2: upperCode },
        { code: upperCode.length === 3 ? upperCode : undefined }
      ],
      isActive: true 
    },
    include: {
      _count: { select: { prices: true } }
    }
  });

  if (faoCountry) {
    const productsWithPrices = await prisma.faoPrice.groupBy({
      by: ["productId"],
      where: { countryId: faoCountry.id },
      _count: { id: true },
      _max: { year: true }
    });

    const productIds = productsWithPrices.map(p => p.productId);
    const products = await prisma.faoProduct.findMany({
      where: { id: { in: productIds } },
      include: {
        globalProduct: true
      }
    });

    const productsWithCounts = products.map(product => {
      const priceInfo = productsWithPrices.find(p => p.productId === product.id);
      return {
        id: product.id,
        slug: product.globalProduct?.slug || product.id,
        nameEn: product.nameEn,
        nameAz: product.globalProduct?.nameAz || product.nameEn,
        category: product.globalProduct?.category || "Other",
        priceCount: priceInfo?._count.id || 0,
        image: product.globalProduct?.image
      };
    }).sort((a, b) => b.priceCount - a.priceCount);

    const yearRange = await prisma.faoPrice.aggregate({
      where: { countryId: faoCountry.id },
      _min: { year: true },
      _max: { year: true }
    });

    return {
      countryType: "fao" as const,
      globalCountry,
      country: {
        id: faoCountry.id,
        code: faoCountry.iso2 || faoCountry.code.substring(0, 2),
        nameAz: globalCountry?.nameAz || faoCountry.nameAz || faoCountry.nameEn,
        nameEn: globalCountry?.nameEn || faoCountry.nameEn,
        region: globalCountry?.region || "Other",
        subRegion: globalCountry?.subRegion,
        flagEmoji: globalCountry?.flagEmoji,
        _count: { prices: faoCountry._count.prices, markets: 0 }
      },
      products: productsWithCounts,
      yearRange: {
        min: yearRange._min.year || 2000,
        max: yearRange._max.year || new Date().getFullYear()
      },
      sources: [{ source: "FAO", count: faoCountry._count.prices }],
      marketCount: globalCountry?.globalMarkets?.length || 0,
      topProducts: productsWithCounts.slice(0, 10),
    };
  }

  return null;
}

// Data source badge styling
const sourceColors: Record<string, string> = {
  "AGRO_AZ": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "EU": "bg-blue-100 text-blue-700 border-blue-200",
  "FAO": "bg-amber-100 text-amber-700 border-amber-200",
  "FPMA": "bg-purple-100 text-purple-700 border-purple-200",
};

export default async function CountryPage({ params }: { params: Promise<Params> }) {
  const { code } = await params;
  const data = await getCountryData(code);

  if (!data) {
    notFound();
  }

  const { country, products, yearRange, sources, marketCount, topProducts } = data;

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
                <Link href="/countries" className="hover:text-emerald-600">Countries</Link>
                <ChevronRight className="w-4 h-4" />
                <span className="font-medium text-slate-900">{country.nameEn}</span>
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

      {/* Hero Section */}
      <section className="pt-20 pb-6 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-6 py-6">
            {/* Flag */}
            <div className="w-20 h-14 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden text-5xl">
              {country.flagEmoji || getFlagEmoji(country.code)}
            </div>
            
            {/* Country Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">{country.region}</Badge>
                {country.subRegion && (
                  <Badge variant="outline" className="text-xs">{country.subRegion}</Badge>
                )}
                {sources.map(s => (
                  <Badge key={s.source} variant="outline" className={`text-xs ${sourceColors[s.source]}`}>
                    {s.source}
                  </Badge>
                ))}
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{country.nameEn}</h1>
              {country.nameAz !== country.nameEn && (
                <p className="text-slate-500">{country.nameAz}</p>
              )}
            </div>

            {/* Hero KPIs */}
            <div className="hidden lg:flex items-center gap-6">
              <div className="text-center px-4 border-l border-slate-200">
                <div className="text-2xl font-bold text-slate-900">{products.length}</div>
                <div className="text-xs text-slate-500">Products</div>
              </div>
              <div className="text-center px-4 border-l border-slate-200">
                <div className="text-2xl font-bold text-slate-900">{marketCount}</div>
                <div className="text-xs text-slate-500">Markets</div>
              </div>
              <div className="text-center px-4 border-l border-slate-200">
                <div className="text-2xl font-bold text-slate-900">{country._count.prices.toLocaleString()}</div>
                <div className="text-xs text-slate-500">Price Records</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Overview Tab Content */}
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* Stats Cards */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <Package className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{products.length}</div>
                    <div className="text-sm text-slate-500">Products Tracked</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Store className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{marketCount}</div>
                    <div className="text-sm text-slate-500">Markets</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{yearRange.min} - {yearRange.max}</div>
                    <div className="text-sm text-slate-500">Data Coverage</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Sources */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Data Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {sources.map(source => (
                  <div key={source.source} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                    <span className="text-2xl">
                      {source.source === "AGRO_AZ" ? "🇦🇿" :
                       source.source === "EU" ? "🇪🇺" :
                       source.source === "FAO" ? "🌍" :
                       source.source === "FPMA" ? "📊" : "📊"}
                    </span>
                    <div>
                      <div className="font-medium text-slate-900">
                        {source.source === "AGRO_AZ" ? "Agro.gov.az" :
                         source.source === "EU" ? "Eurostat" :
                         source.source === "FAO" ? "FAOSTAT" :
                         source.source === "FPMA" ? "FAO FPMA" : source.source}
                      </div>
                      <div className="text-sm text-slate-500">{source.count.toLocaleString()} price records</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  Top Products
                </CardTitle>
                <Link href={`/products?country=${country.code.toLowerCase()}`}>
                  <Button variant="outline" size="sm">
                    View All <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {topProducts.slice(0, 10).map((product: any) => (
                  <Link 
                    key={product.id} 
                    href={`/products/${product.slug}?country=${country.code.toLowerCase()}`}
                  >
                    <div className="group text-center p-4 rounded-xl border hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer">
                      <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.nameAz}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      <h4 className="font-medium text-slate-900 text-sm group-hover:text-emerald-600 transition-colors truncate">
                        {product.nameEn}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {product.priceCount} prices
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                All Products in {country.nameEn}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-4">
                        Product
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-4">
                        Category
                      </th>
                      <th className="text-center text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-4">
                        Price Records
                      </th>
                      <th className="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-4">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.slice(0, 50).map((product) => (
                      <tr key={product.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4">
                          <Link 
                            href={`/products/${product.slug}?country=${country.code.toLowerCase()}`}
                            className="flex items-center gap-3"
                          >
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {product.image ? (
                                <img src={product.image} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900 group-hover:text-emerald-600 transition-colors">
                                {product.nameEn}
                              </div>
                              {product.nameAz !== product.nameEn && (
                                <div className="text-xs text-slate-500">{product.nameAz}</div>
                              )}
                            </div>
                          </Link>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant="outline" className="text-xs">{product.category}</Badge>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="font-mono text-sm text-slate-700">{product.priceCount}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link 
                            href={`/products/${product.slug}?country=${country.code.toLowerCase()}`}
                            className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                            View <ChevronRight className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {products.length > 50 && (
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-center">
                  <span className="text-sm text-slate-500">
                    Showing 50 of {products.length} products
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

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
