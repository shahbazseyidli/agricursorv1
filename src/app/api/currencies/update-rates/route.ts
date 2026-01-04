import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// CBAR (Central Bank of Azerbaijan) - Official rates for AZN
// URL format: https://cbar.az/currencies/DD.MM.YYYY.xml
const CBAR_API_URL = "https://cbar.az/currencies";

// ExchangeRate-API - Free tier, 166 currencies, no API key required
// Docs: https://www.exchangerate-api.com/docs/free
const EXCHANGERATE_API_URL = "https://api.exchangerate-api.com/v4/latest/USD";

// Currency metadata (common currencies with proper symbols and names)
const CURRENCY_INFO: Record<string, { symbol: string; nameAz: string; nameEn: string }> = {
  AZN: { symbol: "₼", nameAz: "Azərbaycan Manatı", nameEn: "Azerbaijani Manat" },
  USD: { symbol: "$", nameAz: "ABŞ Dolları", nameEn: "US Dollar" },
  EUR: { symbol: "€", nameAz: "Avro", nameEn: "Euro" },
  GBP: { symbol: "£", nameAz: "İngilis Funt Sterlinqi", nameEn: "British Pound" },
  RUB: { symbol: "₽", nameAz: "Rusiya Rublu", nameEn: "Russian Ruble" },
  TRY: { symbol: "₺", nameAz: "Türk Lirəsi", nameEn: "Turkish Lira" },
  GEL: { symbol: "₾", nameAz: "Gürcü Larisi", nameEn: "Georgian Lari" },
  AED: { symbol: "د.إ", nameAz: "BƏƏ Dirhəmi", nameEn: "UAE Dirham" },
  CHF: { symbol: "Fr", nameAz: "İsveçrə Frankı", nameEn: "Swiss Franc" },
  CNY: { symbol: "¥", nameAz: "Çin Yuanı", nameEn: "Chinese Yuan" },
  JPY: { symbol: "¥", nameAz: "Yapon Yeni", nameEn: "Japanese Yen" },
  CAD: { symbol: "C$", nameAz: "Kanada Dolları", nameEn: "Canadian Dollar" },
  AUD: { symbol: "A$", nameAz: "Avstraliya Dolları", nameEn: "Australian Dollar" },
  NZD: { symbol: "NZ$", nameAz: "Yeni Zelandiya Dolları", nameEn: "New Zealand Dollar" },
  SEK: { symbol: "kr", nameAz: "İsveç Kronu", nameEn: "Swedish Krona" },
  NOK: { symbol: "kr", nameAz: "Norveç Kronu", nameEn: "Norwegian Krone" },
  DKK: { symbol: "kr", nameAz: "Danimarka Kronu", nameEn: "Danish Krone" },
  PLN: { symbol: "zł", nameAz: "Polşa Zlotısı", nameEn: "Polish Zloty" },
  CZK: { symbol: "Kč", nameAz: "Çexiya Kronu", nameEn: "Czech Koruna" },
  HUF: { symbol: "Ft", nameAz: "Macarıstan Forinti", nameEn: "Hungarian Forint" },
  RON: { symbol: "lei", nameAz: "Rumıniya Leyi", nameEn: "Romanian Leu" },
  BGN: { symbol: "лв", nameAz: "Bolqarıstan Levi", nameEn: "Bulgarian Lev" },
  HRK: { symbol: "kn", nameAz: "Xorvatiya Kunası", nameEn: "Croatian Kuna" },
  ISK: { symbol: "kr", nameAz: "İslandiya Kronu", nameEn: "Icelandic Króna" },
  BRL: { symbol: "R$", nameAz: "Braziliya Realı", nameEn: "Brazilian Real" },
  MXN: { symbol: "$", nameAz: "Meksika Pesosu", nameEn: "Mexican Peso" },
  HKD: { symbol: "HK$", nameAz: "Honq Konq Dolları", nameEn: "Hong Kong Dollar" },
  SGD: { symbol: "S$", nameAz: "Sinqapur Dolları", nameEn: "Singapore Dollar" },
  KRW: { symbol: "₩", nameAz: "Cənubi Koreya Vonu", nameEn: "South Korean Won" },
  INR: { symbol: "₹", nameAz: "Hindistan Rupisi", nameEn: "Indian Rupee" },
  IDR: { symbol: "Rp", nameAz: "İndoneziya Rupisi", nameEn: "Indonesian Rupiah" },
  MYR: { symbol: "RM", nameAz: "Malayziya Rinqiti", nameEn: "Malaysian Ringgit" },
  PHP: { symbol: "₱", nameAz: "Filippin Pesosu", nameEn: "Philippine Peso" },
  THB: { symbol: "฿", nameAz: "Tayland Batı", nameEn: "Thai Baht" },
  ZAR: { symbol: "R", nameAz: "Cənubi Afrika Randı", nameEn: "South African Rand" },
  ILS: { symbol: "₪", nameAz: "İsrail Şekeli", nameEn: "Israeli Shekel" },
  SAR: { symbol: "﷼", nameAz: "Səudiyyə Rialı", nameEn: "Saudi Riyal" },
  QAR: { symbol: "﷼", nameAz: "Qətər Rialı", nameEn: "Qatari Riyal" },
  KWD: { symbol: "د.ك", nameAz: "Küveyt Dinarı", nameEn: "Kuwaiti Dinar" },
  BYN: { symbol: "Br", nameAz: "Belarus Rublu", nameEn: "Belarusian Ruble" },
  KZT: { symbol: "₸", nameAz: "Qazaxıstan Tengəsi", nameEn: "Kazakhstani Tenge" },
  UAH: { symbol: "₴", nameAz: "Ukrayna Qrivnası", nameEn: "Ukrainian Hryvnia" },
  MDL: { symbol: "L", nameAz: "Moldova Leyi", nameEn: "Moldovan Leu" },
  TMT: { symbol: "m", nameAz: "Türkmənistan Manatı", nameEn: "Turkmenistan Manat" },
  UZS: { symbol: "сўм", nameAz: "Özbək Somu", nameEn: "Uzbek Som" },
  KGS: { symbol: "с", nameAz: "Qırğız Somu", nameEn: "Kyrgyzstani Som" },
  PKR: { symbol: "₨", nameAz: "Pakistan Rupisi", nameEn: "Pakistani Rupee" },
  RSD: { symbol: "дин", nameAz: "Serbiya Dinarı", nameEn: "Serbian Dinar" },
  // Additional currencies from ExchangeRate-API
  AFN: { symbol: "؋", nameAz: "Əfqanıstan Əfqanisi", nameEn: "Afghan Afghani" },
  ALL: { symbol: "L", nameAz: "Albaniya Leki", nameEn: "Albanian Lek" },
  AMD: { symbol: "֏", nameAz: "Ermənistan Dramı", nameEn: "Armenian Dram" },
  ARS: { symbol: "$", nameAz: "Argentina Pesosu", nameEn: "Argentine Peso" },
  BDT: { symbol: "৳", nameAz: "Banqladeş Takası", nameEn: "Bangladeshi Taka" },
  BHD: { symbol: ".د.ب", nameAz: "Bəhreyn Dinarı", nameEn: "Bahraini Dinar" },
  BOB: { symbol: "Bs", nameAz: "Boliviya Bolivianosu", nameEn: "Bolivian Boliviano" },
  CLP: { symbol: "$", nameAz: "Çili Pesosu", nameEn: "Chilean Peso" },
  COP: { symbol: "$", nameAz: "Kolumbiya Pesosu", nameEn: "Colombian Peso" },
  CRC: { symbol: "₡", nameAz: "Kosta Rika Kolonu", nameEn: "Costa Rican Colón" },
  DZD: { symbol: "د.ج", nameAz: "Əlcəzair Dinarı", nameEn: "Algerian Dinar" },
  EGP: { symbol: "E£", nameAz: "Misir Funtu", nameEn: "Egyptian Pound" },
  ETB: { symbol: "Br", nameAz: "Efiopiya Birri", nameEn: "Ethiopian Birr" },
  GHS: { symbol: "₵", nameAz: "Qana Sedisi", nameEn: "Ghanaian Cedi" },
  IQD: { symbol: "ع.د", nameAz: "İraq Dinarı", nameEn: "Iraqi Dinar" },
  IRR: { symbol: "﷼", nameAz: "İran Rialı", nameEn: "Iranian Rial" },
  JOD: { symbol: "د.ا", nameAz: "İordaniya Dinarı", nameEn: "Jordanian Dinar" },
  KES: { symbol: "KSh", nameAz: "Keniya Şillinqi", nameEn: "Kenyan Shilling" },
  KHR: { symbol: "៛", nameAz: "Kamboca Rieli", nameEn: "Cambodian Riel" },
  LBP: { symbol: "ل.ل", nameAz: "Livan Funtu", nameEn: "Lebanese Pound" },
  LKR: { symbol: "Rs", nameAz: "Şri Lanka Rupisi", nameEn: "Sri Lankan Rupee" },
  MAD: { symbol: "د.م.", nameAz: "Mərakeş Dirhəmi", nameEn: "Moroccan Dirham" },
  MMK: { symbol: "K", nameAz: "Myanma Kyatı", nameEn: "Myanmar Kyat" },
  MNT: { symbol: "₮", nameAz: "Monqoliya Tuqriki", nameEn: "Mongolian Tugrik" },
  NGN: { symbol: "₦", nameAz: "Nigeriya Nairası", nameEn: "Nigerian Naira" },
  NPR: { symbol: "रू", nameAz: "Nepal Rupisi", nameEn: "Nepalese Rupee" },
  OMR: { symbol: "ر.ع.", nameAz: "Oman Rialı", nameEn: "Omani Rial" },
  PEN: { symbol: "S/", nameAz: "Peru Solu", nameEn: "Peruvian Sol" },
  TJS: { symbol: "SM", nameAz: "Tacikistan Somonisi", nameEn: "Tajikistani Somoni" },
  TND: { symbol: "د.ت", nameAz: "Tunis Dinarı", nameEn: "Tunisian Dinar" },
  TZS: { symbol: "TSh", nameAz: "Tanzaniya Şillinqi", nameEn: "Tanzanian Shilling" },
  UGX: { symbol: "USh", nameAz: "Uqanda Şillinqi", nameEn: "Ugandan Shilling" },
  VND: { symbol: "₫", nameAz: "Vyetnam Donqu", nameEn: "Vietnamese Dong" },
  XAF: { symbol: "FCFA", nameAz: "CFA Frankı (BEAC)", nameEn: "CFA Franc BEAC" },
  XOF: { symbol: "CFA", nameAz: "CFA Frankı (BCEAO)", nameEn: "CFA Franc BCEAO" },
  YER: { symbol: "﷼", nameAz: "Yəmən Rialı", nameEn: "Yemeni Rial" },
  ZMW: { symbol: "ZK", nameAz: "Zambiya Kvaçası", nameEn: "Zambian Kwacha" },
};

