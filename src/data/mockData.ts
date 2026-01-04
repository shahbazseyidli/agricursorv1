// Mock data for AgriPrice/Agrai platform

export interface MarketData {
  id: string;
  product: string;
  country: string;
  market: string;
  price: number;
  currency: string;
  unit: string;
  weekChange: number;
  monthChange: number;
  aiSignal: 'bullish' | 'bearish' | 'neutral' | 'warning';
  stage: 'producer' | 'wholesale' | 'retail';
  source: string;
  date: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  countries: number;
  coverage: number;
  sources: number;
  image?: string;
}

export interface Country {
  id: string;
  name: string;
  code: string;
  region: string;
  products: number;
  markets: number;
  coverage: number;
  flag: string;
}

export interface PriceDataPoint {
  date: string;
  market: string;
  stage: 'producer' | 'wholesale' | 'retail';
  min: number;
  avg: number;
  max: number;
  currency: string;
  unit: string;
  source: string;
}

export interface AIBrief {
  id: string;
  title: string;
  type: 'weekly' | 'alert' | 'analysis';
  summary: string;
  date: string;
  tags: string[];
}

export const liveMarketData: MarketData[] = [
  {
    id: '1',
    product: 'Wheat',
    country: 'Azerbaijan',
    market: 'Baku Central',
    price: 285.50,
    currency: 'USD',
    unit: 'MT',
    weekChange: 2.3,
    monthChange: 5.8,
    aiSignal: 'bullish',
    stage: 'wholesale',
    source: 'Local Market',
    date: '2024-01-04'
  },
  {
    id: '2',
    product: 'Tomato',
    country: 'Turkey',
    market: 'Antalya',
    price: 1.85,
    currency: 'USD',
    unit: 'KG',
    weekChange: -4.2,
    monthChange: -12.5,
    aiSignal: 'bearish',
    stage: 'producer',
    source: 'FAO/FPMA',
    date: '2024-01-04'
  },
  {
    id: '3',
    product: 'Hazelnut',
    country: 'Turkey',
    market: 'Giresun',
    price: 6850,
    currency: 'USD',
    unit: 'MT',
    weekChange: 0.8,
    monthChange: 15.2,
    aiSignal: 'bullish',
    stage: 'producer',
    source: 'Eurostat',
    date: '2024-01-04'
  },
  {
    id: '4',
    product: 'Potato',
    country: 'Georgia',
    market: 'Tbilisi',
    price: 0.42,
    currency: 'USD',
    unit: 'KG',
    weekChange: -1.5,
    monthChange: 2.1,
    aiSignal: 'neutral',
    stage: 'retail',
    source: 'Local Market',
    date: '2024-01-04'
  },
  {
    id: '5',
    product: 'Sunflower Oil',
    country: 'Ukraine',
    market: 'Odessa',
    price: 1050,
    currency: 'USD',
    unit: 'MT',
    weekChange: 8.5,
    monthChange: 22.3,
    aiSignal: 'warning',
    stage: 'wholesale',
    source: 'FAO/FPMA',
    date: '2024-01-04'
  },
  {
    id: '6',
    product: 'Cotton',
    country: 'Uzbekistan',
    market: 'Tashkent',
    price: 2150,
    currency: 'USD',
    unit: 'MT',
    weekChange: 1.2,
    monthChange: 3.8,
    aiSignal: 'neutral',
    stage: 'producer',
    source: 'Government',
    date: '2024-01-04'
  },
  {
    id: '7',
    product: 'Apple',
    country: 'Poland',
    market: 'Warsaw',
    price: 0.65,
    currency: 'USD',
    unit: 'KG',
    weekChange: -2.8,
    monthChange: -8.5,
    aiSignal: 'bearish',
    stage: 'wholesale',
    source: 'Eurostat',
    date: '2024-01-04'
  },
  {
    id: '8',
    product: 'Rice',
    country: 'India',
    market: 'Mumbai',
    price: 520,
    currency: 'USD',
    unit: 'MT',
    weekChange: 3.1,
    monthChange: 7.2,
    aiSignal: 'bullish',
    stage: 'wholesale',
    source: 'FAO/FPMA',
    date: '2024-01-04'
  }
];

