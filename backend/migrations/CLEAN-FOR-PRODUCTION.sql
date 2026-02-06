-- ============================================================================
-- SCRIPT DE LIMPEZA DE DADOS PARA PRODUÇÃO
-- Sistema Embraflex - Supabase
-- ============================================================================
-- 
-- ⚠️  ATENÇÃO: Este script DELETA dados permanentemente!
-- 
-- ANTES DE EXECUTAR:
-- 1. Fazer BACKUP completo do banco (Supabase Dashboard > Database > Create backup)
-- 2. Confirmar que está no ambiente CORRETO (produção)
-- 3. Ler e entender cada seção antes de executar
-- 4. Executar seção por seção (não tudo de uma vez)
-- 5. Verificar resultados após cada bloco
--
-- COMO EXECUTAR:
-- - Supabase Dashboard > SQL Editor > New Query
-- - Copiar e executar CADA SEÇÃO individualmente
-- - Verificar quantidade de linhas deletadas
--
-- Data: 06/02/2026
-- ============================================================================

-- ============================================================================
-- SEÇÃO 1: LIMPEZA DE ORÇAMENTOS DE TESTE
-- ============================================================================

-- 1.1 Primeiro, listar orçamentos para verificar quais serão deletados
-- (NÃO DELETA NADA, apenas mostra)
SELECT 
  id,
  quote_number,
  customer_name,
  customer_email,
  status,
  created_at,
  created_by_name
FROM quotes
WHERE created_at < '2026-02-06'  -- Ajustar data conforme necessário
ORDER BY created_at DESC;

-- 1.2 Verificar quantos orçamentos serão deletados
SELECT 
  status,
  COUNT(*) as total
FROM quotes
WHERE created_at < '2026-02-06'  -- Ajustar data conforme necessário
GROUP BY status;

-- 1.3 Deletar visualizações vinculadas aos orçamentos (dependência)
-- ⚠️ ATENÇÃO: Isso DELETA dados!
DELETE FROM quote_views
WHERE quote_id IN (
  SELECT id FROM quotes 
  WHERE created_at < '2026-02-06'  -- Ajustar data conforme necessário
);

-- Verificar quantas linhas foram deletadas
-- Resultado esperado: "DELETE X" (onde X é o número de views deletadas)

-- 1.4 Deletar orçamentos de teste
-- ⚠️ ATENÇÃO: Isso DELETA dados!
DELETE FROM quotes
WHERE created_at < '2026-02-06';  -- Ajustar data conforme necessário

-- Verificar quantas linhas foram deletadas
-- Resultado esperado: "DELETE X" (onde X é o número de orçamentos deletados)

-- 1.5 Verificar que restaram apenas orçamentos válidos
SELECT 
  quote_number,
  customer_name,
  status,
  created_at
FROM quotes
ORDER BY created_at DESC;


-- ============================================================================
-- SEÇÃO 2: LIMPEZA DE USUÁRIOS DE TESTE
-- ============================================================================

-- 2.1 Primeiro, listar todos os usuários para identificar quais manter
-- (NÃO DELETA NADA, apenas mostra)
SELECT 
  id,
  username,
  email,
  full_name,
  role,
  is_active,
  created_at,
  last_login
FROM users
ORDER BY created_at;

-- ⚠️ DECISÃO IMPORTANTE: Definir quais usuários são REAIS
-- Exemplo: Manter apenas 'admin', 'yan', 'luiz'
-- Ajustar lista abaixo conforme necessário

-- 2.2 Listar usuários que SERÃO DELETADOS (verificação)
SELECT 
  id,
  username,
  email,
  full_name,
  role
FROM users
WHERE username NOT IN ('admin', 'yan', 'luiz')  -- Ajustar lista de usuários reais
ORDER BY username;

