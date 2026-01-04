"use client";

import { Layout } from '@/components/layout/Layout';
import { Database, Globe, FileCheck, Clock, Shield, ExternalLink } from 'lucide-react';

const dataSources = [
  {
    name: 'FAO / FPMA',
    description: 'Food and Agriculture Organization Food Price Monitoring and Analysis Tool',
    coverage: 'Global',
    frequency: 'Weekly',
    type: 'International Organization',
    url: 'https://fpma.fao.org'
  },
  {
    name: 'Eurostat',
    description: 'Statistical Office of the European Union agricultural price indices',
    coverage: 'EU Countries',
    frequency: 'Monthly',
    type: 'Government',
    url: 'https://ec.europa.eu/eurostat'
  },
  {
    name: 'Local Market Data',
    description: 'Direct collection from wholesale and retail markets across tracked countries',
    coverage: '50+ Countries',
    frequency: 'Daily',
    type: 'Primary Collection',
    url: '#'
  },
  {
    name: 'National Statistics Offices',
    description: 'Official government statistics from national statistical agencies',
    coverage: 'By Country',
    frequency: 'Monthly',
    type: 'Government',
    url: '#'
  },
  {
    name: 'Trade Associations',
    description: 'Industry associations and commodity boards providing market intelligence',
    coverage: 'Commodity Specific',
    frequency: 'Weekly',
    type: 'Industry',
    url: '#'
  },
  {
    name: 'Satellite & Weather Data',
    description: 'Remote sensing data for crop monitoring and yield forecasting',
    coverage: 'Global',
    frequency: 'Daily',
    type: 'Technology',
    url: '#'
  }
];

export default function DataSourcesPage() {
  return (
    <Layout>
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-2">Data Sources</h1>
          <p className="text-muted-foreground max-w-2xl">
            Transparency and credibility are at the core of our platform. Learn about the sources 
            that power our agricultural intelligence.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Key Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <div className="premium-card p-6">
            <Database className="h-8 w-8 text-accent mb-3" />
            <p className="text-3xl font-bold mb-1">15+</p>
            <p className="text-sm text-muted-foreground">Data Sources</p>
          </div>
          <div className="premium-card p-6">
            <Globe className="h-8 w-8 text-accent mb-3" />
            <p className="text-3xl font-bold mb-1">50+</p>
            <p className="text-sm text-muted-foreground">Countries Covered</p>
          </div>
          <div className="premium-card p-6">
            <FileCheck className="h-8 w-8 text-accent mb-3" />
            <p className="text-3xl font-bold mb-1">1M+</p>
            <p className="text-sm text-muted-foreground">Data Points Monthly</p>
          </div>
          <div className="premium-card p-6">
            <Clock className="h-8 w-8 text-accent mb-3" />
            <p className="text-3xl font-bold mb-1">24h</p>
            <p className="text-sm text-muted-foreground">Max Update Delay</p>
          </div>
        </div>

        {/* Sources Table */}
        <h2 className="text-2xl font-bold mb-6">Primary Data Sources</h2>
        <div className="premium-card overflow-hidden mb-12">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Description</th>
                  <th>Coverage</th>
                  <th>Frequency</th>
                  <th>Type</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {dataSources.map((source, i) => (
                  <tr key={i}>
                    <td className="font-medium">{source.name}</td>
                    <td className="text-muted-foreground max-w-xs">{source.description}</td>
                    <td>{source.coverage}</td>
                    <td>{source.frequency}</td>
                    <td>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                        {source.type}
                      </span>
                    </td>
                    <td>
                      {source.url !== '#' && (
                        <a 
                          href={source.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-accent hover:text-accent/80"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Methodology */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className="text-2xl font-bold mb-4">Methodology</h2>
            <div className="prose prose-sm text-muted-foreground">
              <p className="mb-4">
                Our data pipeline combines automated collection, manual verification, and AI-powered 
                quality assurance to ensure accuracy and timeliness.
              </p>
              <ul className="space-y-2">
                <li>• Automated web scraping and API integration for real-time data</li>
                <li>• Manual verification for critical price points and anomalies</li>
                <li>• Statistical outlier detection and correction</li>
                <li>• Cross-source validation for improved accuracy</li>
                <li>• Currency normalization to USD at daily exchange rates</li>
                <li>• Unit standardization to metric system</li>
              </ul>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">Quality Assurance</h2>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 flex items-start gap-4">
                <Shield className="h-5 w-5 text-accent mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Data Validation</p>
                  <p className="text-sm text-muted-foreground">
                    Each data point undergoes automated validation against historical ranges and peer comparisons.
                  </p>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 flex items-start gap-4">
                <Shield className="h-5 w-5 text-accent mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Source Attribution</p>
                  <p className="text-sm text-muted-foreground">
                    Every price point is linked to its original source for full traceability.
                  </p>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 flex items-start gap-4">
                <Shield className="h-5 w-5 text-accent mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Regular Audits</p>
                  <p className="text-sm text-muted-foreground">
                    Monthly data quality audits ensure ongoing accuracy and completeness.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="p-6 rounded-lg bg-market-warning/5 border border-market-warning/20">
          <h3 className="font-semibold mb-2 text-market-warning">Disclaimer</h3>
          <p className="text-sm text-muted-foreground">
            The information provided on this platform is for informational purposes only and should not 
            be considered as financial or trading advice. While we strive for accuracy, data may be 
            delayed or contain errors. Always verify critical information with primary sources before 
            making business decisions. Past performance is not indicative of future results. Agricultural 
            markets are subject to various risks including weather, policy changes, and market volatility.
          </p>
        </div>
      </div>
    </Layout>
  );
}
