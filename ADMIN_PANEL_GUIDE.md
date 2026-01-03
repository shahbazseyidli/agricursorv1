# Admin Panel İstifadəçi Təlimatı

Bu sənəd sistemin **Admin Paneli** (`/admin`) üzrə mövcud funksionallıqları və onlardan istifadə qaydalarını əhatə edir.

**Son yenilənmə:** 2026-01-02

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

## 2. Əsas Panel (Dashboard)
**Marşrut:** `/admin`

Bu səhifə admin panelinin mərkəzi nöqtəsidir.

### Statistika Kartları
- **Məhsullar:** Ümumi məhsul sayı
- **Bazarlar:** Ümumi bazar sayı
- **Qiymətlər:** Ümumi qiymət qeydi sayı
- **Kateqoriyalar:** Ümumi kateqoriya sayı

### Sürətli Keçidlər
- Yeni məhsul əlavə et
- Yeni bazar əlavə et
- Qiymət yüklə
- Bütün bazarları gör

---

## 3. Bazarlar İdarəetməsi
**Marşrut:** `/admin/markets`

### 3.1 Bazar Siyahısı
- Bütün bazarların cədvəl görünüşü
- **Filterlər:**
  - Ölkə seçimi
  - Bazar növü seçimi (Pərakəndə, Topdansatış, və s.)

### 3.2 Yeni Bazar Yaratmaq
1. "+ Yeni Bazar" düyməsini basın
2. Dialog pəncərəsində daxil edin:
   - **Ad** (tələb olunur)
   - **Ölkə** (dropdown-dan seçin)
   - **Bazar növü** (dropdown-dan seçin)
3. "Əlavə et" düyməsini basın

### 3.3 Bazarı Redaktə Etmək
1. Cədvəldə bazarın "Düzəlt" düyməsini basın
2. Açılan formada dəyişiklik edin
3. "Yadda saxla" düyməsini basın

### 3.4 Bazarı Silmək
1. Cədvəldə bazarın "Sil" düyməsini basın
2. Təsdiq dialoqundan "Sil" seçin
3. **Qeyd:** Bazarla əlaqəli qiymətlər də silinəcək

### 3.5 Bütün Bazarları Silmək
1. "Hamısını sil" düyməsini basın
2. Təsdiq dialoqundan onaylayın
3. **Xəbərdarlıq:** Bu əməliyyat geri qaytarıla bilməz

---

## 4. Məhsullar İdarəetməsi
**Marşrut:** `/admin/products`

Bu səhifədə 3 tab mövcuddur:

### 4.1 Məhsullar Tabı

#### Məhsul Siyahısı
- Bütün məhsulların cədvəli
- **Filterlər:** Kateqoriya seçimi

#### Yeni Məhsul Yaratmaq
1. "+ Yeni Məhsul" düyməsini basın
2. Daxil edin:
   - **Ad (AZ)** - tələb olunur
   - **Slug** - URL identifikatoru (EN, kebab-case)
   - **Kateqoriya** - dropdown-dan seçin
3. "Əlavə et" düyməsini basın

#### Məhsulu Redaktə/Silmək
- Cədvəldəki əməliyyat düymələrini istifadə edin

---

### 4.2 Kateqoriyalar Tabı

#### Kateqoriya Siyahısı
- Bütün kateqoriyaların cədvəli
- Hər kateqoriya üçün məhsul sayı göstərilir

#### Yeni Kateqoriya Yaratmaq
1. "+ Yeni Kateqoriya" düyməsini basın
2. Daxil edin:
   - **Ad** - tələb olunur
3. "Əlavə et" düyməsini basın

---

### 4.3 Məhsul Növləri Tabı

#### Məhsul Növləri Siyahısı
- Bütün məhsul növlərinin (variantların) cədvəli
- **Filterlər:** Məhsul seçimi

#### Yeni Məhsul Növü Yaratmaq
1. "+ Yeni Növ" düyməsini basın
2. Daxil edin:
   - **Ad (AZ)** - tələb olunur
   - **Məhsul** - dropdown-dan seçin
   - **Ad (EN)** - opsional
   - **Ad (RU)** - opsional
3. "Əlavə et" düyməsini basın

---

## 5. Qiymət İdarəetməsi
**Marşrut:** `/admin/prices`

### 5.1 Statistika Kartları
- Ümumi qiymət qeydlərinin sayı
- Hər bazar növü üzrə qiymət sayı:
  - Pərakəndə satış
  - Topdansatış
  - Müəssisə tərəfindən alış
  - Sahədən satış

### 5.2 Qiymət Yükləmə

Hər bazar növü üçün ayrı yükləmə bölməsi var:

1. Müvafiq bazar növünü tapın
2. "Fayl seç" düyməsini basın
3. Excel faylını seçin:
   - `upload_retail.xlsx` - Pərakəndə
   - `upload_wholesale.xlsx` - Topdansatış
   - `upload_processing.xlsx` - Müəssisə
   - `upload_field.xlsx` - Sahədən satış