-- 2.3 Deletar logs de auditoria de usuários teste
-- ⚠️ ATENÇÃO: Isso DELETA dados!
DELETE FROM user_audit_logs
WHERE user_id IN (
  SELECT id FROM users 
  WHERE username NOT IN ('admin', 'yan', 'luiz')  -- Ajustar lista
);

-- 2.4 Deletar sessões de usuários teste
-- ⚠️ ATENÇÃO: Isso DELETA dados!
DELETE FROM user_sessions
WHERE user_id IN (
  SELECT id FROM users 
  WHERE username NOT IN ('admin', 'yan', 'luiz')  -- Ajustar lista
);

-- 2.5 Deletar usuários de teste
-- ⚠️ ATENÇÃO: Isso DELETA dados!
DELETE FROM users
WHERE username NOT IN ('admin', 'yan', 'luiz');  -- Ajustar lista

-- 2.6 Verificar que restaram apenas usuários reais
SELECT 
  username,
  email,
  role,
  is_active
FROM users
ORDER BY role, username;


-- ============================================================================
-- SEÇÃO 3: LIMPEZA DE LOGS E SESSÕES ANTIGAS
-- ============================================================================

-- 3.1 Verificar quantidade de logs antigos (> 30 dias)
SELECT 
  DATE(created_at) as data,
  COUNT(*) as total_logs
FROM user_audit_logs
WHERE created_at < NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY data DESC;

-- 3.2 Deletar logs de auditoria antigos (> 30 dias)
-- ⚠️ ATENÇÃO: Isso DELETA dados!
DELETE FROM user_audit_logs
WHERE created_at < NOW() - INTERVAL '30 days';

-- 3.3 Verificar quantidade de sessões expiradas
SELECT COUNT(*) as sessoes_expiradas
FROM user_sessions
WHERE expires_at < NOW();

-- 3.4 Deletar sessões expiradas
-- ⚠️ ATENÇÃO: Isso DELETA dados!
DELETE FROM user_sessions
WHERE expires_at < NOW();

-- 3.5 (Opcional) Deletar TODAS as sessões (forçar re-login de todos)
-- Descomente se quiser forçar todos usuários a fazer login novamente
-- DELETE FROM user_sessions;


-- ============================================================================
-- SEÇÃO 4: LIMPEZA DE CACHE WOOCOMMERCE
-- ============================================================================

-- 4.1 Verificar quantidade de produtos em cache
SELECT COUNT(*) as total_produtos FROM wc_products_cache;

-- 4.2 Verificar quantidade de clientes em cache
SELECT COUNT(*) as total_clientes FROM wc_customers_cache;

-- 4.3 Deletar TODOS os produtos em cache
-- ⚠️ ATENÇÃO: Cache será recriado automaticamente na próxima requisição
DELETE FROM wc_products_cache;

-- 4.4 Deletar TODOS os clientes em cache
-- ⚠️ ATENÇÃO: Cache será recriado automaticamente na próxima requisição
DELETE FROM wc_customers_cache;

-- 4.5 Resetar metadados de sincronização
-- ⚠️ ATENÇÃO: Forçará re-sincronização completa
DELETE FROM sync_metadata;

-- 4.6 Verificar que caches foram limpos
SELECT 
  (SELECT COUNT(*) FROM wc_products_cache) as produtos_cache,
  (SELECT COUNT(*) FROM wc_customers_cache) as clientes_cache,
  (SELECT COUNT(*) FROM sync_metadata) as sync_metadata;


-- ============================================================================
-- SEÇÃO 5: RESETAR SEQUÊNCIA DE ORÇAMENTOS (OPCIONAL)
-- ============================================================================

-- 5.1 Verificar último número de orçamento
SELECT quote_number, created_at 
FROM quotes 
ORDER BY created_at DESC 
LIMIT 5;

-- 5.2 (OPCIONAL) Resetar sequência para começar do zero
-- ⚠️ ATENÇÃO: Só fazer se deletou TODOS os orçamentos
-- Descomente para executar:
-- SELECT setval('quotes_id_seq', 1, false);

