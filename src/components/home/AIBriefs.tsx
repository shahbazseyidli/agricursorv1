"use client";

import { FileText, AlertCircle, BarChart3, ArrowUpRight, Lock } from 'lucide-react';
import Link from 'next/link';
import { aiBriefs } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const iconMap = {
  weekly: FileText,
  alert: AlertCircle,
  analysis: BarChart3,
};

export function AIBriefs() {
  const { isAuthenticated, openLoginModal } = useAuth();

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-1">Weekly AI Briefs</h2>
            <p className="text-muted-foreground">AI-generated market intelligence reports</p>
          </div>
          <Link href="/agrai">
            <Button variant="outline" size="sm">
              Bütün brifinqlər
            </Button>
          </Link>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 relative">
          {aiBriefs.map((brief) => {
            const Icon = iconMap[brief.type];
            return (
              <article 
                key={brief.id} 
                className={`premium-card p-6 group ${!isAuthenticated ? 'cursor-pointer' : ''}`}
                onClick={() => !isAuthenticated && openLoginModal()}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    brief.type === 'alert' 
                      ? 'bg-market-warning/10 text-market-warning' 
                      : 'bg-accent/10 text-accent'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {isAuthenticated ? (
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Lock className="h-3 w-3" />
                      Login
                    </div>
                  )}
                </div>
                
                <h3 className={`font-semibold mb-2 group-hover:text-accent transition-colors ${!isAuthenticated ? 'blur-[2px]' : ''}`}>
                  {brief.title}
                </h3>
                <p className={`text-sm text-muted-foreground mb-4 line-clamp-2 ${!isAuthenticated ? 'blur-sm' : ''}`}>
                  {brief.summary}
                </p>
                
                <div className={`flex items-center gap-2 flex-wrap ${!isAuthenticated ? 'blur-sm' : ''}`}>
                  {brief.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <p className="text-xs text-muted-foreground mt-4">{brief.date}</p>
              </article>
            );
          })}

          {/* Overlay for non-authenticated users */}
          {!isAuthenticated && (
            <div className="absolute inset-0 flex items-end justify-center pb-8 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none">
              <div className="pointer-events-auto text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  AI brifinqlərini görmək üçün daxil olun
                </p>
                <Button onClick={openLoginModal} size="sm" className="bg-accent hover:bg-accent/90">
                  <Lock className="h-4 w-4 mr-2" />
                  Daxil ol
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

