"use client";

import { 
  Sparkles, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { marketReports } from '@/data/aiLayerData';
import { useAuth } from '@/contexts/AuthContext';
import { PaywallOverlay } from '@/components/ui/PaywallOverlay';

export default function ReportsPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bazar Hesabatları</h2>
          <p className="text-muted-foreground">AI tərəfindən hazırlanan dərin analizlər</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">Həftəlik</Button>
          <Button variant="outline" size="sm">Aylıq</Button>
          <Button variant="outline" size="sm">Xüsusi</Button>
        </div>
      </div>

      {!isAuthenticated ? (
        <PaywallOverlay 
          title="Bazar Hesabatları"
          description="Premium hesabatlara giriş üçün daxil olun"
        >
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {marketReports.slice(0, 3).map((report) => (
              <div key={report.id} className="premium-card p-6">
                <h3 className="font-semibold mb-2">{report.title}</h3>
                <p className="text-sm text-muted-foreground">{report.summary}</p>
              </div>
            ))}
          </div>
        </PaywallOverlay>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {marketReports.map((report) => (
            <article key={report.id} className="premium-card p-6 group cursor-pointer hover:ring-2 hover:ring-ai-accent/30 transition-all">
              <div className="flex items-start justify-between mb-4">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  report.type === 'special' ? 'bg-market-warning/10 text-market-warning' :
                  report.type === 'quarterly' ? 'bg-accent/10 text-accent' :
                  'bg-secondary text-secondary-foreground'
                }`}>
                  {report.type === 'weekly' ? 'Həftəlik' :
                   report.type === 'monthly' ? 'Aylıq' :
                   report.type === 'quarterly' ? 'Rüblik' : 'Xüsusi'}
                </span>
                {report.isPremium && (
                  <span className="text-xs px-2 py-1 rounded-full bg-ai-accent/20 text-ai-accent flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Premium
                  </span>
                )}
              </div>

              <h3 className="font-semibold mb-2 group-hover:text-ai-accent transition-colors">
                {report.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {report.summary}
              </p>

              <div className="flex flex-wrap gap-1 mb-4">
                {report.products.slice(0, 3).map((product) => (
                  <span key={product} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {product}
                  </span>
                ))}
                {report.products.length > 3 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    +{report.products.length - 3}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {report.pages} səhifə
                </div>
                <span>{report.date}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

