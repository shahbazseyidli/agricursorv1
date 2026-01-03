import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Package, Globe, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { MainLayout } from "@/components/layout/main-layout";
import { notFound } from "next/navigation";

interface Params {
  slug: string;
}

// Category name mapping - expanded to cover all variations
const CATEGORY_MAPPING: Record<string, string[]> = {
  "fruits": ["Fruits", "Meyvə", "Meyve", "Meyvələr", "Meyvələr və qoz-fındıq"],
  "vegetables": ["Vegetables", "Tərəvəz", "Tərəvəzlər"],
  "melons": ["Bostan", "Melons"],
  "melons-gourds": ["Bostan", "Melons"],
  "cereals": ["Cereals", "Taxıl", "Dənli bitkilər"],
  "dairy": ["Dairy", "Süd məhsulları", "Süd"],
  "fish": ["Fish", "Balıq"],
  "oils": ["Oils", "Yağlar", "Bitki yağları"],
  "nuts": ["Nuts", "Qoz-fındıq"],
  "other": ["Other", "Digər"],
  // Legacy AZ slugs - redirect to standardized slugs
  "meyve": ["Meyvə", "Fruits"],
  "terevez": ["Tərəvəz", "Vegetables"],
};

async function getCategoryProducts(slug: string) {
  // First try to find GlobalCategory by slug
  const globalCategory = await prisma.globalCategory.findUnique({
    where: { slug: slug },
    include: {
      globalProducts: {
        where: { isActive: true },
        include: {
          localProducts: {
            include: {
              _count: { select: { prices: true } },
              country: true
            }
          },
          euProducts: {
            include: {
              _count: { select: { prices: true } }
            }
          },
          faoProducts: {
            include: {
              _count: { select: { prices: true } }
            }
          },
          fpmaCommodities: {
            include: {
              _count: { select: { series: true } }
            }
          }
        },
        orderBy: { nameEn: "asc" }
      }
    }
  });

  if (globalCategory) {
    return {
      categorySlug: globalCategory.slug,
      categoryName: globalCategory.nameEn,
      categoryNameAz: globalCategory.nameAz || globalCategory.nameEn,
      globalProducts: globalCategory.globalProducts,
      azProducts: []
    };
  }

  // Fallback: Find matching category names from mapping
  const categoryNames = CATEGORY_MAPPING[slug] || [slug];

  // Get global products in this category
  const globalProducts = await prisma.globalProduct.findMany({
    where: {
      isActive: true,
      OR: categoryNames.map(name => ({ category: { contains: name } }))
    },
    include: {
      localProducts: {
        include: {
          _count: { select: { prices: true } },
          country: true
        }
      },
      euProducts: {
        include: {
          _count: { select: { prices: true } }
        }
      },
      faoProducts: {
        include: {
          _count: { select: { prices: true } }
        }
      },
      fpmaCommodities: {
        include: {
          _count: { select: { series: true } }
        }
      }
    },
    orderBy: { nameEn: "asc" }
  });

  // Get AZ category products not linked to global
  const azCategories = await prisma.category.findMany({
    where: {
      OR: categoryNames.map(name => ({ 
        OR: [
          { name: { contains: name } },
          { slug: { contains: slug } }
        ]
      }))
    },
    include: {
      products: {
        where: { globalProductId: null },
        include: {
          _count: { select: { prices: true } }
        }
      }
    }
  });

  // Get category display name
  const categoryName = categoryNames[0];
  const categoryNameAz = categoryNames.find(n => /[ə|ü|ö|ı|ş|ç|ğ]/.test(n)) || categoryName;

  return {
    categorySlug: slug,
    categoryName,
    categoryNameAz,
    globalProducts,
    azProducts: azCategories.flatMap(c => c.products)
  };
}

