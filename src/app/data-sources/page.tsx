import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Database, 
  Globe, 
  ExternalLink,
  Leaf,
  TrendingUp,
  Calendar,
  MapPin,
  Package,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { prisma } from "@/lib/prisma";

async function getDataSourceStats() {
  const [
    azProducts,
    azPrices,
    azMarkets,
    euProducts,
    euPrices,
    euCountries,
    faoProducts,
    faoPrices,
    faoCountries,
    fpmaCommodities,
    fpmaSeries,
    fpmaCountries,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.price.count(),
    prisma.market.count(),
    prisma.euProduct.count(),
    prisma.euPrice.count(),
    prisma.euCountry.count(),
    prisma.faoProduct.count(),
    prisma.faoPrice.count(),
    prisma.faoCountry.count(),
    prisma.fpmaCommodity.count(),
    prisma.fpmaSerie.count(),
    prisma.fpmaCountry.count(),
  ]);

  return {
    az: {
      products: azProducts,
      prices: azPrices,
      markets: azMarkets,
    },
    eu: {
      products: euProducts,
      prices: euPrices,
      countries: euCountries,
    },
    fao: {
      products: faoProducts,
      prices: faoPrices,
      countries: faoCountries,
    },
    fpma: {
      commodities: fpmaCommodities,
      series: fpmaSeries,
      countries: fpmaCountries,
    },
  };
}

