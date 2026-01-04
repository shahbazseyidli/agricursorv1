import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ExchangeRate-API - Free tier, 166 currencies, no API key required
// Returns rates relative to USD (base currency)
// Docs: https://www.exchangerate-api.com/docs/free
const EXCHANGERATE_API_URL = "https://api.exchangerate-api.com/v4/latest/USD";

// Currency metadata (common currencies with proper symbols and names)
const CURRENCY_INFO: Record<string, { symbol: string; nameAz: string; nameEn: string }> = {
  USD: { symbol: "$", nameAz: "ABŞ Dolları", nameEn: "US Dollar" },
  EUR: { symbol: "€", nameAz: "Avro", nameEn: "Euro" },
  AZN: { symbol: "₼", nameAz: "Azərbaycan Manatı", nameEn: "Azerbaijani Manat" },
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
  // Legacy/special currencies for FPMA compatibility
  BYR: { symbol: "Br", nameAz: "Belarus Rublu (köhnə)", nameEn: "Belarusian Ruble (old)" },
  ZIG: { symbol: "ZiG", nameAz: "Zimbabve Qızılı", nameEn: "Zimbabwe Gold" },
};

// POST - Update FX rates from ExchangeRate-API (USD-based)
export async function POST() {
  try {
    const now = new Date();
    const updatedCurrencies: { code: string; rateToUSD: number; source: string }[] = [];
    
    // Fetch rates from ExchangeRate-API (returns rates relative to USD)
    console.log("Fetching ExchangeRate-API rates (USD base)...");
    const response = await fetch(EXCHANGERATE_API_URL);
    if (!response.ok) {
      throw new Error(`ExchangeRate-API error: ${response.status}`);
    }
    
    const data = await response.json();
    const rates = data.rates as Record<string, number>;
    console.log(`ExchangeRate-API: Found ${Object.keys(rates).length} currencies`);
    
    // Update USD (base currency) - rate is 1
    await prisma.currency.upsert({
      where: { code: "USD" },
      update: { rateToUSD: 1, lastUpdated: now, isBase: true },
      create: {
        code: "USD",
        symbol: "$",
        nameAz: "ABŞ Dolları",
        nameEn: "US Dollar",
        rateToUSD: 1,
        isBase: true,
        isActive: true,
        lastUpdated: now,
      },
    });
    updatedCurrencies.push({ code: "USD", rateToUSD: 1, source: "base" });
    
    // Update all currencies from API
    // rate = 1 USD = X of this currency
    for (const [code, rateToUSD] of Object.entries(rates)) {
      if (code === "USD") continue; // Already handled
      
      const info = CURRENCY_INFO[code] || { symbol: code, nameAz: code, nameEn: code };
      
      await prisma.currency.upsert({
        where: { code },
        update: { rateToUSD, lastUpdated: now, isBase: false },
        create: {
          code,
          symbol: info.symbol,
          nameAz: info.nameAz,
          nameEn: info.nameEn,
          rateToUSD,
          isBase: false,
          isActive: true,
          lastUpdated: now,
        },
      });
      
      await prisma.fxRateHistory.create({
        data: { currencyCode: code, rateToUSD, source: "exchangerate-api", fetchedAt: now },
      });
      
      updatedCurrencies.push({ code, rateToUSD, source: "exchangerate-api" });
    }
    
    // Add legacy currencies for FPMA compatibility
    // BYR (old Belarus Ruble) - 1 BYN = 10000 BYR, so if 1 USD = 3.5 BYN, then 1 USD = 35000 BYR
    const bynRate = rates["BYN"] || 3.5;
    const byrRate = bynRate * 10000; // BYR was redenominated 10000:1 in 2016
    await prisma.currency.upsert({
      where: { code: "BYR" },
      update: { rateToUSD: byrRate, lastUpdated: now },
      create: {
        code: "BYR",
        symbol: "Br",
        nameAz: "Belarus Rublu (köhnə)",
        nameEn: "Belarusian Ruble (old)",
        rateToUSD: byrRate,
        isBase: false,
        isActive: true,
        lastUpdated: now,
      },
    });
    updatedCurrencies.push({ code: "BYR", rateToUSD: byrRate, source: "calculated" });
    
    // ZiG (Zimbabwe Gold) - approximately 1 USD = 26 ZiG (as of late 2024)
    const zigRate = 26;
    await prisma.currency.upsert({
      where: { code: "ZiG" },
      update: { rateToUSD: zigRate, lastUpdated: now },
      create: {
        code: "ZiG",
        symbol: "ZiG",
        nameAz: "Zimbabve Qızılı",
        nameEn: "Zimbabwe Gold",
        rateToUSD: zigRate,
        isBase: false,
        isActive: true,
        lastUpdated: now,
      },
    });
    updatedCurrencies.push({ code: "ZiG", rateToUSD: zigRate, source: "calculated" });

    return NextResponse.json({
      success: true,
      message: "FX rates updated successfully (USD base)",
      updatedAt: now.toISOString(),
      baseCurrency: "USD",
      summary: {
        total: updatedCurrencies.length,
        fromApi: updatedCurrencies.filter(c => c.source === "exchangerate-api").length,
        calculated: updatedCurrencies.filter(c => c.source === "calculated").length,
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

    const lastHistory = await prisma.fxRateHistory.findFirst({
      orderBy: { fetchedAt: "desc" },
    });

    const totalCurrencies = await prisma.currency.count({
      where: { isActive: true },
    });

    return NextResponse.json({
      lastUpdated: currencies[0]?.lastUpdated || null,
      totalCurrencies,
      baseCurrency: "USD",
      description: "All rates are relative to USD (1 USD = X currency)",
      source: {
        name: "ExchangeRate-API",
        lastFetched: lastHistory?.fetchedAt || null,
        url: "https://exchangerate-api.com",
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
