# Embraflex - Sistema de Pedidos Digital

Sistema web completo desenvolvido para gerenciamento de pedidos, produtos e clientes da Embraflex. Construído com tecnologias modernas para proporcionar uma experiência rápida, intuitiva e totalmente integrada com WooCommerce.

## Preview

![Dashboard Embraflex](.github/screenshots/dashboard.png)

*Dashboard principal do sistema com visão geral de pedidos, produtos, clientes e faturamento.*

## Tecnologias Utilizadas

### Core
- **React 18.3.1** - Biblioteca para construção de interfaces
- **TypeScript 5.8.3** - Superset JavaScript com tipagem estática
- **Vite 5.4.19** - Build tool e dev server de alta performance
- **React Router DOM 6.30.1** - Roteamento client-side

### UI e Estilização
- **Tailwind CSS 3.4.17** - Framework CSS utilitário
- **Radix UI** - Componentes acessíveis e sem estilo
- **Lucide React** - Biblioteca de ícones
- **Shadcn/ui** - Sistema de componentes reutilizáveis
- **Class Variance Authority** - Gerenciamento de variantes de componentes

### Gerenciamento de Estado e Dados
- **TanStack React Query 5.83.0** - Gerenciamento de estado assíncrono
- **React Hook Form 7.61.1** - Formulários performáticos
- **Zod 3.25.76** - Validação de schemas TypeScript-first

### Integração e API
- **Axios 1.13.2** - Cliente HTTP para requisições
- **WooCommerce REST API v3** - Integração completa com produtos e clientes

### Notificações e Feedback
- **Sonner** - Sistema de toast notifications elegante
- **Radix UI Toast** - Componente de toast acessível

## Estrutura do Projeto

```
src/
├── componentes/
│   ├── layouts/
│   │   └── DashboardLayout.tsx    # Layout principal com sidebar
│   ├── ui/                         # Componentes de interface reutilizáveis
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── sidebar.tsx
│   │   ├── textarea.tsx
│   │   └── ...
│   ├── AppSidebar.tsx             # Navegação lateral com logo
│   ├── NavLink.tsx                # Componente de link de navegação
│   └── CustomerFormDialog.tsx     # Formulário de cadastro de clientes
├── pages/
│   ├── Dashboard.tsx              # Visão geral e métricas
│   ├── Login.tsx                  # Autenticação com logo
│   ├── Orders.tsx                 # Listagem de pedidos
│   ├── NewOrder.tsx               # Criação detalhada de pedidos
│   ├── Products.tsx               # Gerenciamento de produtos (WooCommerce)
│   ├── Customers.tsx              # Gerenciamento de clientes (WooCommerce)
│   ├── Reports.tsx                # Relatórios e análises
│   └── Settings.tsx               # Configurações do sistema
├── hooks/                          # Custom hooks
│   ├── use-mobile.tsx
│   └── use-toast.ts
├── lib/
│   ├── utils.ts                   # Funções utilitárias
│   ├── woocommerce.ts             # Serviço de integração WooCommerce (Produtos)
│   └── customers.ts               # Serviço de integração WooCommerce (Clientes)
├── app.tsx                        # Configuração de rotas
└── main.tsx                       # Entry point da aplicação
```

## Funcionalidades

### Dashboard
- Visão geral com métricas principais (pedidos, produtos, clientes, faturamento)
- Lista de pedidos recentes com status visual
- Indicadores de tendência comparados ao mês anterior
- Acesso rápido para criar novos pedidos
- Cards informativos com gradientes

### Gerenciamento de Pedidos (NewOrder)
- **Busca de Clientes**: Busca integrada com WooCommerce para selecionar clientes existentes
- **Criação de Clientes**: Formulário integrado para criar novos clientes durante o pedido
- **Múltiplos Produtos**: Adicione vários produtos em um único pedido
- **Busca de Produtos WooCommerce**: Autocomplete com busca em tempo real
- **Campos Específicos por Produto**:
  - Quantidade e Código
  - Material e Discriminação
  - Dimensões (Largura, Altura, Lateral, Cores)
  - Acabamentos (Brilho, Fosco, I.E., Auto-Matizada)
  - Furos (Sim/Não)
  - Refile
  - **Acabamentos Especiais Completos**:
    - Cordões (Branco, Preto, Bege, Outros)
    - Gorgurinho 35cm, Gorgurão 35cm, S. Francisco 35cm
    - Ilhós
    - Hot Stamp (Sacola e Etiqueta)
    - Outros acabamentos personalizados
  - Observações por produto
- **Cálculo Automático**: Subtotal por produto e total geral
- **Valores Unitários**: Preenchimento manual ou automático do WooCommerce
- **Validação de Formulário**: Campos obrigatórios e validações

