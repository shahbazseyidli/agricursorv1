"use client";

import Link from 'next/link';
import { AIInsightCard } from '@/components/ui/AIInsightCard';
import { products, countries } from '@/data/mockData';

export default function ProductOverviewPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const product = products.find(p => p.id === slug) || products[0];

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <AIInsightCard
          title="AI Product Summary"
          insights={[
            `${product.name} is one of the most traded agricultural commodities globally, with coverage in ${product.countries} countries.`,
            'Current price levels are 12.5% higher than the same period last year.',
            'Major production regions include Turkey, India, and Eastern Europe.',
            'Seasonal patterns show peak prices during Q1 and Q4.'
          ]}
          className="mb-6"
        />

        <div className="premium-card p-6">
          <h3 className="font-semibold mb-4">Related Products</h3>
          <div className="grid grid-cols-2 gap-4">
            {products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4).map(p => (
              <Link 
                key={p.id} 
                href={`/products/${p.id}`}
                className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-muted-foreground">{p.countries} countries</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="premium-card p-6">
          <h3 className="font-semibold mb-4">Top Markets</h3>
          <ul className="space-y-3">
            {countries.slice(0, 5).map((c) => (
              <li key={c.id}>
                <Link 
                  href={`/countries/${c.id}`}
                  className="flex items-center justify-between py-2 hover:text-accent transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{c.flag}</span>
                    <span className="font-medium">{c.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{c.markets} markets</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
