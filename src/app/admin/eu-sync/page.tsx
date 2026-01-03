"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  RefreshCw, 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Clock,
  Globe,
  Database,
  GitCompare
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface SyncRecord {
  id: string;
  source: string;
  syncType: string;
  status: string;
  recordsTotal: number | null;
  recordsNew: number | null;
  recordsUpdated: number | null;
  recordsError: number | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface Stats {
  ecAgrifood: {
    lastSync: string | null;
    totalPrices: number;
  };
  eurostat: {
    lastSync: string | null;
    totalPrices: number;
  };
  euCountries: number;
  euProducts: number;
  azAggregates: number;
}

export default function EuSyncPage() {
  const [syncs, setSyncs] = useState<SyncRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [startYear, setStartYear] = useState(2020);
  const [endYear, setEndYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/eu/sync");
      const data = await res.json();
      setSyncs(data.syncs || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error("Error fetching sync data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function runSync(action: string) {
    setSyncing(action);
    try {
      const res = await fetch("/api/admin/eu/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, startYear, endYear })
      });
      const data = await res.json();
      
      if (data.success) {
        alert("Sinxronizasiya tamamlandı!");
        fetchData();
      } else {
        alert("Xəta: " + (data.error || "Bilinməyən xəta"));
      }
    } catch (error) {
      console.error("Sync error:", error);
      alert("Xəta baş verdi");
    } finally {
      setSyncing(null);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle className="w-3 h-3 mr-1" /> Tamamlandı</Badge>;
      case "FAILED":
        return <Badge className="bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" /> Uğursuz</Badge>;
      case "RUNNING":
        return <Badge className="bg-blue-100 text-blue-700"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> İcra olunur</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700"><Clock className="w-3 h-3 mr-1" /> Gözləyir</Badge>;
    }
  }

  function getSourceLabel(source: string) {
    switch (source) {
      case "EC_AGRIFOOD": return "EC Agrifood";
      case "EUROSTAT": return "Eurostat";
      case "AZ_AGGREGATE": return "AZ Aggregates";
      case "MATCHER": return "Matching";
      default: return source;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">EU Data Sinxronizasiyası</h1>
          <p className="text-slate-500">EC Agrifood və Eurostat mənbələrindən data yeniləmə</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Globe className="w-6 h-6 mx-auto text-blue-500 mb-2" />
              <p className="text-2xl font-bold text-slate-900">{stats.euCountries}</p>
              <p className="text-xs text-slate-500">EU Ölkələr</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Database className="w-6 h-6 mx-auto text-purple-500 mb-2" />
              <p className="text-2xl font-bold text-slate-900">{stats.euProducts}</p>
              <p className="text-xs text-slate-500">EU Məhsullar</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-xs text-emerald-600 mb-1">EC Agrifood</div>
              <p className="text-xl font-bold text-slate-900">{stats.ecAgrifood.totalPrices.toLocaleString()}</p>
              <p className="text-xs text-slate-500">qiymət</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-xs text-blue-600 mb-1">Eurostat</div>
              <p className="text-xl font-bold text-slate-900">{stats.eurostat.totalPrices.toLocaleString()}</p>
              <p className="text-xs text-slate-500">qiymət</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <GitCompare className="w-6 h-6 mx-auto text-amber-500 mb-2" />
              <p className="text-2xl font-bold text-slate-900">{stats.azAggregates.toLocaleString()}</p>
              <p className="text-xs text-slate-500">AZ Aggregates</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sync Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Sinxronizasiya Əməliyyatları</CardTitle>
          <CardDescription>EU data mənbələrindən məlumat yükləyin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Year Range */}
          <div className="flex items-center gap-4">
            <div>
              <Label>Başlanğıc il</Label>
              <Input
                type="number"
                value={startYear}
                onChange={(e) => setStartYear(parseInt(e.target.value))}
                className="w-24"
                min={2000}
                max={2030}
              />
            </div>
            <div>
              <Label>Bitiş il</Label>
              <Input
                type="number"
                value={endYear}
                onChange={(e) => setEndYear(parseInt(e.target.value))}
                className="w-24"
                min={2000}
                max={2030}
              />
            </div>
          </div>

          {/* Sync Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              onClick={() => runSync("syncEcAgrifood")}
              disabled={!!syncing}
              className="flex-col h-auto py-4"
            >
              {syncing === "syncEcAgrifood" ? (
                <RefreshCw className="w-5 h-5 mb-2 animate-spin" />
              ) : (
                <Database className="w-5 h-5 mb-2 text-emerald-600" />
              )}
              <span className="font-medium">EC Agrifood</span>
              <span className="text-xs text-slate-500">Həftəlik qiymətlər</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => runSync("syncEurostat")}
              disabled={!!syncing}
              className="flex-col h-auto py-4"
            >
              {syncing === "syncEurostat" ? (
                <RefreshCw className="w-5 h-5 mb-2 animate-spin" />
              ) : (
                <Database className="w-5 h-5 mb-2 text-blue-600" />
              )}
              <span className="font-medium">Eurostat</span>
              <span className="text-xs text-slate-500">İllik qiymətlər</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => runSync("runMatching")}
              disabled={!!syncing}
              className="flex-col h-auto py-4"
            >
              {syncing === "runMatching" ? (
                <RefreshCw className="w-5 h-5 mb-2 animate-spin" />
              ) : (
                <GitCompare className="w-5 h-5 mb-2 text-amber-600" />
              )}
              <span className="font-medium">Matching</span>
              <span className="text-xs text-slate-500">Məhsul uyğunlaşdırma</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => runSync("syncAzAggregates")}
              disabled={!!syncing}
              className="flex-col h-auto py-4"
            >
              {syncing === "syncAzAggregates" ? (
                <RefreshCw className="w-5 h-5 mb-2 animate-spin" />
              ) : (
                <Database className="w-5 h-5 mb-2 text-purple-600" />
              )}
              <span className="font-medium">AZ Aggregates</span>
              <span className="text-xs text-slate-500">Orta qiymətlər</span>
            </Button>
          </div>

          <div className="pt-4 border-t">
            <Button
              onClick={() => runSync("fullSync")}
              disabled={!!syncing}
              className="w-full"
            >
              {syncing === "fullSync" ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sinxronizasiya davam edir...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tam Sinxronizasiya (Hamısı)
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sync History */}
      <Card>
        <CardHeader>
          <CardTitle>Sinxronizasiya Tarixçəsi</CardTitle>
          <CardDescription>Son sinxronizasiya əməliyyatları</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mənbə</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cəmi</TableHead>
                <TableHead>Yeni</TableHead>
                <TableHead>Yeniləndi</TableHead>
                <TableHead>Xəta</TableHead>
                <TableHead>Tarix</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                    Yüklənir...
                  </TableCell>
                </TableRow>
              ) : syncs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                    Sinxronizasiya tarixçəsi yoxdur
                  </TableCell>
                </TableRow>
              ) : (
                syncs.map((sync) => (
                  <TableRow key={sync.id}>
                    <TableCell className="font-medium">{getSourceLabel(sync.source)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{sync.syncType}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(sync.status)}</TableCell>
                    <TableCell>{sync.recordsTotal?.toLocaleString() || "-"}</TableCell>
                    <TableCell className="text-emerald-600">{sync.recordsNew?.toLocaleString() || "-"}</TableCell>
                    <TableCell className="text-blue-600">{sync.recordsUpdated?.toLocaleString() || "-"}</TableCell>
                    <TableCell className="text-red-600">{sync.recordsError?.toLocaleString() || "-"}</TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {format(new Date(sync.createdAt), "dd.MM.yyyy HH:mm")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}







