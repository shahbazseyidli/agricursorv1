// AI Layer mock data

export interface DailyBrief {
  id: string;
  date: string;
  title: string;
  summary: string;
  keyPoints: string[];
  markets: string[];
  sentiment: 'positive' | 'negative' | 'mixed';
  readTime: string;
}

export interface MarketReport {
  id: string;
  title: string;
  type: 'weekly' | 'monthly' | 'quarterly' | 'special';
  date: string;
  summary: string;
  products: string[];
  regions: string[];
  pages: number;
  isPremium: boolean;
}

export interface Operation {
  id: string;
  title: string;
  type: 'price-alert' | 'trend-analysis' | 'forecast' | 'anomaly-detection';
  status: 'active' | 'paused' | 'completed';
  description: string;
  createdAt: string;
  lastRun: string;
  results?: string;
}

export const dailyBriefs: DailyBrief[] = [
  {
    id: '1',
    date: '2024-01-04',
    title: 'Günlük Bazar İcmalı: Taxıl Bazarlarında Yüksəliş',
    summary: 'Qara Dəniz regionunda taxıl qiymətləri artmağa davam edir. Ukrayna tədarükü ilə bağlı narahatlıqlar bazarı təsir edir.',
    keyPoints: [
      'Buğda qiymətləri 5.8% artıb - 3 aylıq zirvə',
      'Türkiyə fındıq ixracı 12% yüksəlib',
      'Azərbaycanda pomidor qiymətləri sabitdir',
      'Gürcüstan şərab istehsalı rekord səviyyədə'
    ],
    markets: ['Black Sea', 'Caucasus', 'Central Asia'],
    sentiment: 'positive',
    readTime: '3 dəq'
  },
  {
    id: '2',
    date: '2024-01-03',
    title: 'Qafqaz Kənd Təsərrüfatı: Həftəlik Təhlil',
    summary: 'Region üzrə kənd təsərrüfatı məhsullarının qiymət dinamikası və əsas trendlər.',
    keyPoints: [
      'Azərbaycan: Tərəvəz ixracı artıb',
      'Gürcüstan: Üzüm mövsümü başlayır',
      'Türkiyə: Fındıq bazarında stabillik',
      'İran: Meyvə qiymətləri enib'
    ],
    markets: ['Azerbaijan', 'Georgia', 'Turkey'],
    sentiment: 'mixed',
    readTime: '4 dəq'
  },
  {
    id: '3',
    date: '2024-01-02',
    title: 'Qlobal Taxıl Bazarları: Gündəlik Yeniləmə',
    summary: 'ABŞ və Avropa taxıl bazarlarından son xəbərlər və qiymət dəyişiklikləri.',
    keyPoints: [
      'Qarğıdalı fyuçersləri sabit qalır',
      'Düyü qiymətləri Hindistanda yüksəlir',
      'Avropa buğda idxalı azalıb',
      'Rusiya ixrac kvotası açıqlanıb'
    ],
    markets: ['USA', 'Europe', 'Russia', 'India'],
    sentiment: 'negative',
    readTime: '5 dəq'
  }
];

