"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Package,
  Plus,
  Trash2,
  Edit,
  RefreshCw,
  AlertTriangle,
  Tag,
  FolderTree,
} from "lucide-react";

interface Country {
  id: string;
  iso2: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  nameEn: string | null;
  nameRu: string | null;
  slug: string;
  aliases: string | null;
  country: Country;
  _count: { products: number };
}

interface ProductType {
  id: string;
  name: string;
  nameEn: string | null;
  nameRu: string | null;
  aliases: string | null;
  product: { id: string; name: string; slug: string };
  _count: { prices: number };
}

interface Product {
  id: string;
  name: string;
  nameEn: string | null;
  nameRu: string | null;
  slug: string;
  unit: string;
  aliases: string | null;
  faoCode: string | null;
  hsCode: string | null;
  country: Country;
  category: Category;
  productTypes: ProductType[];
  _count: { prices: number };
}

export default function ProductsManagementPage() {
  const [activeTab, setActiveTab] = useState("products");
  const [countries, setCountries] = useState<Country[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("");

  // Form states
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingType, setEditingType] = useState<ProductType | null>(null);

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    nameEn: "",
    nameRu: "",
    slug: "",
    aliases: "",
    countryId: "",
  });

  const [productForm, setProductForm] = useState({
    name: "",
    nameEn: "",
    nameRu: "",
    slug: "",
    unit: "kg",
    aliases: "",
    categoryId: "",
    countryId: "",
    faoCode: "",
    hsCode: "",
  });

  const [typeForm, setTypeForm] = useState({
    name: "",
    nameEn: "",
    nameRu: "",
    aliases: "",
    productId: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      fetchCategories();
      fetchProducts();
    }
  }, [selectedCountry, selectedCategory]);

  useEffect(() => {
    if (selectedProduct) {
      fetchProductTypes();
    }
  }, [selectedProduct]);

  async function fetchCountries() {
    try {
      const res = await fetch("/api/admin/countries");
      const data = await res.json();
      if (data.success) {
        setCountries(data.data);
        if (data.data.length > 0) {
          setSelectedCountry(data.data[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching countries:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const res = await fetch(
        `/api/admin/categories?countryId=${selectedCountry}`
      );
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  }

  async function fetchProducts() {
    try {
      let url = `/api/admin/products?countryId=${selectedCountry}`;
      if (selectedCategory) url += `&categoryId=${selectedCategory}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  }

  async function fetchProductTypes() {
    try {
      const res = await fetch(
        `/api/admin/product-types?productId=${selectedProduct}`
      );
      const data = await res.json();
      if (data.success) {
        setProductTypes(data.data);
      }
    } catch (err) {
      console.error("Error fetching product types:", err);
    }
  }

  // Category handlers
  function openCategoryForm(category?: Category) {
    setEditingCategory(category || null);
    setCategoryForm({
      name: category?.name || "",
      nameEn: category?.nameEn || "",
      nameRu: category?.nameRu || "",
      slug: category?.slug || "",
      aliases: category?.aliases || "",
      countryId: selectedCountry,
    });
    setShowCategoryForm(true);
    setError("");
  }

  async function handleCategorySubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : "/api/admin/categories";
      const res = await fetch(url, {
        method: editingCategory ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowCategoryForm(false);
        fetchCategories();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Xəta baş verdi");
    } finally {
      setSaving(false);
    }
  }

  async function handleCategoryDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchCategories();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error("Error deleting category:", err);
    }
  }

  // Product handlers
  function openProductForm(product?: Product) {
    setEditingProduct(product || null);
    setProductForm({
      name: product?.name || "",
      nameEn: product?.nameEn || "",
      nameRu: product?.nameRu || "",
      slug: product?.slug || "",
      unit: product?.unit || "kg",
      aliases: product?.aliases || "",
      categoryId: product?.category?.id || "",
      countryId: selectedCountry,
      faoCode: product?.faoCode || "",
      hsCode: product?.hsCode || "",
    });
    setShowProductForm(true);
    setError("");
  }

  async function handleProductSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = editingProduct
        ? `/api/admin/products/${editingProduct.id}`
        : "/api/admin/products";
      const res = await fetch(url, {
        method: editingProduct ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowProductForm(false);
        fetchProducts();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Xəta baş verdi");
    } finally {
      setSaving(false);
    }
  }

  async function handleProductDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchProducts();
      }
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  }

  async function handleClearAllProducts() {
    try {
      const res = await fetch(
        `/api/admin/products?countryId=${selectedCountry}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.success) {
        fetchProducts();
        fetchCategories();
      }
    } catch (err) {
      console.error("Error clearing products:", err);
    }
  }

  // Product Type handlers
  function openTypeForm(type?: ProductType) {
    setEditingType(type || null);
    setTypeForm({
      name: type?.name || "",
      nameEn: type?.nameEn || "",
      nameRu: type?.nameRu || "",
      aliases: type?.aliases || "",
      productId: type?.product?.id || selectedProduct,
    });
    setShowTypeForm(true);
    setError("");
  }

  async function handleTypeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = editingType
        ? `/api/admin/product-types/${editingType.id}`
        : "/api/admin/product-types";
      const res = await fetch(url, {
        method: editingType ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(typeForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowTypeForm(false);
        fetchProductTypes();
        fetchProducts();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Xəta baş verdi");
    } finally {
      setSaving(false);
    }
  }

  async function handleTypeDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/product-types/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchProductTypes();
        fetchProducts();
      }
    } catch (err) {
      console.error("Error deleting product type:", err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Məhsullar</h1>
          <p className="text-slate-500 mt-1">
            Məhsulları, kateqoriyaları və növləri idarə edin
          </p>
        </div>
      </div>

      {/* Country Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="w-48">
              <Label className="text-sm text-slate-600">Ölkə</Label>
              <Select
                value={selectedCountry}
                onValueChange={setSelectedCountry}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ölkə seçin" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.id} value={country.id}>
                      {country.name} ({country.iso2})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Məhsullar ({products.length})
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FolderTree className="w-4 h-4" />
            Kateqoriyalar ({categories.length})
          </TabsTrigger>
          <TabsTrigger value="types" className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Məhsul növləri
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <Select
                value={selectedCategory || "all"}
                onValueChange={(v) => setSelectedCategory(v === "all" ? "" : v)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Kateqoriya" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Hamısı</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Hamısını sil
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      Əminsiniz?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Bütün məhsullar, növlər və qiymətlər silinəcək.
                      <br />
                      <strong className="text-red-600">
                        {products.length} məhsul silinəcək
                      </strong>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Ləğv et</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearAllProducts}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Bəli, hamısını sil
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button onClick={() => openProductForm()}>
                <Plus className="w-4 h-4 mr-2" />
                Yeni məhsul
              </Button>
            </div>
          </div>

          {showProductForm && (
            <Card className="border-emerald-200 bg-emerald-50/30">
              <CardHeader>
                <CardTitle>
                  {editingProduct ? "Məhsulu redaktə et" : "Yeni məhsul"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProductSubmit} className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Ad (AZ) *</Label>
                      <Input
                        value={productForm.name}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            name: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label>Slug (EN) *</Label>
                      <Input
                        value={productForm.slug}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            slug: e.target.value
                              .toLowerCase()
                              .replace(/\s+/g, "-"),
                          })
                        }
                        required
                        disabled={!!editingProduct}
                      />
                    </div>
                    <div>
                      <Label>Kateqoriya *</Label>
                      <Select
                        value={productForm.categoryId}
                        onValueChange={(v) =>
                          setProductForm({ ...productForm, categoryId: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Ad (EN)</Label>
                      <Input
                        value={productForm.nameEn}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            nameEn: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Ad (RU)</Label>
                      <Input
                        value={productForm.nameRu}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            nameRu: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Vahid</Label>
                      <Input
                        value={productForm.unit}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            unit: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>FAO Kodu</Label>
                      <Input
                        value={productForm.faoCode}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            faoCode: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>HS Kodu</Label>
                      <Input
                        value={productForm.hsCode}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            hsCode: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Aliaslar</Label>
                      <Input
                        value={productForm.aliases}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            aliases: e.target.value,
                          })
                        }
                        placeholder="alias1, alias2"
                      />
                    </div>
                  </div>
                  {error && (
                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {error}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button type="submit" disabled={saving}>
                      {saving ? "Saxlanır..." : "Saxla"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowProductForm(false)}
                    >
                      Ləğv et
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium text-slate-600">
                      Məhsul
                    </th>
                    <th className="text-left p-4 font-medium text-slate-600">
                      Kateqoriya
                    </th>
                    <th className="text-left p-4 font-medium text-slate-600">
                      Növlər
                    </th>
                    <th className="text-left p-4 font-medium text-slate-600">
                      Qiymətlər
                    </th>
                    <th className="text-right p-4 font-medium text-slate-600">
                      Əməliyyatlar
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-12 text-slate-500"
                      >
                        <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p>Məhsul tapılmadı</p>
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr
                        key={product.id}
                        className="border-b hover:bg-slate-50"
                      >
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-slate-900">
                              {product.name}
                            </p>
                            <p className="text-sm text-slate-500">
                              /{product.slug}
                            </p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-violet-100 text-violet-700 rounded text-sm">
                            {product.category.name}
                          </span>
                        </td>
                        <td className="p-4">
                          {product.productTypes.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {product.productTypes.map((pt) => (
                                <span
                                  key={pt.id}
                                  className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs"
                                >
                                  {pt.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-4">
                          {product._count.prices.toLocaleString()}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openProductForm(product)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Məhsulu sil?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    "{product.name}" məhsulu və ona bağlı
                                    qiymətlər silinəcək.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Ləğv et</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleProductDelete(product.id)
                                    }
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Sil
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openCategoryForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Yeni kateqoriya
            </Button>
          </div>

          {showCategoryForm && (
            <Card className="border-emerald-200 bg-emerald-50/30">
              <CardHeader>
                <CardTitle>
                  {editingCategory
                    ? "Kateqoriyanı redaktə et"
                    : "Yeni kateqoriya"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCategorySubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Ad (AZ) *</Label>
                      <Input
                        value={categoryForm.name}
                        onChange={(e) =>
                          setCategoryForm({
                            ...categoryForm,
                            name: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label>Slug *</Label>
                      <Input
                        value={categoryForm.slug}
                        onChange={(e) =>
                          setCategoryForm({
                            ...categoryForm,
                            slug: e.target.value
                              .toLowerCase()
                              .replace(/\s+/g, "-"),
                          })
                        }
                        required
                        disabled={!!editingCategory}
                      />
                    </div>
                    <div>
                      <Label>Ad (EN)</Label>
                      <Input
                        value={categoryForm.nameEn}
                        onChange={(e) =>
                          setCategoryForm({
                            ...categoryForm,
                            nameEn: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Ad (RU)</Label>
                      <Input
                        value={categoryForm.nameRu}
                        onChange={(e) =>
                          setCategoryForm({
                            ...categoryForm,
                            nameRu: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Aliaslar</Label>
                      <Input
                        value={categoryForm.aliases}
                        onChange={(e) =>
                          setCategoryForm({
                            ...categoryForm,
                            aliases: e.target.value,
                          })
                        }
                        placeholder="alias1, alias2"
                      />
                    </div>
                  </div>
                  {error && (
                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {error}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button type="submit" disabled={saving}>
                      {saving ? "Saxlanır..." : "Saxla"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCategoryForm(false)}
                    >
                      Ləğv et
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium text-slate-600">
                      Kateqoriya
                    </th>
                    <th className="text-left p-4 font-medium text-slate-600">
                      Slug
                    </th>
                    <th className="text-left p-4 font-medium text-slate-600">
                      Aliaslar
                    </th>
                    <th className="text-left p-4 font-medium text-slate-600">
                      Məhsullar
                    </th>
                    <th className="text-right p-4 font-medium text-slate-600">
                      Əməliyyatlar
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-12 text-slate-500"
                      >
                        <FolderTree className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p>Kateqoriya tapılmadı</p>
                      </td>
                    </tr>
                  ) : (
                    categories.map((cat) => (
                      <tr key={cat.id} className="border-b hover:bg-slate-50">
                        <td className="p-4">
                          <p className="font-medium text-slate-900">
                            {cat.name}
                          </p>
                          {cat.nameEn && (
                            <p className="text-sm text-slate-500">
                              {cat.nameEn}
                            </p>
                          )}
                        </td>
                        <td className="p-4 text-slate-600">{cat.slug}</td>
                        <td className="p-4 text-slate-500 text-sm">
                          {cat.aliases || "-"}
                        </td>
                        <td className="p-4">{cat._count.products}</td>
                        <td className="p-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openCategoryForm(cat)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Kateqoriyanı sil?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {cat._count.products > 0
                                      ? `Bu kateqoriyaya ${cat._count.products} məhsul bağlıdır. Əvvəlcə məhsulları silin.`
                                      : `"${cat.name}" kateqoriyası silinəcək.`}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Ləğv et</AlertDialogCancel>
                                  {cat._count.products === 0 && (
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleCategoryDelete(cat.id)
                                      }
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Sil
                                    </AlertDialogAction>
                                  )}
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Types Tab */}
        <TabsContent value="types" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-64">
              <Label className="text-sm text-slate-600">Məhsul seçin</Label>
              <Select
                value={selectedProduct}
                onValueChange={setSelectedProduct}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Məhsul seçin" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedProduct && (
              <Button onClick={() => openTypeForm()}>
                <Plus className="w-4 h-4 mr-2" />
                Yeni növ
              </Button>
            )}
          </div>

          {showTypeForm && (
            <Card className="border-emerald-200 bg-emerald-50/30">
              <CardHeader>
                <CardTitle>
                  {editingType ? "Növü redaktə et" : "Yeni məhsul növü"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTypeSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Ad (AZ) *</Label>
                      <Input
                        value={typeForm.name}
                        onChange={(e) =>
                          setTypeForm({ ...typeForm, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label>Ad (EN)</Label>
                      <Input
                        value={typeForm.nameEn}
                        onChange={(e) =>
                          setTypeForm({ ...typeForm, nameEn: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Ad (RU)</Label>
                      <Input
                        value={typeForm.nameRu}
                        onChange={(e) =>
                          setTypeForm({ ...typeForm, nameRu: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Aliaslar</Label>
                      <Input
                        value={typeForm.aliases}
                        onChange={(e) =>
                          setTypeForm({ ...typeForm, aliases: e.target.value })
                        }
                        placeholder="alias1, alias2"
                      />
                    </div>
                  </div>
                  {error && (
                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {error}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button type="submit" disabled={saving}>
                      {saving ? "Saxlanır..." : "Saxla"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowTypeForm(false)}
                    >
                      Ləğv et
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {selectedProduct ? (
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="text-left p-4 font-medium text-slate-600">
                        Növ adı
                      </th>
                      <th className="text-left p-4 font-medium text-slate-600">
                        Aliaslar
                      </th>
                      <th className="text-left p-4 font-medium text-slate-600">
                        Qiymətlər
                      </th>
                      <th className="text-right p-4 font-medium text-slate-600">
                        Əməliyyatlar
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {productTypes.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="text-center py-12 text-slate-500"
                        >
                          <Tag className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                          <p>Bu məhsul üçün növ yoxdur</p>
                        </td>
                      </tr>
                    ) : (
                      productTypes.map((pt) => (
                        <tr
                          key={pt.id}
                          className="border-b hover:bg-slate-50"
                        >
                          <td className="p-4">
                            <p className="font-medium text-slate-900">
                              {pt.name}
                            </p>
                            {pt.nameEn && (
                              <p className="text-sm text-slate-500">
                                {pt.nameEn}
                              </p>
                            )}
                          </td>
                          <td className="p-4 text-slate-500 text-sm">
                            {pt.aliases || "-"}
                          </td>
                          <td className="p-4">{pt._count.prices}</td>
                          <td className="p-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openTypeForm(pt)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="destructive">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Növü sil?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      "{pt.name}" növü və ona bağlı qiymətlər
                                      silinəcək.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Ləğv et
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleTypeDelete(pt.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Sil
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-slate-500">
                <Tag className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>Növləri görmək üçün yuxarıdan məhsul seçin</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