### Gerenciamento de Produtos
- **Integração Total WooCommerce**:
  - Listagem completa de produtos com imagens
  - Busca em tempo real por nome
  - **Sistema de Filtros Avançado**:
    - Busca por categoria
    - Filtro por status de estoque (Em estoque, Fora de estoque, Sob encomenda)
    - Ordenação por Data, Nome ou Preço
    - Ordem Crescente/Decrescente
    - Botão para limpar todos os filtros
  - Paginação de resultados (12 produtos por página)
  - **Modal de Detalhes Completo**:
    - Galeria de imagens (principal + miniaturas)
    - Preços (Regular e Promocional)
    - Status de estoque com badges coloridos
    - Quantidade em estoque e SKU
    - Descrição completa e resumo
    - Informações adicionais (ID, Tipo, Promoção)
    - Link direto para o produto na loja
  - Badges de categorias
  - Atualização em tempo real
  - Loading states e tratamento de erros

### Gerenciamento de Clientes
- **Integração Total WooCommerce**:
  - Listagem de clientes do WooCommerce
  - Busca por nome, empresa ou email
  - Paginação (20 clientes por página)
  - **Criação de Clientes**:
    - Dialog com formulário completo
    - Campos: Nome Fantasia, Razão Social, Email, Telefone, CPF/CNPJ
    - Validação de campos obrigatórios
    - Armazenamento de meta_data customizado
    - Toast de sucesso/erro
  - **Modal de Detalhes do Cliente**:
    - Avatar com iniciais
    - Dados da empresa (Nome Fantasia, Razão Social, CPF/CNPJ, Telefone)
    - Endereço de cobrança completo
    - Endereço de entrega (quando disponível)
    - Informações adicionais (Nome, Username, ID)
  - Cards com informações resumidas
  - Integração bidirecional (leitura e escrita no WooCommerce)

### Relatórios
- Análises e métricas do negócio
- Visualização de dados consolidados

### Sistema de Autenticação
- Tela de login com logo da empresa
- Proteção de rotas
- Redirecionamento automático
- Design responsivo e moderno

## Configuração e Instalação

### Pré-requisitos
- Node.js 16+ ou superior
- Yarn ou npm

### Instalação

```bash
# Clone o repositório
git clone <url-do-repositorio>

# Entre no diretório
cd step2

# Instale as dependências
yarn install
# ou
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas credenciais do WooCommerce
```

### Desenvolvimento

```bash
# Inicie o servidor de desenvolvimento
yarn dev
# ou
npm run dev
```

O servidor estará disponível em `http://localhost:5173`

### Build para Produção

```bash
# Build otimizado
yarn build
# ou
npm run build

# Preview do build de produção
yarn preview
# ou
npm run preview
```

### Build de Desenvolvimento

```bash
# Build sem otimizações de produção
yarn build:dev
# ou
npm run build:dev
```

## Linting

```bash
# Execute o ESLint
yarn lint
# ou
npm run lint
```

## Configuração do WooCommerce

O sistema integra-se com a API REST do WooCommerce para gerenciar produtos. Para configurar:

### 1. Gerar credenciais no WooCommerce

1. Acesse o painel do WordPress/WooCommerce
2. Navegue para **WooCommerce > Configurações > Avançado > REST API**
3. Clique em **Adicionar chave**
4. Configure:
   - **Descrição**: Sistema de Pedidos Embraflex
   - **Usuário**: Administrador
   - **Permissões**: Leitura/Gravação
5. Copie as credenciais geradas (Consumer Key e Consumer Secret)

### 2. Configurar variáveis de ambiente

Edite o arquivo `.env` na raiz do projeto:

```env
VITE_WOOCOMMERCE_URL=https://seu-site.com.br
VITE_WOOCOMMERCE_CONSUMER_KEY=ck_sua_chave_aqui
VITE_WOOCOMMERCE_CONSUMER_SECRET=cs_seu_secret_aqui
```

### 3. Reiniciar o servidor

Após configurar, reinicie o servidor de desenvolvimento para aplicar as mudanças.

Para mais detalhes sobre a integração, consulte o arquivo `WOOCOMMERCE_CONFIG.md`.

## Configuração de Paths

O projeto utiliza path aliases configurados no TypeScript e Vite:

- `@/` - Aponta para `./src/`

Exemplo de uso:
```typescript
import { Button } from "@/componentes/ui/button"
import { cn } from "@/lib/utils"
import { getProducts } from "@/lib/woocommerce"
```

## Design System

O projeto implementa um design system consistente com:

- Cores temáticas HSL configuráveis
- Gradientes personalizados
- Sistema de sombras padronizado
- Modo claro e escuro
- Componentes responsivos
- Animações suaves

