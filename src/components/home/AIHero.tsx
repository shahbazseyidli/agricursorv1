"use client";

import { useState, useRef } from 'react';
import { Search, Sparkles, ArrowRight, Lock, Loader2, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

const suggestedQueries = [
  'Azərbaycanda pomidor qiyməti',
  'Türkiyədə buğda qiyməti',
  'Alma qiymətləri müqayisəsi',
  'Kartof bazarı analizi',
];

export function AIHero() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { isAuthenticated, openLoginModal } = useAuth();

  const handleSearch = async () => {
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }

    if (!query.trim()) return;

    // Abort previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setResponse('');
    setShowResponse(true);

    try {
      const res = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        throw new Error('AI xidməti xətası');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('Stream oxuna bilmir');

      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullResponse += parsed.content;
                setResponse(fullResponse);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled
        return;
      }
      console.error('AI Error:', error);
      setResponse('Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const closeResponse = () => {
    setShowResponse(false);
    setResponse('');
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
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
                placeholder="Kənd təsərrüfatı bazarları haqqında soruşun..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="w-full h-14 pl-12 pr-32 text-lg bg-ai-muted border-ai-border text-ai-foreground placeholder:text-ai-foreground/40 rounded-xl focus:ring-2 focus:ring-ai-accent focus:border-ai-accent"
              />
              <Button 
                onClick={handleSearch}
                disabled={isLoading || (!isAuthenticated && false)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-ai-accent hover:bg-ai-accent/90 text-ai font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Düşünür...
                  </>
                ) : isAuthenticated ? (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Soruş
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
          <div className="flex flex-wrap justify-center gap-2 mb-8">
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
                disabled={isLoading}
                className="px-3 py-1.5 text-sm rounded-full bg-ai-muted border border-ai-border text-ai-foreground/70 hover:text-ai-foreground hover:border-ai-accent/50 transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                {suggestion}
                <ArrowRight className="h-3 w-3" />
              </button>
            ))}
          </div>

          {/* AI Response */}
          {showResponse && (
            <div className="relative max-w-2xl mx-auto text-left">
              <div className="premium-card p-6 bg-ai-muted/50 border border-ai-border rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-ai-accent" />
                    <span className="font-semibold text-ai-accent">AI Cavabı</span>
                  </div>
                  <button 
                    onClick={closeResponse}
                    className="p-1 hover:bg-ai-border rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4 text-ai-foreground/60" />
                  </button>
                </div>
                
                <div className="prose prose-sm prose-invert max-w-none">
                  {response ? (
                    <div className="whitespace-pre-wrap text-ai-foreground/90 leading-relaxed">
                      {response.split('\n').map((line, i) => {
                        // Handle bold text
                        const parts = line.split(/\*\*(.*?)\*\*/g);
                        return (
                          <p key={i} className="my-1">
                            {parts.map((part, j) => 
                              j % 2 === 1 ? (
                                <strong key={j} className="text-ai-accent font-semibold">{part}</strong>
                              ) : (
                                <span key={j}>{part}</span>
                              )
                            )}
                          </p>
                        );
                      })}
                    </div>
                  ) : isLoading ? (
                    <div className="flex items-center gap-2 text-ai-foreground/60">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Məlumatlar analiz edilir...</span>
                    </div>
                  ) : null}
                </div>

                {/* Data sources footer */}
                {response && !isLoading && (
                  <div className="mt-4 pt-4 border-t border-ai-border">
                    <div className="flex flex-wrap gap-2 text-xs text-ai-foreground/50">
                      <span>Data mənbələri:</span>
                      <span className="px-2 py-0.5 rounded bg-ai-border">Agro.gov.az</span>
                      <span className="px-2 py-0.5 rounded bg-ai-border">EUROSTAT</span>
                      <span className="px-2 py-0.5 rounded bg-ai-border">FAOSTAT</span>
                      <span className="px-2 py-0.5 rounded bg-ai-border">FAO FPMA</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
