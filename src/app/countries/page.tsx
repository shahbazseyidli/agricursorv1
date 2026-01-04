"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Grid, List } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { countries, regions } from '@/data/mockData';

export default function CountriesPage() {
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('All Regions');
  const [view, setView] = useState<'table' | 'grid'>('table');

  const filteredCountries = countries.filter((country) => {
    const matchesSearch = country.name.toLowerCase().includes(search.toLowerCase());
    const matchesRegion = region === 'All Regions' || country.region === region;
    return matchesSearch && matchesRegion;
  });

  return (
    <Layout>
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-2">Countries</h1>
          <p className="text-muted-foreground">
            Browse market data from 50+ countries worldwide
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-border bg-background sticky top-16 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-wrap gap-3 items-center">
              <Input
                placeholder="Search countries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64"
              />
              
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    <th>Country</th>
                    <th>Region</th>
                    <th className="text-right">Products</th>
                    <th className="text-right">Markets</th>
                    <th className="text-right">Coverage</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCountries.map((country) => (
                    <tr key={country.id} className="group">
                      <td>
                        <Link 
                          href={`/countries/${country.id}`}
                          className="flex items-center gap-2 font-medium text-foreground hover:text-accent transition-colors"
                        >
                          <span className="text-xl">{country.flag}</span>
                          {country.name}
                        </Link>
                      </td>
                      <td>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                          {country.region}
                        </span>
                      </td>
                      <td className="text-right tabular-nums">{country.products}</td>
                      <td className="text-right tabular-nums">{country.markets}</td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-accent rounded-full" 
                              style={{ width: `${country.coverage}%` }} 
                            />
                          </div>
                          <span className="text-sm tabular-nums text-muted-foreground w-10">
                            {country.coverage}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <Link 
                          href={`/countries/${country.id}`}
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
            {filteredCountries.map((country) => (
              <Link 
                key={country.id}
                href={`/countries/${country.id}`}
                className="premium-card p-6 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-3xl">{country.flag}</span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="font-semibold text-lg mb-1 group-hover:text-accent transition-colors">
                  {country.name}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                  {country.region}
                </span>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Products</span>
                    <span className="font-medium text-foreground">{country.products}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Markets</span>
                    <span className="font-medium text-foreground">{country.markets}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Coverage</span>
                    <span className="font-medium text-foreground">{country.coverage}%</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {filteredCountries.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No countries found matching your criteria.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
