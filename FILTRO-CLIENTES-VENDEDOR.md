# Filtro de Clientes por Vendedor

## 📋 Visão Geral

O sistema agora implementa um filtro automático de clientes baseado no role do usuário:

- **Admin**: Visualiza TODOS os clientes cadastrados no WooCommerce
- **Vendedor**: Visualiza APENAS os clientes que ele mesmo cadastrou

## 🔧 Como Funciona

### 1. Cadastro de Clientes

Quando um cliente é criado através do sistema:

1. O frontend envia os dados do cliente para o backend
2. O backend adiciona automaticamente metadados ao cliente no WooCommerce:
   ```javascript
   meta_data: [
     {
       key: 'vendedor_name',
       value: 'yan' // username do vendedor logado
     },
     {
       key: 'vendedor_id',
       value: 'user-yan' // ID do vendedor
     }
   ]
   ```

### 2. Listagem de Clientes

Quando um vendedor acessa a página de clientes:

1. O frontend chama `getCustomers()` que acessa `/api/wc/customers`
2. O backend verifica o role do usuário autenticado:
   - Se for **admin**: Retorna todos os clientes
   - Se for **vendedor**: Filtra apenas clientes onde `meta_data.vendedor_name === username do vendedor`

### 3. Busca e Filtros

Todos os filtros de busca funcionam normalmente, mas sempre respeitando a regra:
- Vendedores só veem seus próprios clientes
- Admins veem todos os clientes

## 🛠️ Arquivos Modificados

### Backend
- **`backend/src/index.ts`**
  - `GET /api/wc/customers` - Agora filtra clientes por vendedor
  - `POST /api/wc/customers` - Adiciona meta_data com informações do vendedor

### Frontend
Nenhuma modificação necessária! O filtro é transparente para o frontend.

## ✅ Benefícios

1. **Segurança**: Vendedores não conseguem acessar clientes de outros vendedores
2. **Organização**: Cada vendedor gerencia apenas sua própria carteira
3. **WooCommerce**: Todos os clientes ficam centralizados no WooCommerce
4. **Rastreabilidade**: É possível identificar qual vendedor cadastrou cada cliente

## 🔍 Como Verificar

### No WooCommerce Admin

1. Acesse um cliente no painel do WooCommerce
2. Role até a seção "Campos Personalizados" (Custom Fields)
3. Você verá os campos:
   - `vendedor_name`: Nome de usuário do vendedor
   - `vendedor_id`: ID único do vendedor

### No Sistema

1. Faça login como vendedor (yan/yan123 ou luiz/luiz123)
2. Acesse a página "Clientes"
3. Você verá apenas os clientes que você cadastrou
4. Cadastre um novo cliente
5. Faça login como admin (admin/admin123)
6. Você verá TODOS os clientes, incluindo o que você acabou de cadastrar como vendedor

## 🚀 Próximos Passos (Opcionais)

- [ ] Adicionar filtro visual mostrando "Vendedor X" na listagem de clientes (para admins)
- [ ] Permitir que admins reatribuam clientes para outros vendedores
- [ ] Dashboard com estatísticas de clientes por vendedor
- [ ] Exportação de relatórios de clientes por vendedor
