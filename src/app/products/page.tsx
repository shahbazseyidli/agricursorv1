"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Grid, List } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { products, productCategories } from '@/data/mockData';

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [onlyWithData, setOnlyWithData] = useState(false);
  const [view, setView] = useState<'table' | 'grid'>('table');

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'All Categories' || product.category === category;
    const matchesData = !onlyWithData || product.coverage > 70;
    return matchesSearch && matchesCategory && matchesData;
  });

  return (
    <Layout>
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-2">Products</h1>
          <p className="text-muted-foreground">
            Explore agricultural commodities across 50+ countries
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-border bg-background sticky top-16 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative">
                <Input
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-64 pl-4"
                />
              </div>
              
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {productCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Switch
                  id="only-data"
                  checked={onlyWithData}
                  onCheckedChange={setOnlyWithData}
                />
                <Label htmlFor="only-data" className="text-sm text-muted-foreground">
                  Only with data
                </Label>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={view === 'table' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setView('table')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={view === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setView('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {view === 'table' ? (
          <div className="premium-card overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th className="text-right">Countries</th>
                    <th className="text-right">Coverage</th>
                    <th className="text-right">Sources</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="group">
                      <td>
                        <Link 
                          href={`/products/${product.id}`}
                          className="font-medium text-foreground hover:text-accent transition-colors"
                        >
                          {product.name}
                        </Link>
                      </td>
                      <td>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                          {product.category}
                        </span>
                      </td>
                      <td className="text-right tabular-nums">{product.countries}</td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-accent rounded-full" 
                              style={{ width: `${product.coverage}%` }} 
                            />
                          </div>
                          <span className="text-sm tabular-nums text-muted-foreground w-10">
                            {product.coverage}%
                          </span>
                        </div>
                      </td>
                      <td className="text-right tabular-nums">{product.sources}</td>
                      <td>
                        <Link 
                          href={`/products/${product.id}`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ArrowUpRight className="h-4 w-4 text-accent" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <Link 
                key={product.id}
                href={`/products/${product.id}`}
                className="premium-card p-6 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                    {product.category}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="font-semibold text-lg mb-3 group-hover:text-accent transition-colors">
                  {product.name}
                </h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Countries</span>
                    <span className="font-medium text-foreground">{product.countries}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Coverage</span>
                    <span className="font-medium text-foreground">{product.coverage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sources</span>
                    <span className="font-medium text-foreground">{product.sources}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products found matching your criteria.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
