"use client";

import Link from 'next/link';
import { 
  Eye, Calendar, Clock, Database, ArrowRight, CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dailyBriefs, dataSources } from '@/data/aiLayerData';
import { useAuth } from '@/contexts/AuthContext';
import { PaywallOverlay } from '@/components/ui/PaywallOverlay';

export default function ReviewPage() {
  const { isAuthenticated } = useAuth();

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-market-up bg-market-up/10';
      case 'negative': return 'text-market-down bg-market-down/10';
      default: return 'text-market-warning bg-market-warning/10';
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Main Brief */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Gündəlik AI Brifinqləri</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Son yeniləmə: Bu gün, 09:00
          </div>
        </div>

        {!isAuthenticated ? (
          <PaywallOverlay 
            title="Gündəlik Brifinqlər"
            description="AI tərəfindən hazırlanan gündəlik bazar analizlərinə giriş üçün daxil olun"
          >
            <div className="space-y-4">
              {dailyBriefs.slice(0, 2).map((brief) => (
                <div key={brief.id} className="premium-card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-ai-accent/10 flex items-center justify-center">
                        <Eye className="h-5 w-5 text-ai-accent" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{brief.date}</p>
                        <h3 className="font-semibold">{brief.title}</h3>
                      </div>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4">{brief.summary}</p>
                </div>
              ))}
            </div>
          </PaywallOverlay>
        ) : (
          <div className="space-y-4">
            {dailyBriefs.map((brief, index) => (
              <article 
                key={brief.id} 
                className={`premium-card p-6 ${index === 0 ? 'ring-2 ring-ai-accent/30' : ''}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-ai-accent/10 flex items-center justify-center">
                      <Eye className="h-5 w-5 text-ai-accent" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">{brief.date}</p>
                        {index === 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-ai-accent/20 text-ai-accent">
                            YENİ
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold">{brief.title}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getSentimentColor(brief.sentiment)}`}>
                      {brief.sentiment === 'positive' ? 'Pozitiv' : brief.sentiment === 'negative' ? 'Neqativ' : 'Qarışıq'}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {brief.readTime}
                    </span>
                  </div>
                </div>

                <p className="text-muted-foreground mb-4">{brief.summary}</p>

                <div className="space-y-2 mb-4">
                  {brief.keyPoints.map((point, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-ai-accent mt-0.5 shrink-0" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    {brief.markets.map((market) => (
                      <span key={market} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                        {market}
                      </span>
                    ))}
                  </div>
                  <Button variant="ghost" size="sm">
                    Ətraflı oxu
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Data Sources Card */}
        <div className="premium-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="h-5 w-5 text-ai-accent" />
            <h3 className="font-semibold">Data Mənbələri</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Bütün brifinqlər real bazarlardan toplanan məlumatlara əsaslanır
          </p>
          <ul className="space-y-3">
            {dataSources.map((source, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-ai-accent" />
                  <span>{source.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{source.updateFreq}</span>
              </li>
            ))}
          </ul>
          <Link href="/data-sources">
            <Button variant="outline" size="sm" className="w-full mt-4">
              Bütün mənbələr
            </Button>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="premium-card p-6">
          <h3 className="font-semibold mb-4">Bu həftə</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-ai-accent">7</p>
              <p className="text-xs text-muted-foreground">Brifinq</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">156</p>
              <p className="text-xs text-muted-foreground">Qiymət yeniləməsi</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-market-up">12</p>
              <p className="text-xs text-muted-foreground">Alert</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">3</p>
              <p className="text-xs text-muted-foreground">Hesabat</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

