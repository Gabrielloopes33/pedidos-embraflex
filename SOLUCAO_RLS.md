# SOLUÇÃO PARA O ERRO 500 - POSTGREST EM MODO READ-ONLY

## 🔍 Problema Identificado

O erro 500 ao criar pedidos é causado porque **o PostgREST está configurado em modo READ-ONLY** ou **o Kong está bloqueando requisições POST**.

### Diagnóstico completo:
- ✅ RLS está desabilitado
- ✅ SELECT funciona perfeitamente em todas as tabelas
- ✅ INSERT direto via SQL funciona
- ❌ **POST via API REST retorna 404 em TODAS as tabelas**
- ❌ O erro vem do Kong (API Gateway)

Isso **não é um problema de permissões SQL**. É uma configuração do PostgREST/Kong que está bloqueando operações de escrita (POST, PUT, DELETE) via API REST.

## ✅ Solução

### Opção 1: Verificar Configuração no Supabase Studio (RECOMENDADO)

1. **Acesse**: https://supa.agenciatouch.com.br/project/default/api
2. **Procure por**:
   - "Read-only mode" → deve estar **desabilitado**
   - "Enable writes" / "Allow POST/PUT/DELETE" → deve estar **habilitado**
3. **Recarregue o schema** se houver opção de "Reload schema cache"

### Opção 2: Executar SQL + Reload do PostgREST

Execute no **SQL Editor** e depois **recarregue o PostgREST**:

```sql
-- Garantir permissões completas
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;

ALTER TABLE orders OWNER TO postgres;
ALTER TABLE users OWNER TO postgres;

GRANT ALL ON TABLE orders TO anon, authenticated, service_role;
GRANT ALL ON TABLE users TO anon, authenticated, service_role;

-- Teste
INSERT INTO orders (id, "customerName", products, status, priority, "createdAt", history, comments, "userId") 
VALUES ('test-' || gen_random_uuid()::text, 'Teste', '[]', 'Pendente', 'Normal', NOW()::text, '[]', '[]', NULL) 
RETURNING *;
```

**Importante**: Após executar, vá em **Settings > API > Reload schema cache** ou reinicie o PostgREST.

### Opção 3: Contatar Administrador do Supabase

Se não conseguir resolver, entre em contato com quem gerencia `supa.agenciatouch.com.br` informando:
- GET funciona, POST retorna 404 em todas as tabelas
- INSERT via SQL funciona normalmente
- Problema parece ser Kong/PostgREST em read-only

## 🔍 Info Técnica (para administrador)

```
Diagnóstico:
GET  /rest/v1/orders → 200 ✅
POST /rest/v1/orders → 404 ❌ (via Kong)
INSERT SQL direto   → OK ✅

Possível causa: PostgREST read-only ou Kong bloqueando POSTs
Solução: Verificar PGRST_DB_TX_END, Kong plugins, recarregar schema
```
