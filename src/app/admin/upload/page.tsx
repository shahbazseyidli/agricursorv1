"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Loader2,
  Download,
  AlertCircle,
} from "lucide-react";

type UploadType = "prices" | "products" | "markets";

interface UploadResult {
  success: boolean;
  message: string;
  recordsTotal?: number;
  recordsNew?: number;
  recordsUpdated?: number;
  recordsSkipped?: number;
  errors?: string[];
}

export default function UploadPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<UploadType>("prices");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (
        droppedFile.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        droppedFile.name.endsWith(".xlsx")
      ) {
        setFile(droppedFile);
        setResult(null);
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", activeTab);

      const response = await fetch(`/api/admin/upload/${activeTab}`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        setFile(null);
        router.refresh();
      }
    } catch (error) {
      setResult({
        success: false,
        message: "Yükləmə zamanı xəta baş verdi",
      });
    } finally {
      setUploading(false);
    }
  };

  const uploadConfigs = {
    prices: {
      title: "Qiymət məlumatları",
      description: "agro.gov.az formatında qiymət Excel faylı yükləyin",
      columns: [
        "product_name",
        "product_type",
        "date",
        "market",
        "price_min",
        "price_avg",
        "price_max",
        "unit",
        "currency",
        "source",
      ],
    },
    products: {
      title: "Məhsul kataloqu",
      description: "Məhsul siyahısı Excel faylı yükləyin",
      columns: ["product_name", "category", "slug", "name_en", "name_ru", "unit"],
    },
    markets: {
      title: "Bazar siyahısı",
      description: "Bazar siyahısı Excel faylı yükləyin",
      columns: ["Market", "type"],
    },
  };

  const config = uploadConfigs[activeTab];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Məlumat yüklə</h1>
        <p className="text-slate-500 mt-1">
          Excel fayllarından məlumat yükləyin
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as UploadType)}>
        <TabsList>
          <TabsTrigger value="prices">Qiymətlər</TabsTrigger>
          <TabsTrigger value="products">Məhsullar</TabsTrigger>
          <TabsTrigger value="markets">Bazarlar</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload Area */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>{config.title}</CardTitle>
                  <CardDescription>{config.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Drag & Drop Zone */}
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`
                      relative border-2 border-dashed rounded-xl p-12 text-center transition-all
                      ${
                        dragActive
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-slate-300 hover:border-emerald-400 hover:bg-slate-50"
                      }
                    `}
                  >
                    <input
                      type="file"
                      accept=".xlsx"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />

                    {file ? (
                      <div className="space-y-3">
                        <FileSpreadsheet className="w-12 h-12 mx-auto text-emerald-600" />
                        <div>
                          <p className="font-medium text-slate-900">{file.name}</p>
                          <p className="text-sm text-slate-500">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            setFile(null);
                          }}
                        >
                          Dəyiş
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Upload className="w-12 h-12 mx-auto text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-700">
                            Faylı sürükləyib buraya atın
                          </p>
                          <p className="text-sm text-slate-500">
                            və ya klikləyərək seçin
                          </p>
                        </div>
                        <Badge variant="outline">.xlsx formatı</Badge>
                      </div>
                    )}
                  </div>

                  {/* Upload Button */}
                  <Button
                    className="w-full mt-6"
                    disabled={!file || uploading}
                    onClick={handleUpload}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Yüklənir...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Yüklə
                      </>
                    )}
                  </Button>

                  {/* Result */}
                  {result && (
                    <div
                      className={`mt-6 p-4 rounded-lg ${
                        result.success
                          ? "bg-green-50 border border-green-200"
                          : "bg-red-50 border border-red-200"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {result.success ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p
                            className={`font-medium ${
                              result.success ? "text-green-800" : "text-red-800"
                            }`}
                          >
                            {result.message}
                          </p>
                          {result.success && (
                            <div className="mt-2 text-sm text-green-700 space-y-1">
                              <p>Cəmi: {result.recordsTotal} qeyd</p>
                              <p>Yeni: {result.recordsNew} qeyd</p>
                              {result.recordsUpdated !== undefined && result.recordsUpdated > 0 && (
                                <p>Yeniləndi: {result.recordsUpdated} qeyd</p>
                              )}
                              {result.recordsSkipped !== undefined && result.recordsSkipped > 0 && (
                                <p>Mövcud (keçildi): {result.recordsSkipped} qeyd</p>
                              )}
                            </div>
                          )}
                          {result.errors && result.errors.length > 0 && (
                            <div className="mt-2 text-sm text-red-700">
                              <p className="font-medium">Xətalar:</p>
                              <ul className="list-disc list-inside mt-1">
                                {result.errors.slice(0, 5).map((err, i) => (
                                  <li key={i}>{err}</li>
                                ))}
                                {result.errors.length > 5 && (
                                  <li>...və {result.errors.length - 5} daha</li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Format Guide */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Format təlimatı</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-500 mb-3">
                      Excel faylında aşağıdakı sütunlar olmalıdır:
                    </p>
                    <div className="space-y-2">
                      {config.columns.map((col) => (
                        <div
                          key={col}
                          className="flex items-center gap-2 text-sm"
                        >
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <code className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                            {col}
                          </code>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button variant="outline" size="sm" className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Nümunə yüklə
                    </Button>
                  </div>

                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="flex gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800">
                        Tarix formatı: DD.MM.YYYY (məs. 04.09.2020)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