4. Yükləmə avtomatik başlayacaq
5. Nəticələr göstəriləcək:
   - **Yeni:** Əlavə edilən qeydlər
   - **Yeniləndi:** Mövcud qeydlər
   - **Keçildi:** Dəyişiklik olmadan keçilən
   - **Xətalar:** Problemli sətirlər

### 5.3 Bütün Qiymətləri Silmək
1. "Bütün qiymətləri sil" düyməsini basın
2. Təsdiq dialoqundan silinəcək qeyd sayını görün
3. Onaylayın
4. **Xəbərdarlıq:** Bu əməliyyat geri qaytarıla bilməz

---

## 6. Ümumi Məlumat Yükləmə
**Marşrut:** `/admin/upload`

Bu səhifədən bütün növ faylları yükləyə bilərsiniz:

### Fayl Növləri
| Fayl | Məqsəd |
|------|--------|
| markets.xlsx | Bazar kataloqunu yeniləmək |
| products.xlsx | Məhsul kataloqunu yeniləmək |
| upload_*.xlsx | Qiymət məlumatlarını yükləmək |

### Yükləmə Prosesi
1. Fayl növünü seçin
2. Faylı seçin
3. Yükləmə tamamlanana qədər gözləyin
4. Nəticələri yoxlayın

---

## 7. Excel Fayl Formatları

### 7.1 markets.xlsx
| Sütun | Tələb | Açıqlama |
|-------|-------|----------|
| Market | Bəli | Bazar adı (AZ) |
| type | Bəli | Bazar növü (nameAz ilə eyni olmalı) |

### 7.2 products.xlsx
| Sütun | Tələb | Açıqlama |
|-------|-------|----------|
| product_name | Bəli | Məhsul adı (AZ) |
| category | Bəli | Kateqoriya adı |
| slug | Bəli | URL identifikatoru |
| name_en | Xeyr | İngilis adı |
| name_ru | Xeyr | Rus adı |

### 7.3 Qiymət faylları (upload_*.xlsx)
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
| source | Xeyr | Mənbə |

---

## 8. Xəta Mesajları

| Xəta | Səbəb | Həll |
|------|-------|------|
| "Məhsul tapılmadı" | Excel-dəki məhsul adı bazada yoxdur | products.xlsx-i əvvəl yükləyin |
| "Bazar tapılmadı" | Excel-dəki bazar adı bazada yoxdur | markets.xlsx-i əvvəl yükləyin |
| "Yanlış tarix formatı" | Tarix DD.MM.YYYY formatında deyil | Excel-də tarixi düzəldin |
| "Qiymət rəqəm deyil" | Qiymət sütununda mətn var | Excel-də düzəldin |

---

## 9. Məlumat Yükləmə Ardıcıllığı

Düzgün ardıcıllıq:
1. **markets.xlsx** - Əvvəlcə bazarları yükləyin
2. **products.xlsx** - Sonra məhsulları yükləyin
3. **upload_*.xlsx** - Nəhayət qiymətləri yükləyin

Bu ardıcıllıq vacibdir, çünki qiymət yükləməsi mövcud bazar və məhsul qeydlərinə istinad edir.

---

## 10. EU Məlumatları İdarəetməsi

### 10.1 EU Ölkələri və Məhsulları

EU məlumatları avtomatik olaraq Eurostat və EC Agri-food API-larından gətirilir.

**Skriptlər:**
```bash
# EU məlumatlarını gətir
npx tsx scripts/seed-eu-data.ts

# AZ agregat qiymətlərini hesabla
npx tsx scripts/calculate-az-aggregates.ts

# Məhsul məzmununu əlavə et
npx tsx scripts/seed-product-content.ts

# Məhsul şəkillərini gətir
npx tsx scripts/fetch-product-images.ts
```

### 10.2 GlobalProduct İdarəetməsi

GlobalProduct cədvəli AZ və EU məhsullarını birləşdirir.

**Əlaqələr:**
- Bir GlobalProduct → Bir və ya daha çox AZ Product
- Bir GlobalProduct → Bir və ya daha çox EU EuProduct

### 10.3 Valyuta Məzənnələri

Valyuta məzənnələri CBAR və FreeCurrencyAPI-dan gətirilir.

**Yeniləmə tezliyi:** Gündə 4 dəfə (10:00, 14:00, 19:00, 02:00 UTC+4)

**Skript:**
```bash
npx tsx scripts/update-currencies.ts
```

---

## 11. Tövsiyələr

1. **Yedəkləmə:** Mühüm əməliyyatlardan əvvəl database-i yedəkləyin
2. **Kiçik partiyalar:** Böyük faylları kiçik hissələrə bölün
3. **Yoxlama:** Yükləmədən sonra statistikaları yoxlayın
4. **Təmiz data:** Excel-də boş sətirlər və xüsusi simvollardan qaçının
5. **EU datası:** EU məlumatları avtomatik yeniləndiyindən, manual dəyişiklik etməyin
6. **GlobalProduct:** Məhsulları düzgün əlaqələndirdiyinizə əmin olun

---

**Son yenilənmə:** 2026-01-02



