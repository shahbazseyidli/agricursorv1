"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Search,
  Edit,
  Save,
  X,
  Globe,
  RefreshCw,
  ExternalLink,
  Link2,
  Plus,
  Layers,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface GlobalCategory {
  id: string;
  slug: string;
  nameAz: string;
  nameEn: string;
  icon?: string | null;
  _count?: {
    products: number;
  };
}

interface GlobalProduct {
  id: string;
  slug: string;
  nameAz: string | null;
  nameEn: string;
  globalCategory?: GlobalCategory | null;
  globalCategoryId: string | null;
  defaultUnit: string;
  image: string | null;
  hsCode: string | null;
  faoCode: string | null;
  cpcCode: string | null;
  eurostatCode: string | null;
  fpmaCode: string | null;
  descriptionAz: string | null;
  descriptionEn: string | null;
  isActive: boolean;
  _count: {
    productVarieties: number;
    localProducts: number;
    euProducts: number;
    faoProducts: number;
    fpmaCommodities: number;
  };
}

interface EuProduct {
  id: string;
  nameEn: string;
  nameAz: string | null;
  category: string | null;
  globalProductId: string | null;
}

interface AzProduct {
  id: string;
  name: string;
  slug: string;
  globalProductId: string | null;
}

interface FpmaCommodity {
  id: string;
  name: string;
  code: string | null;
  globalProductId: string | null;
}

interface FaoProduct {
  id: string;
  itemNameEn: string;
  itemCode: string | null;
  globalProductId: string | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function GlobalProductsPage() {
  const [products, setProducts] = useState<GlobalProduct[]>([]);
  const [allGlobalProducts, setAllGlobalProducts] = useState<GlobalProduct[]>([]); // For mapping sections
  const [categories, setCategories] = useState<GlobalCategory[]>([]);
  const [euProducts, setEuProducts] = useState<EuProduct[]>([]);
  const [azProducts, setAzProducts] = useState<AzProduct[]>([]);
  const [fpmaCommodities, setFpmaCommodities] = useState<FpmaCommodity[]>([]);
  const [faoProducts, setFaoProducts] = useState<FaoProduct[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  
  const [editingProduct, setEditingProduct] = useState<GlobalProduct | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("products");
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProduct, setNewProduct] = useState({
    slug: "",
    nameAz: "",
    nameEn: "",
    globalCategoryId: "",
    image: "",
  });

  // Edit link dialog state
  const [editLinkItem, setEditLinkItem] = useState<{id: string; name: string; code: string; globalProductId: string | null} | null>(null);
  const [editLinkType, setEditLinkType] = useState<"az" | "eu" | "fpma" | "fao" | null>(null);
  const [showEditLinkDialog, setShowEditLinkDialog] = useState(false);
  const [selectedGlobalProductId, setSelectedGlobalProductId] = useState<string>("");

  // Fetch all data on mount
  useEffect(() => {
    fetchAllGlobalProducts();
    fetchCategories();
    fetchEuProducts();
    fetchAzProducts();
    fetchFpmaCommodities();
    fetchFaoProducts();
  }, []);

  // Fetch products when filters change
  useEffect(() => {
    fetchProducts();
  }, [searchQuery, selectedCategoryId, currentPage]);

  // Fetch ALL global products (without pagination) for mapping sections
  async function fetchAllGlobalProducts() {
    try {
      const res = await fetch("/api/admin/global-products?limit=500");
      const data = await res.json();
      if (data.success) {
        setAllGlobalProducts(data.data);
      } else if (data.products) {
        setAllGlobalProducts(data.products);
      }
    } catch (error) {
      console.error("Error fetching all global products:", error);
    }
  }

  async function fetchProducts() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (selectedCategoryId !== "all") params.set("categoryId", selectedCategoryId);
      params.set("page", currentPage.toString());
      params.set("limit", "50");

      const res = await fetch(`/api/admin/global-products?${params}`);
      const data = await res.json();
      
      if (data.success) {
        setProducts(data.data);
        setPagination(data.pagination);
      } else if (data.products) {
        // Alternative format
        setProducts(data.products);
        setPagination(data.pagination);
      } else {
        console.error("Unexpected response format:", data);
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Məhsulları yükləmək mümkün olmadı");
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const res = await fetch("/api/admin/global-categories");
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      } else if (data.categories) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }

