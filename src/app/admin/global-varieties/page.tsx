"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  RefreshCw,
  Plus,
  Link2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Edit,
} from "lucide-react";

interface GlobalProduct {
  id: string;
  slug: string;
  nameAz: string | null;
  nameEn: string;
}

interface GlobalProductVariety {
  id: string;
  slug: string;
  nameAz: string | null;
  nameEn: string;
  globalProductId: string;
  globalProduct: GlobalProduct;
  _count: {
    productTypes: number;
    fpmaCommodities: number;
    euProducts: number;
    faoProducts: number;
  };
}

interface SourceItem {
  id: string;
  name: string;
  code: string | null;
  varietyId: string | null;
  varietyName: string | null;
  productName?: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function GlobalVarietiesPage() {
  const [varieties, setVarieties] = useState<GlobalProductVariety[]>([]);
  const [globalProducts, setGlobalProducts] = useState<GlobalProduct[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("varieties");

  // Create variety dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newVariety, setNewVariety] = useState({
    globalProductId: "",
    slug: "",
    nameEn: "",
    nameAz: "",
  });
  const [saving, setSaving] = useState(false);

  // Source items for linking
  const [azProductTypes, setAzProductTypes] = useState<SourceItem[]>([]);
  const [euProducts, setEuProducts] = useState<SourceItem[]>([]);
  const [faoProducts, setFaoProducts] = useState<SourceItem[]>([]);
  const [fpmaCommodities, setFpmaCommodities] = useState<SourceItem[]>([]);

