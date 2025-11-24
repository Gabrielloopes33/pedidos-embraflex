# Segurança - Variáveis de Ambiente

## ⚠️ IMPORTANTE

O arquivo `.env` contém credenciais sensíveis e **NÃO DEVE** ser commitado ao repositório.

## Configuração

1. Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```

2. Preencha as variáveis com suas credenciais reais

3. **NUNCA** commite o arquivo `.env` ao Git

## Variáveis Necessárias

- `WOOCOMMERCE_URL`: URL do seu site WooCommerce
- `WOOCOMMERCE_KEY`: Consumer Key da API do WooCommerce
- `WOOCOMMERCE_SECRET`: Consumer Secret da API do WooCommerce
- `DB_HOST`: Host do banco de dados PostgreSQL/Supabase
- `DB_USER`: Usuário do banco de dados
- `DB_PASSWORD`: Senha do banco de dados
- `DB_NAME`: Nome do banco de dados
- `DB_PORT`: Porta do banco de dados (padrão: 5432)
- `JWT_SECRET`: Secret para geração de tokens JWT
- `SUPABASE_URL`: URL da sua instância Supabase
- `SUPABASE_ANON_KEY`: Chave anônima do Supabase
- `SUPABASE_SERVICE_KEY`: Chave de serviço do Supabase (admin)

## Se o .env foi commitado acidentalmente

Se você commitou o arquivo `.env` por engano:

1. Remova do Git:
   ```bash
   git rm --cached .env
   git commit -m "Remove sensitive .env file"
   ```

2. **IMPORTANTE**: Gere novas credenciais em todos os serviços:
   - WooCommerce: Gere novas API Keys
   - Supabase: Regenere as chaves de API
   - Banco de dados: Altere a senha
   - JWT: Gere um novo secret

3. Atualize o `.env` com as novas credenciais

4. Faça push das mudanças:
   ```bash
   git push origin main
   ```
