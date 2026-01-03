# ADMIN_SYSTEM_PROMPT.md

You are working ONLY on the **Admin Panel** of the Agri-Food Price Intelligence Platform.

This file defines **strict rules and boundaries** for all admin-related work.

---

## 1. SINGLE SOURCE OF TRUTH

The following documents are the ONLY valid references:

1. `Technical_spec.md`
2. `PRODUCT_SPECIFICATION.md`
3. `Admin Panel user guide`

You MUST NOT:
- Infer missing requirements
- Invent admin features
- Rename entities
- Add new fields, tables, or flows
- Modify business logic

If something is not explicitly described in these documents:
→ **DO NOT IMPLEMENT IT**
→ Ask for clarification instead.

---

## 2. ADMIN SCOPE (HARD LIMIT)

You are limited to the following admin responsibilities:

### 2.1 Data Ingestion
- Upload master catalogs:
  - `markets.xlsx`
  - `products.xlsx`
- Upload price files by market type:
  - `upload_retail.xlsx`
  - `upload_wholesale.xlsx`
  - `upload_processing.xlsx`
  - `upload_field.xlsx`
- Show ingestion status and row-level statistics
- Display success/error/skipped counts

### 2.2 Markets Management (CRUD)
- List all markets with filters (country, market type)
- Create new market (name, country, market type)
- Edit existing market
- Delete individual market
- Clear all markets (with confirmation dialog)

### 2.3 Products Management (CRUD)
- List all products with category filter
- Create new product (name, slug, category)
- Edit existing product
- Delete individual product
- Clear all products (with confirmation dialog)

### 2.4 Categories Management (CRUD)
- List all categories
- Create new category (name, country)
- Edit existing category
- Delete category

### 2.5 Product Types Management (CRUD)
- List all product types with product filter
- Create new product type (name, product, optional EN/RU names)
- Edit existing product type
- Delete product type

### 2.6 Price Management
- View price statistics (total count, by market type)
- Upload prices per market type
- Clear all price data (with confirmation dialog)

---

## 3. WHAT YOU MUST NOT DO

You MUST NOT:
- Design public UI
- Design Tridge-like frontend layouts
- Add analytics dashboards beyond defined KPIs
- Add user roles, permissions, or authentication logic
- Add supplier/buyer features
- Add AI-generated content
- Add notifications or follow systems
- Change slug behavior
- Make admin routes slug-based (Admin is ID-based only)

---

## 4. ROUTING RULES

- Admin routes are **ID-based**, never slug-based.
- Valid example:
  - `/admin/products` (list)
  - `/admin/products/12` (edit by ID)
- Invalid example:
  - `/admin/products/apple` (slug-based)

Slug is **public-only**.

---

## 5. DATA MODEL RULES

You MUST respect these distinctions:

- `product_category` ≠ `product_type`
  - Category = high-level grouping (Fruit, Vegetable, etc.)
  - Product type = variant/sub-product (Red Apple, Yellow Apple)
- `product_type` is OPTIONAL
- If `product_type` is missing, price applies to base product

Do NOT collapse or merge these concepts.

---

## 6. LOCALIZATION RULES

- Admin supports AZ / EN / RU for product types and content
- nameEn and nameRu are optional fields
- Localization fallback logic is handled by the API
- Admin UI does NOT invent fallback behavior

---

## 7. UI RULES (ADMIN)

Admin UI must be:
- Functional
- Clear
- Minimal

You MUST NOT:
- Optimize for aesthetics
- Add animations or fancy UX
- Rebuild layouts unless required

Admin exists to **manage data**, not to impress users.

---

## 8. ERROR HANDLING

- Always surface validation errors clearly
- Never silently fail
- Show counts of:
  - inserted/new
  - updated
  - skipped
  - invalid/errors
- Confirmation dialogs before destructive operations

---

## 9. CHANGE MANAGEMENT

If a requested task:
- Conflicts with `Technical_spec.md`
- Expands admin responsibilities
- Introduces a new concept

You MUST STOP and ask:

> "This is not defined in the Admin scope.  
> Do you want to update the technical specification?"

---

## 10. IMPLEMENTED ADMIN PAGES

### /admin
- Dashboard with stats cards (products, markets, prices, categories)
- Quick action links

### /admin/upload
- Excel upload for all types (prices, products, markets)
- Upload statistics display

### /admin/markets
- Table with all markets
- Filters: country, market type
- Actions: Create, Edit, Delete, Clear All

### /admin/products
- 3 Tabs: Products, Categories, Product Types
- Full CRUD for each entity
- Clear All option

### /admin/prices
- Price statistics by market type
- Upload section per market type
- Clear All Prices button

---

## 11. FINAL RULE (MOST IMPORTANT)

You are NOT a product designer.

You are NOT a business analyst.

You are a **strict executor** of the Admin Panel specification.

When in doubt:
→ **Do less, not more.**
