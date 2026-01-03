"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ComparisonChart } from "@/components/charts/comparison-chart";
import { Plus, X, BarChart3, Download } from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
}

interface Market {
  id: string;
  name: string;
}

interface ComparisonItem {
  id: string;
  productId: string;
  marketId: string;
  productName?: string;
  marketName?: string;
  color: string;
}

const CHART_COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
];

export default function ComparePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [comparisons, setComparisons] = useState<ComparisonItem[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState("6m");

  // Fetch products and markets
  useEffect(() => {
    async function fetchData() {
      const [productsRes, marketsRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/markets"),
      ]);
      const productsData = await productsRes.json();
      const marketsData = await marketsRes.json();
      setProducts(productsData.data || []);
      setMarkets(marketsData.data || []);
    }
    fetchData();
  }, []);

  // Add comparison
  const addComparison = () => {
    if (comparisons.length >= 6) return;
    const newComparison: ComparisonItem = {
      id: crypto.randomUUID(),
      productId: "",
      marketId: "",
      color: CHART_COLORS[comparisons.length % CHART_COLORS.length],
    };
    setComparisons([...comparisons, newComparison]);
  };

  // Remove comparison
  const removeComparison = (id: string) => {
    setComparisons(comparisons.filter((c) => c.id !== id));
  };

  // Update comparison
  const updateComparison = (
    id: string,
    field: "productId" | "marketId",
    value: string
  ) => {
    setComparisons(
      comparisons.map((c) => {
        if (c.id === id) {
          const updated = { ...c, [field]: value };
          if (field === "productId") {
            updated.productName = products.find((p) => p.id === value)?.name;
          }
          if (field === "marketId") {
            updated.marketName = markets.find((m) => m.id === value)?.name;
          }
          return updated;
        }
        return c;
      })
    );
  };

  // Fetch comparison data
  const fetchComparisonData = async () => {
    const validComparisons = comparisons.filter(
      (c) => c.productId && c.marketId
    );
    if (validComparisons.length === 0) {
      setChartData([]);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      validComparisons.forEach((c, i) => {
        params.append(`product${i}`, c.productId);
        params.append(`market${i}`, c.marketId);
        params.append(`id${i}`, c.id); // Pass the comparison ID
      });
      params.append("range", dateRange);

      const res = await fetch(`/api/prices/compare?${params.toString()}`);
      const data = await res.json();
      
      if (data.data && data.data.length > 0) {
        setChartData(data.data);
      } else {
        setChartData([]);
      }
    } catch (error) {
      console.error("Error fetching comparison data:", error);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  // Chart series config
  const chartSeries = comparisons
    .filter((c) => c.productId && c.marketId)
    .map((c) => ({
      key: c.id,
      name: `${c.productName} - ${c.marketName}`,
      color: c.color,
    }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Qiymət müqayisəsi</h1>
        <p className="text-slate-500 mt-1">
          Müxtəlif məhsul və bazarlar arasında qiymətləri müqayisə edin
        </p>
      </div>

      {/* Comparison Builder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Müqayisə qur</CardTitle>
          <CardDescription>
            Müqayisə etmək istədiyiniz məhsul və bazarları seçin (maksimum 6)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {comparisons.map((comparison, index) => (
            <div
              key={comparison.id}
              className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200"
            >
              <div
                className="w-4 h-4 rounded-full shrink-0"
                style={{ backgroundColor: comparison.color }}
              />

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-500 mb-1 block">
                    Məhsul
                  </Label>
                  <Select
                    value={comparison.productId}
                    onValueChange={(v) =>
                      updateComparison(comparison.id, "productId", v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Məhsul seç" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-slate-500 mb-1 block">
                    Bazar
                  </Label>
                  <Select
                    value={comparison.marketId}
                    onValueChange={(v) =>
                      updateComparison(comparison.id, "marketId", v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Bazar seç" />
                    </SelectTrigger>
                    <SelectContent>
                      {markets.map((market) => (
                        <SelectItem key={market.id} value={market.id}>
                          {market.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeComparison(comparison.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={addComparison}
              disabled={comparisons.length >= 6}
            >
              <Plus className="w-4 h-4 mr-2" />
              Müqayisə əlavə et
            </Button>

            {comparisons.length > 0 && (
              <>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1m">1 ay</SelectItem>
                    <SelectItem value="3m">3 ay</SelectItem>
                    <SelectItem value="6m">6 ay</SelectItem>
                    <SelectItem value="1y">1 il</SelectItem>
                    <SelectItem value="all">Hamısı</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={fetchComparisonData} disabled={loading}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  {loading ? "Yüklənir..." : "Müqayisə et"}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="animate-spin w-10 h-10 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-500">Qiymət məlumatları yüklənir...</p>
          </CardContent>
        </Card>
      )}

      {/* Chart */}
      {!loading && chartData.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Qiymət müqayisəsi qrafiki</CardTitle>
              <CardDescription>
                Seçilmiş məhsul və bazarların qiymət dinamikası
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Yüklə
            </Button>
          </CardHeader>
          <CardContent>
            <ComparisonChart data={chartData} series={chartSeries} height={450} />
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {!loading && chartData.length === 0 && comparisons.some(c => c.productId && c.marketId) && (
        <Card>
          <CardContent className="py-16 text-center">
            <BarChart3 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Qiymət məlumatı tapılmadı
            </h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Seçilmiş məhsul və bazar kombinasiyası üçün qiymət məlumatı yoxdur.
              Fərqli seçimlər etməyə cəhd edin.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {comparisons.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <BarChart3 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Müqayisə qurun
            </h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              Müxtəlif məhsul və bazarların qiymətlərini müqayisə etmək üçün
              yuxarıdakı düyməyə klikləyin
            </p>
            <Button onClick={addComparison}>
              <Plus className="w-4 h-4 mr-2" />
              İlk müqayisəni əlavə et
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

