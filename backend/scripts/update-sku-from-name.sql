-- Script SQL para atualizar SKUs dos produtos no cache
-- Extrai o código do nome quando o SKU está vazio
-- Execute no Supabase SQL Editor

-- Primeiro, vamos ver quais produtos estão com SKU vazio
SELECT 
    id,
    name,
    sku,
    'http://localhost:5173/wp-admin/post.php?post=' || id || '&action=edit' as edit_link
FROM wc_products_cache
WHERE (sku IS NULL OR sku = '') 
  AND is_active = true
ORDER BY name;

-- Agora vamos atualizar os SKUs baseados no nome
-- Padrão: k-XXX, K-XXX, k_XXX, c-XXX, s-XXX, etc.

-- Atualiza produtos com padrão k-XXX no nome
UPDATE wc_products_cache
SET sku = LOWER(REGEXP_REPLACE(
    SUBSTRING(name FROM '(?i)\b(k[_-]?\d{2,4})\b'),
    '_', '-', 'g'
))
WHERE (sku IS NULL OR sku = '') 
  AND name ~* '\bk[_-]?\d{2,4}\b'
  AND is_active = true;

-- Atualiza produtos com padrão c-XXX no nome
UPDATE wc_products_cache
SET sku = LOWER(REGEXP_REPLACE(
    SUBSTRING(name FROM '(?i)\b(c[_-]?\d{2,4})\b'),
    '_', '-', 'g'
))
WHERE (sku IS NULL OR sku = '') 
  AND name ~* '\bc[_-]?\d{2,4}\b'
  AND is_active = true;

-- Atualiza produtos com padrão s-XXX no nome
UPDATE wc_products_cache
SET sku = LOWER(REGEXP_REPLACE(
    SUBSTRING(name FROM '(?i)\b(s[_-]?\d{2,4})\b'),
    '_', '-', 'g'
))
WHERE (sku IS NULL OR sku = '') 
  AND name ~* '\bs[_-]?\d{2,4}\b'
  AND is_active = true;

-- Verifica o resultado após atualização
SELECT 
    id,
    name,
    sku as novo_sku,
    CASE 
        WHEN sku IS NOT NULL AND sku != '' THEN '✅ Atualizado'
        ELSE '⚠️ Ainda vazio'
    END as status
FROM wc_products_cache
WHERE is_active = true
  AND (name ~* '\bk[_-]?\d{2,4}\b' 
       OR name ~* '\bc[_-]?\d{2,4}\b' 
       OR name ~* '\bs[_-]?\d{2,4}\b')
ORDER BY name;

-- Contagem final
SELECT 
    COUNT(*) as total_produtos,
    COUNT(CASE WHEN sku IS NOT NULL AND sku != '' THEN 1 END) as com_sku,
    COUNT(CASE WHEN sku IS NULL OR sku = '' THEN 1 END) as sem_sku
FROM wc_products_cache
WHERE is_active = true;
