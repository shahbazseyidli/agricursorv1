"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  MapPin,
  Plus,
  Trash2,
  Edit,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

interface Country {
  id: string;
  iso2: string;
  name: string;
}

interface MarketType {
  id: string;
  code: string;
  nameAz: string;
}

interface Market {
  id: string;
  name: string;
  nameEn: string | null;
  nameRu: string | null;
  aliases: string | null;
  country: Country;
  marketType: MarketType;
  _count: { prices: number };
}

export default function MarketsManagementPage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [marketTypes, setMarketTypes] = useState<MarketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedMarketType, setSelectedMarketType] = useState<string>("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingMarket, setEditingMarket] = useState<Market | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    nameEn: "",
    nameRu: "",
    aliases: "",
    countryId: "",
    marketTypeId: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Fetch data
  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      fetchMarketTypes(selectedCountry);
      fetchMarkets();
    }
  }, [selectedCountry, selectedMarketType]);

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

  async function fetchMarketTypes(countryId: string) {
    try {
      const res = await fetch(`/api/admin/market-types?countryId=${countryId}`);
      const data = await res.json();
      if (data.success) {
        setMarketTypes(data.data);
      }
    } catch (err) {
      console.error("Error fetching market types:", err);
    }
  }

  async function fetchMarkets() {
    try {
      let url = "/api/admin/markets";
      const params = new URLSearchParams();
      if (selectedCountry) params.append("countryId", selectedCountry);
      if (selectedMarketType) params.append("marketTypeId", selectedMarketType);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setMarkets(data.data);
      }
    } catch (err) {
      console.error("Error fetching markets:", err);
    }
  }

  function openCreateForm() {
    setEditingMarket(null);
    setFormData({
      name: "",
      nameEn: "",
      nameRu: "",
      aliases: "",
      countryId: selectedCountry,
      marketTypeId: "",
    });
    setShowForm(true);
    setError("");
  }

  function openEditForm(market: Market) {
    setEditingMarket(market);
    setFormData({
      name: market.name,
      nameEn: market.nameEn || "",
      nameRu: market.nameRu || "",
      aliases: market.aliases || "",
      countryId: market.country.id,
      marketTypeId: market.marketType.id,
    });
    setShowForm(true);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const url = editingMarket
        ? `/api/admin/markets/${editingMarket.id}`
        : "/api/admin/markets";
      const method = editingMarket ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        fetchMarkets();
      } else {
        setError(data.message || "Xəta baş verdi");
      }
    } catch (err) {
      setError("Xəta baş verdi");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(marketId: string) {
    try {
      const res = await fetch(`/api/admin/markets/${marketId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchMarkets();
      }
    } catch (err) {
      console.error("Error deleting market:", err);
    }
  }

  async function handleClearAll() {
    try {
      const params = new URLSearchParams();
      if (selectedCountry) params.append("countryId", selectedCountry);

      const res = await fetch(`/api/admin/markets?${params.toString()}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchMarkets();
      }
    } catch (err) {
      console.error("Error clearing markets:", err);
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
          <h1 className="text-2xl font-bold text-slate-900">Bazarlar</h1>
          <p className="text-slate-500 mt-1">
            Bazarları idarə edin, əlavə edin və ya silin
          </p>
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
                  Bu əməliyyat bütün bazarları və onlara bağlı qiymətləri
                  siləcək. Bu əməliyyat geri alına bilməz.
                  <br />
                  <strong className="text-red-600">
                    {markets.length} bazar silinəcək
                  </strong>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Ləğv et</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearAll}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Bəli, hamısını sil
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={openCreateForm}>
            <Plus className="w-4 h-4 mr-2" />
            Yeni bazar
          </Button>
        </div>
      </div>

      {/* Filters */}
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
            <div className="w-48">
              <Label className="text-sm text-slate-600">Bazar tipi</Label>
              <Select
                value={selectedMarketType || "all"}
                onValueChange={(v) => setSelectedMarketType(v === "all" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Hamısı" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Hamısı</SelectItem>
                  {marketTypes.map((mt) => (
                    <SelectItem key={mt.id} value={mt.id}>
                      {mt.nameAz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" size="sm" onClick={fetchMarkets}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Yenilə
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Modal */}
      {showForm && (
        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardHeader>
            <CardTitle>
              {editingMarket ? "Bazarı redaktə et" : "Yeni bazar"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ad (AZ) *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Bazar tipi *</Label>
                  <Select
                    value={formData.marketTypeId}
                    onValueChange={(v) =>
                      setFormData({ ...formData, marketTypeId: v })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {marketTypes.map((mt) => (
                        <SelectItem key={mt.id} value={mt.id}>
                          {mt.nameAz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Ad (EN)</Label>
                  <Input
                    value={formData.nameEn}
                    onChange={(e) =>
                      setFormData({ ...formData, nameEn: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Ad (RU)</Label>
                  <Input
                    value={formData.nameRu}
                    onChange={(e) =>
                      setFormData({ ...formData, nameRu: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-2">
                  <Label>Aliaslar (vergüllə ayrılmış)</Label>
                  <Input
                    value={formData.aliases}
                    onChange={(e) =>
                      setFormData({ ...formData, aliases: e.target.value })
                    }
                    placeholder="alias1, alias2, alias3"
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
                  onClick={() => setShowForm(false)}
                >
                  Ləğv et
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Markets Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-slate-600">
                    Ad
                  </th>
                  <th className="text-left p-4 font-medium text-slate-600">
                    Tip
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
                {markets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-500">
                      <MapPin className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p>Bazar tapılmadı</p>
                    </td>
                  </tr>
                ) : (
                  markets.map((market) => (
                    <tr key={market.id} className="border-b hover:bg-slate-50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-slate-900">
                            {market.name}
                          </p>
                          {market.nameEn && (
                            <p className="text-sm text-slate-500">
                              {market.nameEn}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                          {market.marketType.nameAz}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 text-sm">
                        {market.aliases || "-"}
                      </td>
                      <td className="p-4">
                        <span className="text-slate-600">
                          {market._count.prices.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditForm(market)}
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
                                  Bazarı sil?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  "{market.name}" bazarı və ona bağlı{" "}
                                  {market._count.prices} qiymət silinəcək.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Ləğv et</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(market.id)}
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

