"use client";

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Star, GitCompare, ChevronRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { PriceChange } from '@/components/ui/PriceChange';
import { products } from '@/data/mockData';

interface ProductLayoutProps {
  children: ReactNode;
  params: { slug: string };
}

export default function ProductLayout({ children, params }: ProductLayoutProps) {
  const { slug } = params;
  const pathname = usePathname();
  const product = products.find(p => p.id === slug) || products[0];

  // Determine active tab based on pathname
  const getActiveTab = () => {
    if (pathname?.includes('/price-data')) return 'price-data';
    if (pathname?.includes('/cross-market')) return 'cross-market';
    if (pathname?.includes('/insights')) return 'insights';
    return 'overview';
  };

  const activeTab = getActiveTab();

  const tabs = [
    { id: 'overview', label: 'Overview', href: `/products/${slug}` },
    { id: 'price-data', label: 'Price Data', href: `/products/${slug}/price-data` },
    { id: 'cross-market', label: 'Cross-Market', href: `/products/${slug}/cross-market` },
    { id: 'insights', label: 'Insights', href: `/products/${slug}/insights` },
  ];

  return (
    <Layout>
      {/* Sticky Header */}
      <div className="sticky top-16 z-40 bg-card border-b border-border">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <div className="py-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/products" className="hover:text-foreground transition-colors">Products</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">{product.name}</span>
          </div>
          
          {/* Title row */}
          <div className="pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>
              <p className="text-muted-foreground">{product.category}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Star className="h-4 w-4 mr-2" />
                Follow
              </Button>
              <Button variant="outline" size="sm">
                <GitCompare className="h-4 w-4 mr-2" />
                Compare
              </Button>
            </div>
          </div>

          {/* KPIs */}
          <div className="pb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">Latest Price</p>
              <p className="text-xl font-bold tabular-nums">$285.50 <span className="text-sm font-normal text-muted-foreground">/MT</span></p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">1Y Change</p>
              <PriceChange value={12.5} className="text-xl font-bold" />
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">Coverage</p>
              <p className="text-xl font-bold tabular-nums">{product.coverage}%</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">Countries</p>
              <p className="text-xl font-bold tabular-nums">{product.countries}</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-transparent">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                href={tab.href}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-accent text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="container mx-auto px-4 py-6">
        {children}
      </div>
    </Layout>
  );
}

