"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, RefreshCw, Check, X, Edit, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface LocalProduct {
  id: string;
  name: string;
  nameEn: string | null;
  category?: { name: string };
}

interface EuProduct {
  id: string;
  nameEn: string;
  nameAz: string | null;
  eurostatCode: string | null;
  ecAgrifoodCode: string | null;
  category: string | null;
  unit: string;
  localProduct: LocalProduct | null;
  matchScore: number | null;
  isManualMatch: boolean;
  priceCount: number;
}

interface Category {
  name: string;
  count: number;
}

interface Stats {
  total: number;
  matched: number;
  unmatched: number;
  manualMatches: number;
}

export default function EuProductsPage() {
  const [products, setProducts] = useState<EuProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [localProducts, setLocalProducts] = useState<LocalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "matched" | "unmatched">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [editingProduct, setEditingProduct] = useState<EuProduct | null>(null);
  const [selectedLocalProductId, setSelectedLocalProductId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [runningMatch, setRunningMatch] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchLocalProducts();
  }, [filter, categoryFilter]);

  async function fetchProducts() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("filter", filter);
      if (categoryFilter) params.set("category", categoryFilter);
      
      const res = await fetch(`/api/admin/eu/products?${params}`);
      const data = await res.json();
      
      setProducts(data.data || []);
      setCategories(data.categories || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchLocalProducts() {
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      setLocalProducts(data.data || []);
    } catch (error) {
      console.error("Error fetching local products:", error);
    }
  }

  async function runMatching() {
    setRunningMatch(true);
    try {
      const res = await fetch("/api/admin/eu/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "runMatch" })
      });
      const data = await res.json();
      alert(data.message);
      fetchProducts();
    } catch (error) {
      console.error("Error running match:", error);
      alert("Xəta baş verdi");
    } finally {
      setRunningMatch(false);
    }
  }

  async function saveMapping() {
    if (!editingProduct) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/eu/products/${editingProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          localProductId: selectedLocalProductId || null 
        })
      });
      const data = await res.json();
      
      if (data.success) {
        fetchProducts();
        setEditingProduct(null);
      } else {
        alert(data.error || "Xəta baş verdi");
      }
    } catch (error) {
      console.error("Error saving mapping:", error);
      alert("Xəta baş verdi");
    } finally {
      setSaving(false);
    }
  }

  const filteredProducts = products.filter(p => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      p.nameEn.toLowerCase().includes(searchLower) ||
      (p.eurostatCode?.toLowerCase().includes(searchLower)) ||
      (p.ecAgrifoodCode?.toLowerCase().includes(searchLower)) ||
      (p.localProduct?.name.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">EU Məhsulları</h1>
            <p className="text-slate-500">EC Agrifood və Eurostat məhsullarını AZ məhsullarına uyğunlaşdırın</p>
          </div>
        </div>
        <Button onClick={runMatching} disabled={runningMatch}>
          <RefreshCw className={`w-4 h-4 mr-2 ${runningMatch ? "animate-spin" : ""}`} />
          Avtomatik Uyğunlaşdır
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-sm text-slate-500">Cəmi</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-emerald-700">{stats.matched}</p>
              <p className="text-sm text-emerald-600">Uyğunlaşdırılmış</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-700">{stats.unmatched}</p>
              <p className="text-sm text-amber-600">Uyğunsuz</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-700">{stats.manualMatches}</p>
              <p className="text-sm text-blue-600">Manual</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Axtar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filter} onValueChange={(v: "all" | "matched" | "unmatched") => setFilter(v)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Hamısı</SelectItem>
                <SelectItem value="matched">Uyğunlaşdırılmış</SelectItem>
                <SelectItem value="unmatched">Uyğunsuz</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Kateqoriya" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Hamısı</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.name} value={c.name}>
                    {c.name} ({c.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>EU Məhsul</TableHead>
                <TableHead>Eurostat Kod</TableHead>
                <TableHead>Kateqoriya</TableHead>
                <TableHead>AZ Məhsul</TableHead>
                <TableHead>Uyğunluq</TableHead>
                <TableHead>Qiymətlər</TableHead>
                <TableHead className="text-right">Əməliyyat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    Yüklənir...
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    Məhsul tapılmadı
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.nameEn}</p>
                        {product.ecAgrifoodCode && product.ecAgrifoodCode !== product.nameEn && (
                          <p className="text-xs text-slate-400">{product.ecAgrifoodCode}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.eurostatCode ? (
                        <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                          {product.eurostatCode}
                        </code>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.category || "?"}</Badge>
                    </TableCell>
                    <TableCell>
                      {product.localProduct ? (
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-500" />
                          <span>{product.localProduct.name}</span>
                          {product.isManualMatch && (
                            <Badge variant="secondary" className="text-xs">Manual</Badge>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-400">
                          <X className="w-4 h-4" />
                          <span>Uyğunsuz</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.matchScore ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${product.matchScore > 80 ? "bg-emerald-500" : product.matchScore > 50 ? "bg-amber-500" : "bg-red-500"}`}
                              style={{ width: `${product.matchScore}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500">{product.matchScore}%</span>
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-500">{product.priceCount.toLocaleString()}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingProduct(product);
                          setSelectedLocalProductId(product.localProduct?.id || "");
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Məhsul Uyğunlaşdırması</DialogTitle>
            <DialogDescription>
              {editingProduct?.nameEn} məhsulunu AZ məhsuluna bağlayın
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm text-slate-500 mb-2">EU Məhsul</p>
              <p className="font-medium">{editingProduct?.nameEn}</p>
              {editingProduct?.eurostatCode && (
                <code className="text-xs bg-slate-100 px-2 py-1 rounded mt-1 inline-block">
                  {editingProduct.eurostatCode}
                </code>
              )}
            </div>
            
            <div>
              <p className="text-sm text-slate-500 mb-2">AZ Məhsul</p>
              <Select value={selectedLocalProductId} onValueChange={setSelectedLocalProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Məhsul seçin..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Uyğunlaşdırma yoxdur</SelectItem>
                  {localProducts.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} {p.nameEn ? `(${p.nameEn})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEditingProduct(null)}>
              Ləğv et
            </Button>
            <Button onClick={saveMapping} disabled={saving}>
              {saving ? "Saxlanılır..." : "Saxla"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}