export const products: Product[] = [
  { id: 'wheat', name: 'Wheat', category: 'Grains', countries: 45, coverage: 92, sources: 12 },
  { id: 'corn', name: 'Corn', category: 'Grains', countries: 38, coverage: 88, sources: 10 },
  { id: 'rice', name: 'Rice', category: 'Grains', countries: 52, coverage: 95, sources: 15 },
  { id: 'soybean', name: 'Soybean', category: 'Oilseeds', countries: 28, coverage: 85, sources: 8 },
  { id: 'sunflower', name: 'Sunflower', category: 'Oilseeds', countries: 22, coverage: 78, sources: 7 },
  { id: 'cotton', name: 'Cotton', category: 'Fibers', countries: 18, coverage: 72, sources: 6 },
  { id: 'tomato', name: 'Tomato', category: 'Vegetables', countries: 42, coverage: 90, sources: 11 },
  { id: 'potato', name: 'Potato', category: 'Vegetables', countries: 48, coverage: 93, sources: 14 },
  { id: 'onion', name: 'Onion', category: 'Vegetables', countries: 40, coverage: 87, sources: 9 },
  { id: 'apple', name: 'Apple', category: 'Fruits', countries: 35, coverage: 82, sources: 8 },
  { id: 'orange', name: 'Orange', category: 'Fruits', countries: 30, coverage: 79, sources: 7 },
  { id: 'hazelnut', name: 'Hazelnut', category: 'Nuts', countries: 12, coverage: 68, sources: 5 },
  { id: 'almond', name: 'Almond', category: 'Nuts', countries: 15, coverage: 71, sources: 6 },
  { id: 'coffee', name: 'Coffee', category: 'Beverages', countries: 25, coverage: 80, sources: 8 },
  { id: 'tea', name: 'Tea', category: 'Beverages', countries: 20, coverage: 75, sources: 6 },
];

export const countries: Country[] = [
  { id: 'azerbaijan', name: 'Azerbaijan', code: 'AZ', region: 'Caucasus', products: 45, markets: 12, coverage: 88, flag: '🇦🇿' },
  { id: 'georgia', name: 'Georgia', code: 'GE', region: 'Caucasus', products: 38, markets: 8, coverage: 82, flag: '🇬🇪' },
  { id: 'turkey', name: 'Turkey', code: 'TR', region: 'Middle East', products: 120, markets: 45, coverage: 95, flag: '🇹🇷' },
  { id: 'ukraine', name: 'Ukraine', code: 'UA', region: 'Eastern Europe', products: 85, markets: 28, coverage: 90, flag: '🇺🇦' },
  { id: 'russia', name: 'Russia', code: 'RU', region: 'Eastern Europe', products: 110, markets: 52, coverage: 92, flag: '🇷🇺' },
  { id: 'kazakhstan', name: 'Kazakhstan', code: 'KZ', region: 'Central Asia', products: 55, markets: 15, coverage: 78, flag: '🇰🇿' },
  { id: 'uzbekistan', name: 'Uzbekistan', code: 'UZ', region: 'Central Asia', products: 48, markets: 12, coverage: 75, flag: '🇺🇿' },
  { id: 'india', name: 'India', code: 'IN', region: 'South Asia', products: 150, markets: 85, coverage: 96, flag: '🇮🇳' },
  { id: 'pakistan', name: 'Pakistan', code: 'PK', region: 'South Asia', products: 72, markets: 25, coverage: 80, flag: '🇵🇰' },
  { id: 'poland', name: 'Poland', code: 'PL', region: 'Eastern Europe', products: 65, markets: 20, coverage: 88, flag: '🇵🇱' },
  { id: 'germany', name: 'Germany', code: 'DE', region: 'Western Europe', products: 80, markets: 35, coverage: 94, flag: '🇩🇪' },
  { id: 'france', name: 'France', code: 'FR', region: 'Western Europe', products: 95, markets: 42, coverage: 95, flag: '🇫🇷' },
];

