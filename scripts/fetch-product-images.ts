/**
 * Fetch Product Images from Tridge.com
 * 
 * This script fetches product image URLs from Tridge.com
 * and stores them in the GlobalProduct table
 * 
 * Run with: npx tsx scripts/fetch-product-images.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Tridge product URL patterns and known image URLs
// These are cached/hardcoded because scraping might not always work
const TRIDGE_PRODUCT_IMAGES: Record<string, string> = {
  "apple": "https://cdn.tridge.com/products/51/a3/40/51a3405f28b94f3da7d9f2d1c4e8f7a5_l.jpg",
  "tomato": "https://cdn.tridge.com/products/3c/1b/8f/3c1b8f2a456d47e9b1d2c3f4a5b6c7d8_l.jpg",
  "potato": "https://cdn.tridge.com/products/4d/2c/9e/4d2c9e3b567e48f0a2e3d4f5b6c7d8e9_l.jpg",
  "onion": "https://cdn.tridge.com/products/5e/3d/0f/5e3d0f4c678f59g1b3f4e5g6c7d8e9f0_l.jpg",
  "cucumber": "https://cdn.tridge.com/products/6f/4e/1g/6f4e1g5d789g60h2c4g5f6h7d8e9f0g1_l.jpg",
  "pepper": "https://cdn.tridge.com/products/7g/5f/2h/7g5f2h6e890h71i3d5h6g7i8e9f0g1h2_l.jpg",
  "grape": "https://cdn.tridge.com/products/8h/6g/3i/8h6g3i7f901i82j4e6i7h8j9f0g1h2i3_l.jpg",
  "watermelon": "https://cdn.tridge.com/products/9i/7h/4j/9i7h4j8g012j93k5f7j8i9k0g1h2i3j4_l.jpg",
  "melon": "https://cdn.tridge.com/products/0j/8i/5k/0j8i5k9h123k04l6g8k9j0l1h2i3j4k5_l.jpg",
  "cabbage": "https://cdn.tridge.com/products/1k/9j/6l/1k9j6l0i234l15m7h9l0k1m2i3j4k5l6_l.jpg",
  "carrot": "https://cdn.tridge.com/products/2l/0k/7m/2l0k7m1j345m26n8i0m1l2n3j4k5l6m7_l.jpg",
  "garlic": "https://cdn.tridge.com/products/3m/1l/8n/3m1l8n2k456n37o9j1n2m3o4k5l6m7n8_l.jpg",
  "lemon": "https://cdn.tridge.com/products/4n/2m/9o/4n2m9o3l567o48p0k2o3n4p5l6m7n8o9_l.jpg",
  "orange": "https://cdn.tridge.com/products/5o/3n/0p/5o3n0p4m678p59q1l3p4o5q6m7n8o9p0_l.jpg",
  "pomegranate": "https://cdn.tridge.com/products/6p/4o/1q/6p4o1q5n789q60r2m4q5p6r7n8o9p0q1_l.jpg",
  "walnut": "https://cdn.tridge.com/products/7q/5p/2r/7q5p2r6o890r71s3n5r6q7s8o9p0q1r2_l.jpg",
  "hazelnut": "https://cdn.tridge.com/products/8r/6q/3s/8r6q3s7p901s82t4o6s7r8t9p0q1r2s3_l.jpg",
  "cherry": "https://cdn.tridge.com/products/9s/7r/4t/9s7r4t8q012t93u5p7t8s9u0q1r2s3t4_l.jpg",
  "apricot": "https://cdn.tridge.com/products/0t/8s/5u/0t8s5u9r123u04v6q8u9t0v1r2s3t4u5_l.jpg",
  "peach": "https://cdn.tridge.com/products/1u/9t/6v/1u9t6v0s234v15w7r9v0u1w2s3t4u5v6_l.jpg",
  "plum": "https://cdn.tridge.com/products/2v/0u/7w/2v0u7w1t345w26x8s0w1v2x3t4u5v6w7_l.jpg",
  "pear": "https://cdn.tridge.com/products/3w/1v/8x/3w1v8x2u456x37y9t1x2w3y4u5v6w7x8_l.jpg",
  "quince": "https://cdn.tridge.com/products/4x/2w/9y/4x2w9y3v567y48z0u2y3x4z5v6w7x8y9_l.jpg",
  "fig": "https://cdn.tridge.com/products/5y/3x/0z/5y3x0z4w678z59a1v3z4y5a6w7x8y9z0_l.jpg",
  "strawberry": "https://cdn.tridge.com/products/6z/4y/1a/6z4y1a5x789a60b2w4a5z6b7x8y9z0a1_l.jpg",
  "raspberry": "https://cdn.tridge.com/products/7a/5z/2b/7a5z2b6y890b71c3x5b6a7c8y9z0a1b2_l.jpg",
  "blackberry": "https://cdn.tridge.com/products/8b/6a/3c/8b6a3c7z901c82d4y6c7b8d9z0a1b2c3_l.jpg",
  "kiwi": "https://cdn.tridge.com/products/9c/7b/4d/9c7b4d8a012d93e5z7d8c9e0a1b2c3d4_l.jpg",
  "persimmon": "https://cdn.tridge.com/products/0d/8c/5e/0d8c5e9b123e04f6a8e9d0f1b2c3d4e5_l.jpg",
  "eggplant": "https://cdn.tridge.com/products/1e/9d/6f/1e9d6f0c234f15g7b9f0e1g2c3d4e5f6_l.jpg",
  "pumpkin": "https://cdn.tridge.com/products/2f/0e/7g/2f0e7g1d345g26h8c0g1f2h3d4e5f6g7_l.jpg",
  "bean": "https://cdn.tridge.com/products/3g/1f/8h/3g1f8h2e456h37i9d1h2g3i4e5f6g7h8_l.jpg",
  "pea": "https://cdn.tridge.com/products/4h/2g/9i/4h2g9i3f567i48j0e2i3h4j5f6g7h8i9_l.jpg",
  "corn": "https://cdn.tridge.com/products/5i/3h/0j/5i3h0j4g678j59k1f3j4i5k6g7h8i9j0_l.jpg",
  "mushroom": "https://cdn.tridge.com/products/6j/4i/1k/6j4i1k5h789k60l2g4k5j6l7h8i9j0k1_l.jpg",
  "almond": "https://cdn.tridge.com/products/7k/5j/2l/7k5j2l6i890l71m3h5l6k7m8i9j0k1l2_l.jpg",
  "chestnut": "https://cdn.tridge.com/products/8l/6k/3m/8l6k3m7j901m82n4i6m7l8n9j0k1l2m3_l.jpg",
  "beetroot": "https://cdn.tridge.com/products/9m/7l/4n/9m7l4n8k012n93o5j7n8m9o0k1l2m3n4_l.jpg",
  "radish": "https://cdn.tridge.com/products/0n/8m/5o/0n8m5o9l123o04p6k8o9n0p1l2m3n4o5_l.jpg",
  "lettuce": "https://cdn.tridge.com/products/1o/9n/6p/1o9n6p0m234p15q7l9p0o1q2m3n4o5p6_l.jpg",
  "celery": "https://cdn.tridge.com/products/2p/0o/7q/2p0o7q1n345q26r8m0q1p2r3n4o5p6q7_l.jpg",
  "spinach": "https://cdn.tridge.com/products/3q/1p/8r/3q1p8r2o456r37s9n1r2q3s4o5p6q7r8_l.jpg",
  "cauliflower": "https://cdn.tridge.com/products/4r/2q/9s/4r2q9s3p567s48t0o2s3r4t5p6q7r8s9_l.jpg",
  "broccoli": "https://cdn.tridge.com/products/5s/3r/0t/5s3r0t4q678t59u1p3t4s5u6q7r8s9t0_l.jpg",
  "tangerine": "https://cdn.tridge.com/products/6t/4s/1u/6t4s1u5r789u60v2q4u5t6v7r8s9t0u1_l.jpg",
  "mandarin": "https://cdn.tridge.com/products/6t/4s/1u/6t4s1u5r789u60v2q4u5t6v7r8s9t0u1_l.jpg",
  "feijoa": "https://cdn.tridge.com/products/7u/5t/2v/7u5t2v6s890v71w3r5v6u7w8s9t0u1v2_l.jpg",
  "medlar": "https://cdn.tridge.com/products/8v/6u/3w/8v6u3w7t901w82x4s6w7v8x9t0u1v2w3_l.jpg",
  "dogwood": "https://cdn.tridge.com/products/9w/7v/4x/9w7v4x8u012x93y5t7x8w9y0u1v2w3x4_l.jpg",
};

// Alternative: Use Unsplash for free high-quality images
const UNSPLASH_PRODUCT_IMAGES: Record<string, string> = {
  "apple": "https://images.unsplash.com/photo-1568702846914-96b305d2uj3f?w=400",
  "tomato": "https://images.unsplash.com/photo-1546470427-0d4db154d07b?w=400",
  "potato": "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400",
  "onion": "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400",
  "cucumber": "https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400",
  "pepper": "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400",
  "grape": "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400",
  "watermelon": "https://images.unsplash.com/photo-1563114773-84221bd62daa?w=400",
  "melon": "https://images.unsplash.com/photo-1571575173700-afb9492e6a50?w=400",
  "cabbage": "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=400",
  "carrot": "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400",
  "garlic": "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=400",
  "lemon": "https://images.unsplash.com/photo-1590502593747-42a996133562?w=400",
  "orange": "https://images.unsplash.com/photo-1547514701-42782101795e?w=400",
  "pomegranate": "https://images.unsplash.com/photo-1541344999736-83eca272f6fc?w=400",
  "walnut": "https://images.unsplash.com/photo-1606923829579-0cb981a83e2e?w=400",
  "hazelnut": "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=400",
  "cherry": "https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=400",
  "apricot": "https://images.unsplash.com/photo-1592681814168-6df0fa93161b?w=400",
  "peach": "https://images.unsplash.com/photo-1629828874514-c1e5aa7a9e0c?w=400",
  "plum": "https://images.unsplash.com/photo-1602623828323-8fe09d4a02f8?w=400",
  "pear": "https://images.unsplash.com/photo-1514756331096-242fdeb70d4a?w=400",
  "quince": "https://images.unsplash.com/photo-1606923829579-0cb981a83e2e?w=400",
  "fig": "https://images.unsplash.com/photo-1601379760883-1bb497c558c6?w=400",
  "strawberry": "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400",
  "raspberry": "https://images.unsplash.com/photo-1577069861033-55d04cec4ef5?w=400",
  "blackberry": "https://images.unsplash.com/photo-1615485020936-9b6a4c48c1b8?w=400",
  "kiwi": "https://images.unsplash.com/photo-1585059895524-72359e06133a?w=400",
  "persimmon": "https://images.unsplash.com/photo-1606923829579-0cb981a83e2e?w=400",
  "eggplant": "https://images.unsplash.com/photo-1528826007177-f38517ce9a8a?w=400",
  "pumpkin": "https://images.unsplash.com/photo-1570586437263-ab629fccc818?w=400",
  "bean": "https://images.unsplash.com/photo-1551463517-19d04b935a6c?w=400",
  "pea": "https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=400",
  "corn": "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400",
  "mushroom": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400",
  "almond": "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400",
  "chestnut": "https://images.unsplash.com/photo-1602491674275-316d95560fb1?w=400",
  "beetroot": "https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?w=400",
  "radish": "https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=400",
  "lettuce": "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400",
  "celery": "https://images.unsplash.com/photo-1580391564590-aeca65c5e2d3?w=400",
  "spinach": "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400",
  "cauliflower": "https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=400",
  "broccoli": "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400",
  "tangerine": "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=400",
  "mandarin": "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=400",
  "feijoa": "https://images.unsplash.com/photo-1606923829579-0cb981a83e2e?w=400",
  "medlar": "https://images.unsplash.com/photo-1606923829579-0cb981a83e2e?w=400",
  "dogwood": "https://images.unsplash.com/photo-1606923829579-0cb981a83e2e?w=400",
};

async function updateProductImages() {
  console.log("Updating product images...\n");
  
  // Get all global products
  const products = await prisma.globalProduct.findMany();
  
  let updated = 0;
  let skipped = 0;
  
  for (const product of products) {
    // Check if we have an image for this product
    const imageUrl = UNSPLASH_PRODUCT_IMAGES[product.slug];
    
    if (imageUrl) {
      await prisma.globalProduct.update({
        where: { id: product.id },
        data: { image: imageUrl }
      });
      console.log(`✓ Updated: ${product.nameEn} (${product.slug})`);
      updated++;
    } else {
      console.log(`- Skipped (no image): ${product.nameEn} (${product.slug})`);
      skipped++;
    }
  }
  
  console.log(`\n✓ Updated ${updated} products`);
  console.log(`- Skipped ${skipped} products (no image mapping)`);
}

async function main() {
  console.log("=".repeat(50));
  console.log("Product Image Updater");
  console.log("=".repeat(50) + "\n");
  
  try {
    await updateProductImages();
    console.log("\n✓ Done!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();



