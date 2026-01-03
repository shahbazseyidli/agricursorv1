/**
 * Product Matcher Service
 * 
 * Fuzzy matching between EU products and local Azerbaijani products
 * Uses Levenshtein distance + token matching + predefined dictionary
 */

import { prisma } from "@/lib/prisma";

// Predefined dictionary for common AZ-EN product name mappings
const PRODUCT_DICTIONARY: Record<string, string[]> = {
  // Fruits - Meyvələr
  "alma": ["apple", "apples", "dessert apple", "dessert apples"],
  "armud": ["pear", "pears", "dessert pear", "dessert pears"],
  "şaftalı": ["peach", "peaches"],
  "nektarin": ["nectarine", "nectarines"],
  "ərik": ["apricot", "apricots"],
  "gilas": ["cherry", "cherries", "sweet cherry", "sweet cherries"],
  "albalı": ["sour cherry", "sour cherries"],
  "gavalı": ["plum", "plums"],
  "üzüm": ["grape", "grapes", "table grape", "table grapes", "dessert grape"],
  "çiyələk": ["strawberry", "strawberries"],
  "moruq": ["raspberry", "raspberries"],
  "portağal": ["orange", "oranges"],
  "mandarin": ["mandarin", "mandarins", "clementine", "clementines"],
  "limon": ["lemon", "lemons"],
  "banan": ["banana", "bananas"],
  "qarpız": ["watermelon", "water melon", "water melons"],
  "yemiş": ["melon", "melons"],
  "kivi": ["kiwi", "kiwis", "kiwifruit"],
  "avokado": ["avocado", "avocados"],
  "əncir": ["fig", "figs", "fresh fig", "fresh figs"],
  "qoz": ["walnut", "walnuts"],
  "fındıq": ["hazelnut", "hazelnuts"],
  "badam": ["almond", "almonds"],
  
  // Vegetables - Tərəvəzlər
  "pomidor": ["tomato", "tomatoes"],
  "xiyar": ["cucumber", "cucumbers"],
  "bibər": ["pepper", "peppers", "capsicum"],
  "badımcan": ["eggplant", "egg plant", "aubergine"],
  "kabak": ["courgette", "courgettes", "zucchini"],
  "kələm": ["cabbage", "white cabbage", "red cabbage"],
  "gül kələm": ["cauliflower", "cauliflowers"],
  "brokoli": ["broccoli"],
  "ispanaq": ["spinach"],
  "kəvər": ["lettuce", "lettuces", "salad"],
  "yerkökü": ["carrot", "carrots"],
  "soğan": ["onion", "onions"],
  "sarımsaq": ["garlic"],
  "kartof": ["potato", "potatoes", "ware potato"],
  "lobya": ["bean", "beans", "green bean", "green beans"],
  "noxud": ["pea", "peas", "green pea", "green peas"],
  "pıras": ["leek", "leeks"],
  "göbələk": ["mushroom", "mushrooms", "cultivated mushroom"],
  "turp": ["radish"],
  "çuğundur": ["beetroot", "beet"],
  
  // Cereals - Dənli bitkilər
  "buğda": ["wheat", "soft wheat", "durum wheat"],
  "arpa": ["barley"],
  "yulaf": ["oat", "oats"],
  "qarğıdalı": ["maize", "corn"],
  "düyü": ["rice"],
  "çovdar": ["rye"]
};

// Reverse dictionary (EN -> AZ)
const REVERSE_DICTIONARY: Record<string, string> = {};
for (const [azName, enNames] of Object.entries(PRODUCT_DICTIONARY)) {
  for (const enName of enNames) {
    REVERSE_DICTIONARY[enName.toLowerCase()] = azName;
  }
}

interface MatchResult {
  euProductId: string;
  euProductName: string;
  localProductId: string | null;
  localProductName: string | null;
  score: number;
  matchType: "dictionary" | "fuzzy" | "token" | "none";
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

/**
 * Calculate similarity score (0-100)
 */
function similarityScore(a: string, b: string): number {
  const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase());
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 100;
  return Math.round((1 - distance / maxLength) * 100);
}

/**
 * Token-based matching
 */
function tokenMatch(a: string, b: string): number {
  const tokensA = a.toLowerCase().split(/[\s\-_,]+/).filter(t => t.length > 2);
  const tokensB = b.toLowerCase().split(/[\s\-_,]+/).filter(t => t.length > 2);
  
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  
  let matches = 0;
  for (const tokenA of tokensA) {
    for (const tokenB of tokensB) {
      if (tokenA === tokenB || similarityScore(tokenA, tokenB) > 80) {
        matches++;
        break;
      }
    }
  }
  
  return Math.round((matches / Math.max(tokensA.length, tokensB.length)) * 100);
}

/**
 * Dictionary-based matching
 */
