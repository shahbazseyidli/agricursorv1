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
  Globe,
  Search,
  Edit,
  Save,
  X,
  RefreshCw,
  Link2,
  Plus,
  MapPin,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface GlobalCountry {
  id: string;
  iso2: string;
  iso3: string;
  nameEn: string;
  nameAz: string | null;
  region: string;
  subRegion: string | null;
  flagEmoji: string | null;
  isActive: boolean;
  isFeatured: boolean;
  _count?: {
    azCountries: number;
    euCountries: number;
    faoCountries: number;
    fpmaCountries: number;
    globalMarkets: number;
  };
}

interface SourceCountry {
  id: string;
  name: string;
  nameEn: string;
  code: string;
  globalCountryId: string | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function GlobalCountriesPage() {
  const [countries, setCountries] = useState<GlobalCountry[]>([]);
  const [allGlobalCountries, setAllGlobalCountries] = useState<GlobalCountry[]>([]); // For mapping sections
  const [regions, setRegions] = useState<string[]>([]);
  const [azCountries, setAzCountries] = useState<SourceCountry[]>([]);
  const [euCountries, setEuCountries] = useState<SourceCountry[]>([]);
  const [fpmaCountries, setFpmaCountries] = useState<SourceCountry[]>([]);
  const [faoCountries, setFaoCountries] = useState<SourceCountry[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("countries");
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCountry, setNewCountry] = useState({
    iso2: "",
    iso3: "",
    nameEn: "",
    nameAz: "",
    region: "",
    flagEmoji: "",
  });

  // Edit dialog state
  const [editingItem, setEditingItem] = useState<SourceCountry | null>(null);
  const [editingType, setEditingType] = useState<"az" | "eu" | "fpma" | "fao" | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedGlobalCountryId, setSelectedGlobalCountryId] = useState<string>("");

  useEffect(() => {
    fetchAllGlobalCountries(); // Fetch all for mapping sections
    fetchAzCountries();
    fetchEuCountries();
    fetchFpmaCountries();
    fetchFaoCountries();
  }, []);

  useEffect(() => {
    fetchCountries();
  }, [searchQuery, selectedRegion, currentPage]);

  // Fetch ALL global countries (without pagination) for mapping sections
  async function fetchAllGlobalCountries() {
    try {
      const res = await fetch("/api/admin/global-countries?limit=1000");
      const data = await res.json();
      if (data.success) {
        setAllGlobalCountries(data.data);
        setRegions(data.regions || []);
      }
    } catch (error) {
      console.error("Error fetching all global countries:", error);
    }
  }

  async function fetchCountries() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (selectedRegion !== "all") params.set("region", selectedRegion);
      params.set("page", currentPage.toString());
      params.set("limit", "50");

      const res = await fetch(`/api/admin/global-countries?${params}`);
      const data = await res.json();
      
      if (data.success) {
        setCountries(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching countries:", error);
      setError("Ölkələri yükləmək mümkün olmadı");
    } finally {
      setLoading(false);
    }
  }

  async function fetchAzCountries() {
    try {
      const res = await fetch("/api/admin/az-countries");
      const data = await res.json();
      if (data.success) setAzCountries(data.data);
    } catch (error) {
      console.error("Error fetching AZ countries:", error);
    }
  }

  async function fetchEuCountries() {
    try {
      const res = await fetch("/api/admin/eu-countries");
      const data = await res.json();
      if (data.success) setEuCountries(data.data);
    } catch (error) {
      console.error("Error fetching EU countries:", error);
    }
  }

  async function fetchFpmaCountries() {
    try {
      const res = await fetch("/api/admin/fpma-countries");
      const data = await res.json();
      if (data.success) setFpmaCountries(data.data);
    } catch (error) {
      console.error("Error fetching FPMA countries:", error);
    }
  }

  async function fetchFaoCountries() {
    try {
      const res = await fetch("/api/admin/fao-countries");
      const data = await res.json();
      if (data.success) setFaoCountries(data.data);
    } catch (error) {
      console.error("Error fetching FAO countries:", error);
    }
  }

