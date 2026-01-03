"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Search, 
  ArrowRight, 
  TrendingUp, 
  BarChart3, 
  MapPin, 
  Package,
  Globe,
  Leaf,
  ChevronRight,
  Sparkles,
  Database,
  ExternalLink,
  Calendar,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Flag emoji helper
function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return "🏳️";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Category icons
const categoryIcons: Record<string, string> = {
  "Fruits": "🍎",
  "Vegetables": "🥬",
  "Grains": "🌾",
  "Nuts": "🥜",
  "Other": "📦",
  "Meyvələr": "🍎",
  "Tərəvəzlər": "🥬",
};

interface MarketBriefClientProps {
  stats: {
    products: number;
    markets: number;
    euCountries: number;
    faoCountries: number;
    prices: number;
  };
  categories: { name: string; count: number }[];
  trendingProducts: {
    id: string;
    slug: string;
    nameAz: string | null;
    nameEn: string;
    category: string | null;
    image: string | null;
    dataCount: number;
  }[];
  latestAzPrices: {
    id: string;
    productName: string;
    productSlug: string;
    marketName: string;
    marketType: string;
    price: number;
    date: string;
  }[];
  latestEuPrices: {
    id: string;
    productName: string;
    productSlug: string | null;
    countryName: string;
    countryCode: string;
    price: number;
    year: number;
    period: number | null;
  }[];
  latestFaoPrices: {
    id: string;
    productName: string;
    productSlug: string | null;
    countryName: string;
    countryCode: string;
    price: number;
    year: number;
    currency: string;
    unit: string;
  }[];
  countriesWithData: {
    code: string;
    name: string;
    nameAz: string;
    euPrices: number;
    faoPrices: number;
  }[];
}