function dictionaryMatch(euName: string, azName: string, azNameEn: string | null): number {
  const euLower = euName.toLowerCase();
  
  // Check if EU name matches any English name for this AZ product
  const azLower = azName.toLowerCase();
  const enNames = PRODUCT_DICTIONARY[azLower];
  
  if (enNames) {
    for (const enName of enNames) {
      if (euLower.includes(enName) || enName.includes(euLower)) {
        return 100;
      }
    }
  }
  
  // Check reverse: does EU name's AZ translation match?
  for (const [enWord, azWord] of Object.entries(REVERSE_DICTIONARY)) {
    if (euLower.includes(enWord) && azLower.includes(azWord)) {
      return 95;
    }
  }
  
  // Check English name if available
  if (azNameEn) {
    const score = similarityScore(euName, azNameEn);
    if (score > 70) return score;
  }
  
  return 0;
}

/**
 * Match a single EU product to local products
 */
export async function matchEuProductToLocal(
  euProductName: string
): Promise<{ productId: string | null; score: number; matchType: string }> {
  // Get all local products
  const localProducts = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      nameEn: true
    }
  });
  
  let bestMatch = { productId: null as string | null, score: 0, matchType: "none" };
  
  for (const product of localProducts) {
    // Try dictionary match first (highest priority)
    const dictScore = dictionaryMatch(euProductName, product.name, product.nameEn);
    if (dictScore > bestMatch.score) {
      bestMatch = { productId: product.id, score: dictScore, matchType: "dictionary" };
    }
    
    // Try direct name matching with English name
    if (product.nameEn) {
      const fuzzyScore = similarityScore(euProductName, product.nameEn);
      if (fuzzyScore > bestMatch.score) {
        bestMatch = { productId: product.id, score: fuzzyScore, matchType: "fuzzy" };
      }
    }
    
    // Try token matching
    const tokenScore = tokenMatch(euProductName, product.name);
    if (tokenScore > bestMatch.score) {
      bestMatch = { productId: product.id, score: tokenScore, matchType: "token" };
    }
    
    if (product.nameEn) {
      const tokenScoreEn = tokenMatch(euProductName, product.nameEn);
      if (tokenScoreEn > bestMatch.score) {
        bestMatch = { productId: product.id, score: tokenScoreEn, matchType: "token" };
      }
    }
  }
  
  // Only return match if score is above threshold
  if (bestMatch.score < 50) {
    return { productId: null, score: 0, matchType: "none" };
  }
  
  return bestMatch;
}

/**
 * Update all EU product matches
 */
export async function updateAllMatches(): Promise<{
  total: number;
  matched: number;
  unmatched: number;
  results: MatchResult[];
}> {
  // Get all EU products that are not manually matched
  const euProducts = await prisma.euProduct.findMany({
    where: {
      isManualMatch: false
    },
    select: {
      id: true,
      nameEn: true,
      ecAgrifoodCode: true,
      eurostatCode: true
    }
  });
  
  const results: MatchResult[] = [];
  let matched = 0;
  let unmatched = 0;
  
  for (const euProduct of euProducts) {
    const productName = euProduct.nameEn || euProduct.ecAgrifoodCode || "";
    const match = await matchEuProductToLocal(productName);
    
    // Update EU product with match
    await prisma.euProduct.update({
      where: { id: euProduct.id },
      data: {
        localProductId: match.productId,
        matchScore: match.score
      }
    });
    
    // Get local product name for result
    let localProductName = null;
    if (match.productId) {
      const localProduct = await prisma.product.findUnique({
        where: { id: match.productId },
        select: { name: true }
      });
      localProductName = localProduct?.name || null;
      matched++;
    } else {
      unmatched++;
    }
    
    results.push({
      euProductId: euProduct.id,
      euProductName: productName,
      localProductId: match.productId,
      localProductName,
      score: match.score,
      matchType: match.matchType as MatchResult["matchType"]
    });
  }
  
  return {
    total: euProducts.length,
    matched,
    unmatched,
    results
  };
}

/**
 * Manually set product match (admin function)
 */
export async function setManualMatch(
  euProductId: string,
  localProductId: string | null
): Promise<void> {
  await prisma.euProduct.update({
    where: { id: euProductId },
    data: {
      localProductId,
      matchScore: localProductId ? 100 : null,
      isManualMatch: localProductId !== null
    }
  });
}

/**
 * Get unmatched EU products
 */
export async function getUnmatchedProducts(): Promise<{
  id: string;
  nameEn: string;
  ecAgrifoodCode: string | null;
  eurostatCode: string | null;
}[]> {
  return prisma.euProduct.findMany({
    where: {
      localProductId: null
    },
    select: {
      id: true,
      nameEn: true,
      ecAgrifoodCode: true,
      eurostatCode: true
    }
  });
}

/**
 * Get all matches with details
 */
export async function getAllMatches(): Promise<{
  id: string;
  nameEn: string;
  eurostatCode: string | null;
  ecAgrifoodCode: string | null;
  localProduct: { id: string; name: string; nameEn: string | null } | null;
  matchScore: number | null;
  isManualMatch: boolean;
}[]> {
  return prisma.euProduct.findMany({
    include: {
      localProduct: {
        select: {
          id: true,
          name: true,
          nameEn: true
        }
      }
    },
    orderBy: [
      { matchScore: "desc" },
      { nameEn: "asc" }
    ]
  });
}







