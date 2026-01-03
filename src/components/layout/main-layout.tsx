"use client";

import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

interface MainLayoutProps {
  children: React.ReactNode;
  variant?: "public" | "dashboard" | "admin";
  showSidebar?: boolean;
}

export function MainLayout({
  children,
  variant = "public",
  showSidebar = true,
}: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      {showSidebar && <Sidebar variant={variant} />}
      <div
        className={cn(
          "flex flex-col min-h-screen transition-all duration-300",
          showSidebar && "ml-64"
        )}
      >
        <Header variant={variant} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

