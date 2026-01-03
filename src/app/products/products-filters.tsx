"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductsFiltersProps {
  categories: Category[];
}

export function ProductsFilters({ categories }: ProductsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [selectedSource, setSelectedSource] = useState(searchParams.get("source") || "all");

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set("q", searchQuery);
    if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory);
    if (selectedSource && selectedSource !== "all") params.set("source", selectedSource);
    
    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    
    // Debounce the URL update
    const timer = setTimeout(() => {
      router.push(newUrl, { scroll: false });
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedSource, pathname, router]);

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-8">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input 
          placeholder="Məhsul axtar..." 
          className="pl-10" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Kateqoriya" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Bütün kateqoriyalar</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.slug}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={selectedSource} onValueChange={setSelectedSource}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Data mənbəyi" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Hamısı</SelectItem>
          <SelectItem value="az">🇦🇿 Yalnız Azərbaycan</SelectItem>
          <SelectItem value="eu">🇪🇺 Yalnız Avropa</SelectItem>
          <SelectItem value="both">🌍 Müqayisəli</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}



