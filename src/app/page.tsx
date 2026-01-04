"use client";

import { Layout } from '@/components/layout/Layout';
import { AIHero } from '@/components/home/AIHero';
import { LiveMarketTable } from '@/components/home/LiveMarketTable';
import { AIBriefs } from '@/components/home/AIBriefs';
import { TrendingTables } from '@/components/home/TrendingTables';

export default function HomePage() {
  return (
    <Layout>
      <AIHero />
      <LiveMarketTable />
      <AIBriefs />
      <TrendingTables />
    </Layout>
  );
}