### Principais Cores
- **Primary**: Azul (#3B82F6)
- **Secondary**: Verde (#10B981)
- **Success**: Verde (#10B981)
- **Warning**: Laranja (#F59E0B)
- **Destructive**: Vermelho (#EF4444)

## Funcionalidades da Integração WooCommerce

### Produtos (`lib/woocommerce.ts`)
- Listagem completa com paginação
- Busca por nome
- Filtros por categoria e status de estoque
- Ordenação por data, nome ou preço
- Exibição de imagens, preços e estoque
- Categorias e atributos
- Descrições completas
- SKU e tipo de produto

### Clientes (`lib/customers.ts`)
- **CRUD Completo**:
  - `getCustomers(params)` - Lista clientes com filtros e busca
  - `getCustomerById(id)` - Busca cliente específico
  - `createCustomer(data)` - Cria novo cliente
  - `updateCustomer(id, data)` - Atualiza dados do cliente
  - `deleteCustomer(id)` - Remove cliente
- **Meta Data Customizado**:
  - `nome_fantasia` - Nome fantasia da empresa
  - `razao_social` - Razão social
  - `cpf_cnpj` - CPF ou CNPJ
- Endereços de cobrança e entrega
- Integração total com WooCommerce

### Endpoints Disponíveis

#### Produtos
```typescript
getProducts({
  page?: number,
  per_page?: number,
  search?: string,
  category?: string,
  stock_status?: 'instock' | 'outofstock' | 'onbackorder',
  orderby?: 'date' | 'title' | 'price',
  order?: 'asc' | 'desc'
})
```

#### Clientes
```typescript
getCustomers({
  page?: number,
  per_page?: number,
  search?: string,
  orderby?: 'id' | 'registered_date' | 'name' | 'email',
  order?: 'asc' | 'desc'
})

createCustomer({
  email: string,
  first_name: string,
  last_name: string,
  billing: { ... },
  meta_data: [
    { key: 'nome_fantasia', value: string },
    { key: 'razao_social', value: string },
    { key: 'cpf_cnpj', value: string }
  ]
})
```

### Categorias
- `getCategories()` - Lista todas as categorias de produtos

## Próximos Passos

- [ ] Integração de pedidos com WooCommerce (criar pedidos via API)
- [ ] Implementação de autenticação real com WooCommerce/WordPress
- [ ] Sistema de permissões de usuário
- [ ] Sincronização automática de estoque
- [ ] Exportação de relatórios em PDF
- [ ] Notificações em tempo real
- [ ] Dashboard com gráficos interativos (Chart.js/Recharts)
- [ ] Upload de arquivos e imagens nos pedidos
- [ ] Sistema de aprovação de pedidos
- [ ] Histórico de alterações
- [ ] Integração com sistema de pagamento
- [ ] Notificações por email
- [ ] Modo offline com sincronização

## Componentes Desenvolvidos

### UI Components (Shadcn/UI)
- ✅ Button - Botão com variantes e tamanhos
- ✅ Card - Container de conteúdo
- ✅ Input - Campo de entrada de texto
- ✅ Textarea - Campo de texto multilinha
- ✅ Label - Rótulo de formulário
- ✅ Select - Dropdown seletor
- ✅ Dialog - Modal/Dialog
- ✅ Badge - Badges e tags
- ✅ Avatar - Avatar de usuário
- ✅ Sidebar - Navegação lateral recolhível
- ✅ Toast - Notificações temporárias
- ✅ Switch - Toggle switch

### Custom Components
- ✅ AppSidebar - Navegação principal com logo
- ✅ NavLink - Link de navegação com estado ativo
- ✅ CustomerFormDialog - Formulário de cadastro de clientes
- ✅ DashboardLayout - Layout principal do sistema

## Recursos Implementados

- ✅ Roteamento completo com React Router
- ✅ Integração WooCommerce (Produtos e Clientes)
- ✅ Sistema de busca e filtros avançados
- ✅ Paginação de dados
- ✅ Modal de detalhes (Produtos e Clientes)
- ✅ Formulários com validação
- ✅ Toast notifications
- ✅ Loading states
- ✅ Error handling
- ✅ Responsive design
- ✅ Dark mode ready
- ✅ TypeScript strict mode
- ✅ ESLint configured
- ✅ Path aliases
- ✅ Logo da empresa integrada

## Personalização da Logo

O sistema suporta logo personalizada da empresa. Para adicionar:

1. Coloque a logo em `public/logo-embraflex.png`
2. Formatos suportados: PNG (recomendado), SVG, JPG
3. A logo aparecerá automaticamente em:
   - Sidebar (quando expandido)
   - Tela de login
4. Se a logo não existir, será exibido um ícone de fallback

## Licença

Propriedade da Embraflex. Todos os direitos reservados.

