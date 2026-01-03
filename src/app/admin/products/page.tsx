"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Package, 
  Search, 
  Edit2, 
  Image as ImageIcon,
  ExternalLink,
  ChevronRight,
  Layers
} from "lucide-react";

interface GlobalProduct {
  id: string;
  slug: string;
  nameEn: string;
  nameAz: string | null;
  image: string | null;
  hsCode: string | null;
  globalCategory: {
    id: string;
    slug: string;
    nameEn: string;
    nameAz: string | null;
  } | null;
  _count: {
    productVarieties: number;
    localProducts: number;
    euProducts: number;
    faoProducts: number;
    fpmaCommodities: number;
  };
}

interface GlobalCategory {
  id: string;
  slug: string;
  nameEn: string;
  nameAz: string | null;
  _count: {
    globalProducts: number;
  };
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<GlobalProduct[]>([]);
  const [categories, setCategories] = useState<GlobalCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<GlobalProduct | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, search]);

  async function fetchCategories() {
    try {
      const res = await fetch("/api/admin/global-categories");
      const data = await res.json();
      if (data.categories) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }

  async function fetchProducts() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory) params.set("categoryId", selectedCategory);
      if (search) params.set("search", search);
      
      const res = await fetch(`/api/admin/global-products?${params}`);
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateProductImage(productId: string, imageUrl: string) {
    try {
      const res = await fetch(`/api/admin/global-products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageUrl }),
      });
      
      if (res.ok) {
        fetchProducts();
        setSelectedProduct(null);
      }
    } catch (error) {
      console.error("Error updating product:", error);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Global Məhsullar
            </h1>
            <p className="text-slate-600">
              Məhsulları redaktə et, şəkil əlavə et, əlaqələndirmələri idarə et
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {products.length} məhsul
            </Badge>
          </div>
        </div>

        {/* Categories filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                Hamısı
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.nameAz || cat.nameEn}
                  <Badge variant="secondary" className="ml-2">
                    {cat._count.globalProducts}
                  </Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Məhsul axtar..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card 
              key={product.id} 
              className={`cursor-pointer hover:shadow-lg transition-all ${
                selectedProduct?.id === product.id ? "ring-2 ring-blue-500" : ""
              }`}
              onClick={() => setSelectedProduct(product)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Image */}
                  <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 relative group">
                    {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.nameEn}
                        className="w-14 h-14 object-cover rounded"
                      />
                    ) : (
                      <Package className="w-8 h-8 text-slate-300" />
                    )}
                    <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 truncate">
                      {product.nameAz || product.nameEn}
                    </h4>
                    <p className="text-sm text-slate-500 truncate">
                      {product.nameEn}
                    </p>
                    
                    {product.globalCategory && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        {product.globalCategory.nameAz || product.globalCategory.nameEn}
                      </Badge>
                    )}

                    {/* Data source counts */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {product._count.localProducts > 0 && (
                        <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                          AZ: {product._count.localProducts}
                        </Badge>
                      )}
                      {product._count.euProducts > 0 && (
                        <Badge className="bg-blue-100 text-blue-700 text-xs">
                          EU: {product._count.euProducts}
                        </Badge>
                      )}
                      {product._count.faoProducts > 0 && (
                        <Badge className="bg-amber-100 text-amber-700 text-xs">
                          FAO: {product._count.faoProducts}
                        </Badge>
                      )}
                      {product._count.fpmaCommodities > 0 && (
                        <Badge className="bg-purple-100 text-purple-700 text-xs">
                          FPMA: {product._count.fpmaCommodities}
                        </Badge>
                      )}
                    </div>

                    <div className="mt-1 text-xs text-slate-400">
                      <Layers className="inline w-3 h-3 mr-1" />
                      {product._count.productVarieties} növ
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit Panel */}
        {selectedProduct && (
          <Card className="fixed bottom-0 left-0 right-0 border-t-2 border-blue-500 rounded-b-none shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Edit2 className="w-5 h-5" />
                Redaktə: {selectedProduct.nameAz || selectedProduct.nameEn}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Şəkil URL
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://example.com/image.jpg"
                      defaultValue={selectedProduct.image || ""}
                      id="imageUrl"
                    />
                    <Button
                      onClick={() => {
                        const input = document.getElementById("imageUrl") as HTMLInputElement;
                        updateProductImage(selectedProduct.id, input.value);
                      }}
                    >
                      Yadda saxla
                    </Button>
                  </div>
                </div>
                <a
                  href={`/products/${selectedProduct.slug}`}
                  target="_blank"
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="w-4 h-4" />
                  Səhifəyə bax
                </a>
                <Button
                  variant="outline"
                  onClick={() => setSelectedProduct(null)}
                >
                  Bağla
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
