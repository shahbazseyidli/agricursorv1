import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, Database } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { MainLayout } from "@/components/layout/main-layout";

interface ProductWithStats {
  id: string;
  slug: string;
  nameEn: string;
  nameAz: string | null;
  image: string | null;
  dataSources: string[];
  varietyCount: number;
}

async function getCategoryWithProducts(slug: string) {
  const category = await prisma.globalCategory.findUnique({
    where: { slug },
    include: {
      globalProducts: {
        where: { isActive: true },
        include: {
          productVarieties: {
            where: { isActive: true },
            select: { id: true }
          },
          localProducts: { select: { id: true } },
          euProducts: { select: { id: true } },
          faoProducts: { select: { id: true } },
          fpmaCommodities: { select: { id: true } },
        },
        orderBy: { nameEn: "asc" }
      }
    }
  });

  if (!category) return null;

  const products: ProductWithStats[] = category.globalProducts.map(gp => {
    const dataSources: string[] = [];
    if (gp.localProducts.length > 0) dataSources.push("AZ");
    if (gp.euProducts.length > 0) dataSources.push("EU");
    if (gp.faoProducts.length > 0) dataSources.push("FAO");
    if (gp.fpmaCommodities.length > 0) dataSources.push("FPMA");

    return {
      id: gp.id,
      slug: gp.slug,
      nameEn: gp.nameEn,
      nameAz: gp.nameAz,
      image: gp.image,
      dataSources,
      varietyCount: gp.productVarieties.length,
    };
  });

  // Filter to products with data
  const productsWithData = products.filter(p => p.dataSources.length > 0);

  return {
    category: {
      id: category.id,
      slug: category.slug,
      code: category.code,
      nameEn: category.nameEn,
      nameAz: category.nameAz,
      description: category.description,
      icon: category.icon,
      image: category.image,
    },
    products: productsWithData,
  };
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

// Data source colors
const sourceColors: Record<string, string> = {
  "AZ": "bg-emerald-100 text-emerald-700",
  "EU": "bg-blue-100 text-blue-700",
  "FAO": "bg-amber-100 text-amber-700",
  "FPMA": "bg-purple-100 text-purple-700",
};

interface PageProps {
  params: { slug: string };
}

export default async function CategoryPage({ params }: PageProps) {
  const data = await getCategoryWithProducts(params.slug);
  
  if (!data) {
    notFound();
  }

  const { category, products } = data;
  const icon = category.icon || defaultIcons[category.slug] || "📦";

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Back link */}
        <Link 
          href="/categories" 
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Bütün kateqoriyalar
        </Link>

        {/* Header */}
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center shrink-0">
            {category.image ? (
              <img 
                src={category.image} 
                alt={category.nameEn}
                className="w-16 h-16 object-cover rounded-xl"
              />
            ) : (
              <span className="text-5xl">{icon}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-slate-900">
                {category.nameAz || category.nameEn}
              </h1>
              <Badge variant="outline">HS {category.code}</Badge>
            </div>
            <p className="text-slate-600">{category.nameEn}</p>
            {category.description && (
              <p className="text-slate-500 mt-2">{category.description}</p>
            )}
            <div className="flex items-center gap-2 mt-3 text-sm text-slate-500">
              <Package className="w-4 h-4" />
              {products.length} məhsul
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((product) => (
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
                      <span className="text-2xl">{icon}</span>
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

        {products.length === 0 && (
          <Card className="bg-slate-50">
            <CardContent className="p-8 text-center">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                Məhsul tapılmadı
              </h3>
              <p className="text-slate-500">
                Bu kateqoriyada hələlik qiymət məlumatı olan məhsul yoxdur.
              </p>
            </CardContent>
          </Card>
        )}

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

export async function generateStaticParams() {
  const categories = await prisma.globalCategory.findMany({
    where: { isActive: true },
    select: { slug: true }
  });

  return categories.map((c) => ({ slug: c.slug }));
}
