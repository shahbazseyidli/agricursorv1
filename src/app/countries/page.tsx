import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, TrendingUp, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { MainLayout } from "@/components/layout/main-layout";

interface CountryCard {
  id: string;
  code: string;
  nameAz: string;
  nameEn: string;
  region: string;
  priceCount: number;
  isFeatured?: boolean;
}

async function getCountries() {
  // Get EU countries with price counts
  const euCountries = await prisma.euCountry.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { prices: true } }
    },
    orderBy: { nameEn: "asc" }
  });

  // Get Azerbaijan (local country)
  const azCountry = await prisma.country.findFirst({
    where: { iso2: "AZ" },
    include: {
      _count: { select: { prices: true } }
    }
  });

  // Get FAO countries (FAOSTAT)
  const faoCountries = await prisma.faoCountry.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { prices: true } }
    },
    orderBy: { nameEn: "asc" }
  });

  // Get FPMA countries (136 countries with retail/wholesale data)
  const fpmaCountries = await prisma.fpmaCountry.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { series: true } }
    },
    orderBy: { nameEn: "asc" }
  });

  // ISO3 to region mapping
  const countryRegions: Record<string, string> = {
    // Europe
    "DEU": "Europe", "FRA": "Europe", "ITA": "Europe", "ESP": "Europe", "POL": "Europe",
    "NLD": "Europe", "BEL": "Europe", "AUT": "Europe", "CHE": "Europe", "GBR": "Europe",
    "PRT": "Europe", "GRC": "Europe", "CZE": "Europe", "HUN": "Europe", "ROU": "Europe",
    "BGR": "Europe", "HRV": "Europe", "SVK": "Europe", "SVN": "Europe", "LTU": "Europe",
    "LVA": "Europe", "EST": "Europe", "FIN": "Europe", "SWE": "Europe", "DNK": "Europe",
    "NOR": "Europe", "IRL": "Europe", "UKR": "Europe", "BLR": "Europe", "MDA": "Europe",
    "SRB": "Europe", "BIH": "Europe", "ALB": "Europe", "MKD": "Europe", "MNE": "Europe",
    // South Caucasus
    "AZE": "South Caucasus", "GEO": "South Caucasus", "ARM": "South Caucasus",
    // Central Asia
    "KAZ": "Central Asia", "UZB": "Central Asia", "TKM": "Central Asia", 
    "TJK": "Central Asia", "KGZ": "Central Asia",
    // Middle East
    "TUR": "Middle East", "IRN": "Middle East", "IRQ": "Middle East", "SYR": "Middle East",
    "JOR": "Middle East", "LBN": "Middle East", "ISR": "Middle East", "PSE": "Middle East",
    "SAU": "Middle East", "YEM": "Middle East",
    // Africa
    "EGY": "Africa", "MAR": "Africa", "DZA": "Africa", "TUN": "Africa", "LBY": "Africa",
    "NGA": "Africa", "ETH": "Africa", "KEN": "Africa", "TZA": "Africa", "UGA": "Africa",
    "GHA": "Africa", "ZAF": "Africa", "SDN": "Africa", "SSD": "Africa", "SOM": "Africa",
    "SEN": "Africa", "MLI": "Africa", "NER": "Africa", "TCD": "Africa", "CMR": "Africa",
    "CIV": "Africa", "BFA": "Africa", "BEN": "Africa", "TGO": "Africa", "GIN": "Africa",
    "SLE": "Africa", "LBR": "Africa", "MRT": "Africa", "GMB": "Africa", "GNB": "Africa",
    "AGO": "Africa", "COD": "Africa", "COG": "Africa", "CAF": "Africa", "RWA": "Africa",
    "BDI": "Africa", "MWI": "Africa", "ZMB": "Africa", "ZWE": "Africa", "MOZ": "Africa",
    "MDG": "Africa", "NAM": "Africa", "BWA": "Africa", "SWZ": "Africa", "LSO": "Africa",
    "DJI": "Africa",
    // Asia
    "CHN": "Asia", "IND": "Asia", "JPN": "Asia", "KOR": "Asia", "IDN": "Asia",
    "THA": "Asia", "VNM": "Asia", "PHL": "Asia", "MYS": "Asia", "MMR": "Asia",
    "BGD": "Asia", "PAK": "Asia", "AFG": "Asia", "NPL": "Asia", "LKA": "Asia",
    "KHM": "Asia", "LAO": "Asia", "MNG": "Asia", "BTN": "Asia",
    // Americas
    "USA": "Americas", "CAN": "Americas", "MEX": "Americas", "BRA": "Americas",
    "ARG": "Americas", "COL": "Americas", "PER": "Americas", "CHL": "Americas",
    "VEN": "Americas", "ECU": "Americas", "BOL": "Americas", "PRY": "Americas",
    "URY": "Americas", "GTM": "Americas", "HND": "Americas", "SLV": "Americas",
    "NIC": "Americas", "CRI": "Americas", "PAN": "Americas", "DOM": "Americas",
    "HTI": "Americas", "JAM": "Americas",
    // Oceania
    "AUS": "Oceania", "NZL": "Oceania", "FJI": "Oceania", "PNG": "Oceania",
    "WSM": "Oceania", "TON": "Oceania", "VUT": "Oceania",
  };

  // Create unified country list with deduplication
  const countryMap = new Map<string, CountryCard>();
  
  // Add Azerbaijan first (featured)
  if (azCountry) {
    countryMap.set("AZ", {
      id: azCountry.id,
      code: "AZ",
      nameAz: azCountry.name,
      nameEn: azCountry.nameEn || "Azerbaijan",
      region: "South Caucasus",
      priceCount: azCountry._count.prices,
      isFeatured: true
    });
  }
  
  // Add EU countries
  euCountries.forEach(country => {
    if (!countryMap.has(country.code)) {
      countryMap.set(country.code, {
        id: country.id,
        code: country.code,
        nameAz: country.nameAz || country.nameEn,
        nameEn: country.nameEn,
        region: country.region || "Europe",
        priceCount: country._count.prices
      });
    } else {
      // Add price count
      const existing = countryMap.get(country.code)!;
      existing.priceCount += country._count.prices;
    }
  });

  // Add FAO countries
  faoCountries.forEach(country => {
    const iso2 = country.iso2 || country.code.substring(0, 2);
    if (!countryMap.has(iso2)) {
      countryMap.set(iso2, {
        id: country.id,
        code: iso2,
        nameAz: country.nameAz || country.nameEn,
        nameEn: country.nameEn,
        region: countryRegions[country.code] || "Other",
        priceCount: country._count.prices
      });
    } else {
      const existing = countryMap.get(iso2)!;
      existing.priceCount += country._count.prices;
    }
  });

  // Add FPMA countries (136 countries)
  fpmaCountries.forEach(country => {
    const iso2 = country.iso2 || country.iso3.substring(0, 2);
    if (!countryMap.has(iso2)) {
      countryMap.set(iso2, {
        id: country.id,
        code: iso2,
        nameAz: country.nameAz || country.nameEn,
        nameEn: country.nameEn,
        region: countryRegions[country.iso3] || "Other",
        priceCount: country._count.series * 50 // Estimate prices from series
      });
    } else {
      const existing = countryMap.get(iso2)!;
      existing.priceCount += country._count.series * 50;
    }
  });

  const allCountries = Array.from(countryMap.values());

  // Group by region
  const regionGroups: Record<string, CountryCard[]> = {};
  
  allCountries.forEach(country => {
    if (!regionGroups[country.region]) {
      regionGroups[country.region] = [];
    }
    regionGroups[country.region].push(country);
  });

  // Sort countries within each region
  Object.values(regionGroups).forEach(countries => {
    countries.sort((a, b) => a.nameAz.localeCompare(b.nameAz, "az"));
  });

  // Sort regions - South Caucasus first, then alphabetically
  const regionOrder = ["South Caucasus", "Europe", "Middle East", "Central Asia", "Asia", "Africa", "Americas", "Oceania", "Other"];
  const sortedRegions = Object.entries(regionGroups).sort((a, b) => {
    const aIndex = regionOrder.indexOf(a[0]);
    const bIndex = regionOrder.indexOf(b[0]);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a[0].localeCompare(b[0]);
  });

  return { allCountries, sortedRegions, totalCount: allCountries.length };
}

