import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  Search, 
  ChevronRight, 
  Filter,
  Leaf,
  ExternalLink,
  ArrowUpDown,
} from "lucide-react";
import { prisma } from "@/lib/prisma";

interface ProductWithStats {
  id: string;
  slug: string;
  nameEn: string;
  nameAz: string | null;
  image: string | null;
  category: string | null;
  dataSources: string[];
  varietyCount: number;
  countryCount: number;
  sourceCount: number;
}

async function getProducts(): Promise<{
  products: ProductWithStats[];
  categories: { name: string; count: number }[];
  totalCount: number;
}> {
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

  const products: ProductWithStats[] = globalProducts.map(gp => {
    const dataSources: string[] = [];

    if (gp.localProducts.length > 0) dataSources.push("AZ");
    if (gp.euProducts.length > 0) dataSources.push("EU");
    if (gp.faoProducts.length > 0) dataSources.push("FAO");
    if (gp.fpmaCommodities.length > 0) dataSources.push("FPMA");

    const countryCount = dataSources.includes("EU") ? 27 : 0 + 
                         dataSources.includes("FAO") ? 50 : 0 + 
                         dataSources.includes("FPMA") ? 80 : 0;

    return {
      id: gp.id,
      slug: gp.slug,
      nameEn: gp.nameEn,
      nameAz: gp.nameAz,
      image: gp.image,
      category: gp.globalCategory?.nameEn || null,
      dataSources,
      varietyCount: gp.productVarieties.length,
      countryCount: countryCount || dataSources.length * 15,
      sourceCount: dataSources.length,
    };
  });

  // Filter products with data
  const productsWithData = products.filter(p => p.dataSources.length > 0);

  // Get category counts
  const categoryMap = new Map<string, number>();
  for (const product of productsWithData) {
    const cat = product.category || "Other";
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
  }
  const categories = Array.from(categoryMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    products: productsWithData,
    categories,
    totalCount: productsWithData.length,
  };
}

// Data source badge styling
const sourceColors: Record<string, string> = {
  "AZ": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "EU": "bg-blue-100 text-blue-700 border-blue-200",
  "FAO": "bg-amber-100 text-amber-700 border-amber-200",
  "FPMA": "bg-purple-100 text-purple-700 border-purple-200",
};

export default async function ProductsPage() {
  const { products, categories, totalCount } = await getProducts();

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
              <Link href="/products" className="text-sm font-medium text-emerald-600">
                Products
              </Link>
              <Link href="/countries" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">
                Countries
              </Link>
              <Link href="/data-sources" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">
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
              <span className="text-slate-900">Products</span>
            </nav>
            
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Products</h1>
                <p className="text-slate-600 mt-2">
                  Browse {totalCount} agricultural commodities with global price data
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500 bg-white px-4 py-2 rounded-lg border border-slate-200">
                <Package className="w-4 h-4" />
                {totalCount} products
              </div>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-white rounded-xl border border-slate-200">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search products..." 
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.name} value={cat.name}>{cat.name} ({cat.count})</option>
                ))}
              </select>
            </div>

            {/* Data Source Filter */}
            <select className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
              <option value="">All Sources</option>
              <option value="AZ">🇦🇿 Azerbaijan (AZ)</option>
              <option value="EU">🇪🇺 Eurostat (EU)</option>
              <option value="FAO">🌍 FAOSTAT (FAO)</option>
              <option value="FPMA">📊 FAO FPMA</option>
            </select>

            {/* Only with data toggle */}
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
              <span>Only with data</span>
            </label>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-4">
                      <button className="flex items-center gap-1 hover:text-slate-900">
                        Product <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-4">
                      Category
                    </th>
                    <th className="text-center text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-4">
                      Countries
                    </th>
                    <th className="text-center text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-4">
                      Coverage
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-4">
                      Sources
                    </th>
                    <th className="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-4">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <Link href={`/products/${product.slug}`} className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                            {product.image ? (
                              <img src={product.image} alt="" className="w-8 h-8 object-cover rounded" />
                            ) : (
                              <Package className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 group-hover:text-emerald-600 transition-colors">
                              {product.nameEn}
                            </div>
                            {product.nameAz && product.nameAz !== product.nameEn && (
                              <div className="text-xs text-slate-500">{product.nameAz}</div>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="outline" className="text-xs">
                          {product.category || "Other"}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-mono text-sm text-slate-700">
                          {product.countryCount > 0 ? product.countryCount : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-center">
                          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full" 
                              style={{ width: `${Math.min(100, product.sourceCount * 25)}%` }} 
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {product.dataSources.map(source => (
                            <Badge 
                              key={source} 
                              variant="outline"
                              className={`text-xs px-2 py-0.5 ${sourceColors[source] || ""}`}
                            >
                              {source}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          href={`/products/${product.slug}`}
                          className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          View <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="text-sm text-slate-500">
                Showing 1-{Math.min(products.length, 50)} of {products.length} products
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>Previous</Button>
                <Button variant="outline" size="sm">Next</Button>
              </div>
            </div>
          </div>

          {/* Data Sources Info */}
          <div className="mt-8 p-6 bg-white rounded-xl border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Data Sources</h3>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="flex items-start gap-3">
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">AZ</Badge>
                <div>
                  <div className="font-medium text-slate-900">Agro.gov.az</div>
                  <div className="text-xs text-slate-500">Azerbaijan Ministry of Agriculture</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">EU</Badge>
                <div>
                  <div className="font-medium text-slate-900">Eurostat</div>
                  <div className="text-xs text-slate-500">European Statistical Office</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-amber-100 text-amber-700 border-amber-200">FAO</Badge>
                <div>
                  <div className="font-medium text-slate-900">FAOSTAT</div>
                  <div className="text-xs text-slate-500">FAO Statistics Division</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-purple-100 text-purple-700 border-purple-200">FPMA</Badge>
                <div>
                  <div className="font-medium text-slate-900">FAO FPMA</div>
                  <div className="text-xs text-slate-500">Food Price Monitoring and Analysis</div>
                </div>
              </div>
            </div>
          </div>
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
