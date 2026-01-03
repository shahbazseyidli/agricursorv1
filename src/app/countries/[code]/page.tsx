import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown,
  Package, 
  Calendar, 
  ExternalLink, 
  ChevronRight,
  MapPin,
  Users,
  Building2,
  Wheat,
  Apple,
  Leaf,
  Info,
  Globe
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { MainLayout } from "@/components/layout/main-layout";
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

// Static country info for enhanced pages
const COUNTRY_INFO: Record<string, {
  about: string;
  economy: string;
  agriculture: string;
  topExports: string[];
  keyFacts: { label: string; value: string }[];
  climate: string;
}> = {
  "AZ": {
    about: `Azərbaycan Cənubi Qafqaz regionunda yerləşən Avrasiya ölkəsidir. Xəzər dənizi ilə sərhəddi olan ölkə zəngin kənd təsərrüfatı ənənələrinə malikdir. Azərbaycan 90.000 km² ərazidə 10 milyondan çox əhaliyə sahibdir.`,
    economy: `Azərbaycan iqtisadiyyatı neft və qaz sənayesinə əsaslanır, lakin son illərdə kənd təsərrüfatı sektoruna investisiyalar artırılmışdır. Ölkə meyvə, tərəvəz və quru meyvələrin əsas istehsalçılarından biridir.`,
    agriculture: `Azərbaycan kənd təsərrüfatı sektorunda meyvə-tərəvəz istehsalı xüsusi əhəmiyyət kəsb edir. Ölkə xüsusilə nar, üzüm, pomidor və xiyar istehsalında liderdir. Kənd təsərrüfatı əhalinin təxminən 36%-ni əhatə edir.`,
    topExports: ["Nar", "Pomidor", "Xurma", "Alma", "Üzüm", "Fındıq"],
    keyFacts: [
      { label: "Əhali", value: "10.2 milyon" },
      { label: "Ərazi", value: "86,600 km²" },
      { label: "Paytaxt", value: "Bakı" },
      { label: "Valyuta", value: "AZN (Manat)" },
      { label: "K/T payı GDP-də", value: "~6%" }
    ],
    climate: "Azərbaycanda 9 iqlim zonası var, subtropik, mülayim kontinental və dağ iqlimləri daxildir. Bu müxtəliflik geniş çeşidli kənd təsərrüfatı məhsullarının yetişdirilməsinə imkan verir."
  },
  "BE": {
    about: `Belçika Qərbi Avropada yerləşən kiçik, lakin iqtisadi cəhətdən inkişaf etmiş ölkədir. Avropa İttifaqının qərargahı burada yerləşir.`,
    economy: `Belçika dünyada ən inkişaf etmiş iqtisadiyyatlardan birinə sahibdir. İxracat yönümlü iqtisadiyyat xidmət sektoru, sənaye və kənd təsərrüfatına əsaslanır.`,
    agriculture: `Belçika kənd təsərrüfatı sektoru yüksək texnologiyalı intensiv fermerçiliklə xarakterizə olunur. Ölkə pomidor, kartof və alma istehsalında aparıcıdır.`,
    topExports: ["Kartof", "Pomidor", "Tərəvəzlər", "Meyvələr"],
    keyFacts: [
      { label: "Əhali", value: "11.5 milyon" },
      { label: "Ərazi", value: "30,528 km²" },
      { label: "Paytaxt", value: "Brüssel" },
      { label: "Valyuta", value: "EUR (Avro)" },
      { label: "K/T payı GDP-də", value: "~0.7%" }
    ],
    climate: "Mülayim dəniz iqlimi, yağıntılı illərlə. Yumşaq qışlar və sərin yaylar xarakterikdir."
  }
};

// Default info for countries without specific data
const DEFAULT_COUNTRY_INFO = {
  about: "Bu ölkə haqqında məlumat hazırlanır. Daha ətraflı məlumat tezliklə əlavə olunacaq.",
  economy: "İqtisadi məlumatlar hazırlanır.",
  agriculture: "Kənd təsərrüfatı məlumatları hazırlanır.",
  topExports: [],
  keyFacts: [],
  climate: "İqlim məlumatları hazırlanır."
};

