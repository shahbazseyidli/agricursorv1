import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers, Package } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { MainLayout } from "@/components/layout/main-layout";

interface CategoryWithStats {
  id: string;
  slug: string;
  code: string;
  nameEn: string;
  nameAz: string | null;
  description: string | null;
  icon: string | null;
  image: string | null;
  productCount: number;
}

async function getCategories(): Promise<CategoryWithStats[]> {
  const categories = await prisma.globalCategory.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: { globalProducts: true }
      }
    },
    orderBy: { sortOrder: "asc" }
  });

  return categories.map(c => ({
    id: c.id,
    slug: c.slug,
    code: c.code,
    nameEn: c.nameEn,
    nameAz: c.nameAz,
    description: c.description,
    icon: c.icon,
    image: c.image,
    productCount: c._count.globalProducts,
  }));
}

// Default icons for categories
const defaultIcons: Record<string, string> = {
  "live-animals": "🐄",
  "meat": "🥩",
  "fish": "🐟",
  "dairy": "🥛",
  "vegetables": "🥕",
  "fruits": "🍎",
  "cereals": "🌾",
  "flour": "🌾",
  "oilseeds": "🌻",
  "oils": "🫒",
  "prepared-meat": "🌭",
  "sugar": "🍬",
  "bakery": "🍞",
  "preserved": "🥫",
};

export default async function CategoriesPage() {
  const categories = await getCategories();
  const totalProducts = categories.reduce((sum, c) => sum + c.productCount, 0);

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Kateqoriyalar</h1>
            <p className="text-slate-600 mt-1">
              Məhsullar kateqoriyalar üzrə qruplaşdırılıb
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-1">
              <Layers className="w-4 h-4" />
              {categories.length} kateqoriya
            </div>
            <div className="flex items-center gap-1">
              <Package className="w-4 h-4" />
              {totalProducts} məhsul
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link key={category.id} href={`/categories/${category.slug}`}>
              <Card className="hover:shadow-lg transition-all h-full cursor-pointer hover:border-blue-200 group">
                <CardContent className="p-6">
                  {/* Icon/Image */}
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    {category.image ? (
                      <img 
                        src={category.image} 
                        alt={category.nameEn}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-4xl">
                        {category.icon || defaultIcons[category.slug] || "📦"}
                      </span>
                    )}
                  </div>
                  
                  {/* Name */}
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">
                    {category.nameAz || category.nameEn}
                  </h3>
                  <p className="text-sm text-slate-500 mb-3">
                    {category.nameEn}
                  </p>
                  
                  {/* Description */}
                  {category.description && (
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                  
                  {/* Stats */}
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                    <Badge variant="secondary" className="text-xs">
                      HS {category.code}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <Package className="w-3.5 h-3.5" />
                      {category.productCount} məhsul
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Info */}
        <Card className="bg-slate-50">
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-900 mb-2">
              HS Kodları haqqında
            </h3>
            <p className="text-sm text-slate-600">
              HS (Harmonized System) kodları beynəlxalq ticarətdə məhsulların 
              təsnifatı üçün istifadə olunan standart kodlardır. Hər kateqoriya 
              2 rəqəmli HS kodu ilə təmsil olunur.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
