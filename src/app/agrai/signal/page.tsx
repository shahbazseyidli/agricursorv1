"use client";

import { useState } from 'react';
import { 
  Zap, TrendingUp, BarChart3, AlertCircle, CheckCircle, 
  Sparkles, Send, Loader2, Wheat, MapPin, Calendar, Target, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { operations } from '@/data/aiLayerData';
import { useAuth } from '@/contexts/AuthContext';
import { PaywallOverlay } from '@/components/ui/PaywallOverlay';

// Mock data for dropdowns
const countries = [
  { id: 'turkey', name: 'Türkiyə', nameEn: 'Turkey' },
  { id: 'azerbaijan', name: 'Azərbaycan', nameEn: 'Azerbaijan' },
  { id: 'georgia', name: 'Gürcüstan', nameEn: 'Georgia' },
  { id: 'iran', name: 'İran', nameEn: 'Iran' },
  { id: 'russia', name: 'Rusiya', nameEn: 'Russia' },
  { id: 'ukraine', name: 'Ukrayna', nameEn: 'Ukraine' },
];

const products = [
  { id: 'hazelnut', name: 'Fındıq', nameEn: 'Hazelnut' },
  { id: 'wheat', name: 'Buğda', nameEn: 'Wheat' },
  { id: 'tomato', name: 'Pomidor', nameEn: 'Tomato' },
  { id: 'apple', name: 'Alma', nameEn: 'Apple' },
  { id: 'potato', name: 'Kartof', nameEn: 'Potato' },
  { id: 'grape', name: 'Üzüm', nameEn: 'Grape' },
];

const years = [
  { id: '2024', name: '2024' },
  { id: '2023', name: '2023' },
  { id: '2022', name: '2022' },
  { id: '2021', name: '2021' },
];

const analysisTypes = [
  { id: 'price-change', name: 'Qiymət Dəyişikliyi', nameEn: 'Price Change', icon: TrendingUp },
  { id: 'comparison', name: 'Müqayisəli Analiz', nameEn: 'Comparative Analysis', icon: BarChart3 },
  { id: 'best-time', name: 'Optimal Satış Vaxtı', nameEn: 'Best Selling Time', icon: Calendar },
  { id: 'forecast', name: 'Qiymət Proqnozu', nameEn: 'Price Forecast', icon: Target },
  { id: 'market-report', name: 'Bazar Hesabatı', nameEn: 'Market Report', icon: FileText },
];

const interests = [
  { id: 'farmer', name: 'Fermer', nameEn: 'Farmer' },
  { id: 'trader', name: 'Ticarətçi', nameEn: 'Trader' },
  { id: 'exporter', name: 'İxracatçı', nameEn: 'Exporter' },
  { id: 'importer', name: 'İdxalatçı', nameEn: 'Importer' },
  { id: 'researcher', name: 'Tədqiqatçı', nameEn: 'Researcher' },
];

// Mock AI responses based on selections
const generateMockResponse = (
  country: string,
  product: string,
  year: string,
  analysisType: string,
  interest: string
) => {
  const countryData = countries.find(c => c.id === country);
  const productData = products.find(p => p.id === product);
  const analysisData = analysisTypes.find(a => a.id === analysisType);
  const interestData = interests.find(i => i.id === interest);

  const responses: Record<string, string> = {
    'price-change': `📊 **${productData?.name} Qiymət Analizi - ${countryData?.name} (${year})**

${countryData?.name}da ${productData?.name} qiymətləri ${year}-ci ildə əhəmiyyətli dəyişikliklərə məruz qalıb:

• **İllik artım:** +18.5% (orta bazar qiyməti)
• **Əsas səbəb:** İqlim dəyişikliyi və xəstəlik yayılması
• **Ən yüksək qiymət:** Oktyabr ayında 12.50 AZN/kg
• **Ən aşağı qiymət:** Mart ayında 8.20 AZN/kg

**${interestData?.name} üçün tövsiyə:**
${interest === 'farmer' ? 'Məhsulu oktyabr-noyabr aylarında satmaq optimal seçimdir. Anbar şəraiti varsa, məhsulu saxlayın.' :
  interest === 'trader' ? 'Mart-aprel aylarında alış, oktyabr-noyabr aylarında satış strategiyası tövsiyə olunur.' :
  interest === 'exporter' ? 'Avropa bazarlarına ixrac üçün optimal vaxt sentyabr-oktyabr aylarıdır.' :
  'Cari bazar tendensiyaları davam etdiyi halda 2025-ci ildə qiymətlərin stabil qalacağı gözlənilir.'}`,

    'comparison': `📈 **Müqayisəli Bazar Analizi - ${productData?.name}**

**${countryData?.name} vs Regional Bazarlar (${year}):**

| Ölkə | Orta Qiymət | Dəyişiklik |
|------|------------|-----------|
| ${countryData?.name} | 10.50 AZN/kg | +18.5% |
| Türkiyə | 9.80 AZN/kg | +12.3% |
| Rusiya | 11.20 AZN/kg | +8.7% |
| Ukrayna | 8.50 AZN/kg | +22.1% |

**Əsas müşahidələr:**
• ${countryData?.name} bazarı regional ortalamanın 8% üstündədir
• Ukrayna bazarı ən yüksək volatillik göstərir
• Türkiyə bazarı ən stabil qiymət dinamikasına malikdir

**${interestData?.name} üçün fırsat:**
${interest === 'trader' ? 'Arbitraj imkanı: Ukraynadan alış, ' + countryData?.name + 'da satış - 23% marja potensialı' :
  'Regional bazar diversifikasiyası tövsiyə olunur.'}`,

    'best-time': `⏰ **Optimal Satış Vaxtı Analizi - ${productData?.name}**

**${countryData?.name} Bazarı (${year} məlumatları əsasında):**

🟢 **Ən yaxşı satış dövrü:** Oktyabr 15 - Noyabr 30
   - Orta qiymət: 12.50 AZN/kg
   - Tələb: Yüksək (bayram mövsümü)

🟡 **Alternativ dövr:** Fevral 1 - Mart 15
   - Orta qiymət: 11.00 AZN/kg
   - Tələb: Orta (ehtiyat tükənməsi)

🔴 **Qaçınılacaq dövr:** İyun - Avqust
   - Orta qiymət: 8.20 AZN/kg
   - Tələb: Aşağı (yeni məhsul gözləntisi)

**${interestData?.name} üçün strategiya:**
${interest === 'farmer' ? 
  '- Məhsulun 60%-ni oktyabr-noyabrda satın\n- 30%-ni anbardan fevralda realizə edin\n- 10%-ni ehtiyat olaraq saxlayın' :
  '- Mövsüm əvvəli müqavilələr bağlayın\n- Forward kontraktlardan istifadə edin'}`,

    'forecast': `🔮 **${productData?.name} Qiymət Proqnozu - ${countryData?.name}**

**${parseInt(year) + 1}-ci il üçün AI proqnozu:**

| Dövr | Proqnoz Qiymət | Güvən İntervalı |
|------|---------------|-----------------|
| Q1 | 11.20 AZN/kg | 10.50 - 11.90 |
| Q2 | 9.80 AZN/kg | 9.20 - 10.40 |
| Q3 | 8.50 AZN/kg | 7.90 - 9.10 |
| Q4 | 12.80 AZN/kg | 12.00 - 13.60 |

**Proqnoz əsasları:**
• Tarixi qiymət tendensiyaları (5 illik data)
• İqlim proqnozları və məhsuldarlıq gözləntiləri
• Qlobal bazar dinamikası
• Valyuta kursları proqnozu

**Risk faktorları:**
⚠️ İqlim dəyişikliyi - Yüksək risk
⚠️ Xəstəlik yayılması - Orta risk
⚠️ İxrac məhdudiyyətləri - Aşağı risk

**${interestData?.name} üçün tövsiyə:**
Proqnozlar Q4-də yüksək qiymətlər göstərir. Forward satış müqavilələri bağlamaq tövsiyə olunur.`,

    'market-report': `📋 **Bazar Hesabatı - ${productData?.name} (${countryData?.name})**

**Xülasə:**
${countryData?.name}da ${productData?.name} bazarı ${year}-ci ildə dinamik inkişaf göstərib. İllik dövriyyə 2.5 milyard AZN-i keçib.

**Bazarın strukturu:**
• Yerli istehsal: 450,000 ton
• İxrac: 180,000 ton (40%)
• İdxal: 25,000 ton
• Daxili istehlak: 295,000 ton

**Əsas bazarlar:**
1. 🇷🇺 Rusiya - 45% ixrac payı
2. 🇹🇷 Türkiyə - 25% ixrac payı
3. 🇪🇺 Avropa - 20% ixrac payı
4. 🇮🇷 İran - 10% ixrac payı

**Tendensiyalar:**
✅ Keyfiyyət standartlarının yüksəlməsi
✅ Qablaşdırma və brendinq inkişafı
⚠️ Logistika xərclərinin artması
⚠️ Rəqabətin güclənməsi

**${interestData?.name} üçün nəticə:**
${interest === 'exporter' ? 'Avropa bazarına giriş üçün sertifikasiya vacibdir. GlobalG.A.P. sertifikatı tövsiyə olunur.' :
  interest === 'farmer' ? 'Kooperativ birləşmələr vasitəsilə birbaşa ixrac imkanlarını araşdırın.' :
  'Bazar analizi davam etdirilməli və mövsümi trendlər izlənilməlidir.'}`,
  };

  return responses[analysisType] || responses['price-change'];
};

export default function SignalPage() {
  const { isAuthenticated, openLoginModal } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  
  // Form state
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedAnalysisType, setSelectedAnalysisType] = useState('');
  const [selectedInterest, setSelectedInterest] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-market-up bg-market-up/10';
      case 'paused': return 'text-market-warning bg-market-warning/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'price-alert': return AlertCircle;
      case 'trend-analysis': return TrendingUp;
      case 'forecast': return BarChart3;
      default: return Zap;
    }
  };

  const canGenerate = selectedCountry && selectedProduct && selectedYear && selectedAnalysisType;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    
    setIsGenerating(true);
    setAiResponse(null);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const response = generateMockResponse(
      selectedCountry,
      selectedProduct,
      selectedYear,
      selectedAnalysisType,
      selectedInterest || 'researcher'
    );
    
    setAiResponse(response);
    setIsGenerating(false);
  };

  const handleReset = () => {
    setSelectedCountry('');
    setSelectedProduct('');
    setSelectedYear('');
    setSelectedAnalysisType('');
    setSelectedInterest('');
    setAiResponse(null);
  };

  return (
    <div className="space-y-8">
      {/* AI Analysis Tool */}
      <div className="premium-card p-6 ring-2 ring-ai-accent/30">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-ai-accent/10 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-ai-accent" />
          </div>
          <div>
            <h2 className="text-xl font-bold">AI Bazar Analizi</h2>
            <p className="text-sm text-muted-foreground">
              Parametrləri seçin və AI-dan xüsusi analiz alın
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {/* Country Select */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Ölkə
            </label>
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger>
                <SelectValue placeholder="Ölkə seçin" />
              </SelectTrigger>
              <SelectContent>
                {countries.map(country => (
                  <SelectItem key={country.id} value={country.id}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Product Select */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Wheat className="h-4 w-4 text-muted-foreground" />
              Məhsul
            </label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger>
                <SelectValue placeholder="Məhsul seçin" />
              </SelectTrigger>
              <SelectContent>
                {products.map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year Select */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              İl
            </label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="İl seçin" />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Analysis Type Select */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Analiz Növü
            </label>
            <Select value={selectedAnalysisType} onValueChange={setSelectedAnalysisType}>
              <SelectTrigger>
                <SelectValue placeholder="Analiz seçin" />
              </SelectTrigger>
              <SelectContent>
                {analysisTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Interest Select */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              Maraq (Rol)
            </label>
            <Select value={selectedInterest} onValueChange={setSelectedInterest}>
              <SelectTrigger>
                <SelectValue placeholder="Rol seçin (opsional)" />
              </SelectTrigger>
              <SelectContent>
                {interests.map(interest => (
                  <SelectItem key={interest.id} value={interest.id}>
                    {interest.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Button 
                onClick={handleGenerate}
                disabled={!canGenerate || isGenerating}
                className="bg-ai-accent hover:bg-ai-accent/90 text-ai"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analiz hazırlanır...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Analiz Al
                  </>
                )}
              </Button>
              {aiResponse && (
                <Button variant="outline" onClick={handleReset}>
                  Sıfırla
                </Button>
              )}
            </>
          ) : (
            <Button onClick={openLoginModal} className="bg-ai-accent hover:bg-ai-accent/90 text-ai">
              <Sparkles className="h-4 w-4 mr-2" />
              Analiz almaq üçün daxil olun
            </Button>
          )}
          
          {!canGenerate && isAuthenticated && (
            <span className="text-sm text-muted-foreground">
              Zəruri sahələri doldurun: Ölkə, Məhsul, İl, Analiz Növü
            </span>
          )}
        </div>

        {/* AI Response */}
        {aiResponse && (
          <div className="mt-6 p-6 rounded-xl bg-ai/50 border border-ai-border">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-ai-accent" />
              <span className="font-semibold text-ai-accent">AI Cavabı</span>
            </div>
            <div className="prose prose-sm prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-foreground">
                {aiResponse.split('\n').map((line, i) => {
                  // Handle headers
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return <p key={i} className="font-bold text-lg mt-4 mb-2">{line.replace(/\*\*/g, '')}</p>;
                  }
                  // Handle bullet points
                  if (line.startsWith('•') || line.startsWith('-') || line.startsWith('✅') || line.startsWith('⚠️') || line.startsWith('🟢') || line.startsWith('🟡') || line.startsWith('🔴')) {
                    return <p key={i} className="ml-4 my-1">{line}</p>;
                  }
                  // Handle table headers
                  if (line.startsWith('|') && line.includes('---')) {
                    return null;
                  }
                  // Handle table rows
                  if (line.startsWith('|')) {
                    const cells = line.split('|').filter(c => c.trim());
                    return (
                      <div key={i} className="grid grid-cols-3 gap-2 py-1 border-b border-border/50">
                        {cells.map((cell, j) => (
                          <span key={j} className="text-sm">{cell.trim()}</span>
                        ))}
                      </div>
                    );
                  }
                  // Handle numbered items
                  if (/^\d+\./.test(line)) {
                    return <p key={i} className="ml-4 my-1">{line}</p>;
                  }
                  // Handle emojis at start
                  if (/^[📊📈⏰🔮📋]/.test(line)) {
                    return <h3 key={i} className="text-lg font-bold mt-4 mb-2">{line.replace(/\*\*/g, '')}</h3>;
                  }
                  // Regular text
                  return line.trim() ? <p key={i} className="my-2">{line.replace(/\*\*/g, '')}</p> : <br key={i} />;
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Existing Signals Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Siqnalları</h2>
          <p className="text-muted-foreground">Avtomatlaşdırılmış izləmə və siqnallar</p>
        </div>
        {isAuthenticated && (
          <Button className="bg-ai-accent hover:bg-ai-accent/90 text-ai">
            <Zap className="h-4 w-4 mr-2" />
            Yeni Siqnal
          </Button>
        )}
      </div>

      {!isAuthenticated ? (
        <PaywallOverlay 
          title="AI Siqnalları"
          description="Avtomatlaşdırılmış alertlər və analizlər qurmaq üçün daxil olun"
        >
          <div className="space-y-4">
            {operations.slice(0, 2).map((op) => (
              <div key={op.id} className="premium-card p-6">
                <h3 className="font-semibold">{op.title}</h3>
                <p className="text-sm text-muted-foreground">{op.description}</p>
              </div>
            ))}
          </div>
        </PaywallOverlay>
      ) : (
        <div className="space-y-4">
          {operations.map((op) => {
            const TypeIcon = getTypeIcon(op.type);
            return (
              <div key={op.id} className="premium-card p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-ai-accent/10 flex items-center justify-center shrink-0">
                      <TypeIcon className="h-6 w-6 text-ai-accent" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{op.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(op.status)}`}>
                          {op.status === 'active' ? 'Aktiv' : op.status === 'paused' ? 'Dayandırılıb' : 'Tamamlandı'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{op.description}</p>
                      {op.results && (
                        <p className="text-sm text-ai-accent flex items-center gap-1 mt-2">
                          <CheckCircle className="h-4 w-4" />
                          {op.results}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>Son işləmə</p>
                    <p className="font-medium text-foreground">{op.lastRun}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