// Parse CBAR XML response
function parseCBARXml(xml: string): Record<string, { value: number; nominal: number }> {
  const rates: Record<string, { value: number; nominal: number }> = {};
  
  // Match all Valute elements
  const valuteRegex = /<Valute Code="([A-Z]+)">\s*<Nominal>([^<]+)<\/Nominal>\s*<Name>[^<]+<\/Name>\s*<Value>([^<]+)<\/Value>\s*<\/Valute>/g;
  
  let match;
  while ((match = valuteRegex.exec(xml)) !== null) {
    const code = match[1];
    const nominalStr = match[2].replace(/[^0-9.]/g, "");
    const nominal = parseFloat(nominalStr) || 1;
    const value = parseFloat(match[3]);
    
    if (code && !isNaN(value)) {
      rates[code] = { value, nominal };
    }
  }
  
  return rates;
}

// Fetch rates from CBAR (Central Bank of Azerbaijan) - PRIMARY SOURCE
async function fetchCBARRates(): Promise<Record<string, number>> {
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, "0")}.${String(now.getMonth() + 1).padStart(2, "0")}.${now.getFullYear()}`;
  const url = `${CBAR_API_URL}/${dateStr}.xml`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      // Try yesterday if today's rates not available yet
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = `${String(yesterday.getDate()).padStart(2, "0")}.${String(yesterday.getMonth() + 1).padStart(2, "0")}.${yesterday.getFullYear()}`;
      const yesterdayUrl = `${CBAR_API_URL}/${yesterdayStr}.xml`;
      
      const retryResponse = await fetch(yesterdayUrl);
      if (!retryResponse.ok) {
        throw new Error(`CBAR API error: ${retryResponse.status}`);
      }
      
      const xml = await retryResponse.text();
      const rawRates = parseCBARXml(xml);
      
      // Convert to rateToAZN (how many of currency = 1 AZN)
      const rates: Record<string, number> = {};
      for (const [code, data] of Object.entries(rawRates)) {
        // CBAR gives: how many AZN = X units of currency
        // We need: how many currency = 1 AZN
        // rateToAZN = nominal / value
        rates[code] = data.nominal / data.value;
      }
      return rates;
    }
    
    const xml = await response.text();
    const rawRates = parseCBARXml(xml);
    
    const rates: Record<string, number> = {};
    for (const [code, data] of Object.entries(rawRates)) {
      rates[code] = data.nominal / data.value;
    }
    return rates;
  } catch (error) {
    console.error("CBAR fetch error:", error);
    return {};
  }
}

// Fetch rates from ExchangeRate-API - SECONDARY SOURCE (for currencies not in CBAR)
async function fetchExchangeRateApiRates(cbarCodes: string[]): Promise<Record<string, number>> {
  try {
    const response = await fetch(EXCHANGERATE_API_URL);
    if (!response.ok) {
      throw new Error(`ExchangeRate-API error: ${response.status}`);
    }
    
    const data = await response.json();
    const usdRates = data.rates;
    
    // Get AZN rate from USD (1 USD = X AZN)
    const usdToAzn = usdRates["AZN"] || 1.70; // fallback to approximate rate
    
    // Calculate rates relative to AZN for currencies NOT in CBAR
    const rates: Record<string, number> = {};
    for (const [code, usdRate] of Object.entries(usdRates)) {
      // Skip if already got from CBAR (CBAR has priority)
      if (cbarCodes.includes(code)) continue;
      // Skip AZN itself
      if (code === "AZN") continue;
      
      // usdRate = how many of currency per 1 USD
      // usdToAzn = how many AZN per 1 USD
      // rateToAZN = usdRate / usdToAzn = how many of currency per 1 AZN
      rates[code] = (usdRate as number) / usdToAzn;
    }
    
    return rates;
  } catch (error) {
    console.error("ExchangeRate-API fetch error:", error);
    return {};
  }
}

// POST - Update FX rates from CBAR (primary) + ExchangeRate-API (secondary)
export async function POST() {
  try {
    const now = new Date();
    const updatedCurrencies: { code: string; rateToAZN: number; source: string }[] = [];
    
    // 1. Fetch CBAR rates (primary source - official AZN rates)
    console.log("Fetching CBAR rates...");
    const cbarRates = await fetchCBARRates();
    const cbarCodes = Object.keys(cbarRates);
    console.log(`CBAR: Found ${cbarCodes.length} currencies`);
    
    // 2. Fetch ExchangeRate-API rates (secondary source - 166 currencies)
    console.log("Fetching ExchangeRate-API rates...");
    const exchangeRateApiRates = await fetchExchangeRateApiRates(cbarCodes);
    console.log(`ExchangeRate-API: Found ${Object.keys(exchangeRateApiRates).length} additional currencies`);
    
    // 3. Update AZN (base currency)
    await prisma.currency.upsert({
      where: { code: "AZN" },
      update: { rateToAZN: 1, lastUpdated: now },
      create: {
        code: "AZN",
        symbol: "₼",
        nameAz: "Azərbaycan Manatı",
        nameEn: "Azerbaijani Manat",
        rateToAZN: 1,
        isBase: true,
        isActive: true,
        lastUpdated: now,
      },
    });
    updatedCurrencies.push({ code: "AZN", rateToAZN: 1, source: "base" });
    
    // 4. Update CBAR currencies (PRIMARY - official rates)
    for (const [code, rateToAZN] of Object.entries(cbarRates)) {
      const info = CURRENCY_INFO[code] || { symbol: code, nameAz: code, nameEn: code };
      
      await prisma.currency.upsert({
        where: { code },
        update: { rateToAZN, lastUpdated: now },
        create: {
          code,
          symbol: info.symbol,
          nameAz: info.nameAz,
          nameEn: info.nameEn,
          rateToAZN,
          isBase: false,
          isActive: true,
          lastUpdated: now,
        },
      });
      
      await prisma.fxRateHistory.create({
        data: { currencyCode: code, rateToAZN, source: "cbar", fetchedAt: now },
      });
      
      updatedCurrencies.push({ code, rateToAZN, source: "cbar" });
    }
    
    // 5. Update ExchangeRate-API currencies (SECONDARY - for currencies not in CBAR)
    for (const [code, rateToAZN] of Object.entries(exchangeRateApiRates)) {
      const info = CURRENCY_INFO[code] || { symbol: code, nameAz: code, nameEn: code };
      
      await prisma.currency.upsert({
        where: { code },
        update: { rateToAZN, lastUpdated: now },
        create: {
          code,
          symbol: info.symbol,
          nameAz: info.nameAz,
          nameEn: info.nameEn,
          rateToAZN,
          isBase: false,
          isActive: true,
          lastUpdated: now,
        },
      });
      
      await prisma.fxRateHistory.create({
        data: { currencyCode: code, rateToAZN, source: "exchangerate-api", fetchedAt: now },
      });
      
      updatedCurrencies.push({ code, rateToAZN, source: "exchangerate-api" });
    }
    
    return NextResponse.json({
      success: true,
      message: "FX rates updated successfully",
      updatedAt: now.toISOString(),
      summary: {
        total: updatedCurrencies.length,
        cbar: updatedCurrencies.filter(c => c.source === "cbar").length,
        exchangeRateApi: updatedCurrencies.filter(c => c.source === "exchangerate-api").length,
      },
      currencies: updatedCurrencies,
    });
  } catch (error) {
    console.error("FX Rate Update error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Xəta baş verdi" },
      { status: 500 }
    );
  }
}

// GET - Get last update info
export async function GET() {
  try {
    const currencies = await prisma.currency.findMany({
      where: { isActive: true },
      orderBy: { lastUpdated: "desc" },
      take: 1,
    });

    const cbarHistory = await prisma.fxRateHistory.findFirst({
      where: { source: "cbar" },
      orderBy: { fetchedAt: "desc" },
    });
    
    const exchangeRateApiHistory = await prisma.fxRateHistory.findFirst({
      where: { source: "exchangerate-api" },
      orderBy: { fetchedAt: "desc" },
    });

    const totalCurrencies = await prisma.currency.count({
      where: { isActive: true },
    });

    return NextResponse.json({
      lastUpdated: currencies[0]?.lastUpdated || null,
      totalCurrencies,
      sources: {
        cbar: {
          lastFetched: cbarHistory?.fetchedAt || null,
          description: "Central Bank of Azerbaijan - Official rates",
          priority: 1,
        },
        exchangeRateApi: {
          lastFetched: exchangeRateApiHistory?.fetchedAt || null,
          description: "ExchangeRate-API - 166 currencies, free tier",
          priority: 2,
        },
      },
    });
  } catch (error) {
    console.error("FX Rate Info error:", error);
    return NextResponse.json(
      { error: "Xəta baş verdi" },
      { status: 500 }
    );
  }
}
