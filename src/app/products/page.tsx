import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, Database, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { MainLayout } from "@/components/layout/main-layout";
import { Input } from "@/components/ui/input";

interface ProductWithStats {
  id: string;
  slug: string;
  nameEn: string;
  nameAz: string | null;
  image: string | null;
  category: {
    slug: string;
    nameAz: string | null;
    nameEn: string;
    icon: string | null;
  } | null;
  dataSources: string[];
  varietyCount: number;
  countryCount: number;
}

async function getProducts(): Promise<{
  products: ProductWithStats[];
  categoryGroups: Record<string, ProductWithStats[]>;
  totalCount: number;
}> {
  // Get all GlobalProducts with their relations
  const globalProducts = await prisma.globalProduct.findMany({
    where: { isActive: true },
    include: {
      globalCategory: true,
      productVarieties: {
        where: { isActive: true },
        select: { id: true }
      },
      localProducts: {
        select: { id: true }
      },
      euProducts: {
        select: { id: true }
      },
      faoProducts: {
        select: { id: true }
      },
      fpmaCommodities: {
        select: { id: true }
      },
    },
    orderBy: { nameEn: "asc" }
  });

  // Transform to ProductWithStats
  const products: ProductWithStats[] = globalProducts.map(gp => {
    const dataSources: string[] = [];

    if (gp.localProducts.length > 0) dataSources.push("AZ");
    if (gp.euProducts.length > 0) dataSources.push("EU");
    if (gp.faoProducts.length > 0) dataSources.push("FAO");
    if (gp.fpmaCommodities.length > 0) dataSources.push("FPMA");

    // Count unique countries (approximate)
    const countryCount = dataSources.length * 10; // rough estimate

    return {
      id: gp.id,
      slug: gp.slug,
      nameEn: gp.nameEn,
      nameAz: gp.nameAz,
      image: gp.image,
      category: gp.globalCategory ? {
        slug: gp.globalCategory.slug,
        nameAz: gp.globalCategory.nameAz,
        nameEn: gp.globalCategory.nameEn,
        icon: gp.globalCategory.icon,
      } : null,
      dataSources,
      varietyCount: gp.productVarieties.length,
      countryCount,
    };
  });

  // Filter to only products with data
  const productsWithData = products.filter(p => p.dataSources.length > 0);

  // Group by category
  const categoryGroups: Record<string, ProductWithStats[]> = {};
  
  for (const product of productsWithData) {
    const categorySlug = product.category?.slug || "other";
    if (!categoryGroups[categorySlug]) {
      categoryGroups[categorySlug] = [];
    }
    categoryGroups[categorySlug].push(product);
  }

  // Sort products within each category
  for (const category of Object.keys(categoryGroups)) {
    categoryGroups[category].sort((a, b) => 
      (a.nameAz || a.nameEn).localeCompare(b.nameAz || b.nameEn, "az")
    );
  }

  return {
    products: productsWithData,
    categoryGroups,
    totalCount: productsWithData.length,
  };
}

// Data source colors
const sourceColors: Record<string, string> = {
  "AZ": "bg-emerald-100 text-emerald-700",
  "EU": "bg-blue-100 text-blue-700",
  "FAO": "bg-amber-100 text-amber-700",
  "FPMA": "bg-purple-100 text-purple-700",
};

