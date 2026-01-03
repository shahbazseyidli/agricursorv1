"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Search, LogOut, User, Settings, Shield } from "lucide-react";

interface HeaderProps {
  variant?: "public" | "dashboard" | "admin";
}

export function Header({ variant = "public" }: HeaderProps) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const getTitle = () => {
    if (variant === "admin") return "Admin Panel";
    if (variant === "dashboard") return "Dashboard";
    return "";
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      {/* Left side - Title or Breadcrumb */}
      <div className="flex items-center gap-4">
        {variant !== "public" && (
          <h1 className="text-lg font-semibold text-slate-900">{getTitle()}</h1>
        )}
      </div>

      {/* Right side - Search, Notifications, User */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <Button variant="ghost" size="icon" className="text-slate-500">
          <Search className="w-5 h-5" />
        </Button>

        {/* Notifications */}
        {session && (
          <Button variant="ghost" size="icon" className="text-slate-500 relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </Button>
        )}

        {/* User Menu */}
        {session ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={session.user?.image || ""} alt={session.user?.name || ""} />
                  <AvatarFallback className="bg-emerald-100 text-emerald-700">
                    {session.user?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{session.user?.name}</p>
                  <p className="text-xs leading-none text-slate-500">
                    {session.user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </DropdownMenuItem>
              {session.user?.role === "ADMIN" && (
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="cursor-pointer">
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Panel
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Parametrlər
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                onSelect={(e) => {
                  e.preventDefault();
                  signOut({ callbackUrl: "/", redirect: true });
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Çıxış
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Daxil ol</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Qeydiyyat</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}

