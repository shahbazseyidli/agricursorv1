# Admin Panel İstifadəçi Təlimatı

Bu sənəd sistemin **Admin Paneli** (`/admin`) üzrə mövcud funksionallıqları və onlardan istifadə qaydalarını əhatə edir.

**Son yenilənmə:** 2026-01-04

---

## 1. Giriş (Authentication)

### Giriş Məlumatları
| Sahə | Dəyər |
|------|-------|
| URL | http://localhost:3000/login |
| Email | admin@agriprice.az |
| Şifrə | admin123 |

### Giriş Prosesi
1. `/login` səhifəsinə keçin
2. Email və şifrəni daxil edin
3. "Daxil ol" düyməsini basın
4. Uğurlu girişdən sonra `/admin` səhifəsinə yönləndirilirsiniz

---

## 2. Admin Panel Keçidləri

| Səhifə | Marşrut | Təsvir |
|--------|---------|--------|
| Dashboard | `/admin` | Əsas panel və statistika |
| Bazarlar | `/admin/markets` | Bazar idarəetməsi |
| Məhsullar | `/admin/products` | AZ məhsulları idarəetməsi |
| Qiymətlər | `/admin/prices` | Qiymət yükləmə |
| Global Məhsullar | `/admin/global-products` | Universal məhsul xəritələmə |
| Global Ölkələr | `/admin/global-countries` | Universal ölkə xəritələmə |
| Global Varieties | `/admin/global-varieties` | Məhsul növləri xəritələmə |
| EU Məhsullar | `/admin/eu-products` | EU məhsul idarəetməsi |
| EU Sinxronizasiya | `/admin/eu-sync` | Eurostat data sinxronizasiyası |
| Yükləmələr | `/admin/upload` | Fayl yükləmə |

---

## 3. Global Məhsullar İdarəetməsi

**Marşrut:** `/admin/global-products`

Bu səhifə 4 mənbədən (AZ, EU, FAO, FPMA) məhsulları birləşdirmək üçün istifadə olunur.

### 3.1 Əsas Funksiyalar

#### Yeni Global Məhsul Yaratmaq
1. "+ Yeni Global Məhsul" düyməsini basın
2. Daxil edin:
   - **Slug** (tələb olunur, URL identifikatoru)
   - **Ad (EN)** (tələb olunur)
   - **Ad (AZ)** (opsional)
   - **Kateqoriya** (dropdown-dan seçin)
3. "Yarat" düyməsini basın

#### Məhsulu Variety-yə Çevirmək
1. Cədvəldə "Çevir" düyməsini basın
2. Hədəf məhsulu seçin (bu məhsulun variety-si olacaq)
3. "Çevir" düyməsini basın
4. **Qeyd:** Əlaqəli bütün mənbə məlumatları köçürülür

---

### 3.2 Mənbə Xəritələmə (Tablar)

Her tab müvafiq mənbədən məhsulları göstərir:

| Tab | Mənbə | Bağlama |
|-----|-------|---------|
| AZ | agro.gov.az | Product → GlobalProduct |
| EU | Eurostat | EuProduct → GlobalProductVariety |
| FAO | FAOSTAT | FaoProduct → GlobalProductVariety |
| FPMA | FAO FPMA | FpmaCommodity → GlobalProductVariety |

#### Məhsulu Bağlamaq
1. "Bağlanmamış" siyahısından məhsul seçin
2. "Bağla" düyməsini basın
3. Açılan dialogda:
   - Global məhsul seçin
   - Variety seçin (və ya "base" seçin)
4. "Bağla" düyməsini basın

#### Bağlantını Redaktə Etmək
1. "Bağlanmış" siyahısından məhsul tapın
2. "Redaktə" düyməsini basın
3. Yeni global məhsul/variety seçin
4. "Yadda saxla" düyməsini basın

---

## 4. Global Ölkələr İdarəetməsi

**Marşrut:** `/admin/global-countries`

Bu səhifə 4 mənbədən ölkələri birləşdirmək üçün istifadə olunur.

### 4.1 Mənbə Tabları

| Tab | Mənbə | Sayı |
|-----|-------|------|
| AZ | Azerbaijan Data | 1 |
| EU | Eurostat | 27 |
| FAO | FAOSTAT | 245+ |
| FPMA | FAO FPMA | 90+ |

### 4.2 Ölkə Bağlamaq
1. "Bağlanmamış" siyahısından ölkə seçin
2. "Bağla" düyməsini basın
3. Global ölkəni seçin
4. "Bağla" düyməsini basın

---

## 5. Global Varieties İdarəetməsi

**Marşrut:** `/admin/global-varieties`

Bu səhifə məhsul növlərini (varieties) idarə etmək üçündür.

### 5.1 Variety Hierarchiyası

```
GlobalProduct: Pomidor
├── GlobalProductVariety: Base (Pomidor özü)
├── GlobalProductVariety: Çeri Pomidor
│   ├── AZ ProductType: Çeri pomidor → bağlı
│   ├── FAO Product: Cherry tomatoes → bağlı
│   └── EU Product: Cherry tomatoes → bağlı
└── GlobalProductVariety: Pomidor pastaları
```

### 5.2 Yeni Variety Yaratmaq
1. "+ Yeni Variety" düyməsini basın
2. Global məhsul seçin
3. Daxil edin:
   - **Slug** (tələb olunur)
   - **Ad (EN)** (tələb olunur)
   - **Ad (AZ)** (opsional)