  async function fetchEuProducts() {
    try {
      const res = await fetch("/api/admin/eu-products");
      const data = await res.json();
      if (data.success) {
        setEuProducts(data.data);
      } else if (Array.isArray(data)) {
        setEuProducts(data);
      }
    } catch (error) {
      console.error("Error fetching EU products:", error);
    }
  }

  async function fetchAzProducts() {
    try {
      const res = await fetch("/api/admin/az-products");
      const data = await res.json();
      if (data.success) {
        setAzProducts(data.data);
      } else if (Array.isArray(data)) {
        setAzProducts(data);
      }
    } catch (error) {
      console.error("Error fetching AZ products:", error);
    }
  }

  async function fetchFpmaCommodities() {
    try {
      const res = await fetch("/api/admin/fpma-commodities");
      const data = await res.json();
      if (data.success) {
        setFpmaCommodities(data.data);
      } else if (Array.isArray(data)) {
        setFpmaCommodities(data);
      }
    } catch (error) {
      console.error("Error fetching FPMA commodities:", error);
    }
  }

  async function fetchFaoProducts() {
    try {
      const res = await fetch("/api/admin/fao-products");
      const data = await res.json();
      if (data.success) {
        setFaoProducts(data.data);
      } else if (Array.isArray(data)) {
        setFaoProducts(data);
      }
    } catch (error) {
      console.error("Error fetching FAO products:", error);
    }
  }

  async function linkProduct(sourceId: string, globalProductId: string, type: "eu" | "az" | "fpma" | "fao") {
    try {
      const res = await fetch("/api/admin/link-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId, globalProductId, type }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(`Məhsul uğurla bağlandı (${type.toUpperCase()})`);
        // Refresh the appropriate list
        if (type === "eu") fetchEuProducts();
        else if (type === "az") fetchAzProducts();
        else if (type === "fpma") fetchFpmaCommodities();
        else if (type === "fao") fetchFaoProducts();
        fetchProducts();
      } else {
        setError(data.error || "Xəta baş verdi");
      }
    } catch (error) {
      setError("Server xətası");
    }
    setTimeout(() => { setSuccess(""); setError(""); }, 3000);
  }

