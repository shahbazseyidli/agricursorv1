/**
 * V2 Countries API
 * 
 * Returns all available countries with their data sources.
 * Each country can have multiple data sources: FAOSTAT, EUROSTAT, AGRO_AZ
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
    
    // Convert to array and sort
    const countries = Array.from(countriesMap.values());
    
    // Sort data sources by priority: FAOSTAT > EUROSTAT > AGRO_AZ
    const sourcePriority: Record<string, number> = {
      "FAOSTAT": 1,
      "EUROSTAT": 2,
      "AGRO_AZ": 3,
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
