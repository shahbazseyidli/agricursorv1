"use client";

import Link from 'next/link';
import { TrendingUp, Zap, Search } from 'lucide-react';
import { products, countries } from '@/data/mockData';

export function TrendingTables() {
  const trendingProducts = products.slice(0, 5);
  const volatileMarkets = countries.slice(0, 5);
  
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Trending Products */}
          <div className="premium-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-accent" />
              </div>
              <h3 className="font-semibold">Trending Products</h3>
            </div>
            <ul className="space-y-3">
              {trendingProducts.map((product, index) => (
                <li key={product.id}>
                  <Link 
                    href={`/products/${product.id}`}
                    className="flex items-center justify-between py-2 px-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-5">
                        {index + 1}
                      </span>
                      <span className="font-medium group-hover:text-accent transition-colors">
                        {product.name}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {product.countries} countries
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Most Volatile */}
          <div className="premium-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-market-warning/10 flex items-center justify-center">
                <Zap className="h-4 w-4 text-market-warning" />
              </div>
              <h3 className="font-semibold">Most Volatile Markets</h3>
            </div>
            <ul className="space-y-3">
              {volatileMarkets.map((country) => (
                <li key={country.id}>
                  <Link 
                    href={`/countries/${country.id}`}
                    className="flex items-center justify-between py-2 px-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{country.flag}</span>
                      <span className="font-medium group-hover:text-accent transition-colors">
                        {country.name}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {country.products} products
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Most Searched */}
          <div className="premium-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-chart-2/10 flex items-center justify-center">
                <Search className="h-4 w-4 text-chart-2" />
              </div>
              <h3 className="font-semibold">Most Searched</h3>
            </div>
            <ul className="space-y-3">
              {[
                { query: 'Wheat Turkey', count: '2.4k' },
                { query: 'Sunflower Ukraine', count: '1.8k' },
                { query: 'Hazelnut Azerbaijan', count: '1.5k' },
                { query: 'Cotton Uzbekistan', count: '1.2k' },
                { query: 'Rice India', count: '980' },
              ].map((item, index) => (
                <li key={index}>
                  <button className="w-full flex items-center justify-between py-2 px-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors group text-left">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-5">
                        {index + 1}
                      </span>
                      <span className="font-medium group-hover:text-accent transition-colors">
                        {item.query}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {item.count} searches
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