export default async function CategoryPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const data = await getCategoryProducts(slug);

  if (!data.globalProducts.length && !data.azProducts.length) {
    notFound();
  }

  const { categoryName, categoryNameAz, globalProducts, azProducts } = data;

  // Build product list with stats
  const products = globalProducts.map((gp: any) => {
    const azPriceCount = gp.localProducts.reduce((sum: number, p: any) => sum + p._count.prices, 0);
    const euPriceCount = gp.euProducts.reduce((sum: number, p: any) => sum + p._count.prices, 0);
    const faoPriceCount = gp.faoProducts?.reduce((sum: number, p: any) => sum + p._count.prices, 0) || 0;
    const fpmaSeriesCount = gp.fpmaCommodities?.reduce((sum: number, p: any) => sum + p._count.series, 0) || 0;
    const totalPriceCount = azPriceCount + euPriceCount + faoPriceCount + (fpmaSeriesCount * 50);
    const countryCount = new Set([
      ...gp.localProducts.map((p: any) => p.country.iso2),
      ...gp.euProducts.flatMap(() => ["EU"]) // Simplified
    ]).size;

    return {
      id: gp.id,
      slug: gp.slug,
      nameAz: gp.nameAz || gp.nameEn,
      nameEn: gp.nameEn,
      nameRu: gp.nameRu,
      hasAzData: azPriceCount > 0,
      hasEuData: euPriceCount > 0,
      hasFaoData: faoPriceCount > 0,
      hasFpmaData: fpmaSeriesCount > 0,
      totalPriceCount,
      countryCount,
      eurostatCode: gp.eurostatCode
    };
  });

  // Add standalone AZ products
  azProducts.forEach(p => {
    products.push({
      id: p.id,
      slug: p.slug,
      nameAz: p.name,
      nameEn: p.nameEn || p.name,
      nameRu: p.nameRu,
      hasAzData: true,
      hasEuData: false,
      hasFaoData: false,
      hasFpmaData: false,
      totalPriceCount: p._count.prices,
      countryCount: 1,
      eurostatCode: null
    });
  });

  // Sort by price count
  products.sort((a, b) => b.totalPriceCount - a.totalPriceCount);

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/categories">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900">{categoryNameAz}</h1>
            <p className="text-slate-600">{categoryName} • {products.length} məhsul</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Package className="w-6 h-6 mx-auto text-emerald-500 mb-2" />
              <p className="text-2xl font-bold text-slate-900">{products.length}</p>
              <p className="text-xs text-slate-500">Məhsul</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-6 h-6 mx-auto text-blue-500 mb-2" />
              <p className="text-2xl font-bold text-slate-900">
                {products.reduce((sum, p) => sum + p.totalPriceCount, 0).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">Qiymət qeydi</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Globe className="w-6 h-6 mx-auto text-purple-500 mb-2" />
              <p className="text-2xl font-bold text-slate-900">
                {products.filter(p => p.hasAzData).length}
              </p>
              <p className="text-xs text-slate-500">AZ datası ilə</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Globe className="w-6 h-6 mx-auto text-amber-500 mb-2" />
              <p className="text-2xl font-bold text-slate-900">
                {products.filter(p => p.hasEuData).length}
              </p>
              <p className="text-xs text-slate-500">EU datası ilə</p>
            </CardContent>
          </Card>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <Link key={product.id} href={`/products/${product.slug}`}>
              <Card className="hover:shadow-lg hover:border-emerald-200 transition-all h-full cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">
                        {product.nameAz}
                      </h3>
                      {product.nameAz !== product.nameEn && (
                        <p className="text-sm text-slate-500 truncate">{product.nameEn}</p>
                      )}
                    </div>
                    {product.eurostatCode && (
                      <code className="text-xs bg-slate-100 px-2 py-1 rounded shrink-0 ml-2">
                        {product.eurostatCode}
                      </code>
                    )}
                  </div>

                  {/* Data availability badges */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {product.hasAzData && (
                      <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                        🇦🇿
                      </Badge>
                    )}
                    {product.hasEuData && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        🇪🇺
                      </Badge>
                    )}
                    {product.hasFaoData && (
                      <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                        FAO
                      </Badge>
                    )}
                    {product.hasFpmaData && (
                      <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                        FPMA
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3 text-sm">
                    <span className="text-slate-500">
                      {product.totalPriceCount.toLocaleString()} qiymət
                    </span>
                    <ChevronRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}