  async function unlinkProduct(sourceId: string, type: "eu" | "az" | "fpma" | "fao") {
    try {
      const res = await fetch("/api/admin/link-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId, globalProductId: null, type }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Bağlantı silindi");
        if (type === "eu") fetchEuProducts();
        else if (type === "az") fetchAzProducts();
        else if (type === "fpma") fetchFpmaCommodities();
        else if (type === "fao") fetchFaoProducts();
        fetchProducts();
      } else {
        setError(data.error || "Xəta baş verdi");
      }
    } catch (error) {
      setError("Server xətası");
    }
    setTimeout(() => { setSuccess(""); setError(""); }, 3000);
  }

  function openEditLinkDialog(item: {id: string; name: string; code: string; globalProductId: string | null}, type: "az" | "eu" | "fpma" | "fao") {
    setEditLinkItem(item);
    setEditLinkType(type);
    setSelectedGlobalProductId(item.globalProductId || "");
    setShowEditLinkDialog(true);
  }

  async function handleSaveLink() {
    if (!editLinkItem || !editLinkType) return;
    
    setSaving(true);
    try {
      const res = await fetch("/api/admin/link-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: editLinkItem.id,
          globalProductId: selectedGlobalProductId || null,
          type: editLinkType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Əlaqə uğurla yeniləndi");
        setShowEditLinkDialog(false);
        setEditLinkItem(null);
        if (editLinkType === "eu") fetchEuProducts();
        else if (editLinkType === "az") fetchAzProducts();
        else if (editLinkType === "fpma") fetchFpmaCommodities();
        else if (editLinkType === "fao") fetchFaoProducts();
        fetchProducts();
        fetchAllGlobalProducts();
      } else {
        setError(data.error || "Xəta baş verdi");
      }
    } catch (error) {
      setError("Server xətası");
    } finally {
      setSaving(false);
    }
    setTimeout(() => { setSuccess(""); setError(""); }, 3000);
  }

  // Get global product by ID for display
  const getGlobalProduct = (id: string | null) => {
    if (!id) return null;
    return allGlobalProducts.find(gp => gp.id === id);
  };

  async function handleSave() {
    if (!editingProduct) return;
    
    setSaving(true);
    setError("");
    
    try {
      const res = await fetch(`/api/admin/global-products/${editingProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameAz: editingProduct.nameAz,
          nameEn: editingProduct.nameEn,
          globalCategoryId: editingProduct.globalCategoryId,
          image: editingProduct.image,
          hsCode: editingProduct.hsCode,
          faoCode: editingProduct.faoCode,
          eurostatCode: editingProduct.eurostatCode,
          fpmaCode: editingProduct.fpmaCode,
          descriptionAz: editingProduct.descriptionAz,
          descriptionEn: editingProduct.descriptionEn,
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess("Məhsul uğurla yeniləndi");
        setShowEditDialog(false);
        setEditingProduct(null);
        fetchProducts();
      } else {
        setError(data.error || "Xəta baş verdi");
      }
    } catch (error) {
      setError("Server xətası");
    } finally {
      setSaving(false);
    }
    setTimeout(() => setSuccess(""), 3000);
  }

  async function handleCreate() {
    if (!newProduct.slug || !newProduct.nameEn) {
      setError("Slug və İngilis adı mütləqdir");
      return;
    }
    
    setSaving(true);
    setError("");
    
    try {
      const res = await fetch("/api/admin/global-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newProduct,
          globalCategoryId: newProduct.globalCategoryId || null,
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess(`"${newProduct.nameEn}" uğurla yaradıldı`);
        setShowCreateDialog(false);
        setNewProduct({ slug: "", nameAz: "", nameEn: "", globalCategoryId: "", image: "" });
        fetchProducts();
      } else {
        setError(data.error || "Xəta baş verdi");
      }
    } catch (error) {
      setError("Server xətası");
    } finally {
      setSaving(false);
    }
    setTimeout(() => setSuccess(""), 3000);
  }

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }

  // Filter unlinked products
  const unlinkedEuProducts = euProducts.filter(p => !p.globalProductId);
  const unlinkedAzProducts = azProducts.filter(p => !p.globalProductId);
  const unlinkedFpmaCommodities = fpmaCommodities.filter(p => !p.globalProductId);
  const unlinkedFaoProducts = faoProducts.filter(p => !p.globalProductId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Global Məhsullar</h1>
          <p className="text-slate-500 mt-1">
            Bütün data source-lar üzrə məhsulları idarə və əlaqələndir
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateDialog(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Yeni Məhsul
          </Button>
          <Button onClick={() => { fetchProducts(); fetchCategories(); }} variant="outline" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Yenilə
          </Button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 text-green-700 rounded-lg">
          ✓ {success}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100/50">
          <CardContent className="p-4">
            <p className="text-xs text-indigo-600 font-medium">Global Məhsullar</p>
            <p className="text-2xl font-bold text-indigo-900">{pagination?.total || products.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50">
          <CardContent className="p-4">
            <p className="text-xs text-emerald-600 font-medium">Kateqoriyalar</p>
            <p className="text-2xl font-bold text-emerald-900">{categories.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardContent className="p-4">
            <p className="text-xs text-blue-600 font-medium">EU Əlaqəsiz</p>
            <p className="text-2xl font-bold text-blue-900">{unlinkedEuProducts.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50">
          <CardContent className="p-4">
            <p className="text-xs text-orange-600 font-medium">FPMA Əlaqəsiz</p>
            <p className="text-2xl font-bold text-orange-900">{unlinkedFpmaCommodities.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-teal-50 to-teal-100/50">
          <CardContent className="p-4">
            <p className="text-xs text-teal-600 font-medium">FAO Əlaqəsiz</p>
            <p className="text-2xl font-bold text-teal-900">{unlinkedFaoProducts.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Create Product Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Yeni Global Məhsul Yarat</DialogTitle>
            <DialogDescription>
              Yeni məhsul yaradın və sonradan AZ/EU/FPMA/FAO məhsullarını buna bağlayın.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Ad (EN) *</Label>
              <Input
                className="col-span-3"
                value={newProduct.nameEn}
                onChange={(e) => {
                  const nameEn = e.target.value;
                  setNewProduct({
                    ...newProduct,
                    nameEn,
                    slug: generateSlug(nameEn),
                  });
                }}
                placeholder="Apple, Tomato, etc."
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Slug *</Label>
              <Input
                className="col-span-3"
                value={newProduct.slug}
                onChange={(e) => setNewProduct({ ...newProduct, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                placeholder="apple, tomato, etc."
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Ad (AZ)</Label>
              <Input
                className="col-span-3"
                value={newProduct.nameAz}
                onChange={(e) => setNewProduct({ ...newProduct, nameAz: e.target.value })}
                placeholder="Alma, Pomidor, etc."
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Kateqoriya</Label>
              <Select
                value={newProduct.globalCategoryId}
                onValueChange={(value) => setNewProduct({ ...newProduct, globalCategoryId: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Kateqoriya seçin..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nameAz || cat.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Şəkil URL</Label>
              <Input
                className="col-span-3"
                value={newProduct.image}
                onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              <X className="w-4 h-4 mr-1" />
              Ləğv et
            </Button>
            <Button onClick={handleCreate} disabled={saving || !newProduct.slug || !newProduct.nameEn}>
              <Plus className="w-4 h-4 mr-1" />
              {saving ? "Yaradılır..." : "Yarat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Link Dialog */}
      <Dialog open={showEditLinkDialog} onOpenChange={setShowEditLinkDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Məhsul Əlaqəsini Redaktə Et</DialogTitle>
            <DialogDescription>
              {editLinkItem?.name} ({editLinkType?.toUpperCase()}) - Global məhsula bağlayın və ya əlaqəni silin.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <Label>Mənbə Məhsul</Label>
                <div className="mt-1 p-3 bg-slate-100 rounded-lg">
                  <p className="font-medium">{editLinkItem?.name}</p>
                  {editLinkItem?.code && <p className="text-sm text-slate-500">Kod: {editLinkItem.code}</p>}
                </div>
              </div>
              
              <div>
                <Label>Global Məhsula Bağla</Label>
                <Select value={selectedGlobalProductId} onValueChange={setSelectedGlobalProductId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Global məhsul seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">❌ Əlaqəni sil</SelectItem>
                    {allGlobalProducts.map((gp) => (
                      <SelectItem key={gp.id} value={gp.id}>
                        {gp.nameAz || gp.nameEn} ({gp.slug})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditLinkDialog(false)}>
              <X className="w-4 h-4 mr-1" /> Ləğv et
            </Button>
            <Button onClick={handleSaveLink} disabled={saving}>
              <Save className="w-4 h-4 mr-1" /> {saving ? "Saxlanılır..." : "Saxla"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Məhsulu Redaktə Et</DialogTitle>
            <DialogDescription>
              {editingProduct?.nameEn} ({editingProduct?.slug})
            </DialogDescription>
          </DialogHeader>
          
          {editingProduct && (
            <div className="grid gap-4 py-4">
              {/* Image */}
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-3">Şəkil URL</Label>
                <div className="col-span-3 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={editingProduct.image || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                    {editingProduct.image && (
                      <Button variant="outline" size="icon" onClick={() => window.open(editingProduct.image!, "_blank")}>
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {editingProduct.image && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100">
                      <img
                        src={editingProduct.image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Ad (EN)</Label>
                <Input
                  className="col-span-3"
                  value={editingProduct.nameEn}
                  onChange={(e) => setEditingProduct({ ...editingProduct, nameEn: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Ad (AZ)</Label>
                <Input
                  className="col-span-3"
                  value={editingProduct.nameAz || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, nameAz: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Kateqoriya</Label>
                <Select
                  value={editingProduct.globalCategoryId || ""}
                  onValueChange={(value) => setEditingProduct({ ...editingProduct, globalCategoryId: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Kateqoriya seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.nameAz || cat.nameEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">HS Kodu</Label>
                <Input
                  className="col-span-3"
                  value={editingProduct.hsCode || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, hsCode: e.target.value })}
                  placeholder="Məs: 0808.10"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">FAO Kodu</Label>
                <Input
                  className="col-span-3"
                  value={editingProduct.faoCode || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, faoCode: e.target.value })}
                  placeholder="Məs: 0490"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Eurostat Kodu</Label>
                <Input
                  className="col-span-3"
                  value={editingProduct.eurostatCode || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, eurostatCode: e.target.value })}
                  placeholder="Məs: APPLES"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">FPMA Kodu</Label>
                <Input
                  className="col-span-3"
                  value={editingProduct.fpmaCode || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, fpmaCode: e.target.value })}
                  placeholder="Məs: wheat"
                />
              </div>

              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-3">Təsvir (AZ)</Label>
                <Textarea
                  className="col-span-3"
                  rows={2}
                  value={editingProduct.descriptionAz || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, descriptionAz: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-3">Təsvir (EN)</Label>
                <Textarea
                  className="col-span-3"
                  rows={2}
                  value={editingProduct.descriptionEn || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, descriptionEn: e.target.value })}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              <X className="w-4 h-4 mr-1" />
              Ləğv et
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-1" />
              {saving ? "Saxlanılır..." : "Saxla"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="products">
            <Package className="w-4 h-4 mr-2" />
            Məhsullar
          </TabsTrigger>
          <TabsTrigger value="categories">
            <Layers className="w-4 h-4 mr-2" />
            Kateqoriyalar
          </TabsTrigger>
          <TabsTrigger value="az-mapping">
            🇦🇿 AZ ({unlinkedAzProducts.length})
          </TabsTrigger>
          <TabsTrigger value="eu-mapping">
            🇪🇺 EU ({unlinkedEuProducts.length})
          </TabsTrigger>
          <TabsTrigger value="fpma-mapping">
            📊 FPMA ({unlinkedFpmaCommodities.length})
          </TabsTrigger>
          <TabsTrigger value="fao-mapping">
            🌍 FAO ({unlinkedFaoProducts.length})
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Məhsul axtar..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategoryId} onValueChange={(v) => { setSelectedCategoryId(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Kateqoriya" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Bütün kateqoriyalar</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.nameAz || cat.nameEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Məhsullar ({pagination?.total || products.length})
                </div>
                {pagination && pagination.pages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm">
                      {currentPage} / {pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(pagination.pages, p + 1))}
                      disabled={currentPage === pagination.pages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-slate-400" />
                  <p className="mt-2 text-slate-500">Yüklənir...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>Məhsul tapılmadı</p>
                  {searchQuery && <p className="text-sm">Axtarışı dəyişin</p>}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Şəkil</TableHead>
                      <TableHead>Ad (AZ)</TableHead>
                      <TableHead>Ad (EN)</TableHead>
                      <TableHead>Kateqoriya</TableHead>
                      <TableHead>Əlaqələr</TableHead>
                      <TableHead className="text-right">Əməliyyatlar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          {product.image ? (
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100">
                              <img
                                src={product.image}
                                alt={product.nameEn}
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder-product.png"; }}
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                              <Package className="w-5 h-5 text-slate-400" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{product.nameAz || "-"}</TableCell>
                        <TableCell>{product.nameEn}</TableCell>
                        <TableCell>
                          {product.globalCategory ? (
                            <Badge variant="secondary">
                              {product.globalCategory.nameAz || product.globalCategory.nameEn}
                            </Badge>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {product._count.localProducts > 0 && (
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 text-xs">
                                🇦🇿 {product._count.localProducts}
                              </Badge>
                            )}
                            {product._count.euProducts > 0 && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                                🇪🇺 {product._count.euProducts}
                              </Badge>
                            )}
                            {product._count.fpmaCommodities > 0 && (
                              <Badge variant="outline" className="bg-orange-50 text-orange-700 text-xs">
                                📊 {product._count.fpmaCommodities}
                              </Badge>
                            )}
                            {product._count.faoProducts > 0 && (
                              <Badge variant="outline" className="bg-teal-50 text-teal-700 text-xs">
                                🌍 {product._count.faoProducts}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setEditingProduct(product); setShowEditDialog(true); }}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Redaktə
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                Global Kateqoriyalar ({categories.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ad (AZ)</TableHead>
                    <TableHead>Ad (EN)</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Məhsul Sayı</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">{cat.nameAz}</TableCell>
                      <TableCell>{cat.nameEn}</TableCell>
                      <TableCell><code className="text-xs bg-slate-100 px-2 py-1 rounded">{cat.slug}</code></TableCell>
                      <TableCell>
                        <Badge variant="secondary">{cat._count?.products || 0}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AZ Mapping Tab */}
        <TabsContent value="az-mapping" className="space-y-4">
          <MappingSection
            title="🇦🇿 Azərbaycan Məhsulları"
            description="AZ məhsullarını Global məhsullara bağlayın."
            items={azProducts.map(p => ({ id: p.id, name: p.name, code: p.slug, globalProductId: p.globalProductId }))}
            allGlobalProducts={allGlobalProducts}
            getGlobalProduct={getGlobalProduct}
            onEdit={(item) => openEditLinkDialog(item, "az")}
          />
        </TabsContent>

        {/* EU Mapping Tab */}
        <TabsContent value="eu-mapping" className="space-y-4">
          <MappingSection
            title="🇪🇺 EU Məhsulları"
            description="Eurostat məhsullarını Global məhsullara bağlayın."
            items={euProducts.map(p => ({ id: p.id, name: p.nameEn, code: p.category || "", globalProductId: p.globalProductId }))}
            allGlobalProducts={allGlobalProducts}
            getGlobalProduct={getGlobalProduct}
            onEdit={(item) => openEditLinkDialog(item, "eu")}
          />
        </TabsContent>

        {/* FPMA Mapping Tab */}
        <TabsContent value="fpma-mapping" className="space-y-4">
          <MappingSection
            title="📊 FAO FPMA Commodities"
            description="FPMA commodity-lərini Global məhsullara bağlayın."
            items={fpmaCommodities.map(p => ({ id: p.id, name: p.name, code: p.code || "", globalProductId: p.globalProductId }))}
            allGlobalProducts={allGlobalProducts}
            getGlobalProduct={getGlobalProduct}
            onEdit={(item) => openEditLinkDialog(item, "fpma")}
          />
        </TabsContent>

        {/* FAO Mapping Tab */}
        <TabsContent value="fao-mapping" className="space-y-4">
          <MappingSection
            title="🌍 FAOSTAT Məhsulları"
            description="FAO məhsullarını Global məhsullara bağlayın."
            items={faoProducts.map(p => ({ id: p.id, name: p.itemNameEn, code: p.itemCode || "", globalProductId: p.globalProductId }))}
            allGlobalProducts={allGlobalProducts}
            getGlobalProduct={getGlobalProduct}
            onEdit={(item) => openEditLinkDialog(item, "fao")}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Mapping Section Component with Edit functionality
interface MappingSectionProps {
  title: string;
  description: string;
  items: { id: string; name: string; code: string; globalProductId: string | null }[];
  allGlobalProducts: GlobalProduct[];
  getGlobalProduct: (id: string | null) => GlobalProduct | null | undefined;
  onEdit: (item: { id: string; name: string; code: string; globalProductId: string | null }) => void;
}

function MappingSection({ title, description, items, allGlobalProducts, getGlobalProduct, onEdit }: MappingSectionProps) {
  const unlinkedItems = items.filter(i => !i.globalProductId);
  const linkedItems = items.filter(i => i.globalProductId);

  return (
    <>
      {/* Unlinked Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 mb-4">{description}</p>
          
          {unlinkedItems.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Link2 className="w-10 h-10 mx-auto mb-2 text-green-500" />
              <p>Bütün məhsullar bağlanıb!</p>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-orange-600 mb-3">Əlaqəsiz Məhsullar ({unlinkedItems.length})</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Məhsul</TableHead>
                    <TableHead>Kod</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unlinkedItems.slice(0, 50).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        {item.code && <code className="text-xs bg-slate-100 px-2 py-1 rounded">{item.code}</code>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-orange-50 text-orange-700">Əlaqəsiz</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
                          <Edit className="w-4 h-4 mr-1" /> Bağla
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {unlinkedItems.length > 50 && (
                <p className="text-sm text-slate-500 mt-2">+ {unlinkedItems.length - 50} daha çox</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Linked Items */}
      {linkedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bağlanmış Məhsullar ({linkedItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Məhsul</TableHead>
                  <TableHead>Kod</TableHead>
                  <TableHead>Global Məhsul</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linkedItems.slice(0, 50).map((item) => {
                  const gp = getGlobalProduct(item.globalProductId);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        {item.code && <code className="text-xs bg-slate-100 px-2 py-1 rounded">{item.code}</code>}
                      </TableCell>
                      <TableCell>
                        {gp ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                            {gp.nameAz || gp.nameEn}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700">N/A</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
                          <Edit className="w-4 h-4 mr-1" /> Redaktə
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {linkedItems.length > 50 && (
              <p className="text-sm text-slate-500 mt-2">+ {linkedItems.length - 50} daha çox</p>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