// Country flag emoji from ISO code
function getFlagEmoji(countryCode: string) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Region translations
const regionNames: Record<string, string> = {
  "South Caucasus": "Cənubi Qafqaz",
  "Western Europe": "Qərbi Avropa",
  "Eastern Europe": "Şərqi Avropa",
  "Southern Europe": "Cənubi Avropa",
  "Northern Europe": "Şimali Avropa",
  "Europe": "Avropa",
  "Middle East": "Yaxın Şərq",
  "Central Asia": "Mərkəzi Asiya",
  "Asia": "Asiya",
  "Africa": "Afrika",
  "Americas": "Amerika",
  "Oceania": "Okeaniya",
  "Other": "Digər"
};

export default async function CountriesPage() {
  const { sortedRegions, totalCount } = await getCountries();

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
              {regionNames[regionName] || regionName}
              <Badge variant="secondary" className="font-normal">
                {countries.length}
              </Badge>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {countries.map((country) => (
                <Link key={country.id} href={`/countries/${country.code.toLowerCase()}`}>
                  <Card className={`hover:shadow-lg transition-all h-full cursor-pointer ${
                    country.isFeatured 
                      ? "border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white hover:border-emerald-300" 
                      : "hover:border-blue-200"
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{getFlagEmoji(country.code)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-slate-900 truncate">
                              {country.nameAz}
                            </h4>
                            {country.isFeatured && (
                              <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500">{country.nameEn}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {country.code}
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

        {/* Data Sources */}
        <Card className="bg-slate-50">
          <CardHeader>
            <CardTitle className="text-lg">Data Mənbələri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">
                  🇦🇿 Azərbaycan
                </h4>
                <p className="text-sm text-slate-600">
                  Kənd Təsərrüfatı Nazirliyi (agro.gov.az)
                </p>
                <p className="text-xs text-slate-400 mt-1">Həftəlik yenilənir</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">
                  🇪🇺 Eurostat
                </h4>
                <p className="text-sm text-slate-600">
                  Avropa Statistika Ofisi - İstehsalçı qiymətləri
                </p>
                <p className="text-xs text-slate-400 mt-1">İllik yenilənir</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">
                  🌍 FAOSTAT
                </h4>
                <p className="text-sm text-slate-600">
                  BMT FAO - Qlobal istehsalçı qiymətləri
                </p>
                <p className="text-xs text-slate-400 mt-1">İllik yenilənir</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">
                  📊 FAO FPMA
                </h4>
                <p className="text-sm text-slate-600">
                  136 ölkədən pərakəndə/topdan qiymətlər
                </p>
                <p className="text-xs text-slate-400 mt-1">Gündəlik yenilənir</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