export const marketReports: MarketReport[] = [
  {
    id: '1',
    title: 'Qara Dəniz Taxıl Bazarı - Aylıq Hesabat',
    type: 'monthly',
    date: '2024-01',
    summary: 'Qara Dəniz regionunda taxıl bazarlarının ətraflı təhlili, qiymət proqnozları və ticarət axınları.',
    products: ['Wheat', 'Corn', 'Barley', 'Sunflower'],
    regions: ['Ukraine', 'Russia', 'Turkey', 'Romania'],
    pages: 45,
    isPremium: true
  },
  {
    id: '2',
    title: 'Qafqaz Kənd Təsərrüfatı İcmalı',
    type: 'weekly',
    date: '2024-W01',
    summary: 'Azərbaycan, Gürcüstan və Ermənistan kənd təsərrüfatı bazarlarının həftəlik xülasəsi.',
    products: ['Hazelnut', 'Tomato', 'Grape', 'Apple'],
    regions: ['Azerbaijan', 'Georgia', 'Armenia'],
    pages: 18,
    isPremium: false
  },
  {
    id: '3',
    title: 'Qlobal Fındıq Bazarı - Q4 2023',
    type: 'quarterly',
    date: '2023-Q4',
    summary: 'Dünya fındıq bazarının rüblik təhlili: Türkiyə, İtaliya, ABŞ istehsalı və qiymət trendləri.',
    products: ['Hazelnut'],
    regions: ['Turkey', 'Italy', 'USA', 'Azerbaijan'],
    pages: 62,
    isPremium: true
  },
  {
    id: '4',
    title: 'Ukrayna Müharibəsi: Kənd Təsərrüfatına Təsir',
    type: 'special',
    date: '2024-01',
    summary: 'Müharibənin qlobal ərzaq bazarlarına təsirinin xüsusi hesabatı.',
    products: ['Wheat', 'Sunflower Oil', 'Corn'],
    regions: ['Ukraine', 'Russia', 'Black Sea'],
    pages: 85,
    isPremium: true
  },
  {
    id: '5',
    title: 'Orta Asiya Pambıq Bazarı',
    type: 'monthly',
    date: '2024-01',
    summary: 'Özbəkistan, Tacikistan və Türkmənistan pambıq istehsalı və ticarəti.',
    products: ['Cotton'],
    regions: ['Uzbekistan', 'Tajikistan', 'Turkmenistan'],
    pages: 32,
    isPremium: false
  }
];

export const operations: Operation[] = [
  {
    id: '1',
    title: 'Buğda Qiymət Alerti - Azərbaycan',
    type: 'price-alert',
    status: 'active',
    description: 'Buğda qiyməti $300/MT-dən yuxarı olduqda xəbərdarlıq göndər',
    createdAt: '2024-01-01',
    lastRun: '2024-01-04',
    results: 'Son 24 saatda 2 alert göndərilib'
  },
  {
    id: '2',
    title: 'Fındıq Trend Analizi',
    type: 'trend-analysis',
    status: 'active',
    description: 'Türkiyə fındıq bazarının həftəlik trend analizi',
    createdAt: '2023-12-15',
    lastRun: '2024-01-04',
    results: 'Yüksəliş trendi davam edir (+15% MoM)'
  },
  {
    id: '3',
    title: 'Q1 2024 Proqnozu - Taxıllar',
    type: 'forecast',
    status: 'completed',
    description: 'İlk rüb üçün taxıl qiymətləri proqnozu',
    createdAt: '2023-12-20',
    lastRun: '2024-01-02',
    results: 'Proqnoz hazırdır: +8-12% artım gözlənilir'
  },
  {
    id: '4',
    title: 'Anomaliya Deteksiyası - Günəbaxan Yağı',
    type: 'anomaly-detection',
    status: 'active',
    description: 'Ukrayna günəbaxan yağı qiymətlərində anomaliyaları izlə',
    createdAt: '2024-01-02',
    lastRun: '2024-01-04',
    results: '1 anomaliya aşkarlandı: +22% sıçrayış'
  }
];

export const dataSources = [
  { name: 'FAO/FPMA', type: 'International', coverage: '180+ countries', updateFreq: 'Daily' },
  { name: 'Eurostat', type: 'Regional', coverage: 'EU 27 countries', updateFreq: 'Weekly' },
  { name: 'Local Markets', type: 'Direct', coverage: '50+ markets', updateFreq: 'Real-time' },
  { name: 'Government APIs', type: 'Official', coverage: '25 countries', updateFreq: 'Daily' },
  { name: 'Trade Partners', type: 'B2B', coverage: '100+ partners', updateFreq: 'Hourly' },
];