  async function handleSaveLink() {
    if (!editingItem || !editingType) return;
    
    setSaving(true);
    try {
      const res = await fetch("/api/admin/link-country", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: editingItem.id,
          globalCountryId: selectedGlobalCountryId || null,
          type: editingType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Əlaqə uğurla yeniləndi");
        setShowEditDialog(false);
        setEditingItem(null);
        // Refresh the appropriate list
        if (editingType === "az") fetchAzCountries();
        else if (editingType === "eu") fetchEuCountries();
        else if (editingType === "fpma") fetchFpmaCountries();
        else if (editingType === "fao") fetchFaoCountries();
        fetchCountries();
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

  function openEditDialog(item: SourceCountry, type: "az" | "eu" | "fpma" | "fao") {
    setEditingItem(item);
    setEditingType(type);
    setSelectedGlobalCountryId(item.globalCountryId || "");
    setShowEditDialog(true);
  }

  async function handleCreate() {
    if (!newCountry.iso2 || !newCountry.iso3 || !newCountry.nameEn || !newCountry.region) {
      setError("ISO2, ISO3, Ad (EN) və Region mütləqdir");
      return;
    }
    
    setSaving(true);
    setError("");
    
    try {
      const res = await fetch("/api/admin/global-countries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCountry),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess(`"${newCountry.nameEn}" uğurla yaradıldı`);
        setShowCreateDialog(false);
        setNewCountry({ iso2: "", iso3: "", nameEn: "", nameAz: "", region: "", flagEmoji: "" });
        fetchCountries();
        fetchAllGlobalCountries();
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

  const unlinkedAzCountries = azCountries.filter(c => !c.globalCountryId);
  const unlinkedEuCountries = euCountries.filter(c => !c.globalCountryId);
  const unlinkedFpmaCountries = fpmaCountries.filter(c => !c.globalCountryId);
  const unlinkedFaoCountries = faoCountries.filter(c => !c.globalCountryId);

  // Get global country by ID for display
  const getGlobalCountry = (id: string | null) => {
    if (!id) return null;
    return allGlobalCountries.find(gc => gc.id === id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Global Ölkələr</h1>
          <p className="text-slate-500 mt-1">
            Bütün data source-lar üzrə ölkələri idarə və əlaqələndir
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateDialog(true)} className="bg-cyan-600 hover:bg-cyan-700">
            <Plus className="w-4 h-4 mr-2" />
            Yeni Ölkə
          </Button>
          <Button onClick={() => { fetchCountries(); fetchAllGlobalCountries(); }} variant="outline" disabled={loading}>
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100/50">
          <CardContent className="p-4">
            <p className="text-xs text-cyan-600 font-medium">Global Ölkələr</p>
            <p className="text-2xl font-bold text-cyan-900">{allGlobalCountries.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50">
          <CardContent className="p-4">
            <p className="text-xs text-emerald-600 font-medium">AZ Əlaqəsiz</p>
            <p className="text-2xl font-bold text-emerald-900">{unlinkedAzCountries.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardContent className="p-4">
            <p className="text-xs text-blue-600 font-medium">EU Əlaqəsiz</p>
            <p className="text-2xl font-bold text-blue-900">{unlinkedEuCountries.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50">
          <CardContent className="p-4">
            <p className="text-xs text-orange-600 font-medium">FPMA Əlaqəsiz</p>
            <p className="text-2xl font-bold text-orange-900">{unlinkedFpmaCountries.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-teal-50 to-teal-100/50">
          <CardContent className="p-4">
            <p className="text-xs text-teal-600 font-medium">FAO Əlaqəsiz</p>
            <p className="text-2xl font-bold text-teal-900">{unlinkedFaoCountries.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Yeni Global Ölkə Yarat</DialogTitle>
            <DialogDescription>
              Yeni ölkə yaradın və sonradan AZ/EU/FPMA/FAO ölkələrini buna bağlayın.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">ISO2 *</Label>
              <Input
                className="col-span-3"
                value={newCountry.iso2}
                onChange={(e) => setNewCountry({ ...newCountry, iso2: e.target.value.toUpperCase().slice(0, 2) })}
                placeholder="AZ, US, DE"
                maxLength={2}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">ISO3 *</Label>
              <Input
                className="col-span-3"
                value={newCountry.iso3}
                onChange={(e) => setNewCountry({ ...newCountry, iso3: e.target.value.toUpperCase().slice(0, 3) })}
                placeholder="AZE, USA, DEU"
                maxLength={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Ad (EN) *</Label>
              <Input
                className="col-span-3"
                value={newCountry.nameEn}
                onChange={(e) => setNewCountry({ ...newCountry, nameEn: e.target.value })}
                placeholder="Azerbaijan"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Ad (AZ)</Label>
              <Input
                className="col-span-3"
                value={newCountry.nameAz}
                onChange={(e) => setNewCountry({ ...newCountry, nameAz: e.target.value })}
                placeholder="Azərbaycan"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Region *</Label>
              <Select value={newCountry.region} onValueChange={(v) => setNewCountry({ ...newCountry, region: v })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Region seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia">Asia</SelectItem>
                  <SelectItem value="Europe">Europe</SelectItem>
                  <SelectItem value="Africa">Africa</SelectItem>
                  <SelectItem value="Americas">Americas</SelectItem>
                  <SelectItem value="Oceania">Oceania</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Bayraq Emoji</Label>
              <Input
                className="col-span-3"
                value={newCountry.flagEmoji}
                onChange={(e) => setNewCountry({ ...newCountry, flagEmoji: e.target.value })}
                placeholder="🇦🇿"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              <X className="w-4 h-4 mr-1" /> Ləğv et
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              <Plus className="w-4 h-4 mr-1" /> {saving ? "Yaradılır..." : "Yarat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Link Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ölkə Əlaqəsini Redaktə Et</DialogTitle>
            <DialogDescription>
              {editingItem?.name} ({editingType?.toUpperCase()}) - Global ölkəyə bağlayın və ya əlaqəni silin.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <Label>Mənbə Ölkə</Label>
                <div className="mt-1 p-3 bg-slate-100 rounded-lg">
                  <p className="font-medium">{editingItem?.name}</p>
                  <p className="text-sm text-slate-500">Kod: {editingItem?.code}</p>
                </div>
              </div>
              
              <div>
                <Label>Global Ölkəyə Bağla</Label>
                <Select value={selectedGlobalCountryId} onValueChange={setSelectedGlobalCountryId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Global ölkə seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">❌ Əlaqəni sil</SelectItem>
                    {allGlobalCountries.map((gc) => (
                      <SelectItem key={gc.id} value={gc.id}>
                        {gc.flagEmoji} {gc.nameAz || gc.nameEn} ({gc.iso2})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              <X className="w-4 h-4 mr-1" /> Ləğv et
            </Button>
            <Button onClick={handleSaveLink} disabled={saving}>
              <Save className="w-4 h-4 mr-1" /> {saving ? "Saxlanılır..." : "Saxla"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="countries">
            <Globe className="w-4 h-4 mr-2" />
            Ölkələr
          </TabsTrigger>
          <TabsTrigger value="az-mapping">
            🇦🇿 AZ ({unlinkedAzCountries.length})
          </TabsTrigger>
          <TabsTrigger value="eu-mapping">
            🇪🇺 EU ({unlinkedEuCountries.length})
          </TabsTrigger>
          <TabsTrigger value="fpma-mapping">
            📊 FPMA ({unlinkedFpmaCountries.length})
          </TabsTrigger>
          <TabsTrigger value="fao-mapping">
            🌍 FAO ({unlinkedFaoCountries.length})
          </TabsTrigger>
        </TabsList>

        {/* Countries Tab */}
        <TabsContent value="countries" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Ölkə axtar..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedRegion} onValueChange={(v) => { setSelectedRegion(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Bütün regionlar</SelectItem>
                    {regions.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Ölkələr ({pagination?.total || countries.length})
                </div>
                {pagination && pagination.pages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm">{currentPage} / {pagination.pages}</span>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(pagination.pages, p + 1))} disabled={currentPage === pagination.pages}>
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
              ) : countries.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Globe className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>Ölkə tapılmadı</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Ölkə</TableHead>
                      <TableHead>ISO</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Əlaqələr</TableHead>
                      <TableHead>Bazarlar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {countries.map((country) => (
                      <TableRow key={country.id}>
                        <TableCell className="text-2xl">{country.flagEmoji || "🏳️"}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{country.nameAz || country.nameEn}</div>
                            {country.nameAz && <div className="text-xs text-slate-500">{country.nameEn}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-slate-100 px-2 py-1 rounded">{country.iso2}</code>
                          <code className="text-xs bg-slate-100 px-2 py-1 rounded ml-1">{country.iso3}</code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{country.region}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {country._count?.azCountries ? (
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 text-xs">🇦🇿 {country._count.azCountries}</Badge>
                            ) : null}
                            {country._count?.euCountries ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">🇪🇺 {country._count.euCountries}</Badge>
                            ) : null}
                            {country._count?.fpmaCountries ? (
                              <Badge variant="outline" className="bg-orange-50 text-orange-700 text-xs">📊 {country._count.fpmaCountries}</Badge>
                            ) : null}
                            {country._count?.faoCountries ? (
                              <Badge variant="outline" className="bg-teal-50 text-teal-700 text-xs">🌍 {country._count.faoCountries}</Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          {country._count?.globalMarkets ? (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700">
                              <MapPin className="w-3 h-3 mr-1" />
                              {country._count.globalMarkets}
                            </Badge>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mapping Tabs with Edit functionality */}
        <TabsContent value="az-mapping" className="space-y-4">
          <CountryMappingSection
            title="🇦🇿 Azərbaycan Ölkələri"
            description="AZ ölkələrini Global ölkələrə bağlayın."
            items={azCountries}
            allGlobalCountries={allGlobalCountries}
            getGlobalCountry={getGlobalCountry}
            onEdit={(item) => openEditDialog(item, "az")}
          />
        </TabsContent>

        <TabsContent value="eu-mapping" className="space-y-4">
          <CountryMappingSection
            title="🇪🇺 EU Ölkələri"
            description="Eurostat ölkələrini Global ölkələrə bağlayın."
            items={euCountries}
            allGlobalCountries={allGlobalCountries}
            getGlobalCountry={getGlobalCountry}
            onEdit={(item) => openEditDialog(item, "eu")}
          />
        </TabsContent>

        <TabsContent value="fpma-mapping" className="space-y-4">
          <CountryMappingSection
            title="📊 FPMA Ölkələri"
            description="FAO FPMA ölkələrini Global ölkələrə bağlayın."
            items={fpmaCountries}
            allGlobalCountries={allGlobalCountries}
            getGlobalCountry={getGlobalCountry}
            onEdit={(item) => openEditDialog(item, "fpma")}
          />
        </TabsContent>

        <TabsContent value="fao-mapping" className="space-y-4">
          <CountryMappingSection
            title="🌍 FAO Ölkələri"
            description="FAOSTAT ölkələrini Global ölkələrə bağlayın."
            items={faoCountries}
            allGlobalCountries={allGlobalCountries}
            getGlobalCountry={getGlobalCountry}
            onEdit={(item) => openEditDialog(item, "fao")}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Country Mapping Section Component with Edit functionality
interface CountryMappingSectionProps {
  title: string;
  description: string;
  items: SourceCountry[];
  allGlobalCountries: GlobalCountry[];
  getGlobalCountry: (id: string | null) => GlobalCountry | null | undefined;
  onEdit: (item: SourceCountry) => void;
}

function CountryMappingSection({ title, description, items, allGlobalCountries, getGlobalCountry, onEdit }: CountryMappingSectionProps) {
  const unlinkedItems = items.filter(c => !c.globalCountryId);
  const linkedItems = items.filter(c => c.globalCountryId);

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
              <p>Bütün ölkələr bağlanıb!</p>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-orange-600 mb-3">Əlaqəsiz Ölkələr ({unlinkedItems.length})</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ölkə</TableHead>
                    <TableHead>Kod</TableHead>
                    <TableHead>Global Ölkə</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unlinkedItems.slice(0, 30).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-slate-100 px-2 py-1 rounded">{item.code}</code>
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
              {unlinkedItems.length > 30 && (
                <p className="text-sm text-slate-500 mt-2">+ {unlinkedItems.length - 30} daha çox</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Linked Items */}
      {linkedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bağlanmış Ölkələr ({linkedItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ölkə</TableHead>
                  <TableHead>Kod</TableHead>
                  <TableHead>Global Ölkə</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linkedItems.slice(0, 50).map((item) => {
                  const gc = getGlobalCountry(item.globalCountryId);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-slate-100 px-2 py-1 rounded">{item.code}</code>
                      </TableCell>
                      <TableCell>
                        {gc ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                            {gc.flagEmoji} {gc.nameAz || gc.nameEn}
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