export const aiBriefs: AIBrief[] = [
  {
    id: '1',
    title: 'Global Grain Weekly',
    type: 'weekly',
    summary: 'Wheat prices surge 5.8% amid Black Sea supply concerns. Corn futures remain stable with strong US harvest projections.',
    date: '2024-01-04',
    tags: ['Wheat', 'Corn', 'Black Sea']
  },
  {
    id: '2',
    title: 'Caucasus Agri Watch',
    type: 'weekly',
    summary: 'Azerbaijan hazelnut exports up 12% YoY. Georgian wine production reaches 5-year high.',
    date: '2024-01-04',
    tags: ['Azerbaijan', 'Georgia', 'Hazelnut']
  },
  {
    id: '3',
    title: 'Top 5 Price Anomalies',
    type: 'alert',
    summary: 'Sunflower oil in Ukraine shows unusual volatility. Tomato prices in Turkey dropping faster than seasonal norms.',
    date: '2024-01-04',
    tags: ['Anomaly', 'Ukraine', 'Turkey']
  }
];

export const generatePriceHistory = (product: string, days: number = 90): PriceDataPoint[] => {
  const markets = ['Baku Central', 'Ganja Market', 'Sumgait Wholesale'];
  const stages: ('producer' | 'wholesale' | 'retail')[] = ['producer', 'wholesale', 'retail'];
  const data: PriceDataPoint[] = [];
  
  const basePrice = Math.random() * 100 + 50;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    markets.forEach(market => {
      stages.forEach(stage => {
        const stageMultiplier = stage === 'producer' ? 1 : stage === 'wholesale' ? 1.15 : 1.35;
        const volatility = 0.05;
        const trend = Math.sin(i / 30) * 10;
        const noise = (Math.random() - 0.5) * volatility * basePrice;
        
        const avg = (basePrice + trend + noise) * stageMultiplier;
        const spread = avg * 0.1;
        
        data.push({
          date: date.toISOString().split('T')[0],
          market,
          stage,
          min: Math.round((avg - spread) * 100) / 100,
          avg: Math.round(avg * 100) / 100,
          max: Math.round((avg + spread) * 100) / 100,
          currency: 'USD',
          unit: 'MT',
          source: ['FAO/FPMA', 'Local Market', 'Eurostat'][Math.floor(Math.random() * 3)]
        });
      });
    });
  }
  
  return data;
};

export const productCategories = [
  'All Categories',
  'Grains',
  'Oilseeds',
  'Vegetables',
  'Fruits',
  'Nuts',
  'Fibers',
  'Beverages'
];

export const regions = [
  'All Regions',
  'Caucasus',
  'Central Asia',
  'Eastern Europe',
  'Western Europe',
  'Middle East',
  'South Asia'
];

export const aiInsights = {
  tableView: [
    'Sunflower oil showing 22.3% MoM increase - highest volatility in region',
    'Hazelnut prices stable despite seasonal pressure - Turkey supply strong',
    'Wheat bullish signal driven by Black Sea logistics concerns'
  ],
  lineView: [
    'Overall upward trend detected across 65% of tracked commodities',
    'Seasonal drop in tomato prices 15% steeper than 5-year average',
    'Rice prices breaking out of 3-month consolidation range'
  ],
  scatterView: [
    'Outlier detected: Ukraine sunflower oil deviates 2.3σ from regional mean',
    'Price clustering observed in Caucasus grain markets',
    'Correlation: Potato/Onion prices show 0.78 correlation with 2-month lag'
  ]
};