// Category order and icons
const categoryConfig: Record<string, { nameAz: string; icon: string; order: number }> = {
  "fruits": { nameAz: "Meyvələr", icon: "🍎", order: 1 },
  "vegetables": { nameAz: "Tərəvəzlər", icon: "🥕", order: 2 },
  "cereals": { nameAz: "Taxıl", icon: "🌾", order: 3 },
  "dairy": { nameAz: "Süd məhsulları", icon: "🥛", order: 4 },
  "meat": { nameAz: "Ət məhsulları", icon: "🥩", order: 5 },
  "fish": { nameAz: "Balıq", icon: "🐟", order: 6 },
  "oils": { nameAz: "Yağlar", icon: "🫒", order: 7 },
  "flour": { nameAz: "Un məhsulları", icon: "🌾", order: 8 },
  "bakery": { nameAz: "Çörək məhsulları", icon: "🍞", order: 9 },
  "sugar": { nameAz: "Şəkər", icon: "🍬", order: 10 },
  "oilseeds": { nameAz: "Yağlı toxumlar", icon: "🌻", order: 11 },
  "live-animals": { nameAz: "Canlı heyvanlar", icon: "🐄", order: 12 },
  "prepared-meat": { nameAz: "Hazır ət məhsulları", icon: "🌭", order: 13 },
  "preserved": { nameAz: "Konserv məhsullar", icon: "🥫", order: 14 },
  "other": { nameAz: "Digər", icon: "📦", order: 99 },
};

export default async function ProductsPage() {
  const { categoryGroups, totalCount } = await getProducts();

  // Sort categories by order
  const sortedCategories = Object.entries(categoryGroups).sort((a, b) => {
    const orderA = categoryConfig[a[0]]?.order ?? 99;
    const orderB = categoryConfig[b[0]]?.order ?? 99;
    return orderA - orderB;
  });

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Məhsullar</h1>
            <p className="text-slate-600 mt-1">
              Bütün kənd təsərrüfatı məhsullarının qiymət məlumatları
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Package className="w-4 h-4" />
            {totalCount} məhsul
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Məhsul axtar..." 
            className="pl-10"
            disabled
          />
        </div>

        {/* Products by Category */}
        {sortedCategories.map(([categorySlug, products]) => {
          const config = categoryConfig[categorySlug] || categoryConfig["other"];
          
          return (
            <div key={categorySlug} className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{config.icon}</span>
                <h2 className="text-lg font-semibold text-slate-700">
                  {config.nameAz}
                </h2>
                <Badge variant="secondary" className="font-normal">
                  {products.length}
                </Badge>
                <Link 
                  href={`/categories/${categorySlug}`}
                  className="ml-auto text-sm text-blue-600 hover:text-blue-800"
                >
                  Hamısına bax →
                </Link>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {products.slice(0, 10).map((product) => (
                  <Link key={product.id} href={`/products/${product.slug}`}>
                    <Card className="hover:shadow-lg transition-all h-full cursor-pointer hover:border-blue-200">
                      <CardContent className="p-4">
                        {/* Product image/icon */}
                        <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center mb-3">
                          {product.image ? (
                            <img 
                              src={product.image} 
                              alt={product.nameEn} 
                              className="w-10 h-10 object-cover rounded"
                            />
                          ) : (
                            <span className="text-2xl">{config.icon}</span>
                          )}
                        </div>
                        
                        <h4 className="font-semibold text-slate-900 truncate">
                          {product.nameAz || product.nameEn}
                        </h4>
                        <p className="text-xs text-slate-500 truncate">
                          {product.nameEn}
                        </p>
                        
                        {/* Data sources badges */}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {product.dataSources.map(source => (
                            <Badge 
                              key={source} 
                              variant="secondary" 
                              className={`text-xs px-1.5 py-0 ${sourceColors[source] || ""}`}
                            >
                              {source}
                            </Badge>
                          ))}
                        </div>
                        
                        {product.varietyCount > 0 && (
                          <div className="mt-2 text-xs text-slate-400">
                            {product.varietyCount} növ
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}

        {/* Data Sources Legend */}
        <Card className="bg-slate-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="w-5 h-5" />
              Data Mənbələri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {Object.entries(sourceColors).map(([source, color]) => (
                <div key={source} className="flex items-center gap-2">
                  <Badge className={color}>{source}</Badge>
                  <span className="text-sm text-slate-600">
                    {source === "AZ" && "Agro.gov.az"}
                    {source === "EU" && "Eurostat"}
                    {source === "FAO" && "FAOSTAT"}
                    {source === "FPMA" && "FAO FPMA"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