  // Link dialog
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkItem, setLinkItem] = useState<{
    source: string;
    id: string;
    name: string;
    currentVarietyId: string | null;
  } | null>(null);
  const [selectedVarietyId, setSelectedVarietyId] = useState<string>("");

  useEffect(() => {
    fetchGlobalProducts();
  }, []);

  useEffect(() => {
    fetchVarieties();
  }, [searchQuery, selectedProductId, currentPage]);

  useEffect(() => {
    if (activeTab === "az") fetchAzProductTypes();
    if (activeTab === "eu") fetchEuProducts();
    if (activeTab === "fao") fetchFaoProducts();
    if (activeTab === "fpma") fetchFpmaCommodities();
  }, [activeTab]);

  async function fetchGlobalProducts() {
    try {
      const res = await fetch("/api/admin/global-products?limit=500");
      const data = await res.json();
      if (data.success && data.data) {
        // data.data is array of products directly
        setGlobalProducts(data.data);
      } else if (data.products) {
        setGlobalProducts(data.products);
      } else if (Array.isArray(data.data)) {
        setGlobalProducts(data.data);
      }
    } catch (error) {
      console.error("Error fetching global products:", error);
    }
  }

  async function fetchVarieties() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (selectedProductId !== "all") params.set("globalProductId", selectedProductId);
      params.set("page", currentPage.toString());
      params.set("limit", "50");

      const res = await fetch(`/api/admin/global-varieties?${params}`);
      const data = await res.json();
      console.log("[DEBUG] Varieties API response:", JSON.stringify(data, null, 2));
      
      if (data.error) {
        console.error("[DEBUG] API error:", data.error);
        return;
      }
      
      if (data.success && data.data) {
        // Handle both formats: data.data.varieties or data.data directly
        const varietiesData = data.data.varieties || data.data;
        const paginationData = data.data.pagination || { page: 1, limit: 50, total: Array.isArray(varietiesData) ? varietiesData.length : 0, totalPages: 1 };
        
        console.log("[DEBUG] varietiesData:", varietiesData?.length, "items");
        
        if (Array.isArray(varietiesData)) {
          setVarieties(varietiesData);
          setPagination(paginationData);
        }
      } else {
        console.log("[DEBUG] No success or no data:", data);
      }
    } catch (error) {
      console.error("Error fetching varieties:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAzProductTypes() {
    try {
      const res = await fetch("/api/admin/az-product-types?limit=200");
      const data = await res.json();
      if (data.success) {
        setAzProductTypes(
          data.data.productTypes.map((pt: any) => ({
            id: pt.id,
            name: pt.name,
            code: pt.productId,
            varietyId: pt.globalProductVariety?.id || null,
            varietyName: pt.globalProductVariety?.nameEn || null,
            productName: pt.product?.name || pt.product?.nameEn,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching AZ product types:", error);
    }
  }

  async function fetchEuProducts() {
    try {
      const res = await fetch("/api/admin/eu-products?limit=200");
      const data = await res.json();
      // API returns { success: true, data: [...products] }
      if (data.success && Array.isArray(data.data)) {
        setEuProducts(
          data.data.map((p: any) => ({
            id: p.id,
            name: p.nameEn,
            code: p.eurostatCode || p.ecAgrifoodCode,
            varietyId: p.globalProductVarietyId || null,
            varietyName: p.globalProductVariety?.nameEn || null,
          }))
        );
      } else if (Array.isArray(data)) {
        setEuProducts(
          data.map((p: any) => ({
            id: p.id,
            name: p.nameEn,
            code: p.eurostatCode || p.ecAgrifoodCode,
            varietyId: p.globalProductVarietyId || null,
            varietyName: null,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching EU products:", error);
    }
  }

  async function fetchFaoProducts() {
    try {
      const res = await fetch("/api/admin/fao-products?limit=200");
      const data = await res.json();
      // API returns { success: true, data: [...products] }
      if (data.success && Array.isArray(data.data)) {
        setFaoProducts(
          data.data.map((p: any) => ({
            id: p.id,
            name: p.nameEn || p.itemNameEn,
            code: p.itemCode,
            varietyId: p.globalProductVarietyId || null,
            varietyName: p.globalProductVariety?.nameEn || null,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching FAO products:", error);
    }
  }

  async function fetchFpmaCommodities() {
    try {
      const res = await fetch("/api/admin/fpma-commodities?limit=200");
      const data = await res.json();
      // API returns { success: true, data: [...commodities] }
      if (data.success && Array.isArray(data.data)) {
        setFpmaCommodities(
          data.data.map((c: any) => ({
            id: c.id,
            name: c.nameEn || c.name,
            code: c.code,
            varietyId: c.globalProductVarietyId || null,
            varietyName: c.globalProductVariety?.nameEn || null,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching FPMA commodities:", error);
    }
  }

  async function handleCreateVariety() {
    if (!newVariety.globalProductId || !newVariety.slug || !newVariety.nameEn) {
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/global-varieties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newVariety),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateDialog(false);
        setNewVariety({ globalProductId: "", slug: "", nameEn: "", nameAz: "" });
        fetchVarieties();
      }
    } catch (error) {
      console.error("Error creating variety:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleLinkVariety() {
    if (!linkItem) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/link-variety", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: linkItem.source,
          sourceId: linkItem.id,
          varietyId: selectedVarietyId === "__unlink__" ? null : selectedVarietyId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowLinkDialog(false);
        setLinkItem(null);
        setSelectedVarietyId("");
        // Refresh the relevant list
        if (linkItem.source === "azProductType") fetchAzProductTypes();
        if (linkItem.source === "euProduct") fetchEuProducts();
        if (linkItem.source === "faoProduct") fetchFaoProducts();
        if (linkItem.source === "fpmaCommodity") fetchFpmaCommodities();
        fetchVarieties();
      }
    } catch (error) {
      console.error("Error linking variety:", error);
    } finally {
      setSaving(false);
    }
  }

  function openLinkDialog(source: string, item: SourceItem) {
    setLinkItem({
      source,
      id: item.id,
      name: item.name,
      currentVarietyId: item.varietyId,
    });
    setSelectedVarietyId(item.varietyId || "");
    setShowLinkDialog(true);
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }

  // Render source item table
  function renderSourceTable(items: SourceItem[], source: string, emptyMessage: string) {
    const unlinkedCount = items.filter((i) => !i.varietyId).length;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-500">
            {items.length} element, {unlinkedCount} əlaqəsiz
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad</TableHead>
              <TableHead>Kod</TableHead>
              {source === "azProductType" && <TableHead>Məhsul</TableHead>}
              <TableHead>Variety</TableHead>
              <TableHead className="text-right">Əməliyyat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={source === "azProductType" ? 5 : 4} className="text-center py-8 text-slate-500">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.code || "-"}</Badge>
                  </TableCell>
                  {source === "azProductType" && (
                    <TableCell className="text-sm text-slate-500">
                      {item.productName || "-"}
                    </TableCell>
                  )}
                  <TableCell>
                    {item.varietyName ? (
                      <Badge variant="secondary">{item.varietyName}</Badge>
                    ) : (
                      <span className="text-slate-400">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openLinkDialog(source, item)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      {item.varietyId ? "Redaktə" : "Bağla"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Global Məhsul Növləri</h1>
          <p className="text-slate-500">
            Məhsul növlərini yaradın və mənbələri əlaqələndirin
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { fetchVarieties(); fetchGlobalProducts(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenilə
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Növ
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="varieties">
            <Layers className="h-4 w-4 mr-2" />
            Növlər ({pagination?.total || 0})
          </TabsTrigger>
          <TabsTrigger value="az">
            🇦🇿 AZ ProductType ({azProductTypes.filter(i => !i.varietyId).length})
          </TabsTrigger>
          <TabsTrigger value="eu">
            🇪🇺 EU ({euProducts.filter(i => !i.varietyId).length})
          </TabsTrigger>
          <TabsTrigger value="fao">
            🌍 FAO ({faoProducts.filter(i => !i.varietyId).length})
          </TabsTrigger>
          <TabsTrigger value="fpma">
            📊 FPMA ({fpmaCommodities.filter(i => !i.varietyId).length})
          </TabsTrigger>
        </TabsList>

        {/* Varieties Tab */}
        <TabsContent value="varieties">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Global Məhsul Növləri
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Növ axtar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Məhsul seç" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Bütün məhsullar</SelectItem>
                    {globalProducts.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nameAz || p.nameEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Məhsul</TableHead>
                    <TableHead>Növ</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>AZ</TableHead>
                    <TableHead>EU</TableHead>
                    <TableHead>FAO</TableHead>
                    <TableHead>FPMA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                        Yüklənir...
                      </TableCell>
                    </TableRow>
                  ) : varieties.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                        Heç bir növ tapılmadı
                      </TableCell>
                    </TableRow>
                  ) : (
                    varieties.map((variety) => (
                      <TableRow key={variety.id}>
                        <TableCell>
                          <div className="font-medium">
                            {variety.globalProduct?.nameAz || variety.globalProduct?.nameEn}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{variety.nameAz || variety.nameEn}</div>
                          {variety.nameAz && variety.nameEn !== variety.nameAz && (
                            <div className="text-xs text-slate-400">{variety.nameEn}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{variety.slug}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={variety._count.productTypes > 0 ? "default" : "secondary"}>
                            {variety._count.productTypes}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={variety._count.euProducts > 0 ? "default" : "secondary"}>
                            {variety._count.euProducts}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={variety._count.faoProducts > 0 ? "default" : "secondary"}>
                            {variety._count.faoProducts}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={variety._count.fpmaCommodities > 0 ? "default" : "secondary"}>
                            {variety._count.fpmaCommodities}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-slate-500">
                    {pagination.total} nəticədən {(pagination.page - 1) * pagination.limit + 1}-
                    {Math.min(pagination.page * pagination.limit, pagination.total)} göstərilir
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= pagination.totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AZ Product Types Tab */}
        <TabsContent value="az">
          <Card>
            <CardHeader>
              <CardTitle>🇦🇿 AZ Product Types</CardTitle>
            </CardHeader>
            <CardContent>
              {renderSourceTable(azProductTypes, "azProductType", "AZ product type tapılmadı")}
            </CardContent>
          </Card>
        </TabsContent>

        {/* EU Products Tab */}
        <TabsContent value="eu">
          <Card>
            <CardHeader>
              <CardTitle>🇪🇺 EU Məhsulları</CardTitle>
            </CardHeader>
            <CardContent>
              {renderSourceTable(euProducts, "euProduct", "EU məhsul tapılmadı")}
            </CardContent>
          </Card>
        </TabsContent>

        {/* FAO Products Tab */}
        <TabsContent value="fao">
          <Card>
            <CardHeader>
              <CardTitle>🌍 FAO Məhsulları</CardTitle>
            </CardHeader>
            <CardContent>
              {renderSourceTable(faoProducts, "faoProduct", "FAO məhsul tapılmadı")}
            </CardContent>
          </Card>
        </TabsContent>

        {/* FPMA Commodities Tab */}
        <TabsContent value="fpma">
          <Card>
            <CardHeader>
              <CardTitle>📊 FPMA Əmtəələri</CardTitle>
            </CardHeader>
            <CardContent>
              {renderSourceTable(fpmaCommodities, "fpmaCommodity", "FPMA əmtəə tapılmadı")}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Variety Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Məhsul Növü Yarat</DialogTitle>
            <DialogDescription>
              Əvvəlcə məhsulu seçin, sonra növ məlumatlarını daxil edin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Məhsul *</Label>
              <Select
                value={newVariety.globalProductId}
                onValueChange={(v) => setNewVariety({ ...newVariety, globalProductId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Məhsul seçin" />
                </SelectTrigger>
                <SelectContent>
                  {globalProducts.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nameAz || p.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ad (EN) *</Label>
              <Input
                value={newVariety.nameEn}
                onChange={(e) => {
                  const nameEn = e.target.value;
                  setNewVariety({
                    ...newVariety,
                    nameEn,
                    slug: generateSlug(nameEn),
                  });
                }}
                placeholder="Cherry, Golden, Red..."
              />
            </div>
            <div>
              <Label>Ad (AZ)</Label>
              <Input
                value={newVariety.nameAz}
                onChange={(e) => setNewVariety({ ...newVariety, nameAz: e.target.value })}
                placeholder="Gilas, Qızıl, Qırmızı..."
              />
            </div>
            <div>
              <Label>Slug *</Label>
              <Input
                value={newVariety.slug}
                onChange={(e) => setNewVariety({ ...newVariety, slug: e.target.value })}
                placeholder="cherry, golden, red..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Ləğv et
            </Button>
            <Button onClick={handleCreateVariety} disabled={saving}>
              {saving ? "Yaradılır..." : "Yarat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Variety Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Variety Əlaqəsi</DialogTitle>
            <DialogDescription>
              "{linkItem?.name}" üçün variety seçin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Variety seçin</Label>
              <Select value={selectedVarietyId} onValueChange={setSelectedVarietyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Variety seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__unlink__">❌ Əlaqəni sil</SelectItem>
                  {varieties.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.globalProduct?.nameAz || v.globalProduct?.nameEn} → {v.nameAz || v.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {linkItem?.currentVarietyId && (
              <div className="text-sm text-slate-500">
                Hazırda bağlıdır: {varieties.find((v) => v.id === linkItem.currentVarietyId)?.nameEn || "N/A"}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
              Ləğv et
            </Button>
            <Button onClick={handleLinkVariety} disabled={saving}>
              {saving ? "Saxlanılır..." : "Saxla"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