-- Próximo orçamento será QT-2026-0001

-- 5.3 Verificar próximo ID da sequência
SELECT nextval('quotes_id_seq');
SELECT setval('quotes_id_seq', currval('quotes_id_seq') - 1);  -- Reverter o incremento


-- ============================================================================
-- SEÇÃO 6: OTIMIZAÇÃO E MANUTENÇÃO
-- ============================================================================

-- 6.1 Vacuum e Analyze para recuperar espaço e atualizar estatísticas
-- (Isso é seguro e recomendado após deletes massivos)
VACUUM ANALYZE quotes;
VACUUM ANALYZE quote_views;
VACUUM ANALYZE users;
VACUUM ANALYZE user_audit_logs;
VACUUM ANALYZE user_sessions;
VACUUM ANALYZE wc_products_cache;
VACUUM ANALYZE wc_customers_cache;

-- 6.2 Verificar tamanho das tabelas após limpeza
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;


-- ============================================================================
-- SEÇÃO 7: VERIFICAÇÃO FINAL
-- ============================================================================

-- 7.1 Contagem final de registros em cada tabela
SELECT 
  'quotes' as tabela, COUNT(*) as registros FROM quotes
UNION ALL
SELECT 'quote_views', COUNT(*) FROM quote_views
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'user_audit_logs', COUNT(*) FROM user_audit_logs
UNION ALL
SELECT 'user_sessions', COUNT(*) FROM user_sessions
UNION ALL
SELECT 'wc_products_cache', COUNT(*) FROM wc_products_cache
UNION ALL
SELECT 'wc_customers_cache', COUNT(*) FROM wc_customers_cache
ORDER BY tabela;

-- 7.2 Verificar integridade referencial
-- (Não deve retornar nenhuma linha - significa que não há órfãos)
SELECT 'Orçamentos órfãos sem usuário' as problema, COUNT(*) as total
FROM quotes 
WHERE created_by_id IS NOT NULL 
  AND created_by_id NOT IN (SELECT id FROM users);

-- 7.3 Últimos orçamentos restantes
SELECT 
  quote_number,
  customer_name,
  status,
  total_price,
  created_at,
  created_by_name
FROM quotes
ORDER BY created_at DESC
LIMIT 10;

-- 7.4 Usuários ativos restantes
SELECT 
  username,
  full_name,
  role,
  is_active,
  last_login
FROM users
WHERE is_active = true
ORDER BY role, username;


-- ============================================================================
-- ROLLBACK (SE ALGO DEU ERRADO)
-- ============================================================================

-- ⚠️ ATENÇÃO: Se você executou tudo em uma TRANSAÇÃO (BEGIN...COMMIT),
-- pode fazer ROLLBACK. Mas se executou statement por statement, NÃO TEM ROLLBACK!
-- Por isso é CRÍTICO fazer BACKUP antes!

-- Se estiver usando transação:
-- BEGIN;
--   ... (executar todos os DELETEs)
-- COMMIT;  -- Confirmar mudanças
-- ou
-- ROLLBACK;  -- Desfazer tudo

-- Para restaurar do backup:
-- Supabase Dashboard > Database > Backups > Restore


-- ============================================================================
-- CHECKLIST PÓS-LIMPEZA
-- ============================================================================

-- [ ] Backup foi feito ANTES de começar
-- [ ] Todos os dados de teste foram removidos
-- [ ] Usuários reais foram preservados (admin, vendedores)
-- [ ] Orçamentos válidos foram preservados (se houver)
-- [ ] Cache foi limpo (será recriado automaticamente)
-- [ ] Vacuum/Analyze executado
-- [ ] Contagens finais conferem com esperado
-- [ ] Sistema testado pós-limpeza (login, criar orçamento, etc)
-- [ ] Novo backup foi feito APÓS limpeza

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