export function MarketBriefClient({
  stats,
  categories,
  trendingProducts,
  latestAzPrices,
  latestEuPrices,
  latestFaoPrices,
  countriesWithData,
}: MarketBriefClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-900">AgriPrice</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <Link
                href="/products"
                className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"
              >
                Məhsullar
              </Link>
              <Link
                href="/markets"
                className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"
              >
                Bazarlar
              </Link>
              <Link
                href="/countries"
                className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"
              >
                Ölkələr
              </Link>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"
              >
                Dashboard
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild>
                <Link href="/login">Daxil ol</Link>
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" asChild>
                <Link href="/register">Qeydiyyat</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Search */}
      <section className="pt-24 pb-12 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Bazar trendlərini kəşf edin
            </h1>
            <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
              Azərbaycan və dünya bazarlarında kənd təsərrüfatı məhsullarının qiymət 
              analizi, müqayisəsi və proqnozlaşdırılması
            </p>

            {/* AI Search Box */}
            <div className="max-w-3xl mx-auto">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Sparkles className="h-5 w-5 text-emerald-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-12 pr-20 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg"
                  placeholder="AI ilə axtarış: 'Alma qiymətləri bu il necə dəyişib?'"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <Button 
                    size="sm" 
                    className="bg-emerald-500 hover:bg-emerald-600 rounded-xl"
                  >
                    <Search className="w-4 h-4 mr-1" />
                    Axtar
                  </Button>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                🚀 DeepSeek AI ilə gücləndirilmiş axtarış (tezliklə)
              </p>
            </div>

            {/* Trending searches */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
              <span className="text-sm text-slate-400">Populyar:</span>
              {trendingProducts.slice(0, 5).map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-sm text-white transition-colors"
                >
                  {product.nameAz || product.nameEn}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{stats.products}+</div>
              <div className="text-sm text-slate-500">Məhsul</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{stats.markets}+</div>
              <div className="text-sm text-slate-500">Bazar</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{stats.euCountries}</div>
              <div className="text-sm text-slate-500">EU Ölkə</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{stats.faoCountries}</div>
              <div className="text-sm text-slate-500">FAO Ölkə</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{(stats.prices / 1000).toFixed(0)}K+</div>
              <div className="text-sm text-slate-500">Qiymət qeydi</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Kateqoriyalar</h2>
            <Link href="/categories" className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              Hamısına bax <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.slice(0, 6).map((category) => (
              <Link
                key={category.name}
                href={`/categories/${category.name.toLowerCase()}`}
                className="group"
              >
                <Card className="hover:shadow-lg hover:border-emerald-200 transition-all duration-300">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl mb-2">
                      {categoryIcons[category.name] || "📦"}
                    </div>
                    <div className="font-medium text-slate-900 group-hover:text-emerald-600 transition-colors">
                      {category.name}
                    </div>
                    <div className="text-xs text-slate-500">{category.count} məhsul</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Azerbaijan Market Prices */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇦🇿</span>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Azərbaycan Bazar Qiymətləri</h2>
                <p className="text-sm text-slate-500">agro.gov.az mənbəsindən</p>
              </div>
            </div>
            <Link href="/markets" className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              Hamısına bax <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {latestAzPrices.map((price) => (
              <Link key={price.id} href={`/products/${price.productSlug}`}>
                <Card className="hover:shadow-lg hover:border-emerald-200 transition-all duration-300 h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-semibold text-slate-900">{price.productName}</div>
                        <div className="text-sm text-slate-500">{price.marketName}</div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {price.marketType}
                      </Badge>
                    </div>
                    <div className="flex items-end justify-between">
                      <div className="text-2xl font-bold text-emerald-600">
                        {price.price.toFixed(2)} ₼
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(price.date).toLocaleDateString('az-AZ')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* EU Market Prices */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇪🇺</span>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Avropa Bazar Qiymətləri</h2>
                <p className="text-sm text-slate-500">Eurostat mənbəsindən</p>
              </div>
            </div>
            <Link href="/countries" className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              Hamısına bax <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {latestEuPrices.map((price) => (
              <Link key={price.id} href={price.productSlug ? `/products/${price.productSlug}` : '/products'}>
                <Card className="hover:shadow-lg hover:border-blue-200 transition-all duration-300 h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-semibold text-slate-900">{price.productName}</div>
                        <div className="text-sm text-slate-500 flex items-center gap-1">
                          {getFlagEmoji(price.countryCode)} {price.countryName}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        EUROSTAT
                      </Badge>
                    </div>
                    <div className="flex items-end justify-between">
                      <div className="text-2xl font-bold text-blue-600">
                        {price.price.toFixed(2)} €
                      </div>
                      <div className="text-xs text-slate-400">
                        {price.year}{price.period ? `-${price.period.toString().padStart(2, '0')}` : ''}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAO Global Prices */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌍</span>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Qlobal İstehsalçı Qiymətləri</h2>
                <p className="text-sm text-slate-500">FAO FAOSTAT mənbəsindən</p>
              </div>
            </div>
            <a 
              href="https://www.fao.org/faostat" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              FAOSTAT <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {latestFaoPrices.map((price) => (
              <Link key={price.id} href={price.productSlug ? `/products/${price.productSlug}` : '/products'}>
                <Card className="hover:shadow-lg hover:border-amber-200 transition-all duration-300 h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-semibold text-slate-900">{price.productName}</div>
                        <div className="text-sm text-slate-500 flex items-center gap-1">
                          {getFlagEmoji(price.countryCode)} {price.countryName}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                        FAO
                      </Badge>
                    </div>
                    <div className="flex items-end justify-between">
                      <div className="text-2xl font-bold text-amber-600">
                        {price.price.toFixed(0)} $
                        <span className="text-sm font-normal text-slate-400">/ton</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {price.year}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Countries with Data */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Mövcud Ölkə Dataları</h2>
            <Link href="/countries" className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              Hamısına bax <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {countriesWithData.map((country) => (
              <Link
                key={country.code}
                href={`/countries/${country.code.toLowerCase()}`}
                className="group"
              >
                <Card className="hover:shadow-lg hover:border-emerald-200 transition-all duration-300">
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl mb-1">{getFlagEmoji(country.code)}</div>
                    <div className="font-medium text-sm text-slate-900 group-hover:text-emerald-600 transition-colors truncate">
                      {country.nameAz}
                    </div>
                    <div className="flex justify-center gap-1 mt-1">
                      {country.euPrices > 0 && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 bg-blue-50 text-blue-600 border-blue-200">
                          EU
                        </Badge>
                      )}
                      {country.faoPrices > 0 && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 bg-amber-50 text-amber-600 border-amber-200">
                          FAO
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gradient-to-br from-emerald-600 to-teal-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Platforma İmkanları</h2>
            <p className="text-lg text-emerald-100 max-w-2xl mx-auto">
              AgriPrice sizə kənd təsərrüfatı bazarını anlamaq və qərarlar qəbul etmək üçün lazım olan bütün alətləri təqdim edir
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Real-vaxt izləmə</h3>
                <p className="text-sm text-emerald-100">Həftəlik və aylıq qiymət dəyişikliklərini izləyin</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Müqayisəli analiz</h3>
                <p className="text-sm text-emerald-100">Ölkələr və bazarlar arasında müqayisə</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Qlobal data</h3>
                <p className="text-sm text-emerald-100">FAO, Eurostat və yerli mənbələr</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">AI analitika</h3>
                <p className="text-sm text-emerald-100">DeepSeek ilə ağıllı analiz (tezliklə)</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Limitsiz giriş əldə edin
          </h2>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Bütün bazar trendlərinə və AI ilə gücləndirilmiş analizlərə tam giriş
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700" asChild>
              <Link href="/register">
                Pulsuz qeydiyyat
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/products">Məhsullara bax</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Leaf className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg text-white">AgriPrice</span>
              </div>
              <p className="text-sm text-slate-400">
                Azərbaycan və dünya kənd təsərrüfatı qiymət analizi platforması
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Platforma</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/products" className="hover:text-white transition-colors">Məhsullar</Link></li>
                <li><Link href="/markets" className="hover:text-white transition-colors">Bazarlar</Link></li>
                <li><Link href="/countries" className="hover:text-white transition-colors">Ölkələr</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Mənbələr</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="https://agro.gov.az" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">agro.gov.az <ExternalLink className="w-3 h-3" /></a></li>
                <li><a href="https://ec.europa.eu/eurostat" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">Eurostat <ExternalLink className="w-3 h-3" /></a></li>
                <li><a href="https://www.fao.org/faostat" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">FAOSTAT <ExternalLink className="w-3 h-3" /></a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Əlaqə</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/about" className="hover:text-white transition-colors">Haqqımızda</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Əlaqə</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Məxfilik</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-500">
              © 2026 AgriPrice. Bütün hüquqlar qorunur.
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span>Data mənbələri: agro.gov.az, Eurostat, FAOSTAT</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

