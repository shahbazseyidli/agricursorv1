/**
 * Seed Product Content - Tridge-style rich content for products
 * 
 * Run with: npx tsx scripts/seed-product-content.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PRODUCT_CONTENT: Record<string, {
  descriptionAz: string;
  descriptionEn: string;
  history: string;
  uses: string;
  nutrition: string;
  varieties: string;
  storage: string;
  seasonality: string;
}> = {
  "apple": {
    descriptionAz: `Alma dünyada ən çox yetişdirilən meyvələrdən biridir. Azərbaycanda alma əsasən Quba, Şəki, Zaqatala və dağlıq bölgələrdə becərilir. Ölkədə 20-dən çox alma sortu yetişdirilir.`,
    descriptionEn: `Apple is one of the most widely cultivated fruits in the world. In Azerbaijan, apples are mainly grown in Quba, Sheki, Zagatala and mountain regions. More than 20 apple varieties are cultivated in the country.`,
    history: `Alma meyvəsinin tarixi Orta Asiyaya, xüsusilə Qazaxıstan və Qırğızıstana gedib çıxır. Azərbaycanda alma becəriciliyi 3000 ildən çoxdur. İpək Yolu ticarəti vasitəsilə alma bütün dünyaya yayılmışdır.`,
    uses: `Təzə yeyilir, şirə hazırlanır, mürəbbə, kompot, qurudulmuş meyvə kimi istifadə olunur. Kulinariyada tortlar, piroqlar və salatlarda geniş istifadə edilir. Sirkə və sidra istehsalında da vacib rol oynayır.`,
    nutrition: `100 q alma: 52 kkal, 14 q karbohidrat, 2.4 q lif, 10 mq C vitamini. Almanın qabığında antioksidantlar, xüsusilə kversetin var. Qan şəkərini nizamlayır, ürək sağlamlığına kömək edir.`,
    varieties: `Azərbaycanda populyar sortlar: Qızıl Əhmədi, Şəmahı, Sinap, Renet Simirenko, Gəncə, Ay ulduzu. Avropa sortları: Golden Delicious, Gala, Fuji, Granny Smith.`,
    storage: `Soyuq yerdə (0-4°C) 2-6 ay saxlanıla bilər. Etilen qazı buraxdığı üçün digər meyvələrdən ayrı saxlanmalıdır. Ən yaxşı nəticə üçün 85-90% rütubətdə saxlayın.`,
    seasonality: `Azərbaycanda alma mövsümü avqust-oktyabr aylarıdır. Saxlama şəraitində il boyu mövcuddur. Ən təzə almalar payız aylarında tapılır.`
  },
  "tomato": {
    descriptionAz: `Pomidor Azərbaycanın əsas tərəvəz məhsullarından biridir. Ölkədə ildə 500.000 tondan çox pomidor istehsal olunur. İxracın əsas hissəsi Rusiya və digər MDB ölkələrinə gedir.`,
    descriptionEn: `Tomato is one of Azerbaijan's main vegetable products. The country produces over 500,000 tons of tomatoes annually. The main exports go to Russia and other CIS countries.`,
    history: `Pomidor Cənubi Amerikadan gəlir və 16-cı əsrdə Avropaya gətirilmişdir. Azərbaycana 19-cu əsrdə daxil olmuş və indi ölkənin əsas kənd təsərrüfatı məhsullarından biridir.`,
    uses: `Təzə salatlarda, sousların hazırlanmasında, konservləşdirmədə, qurutmada istifadə olunur. Azərbaycan mətbəxində qutab, dolma və digər yeməklərin vacib ingrediyentidir.`,
    nutrition: `100 q pomidor: 18 kkal, 3.9 q karbohidrat, likopen (güclü antioksidant), C və K vitaminləri. Likopen ürək xəstəlikləri və bəzi xərçəng növlərinin riskini azaldır.`,
    varieties: `Populyar sortlar: Bakı F1, Azərbaycan, Çeri pomidor, Biftek, Roma. İstixana və açıq sahədə yetişdirilən sortlar mövcuddur.`,
    storage: `Otaq temperaturunda 3-5 gün, soyuducuda 1-2 həftə. Yetişməmiş pomidorları otaq temperaturunda saxlayın. Soyuq pomidorun dadını azaldır.`,
    seasonality: `Azərbaycanda mövsüm may-oktyabr. İstixanalarda il boyu yetişdirilir. Ən yaxşı keyfiyyət yay aylarındadır.`
  },
  "grape": {
    descriptionAz: `Üzüm Azərbaycanın ən qədim və mühüm kənd təsərrüfatı məhsullarından biridir. Ölkə şərab istehsalı üçün məşhurdur və 400-dən çox yerli üzüm sortu var.`,
    descriptionEn: `Grape is one of Azerbaijan's oldest and most important agricultural products. The country is famous for wine production and has over 400 local grape varieties.`,
    history: `Azərbaycan dünyanın ən qədim şərabçılıq mərkəzlərindən biridir. Arxeoloji tapıntılar 6000 il əvvəl üzümçülüyün olduğunu göstərir. Qobustan qayaüstü rəsmlərində üzüm təsvir edilir.`,
    uses: `Təzə yeyilir, şərab, şirə, kişmiş, mürəbbə istehsalı. Azərbaycan şərabları beynəlxalq mükafatlar qazanır. Üzüm sirkəsi, üzüm yağı da istehsal olunur.`,
    nutrition: `100 q üzüm: 69 kkal, 18 q karbohidrat, resveratrol antioksidantı. Qara üzümdə daha çox antioksidant var. Ürək sağlamlığını dəstəkləyir.`,
    varieties: `Yerli sortlar: Bayanşirə, Mədrəsə, Ağ Şanı, Qara Şanı, Xindoğnı. İdxal sortlar: Cabernet, Merlot, Chardonnay. Süfrə və şərab sortları.`,
    storage: `Soyuducuda 1-2 həftə saxlanır. Yuyulmadan saxlayın, yalnız yeməzdən əvvəl yuyun. Dondurulmuş üzüm 6 ay saxlanıla bilər.`,
    seasonality: `Mövsüm avqust-oktyabr. İxracat üçün saxlama texnologiyaları ilə payız-qış aylarında da mövcuddur.`
  },
  "pomegranate": {
    descriptionAz: `Azərbaycan dünyanın ən böyük nar istehsalçılarından və ixracatçılarından biridir. Göyçay bölgəsi "Nar paytaxtı" olaraq tanınır və hər il Nar Bayramı keçirilir.`,
    descriptionEn: `Azerbaijan is one of the world's largest pomegranate producers and exporters. The Goychay region is known as the "Pomegranate capital" and hosts an annual Pomegranate Festival.`,
    history: `Nar Qafqaz və İran bölgəsinin doğma meyvəsidir. Azərbaycanda min illərdir becərilir. Mədəniyyətdə bolluq və bərəkət simvoludur.`,
    uses: `Təzə yeyilir, şirə, şərab, souslarda istifadə olunur. Narsharab - nar şirəsindən hazırlanan sous Azərbaycan mətbəxinin mühüm hissəsidir.`,
    nutrition: `100 q nar: 83 kkal, 19 q karbohidrat, güclü antioksidantlar. Polifenollar ürək xəstəlikləri riskini azaldır. C vitamini və kalium mənbəyidir.`,
    varieties: `Azərbaycan sortları: Göyçay, Gülosha, Bala Mürsəl, Şirin nar, Turş nar. İri toxumlu və kiçik toxumlu sortlar.`,
    storage: `Soyuq yerdə 2-3 ay saxlanır. Bütöv nar daha uzun saxlanır. Toxumlar dondurulmuş şəkildə 6 ay saxlanıla bilər.`,
    seasonality: `Mövsüm oktyabr-noyabr. Göyçay Nar Bayramı noyabr ayında keçirilir. Saxlanmış nar qış aylarında mövcuddur.`
  },
  "potato": {
    descriptionAz: `Kartof Azərbaycanın əsas ərzaq məhsullarından biridir. Ölkədə ildə 1 milyon tondan çox kartof istehsal olunur. Gədəbəy, Şəmkir və dağlıq bölgələr əsas istehsal mərkəzləridir.`,
    descriptionEn: `Potato is one of Azerbaijan's staple food products. The country produces over 1 million tons of potatoes annually. Gadabay, Shamkir and mountain regions are the main production centers.`,
    history: `Kartof Cənubi Amerikadan gəlir, 18-ci əsrdə Qafqaza gətirilmişdir. İndi Azərbaycanda çörək, düyü ilə yanaşı əsas karbohidrat mənbəyidir.`,
    uses: `Qızartma, bişirmə, püre, salat, çipslər. Azərbaycan mətbəxində kükü, kartof dolması, piti kimi yeməklərdə istifadə olunur.`,
    nutrition: `100 q kartof: 77 kkal, 17 q karbohidrat, C vitamini, B6, kalium. Qabıqlı bişirildikdə daha faydalıdır.`,
    varieties: `Populyar sortlar: Gədəbəy, Daşkənd, Sante, Granola. Erkən, orta və gec yetişən sortlar mövcuddur.`,
    storage: `Soyuq, qaranlıq yerdə 2-3 ay. Işıqdan uzaq saxlayın, yaşıllaşmaya yol verməyin. Soğan ilə birlikdə saxlamayın.`,
    seasonality: `Erkən kartof iyun-iyul, əsas məhsul sentyabr-oktyabr. Saxlama ilə il boyu mövcuddur.`
  },
  "cucumber": {
    descriptionAz: `Xiyar Azərbaycanda həm açıq sahədə, həm də istixanalarda geniş yetişdirilir. İstixana xiyarları il boyu bazar tələbatını ödəyir.`,
    descriptionEn: `Cucumber is widely grown in Azerbaijan both in open fields and greenhouses. Greenhouse cucumbers meet market demand throughout the year.`,
    history: `Xiyar Hindistandan gəlir, 3000 ildən çoxdur ki, becərilir. Azərbaycana İpək Yolu vasitəsilə gəlmişdir.`,
    uses: `Təzə salatlarda, turşuda, şirə kimi. Azərbaycan turşuları (xiyar turşusu) populyardır. Kosmetikada da istifadə olunur.`,
    nutrition: `100 q xiyar: 16 kkal, 95% su, K vitamini, antioksidantlar. Hidratasiya üçün əladır, az kalorilidir.`,
    varieties: `Uzun xiyar, qısa xiyar, korni-şon. İstixana və tarla sortları. Salata və turşuya yararlı sortlar.`,
    storage: `Soyuducuda 1 həftə. Plastik örtüyə bükülmüş xiyar daha uzun qalır. Pomidordan ayrı saxlayın.`,
    seasonality: `Tarla xiyarı may-sentyabr. İstixana xiyarı il boyu. Yaz-yay aylarında ən yaxşı qiymətlər.`
  },
  "onion": {
    descriptionAz: `Soğan Azərbaycanda demək olar ki, hər yeməkdə istifadə olunan əsas tərəvəzdir. İldə 200.000 tondan çox istehsal olunur.`,
    descriptionEn: `Onion is a staple vegetable used in almost every dish in Azerbaijan. Over 200,000 tons are produced annually.`,
    history: `Soğan 5000 ildən çoxdur ki, becərilir. Azərbaycanda qədim zamanlardan istifadə olunur. Osmanlı mətbəxinin təsiri ilə daha da yayılmışdır.`,
    uses: `Hər növ yeməkdə - plov, dolma, kabab, şorbalar. Qızardılmış, təzə, turşu kimi. Soğan halqaları populyar qəlyanaltıdır.`,
    nutrition: `100 q soğan: 40 kkal, prebiotik lif, kversetin antioksidantı. İmmunitet gücləndirir, iltihaba qarşı xassələri var.`,
    varieties: `Ağ soğan, qırmızı soğan, yaşıl soğan. Yumşaq və kəskin sortlar. Saxlamaya yararlı qış sortları.`,
    storage: `Soyuq, quru, qaranlıq yerdə 1-2 ay. Kəsilmiş soğan soyuducuda 7-10 gün. Rütubətdən qoruyun.`,
    seasonality: `Yeni soğan may-iyun, əsas məhsul avqust-sentyabr. Quru soğan il boyu mövcuddur.`
  },
  "pepper": {
    descriptionAz: `Bibər Azərbaycanda həm şirin, həm də acı sortları ilə geniş becərilir. İstixana və açıq sahə istehsalı aparılır.`,
    descriptionEn: `Pepper is widely grown in Azerbaijan in both sweet and hot varieties. Both greenhouse and open field production is practiced.`,
    history: `Bibər Cənubi Amerikadan gəlir, 16-cı əsrdə Avropaya gətirilmişdir. Azərbaycanda 19-cu əsrdən becərilir.`,
    uses: `Təzə salatlarda, dolmada, qızartmada. Turşu bibəri populyardır. Acı bibər souslarda və ədviyyələrdə.`,
    nutrition: `100 q şirin bibər: 31 kkal, çox C vitamini (portağaldan 3 dəfə çox), A vitamini, antioksidantlar.`,
    varieties: `Dolmalıq bibər, California Wonder, Acı bibər, Çili. Qırmızı, sarı, yaşıl, narıncı rənglər.`,
    storage: `Soyuducuda 1-2 həftə. Bütöv bibər daha uzun qalır. Dondurulmuş bibər 6 ay saxlanır.`,
    seasonality: `Tarla bibəri iyul-oktyabr. İstixana bibəri il boyu. Yay aylarında ən yaxşı qiymətlər.`
  },
  "carrot": {
    descriptionAz: `Yerkökü Azərbaycanda geniş becərilir və il boyu bazar mövcudluğu var. Şorbalar, plovlar və salatların vacib hissəsidir.`,
    descriptionEn: `Carrot is widely grown in Azerbaijan with year-round market availability. It is an essential part of soups, pilafs and salads.`,
    history: `Yerkökü Əfqanıstandan gəlir, ilk növbəti bənövşəyi rəngdə idi. Narıncı yerkökü 17-ci əsrdə Hollandiyada yaradılmışdır.`,
    uses: `Şorbalar, plovlar, salatlar, şirə. Azərbaycan mətbəxində piti, bozbaş, dovğa yeməklərində istifadə olunur.`,
    nutrition: `100 q yerkökü: 41 kkal, çox A vitamini (beta-karoten), K vitamini, lif. Göz sağlamlığını dəstəkləyir.`,
    varieties: `Nantes, Chantenay, Danvers. Erkən və gec yetişən sortlar. Uzun və qısa formalar.`,
    storage: `Soyuducuda 2-3 həftə. Qumda və ya torf-qumda 4-5 ay saxlanıla bilər. Yaşıl hissəni kəsin.`,
    seasonality: `Erkən məhsul iyun, əsas məhsul sentyabr-oktyabr. Saxlama ilə il boyu mövcuddur.`
  },
  "cabbage": {
    descriptionAz: `Kələm Azərbaycanda geniş becərilən tərəvəzdir. Ağ kələm, qırmızı kələm və gül kələm sortları yetişdirilir.`,
    descriptionEn: `Cabbage is a widely grown vegetable in Azerbaijan. White cabbage, red cabbage and cauliflower varieties are cultivated.`,
    history: `Kələm Avropa mənşəlidir, 4000 ildən çoxdur becərilir. Azərbaycana Rusiya vasitəsilə geniş yayılmışdır.`,
    uses: `Dolma, turşu, salat, şorbalar. Azərbaycan mətbəxində kələm dolması populyardır. Turşu kələm qış aylarında mühüm ərzaqdır.`,
    nutrition: `100 q kələm: 25 kkal, C və K vitaminləri, lif. Az kalorilidir, həzm sistemini dəstəkləyir.`,
    varieties: `Ağ kələm, qırmızı kələm, gül kələm, brüssel kələmi. Erkən, orta və gec yetişən sortlar.`,
    storage: `Soyuducuda 1-2 ay. Bütöv kələm daha uzun qalır. Turşu şəklində 6 ay və daha çox.`,
    seasonality: `Erkən kələm iyun-iyul, gec kələm oktyabr-noyabr. Saxlama ilə qış aylarında mövcuddur.`
  }
};

async function seedProductContent() {
  console.log("Seeding product content...\n");
  
  let updated = 0;
  
  for (const [slug, content] of Object.entries(PRODUCT_CONTENT)) {
    const product = await prisma.globalProduct.findUnique({
      where: { slug }
    });
    
    if (!product) {
      console.log(`- Skipped: ${slug} (not found)`);
      continue;
    }
    
    await prisma.globalProduct.update({
      where: { id: product.id },
      data: {
        descriptionAz: content.descriptionAz,
        descriptionEn: content.descriptionEn,
        history: content.history,
        uses: content.uses,
        nutrition: content.nutrition,
        varieties: content.varieties,
        storage: content.storage,
        seasonality: content.seasonality
      }
    });
    
    console.log(`✓ Updated: ${product.nameEn} (${slug})`);
    updated++;
  }
  
  console.log(`\n✓ Updated ${updated} products with rich content`);
}

async function main() {
  console.log("=".repeat(50));
  console.log("Product Content Seeder");
  console.log("=".repeat(50) + "\n");
  
  try {
    await seedProductContent();
    console.log("\n✓ Done!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();