4. "Yarat" düyməsini basın

### 5.3 Mənbə Məhsullarını Variety-yə Bağlamaq

İş axını:
1. Global Məhsul seçin
2. Variety seçin (və ya yaradın)
3. Mənbə seçin (AZ, EU, FAO, FPMA)
4. Həmin mənbədən məhsul/product_type seçin
5. "Bağla" düyməsini basın

---

## 6. Bazarlar İdarəetməsi

**Marşrut:** `/admin/markets`

### 6.1 Yeni Bazar Yaratmaq
1. "+ Yeni Bazar" düyməsini basın
2. Daxil edin:
   - **Ad** (tələb olunur)
   - **Ölkə** (dropdown-dan seçin)
   - **Bazar növü** (dropdown-dan seçin)
3. "Əlavə et" düyməsini basın

---

## 7. AZ Məhsullar İdarəetməsi

**Marşrut:** `/admin/products`

Bu səhifədə 3 tab mövcuddur:

### 7.1 Məhsullar Tabı
- AZ məhsullarının cədvəli
- Kateqoriya filteri

### 7.2 Kateqoriyalar Tabı
- Kateqoriya siyahısı
- Hər kateqoriya üçün məhsul sayı

### 7.3 Məhsul Növləri Tabı
- ProductType-ların siyahısı
- Məhsul filteri

---

## 8. Qiymət İdarəetməsi

**Marşrut:** `/admin/prices`

### 8.1 Qiymət Yükləmə

Hər bazar növü üçün ayrı yükləmə:

| Fayl | Bazar Növü |
|------|------------|
| upload_retail.xlsx | Pərakəndə |
| upload_wholesale.xlsx | Topdansatış |
| upload_processing.xlsx | Müəssisə |
| upload_field.xlsx | Sahədən satış |

### 8.2 Excel Fayl Formatı

| Sütun | Tələb | Açıqlama |
|-------|-------|----------|
| product_name | Bəli | Məhsul adı |
| product_type | Xeyr | Məhsul növü |
| date | Bəli | Tarix (DD.MM.YYYY) |
| market | Bəli | Bazar adı |
| price_min | Bəli | Minimum qiymət |
| price_avg | Bəli | Orta qiymət |
| price_max | Bəli | Maksimum qiymət |
| unit | Bəli | Ölçü vahidi |
| currency | Bəli | Valyuta (AZN) |

---

## 9. Data Yükləmə Ardıcıllığı

Düzgün ardıcıllıq:
1. **Global Countries** - Əvvəlcə global ölkələri seed edin
2. **markets.xlsx** - Bazarları yükləyin
3. **products.xlsx** - Məhsulları yükləyin
4. **Global Products** - Global məhsulları yaradın/xəritələyin
5. **Global Varieties** - Variety-ləri yaradın
6. **upload_*.xlsx** - Qiymətləri yükləyin

---

## 10. Seed Skriptləri

```bash
# Global ölkələri seed et
npx tsx scripts/seed-global-countries.ts

# Global məhsulları seed et
npx tsx scripts/seed-global-products.ts

# Base variety-ləri yarat
npx tsx scripts/seed-base-varieties.ts

# EU datanı gətir
npx tsx scripts/seed-eu-data.ts

# FAO datanı gətir
npx tsx scripts/seed-fao-data.ts

# FPMA datanı gətir
npx tsx scripts/seed-fpma-data.ts

# Valyutaları yenilə
npx tsx scripts/update-currencies.ts

# AZ aqreqatlarını hesabla
npx tsx scripts/calculate-az-aggregates.ts
```

---

## 11. Xəta Həlləri

| Problem | Həll |
|---------|------|
| Səhifə boş görünür | Server restart edin: `npm run dev` |
| Varieties görünmür | `npx prisma generate` işlədin |
| EU/FAO tabı boş | Login olduğunuza əmin olun |
| "Unauthorized" xətası | `/login`-dən yenidən giriş edin |
| "Too many open files" | `ulimit -n 65536` işlədin |

---

## 12. Tövsiyələr

1. **Base Variety:** Hər GlobalProduct-un "base" variety-si olmalıdır
2. **Mənbə əlaqələri:** Məhsulları silməzdən əvvəl əlaqələri yoxlayın
3. **Slug format:** Slug-lar kebab-case olmalıdır (məs: `cherry-tomato`)
4. **Yedəkləmə:** Böyük dəyişikliklərdən əvvəl database yedəkləyin:
   ```bash
   cp prisma/dev.db prisma/dev.db.backup
   ```

---

## 13. API Endpoint-ləri

### Admin API-ları

| Endpoint | Metod | Təsvir |
|----------|-------|--------|
| /api/admin/global-products | GET, POST | Global məhsullar |
| /api/admin/global-countries | GET, POST | Global ölkələr |
| /api/admin/global-varieties | GET, POST | Global varieties |
| /api/admin/global-price-stages | GET, POST | Price stages |
| /api/admin/global-markets | GET, POST | Global markets |
| /api/admin/eu-products | GET, POST | EU məhsulları |
| /api/admin/fao-products | GET | FAO məhsulları |
| /api/admin/fpma-commodities | GET | FPMA commodities |

---

**Son yenilənmə:** 2026-01-04

*Yeni əlavələr: Global Varieties, GlobalCountry xəritələmə, GlobalPriceStage, GlobalMarket, Variety-yə çevirmə funksiyası*
