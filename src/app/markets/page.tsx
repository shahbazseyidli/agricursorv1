"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Search, Store, Warehouse, Building2, Tractor } from "lucide-react";

interface Market {
  id: string;
  name: string;
  marketType: {
    id: string;
    code: string;
    nameAz: string;
  };
  country: {
    name: string;
  };
  _count?: {
    prices: number;
  };
}

interface MarketType {
  id: string;
  code: string;
  nameAz: string;
}

const marketTypeIcons: Record<string, any> = {
  RETAIL: Store,
  WHOLESALE: Warehouse,
  PROCESSING: Building2,
  FIELD: Tractor,
};

const marketTypeColors: Record<string, string> = {
  RETAIL: "bg-blue-50 text-blue-700 border-blue-200",
  WHOLESALE: "bg-purple-50 text-purple-700 border-purple-200",
  PROCESSING: "bg-orange-50 text-orange-700 border-orange-200",
  FIELD: "bg-green-50 text-green-700 border-green-200",
};

export default function MarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [marketTypes, setMarketTypes] = useState<MarketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [marketsRes, typesRes] = await Promise.all([
          fetch("/api/markets"),
          fetch("/api/admin/market-types"),
        ]);
        
        const marketsData = await marketsRes.json();
        const typesData = await typesRes.json();
        
        setMarkets(marketsData.data || []);
        setMarketTypes(typesData || []);
      } catch (error) {
        console.error("Error fetching markets:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filter markets
  const filteredMarkets = markets.filter((market) => {
    const matchesSearch = market.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType =
      selectedType === "all" || market.marketType.id === selectedType;
    return matchesSearch && matchesType;
  });

  // Group markets by type
  const groupedMarkets = filteredMarkets.reduce((acc, market) => {
    const typeCode = market.marketType.code;
    if (!acc[typeCode]) {
      acc[typeCode] = {
        type: market.marketType,
        markets: [],
      };
    }
    acc[typeCode].markets.push(market);
    return acc;
  }, {} as Record<string, { type: MarketType; markets: Market[] }>);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Bazarlar</h1>
              <p className="text-slate-500">
                Azərbaycandakı kənd təsərrüfatı bazarları
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Bazar axtar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Bazar növü" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Bütün növlər</SelectItem>
                {marketTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.nameAz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full" />
          </div>
        ) : filteredMarkets.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <MapPin className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Bazar tapılmadı
              </h3>
              <p className="text-slate-500">
                Axtarış meyarlarına uyğun bazar yoxdur
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.values(groupedMarkets).map(({ type, markets }) => {
                const IconComponent = marketTypeIcons[type.code] || Store;
                const colorClass = marketTypeColors[type.code] || "bg-slate-50 text-slate-700";
                
                return (
                  <Card key={type.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${colorClass.split(" ").slice(0, 2).join(" ")}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-slate-900">
                            {markets.length}
                          </p>
                          <p className="text-sm text-slate-500">{type.nameAz}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Markets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMarkets.map((market) => {
                const IconComponent = marketTypeIcons[market.marketType.code] || Store;
                const colorClass = marketTypeColors[market.marketType.code] || "bg-slate-50 text-slate-700 border-slate-200";
                
                return (
                  <Card
                    key={market.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${colorClass.split(" ").slice(0, 2).join(" ")}`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-medium text-slate-900">
                              {market.name}
                            </h3>
                            <p className="text-sm text-slate-500">
                              {market.country.name}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={colorClass}
                        >
                          {market.marketType.nameAz}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}








