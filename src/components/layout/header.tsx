"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Bell, User, Menu, LogOut, Sparkles, Tractor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const navigation = [
  { name: 'Products', href: '/products' },
  { name: 'Countries', href: '/countries' },
  { name: 'Agrai', href: '/agrai', highlight: true },
  { name: 'Data Sources', href: '/data-sources' },
  { name: 'Farmer AI', href: '#', comingSoon: true },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, openLoginModal, logout } = useAuth();
  
  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-ai flex items-center justify-center">
              <span className="text-ai-accent font-bold text-lg">A</span>
            </div>
            <span className="font-bold text-xl">
              Agrai
              <span className="text-xs ml-1 px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium">
                BETA
              </span>
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navigation.map((item) => (
              item.comingSoon ? (
                <div
                  key={item.name}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ai/80 cursor-default"
                >
                  <Tractor className="h-3.5 w-3.5 text-ai-accent" />
                  <span className="text-sm font-medium text-ai-accent">{item.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-ai-accent/20 text-ai-accent font-semibold">
                    SOON
                  </span>
                </div>
              ) : (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`text-sm font-medium transition-colors flex items-center gap-1 ${
                    pathname.startsWith(item.href)
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  } ${item.highlight ? 'text-ai-accent hover:text-ai-accent' : ''}`}
                >
                  {item.highlight && <Sparkles className="h-3.5 w-3.5" />}
                  {item.name}
                </Link>
              )
            ))}
          </nav>
          
          {/* Right side actions */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <Search className="h-4 w-4" />
            </Button>
            
            {isAuthenticated ? (
              <>
                <Button variant="ghost" size="icon" className="hidden md:flex">
                  <Bell className="h-4 w-4" />
                </Button>
                <div className="hidden md:flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-accent">
                      {user?.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium">{user?.name}</span>
                  <Button variant="ghost" size="icon" onClick={logout}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <Button 
                onClick={openLoginModal}
                className="hidden md:flex bg-accent hover:bg-accent/90"
                size="sm"
              >
                Daxil ol
              </Button>
            )}
            
            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border">
            {navigation.map((item) => (
              item.comingSoon ? (
                <div
                  key={item.name}
                  className="flex items-center gap-2 py-2 px-3 my-1 rounded-lg bg-ai/80"
                >
                  <Tractor className="h-4 w-4 text-ai-accent" />
                  <span className="text-sm font-medium text-ai-accent">{item.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-ai-accent/20 text-ai-accent font-semibold">
                    SOON
                  </span>
                </div>
              ) : (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block py-2 text-sm font-medium transition-colors ${
                    pathname.startsWith(item.href)
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              )
            ))}
            {!isAuthenticated && (
              <Button 
                onClick={() => {
                  openLoginModal();
                  setMobileMenuOpen(false);
                }}
                className="w-full mt-4 bg-accent hover:bg-accent/90"
                size="sm"
              >
                Daxil ol
              </Button>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