async function getCountryData(code: string) {
  const upperCode = code.toUpperCase();
  
  // First, try to find GlobalCountry
  const globalCountry = await prisma.globalCountry.findFirst({
    where: {
      OR: [
        { iso2: upperCode },
        { iso3: upperCode }
      ]
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

    // Get AZ products with price counts
    const products = await prisma.product.findMany({
      where: { countryId: country.id },
      include: {
        category: true,
        globalProduct: true,
        _count: { select: { prices: true } }
      },
      orderBy: { name: "asc" }
    });

    // Get year range
    const yearRange = await prisma.price.aggregate({
      where: { countryId: country.id },
      _min: { date: true },
      _max: { date: true }
    });

    // Get price stats
    const priceStats = await prisma.price.aggregate({
      where: { countryId: country.id },
      _avg: { priceAvg: true },
      _min: { priceMin: true },
      _max: { priceMax: true }
    });

    // Get top products by price count
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
        nameRu: globalCountry?.nameRu || country.nameRu,
        region: globalCountry?.region || "Asia",
        subRegion: globalCountry?.subRegion || "Western Asia",
        flagEmoji: globalCountry?.flagEmoji || "🇦🇿",
        flagUrl: globalCountry?.flagUrl,
        _count: { prices: country._count.prices, markets: country._count.markets }
      },
      products: products.map(p => ({
        id: p.id,
        slug: p.globalProduct?.slug || p.slug,
        nameEn: p.nameEn || p.name,
        nameAz: p.name,
        nameRu: p.nameRu,
        category: p.category.name,
        eurostatCode: p.globalProduct?.eurostatCode,
        priceCount: p._count.prices,
        latestYear: null as number | null,
        image: p.globalProduct?.image
      })),
      yearRange: {
        min: yearRange._min.date?.getFullYear() || 2020,
        max: yearRange._max.date?.getFullYear() || new Date().getFullYear()
      },
      sources: [{ source: "AGRO_GOV_AZ", _count: { id: products.reduce((sum, p) => sum + p._count.prices, 0) } }],
      hasMarkets: true,
      priceStats: {
        avgPrice: priceStats._avg.priceAvg || 0,
        minPrice: priceStats._min.priceMin || 0,
        maxPrice: priceStats._max.priceMax || 0
      },
      topProducts,
      info: COUNTRY_INFO["AZ"] || DEFAULT_COUNTRY_INFO
    };
  }

  // Try EU Country first
  const euCountry = await prisma.euCountry.findUnique({
    where: { code: upperCode },
    include: {
      _count: { select: { prices: true } }
    }
  });

  if (euCountry) {
    // Get products with prices for this country
    const productsWithPrices = await prisma.euPrice.groupBy({
      by: ["productId"],
      where: { countryId: euCountry.id },
      _count: { id: true },
      _max: { year: true }
    });

    // Get product details with global product info
    const productIds = productsWithPrices.map(p => p.productId);
    const products = await prisma.euProduct.findMany({
      where: { id: { in: productIds } },
      include: {
        globalProduct: true
      }
    });

    // Merge price counts with products
    const productsWithCounts = products.map(product => {
      const priceInfo = productsWithPrices.find(p => p.productId === product.id);
      return {
        id: product.id,
        slug: product.globalProduct?.slug || product.id,
        nameEn: product.nameEn,
        nameAz: product.nameAz || product.globalProduct?.nameAz || product.nameEn,
        nameRu: product.nameRu || product.globalProduct?.nameRu,
        category: product.category || "Digər",
        eurostatCode: product.eurostatCode,
        priceCount: priceInfo?._count.id || 0,
        latestYear: priceInfo?._max.year || null,
        image: product.globalProduct?.image
      };
    }).sort((a, b) => b.priceCount - a.priceCount);

    // Get year range
    const yearRange = await prisma.euPrice.aggregate({
      where: { countryId: euCountry.id },
      _min: { year: true },
      _max: { year: true }
    });

    // Get sources
    const sources = await prisma.euPrice.groupBy({
      by: ["source"],
      where: { countryId: euCountry.id },
      _count: { id: true }
    });

    // Get price stats
    const priceStats = await prisma.euPrice.aggregate({
      where: { countryId: euCountry.id },
      _avg: { price: true }
    });

    return {
      countryType: "eu" as const,
      globalCountry,
      country: {
        id: euCountry.id,
        code: euCountry.code,
        nameAz: globalCountry?.nameAz || euCountry.nameAz || euCountry.nameEn,
        nameEn: globalCountry?.nameEn || euCountry.nameEn,
        nameRu: globalCountry?.nameRu || euCountry.nameRu,
        region: globalCountry?.region || "Europe",
        subRegion: globalCountry?.subRegion,
        flagEmoji: globalCountry?.flagEmoji,
        flagUrl: globalCountry?.flagUrl,
        _count: { prices: euCountry._count.prices, markets: 0 }
      },
      products: productsWithCounts,
      yearRange: {
        min: yearRange._min.year || 2020,
        max: yearRange._max.year || new Date().getFullYear()
      },
      sources,
      hasMarkets: false,
      priceStats: {
        avgPrice: priceStats._avg.price || 0,
        minPrice: 0,
        maxPrice: 0
      },
      topProducts: productsWithCounts.slice(0, 10),
      info: COUNTRY_INFO[upperCode] || DEFAULT_COUNTRY_INFO
    };
  }

  // Try FPMA Country (by iso2)
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
    // Get series for this country
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

    // Get unique products from series
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
            nameRu: gp.nameRu,
            category: gp.category || "Digər",
            eurostatCode: gp.eurostatCode,
            priceCount: s._count.prices,
            latestYear: null,
            image: gp.image
          });
        } else {
          productMap.get(gp.id).priceCount += s._count.prices;
        }
      }
    });

    const productsWithCounts = Array.from(productMap.values())
      .sort((a, b) => b.priceCount - a.priceCount);

    // Get year range from prices
    const allPriceCount = series.reduce((sum, s) => sum + s._count.prices, 0);

    // Region mapping
    const regionMap: Record<string, string> = {
      "AZE": "South Caucasus", "GEO": "South Caucasus", "ARM": "South Caucasus",
      "TUR": "Middle East", "IRN": "Middle East", "IRQ": "Middle East", "SYR": "Middle East",
      "JOR": "Middle East", "LBN": "Middle East", "SAU": "Middle East", "YEM": "Middle East",
      "KAZ": "Central Asia", "UZB": "Central Asia", "TKM": "Central Asia", 
      "TJK": "Central Asia", "KGZ": "Central Asia",
      "EGY": "Africa", "MAR": "Africa", "NGA": "Africa", "KEN": "Africa", "ETH": "Africa",
      "CHN": "Asia", "IND": "Asia", "PAK": "Asia", "BGD": "Asia", "VNM": "Asia",
      "USA": "Americas", "BRA": "Americas", "MEX": "Americas", "ARG": "Americas",
    };

    return {
      countryType: "fpma" as const,
      globalCountry,
      country: {
        id: fpmaCountry.id,
        code: fpmaCountry.iso2 || fpmaCountry.iso3.substring(0, 2),
        nameAz: globalCountry?.nameAz || fpmaCountry.nameAz || fpmaCountry.nameEn,
        nameEn: globalCountry?.nameEn || fpmaCountry.nameEn,
        nameRu: globalCountry?.nameRu,
        region: globalCountry?.region || regionMap[fpmaCountry.iso3] || "Other",
        subRegion: globalCountry?.subRegion,
        flagEmoji: globalCountry?.flagEmoji,
        flagUrl: globalCountry?.flagUrl,
        _count: { prices: allPriceCount, markets: 0 }
      },
      products: productsWithCounts,
      yearRange: {
        min: 2000,
        max: new Date().getFullYear()
      },
      sources: [{ source: "FAO_FPMA", _count: { id: allPriceCount } }],
      hasMarkets: false,
      priceStats: {
        avgPrice: 0,
        minPrice: 0,
        maxPrice: 0
      },
      topProducts: productsWithCounts.slice(0, 10),
      info: COUNTRY_INFO[upperCode] || DEFAULT_COUNTRY_INFO
    };
  }

  // Try FAO Country (FAOSTAT)
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
    // Get products with prices for this country
    const productsWithPrices = await prisma.faoPrice.groupBy({
      by: ["productId"],
      where: { countryId: faoCountry.id },
      _count: { id: true },
      _max: { year: true }
    });

    // Get product details with global product info
    const productIds = productsWithPrices.map(p => p.productId);
    const products = await prisma.faoProduct.findMany({
      where: { id: { in: productIds } },
      include: {
        globalProduct: true
      }
    });

    // Merge price counts with products
    const productsWithCounts = products.map(product => {
      const priceInfo = productsWithPrices.find(p => p.productId === product.id);
      return {
        id: product.id,
        slug: product.globalProduct?.slug || product.id,
        nameEn: product.nameEn,
        nameAz: product.globalProduct?.nameAz || product.nameEn,
        nameRu: product.globalProduct?.nameRu,
        category: product.globalProduct?.category || "Digər",
        eurostatCode: product.globalProduct?.eurostatCode,
        priceCount: priceInfo?._count.id || 0,
        latestYear: priceInfo?._max.year || null,
        image: product.globalProduct?.image
      };
    }).sort((a, b) => b.priceCount - a.priceCount);

    // Get year range
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
        nameRu: globalCountry?.nameRu,
        region: globalCountry?.region || "Other",
        subRegion: globalCountry?.subRegion,
        flagEmoji: globalCountry?.flagEmoji,
        flagUrl: globalCountry?.flagUrl,
        _count: { prices: faoCountry._count.prices, markets: 0 }
      },
      products: productsWithCounts,
      yearRange: {
        min: yearRange._min.year || 2000,
        max: yearRange._max.year || new Date().getFullYear()
      },
      sources: [{ source: "FAOSTAT", _count: { id: faoCountry._count.prices } }],
      hasMarkets: false,
      priceStats: {
        avgPrice: 0,
        minPrice: 0,
        maxPrice: 0
      },
      topProducts: productsWithCounts.slice(0, 10),
      info: DEFAULT_COUNTRY_INFO
    };
  }

  return null;
}

