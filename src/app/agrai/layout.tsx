"use client";

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Sparkles, Eye, BarChart3, Zap, Shield
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { dataSources } from '@/data/aiLayerData';

interface AgraiLayoutProps {
  children: ReactNode;
}

export default function AgraiLayout({ children }: AgraiLayoutProps) {
  const pathname = usePathname();

  const tabs = [
    { 
      id: 'review', 
      href: '/agrai/review', 
      label: 'Baxış', 
      badge: 'brif',
      badgeActive: true,
      icon: Eye 
    },
    { 
      id: 'reports', 
      href: '/agrai/reports', 
      label: 'Analiz', 
      badge: 'report',
      badgeActive: false,
      icon: BarChart3 
    },
    { 
      id: 'signal', 
      href: '/agrai/signal', 
      label: 'Siqnal', 
      badge: null,
      badgeActive: false,
      icon: Zap 
    },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <Layout>
      {/* Hero Section */}
      <section className="ai-zone py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-ai-muted border border-ai-border flex items-center justify-center shadow-ai-glow">
                <Sparkles className="h-7 w-7 text-ai-accent" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold">
                <span className="ai-gradient-text">Agrai</span>
              </h1>
            </div>
            <p className="text-xl text-ai-foreground/80 mb-4">
              Süni intellekt tərəfindən idarə olunan bazar kəşfiyyatı
            </p>
            <p className="text-ai-foreground/60 max-w-2xl mx-auto">
              Real məlumat bazalarımızdan toplanan datalar əsasında gündəlik brifinqlər, 
              bazar hesabatları və avtomatlaşdırılmış siqnallar
            </p>

            {/* Data Trust Badge */}
            <div className="mt-8 inline-flex items-center gap-3 px-4 py-2 rounded-full bg-ai-muted border border-ai-border">
              <Shield className="h-5 w-5 text-ai-accent" />
              <span className="text-sm text-ai-foreground/80">
                Bütün məlumatlar real bazar datalarına əsaslanır
              </span>
              <div className="flex items-center gap-2 pl-3 border-l border-ai-border">
                {dataSources.slice(0, 3).map((source, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-ai-accent/20 text-ai-accent">
                    {source.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Custom Tab Navigation */}
        <div className="w-full border-b border-border mb-8">
          <div className="flex items-center gap-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = isActive(tab.href);
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={`px-6 py-4 flex items-center gap-2 border-b-2 transition-colors ${
                    active 
                      ? 'border-ai-accent text-foreground' 
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{tab.label}</span>
                  {tab.badge && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      tab.badgeActive 
                        ? 'bg-ai-accent/20 text-ai-accent' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {children}
      </div>
    </Layout>
  );
}
