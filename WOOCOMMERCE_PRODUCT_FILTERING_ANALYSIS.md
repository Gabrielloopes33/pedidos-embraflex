# WooCommerce Product Fetching and Filtering Analysis

## Executive Summary

**Problem:** Products like "SACOLA DE PAPEL PERSONALIZADA" are appearing in the system even though they don't have the "interno" tag/category.

**Root Cause:** The "interno" category filtering is INCONSISTENTLY applied across different data fetching paths. The sync process fetches ALL products from WooCommerce and caches them, but only the backend proxy enforces the "interno" filter.

---

## Key Findings

### 1. HTTP Requests to WooCommerce API

#### Backend Proxy Route (Filtered ✅)
**File:** backend/src/index.ts (Lines 452-501)
- Route: GET /api/wc/products
- Finds "Interno" or "Interna" category
- Filters products by category ID
- Returns empty array if category not found

#### Direct Frontend Call (Filtered via Proxy ✅)
**File:** src/lib/woocommerce.ts (Lines 5-31)
- Function: getProducts()
- Routes through /api/wc/products proxy
- Applies "interno" filter via proxy

#### Sync Service (NOT Filtered ❌)
**File:** backend/src/services/sync.ts (Lines 152-162)
- Function: syncProducts()
- Fetches ALL products from WooCommerce
- NO category filter applied
- Caches all products regardless of category

### 2. Cache Retrieval (NOT Filtered ❌)

#### Supabase Cache Query
**File:** src/lib/supabase.ts (Lines 29-72)
- Function: getCachedProducts()
- Retrieves from wc_products_cache table
- Filters by: is_active, search vector, sku
- NO "interno" category filter by default

### 3. Product Display Logic

#### Products Page
**File:** src/pages/Products.tsx
- Lines 389-395: Uses getCachedProducts() first (no "interno" filter)
- Lines 398-408: Falls back to getProductsFromWC() if cache empty (filtered)
- Lines 444-480: Groups products by line (Premium, Comercial, Economica)
- Lines 868-891: Special handling for "sacola de papel" products

#### ProductNavigator
**File:** src/pages/NewQuote/components/ProductNavigator.tsx
- Line 207: Excludes 'interno' from main categories
- Line 266: Excludes 'interno' from lines
- Does NOT enforce "interno" filter for product display

### 4. Configuration Files

#### Environment Variables
**File:** .env.example
- VITE_WOOCOMMERCE_URL
- VITE_WOOCOMMERCE_CONSUMER_KEY
- VITE_WOOCOMMERCE_CONSUMER_SECRET
- SUPABASE_URL, SUPABASE_ANON_KEY

#### WooCommerce Client
**File:** backend/src/woocommerce.ts
- Configures WooCommerceRestApi
- Uses environment variables for credentials

#### Product Documentation
**File:** CONFIGURACAO_PRODUTOS_WOOCOMMERCE.md
- Lines 5-8: States "interno" filter should be enforced
- Line 132: Requires products to be in "Interno" or "Interna" category

### 5. Database Schema

#### Products Cache Table
**File:** backend/migrations/002_create_cache_tables.sql (Lines 6-30)
- Table: wc_products_cache
- Categories stored as JSONB
- NO constraint or index for "interno" category
- Stores ALL synced products

---

## Why "SACOLA DE PAPEL PERSONALIZADA" Appears

### Data Flow Problem:

1. **Sync Phase:**
   - Sync service fetches ALL products (no filter)
   - Product synced even without "interno" category
   - Stored in wc_products_cache with is_active=true

2. **Frontend Load:**
   - Products.tsx calls getCachedProducts()
   - Returns ALL active products from cache
   - No "interno" filter applied

3. **User Interaction:**
   - User searches for "sacola"
   - getCachedProducts({ search: 'sacola' }) searches ALL products
   - Product appears in results

### Product Characteristics:
- Special handling for "sacola de papel" in UI (Products.tsx:868-891)
- Has finishing configuration option
- Likely categorized as "Linha Premium/Comercial/Economica" instead of "Interno"
- SKU may start with "k-" (paper bag indicator)

---

## Solution Recommendations

### Option 1: Fix Sync to Filter by "Interno" Category (Recommended)

Modify: backend/src/services/sync.ts (around line 125)

1. Find "Interno" category ID before sync
2. Add category filter to WooCommerce API call
3. Only sync products with "Interno" or "Interna" category

**Pros:**
- Prevents non-compliant products from being cached
- Reduces cache size
- Maintains consistency at data source

**Cons:**
- Requires full sync to clean existing cache
- Need to handle missing "interno" category gracefully

### Option 2: Add "Interno" Filter to Cache Queries

Modify: src/lib/supabase.ts (around line 29)

Add parameter to filter by "interno" category by default.

**Pros:**
- Consistent filtering at query level
- Can be disabled for admin use
- No changes to sync process

**Cons:**
- Still syncs unwanted products
- Wastes storage space
- Performance impact from larger cache

### Option 3: Clean Up Existing Cache

Create script to deactivate non-"interno" products from wc_products_cache.

---

## Files Requiring Changes

### Priority 1 (Critical):
1. backend/src/services/sync.ts - Add "interno" filter to sync
2. src/lib/supabase.ts - Add "interno" filter to cache queries

### Priority 2 (High):
3. Create cleanup script for existing non-"interno" products
4. Update CONFIGURACAO_PRODUTOS_WOOCOMMERCE.md documentation

### Priority 3 (Medium):
5. Add logging to track filter application
6. Add admin option to disable filter for debugging

---

## Summary

The "interno" category filtering is INCONSISTENT:

✅ Backend Proxy (/api/wc/products) - Filters correctly
❌ Sync Service - Does NOT filter (caches ALL products)
❌ Cache Queries - Does NOT filter (retrieves ALL products)

This causes products like "SACOLA DE PAPEL PERSONALIZADA" to appear when:
- They were synced during full sync
- They don't have "interno" category
- User searches or browses products from cache

**RECOMMENDED FIX:** Apply "interno" filter at sync level (Option 1) to prevent non-compliant products from entering the cache in the first place.

