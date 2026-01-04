import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Package,
  MapPin,
  Users,
  TrendingUp,
  Database,
  FileSpreadsheet,
  ArrowUpRight,
  Globe,
  RefreshCw,
  GitCompare,
  Layers,
  Link2,
  BarChart3,
} from "lucide-react";
import { prisma } from "@/lib/prisma";

async function getStats() {
  const [
    productsCount, 
    marketsCount, 
    pricesCount, 
    usersCount,
    euCountriesCount,
    euProductsCount,
    euPricesCount,
    matchedProductsCount,
    // Global stats
    globalProductsCount,
    globalCountriesCount,
    fpmaCommoditiesCount,
    faoProductsCount,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.market.count(),
    prisma.price.count(),
    prisma.user.count(),
    prisma.euCountry.count(),
    prisma.euProduct.count(),
    prisma.euPrice.count(),
    prisma.euProduct.count({ where: { localProductId: { not: null } } }),
    // Global stats
    prisma.globalProduct.count(),
    prisma.globalCountry.count(),
    prisma.fpmaCommodity.count(),
    prisma.faoProduct.count(),
  ]);

  return { 
    productsCount, 
    marketsCount, 
    pricesCount, 
    usersCount,
    euCountriesCount,
    euProductsCount,
    euPricesCount,
    matchedProductsCount,
    globalProductsCount,
    globalCountriesCount,
    fpmaCommoditiesCount,
    faoProductsCount,
  };
}

export default async function AdminPage() {
  const stats = await getStats();

  const statCards = [
    {
      title: "Məhsullar",
      value: stats.productsCount,
      icon: Package,
      href: "/admin/products",
      color: "emerald",
    },
    {
      title: "Bazarlar",
      value: stats.marketsCount,
      icon: MapPin,
      href: "/admin/markets",
      color: "blue",
    },
    {
      title: "Qiymət qeydləri",
      value: stats.pricesCount,
      icon: TrendingUp,
      href: "/admin/prices",
      color: "amber",
    },
    {
      title: "İstifadəçilər",
      value: stats.usersCount,
      icon: Users,
      href: "/admin/users",
      color: "violet",
    },
  ];

  const quickActions = [
    {
      title: "Qiymət yüklə",
      description: "Excel faylından qiymət məlumatları yüklə",
      icon: FileSpreadsheet,
      href: "/admin/upload",
    },
    {
      title: "Məhsul əlavə et",
      description: "Yeni məhsul kataloqa əlavə et",
      icon: Package,
      href: "/admin/products/new",
    },
    {
      title: "Bazar əlavə et",
      description: "Yeni bazar əlavə et",
      icon: MapPin,
      href: "/admin/markets/new",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
        <p className="text-slate-500 mt-1">
          Məlumatları idarə edin və sistem statistikasına baxın
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{stat.title}</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">
                      {stat.value.toLocaleString()}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-${stat.color}-100 flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Sürətli əməliyyatlar</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Card className="hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mb-4">
                    <action.icon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">
                    {action.title}
                  </h3>
                  <p className="text-sm text-slate-500 flex-1">
                    {action.description}
                  </p>
                  <div className="flex items-center text-emerald-600 text-sm font-medium mt-4">
                    Keç
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Global Data Section - NEW */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          Global Data İdarəetmə
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link href="/admin/global-products">
            <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-indigo-200 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-indigo-600 font-medium">Global Məhsullar</p>
                    <p className="text-2xl font-bold text-indigo-900">{stats.globalProductsCount}</p>
                  </div>
                  <Package className="w-8 h-8 text-indigo-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 border-cyan-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-cyan-600 font-medium">Global Ölkələr</p>
                  <p className="text-2xl font-bold text-cyan-900">{stats.globalCountriesCount}</p>
                </div>
                <Globe className="w-8 h-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-orange-600 font-medium">FAO FPMA</p>
                  <p className="text-2xl font-bold text-orange-900">{stats.fpmaCommoditiesCount}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-teal-50 to-teal-100/50 border-teal-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-teal-600 font-medium">FAOSTAT</p>
                  <p className="text-2xl font-bold text-teal-900">{stats.faoProductsCount}</p>
                </div>
                <Database className="w-8 h-8 text-teal-400" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-4 flex gap-3">
          <Button variant="default" size="sm" className="bg-indigo-600 hover:bg-indigo-700" asChild>
            <Link href="/admin/global-products">
              <Layers className="w-4 h-4 mr-2" />
              Global Məhsullar
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/global-products">
              <Link2 className="w-4 h-4 mr-2" />
              Məhsul Əlaqələndirmə
            </Link>
          </Button>
        </div>
      </div>

      {/* EU Data Section */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-600" />
          EU Data İnteqrasiyası
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link href="/admin/eu-products">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-600 font-medium">EU Ölkələr</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.euCountriesCount}</p>
                  </div>
                  <Globe className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/admin/eu-products">
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-purple-600 font-medium">EU Məhsullar</p>
                    <p className="text-2xl font-bold text-purple-900">{stats.euProductsCount}</p>
                  </div>
                  <Package className="w-8 h-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-600 font-medium">EU Qiymətlər</p>
                  <p className="text-2xl font-bold text-emerald-900">{stats.euPricesCount.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-amber-600 font-medium">Uyğunlaşdırılmış</p>
                  <p className="text-2xl font-bold text-amber-900">{stats.matchedProductsCount}</p>
                </div>
                <GitCompare className="w-8 h-8 text-amber-400" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-4 flex gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/eu-products">
              <Package className="w-4 h-4 mr-2" />
              EU Məhsulları
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/eu-sync">
              <RefreshCw className="w-4 h-4 mr-2" />
              EU Sinxronizasiya
            </Link>
          </Button>
        </div>
      </div>

      {/* Recent Uploads */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Son yükləmələr</CardTitle>
          <CardDescription>Ən son yüklənmiş Excel faylları</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">
            <Database className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>Hələ heç bir yükləmə yoxdur</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/admin/upload">İlk yükləməni et</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

