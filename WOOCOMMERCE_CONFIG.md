# Configuração da API WooCommerce

## Como obter as credenciais

1. Acesse o painel administrativo do WordPress/WooCommerce
2. Navegue até: **WooCommerce > Configurações > Avançado > REST API**
3. Clique em **Adicionar chave**
4. Preencha as informações:
   - **Descrição**: Sistema de Pedidos Embraflex
   - **Usuário**: Selecione seu usuário administrador
   - **Permissões**: Selecione **Leitura/Gravação**
5. Clique em **Gerar chave API**
6. Copie as credenciais geradas:
   - **Consumer Key** (começa com `ck_`)
   - **Consumer Secret** (começa com `cs_`)

## Configuração no projeto

1. Abra o arquivo `.env` na raiz do projeto
2. Configure as variáveis:

```env
VITE_WOOCOMMERCE_URL=https://embraflexbr.com.br
VITE_WOOCOMMERCE_CONSUMER_KEY=ck_58c97d066289e666ad8a5f91741042f90633d340
VITE_WOOCOMMERCE_CONSUMER_SECRET=cs_d342dee925de0370f45a892d1bb903f589238a86
```

3. Substitua os valores:
   - `VITE_WOOCOMMERCE_URL`: URL completa do seu site (sem barra no final)
   - `VITE_WOOCOMMERCE_CONSUMER_KEY`: A chave consumer key gerada
   - `VITE_WOOCOMMERCE_CONSUMER_SECRET`: O consumer secret gerado

4. Reinicie o servidor de desenvolvimento:
```bash
yarn dev
```

## Testando a integração

Após configurar, acesse a página de Produtos no sistema. Você deverá ver:
- Lista de produtos do WooCommerce
- Imagens dos produtos (se cadastradas)
- Preços formatados
- Status de estoque
- Categorias
- Busca por nome
- Paginação

## Solução de problemas

### Erro de CORS
Se encontrar erro de CORS, você pode precisar:
1. Instalar e configurar o plugin "WP REST API - Allow All Cross-Origin" no WordPress
2. Ou configurar o CORS no arquivo `.htaccess` do WordPress

### Erro 401 (Não autorizado)
- Verifique se as credenciais estão corretas no arquivo `.env`
- Certifique-se que as permissões da chave API são "Leitura/Gravação"
- Confirme que a chave API está ativa

### Erro 404 (Não encontrado)
- Verifique se a URL do WooCommerce está correta
- Confirme se a API REST do WooCommerce está habilitada
- Teste acessando: `https://seu-site.com.br/wp-json/wc/v3/products`

## Recursos disponíveis

O arquivo `src/lib/woocommerce.ts` contém:
- `getProducts()` - Lista produtos com filtros e paginação
- `getProductById()` - Busca produto específico por ID
- `getCategories()` - Lista categorias de produtos

## Parâmetros de busca disponíveis

```typescript
{
  page: number,              // Página atual
  per_page: number,          // Produtos por página (padrão: 10, máx: 100)
  search: string,            // Busca por nome
  category: string,          // Filtrar por categoria
  orderby: 'date' | 'title' | 'price',  // Ordenar por
  order: 'asc' | 'desc',     // Ordem crescente ou decrescente
  status: 'publish',         // Status do produto
  stock_status: 'instock' | 'outofstock' | 'onbackorder'
}
```

## Segurança

- O arquivo `.env` está no `.gitignore` e não será versionado
- Nunca compartilhe suas credenciais de API
- Use HTTPS em produção
- Considere usar variáveis de ambiente diferentes para desenvolvimento e produção