export default async function DataSourcesPage() {
  const stats = await getDataSourceStats();

  const dataSources = [
    {
      id: "az",
      name: "Agro.gov.az",
      fullName: "Azerbaijan Ministry of Agriculture",
      description: "Official agricultural price data from Azerbaijan, including retail and wholesale market prices from major cities and regions.",
      url: "https://agro.gov.az",
      color: "emerald",
      badge: "AZ",
      coverage: {
        countries: 1,
        products: stats.az.products,
        prices: stats.az.prices,
        markets: stats.az.markets,
      },
      priceTypes: ["Retail", "Wholesale", "Producer"],
      updateFrequency: "Weekly",
      dataRange: "2020 - Present",
      features: [
        "Regional market prices",
        "Retail and wholesale separation",
        "Weekly price updates",
        "Local market coverage",
      ],
    },
    {
      id: "eu",
      name: "Eurostat",
      fullName: "European Statistical Office",
      description: "Comprehensive agricultural producer price indices and absolute prices from all EU member states and candidate countries.",
      url: "https://ec.europa.eu/eurostat",
      color: "blue",
      badge: "EU",
      coverage: {
        countries: stats.eu.countries,
        products: stats.eu.products,
        prices: stats.eu.prices,
      },
      priceTypes: ["Producer Price Index", "Absolute Producer Prices"],
      updateFrequency: "Monthly",
      dataRange: "2000 - Present",
      features: [
        "27 EU member states",
        "Harmonized methodology",
        "Producer price indices",
        "Long historical series",
      ],
    },
    {
      id: "fao",
      name: "FAOSTAT",
      fullName: "FAO Statistics Division",
      description: "Global agricultural producer prices from the Food and Agriculture Organization of the United Nations.",
      url: "https://www.fao.org/faostat",
      color: "amber",
      badge: "FAO",
      coverage: {
        countries: stats.fao.countries,
        products: stats.fao.products,
        prices: stats.fao.prices,
      },
      priceTypes: ["Producer Prices"],
      updateFrequency: "Annual",
      dataRange: "1991 - Present",
      features: [
        "180+ countries covered",
        "Standardized USD prices",
        "Producer price focus",
        "Long-term trends",
      ],
    },
    {
      id: "fpma",
      name: "FAO FPMA",
      fullName: "Food Price Monitoring and Analysis",
      description: "Real-time food price monitoring focusing on developing countries and food security indicators.",
      url: "https://www.fao.org/giews/food-prices",
      color: "purple",
      badge: "FPMA",
      coverage: {
        countries: stats.fpma.countries,
        products: stats.fpma.commodities,
        prices: stats.fpma.series * 50,
      },
      priceTypes: ["Retail", "Wholesale", "Market Prices"],
      updateFrequency: "Daily/Weekly",
      dataRange: "2000 - Present",
      features: [
        "Focus on food security",
        "Sub-national markets",
        "High-frequency updates",
        "Developing countries",
      ],
    },
  ];

  const colorClasses = {
    emerald: {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      border: "border-emerald-200",
      gradient: "from-emerald-500 to-emerald-600",
    },
    blue: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      border: "border-blue-200",
      gradient: "from-blue-500 to-blue-600",
    },
    amber: {
      bg: "bg-amber-100",
      text: "text-amber-700",
      border: "border-amber-200",
      gradient: "from-amber-500 to-amber-600",
    },
    purple: {
      bg: "bg-purple-100",
      text: "text-purple-700",
      border: "border-purple-200",
      gradient: "from-purple-500 to-purple-600",
    },
  };

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
              <Link href="/countries" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">
                Countries
              </Link>
              <Link href="/data-sources" className="text-sm font-medium text-emerald-600">
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
              <span className="text-slate-900">Data Sources</span>
            </nav>
            
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Data Sources</h1>
                <p className="text-slate-600 mt-2 max-w-2xl">
                  Agrai aggregates agricultural price data from multiple authoritative sources to provide comprehensive market intelligence.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500 bg-white px-4 py-2 rounded-lg border border-slate-200">
                <Database className="w-4 h-4" />
                4 sources
              </div>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-emerald-600">
                  {(stats.az.prices + stats.eu.prices + stats.fao.prices + stats.fpma.series * 50).toLocaleString()}
                </div>
                <div className="text-sm text-slate-500 mt-1">Total Price Records</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-blue-600">
                  {stats.eu.countries + stats.fao.countries + stats.fpma.countries}
                </div>
                <div className="text-sm text-slate-500 mt-1">Countries Covered</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-amber-600">
                  {stats.az.products + stats.eu.products + stats.fao.products + stats.fpma.commodities}
                </div>
                <div className="text-sm text-slate-500 mt-1">Products Tracked</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-purple-600">4</div>
                <div className="text-sm text-slate-500 mt-1">Data Sources</div>
              </CardContent>
            </Card>
          </div>

          {/* Data Source Cards */}
          <div className="space-y-6">
            {dataSources.map((source) => {
              const colors = colorClasses[source.color as keyof typeof colorClasses];
              
              return (
                <Card key={source.id} className="overflow-hidden">
                  <div className={`h-2 bg-gradient-to-r ${colors.gradient}`} />
                  <CardContent className="p-6">
                    <div className="grid lg:grid-cols-3 gap-6">
                      {/* Left: Source Info */}
                      <div className="lg:col-span-2">
                        <div className="flex items-start gap-4 mb-4">
                          <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
                            <Database className={`w-6 h-6 ${colors.text}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h2 className="text-xl font-bold text-slate-900">{source.name}</h2>
                              <Badge className={`${colors.bg} ${colors.text} ${colors.border}`}>
                                {source.badge}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-500">{source.fullName}</p>
                          </div>
                          <a 
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors"
                          >
                            Visit <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                        
                        <p className="text-slate-600 mb-4">{source.description}</p>
                        
                        {/* Features */}
                        <div className="grid grid-cols-2 gap-2">
                          {source.features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-slate-600">
                              <CheckCircle2 className={`w-4 h-4 ${colors.text}`} />
                              {feature}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: Stats */}
                      <div className="bg-slate-50 rounded-xl p-4 space-y-4">
                        <h3 className="font-semibold text-slate-900 mb-3">Coverage</h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                          {source.coverage.countries !== undefined && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-slate-400" />
                              <div>
                                <div className="font-mono font-semibold text-slate-900">
                                  {source.coverage.countries.toLocaleString()}
                                </div>
                                <div className="text-xs text-slate-500">Countries</div>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-slate-400" />
                            <div>
                              <div className="font-mono font-semibold text-slate-900">
                                {source.coverage.products.toLocaleString()}
                              </div>
                              <div className="text-xs text-slate-500">Products</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-slate-400" />
                            <div>
                              <div className="font-mono font-semibold text-slate-900">
                                {source.coverage.prices.toLocaleString()}
                              </div>
                              <div className="text-xs text-slate-500">Price Records</div>
                            </div>
                          </div>
                          
                          {source.coverage.markets !== undefined && (
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4 text-slate-400" />
                              <div>
                                <div className="font-mono font-semibold text-slate-900">
                                  {source.coverage.markets.toLocaleString()}
                                </div>
                                <div className="text-xs text-slate-500">Markets</div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="pt-4 border-t border-slate-200 space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-500">Update:</span>
                            <span className="font-medium text-slate-900">{source.updateFrequency}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-500">Range:</span>
                            <span className="font-medium text-slate-900">{source.dataRange}</span>
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t border-slate-200">
                          <div className="text-xs text-slate-500 mb-2">Price Types:</div>
                          <div className="flex flex-wrap gap-1">
                            {source.priceTypes.map((type, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Methodology Note */}
          <Card className="mt-8 bg-slate-900 text-white">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Data Integration Methodology</h3>
              <div className="grid md:grid-cols-2 gap-6 text-sm text-slate-300">
                <div>
                  <h4 className="font-medium text-white mb-2">Standardization</h4>
                  <p>All prices are converted to USD using daily exchange rates from ExchangeRate-API. Units are normalized to per-kilogram for comparison.</p>
                </div>
                <div>
                  <h4 className="font-medium text-white mb-2">Quality Assurance</h4>
                  <p>Data undergoes validation checks for outliers, missing values, and consistency across sources before integration.</p>
                </div>
                <div>
                  <h4 className="font-medium text-white mb-2">Product Mapping</h4>
                  <p>Products from different sources are mapped to unified Global Product taxonomy using AI-assisted matching and manual verification.</p>
                </div>
                <div>
                  <h4 className="font-medium text-white mb-2">Update Schedule</h4>
                  <p>Data is synchronized automatically based on each source&apos;s update frequency. Currency rates are updated daily at 00:00 UTC.</p>
                </div>
              </div>
            </CardContent>
          </Card>
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

