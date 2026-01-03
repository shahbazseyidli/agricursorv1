/**
 * V2 Countries API
 * 
 * Returns all available countries with their data sources.
 * Each country can have multiple data sources: FAOSTAT, EUROSTAT, AGRO_AZ, FAO_FPMA
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Country flags
const FLAGS: Record<string, string> = {
  "AZ": "🇦🇿",
  "DE": "🇩🇪",
  "FR": "🇫🇷",
  "IT": "🇮🇹",
  "ES": "🇪🇸",
  "PL": "🇵🇱",
  "AT": "🇦🇹",
  "BE": "🇧🇪",
  "BG": "🇧🇬",
  "HR": "🇭🇷",
  "CY": "🇨🇾",
  "CZ": "🇨🇿",
  "DK": "🇩🇰",
  "EE": "🇪🇪",
  "FI": "🇫🇮",
  "GR": "🇬🇷",
  "EL": "🇬🇷",
  "HU": "🇭🇺",
  "IE": "🇮🇪",
  "LV": "🇱🇻",
  "LT": "🇱🇹",
  "LU": "🇱🇺",
  "MT": "🇲🇹",
  "NL": "🇳🇱",
  "PT": "🇵🇹",
  "RO": "🇷🇴",
  "SK": "🇸🇰",
  "SI": "🇸🇮",
  "SE": "🇸🇪",
  "GB": "🇬🇧",
  "TR": "🇹🇷",
  "RU": "🇷🇺",
  "UA": "🇺🇦",
  "GE": "🇬🇪",
  "IR": "🇮🇷",
  "IN": "🇮🇳",
  "NO": "🇳🇴",
  "IS": "🇮🇸",
  "BA": "🇧🇦",
  "BF": "🇧🇫",
};

// FAO code to ISO2 mapping (complete)
const FAO_TO_ISO: Record<string, string> = {
  "11": "AT",
  "52": "AZ",
  "255": "BE",
  "27": "BG",
  "80": "BA",
  "167": "CZ",
  "67": "FI",
  "68": "FR",
  "73": "GE",
  "79": "DE",
  "84": "GR",
  "97": "IS",
  "99": "HU",
  "100": "IN",
  "102": "IR",
  "106": "IT",
  "256": "LU",
  "150": "NL",
  "162": "NO",
  "173": "PL",
  "174": "PT",
  "183": "RO",
  "185": "RU",
  "203": "ES",
  "223": "TR",
  "230": "UA",
  "229": "GB",
};

// ISO2 to FAO code mapping (reverse)
const ISO_TO_FAO: Record<string, string> = Object.fromEntries(
  Object.entries(FAO_TO_ISO).map(([k, v]) => [v, k])
);

interface DataSource {
  code: string; // FAOSTAT, EUROSTAT, AGRO_AZ
  name: string;
  nameAz: string;
  hasData: boolean;
  currency: string;
  unit: string;
  periodTypes: string[]; // WEEKLY, MONTHLY, ANNUAL
}

interface CountryWithSources {
  code: string;
  name: string;
  nameAz: string;
  flag: string;
  dataSources: DataSource[];
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productSlug = searchParams.get("product");
    
    const countriesMap = new Map<string, CountryWithSources>();
    
    // 1. Add Azerbaijan with AGRO_AZ source (always first)
    countriesMap.set("AZ", {
      code: "AZ",
      name: "Azerbaijan",
      nameAz: "Azərbaycan",
      flag: "🇦🇿",
      dataSources: [{
        code: "AGRO_AZ",
        name: "Agro.gov.az",
        nameAz: "Azərbaycan Kənd Təsərrüfatı Nazirliyi",
        hasData: true,
        currency: "AZN",
        unit: "kg",
        periodTypes: ["WEEKLY", "MONTHLY", "ANNUAL"],
      }],
    });
    
    // 2. Get FAO countries and add FAOSTAT source
    const faoCountries = await prisma.faoCountry.findMany({
      where: { isActive: true },
    });
    
    for (const fao of faoCountries) {
      const isoCode = FAO_TO_ISO[fao.code] || fao.code;
      
      // Check if has data for this product
      let hasData = true;
      if (productSlug) {
        const gp = await prisma.globalProduct.findUnique({
          where: { slug: productSlug },
          include: { faoProducts: { select: { id: true } } },
        });
        
        if (gp && gp.faoProducts.length > 0) {
          const priceCount = await prisma.faoPrice.count({
            where: {
              productId: { in: gp.faoProducts.map(p => p.id) },
              countryId: fao.id,
            },
            take: 1,
          });
          hasData = priceCount > 0;
        } else {
          hasData = false;
        }
      }
      
      const faoSource: DataSource = {
        code: "FAOSTAT",
        name: "FAOSTAT",
        nameAz: "FAO Statistika",
        hasData,
        currency: "USD",
        unit: "ton",
        periodTypes: ["ANNUAL"],
      };
      
      if (countriesMap.has(isoCode)) {
        // Add FAO source to existing country
        countriesMap.get(isoCode)!.dataSources.push(faoSource);
      } else {
        // Create new country entry
        countriesMap.set(isoCode, {
          code: isoCode,
          name: fao.nameEn,
          nameAz: fao.nameAz || fao.nameEn,
          flag: FLAGS[isoCode] || "🏳️",
          dataSources: [faoSource],
        });
      }
    }
    
    // 3. Get EU countries and add EUROSTAT source
    const euCountries = await prisma.euCountry.findMany({
      where: { isActive: true },
    });
    
    for (const eu of euCountries) {
      // Check if has data for this product
      let hasData = true;
      if (productSlug) {
        const gp = await prisma.globalProduct.findUnique({
          where: { slug: productSlug },
          include: { euProducts: { select: { id: true } } },
        });
        
        if (gp && gp.euProducts.length > 0) {
          const priceCount = await prisma.euPrice.count({
            where: {
              productId: { in: gp.euProducts.map(p => p.id) },
              countryId: eu.id,
            },
            take: 1,
          });
          hasData = priceCount > 0;
        } else {
          hasData = false;
        }
      }
      
      const euSource: DataSource = {
        code: "EUROSTAT",
        name: "EUROSTAT",
        nameAz: "Avropa Statistika",
        hasData,
        currency: "EUR",
        unit: "100kg",
        periodTypes: ["ANNUAL"],
      };
      
      if (countriesMap.has(eu.code)) {
        // Add EU source to existing country
        countriesMap.get(eu.code)!.dataSources.push(euSource);
      } else {
        // Create new country entry
        countriesMap.set(eu.code, {
          code: eu.code,
          name: eu.nameEn,
          nameAz: eu.nameAz || eu.nameEn,
          flag: FLAGS[eu.code] || "🏳️",
          dataSources: [euSource],
        });
      }
    }
    
    // 4. Get FPMA countries and add FAO_FPMA source (136 countries, retail/wholesale)
    const fpmaCountries = await prisma.fpmaCountry.findMany({
      where: { isActive: true },
    });
    
    // ISO3 to ISO2 mapping for common countries
    const ISO3_TO_ISO2: Record<string, string> = {
      "AFG": "AF", "ALB": "AL", "DZA": "DZ", "AGO": "AO", "ARG": "AR",
      "ARM": "AM", "AUS": "AU", "AUT": "AT", "AZE": "AZ", "BGD": "BD",
      "BLR": "BY", "BEL": "BE", "BEN": "BJ", "BOL": "BO", "BIH": "BA",
      "BWA": "BW", "BRA": "BR", "BGR": "BG", "BFA": "BF", "BDI": "BI",
      "KHM": "KH", "CMR": "CM", "CAN": "CA", "CAF": "CF", "TCD": "TD",
      "CHL": "CL", "CHN": "CN", "COL": "CO", "COD": "CD", "COG": "CG",
      "CRI": "CR", "CIV": "CI", "HRV": "HR", "CYP": "CY", "CZE": "CZ",
      "DNK": "DK", "DJI": "DJ", "DOM": "DO", "ECU": "EC", "EGY": "EG",
      "SLV": "SV", "ETH": "ET", "FIN": "FI", "FRA": "FR", "GAB": "GA",
      "GMB": "GM", "GEO": "GE", "DEU": "DE", "GHA": "GH", "GRC": "GR",
      "GTM": "GT", "GIN": "GN", "GNB": "GW", "HTI": "HT", "HND": "HN",
      "HUN": "HU", "IND": "IN", "IDN": "ID", "IRN": "IR", "IRQ": "IQ",
      "IRL": "IE", "ISR": "IL", "ITA": "IT", "JAM": "JM", "JPN": "JP",
      "JOR": "JO", "KAZ": "KZ", "KEN": "KE", "KGZ": "KG", "LAO": "LA",
      "LVA": "LV", "LBN": "LB", "LSO": "LS", "LBR": "LR", "LBY": "LY",
      "LTU": "LT", "MDG": "MG", "MWI": "MW", "MYS": "MY", "MLI": "ML",
      "MRT": "MR", "MEX": "MX", "MDA": "MD", "MNG": "MN", "MAR": "MA",
      "MOZ": "MZ", "MMR": "MM", "NAM": "NA", "NPL": "NP", "NLD": "NL",
      "NZL": "NZ", "NIC": "NI", "NER": "NE", "NGA": "NG", "NOR": "NO",
      "PAK": "PK", "PAN": "PA", "PRY": "PY", "PER": "PE", "PHL": "PH",
      "POL": "PL", "PRT": "PT", "ROU": "RO", "RUS": "RU", "RWA": "RW",
      "SEN": "SN", "SRB": "RS", "SLE": "SL", "SVK": "SK", "SVN": "SI",
      "SOM": "SO", "ZAF": "ZA", "KOR": "KR", "SSD": "SS", "ESP": "ES",
      "LKA": "LK", "SDN": "SD", "SWZ": "SZ", "SWE": "SE", "CHE": "CH",
      "SYR": "SY", "TJK": "TJ", "TZA": "TZ", "THA": "TH", "TGO": "TG",
      "TUN": "TN", "TUR": "TR", "TKM": "TM", "UGA": "UG", "UKR": "UA",
      "GBR": "GB", "USA": "US", "URY": "UY", "UZB": "UZ", "VEN": "VE",
      "VNM": "VN", "YEM": "YE", "ZMB": "ZM", "ZWE": "ZW",
    };
    
    for (const fpma of fpmaCountries) {
      const isoCode = ISO3_TO_ISO2[fpma.iso3] || fpma.iso2 || fpma.iso3.substring(0, 2);
      
      // Check if has data for this product
      let hasData = true;
      if (productSlug) {
        const gp = await prisma.globalProduct.findUnique({
          where: { slug: productSlug },
          include: { fpmaCommodities: { select: { id: true } } },
        });
        
        if (gp && gp.fpmaCommodities.length > 0) {
          const serieCount = await prisma.fpmaSerie.count({
            where: {
              commodityId: { in: gp.fpmaCommodities.map(c => c.id) },
              countryId: fpma.id,
            },
            take: 1,
          });
          hasData = serieCount > 0;
        } else {
          hasData = false;
        }
      }
      
      const fpmaSource: DataSource = {
        code: "FAO_FPMA",
        name: "FAO FPMA",
        nameAz: "FAO Ərzaq Qiymətləri",
        hasData,
        currency: "Local", // Varies by country
        unit: "kg",
        periodTypes: ["WEEKLY", "MONTHLY"],
      };
      
      if (countriesMap.has(isoCode)) {
        // Add FPMA source to existing country
        countriesMap.get(isoCode)!.dataSources.push(fpmaSource);
      } else {
        // Create new country entry
        countriesMap.set(isoCode, {
          code: isoCode,
          name: fpma.nameEn,
          nameAz: fpma.nameAz || fpma.nameEn,
          flag: FLAGS[isoCode] || "🏳️",
          dataSources: [fpmaSource],
        });
      }
    }
    
    // Convert to array and sort
    const countries = Array.from(countriesMap.values());
    
    // Sort data sources by priority: FAO_FPMA > FAOSTAT > EUROSTAT > AGRO_AZ
    const sourcePriority: Record<string, number> = {
      "FAO_FPMA": 1,
      "FAOSTAT": 2,
      "EUROSTAT": 3,
      "AGRO_AZ": 4,
    };
    
    for (const country of countries) {
      country.dataSources.sort((a, b) => 
        (sourcePriority[a.code] || 99) - (sourcePriority[b.code] || 99)
      );
    }
    
    // Sort countries: AZ first, then alphabetically
    countries.sort((a, b) => {
      if (a.code === "AZ") return -1;
      if (b.code === "AZ") return 1;
      return a.nameAz.localeCompare(b.nameAz, "az");
    });
    
    return NextResponse.json({
      success: true,
      data: countries,
    });
    
  } catch (error) {
    console.error("Error fetching countries:", error);
    return NextResponse.json({
      success: false,
      error: "Internal server error",
    }, { status: 500 });
  }
}
