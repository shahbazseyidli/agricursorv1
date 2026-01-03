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
  DialogTrigger,
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
  Unlink,
  Plus,
} from "lucide-react";

interface GlobalProduct {
  id: string;
  slug: string;
  nameAz: string | null;
  nameEn: string;
  category: string | null;
  defaultUnit: string;
  image: string | null;
  faoCode: string | null;
  eurostatCode: string | null;
  descriptionAz: string | null;
  descriptionEn: string | null;
  historyAz: string | null;
  historyEn: string | null;
  usesAz: string | null;
  usesEn: string | null;
  isActive: boolean;
  _count: {
    localProducts: number;
    euProducts: number;
    faoProducts: number;
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

export default function GlobalProductsPage() {
  const [products, setProducts] = useState<GlobalProduct[]>([]);
  const [euProducts, setEuProducts] = useState<EuProduct[]>([]);
  const [azProducts, setAzProducts] = useState<AzProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProduct, setEditingProduct] = useState<GlobalProduct | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("products");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProduct, setNewProduct] = useState({
    slug: "",
    nameAz: "",
    nameEn: "",
    category: "Fruits",
    image: "",
  });

  useEffect(() => {
    fetchProducts();
    fetchEuProducts();
    fetchAzProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/global-products");
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchEuProducts() {
    try {
      const res = await fetch("/api/admin/eu-products");
      const data = await res.json();
      if (data.success) {
        setEuProducts(data.data);
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
      }
    } catch (error) {
      console.error("Error fetching AZ products:", error);
    }
  }

  async function linkEuProduct(euProductId: string, globalProductId: string) {
    try {
      const res = await fetch("/api/admin/link-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ euProductId, globalProductId, type: "eu" }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("EU məhsulu uğurla bağlandı");
        fetchEuProducts();
        fetchProducts();
      } else {
        setError(data.error || "Xəta baş verdi");
      }
    } catch (error) {
      setError("Server xətası");
    }
  }

  async function unlinkEuProduct(euProductId: string) {
    try {
      const res = await fetch("/api/admin/link-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ euProductId, globalProductId: null, type: "eu" }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("EU məhsulu bağlantısı silindi");
        fetchEuProducts();
        fetchProducts();
      } else {
        setError(data.error || "Xəta baş verdi");
      }
    } catch (error) {
      setError("Server xətası");
    }
  }

  async function linkAzProduct(azProductId: string, globalProductId: string) {
    try {
      const res = await fetch("/api/admin/link-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ azProductId, globalProductId, type: "az" }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("AZ məhsulu uğurla bağlandı");
        fetchAzProducts();
        fetchProducts();
      } else {
        setError(data.error || "Xəta baş verdi");
      }
    } catch (error) {
      setError("Server xətası");
    }
  }

  async function handleSave() {
    if (!editingProduct) return;
    
    setSaving(true);
    setError("");
    setSuccess("");
    
    try {
      const res = await fetch(`/api/admin/global-products/${editingProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameAz: editingProduct.nameAz,
          nameEn: editingProduct.nameEn,
          image: editingProduct.image,
          descriptionAz: editingProduct.descriptionAz,
          descriptionEn: editingProduct.descriptionEn,
          historyAz: editingProduct.historyAz,
          historyEn: editingProduct.historyEn,
          usesAz: editingProduct.usesAz,
          usesEn: editingProduct.usesEn,
          faoCode: editingProduct.faoCode,
          eurostatCode: editingProduct.eurostatCode,
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess("Məhsul uğurla yeniləndi");
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
  }

  async function handleCreate() {
    if (!newProduct.slug || !newProduct.nameEn) {
      setError("Slug və İngilis adı mütləqdir");
      return;
    }
    
    setSaving(true);
    setError("");
    setSuccess("");
    
    try {
      const res = await fetch("/api/admin/global-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess(`"${newProduct.nameEn}" uğurla yaradıldı`);
        setShowCreateDialog(false);
        setNewProduct({ slug: "", nameAz: "", nameEn: "", category: "Fruits", image: "" });
        fetchProducts();
      } else {
        setError(data.error || "Xəta baş verdi");
      }
    } catch (error) {
      setError("Server xətası");
    } finally {
      setSaving(false);
    }
  }

  // Auto-generate slug from English name
  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }

  const filteredProducts = products.filter((p) =>
    p.nameAz?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter unlinked products
  const unlinkedEuProducts = euProducts.filter(p => !p.globalProductId);
  const unlinkedAzProducts = azProducts.filter(p => !p.globalProductId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Global Məhsullar</h1>
          <p className="text-slate-500 mt-1">
            Bütün ölkələr üzrə məhsulları idarə edin
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Yeni Məhsul
          </Button>
          <Button onClick={() => { fetchProducts(); fetchEuProducts(); fetchAzProducts(); }} variant="outline" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Yenilə
          </Button>
        </div>
      </div>

      {/* Create New Product Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Global Məhsul Yarat</DialogTitle>
            <DialogDescription>
              Yeni məhsul yaradın və sonradan EU/AZ məhsullarını buna bağlayın.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Name EN */}
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

            {/* Slug */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Slug *</Label>
              <Input
                className="col-span-3"
                value={newProduct.slug}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                  })
                }
                placeholder="apple, tomato, etc."
              />
            </div>

            {/* Name AZ */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Ad (AZ)</Label>
              <Input
                className="col-span-3"
                value={newProduct.nameAz}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    nameAz: e.target.value,
                  })
                }
                placeholder="Alma, Pomidor, etc."
              />
            </div>

            {/* Category */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Kateqoriya</Label>
              <Select
                value={newProduct.category}
                onValueChange={(value) =>
                  setNewProduct({ ...newProduct, category: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fruits">Meyvələr</SelectItem>
                  <SelectItem value="Vegetables">Tərəvəzlər</SelectItem>
                  <SelectItem value="Grains">Dənli bitkilər</SelectItem>
                  <SelectItem value="Other">Digər</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Image */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Şəkil URL</Label>
              <Input
                className="col-span-3"
                value={newProduct.image}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    image: e.target.value,
                  })
                }
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="products">
            <Package className="w-4 h-4 mr-2" />
            Məhsullar ({products.length})
          </TabsTrigger>
          <TabsTrigger value="eu-mapping">
            <Link2 className="w-4 h-4 mr-2" />
            EU Əlaqələndirmə ({unlinkedEuProducts.length})
          </TabsTrigger>
          <TabsTrigger value="az-mapping">
            <Link2 className="w-4 h-4 mr-2" />
            AZ Əlaqələndirmə ({unlinkedAzProducts.length})
          </TabsTrigger>
        </TabsList>

        {/* Error/Success messages */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Məhsul axtar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Məhsullar ({filteredProducts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Şəkil</TableHead>
                <TableHead>Ad (AZ)</TableHead>
                <TableHead>Ad (EN)</TableHead>
                <TableHead>Kateqoriya</TableHead>
                <TableHead>Ölkələr</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Əməliyyatlar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    {product.image ? (
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100">
                        <img
                          src={product.image}
                          alt={product.nameEn}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder-product.png";
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Package className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{product.nameAz || "-"}</TableCell>
                  <TableCell>{product.nameEn}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{product.category || "Digər"}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {product._count.localProducts > 0 && (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                          🇦🇿 {product._count.localProducts}
                        </Badge>
                      )}
                      {product._count.euProducts > 0 && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          🇪🇺 {product._count.euProducts}
                        </Badge>
                      )}
                      {product._count.faoProducts > 0 && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700">
                          🌍 FAO {product._count.faoProducts}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {product.isActive ? (
                      <Badge className="bg-green-100 text-green-700">Aktiv</Badge>
                    ) : (
                      <Badge variant="secondary">Deaktiv</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingProduct({ ...product })}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Redaktə
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Məhsulu Redaktə Et</DialogTitle>
                          <DialogDescription>
                            {product.nameEn} ({product.slug})
                          </DialogDescription>
                        </DialogHeader>
                        
                        {editingProduct && editingProduct.id === product.id && (
                          <div className="grid gap-4 py-4">
                            {/* Image */}
                            <div className="grid grid-cols-4 items-start gap-4">
                              <Label className="text-right pt-3">Şəkil URL</Label>
                              <div className="col-span-3 space-y-2">
                                <div className="flex gap-2">
                                  <Input
                                    value={editingProduct.image || ""}
                                    onChange={(e) =>
                                      setEditingProduct({
                                        ...editingProduct,
                                        image: e.target.value,
                                      })
                                    }
                                    placeholder="https://example.com/image.jpg"
                                  />
                                  {editingProduct.image && (
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => window.open(editingProduct.image!, "_blank")}
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                                {editingProduct.image && (
                                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-slate-100">
                                    <img
                                      src={editingProduct.image}
                                      alt="Preview"
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = "none";
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Name AZ */}
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label className="text-right">Ad (AZ)</Label>
                              <Input
                                className="col-span-3"
                                value={editingProduct.nameAz || ""}
                                onChange={(e) =>
                                  setEditingProduct({
                                    ...editingProduct,
                                    nameAz: e.target.value,
                                  })
                                }
                              />
                            </div>

                            {/* Name EN */}
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label className="text-right">Ad (EN)</Label>
                              <Input
                                className="col-span-3"
                                value={editingProduct.nameEn}
                                onChange={(e) =>
                                  setEditingProduct({
                                    ...editingProduct,
                                    nameEn: e.target.value,
                                  })
                                }
                              />
                            </div>

                            {/* FAO Code */}
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label className="text-right">FAO Kodu</Label>
                              <Input
                                className="col-span-3"
                                value={editingProduct.faoCode || ""}
                                onChange={(e) =>
                                  setEditingProduct({
                                    ...editingProduct,
                                    faoCode: e.target.value,
                                  })
                                }
                                placeholder="Məs: 0490"
                              />
                            </div>

                            {/* Eurostat Code */}
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label className="text-right">Eurostat Kodu</Label>
                              <Input
                                className="col-span-3"
                                value={editingProduct.eurostatCode || ""}
                                onChange={(e) =>
                                  setEditingProduct({
                                    ...editingProduct,
                                    eurostatCode: e.target.value,
                                  })
                                }
                                placeholder="Məs: APPLES"
                              />
                            </div>

                            {/* Description AZ */}
                            <div className="grid grid-cols-4 items-start gap-4">
                              <Label className="text-right pt-3">Təsvir (AZ)</Label>
                              <Textarea
                                className="col-span-3"
                                rows={3}
                                value={editingProduct.descriptionAz || ""}
                                onChange={(e) =>
                                  setEditingProduct({
                                    ...editingProduct,
                                    descriptionAz: e.target.value,
                                  })
                                }
                                placeholder="Məhsul haqqında qısa məlumat..."
                              />
                            </div>

                            {/* Description EN */}
                            <div className="grid grid-cols-4 items-start gap-4">
                              <Label className="text-right pt-3">Təsvir (EN)</Label>
                              <Textarea
                                className="col-span-3"
                                rows={3}
                                value={editingProduct.descriptionEn || ""}
                                onChange={(e) =>
                                  setEditingProduct({
                                    ...editingProduct,
                                    descriptionEn: e.target.value,
                                  })
                                }
                                placeholder="Product description..."
                              />
                            </div>

                            {/* History AZ */}
                            <div className="grid grid-cols-4 items-start gap-4">
                              <Label className="text-right pt-3">Tarix (AZ)</Label>
                              <Textarea
                                className="col-span-3"
                                rows={2}
                                value={editingProduct.historyAz || ""}
                                onChange={(e) =>
                                  setEditingProduct({
                                    ...editingProduct,
                                    historyAz: e.target.value,
                                  })
                                }
                                placeholder="Məhsulun tarixi..."
                              />
                            </div>

                            {/* Uses AZ */}
                            <div className="grid grid-cols-4 items-start gap-4">
                              <Label className="text-right pt-3">İstifadəsi (AZ)</Label>
                              <Textarea
                                className="col-span-3"
                                rows={2}
                                value={editingProduct.usesAz || ""}
                                onChange={(e) =>
                                  setEditingProduct({
                                    ...editingProduct,
                                    usesAz: e.target.value,
                                  })
                                }
                                placeholder="Məhsulun istifadə sahələri..."
                              />
                            </div>
                          </div>
                        )}
                        
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setEditingProduct(null)}
                          >
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredProducts.length === 0 && !loading && (
            <div className="text-center py-12 text-slate-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>Məhsul tapılmadı</p>
            </div>
          )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* EU Mapping Tab */}
        <TabsContent value="eu-mapping" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-blue-600" />
                EU Məhsullarını Global Məhsullara Bağla
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 mb-4">
                Aşağıdakı EU məhsulları hələ heç bir Global məhsula bağlanmayıb. 
                Hər birini müvafiq Global məhsula bağlayın.
              </p>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>EU Məhsul</TableHead>
                    <TableHead>Kateqoriya</TableHead>
                    <TableHead>Global Məhsula Bağla</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unlinkedEuProducts.map((euProduct) => (
                    <TableRow key={euProduct.id}>
                      <TableCell className="font-medium">
                        {euProduct.nameEn}
                        {euProduct.nameAz && (
                          <span className="text-slate-500 ml-2">({euProduct.nameAz})</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{euProduct.category || "N/A"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          onValueChange={(value) => linkEuProduct(euProduct.id, value)}
                        >
                          <SelectTrigger className="w-64">
                            <SelectValue placeholder="Global məhsul seçin..." />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((gp) => (
                              <SelectItem key={gp.id} value={gp.id}>
                                {gp.nameAz || gp.nameEn} ({gp.slug})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {unlinkedEuProducts.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <Link2 className="w-10 h-10 mx-auto mb-2 text-green-500" />
                  <p>Bütün EU məhsulları bağlanıb!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Linked EU Products */}
          <Card>
            <CardHeader>
              <CardTitle>Bağlanmış EU Məhsulları</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>EU Məhsul</TableHead>
                    <TableHead>Global Məhsul</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {euProducts.filter(p => p.globalProductId).map((euProduct) => {
                    const globalProduct = products.find(gp => gp.id === euProduct.globalProductId);
                    return (
                      <TableRow key={euProduct.id}>
                        <TableCell className="font-medium">{euProduct.nameEn}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                            {globalProduct?.nameAz || globalProduct?.nameEn || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => unlinkEuProduct(euProduct.id)}
                          >
                            <Unlink className="w-4 h-4 mr-1" />
                            Ayır
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AZ Mapping Tab */}
        <TabsContent value="az-mapping" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-emerald-600" />
                AZ Məhsullarını Global Məhsullara Bağla
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 mb-4">
                Aşağıdakı Azərbaycan məhsulları hələ heç bir Global məhsula bağlanmayıb.
              </p>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>AZ Məhsul</TableHead>
                    <TableHead>Global Məhsula Bağla</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unlinkedAzProducts.map((azProduct) => (
                    <TableRow key={azProduct.id}>
                      <TableCell className="font-medium">{azProduct.name}</TableCell>
                      <TableCell>
                        <Select
                          onValueChange={(value) => linkAzProduct(azProduct.id, value)}
                        >
                          <SelectTrigger className="w-64">
                            <SelectValue placeholder="Global məhsul seçin..." />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((gp) => (
                              <SelectItem key={gp.id} value={gp.id}>
                                {gp.nameAz || gp.nameEn} ({gp.slug})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {unlinkedAzProducts.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <Link2 className="w-10 h-10 mx-auto mb-2 text-green-500" />
                  <p>Bütün AZ məhsulları bağlanıb!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

