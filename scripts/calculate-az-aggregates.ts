/**
 * Calculate AZ Price Aggregates
 * 
 * Calculates weekly and monthly average prices for AZ products by market type
 * Run with: npx tsx scripts/calculate-az-aggregates.ts
 */

import { PrismaClient } from "@prisma/client";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, getWeek, getYear, format } from "date-fns";

const prisma = new PrismaClient();

async function calculateAggregates() {
  console.log("Calculating AZ price aggregates...\n");
  
  // Get all products with prices
  const products = await prisma.product.findMany({
    where: {
      prices: { some: {} }
    },
    include: {
      productTypes: true
    }
  });
  
  // Get all market types
  const marketTypes = await prisma.marketType.findMany();
  
  // Get the country (Azerbaijan)
  const country = await prisma.country.findFirst({ where: { iso2: "AZ" } });
  if (!country) {
    console.error("Azerbaijan not found in database");
    return;
  }
  
  let totalAggregates = 0;
  
  for (const product of products) {
    console.log(`Processing: ${product.name}`);
    
    for (const marketType of marketTypes) {
      // Get all prices for this product and market type
      const prices = await prisma.price.findMany({
        where: {
          productId: product.id,
          market: {
            marketTypeId: marketType.id
          }
        },
        orderBy: { date: "asc" }
      });
      
      if (prices.length === 0) continue;
      
      // Group by week
      const weeklyGroups: Map<string, typeof prices> = new Map();
      const monthlyGroups: Map<string, typeof prices> = new Map();
      
      for (const price of prices) {
        const date = new Date(price.date);
        const year = getYear(date);
        const week = getWeek(date);
        const month = date.getMonth() + 1;
        
        const weekKey = `${year}-W${week.toString().padStart(2, '0')}`;
        const monthKey = `${year}-M${month.toString().padStart(2, '0')}`;
        
        if (!weeklyGroups.has(weekKey)) {
          weeklyGroups.set(weekKey, []);
        }
        weeklyGroups.get(weekKey)!.push(price);
        
        if (!monthlyGroups.has(monthKey)) {
          monthlyGroups.set(monthKey, []);
        }
        monthlyGroups.get(monthKey)!.push(price);
      }
      
      // Create weekly aggregates
      for (const [weekKey, weekPrices] of weeklyGroups) {
        const [yearStr, weekPart] = weekKey.split('-W');
        const year = parseInt(yearStr);
        const week = parseInt(weekPart);
        
        const avgPrice = weekPrices.reduce((sum, p) => sum + p.priceAvg, 0) / weekPrices.length;
        const minPrice = Math.min(...weekPrices.map(p => p.priceMin));
        const maxPrice = Math.max(...weekPrices.map(p => p.priceMax));
        
        // Calculate start and end dates for the week
        const jan1 = new Date(year, 0, 1);
        const daysToMonday = (jan1.getDay() + 6) % 7;
        const firstMonday = new Date(year, 0, 1 - daysToMonday + (week - 1) * 7);
        const startDate = firstMonday;
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        
        // Find existing or create new
        const existing = await prisma.azPriceAggregate.findFirst({
          where: {
            productId: product.id,
            productTypeId: null,
            marketTypeId: marketType.id,
            countryId: country.id,
            year,
            period: week,
            periodType: "Week"
          }
        });
        
        if (existing) {
          await prisma.azPriceAggregate.update({
            where: { id: existing.id },
            data: {
              avgPrice,
              minPrice,
              maxPrice,
              priceCount: weekPrices.length,
              calculatedAt: new Date()
            }
          });
        } else {
          await prisma.azPriceAggregate.create({
            data: {
              productId: product.id,
              productTypeId: null,
              marketTypeId: marketType.id,
              countryId: country.id,
              avgPrice,
              minPrice,
              maxPrice,
              priceCount: weekPrices.length,
              periodType: "Week",
              period: week,
              year,
              startDate,
              endDate
            }
          });
        }
        
        totalAggregates++;
      }
      
      // Create monthly aggregates
      for (const [monthKey, monthPrices] of monthlyGroups) {
        const [yearStr, monthPart] = monthKey.split('-M');
        const year = parseInt(yearStr);
        const month = parseInt(monthPart);
        
        const avgPrice = monthPrices.reduce((sum, p) => sum + p.priceAvg, 0) / monthPrices.length;
        const minPrice = Math.min(...monthPrices.map(p => p.priceMin));
        const maxPrice = Math.max(...monthPrices.map(p => p.priceMax));
        
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        
        // Find existing or create new
        const existingMonth = await prisma.azPriceAggregate.findFirst({
          where: {
            productId: product.id,
            productTypeId: null,
            marketTypeId: marketType.id,
            countryId: country.id,
            year,
            period: month,
            periodType: "Month"
          }
        });
        
        if (existingMonth) {
          await prisma.azPriceAggregate.update({
            where: { id: existingMonth.id },
            data: {
              avgPrice,
              minPrice,
              maxPrice,
              priceCount: monthPrices.length,
              calculatedAt: new Date()
            }
          });
        } else {
          await prisma.azPriceAggregate.create({
            data: {
              productId: product.id,
              productTypeId: null,
              marketTypeId: marketType.id,
              countryId: country.id,
              avgPrice,
              minPrice,
              maxPrice,
              priceCount: monthPrices.length,
              periodType: "Month",
              period: month,
              year,
              startDate,
              endDate
            }
          });
        }
        
        totalAggregates++;
      }
    }
  }
  
  console.log(`\n✓ Created ${totalAggregates} aggregate records`);
  
  // Print summary by market type
  console.log("\nSummary by Market Type:");
  for (const mt of marketTypes) {
    const count = await prisma.azPriceAggregate.count({
      where: { marketTypeId: mt.id }
    });
    console.log(`  - ${mt.nameAz}: ${count} aggregates`);
  }
}

async function main() {
  console.log("=".repeat(50));
  console.log("AZ Price Aggregate Calculator");
  console.log("=".repeat(50) + "\n");
  
  try {
    await calculateAggregates();
    console.log("\n✓ Done!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

