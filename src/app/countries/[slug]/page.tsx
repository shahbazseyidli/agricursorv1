"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, MapPin, BarChart3, Package, Store } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIInsightCard } from '@/components/ui/AIInsightCard';
import { PriceChange } from '@/components/ui/PriceChange';
import { countries, products, liveMarketData } from '@/data/mockData';

export default function CountryDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const country = countries.find(c => c.id === slug) || countries[0];
  const [activeTab, setActiveTab] = useState('overview');

  const countryProducts = products.slice(0, 8);

  return (
    <Layout>
      {/* Hero */}
      <div className="bg-gradient-to-b from-muted/50 to-background border-b border-border">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/countries" className="hover:text-foreground transition-colors">Countries</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">{country.name}</span>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="text-6xl">{country.flag}</div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{country.name}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {country.region}
                </span>
                <span className="flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  {country.products} Products
                </span>
                <span className="flex items-center gap-1">
                  <Store className="h-4 w-4" />
                  {country.markets} Markets
                </span>
                <span className="flex items-center gap-1">
                  <BarChart3 className="h-4 w-4" />
                  {country.coverage}% Coverage
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent mb-6">
            <TabsTrigger 
              value="overview" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent px-4 py-3"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="price-overview"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent px-4 py-3"
            >
              Price Overview
            </TabsTrigger>
            <TabsTrigger 
              value="products"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent px-4 py-3"
            >
              Products
            </TabsTrigger>
            <TabsTrigger 
              value="market-structure"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent px-4 py-3"
            >
              Market Structure
            </TabsTrigger>
            <TabsTrigger 
              value="ai-insights"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent px-4 py-3"
            >
              AI Insights
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <AIInsightCard
                  title="AI Country Profile"
                  insights={[
                    `${country.name} is a key agricultural market in the ${country.region} region with ${country.products} tracked commodities.`,
                    'The country shows strong production in grains, fruits, and nuts.',
                    'Export capabilities have increased 15% over the past year.',
                    'Market infrastructure continues to modernize with improved data transparency.'
                  ]}
                  className="mb-6"
                />

                <div className="premium-card p-6">
                  <h3 className="font-semibold mb-4">Key Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Agricultural GDP</p>
                      <p className="text-2xl font-bold">$12.4B</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Export Volume</p>
                      <p className="text-2xl font-bold">2.8M MT</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Data Sources</p>
                      <p className="text-2xl font-bold">8</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Update Frequency</p>
                      <p className="text-2xl font-bold">Daily</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="premium-card p-6">
                  <h3 className="font-semibold mb-4">Top Products</h3>
                  <ul className="space-y-3">
                    {countryProducts.slice(0, 5).map((product) => (
                      <li key={product.id}>
                        <Link 
                          href={`/products/${product.id}`}
                          className="flex items-center justify-between py-2 hover:text-accent transition-colors"
                        >
                          <span className="font-medium">{product.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                            {product.category}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Price Overview Tab */}
          <TabsContent value="price-overview">
            <div className="premium-card overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Market</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">WoW</th>
                    <th className="text-right">MoM</th>
                    <th>Stage</th>
                  </tr>
                </thead>
                <tbody>
                  {liveMarketData.slice(0, 10).map((item, i) => (
                    <tr key={i}>
                      <td>
                        <Link 
                          href={`/products/${item.product.toLowerCase()}`}
                          className="font-medium hover:text-accent transition-colors"
                        >
                          {item.product}
                        </Link>
                      </td>
                      <td className="text-muted-foreground">{item.market}</td>
                      <td className="text-right tabular-nums font-medium">
                        {item.price.toLocaleString()} {item.currency}/{item.unit}
                      </td>
                      <td className="text-right">
                        <PriceChange value={item.weekChange} />
                      </td>
                      <td className="text-right">
                        <PriceChange value={item.monthChange} />
                      </td>
                      <td>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize">
                          {item.stage}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {countryProducts.map((product) => (
                <Link 
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="premium-card p-6 group"
                >
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                    {product.category}
                  </span>
                  <h3 className="font-semibold text-lg mt-3 mb-2 group-hover:text-accent transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{product.sources} sources</span>
                    <span>{product.coverage}% coverage</span>
                  </div>
                </Link>
              ))}
            </div>
          </TabsContent>

          {/* Market Structure Tab */}
          <TabsContent value="market-structure">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="premium-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                    <Package className="h-5 w-5 text-chart-3" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Producer Markets</h3>
                    <p className="text-sm text-muted-foreground">Farm gate prices</p>
                  </div>
                </div>
                <div className="text-3xl font-bold mb-2">{Math.floor(country.markets * 0.4)}</div>
                <p className="text-sm text-muted-foreground">Active markets tracked</p>
              </div>

              <div className="premium-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-chart-1/10 flex items-center justify-center">
                    <Store className="h-5 w-5 text-chart-1" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Wholesale Markets</h3>
                    <p className="text-sm text-muted-foreground">Bulk trading prices</p>
                  </div>
                </div>
                <div className="text-3xl font-bold mb-2">{Math.floor(country.markets * 0.35)}</div>
                <p className="text-sm text-muted-foreground">Active markets tracked</p>
              </div>

              <div className="premium-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-chart-2" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Retail Markets</h3>
                    <p className="text-sm text-muted-foreground">Consumer prices</p>
                  </div>
                </div>
                <div className="text-3xl font-bold mb-2">{Math.floor(country.markets * 0.25)}</div>
                <p className="text-sm text-muted-foreground">Active markets tracked</p>
              </div>
            </div>
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="ai-insights">
            <div className="grid md:grid-cols-2 gap-6">
              <AIInsightCard
                title="Market Stability"
                insights={[
                  'Overall market stability index: 7.2/10 (Good)',
                  'Price volatility has decreased 12% compared to last quarter.',
                  'Government price support mechanisms active for key staples.'
                ]}
              />
              <AIInsightCard
                title="Seasonal Patterns"
                insights={[
                  'Peak harvest season: August-October',
                  'Import dependency increases during Q1',
                  'Export windows align with European demand cycles'
                ]}
              />
              <AIInsightCard
                title="Risk Factors"
                insights={[
                  'Currency volatility presents moderate risk',
                  'Climate conditions favorable for current season',
                  'Infrastructure improvements reducing logistics costs'
                ]}
              />
              <AIInsightCard
                title="Trade Outlook"
                insights={[
                  'Export volume expected to grow 8% in 2024',
                  'New trade agreements expanding market access',
                  'Quality certifications improving premium positioning'
                ]}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

