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

  // Create unified country list
  const allCountries: CountryCard[] = [];
  
  // Add Azerbaijan first
  if (azCountry) {
    allCountries.push({
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
    allCountries.push({
      id: country.id,
      code: country.code,
      nameAz: country.nameAz || country.nameEn,
      nameEn: country.nameEn,
      region: country.region || "Europe",
      priceCount: country._count.prices
    });
  });

  // Group by region
  const regionGroups: Record<string, CountryCard[]> = {};
  
  allCountries.forEach(country => {
    if (!regionGroups[country.region]) {
      regionGroups[country.region] = [];
    }
    regionGroups[country.region].push(country);
  });

  // Sort regions - South Caucasus first, then alphabetically
  const sortedRegions = Object.entries(regionGroups).sort((a, b) => {
    if (a[0] === "South Caucasus") return -1;
    if (b[0] === "South Caucasus") return 1;
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
  "Europe": "Avropa"
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
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">
                  🇦🇿 Azərbaycan
                </h4>
                <p className="text-sm text-slate-600">
                  Azərbaycan Kənd Təsərrüfatı Nazirliyi (agro.gov.az)
                </p>
                <p className="text-xs text-slate-400 mt-1">Həftəlik yenilənir</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">
                  🇪🇺 EC Agri-food Portal
                </h4>
                <p className="text-sm text-slate-600">
                  European Commission Agri-food Data Portal
                </p>
                <p className="text-xs text-slate-400 mt-1">Həftəlik qiymətlər</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">
                  📊 Eurostat
                </h4>
                <p className="text-sm text-slate-600">
                  European Statistical Office - İllik istehsalçı qiymətləri
                </p>
                <p className="text-xs text-slate-400 mt-1">İllik yenilənir</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
