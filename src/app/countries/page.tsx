import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Globe, 
  Search, 
  ChevronRight, 
  Filter,
  Leaf,
  ArrowUpDown,
  TrendingUp,
} from "lucide-react";
import { prisma } from "@/lib/prisma";

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
  productCount: number;
  marketCount: number;
  sourceCount: number;
}

async function getCountries(): Promise<{
  countries: CountryWithStats[];
  regions: { name: string; count: number }[];
  totalCount: number;
}> {
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
      globalMarkets: {
        select: { id: true }
      },
    },
    orderBy: [
      { isFeatured: "desc" },
      { nameEn: "asc" }
    ]
  });

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
      productCount: dataSources.length * 25,
      marketCount: gc.globalMarkets.length,
      sourceCount: dataSources.length,
    };
  });

  const countriesWithData = countries.filter(c => c.dataSources.length > 0);

  // Get region counts
  const regionMap = new Map<string, number>();
  for (const country of countriesWithData) {
    regionMap.set(country.region, (regionMap.get(country.region) || 0) + 1);
  }
  const regions = Array.from(regionMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    countries: countriesWithData,
    regions,
    totalCount: countriesWithData.length,
  };
}

// Data source badge styling
const sourceColors: Record<string, string> = {
  "AZ": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "EU": "bg-blue-100 text-blue-700 border-blue-200",
  "FAO": "bg-amber-100 text-amber-700 border-amber-200",
  "FPMA": "bg-purple-100 text-purple-700 border-purple-200",
};

export default async function CountriesPage() {
  const { countries, regions, totalCount } = await getCountries();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-900">Agrai</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <Link href="/products" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">
                Products
              </Link>
              <Link href="/countries" className="text-sm font-medium text-emerald-600">
                Countries
              </Link>
              <Link href="/data-sources" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">
                Data Sources
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Login</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <nav className="text-sm text-slate-500 mb-4">
              <Link href="/" className="hover:text-emerald-600">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-slate-900">Countries</span>
            </nav>
            
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Countries</h1>
                <p className="text-slate-600 mt-2">
                  Browse {totalCount} countries with agricultural market data
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500 bg-white px-4 py-2 rounded-lg border border-slate-200">
                <Globe className="w-4 h-4" />
                {totalCount} countries
              </div>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-white rounded-xl border border-slate-200">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search countries..." 
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Region Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
                <option value="">All Regions</option>
                {regions.map(region => (
                  <option key={region.name} value={region.name}>{region.name} ({region.count})</option>
                ))}
              </select>
            </div>

            {/* Data Source Filter */}
            <select className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
              <option value="">All Sources</option>
              <option value="AZ">🇦🇿 Azerbaijan (AZ)</option>
              <option value="EU">🇪🇺 Eurostat (EU)</option>
              <option value="FAO">🌍 FAOSTAT (FAO)</option>
              <option value="FPMA">📊 FAO FPMA</option>
            </select>

            {/* Data richness filter */}
            <select className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
              <option value="">Any Coverage</option>
              <option value="high">High (3+ sources)</option>
              <option value="medium">Medium (2 sources)</option>
              <option value="low">Low (1 source)</option>
            </select>
          </div>

          {/* Countries Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-4">
                      <button className="flex items-center gap-1 hover:text-slate-900">
                        Country <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-4">
                      Region
                    </th>
                    <th className="text-center text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-4">
                      Products
                    </th>
                    <th className="text-center text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-4">
                      Markets
                    </th>
                    <th className="text-center text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-4">
                      Coverage
                    </th>
                    <th className="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-4">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {countries.map((country) => (
                    <tr key={country.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <Link href={`/countries/${country.iso2.toLowerCase()}`} className="flex items-center gap-3">
                          <span className="text-2xl">{country.flagEmoji || "🏳️"}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-900 group-hover:text-emerald-600 transition-colors">
                                {country.nameEn}
                              </span>
                              {country.isFeatured && (
                                <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5">⭐ Featured</Badge>
                              )}
                            </div>
                            {country.nameAz && country.nameAz !== country.nameEn && (
                              <div className="text-xs text-slate-500">{country.nameAz}</div>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-slate-700">{country.region}</div>
                        {country.subRegion && (
                          <div className="text-xs text-slate-500">{country.subRegion}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-mono text-sm text-slate-700">
                          {country.productCount > 0 ? country.productCount : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-mono text-sm text-slate-700">
                          {country.marketCount > 0 ? country.marketCount : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap justify-center gap-1">
                          {country.dataSources.map(source => (
                            <Badge 
                              key={source} 
                              variant="outline"
                              className={`text-xs px-2 py-0.5 ${sourceColors[source] || ""}`}
                            >
                              {source}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          href={`/countries/${country.iso2.toLowerCase()}`}
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

            {/* Pagination */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="text-sm text-slate-500">
                Showing 1-{Math.min(countries.length, 50)} of {countries.length} countries
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>Previous</Button>
                <Button variant="outline" size="sm">Next</Button>
              </div>
            </div>
          </div>

          {/* Data Sources Info */}
          <div className="mt-8 p-6 bg-white rounded-xl border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Data Sources by Region</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">AZ</Badge>
                  <span className="font-medium text-slate-900">Azerbaijan</span>
                </div>
                <p className="text-sm text-slate-600">Retail, wholesale, and producer prices from local markets</p>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Weekly updates
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">EU</Badge>
                  <span className="font-medium text-slate-900">Europe (27 countries)</span>
                </div>
                <p className="text-sm text-slate-600">Producer prices from Eurostat database</p>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Monthly updates
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200">FAO</Badge>
                  <span className="font-medium text-slate-900">Global (180+ countries)</span>
                </div>
                <p className="text-sm text-slate-600">Annual producer price data from FAOSTAT</p>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Annual updates
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200">FPMA</Badge>
                  <span className="font-medium text-slate-900">Developing Countries</span>
                </div>
                <p className="text-sm text-slate-600">Food price monitoring from FAO FPMA</p>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Daily updates
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 py-8 px-4">
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
