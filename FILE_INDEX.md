# WooCommerce Product Fetching - File Index

## Complete File List Related to Product Fetching and Filtering

### Core HTTP/API Files

| File Path | Purpose | Line Numbers |
|-----------|---------|--------------|
| `backend/src/index.ts` | Backend proxy with "interno" filter | 452-501 |
| `backend/src/woocommerce.ts` | WooCommerce API client configuration | 1-14 |
| `src/lib/woocommerce.ts` | Frontend WooCommerce API calls | 1-112 |
| `src/lib/api.ts` | API client configuration | 1-312 |

### Sync Service Files

| File Path | Purpose | Line Numbers |
|-----------|---------|--------------|
| `backend/src/services/sync.ts` | Product sync service (NO "interno" filter) | 1-482 |
| `backend/src/routes/sync.ts` | Sync route endpoints | 1-124 |
| `backend/src/services/cache.ts` | Cache service implementation | 1-464 |

### Cache Retrieval Files

| File Path | Purpose | Line Numbers |
|-----------|---------|--------------|
| `src/lib/supabase.ts` | Supabase cache queries (NO "interno" filter) | 1-514 |
| `backend/src/supabase-client.ts` | Backend Supabase client | - |

### Product Display/UI Files

| File Path | Purpose | Key Features |
|-----------|---------|--------------|
| `src/pages/Products.tsx` | Main products page (1033 lines) | Cache + fallback, grouping, paper bag handling |
| `src/pages/NewQuote/components/ProductNavigator.tsx` | Product selection in quotes (1500+ lines) | Category/line filtering, model selection |
| `src/pages/NewOrder/components/ProductsStep.tsx` | Product selection in orders | Special handling for paper bags |
| `src/pages/NewQuote/components/QuickProductsStep.tsx` | Quick product selection | Paper bag finishing options |

### Type Definition Files

| File Path | Purpose | Key Types |
|-----------|---------|------------|
| `src/lib/types.ts` | TypeScript type definitions | WooCommerceProduct, CachedProduct, etc. |
| `backend/src/types.ts` | Backend type definitions | SyncMetadata, etc. |

### Database Schema Files

| File Path | Purpose | Key Tables |
|-----------|---------|-------------|
| `backend/migrations/002_create_cache_tables.sql` | Cache tables schema | wc_products_cache, wc_customers_cache |
| `backend/src/database.ts` | Database initialization | - |

### Configuration Files

| File Path | Purpose | Key Variables |
|-----------|---------|---------------|
| `.env.example` | Environment variable template | WOOCOMMERCE_URL, SUPABASE_URL |
| `CONFIGURACAO_PRODUTOS_WOOCOMMERCE.md` | Product configuration guide | "Interno" category requirements |
| `.env` | Actual environment variables | - |

### Documentation Files

| File Path | Purpose |
|-----------|---------|
| `FILTRO-CLIENTES-VENDEDOR.md` | Similar filtering logic for customers |
| `DEPLOY.md` | Deployment guide |
| `README.md` | Project overview |

### Utility Scripts

| File Path | Purpose |
|-----------|---------|
| `backend/list-all-categories.ts` | List WooCommerce categories |
| `backend/diagnose-kong.ts` | Diagnose Kong gateway issues |
| `backend/test-wc-customer.ts` | Test WooCommerce customer API |
| `backend/analyze-table.ts` | Analyze Supabase tables |

---

## Critical Code Locations

### Where "interno" Filter IS Applied:

1. **Backend Proxy** - `backend/src/index.ts` lines 452-501
   ```typescript
   // Finds "Interno" or "Interna" category
   // Filters products by category ID
   // Returns empty array if not found
   ```

2. **ProductNavigator** - `src/pages/NewQuote/components/ProductNavigator.tsx` lines 206-207, 265-267
   ```typescript
   // Excludes 'interno' from main categories
   // Excludes 'interno' from lines
   ```

### Where "interno" Filter is NOT Applied:

1. **Sync Service** - `backend/src/services/sync.ts` lines 152-162
   ```typescript
   // Fetches ALL products (no category filter)
   // Caches ALL products regardless of category
   ```

2. **Cache Queries** - `src/lib/supabase.ts` lines 29-72
   ```typescript
   // Returns ALL active products from cache
   // No "interno" category filter
   ```

3. **Products Page** - `src/pages/Products.tsx` lines 389-395
   ```typescript
   // Uses getCachedProducts() without filter
   // Displays all products from cache
   ```

---

## Paper Bag ("Sacola de Papel") Special Handling

Files with special logic for paper bag products:

| File | Line Numbers | Feature |
|------|--------------|---------|
| `src/pages/Products.tsx` | 868-891 | Finishing configuration button |
| `src/pages/Products.tsx` | 201-205 | Finishing modal trigger |
| `src/pages/NewOrder/components/ProductsStep.tsx` | 242-246 | Paper bag finishing options |
| `src/pages/NewQuote/components/ProductNavigator.tsx` | 822 | SKU-based handling |
| `src/pages/NewQuote/components/ProductNavigator.tsx` | 1519 | Variation handling for paper bags |
| `src/pages/NewQuote/components/ProductNavigator.tsx` | 1541 | Layout handling for paper bags |

---

## Search Patterns for Related Code

### Find "interno" filtering:
```bash
grep -r "interno" --include="*.ts" --include="*.tsx" backend/src/ src/
```

### Find category filtering:
```bash
grep -r "categories" --include="*.ts" --include="*.tsx" backend/src/ src/ | grep -i filter
```

### Find paper bag references:
```bash
grep -r "sacola.*papel" --include="*.ts" --include="*.tsx" src/
```

### Find WooCommerce API calls:
```bash
grep -r "wooCommerceApi.get" --include="*.ts" backend/src/
```

---

## Testing Commands

### Check products in cache:
```sql
SELECT id, name, sku, is_active, categories
FROM wc_products_cache
WHERE is_active = true
  AND (name ILIKE '%SACOLA%' OR sku ILIKE '%k-%')
ORDER BY name;
```

### Check sync status:
```sql
SELECT * FROM wc_sync_metadata
ORDER BY started_at DESC
LIMIT 10;
```

---

## File Modification Priority

### High Priority (Fix the bug):
1. `backend/src/services/sync.ts` - Add "interno" filter
2. `src/lib/supabase.ts` - Add "interno" filter to queries

### Medium Priority (Clean up):
3. Create cleanup script for non-"interno" products
4. Update documentation

### Low Priority (Improve):
5. Add logging/tracking
6. Add admin options for debugging

