"use client";

import { useState } from 'react';
import { Search, Sparkles, ArrowRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

const suggestedQueries = [
  'Wheat prices in Turkey last 30 days',
  'Compare hazelnut markets: Turkey vs Azerbaijan',
  'Tomato price trends in Caucasus region',
];

export function AIHero() {
  const [query, setQuery] = useState('');
  const { isAuthenticated, openLoginModal } = useAuth();

  const handleSearch = () => {
    if (!isAuthenticated) {
      openLoginModal();
    }
  };

  return (
    <section className="ai-zone relative overflow-hidden">
      {/* Gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-ai-accent/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-chart-2/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Logo & Title */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-ai-muted border border-ai-border flex items-center justify-center shadow-ai-glow">
              <Sparkles className="h-6 w-6 text-ai-accent" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">
              <span className="ai-gradient-text">Agrai</span>
              <span className="ml-2 text-sm align-top px-2 py-0.5 rounded-full bg-ai-accent/20 text-ai-accent font-medium">
                BETA
              </span>
            </h1>
          </div>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-ai-foreground/90 mb-4">
            Kənd təsərrüfatı üçün süni intellekt
          </p>
          <p className="text-ai-foreground/60 mb-10 max-w-xl mx-auto">
            Real-time bazar qiymətləri, trend analizləri və 50+ ölkənin məlumatları bir sorğuda
          </p>
          
          {/* AI Search Input */}
          <div className="relative max-w-2xl mx-auto mb-6">
            <div className="relative">
              <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-ai-accent" />
              <Input
                type="text"
                placeholder="Ask anything about agricultural markets..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-14 pl-12 pr-32 text-lg bg-ai-muted border-ai-border text-ai-foreground placeholder:text-ai-foreground/40 rounded-xl focus:ring-2 focus:ring-ai-accent focus:border-ai-accent"
              />
              <Button 
                onClick={handleSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-ai-accent hover:bg-ai-accent/90 text-ai font-medium"
              >
                {isAuthenticated ? (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Daxil ol
                  </>
                )}
              </Button>
            </div>
            {!isAuthenticated && (
              <p className="text-xs text-ai-foreground/50 mt-2">
                AI axtarış funksiyasından istifadə etmək üçün daxil olmalısınız
              </p>
            )}
          </div>
          
          {/* Suggested queries */}
          <div className="flex flex-wrap justify-center gap-2">
            {suggestedQueries.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => {
                  if (isAuthenticated) {
                    setQuery(suggestion);
                  } else {
                    openLoginModal();
                  }
                }}
                className="px-3 py-1.5 text-sm rounded-full bg-ai-muted border border-ai-border text-ai-foreground/70 hover:text-ai-foreground hover:border-ai-accent/50 transition-colors flex items-center gap-1"
              >
                {suggestion}
                <ArrowRight className="h-3 w-3" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

