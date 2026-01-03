import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Package,
  MapPin,
  ArrowUpRight,
  BarChart3,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function getDashboardData() {
  const [productsCount, marketsCount, latestPrices, recentProducts] = await Promise.all([
    prisma.product.count(),
    prisma.market.count(),
    prisma.price.findMany({
      take: 5,
      orderBy: { date: "desc" },
      include: {
        product: true,
        market: true,
      },
    }),
    prisma.product.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        _count: {
          select: { prices: true },
        },
      },
    }),
  ]);

  return { productsCount, marketsCount, latestPrices, recentProducts };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const data = await getDashboardData();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Xoş gəldiniz, {session?.user?.name || "İstifadəçi"}
        </h1>
        <p className="text-slate-500 mt-1">
          Kənd təsərrüfatı qiymətlərinin ən son vəziyyətinə nəzər salın
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Məhsullar</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {data.productsCount}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Package className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Bazarlar</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {data.marketsCount}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80">Müqayisə aləti</p>
                <p className="text-lg font-semibold text-white mt-1">
                  Qiymətləri müqayisə et
                </p>
              </div>
              <Link
                href="/dashboard/compare"
                className="w-12 h-12 rounded-xl bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
              >
                <BarChart3 className="w-6 h-6 text-white" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Prices */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Son qiymətlər</CardTitle>
            <CardDescription>Ən son yenilənmiş qiymətlər</CardDescription>
          </CardHeader>
          <CardContent>
            {data.latestPrices.length > 0 ? (
              <div className="space-y-4">
                {data.latestPrices.map((price) => (
                  <div
                    key={price.id}
                    className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {price.product.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {price.market.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-600">
                        {Number(price.priceAvg).toFixed(2)} {price.currency}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(price.date).toLocaleDateString("az-AZ")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                Hələ qiymət məlumatı yoxdur
              </div>
            )}
          </CardContent>
        </Card>

        {/* Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Məhsullar</CardTitle>
              <CardDescription>Son əlavə olunan məhsullar</CardDescription>
            </div>
            <Link
              href="/products"
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center"
            >
              Hamısı
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {data.recentProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="p-3 rounded-lg border border-slate-200 hover:border-emerald-200 hover:shadow-sm transition-all"
                  >
                    <p className="font-medium text-slate-900">{product.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {product.category.name}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {product._count.prices} qiymət
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                Hələ məhsul yoxdur
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

