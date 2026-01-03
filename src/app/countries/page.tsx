import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, TrendingUp, Star, Database } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { MainLayout } from "@/components/layout/main-layout";

interface CountryWithStats {
  id: string;
  iso2: string;
  iso3: string;
  nameEn: string;
  nameAz: string | null;
  region: string;
  subRegion: string | null;
  flagEmoji: string | null;
  isFeatured: boolean;
  dataSources: string[];
  priceCount: number;
}

async function getCountries(): Promise<{
  countries: CountryWithStats[];
  regionGroups: Record<string, CountryWithStats[]>;
  totalCount: number;
}> {
  // Get all GlobalCountries with their linked source countries
  const globalCountries = await prisma.globalCountry.findMany({
    where: { isActive: true },
    include: {
      azCountries: {
        include: {
          _count: { select: { prices: true } }
        }
      },
      euCountries: {
        include: {
          _count: { select: { prices: true } }
        }
      },
      faoCountries: {
        include: {
          _count: { select: { prices: true } }
        }
      },
      fpmaCountries: {
        include: {
          _count: { select: { series: true } }
        }
      },
    },
    orderBy: [
      { isFeatured: "desc" },
      { nameEn: "asc" }
    ]
  });

  // Transform to CountryWithStats
  const countries: CountryWithStats[] = globalCountries.map(gc => {
    const dataSources: string[] = [];
    let priceCount = 0;

    if (gc.azCountries.length > 0) {
      dataSources.push("AZ");
      priceCount += gc.azCountries.reduce((sum, c) => sum + c._count.prices, 0);
    }
    if (gc.euCountries.length > 0) {
      dataSources.push("EU");
      priceCount += gc.euCountries.reduce((sum, c) => sum + c._count.prices, 0);
    }
    if (gc.faoCountries.length > 0) {
      dataSources.push("FAO");
      priceCount += gc.faoCountries.reduce((sum, c) => sum + c._count.prices, 0);
    }
    if (gc.fpmaCountries.length > 0) {
      dataSources.push("FPMA");
      // Estimate prices from series (each series has ~50 price points on average)
      priceCount += gc.fpmaCountries.reduce((sum, c) => sum + c._count.series * 50, 0);
    }

    return {
      id: gc.id,
      iso2: gc.iso2,
      iso3: gc.iso3,
      nameEn: gc.nameEn,
      nameAz: gc.nameAz,
      region: gc.region,
      subRegion: gc.subRegion,
      flagEmoji: gc.flagEmoji,
      isFeatured: gc.isFeatured,
      dataSources,
      priceCount,
    };
  });

  // Filter to only countries with data
  const countriesWithData = countries.filter(c => c.dataSources.length > 0);

  // Group by region
  const regionGroups: Record<string, CountryWithStats[]> = {};
  
  for (const country of countriesWithData) {
    const region = country.region;
    if (!regionGroups[region]) {
      regionGroups[region] = [];
    }
    regionGroups[region].push(country);
  }

  // Sort countries within each region
  for (const region of Object.keys(regionGroups)) {
    regionGroups[region].sort((a, b) => {
      // Featured first, then alphabetically
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return (a.nameAz || a.nameEn).localeCompare(b.nameAz || b.nameEn, "az");
    });
  }

  return {
    countries: countriesWithData,
    regionGroups,
    totalCount: countriesWithData.length,
  };
}

// Region translations and order
const regionConfig: Record<string, { nameAz: string; order: number }> = {
  "Asia": { nameAz: "Asiya", order: 1 },
  "Europe": { nameAz: "Avropa", order: 2 },
  "Africa": { nameAz: "Afrika", order: 3 },
  "Americas": { nameAz: "Amerika", order: 4 },
  "Oceania": { nameAz: "Okeaniya", order: 5 },
};

// Data source colors
const sourceColors: Record<string, string> = {
  "AZ": "bg-emerald-100 text-emerald-700",
  "EU": "bg-blue-100 text-blue-700",
  "FAO": "bg-amber-100 text-amber-700",
  "FPMA": "bg-purple-100 text-purple-700",
};

export default async function CountriesPage() {
  const { regionGroups, totalCount } = await getCountries();

  // Sort regions by order
  const sortedRegions = Object.entries(regionGroups).sort((a, b) => {
    const orderA = regionConfig[a[0]]?.order ?? 99;
    const orderB = regionConfig[b[0]]?.order ?? 99;
    return orderA - orderB;
  });

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Ölkələr</h1>
            <p className="text-slate-600 mt-1">
              Kənd təsərrüfatı məhsullarının qiymət məlumatları
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Globe className="w-4 h-4" />
            {totalCount} ölkə
          </div>
        </div>

        {/* Countries by Region */}
        {sortedRegions.map(([regionName, countries]) => (
          <div key={regionName} className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
              {regionConfig[regionName]?.nameAz || regionName}
              <Badge variant="secondary" className="font-normal">
                {countries.length}
              </Badge>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {countries.map((country) => (
                <Link key={country.id} href={`/countries/${country.iso2.toLowerCase()}`}>
                  <Card className={`hover:shadow-lg transition-all h-full cursor-pointer ${
                    country.isFeatured 
                      ? "border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white hover:border-emerald-300" 
                      : "hover:border-blue-200"
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{country.flagEmoji || "🏳️"}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-slate-900 truncate">
                              {country.nameAz || country.nameEn}
                            </h4>
                            {country.isFeatured && (
                              <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500">{country.nameEn}</p>
                        </div>
                      </div>
                      
                      {/* Data sources badges */}
                      <div className="mt-3 flex flex-wrap gap-1">
                        {country.dataSources.map(source => (
                          <Badge 
                            key={source} 
                            variant="secondary" 
                            className={`text-xs ${sourceColors[source] || ""}`}
                          >
                            {source}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="mt-2 flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {country.iso2}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <TrendingUp className="w-3 h-3" />
                          {country.priceCount.toLocaleString()} qiymət
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Data Sources Legend */}
        <Card className="bg-slate-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="w-5 h-5" />
              Data Mənbələri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-start gap-3">
                <Badge className={sourceColors["AZ"]}>AZ</Badge>
                <div>
                  <h4 className="font-semibold text-slate-900">Agro.gov.az</h4>
                  <p className="text-sm text-slate-600">
                    Azərbaycan Kənd Təsərrüfatı Nazirliyi
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Həftəlik yenilənir</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className={sourceColors["EU"]}>EU</Badge>
                <div>
                  <h4 className="font-semibold text-slate-900">Eurostat</h4>
                  <p className="text-sm text-slate-600">
                    Avropa Statistika Ofisi
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Aylıq yenilənir</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className={sourceColors["FAO"]}>FAO</Badge>
                <div>
                  <h4 className="font-semibold text-slate-900">FAOSTAT</h4>
                  <p className="text-sm text-slate-600">
                    BMT FAO İstehsalçı Qiymətləri
                  </p>
                  <p className="text-xs text-slate-400 mt-1">İllik yenilənir</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className={sourceColors["FPMA"]}>FPMA</Badge>
                <div>
                  <h4 className="font-semibold text-slate-900">FAO FPMA</h4>
                  <p className="text-sm text-slate-600">
                    Qiymət Monitorinqi və Analizi
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Gündəlik yenilənir</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
