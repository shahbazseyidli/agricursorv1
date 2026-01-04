"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Search,
  Package,
  MapPin,
  BarChart3,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
  Leaf,
  Globe,
  Layers,
  RefreshCw,
  Upload,
  Link2,
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  variant?: "public" | "dashboard" | "admin";
}

const publicNavItems = [
  { href: "/", label: "Ana səhifə", icon: Home },
  { href: "/categories", label: "Kateqoriyalar", icon: Layers },
  { href: "/products", label: "Məhsullar", icon: Package },
  { href: "/countries", label: "Ölkələr", icon: Globe },
  { href: "/markets", label: "Bazarlar", icon: MapPin },
];

const dashboardNavItems = [
  { href: "/dashboard", label: "İcmal", icon: Home },
  { href: "/dashboard/compare", label: "Müqayisə", icon: BarChart3 },
  { href: "/categories", label: "Kateqoriyalar", icon: Layers },
  { href: "/products", label: "Məhsullar", icon: Package },
  { href: "/countries", label: "Ölkələr", icon: Globe },
  { href: "/markets", label: "Bazarlar", icon: MapPin },
];

const adminNavItems = [
  { href: "/admin", label: "İdarə paneli", icon: Home },
  { href: "/admin/upload", label: "Məlumat yüklə", icon: Upload },
  // Global bölmə
  { href: "/admin/global-products", label: "Global Məhsullar", icon: Layers },
  // AZ Data
  { href: "/admin/products", label: "AZ Məhsullar", icon: Package },
  { href: "/admin/markets", label: "AZ Bazarlar", icon: MapPin },
  { href: "/admin/prices", label: "AZ Qiymətlər", icon: TrendingUp },
  // EU Data
  { href: "/admin/eu-products", label: "EU Məhsulları", icon: Globe },
  { href: "/admin/eu-sync", label: "EU Sinxronizasiya", icon: RefreshCw },
  // System
  { href: "/admin/users", label: "İstifadəçilər", icon: Settings },
];

export function Sidebar({ variant = "public" }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems =
    variant === "admin"
      ? adminNavItems
      : variant === "dashboard"
      ? dashboardNavItems
      : publicNavItems;

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-white border-r border-slate-200 transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg text-slate-900">AgriPrice</span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-emerald-600")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-200">
          <div className="text-xs text-slate-400">
            © 2026 AgriPrice AZ
          </div>
        </div>
      )}
    </aside>
  );
}