export default async function CountryPage({ params }: { params: Promise<Params> }) {
  const { code } = await params;
  const data = await getCountryData(code);

  if (!data) {
    notFound();
  }

  const { country, products, yearRange, sources, hasMarkets, priceStats, topProducts, info } = data;

  // Group products by category
  const productsByCategory = products.reduce((acc, product) => {
    const category = product.category || "Digər";
    if (!acc[category]) acc[category] = [];
    acc[category].push(product);
    return acc;
  }, {} as Record<string, typeof products>);

  // Sort categories: Fruits first, then Vegetables, then others
  const categoryOrder = ["Fruits", "Meyvə", "Meyve", "Vegetables", "Tərəvəz", "Bostan"];
  const sortedCategories = Object.entries(productsByCategory).sort((a, b) => {
    const aIndex = categoryOrder.findIndex(c => a[0].includes(c));
    const bIndex = categoryOrder.findIndex(c => b[0].includes(c));
    if (aIndex === -1 && bIndex === -1) return a[0].localeCompare(b[0]);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 -mx-6 -mt-6 px-6 py-12 rounded-b-3xl">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/countries">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Bütün ölkələr
              </Button>
            </Link>
          </div>
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Flag - use GlobalCountry flagUrl if available, otherwise emoji */}
            {country.flagUrl ? (
              <div className="w-24 h-16 rounded-lg overflow-hidden shadow-lg">
                <img src={country.flagUrl} alt={country.nameEn} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="text-7xl">{country.flagEmoji || getFlagEmoji(country.code)}</div>
            )}
            <div className="flex-1">
              <div className="flex gap-2 mb-2">
                <Badge className="bg-white/80">{country.region}</Badge>
                {country.subRegion && (
                  <Badge variant="outline" className="bg-white/60">{country.subRegion}</Badge>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">
                {country.nameAz || country.nameEn}
              </h1>
              <p className="text-lg text-slate-600">{country.nameEn}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant="outline" className="text-2xl px-4 py-2 bg-white/80">{country.code}</Badge>
              {hasMarkets && (
                <span className="text-sm text-slate-500">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  {country._count.markets} bazar
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-5">
              <TrendingUp className="w-8 h-8 text-blue-600 mb-3" />
              <p className="text-3xl font-bold text-blue-900">
                {country._count.prices.toLocaleString()}
              </p>
              <p className="text-sm text-blue-700">Qiymət qeydi</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardContent className="p-5">
              <Package className="w-8 h-8 text-emerald-600 mb-3" />
              <p className="text-3xl font-bold text-emerald-900">{products.length}</p>
              <p className="text-sm text-emerald-700">Məhsul</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-5">
              <Calendar className="w-8 h-8 text-purple-600 mb-3" />
              <p className="text-3xl font-bold text-purple-900">
                {yearRange.min}-{yearRange.max}
              </p>
              <p className="text-sm text-purple-700">Data aralığı</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-5">
              <ExternalLink className="w-8 h-8 text-amber-600 mb-3" />
              <p className="text-3xl font-bold text-amber-900">{sources.length}</p>
              <p className="text-sm text-amber-700">Data mənbəsi</p>
            </CardContent>
          </Card>
        </div>

        {/* About Section - Tridge Style */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main About */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                Haqqında
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Ümumi məlumat</h3>
                <p className="text-slate-600 leading-relaxed">{info.about}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Wheat className="w-4 h-4 text-amber-600" />
                  Kənd təsərrüfatı
                </h3>
                <p className="text-slate-600 leading-relaxed">{info.agriculture}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  İqlim
                </h3>
                <p className="text-slate-600 leading-relaxed">{info.climate}</p>
              </div>
            </CardContent>
          </Card>

          {/* Key Facts Sidebar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Əsas faktlar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {info.keyFacts.length > 0 ? (
                info.keyFacts.map((fact, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500">{fact.label}</span>
                    <span className="font-semibold text-slate-900">{fact.value}</span>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-sm">Məlumat hazırlanır...</p>
              )}
              
              {info.topExports.length > 0 && (
                <div className="pt-4">
                  <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Apple className="w-4 h-4 text-green-600" />
                    Əsas ixrac məhsulları
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {info.topExports.map((product, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-green-50 text-green-700">
                        {product}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Data Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ExternalLink className="w-5 h-5" />
              Data Mənbələri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {sources.map((source) => (
                <div key={source.source} className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border">
                  <span className="text-2xl">
                    {source.source === "EUROSTAT" ? "📊" : 
                     source.source === "EC_AGRIFOOD" ? "🇪🇺" :
                     source.source === "AGRO_GOV_AZ" ? "🇦🇿" :
                     source.source === "FAOSTAT" ? "🌍" :
                     source.source === "FAO_FPMA" ? "📈" : "📊"}
                  </span>
                  <div>
                    <p className="font-medium text-slate-900">
                      {source.source === "EUROSTAT" ? "Eurostat" : 
                       source.source === "EC_AGRIFOOD" ? "EC Agri-food Data Portal" :
                       source.source === "AGRO_GOV_AZ" ? "Azərbaycan Kənd Təsərrüfatı Nazirliyi" :
                       source.source === "FAOSTAT" ? "FAO - Producer Prices" :
                       source.source === "FAO_FPMA" ? "FAO FPMA - Food Prices" : source.source}
                    </p>
                    <p className="text-sm text-slate-500">{source._count.id.toLocaleString()} qeyd</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Leaf className="w-5 h-5 text-green-600" />
                Ən populyar məhsullar
              </CardTitle>
              <Link href={`/categories?country=${country.code.toLowerCase()}`}>
                <Button variant="outline" size="sm">
                  Hamısına bax
                  <ChevronRight className="w-4 h-4 ml-1" />
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
                    {product.image ? (
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden bg-slate-100">
                        <img 
                          src={product.image} 
                          alt={product.nameAz}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                        <Package className="w-8 h-8 text-emerald-600" />
                      </div>
                    )}
                    <h4 className="font-medium text-slate-900 text-sm group-hover:text-emerald-600 transition-colors">
                      {product.nameAz}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {product.priceCount} qiymət
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Products by Category */}
        {sortedCategories.map(([category, categoryProducts]) => (
          <div key={category}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                {category.toLowerCase().includes("meyv") || category === "Fruits" ? (
                  <Apple className="w-5 h-5 text-red-500" />
                ) : (
                  <Leaf className="w-5 h-5 text-green-500" />
                )}
                {category}
              </h2>
              <Badge variant="outline">{categoryProducts.length} məhsul</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryProducts.map((product) => (
                <Link 
                  key={product.id} 
                  href={`/products/${product.slug}?country=${country.code.toLowerCase()}`}
                >
                  <Card className="hover:shadow-lg hover:border-emerald-200 transition-all h-full cursor-pointer group">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Product Image */}
                        {product.image ? (
                          <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                            <img 
                              src={product.image} 
                              alt={product.nameAz}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center shrink-0">
                            <Package className="w-6 h-6 text-emerald-600" />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          {/* Show translated name (AZ) as primary */}
                          <h3 className="font-semibold text-slate-900 truncate group-hover:text-emerald-600 transition-colors">
                            {product.nameAz}
                          </h3>
                          {/* Show English name as secondary if different */}
                          {product.nameAz !== product.nameEn && (
                            <p className="text-sm text-slate-500 truncate">{product.nameEn}</p>
                          )}
                          
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-slate-500">
                              {product.priceCount} qiymət
                            </span>
                            {product.eurostatCode && (
                              <code className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                                {product.eurostatCode}
                              </code>
                            )}
                          </div>
                        </div>
                        
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Footer Note */}
        <div className="text-center text-sm text-slate-400 pt-8 border-t">
          <p>
            Data mənbələri: 
            {sources.map((s, i) => (
              <span key={s.source}>
                {i > 0 && ", "}
                {s.source === "EUROSTAT" ? "Eurostat" : 
                 s.source === "EC_AGRIFOOD" ? "EC Agri-food Portal" :
                 s.source === "AGRO_GOV_AZ" ? "agro.gov.az" : s.source}
              </span>
            ))}
          </p>
          <p className="mt-1">Son yenilənmə: {new Date().toLocaleDateString("az-AZ")}</p>
        </div>
      </div>
    </MainLayout>
  );
}
