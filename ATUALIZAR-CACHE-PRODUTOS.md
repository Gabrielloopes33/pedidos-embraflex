# Atualização de Cache de Produtos

Após a alteração na extração de SKU, é necessário atualizar o cache de produtos.

## Opção 1: SQL Direto no Supabase (Recomendado - Mais Rápido)

Execute o SQL no Supabase SQL Editor:

```sql
-- Atualiza SKUs vazios extraindo do nome (padrão k-XXX, c-XXX, s-XXX)
UPDATE wc_products_cache
SET sku = LOWER(REGEXP_REPLACE(
    SUBSTRING(name FROM '(?i)\b(k[_-]?\d{2,4})\b'),
    '_', '-', 'g'
))
WHERE (sku IS NULL OR sku = '') 
  AND name ~* '\bk[_-]?\d{2,4}\b'
  AND is_active = true;
```

Verifique o resultado:
```sql
SELECT COUNT(*) as atualizados 
FROM wc_products_cache 
WHERE sku LIKE 'k-%' AND is_active = true;
```

## Opção 2: API Endpoint (Via Frontend ou Postman)

Faça uma chamada POST para:
```
POST /api/sync/woocommerce
Content-Type: application/json

{
  "syncType": "products",
  "forceFullSync": true
}
```

Isso vai re-sincronizar todos os produtos do WooCommerce com a nova lógica de SKU.

## Opção 3: Script Local

No diretório `backend/`:

```bash
npx ts-node scripts/force-resync-products.ts
```

---

## Verificação

Após a atualização, verifique se os SKUs foram atualizados:

```sql
-- Ver produtos da Linha Comercial/Sacolas
SELECT id, name, sku 
FROM wc_products_cache 
WHERE name ~* '^k-\d+' 
  AND is_active = true
ORDER BY name
LIMIT 20;
```

Resultado esperado:
```
 id   |     name     |  sku   
------+--------------+--------
 8552 | K-034        | k-034
 8562 | k-146        | k-146
 8572 | k-038        | k-038
 8582 | k-126        | k-126
 ...
```
