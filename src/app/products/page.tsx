import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, ArrowRight, Globe } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PublicHeader } from "@/components/layout/public-header";
import { ProductsFilters } from "./products-filters";

async function getProductsData() {
  // Get all global products (includes both AZ and EU products)
  const globalProducts = await prisma.globalProduct.findMany({
    where: { isActive: true },
    include: {
      localProducts: {
        include: {
          category: true,
          _count: { select: { prices: true } }
        }
      },
      euProducts: {
        include: {
          _count: { select: { prices: true } }
        }
      }
    },
    orderBy: { nameEn: "asc" }
  });
  
  // Also get EU products that don't have a global product link (unmatched)
  const unmatchedEuProducts = await prisma.euProduct.findMany({
    where: {
      globalProductId: null,
      prices: { some: {} } // Only get products with prices
    },
    include: {
      _count: { select: { prices: true } }
    },
    orderBy: { nameEn: "asc" }
  });
  
  // Get categories from local products
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" }
  });

  // Combine global products with unmatched EU products
  const allProducts = [
    ...globalProducts.map(gp => ({
      id: gp.id,
      slug: gp.slug,
      nameAz: gp.nameAz || gp.nameEn,
      nameEn: gp.nameEn,
      category: gp.category || "Digər",
      unit: gp.defaultUnit,
      image: gp.image,
      hasAzData: gp.localProducts.length > 0,
      hasEuData: gp.euProducts.length > 0,
      azPriceCount: gp.localProducts.reduce((sum, lp) => sum + lp._count.prices, 0),
      euPriceCount: gp.euProducts.reduce((sum, ep) => sum + ep._count.prices, 0),
      totalPriceCount: gp.localProducts.reduce((sum, lp) => sum + lp._count.prices, 0) + 
                       gp.euProducts.reduce((sum, ep) => sum + ep._count.prices, 0),
      localCategory: gp.localProducts[0]?.category?.name
    })),
    ...unmatchedEuProducts.map(ep => ({
      id: ep.id,
      slug: ep.id, // Use ID as slug for unmatched
      nameAz: ep.nameAz || ep.nameEn,
      nameEn: ep.nameEn,
      category: ep.category || "Digər",
      unit: "kg",
      image: null,
      hasAzData: false,
      hasEuData: true,
      azPriceCount: 0,
      euPriceCount: ep._count.prices,
      totalPriceCount: ep._count.prices,
      localCategory: null
    }))
  ];

  return { products: allProducts, categories };
}

interface PageProps {
  searchParams: { q?: string; category?: string; source?: string };
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const { products: allProducts, categories } = await getProductsData();
  
  // Filter products based on URL params
  const { q, category, source } = searchParams;
  
  let products = allProducts;
  
  // Search filter
  if (q) {
    const query = q.toLowerCase();
    products = products.filter(p => 
      p.nameAz.toLowerCase().includes(query) ||
      p.nameEn.toLowerCase().includes(query)
    );
  }
  
  // Category filter
  if (category && category !== "all") {
    products = products.filter(p => {
      const cat = (p.localCategory || p.category || "").toLowerCase();
      return cat.includes(category.toLowerCase());
    });
  }
  
  // Source filter
  if (source && source !== "all") {
    if (source === "az") {
      products = products.filter(p => p.hasAzData && !p.hasEuData);
    } else if (source === "eu") {
      products = products.filter(p => p.hasEuData && !p.hasAzData);
    } else if (source === "both") {
      products = products.filter(p => p.hasAzData && p.hasEuData);
    }
  }

  // Group by category
  const groupedProducts = products.reduce((acc, product) => {
    const cat = product.localCategory || product.category || "Digər";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(product);
    return acc;
  }, {} as Record<string, typeof products>);

  // Sort categories
  const sortedCategories = Object.entries(groupedProducts).sort((a, b) => {
    // Priority order
    const order = ["Meyvə", "Fruits", "Tərəvəz", "Vegetables", "Bostan"];
    const aIdx = order.findIndex(c => a[0].includes(c));
    const bIdx = order.findIndex(c => b[0].includes(c));
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return a[0].localeCompare(b[0]);
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <PublicHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Məhsullar</h1>
          <p className="text-slate-500">
            {products.length} məhsulun qiymət məlumatlarına baxın (Azərbaycan + Avropa)
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">
                {products.filter(p => p.hasAzData).length}
              </p>
              <p className="text-sm text-slate-500">🇦🇿 Azərbaycan məhsulları</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {products.filter(p => p.hasEuData).length}
              </p>
              <p className="text-sm text-slate-500">🇪🇺 Avropa məhsulları</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">
                {products.filter(p => p.hasAzData && p.hasEuData).length}
              </p>
              <p className="text-sm text-slate-500">🌍 Müqayisəli məhsullar</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters - Client Component */}
        <ProductsFilters categories={categories} />

        {/* Products by Category */}
        <div className="space-y-12">
          {sortedCategories.map(([category, catProducts]) => (
            <div key={category}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-900">
                  {category}
                </h2>
                <span className="text-sm text-slate-500">
                  {catProducts.length} məhsul
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {catProducts.map((product) => (
                  <Link key={product.id} href={`/products/${product.slug}`}>
                    <Card className="h-full hover:shadow-lg hover:border-emerald-200 transition-all group cursor-pointer">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          {/* Product Image or Icon */}
                          {product.image ? (
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100">
                              <img 
                                src={product.image} 
                                alt={product.nameAz}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                              <Package className="w-6 h-6 text-emerald-600" />
                            </div>
                          )}
                          
                          {/* Data Source Badges */}
                          <div className="flex gap-1">
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
                          </div>
                        </div>

                        <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-emerald-700 transition-colors">
                          {product.nameAz}
                        </h3>
                        
                        {product.nameAz !== product.nameEn && (
                          <p className="text-xs text-slate-400 mb-2">{product.nameEn}</p>
                        )}

                        <p className="text-sm text-slate-500 mb-3">
                          {category}
                        </p>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-sm text-slate-500">
                              <TrendingUp className="w-4 h-4" />
                              <span>{product.totalPriceCount}</span>
                            </div>
                            {product.hasAzData && product.hasEuData && (
                              <Badge variant="secondary" className="text-xs bg-purple-50 text-purple-700">
                                Müqayisə
                              </Badge>
                            )}
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {products.length === 0 && (
          <Card className="py-16 text-center">
            <Package className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Məhsul tapılmadı
            </h3>
            <p className="text-slate-500">
              Admin paneldən məhsul əlavə edin
            </p>
          </Card>
        )}

        {/* Data Source Note */}
        <div className="mt-12 text-center text-sm text-slate-400 border-t pt-8">
          <p className="flex items-center justify-center gap-2">
            <Globe className="w-4 h-4" />
            Data mənbələri: agro.gov.az, Eurostat, EC Agri-food Data Portal
          </p>
        </div>
      </div>
    </div>
  );
}
