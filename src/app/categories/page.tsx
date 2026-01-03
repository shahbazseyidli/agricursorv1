import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Apple, Carrot, Wheat, Fish, Milk, Package, Leaf } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { MainLayout } from "@/components/layout/main-layout";

// Category icons and colors
const CATEGORY_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>, color: string, bgColor: string }> = {
  "Fruits": { icon: Apple, color: "text-red-500", bgColor: "bg-red-50" },
  "Meyvə": { icon: Apple, color: "text-red-500", bgColor: "bg-red-50" },
  "Meyve": { icon: Apple, color: "text-red-500", bgColor: "bg-red-50" },
  "Meyvələr": { icon: Apple, color: "text-red-500", bgColor: "bg-red-50" },
  "Vegetables": { icon: Carrot, color: "text-orange-500", bgColor: "bg-orange-50" },
  "Tərəvəz": { icon: Carrot, color: "text-orange-500", bgColor: "bg-orange-50" },
  "Tərəvəzlər": { icon: Carrot, color: "text-orange-500", bgColor: "bg-orange-50" },
  "Bostan": { icon: Leaf, color: "text-green-500", bgColor: "bg-green-50" },
  "Cereals": { icon: Wheat, color: "text-amber-500", bgColor: "bg-amber-50" },
  "Taxıl": { icon: Wheat, color: "text-amber-500", bgColor: "bg-amber-50" },
  "Dairy": { icon: Milk, color: "text-blue-500", bgColor: "bg-blue-50" },
  "Süd məhsulları": { icon: Milk, color: "text-blue-500", bgColor: "bg-blue-50" },
  "Fish": { icon: Fish, color: "text-cyan-500", bgColor: "bg-cyan-50" },
  "Balıq": { icon: Fish, color: "text-cyan-500", bgColor: "bg-cyan-50" },
};

async function getCategories() {
  // Get categories from GlobalProduct (unified source)
  const globalProducts = await prisma.globalProduct.findMany({
    where: { isActive: true },
    select: { 
      category: true,
      _count: {
        select: {
          localProducts: true,
          euProducts: true
        }
      }
    }
  });

  // Group by category
  const categoryMap: Record<string, { 
    productCount: number; 
    hasAzData: boolean; 
    hasEuData: boolean 
  }> = {};

  globalProducts.forEach(p => {
    const cat = p.category || "Digər";
    if (!categoryMap[cat]) {
      categoryMap[cat] = { productCount: 0, hasAzData: false, hasEuData: false };
    }
    categoryMap[cat].productCount += 1;
    if (p._count.localProducts > 0) categoryMap[cat].hasAzData = true;
    if (p._count.euProducts > 0) categoryMap[cat].hasEuData = true;
  });

  // Build category list
  const categories = Object.entries(categoryMap).map(([name, data]) => {
    // Map English names to Azerbaijani
    const nameMap: Record<string, string> = {
      "Fruits": "Meyvə",
      "Vegetables": "Tərəvəz",
      "Cereals": "Taxıl",
      "Dairy": "Süd məhsulları",
      "Fish": "Balıq"
    };

    return {
      id: name.toLowerCase().replace(/\s+/g, "-"),
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      nameAz: nameMap[name] || name,
      nameEn: name,
      productCount: data.productCount,
      hasAzData: data.hasAzData,
      hasEuData: data.hasEuData
    };
  });

  // Sort by product count
  return categories.sort((a, b) => b.productCount - a.productCount);
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Kateqoriyalar</h1>
          <p className="text-slate-600 mt-1">
            Kənd təsərrüfatı məhsul kateqoriyaları
          </p>
        </div>

        {/* Category Grid - Tridge Style */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((category) => {
            const config = CATEGORY_CONFIG[category.nameAz] || 
                          CATEGORY_CONFIG[category.nameEn] || 
                          { icon: Package, color: "text-slate-500", bgColor: "bg-slate-50" };
            const Icon = config.icon;

            return (
              <Link 
                key={category.slug} 
                href={`/categories/${category.slug}`}
              >
                <Card className="hover:shadow-lg hover:border-emerald-200 transition-all h-full cursor-pointer group">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className={`w-16 h-16 rounded-2xl ${config.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-8 h-8 ${config.color}`} />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">
                      {category.nameAz}
                    </h3>
                    {category.nameAz !== category.nameEn && (
                      <p className="text-sm text-slate-500 mb-3">
                        {category.nameEn}
                      </p>
                    )}
                    <Badge variant="secondary">
                      {category.productCount} məhsul
                    </Badge>
                    {category.hasEuData && (
                      <Badge variant="outline" className="mt-2 text-xs bg-blue-50 text-blue-700">
                        🇪🇺 EU data
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Featured Categories Description */}
        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <Card className="bg-gradient-to-br from-red-50 to-white border-red-100">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Apple className="w-6 h-6 text-red-500" />
                <h3 className="font-semibold text-lg text-slate-900">Meyvələr</h3>
              </div>
              <p className="text-slate-600 text-sm">
                Alma, armud, üzüm, nar, portağal və digər meyvələrin qiymət məlumatları. 
                Yerli və beynəlxalq bazarlardan toplanmış data.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Carrot className="w-6 h-6 text-orange-500" />
                <h3 className="font-semibold text-lg text-slate-900">Tərəvəzlər</h3>
              </div>
              <p className="text-slate-600 text-sm">
                Pomidor, xiyar, kartof, soğan, kələm və digər tərəvəzlərin qiymət məlumatları. 
                Həm topdansatış, həm pərakəndə qiymətlər.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
