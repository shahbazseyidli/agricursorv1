"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  TrendingUp,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Calendar,
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

interface PriceStats {
  total: number;
  dateRange: {
    from: string | null;
    to: string | null;
  };
  marketCount: number;
}

interface UploadResult {
  success: boolean;
  message: string;
  data?: {
    inserted: number;
    updated: number;
    skipped: number;
    errors: number;
  };
}

export default function PricesManagementPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [marketTypes, setMarketTypes] = useState<MarketType[]>([]);
  const [priceStats, setPriceStats] = useState<PriceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedMarketType, setSelectedMarketType] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      fetchMarketTypes();
      fetchPriceStats();
    }
  }, [selectedCountry]);

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

  async function fetchMarketTypes() {
    try {
      const res = await fetch(
        `/api/admin/market-types?countryId=${selectedCountry}`
      );
      const data = await res.json();
      if (data.success) {
        setMarketTypes(data.data);
      }
    } catch (err) {
      console.error("Error fetching market types:", err);
    }
  }

  async function fetchPriceStats() {
    try {
      const res = await fetch(
        `/api/admin/prices?countryId=${selectedCountry}`
      );
      const data = await res.json();
      if (data.success) {
        setPriceStats(data.data);
      }
    } catch (err) {
      console.error("Error fetching price stats:", err);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedMarketType) return;

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("marketTypeId", selectedMarketType);

      const res = await fetch("/api/admin/upload/prices", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setUploadResult(data);
      if (data.success) {
        fetchPriceStats();
      }
    } catch (err) {
      setUploadResult({
        success: false,
        message: "Yükləmə zamanı xəta baş verdi",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleClearPrices(marketTypeId?: string) {
    try {
      const params = new URLSearchParams();
      params.append("countryId", selectedCountry);
      if (marketTypeId) {
        params.append("marketTypeId", marketTypeId);
      }

      const res = await fetch(`/api/admin/prices?${params.toString()}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        fetchPriceStats();
        setUploadResult({
          success: true,
          message: data.message,
        });
      }
    } catch (err) {
      console.error("Error clearing prices:", err);
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("az-AZ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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
          <h1 className="text-2xl font-bold text-slate-900">Qiymətlər</h1>
          <p className="text-slate-500 mt-1">
            Qiymət məlumatlarını yükləyin və idarə edin
          </p>
        </div>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Bütün qiymətləri sil
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Əminsiniz?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Bu əməliyyat bütün qiymət məlumatlarını siləcək. Bu əməliyyat
                  geri alına bilməz.
                  <br />
                  <strong className="text-red-600">
                    {priceStats?.total.toLocaleString() || 0} qiymət silinəcək
                  </strong>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Ləğv et</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleClearPrices()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Bəli, hamısını sil
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
            <div className="flex items-end">
              <Button variant="outline" size="sm" onClick={fetchPriceStats}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Yenilə
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Ümumi qiymət</p>
                <p className="text-3xl font-bold text-slate-900">
                  {priceStats?.total.toLocaleString() || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Tarix aralığı</p>
                <p className="text-lg font-medium text-slate-900">
                  {priceStats?.dateRange.from
                    ? `${formatDate(priceStats.dateRange.from)} - ${formatDate(
                        priceStats.dateRange.to
                      )}`
                    : "-"}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Aktiv bazarlar</p>
                <p className="text-3xl font-bold text-slate-900">
                  {priceStats?.marketCount || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Result */}
      {uploadResult && (
        <Card
          className={
            uploadResult.success
              ? "border-emerald-200 bg-emerald-50"
              : "border-red-200 bg-red-50"
          }
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {uploadResult.success ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div>
                <p
                  className={`font-medium ${
                    uploadResult.success ? "text-emerald-800" : "text-red-800"
                  }`}
                >
                  {uploadResult.message}
                </p>
                {uploadResult.data && (
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="text-emerald-600">
                      Əlavə: {uploadResult.data.inserted}
                    </span>
                    <span className="text-blue-600">
                      Yeniləndi: {uploadResult.data.updated}
                    </span>
                    <span className="text-slate-600">
                      Keçildi: {uploadResult.data.skipped}
                    </span>
                    {uploadResult.data.errors > 0 && (
                      <span className="text-red-600">
                        Xəta: {uploadResult.data.errors}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload by Market Type */}
      <Card>
        <CardHeader>
          <CardTitle>Qiymət Yükləmə</CardTitle>
          <CardDescription>
            Hər bazar tipi üçün ayrıca Excel faylı yükləyin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {marketTypes.map((mt) => (
              <Card key={mt.id} className="border-slate-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-slate-900">{mt.nameAz}</h3>
                      <p className="text-sm text-slate-500">
                        upload_{mt.code.toLowerCase()}.xlsx
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <input
                        ref={selectedMarketType === mt.id ? fileInputRef : null}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        className="hidden"
                        id={`upload-${mt.id}`}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedMarketType(mt.id);
                          document.getElementById(`upload-${mt.id}`)?.click();
                        }}
                        disabled={uploading}
                      >
                        {uploading && selectedMarketType === mt.id ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        Yüklə
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {mt.nameAz} qiymətlərini sil?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Bu bazar tipinə aid bütün qiymətlər silinəcək.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Ləğv et</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleClearPrices(mt.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Sil
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Excel Format Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Excel Format</CardTitle>
          <CardDescription>
            Qiymət faylları aşağıdakı sütunları ehtiva etməlidir
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-3 font-medium text-slate-600">
                    Sütun
                  </th>
                  <th className="text-left p-3 font-medium text-slate-600">
                    Tip
                  </th>
                  <th className="text-left p-3 font-medium text-slate-600">
                    Məcburi
                  </th>
                  <th className="text-left p-3 font-medium text-slate-600">
                    Nümunə
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3 font-mono text-slate-900">product_name</td>
                  <td className="p-3 text-slate-600">string</td>
                  <td className="p-3">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </td>
                  <td className="p-3 text-slate-500">Alma</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-mono text-slate-900">product_type</td>
                  <td className="p-3 text-slate-600">string</td>
                  <td className="p-3 text-slate-400">-</td>
                  <td className="p-3 text-slate-500">Qandı sinab</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-mono text-slate-900">date</td>
                  <td className="p-3 text-slate-600">date</td>
                  <td className="p-3">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </td>
                  <td className="p-3 text-slate-500">04.09.2020</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-mono text-slate-900">market</td>
                  <td className="p-3 text-slate-600">string</td>
                  <td className="p-3">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </td>
                  <td className="p-3 text-slate-500">Oğuz</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-mono text-slate-900">price_min</td>
                  <td className="p-3 text-slate-600">decimal</td>
                  <td className="p-3">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </td>
                  <td className="p-3 text-slate-500">1.3</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-mono text-slate-900">price_avg</td>
                  <td className="p-3 text-slate-600">decimal</td>
                  <td className="p-3">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </td>
                  <td className="p-3 text-slate-500">1.53</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-mono text-slate-900">price_max</td>
                  <td className="p-3 text-slate-600">decimal</td>
                  <td className="p-3">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </td>
                  <td className="p-3 text-slate-500">1.8</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-mono text-slate-900">unit</td>
                  <td className="p-3 text-slate-600">string</td>
                  <td className="p-3">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </td>
                  <td className="p-3 text-slate-500">kg</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-mono text-slate-900">currency</td>
                  <td className="p-3 text-slate-600">string</td>
                  <td className="p-3">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </td>
                  <td className="p-3 text-slate-500">AZN</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-slate-900">source</td>
                  <td className="p-3 text-slate-600">string</td>
                  <td className="p-3">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </td>
                  <td className="p-3 text-slate-500">agro.gov.az</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}




