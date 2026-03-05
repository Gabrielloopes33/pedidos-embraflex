-- ═══════════════════════════════════════════════════════════════════════════════
-- ATUALIZAÇÃO DE SKU NO CACHE - EXTRAIR DO NOME DO PRODUTO
-- Execute no Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- PASSO 1: Ver quantos produtos estão com SKU vazio (ANTES)
SELECT 
    'ANTES DA ATUALIZAÇÃO' as status,
    COUNT(*) as total_produtos,
    COUNT(CASE WHEN sku IS NOT NULL AND sku != '' THEN 1 END) as com_sku,
    COUNT(CASE WHEN sku IS NULL OR sku = '' THEN 1 END) as sem_sku
FROM wc_products_cache
WHERE is_active = true;

-- PASSO 2: Preview - Ver quais produtos serão atualizados
SELECT 
    id,
    name,
    sku as sku_atual,
    LOWER(REGEXP_REPLACE(
        SUBSTRING(name FROM '(?i)\b(k[_-]?\d{2,4})\b'),
        '_', '-', 'g'
    )) as novo_sku
FROM wc_products_cache
WHERE (sku IS NULL OR sku = '') 
  AND name ~* '\bk[_-]?\d{2,4}\b'
  AND is_active = true
ORDER BY name
LIMIT 20;

-- PASSO 3: EXECUTAR A ATUALIZAÇÃO (Descomente para executar)
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE wc_products_cache
SET sku = LOWER(REGEXP_REPLACE(
    SUBSTRING(name FROM '(?i)\b(k[_-]?\d{2,4})\b'),
    '_', '-', 'g'
))
WHERE (sku IS NULL OR sku = '') 
  AND name ~* '\bk[_-]?\d{2,4}\b'
  AND is_active = true;

-- ═══════════════════════════════════════════════════════════════════════════════

-- PASSO 4: Verificar resultado (DEPOIS)
SELECT 
    'DEPOIS DA ATUALIZAÇÃO' as status,
    COUNT(*) as total_produtos,
    COUNT(CASE WHEN sku IS NOT NULL AND sku != '' THEN 1 END) as com_sku,
    COUNT(CASE WHEN sku IS NULL OR sku = '' THEN 1 END) as sem_sku
FROM wc_products_cache
WHERE is_active = true;

-- PASSO 5: Verificar produtos específicos (Sacolas/Linha Comercial)
SELECT 
    id,
    name,
    sku,
    CASE 
        WHEN sku IS NOT NULL AND sku != '' THEN '✅ OK'
        ELSE '⚠️ VAZIO'
    END as status
FROM wc_products_cache
WHERE is_active = true
  AND (name ~* '^k-\d+' OR name ~* '^K-\d+')
ORDER BY name
LIMIT 30;

-- BÔNUS: Listar produtos que ainda estão sem SKU (para análise)
SELECT 
    id,
    name,
    sku,
    categories->0->>'name' as categoria
FROM wc_products_cache
WHERE (sku IS NULL OR sku = '') 
  AND is_active = true
ORDER BY name
LIMIT 20;
