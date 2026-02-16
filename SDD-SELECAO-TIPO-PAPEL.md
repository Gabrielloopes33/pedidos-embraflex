# SDD - Seleção de Tipo de Papel para Sacolas de Papel

**Data de Implementação**: 16/02/2026  
**Status**: ✅ Implementado

---

## Resumo

Implementação completa da etapa de seleção de tipo de papel no fluxo de cotação (`NewQuote`), permitindo que usuários escolham o tipo de papel (ex: Kraft, Duplex, Klabin) antes de selecionar a variação específica do produto.

### Escopo

**Produtos afetados**: Apenas produtos da categoria "Sacola de Papel" que possuem o atributo PAPEL configurado no WooCommerce.

**Fluxos impactados**:
- ✅ Cotações (`src/pages/NewQuote/`)
- ⏳ Pedidos (`src/pages/NewOrder/`) - Implementação futura

---

## Arquivos Modificados

### Frontend

#### 1. `src/pages/NewQuote/components/ProductNavigator.tsx`
**Versão**: v2.1 → v2.2

**Modificações**:
- ✅ Adicionado novo step `'paperType'` ao tipo `NavigationStep`
- ✅ Adicionado estado `selectedPaperType: string | null`
- ✅ Criada função helper `getUniquePaperTypes()` para extrair tipos de papel únicos
- ✅ Modificado `handleGroupedProductSelect()` para resetar paperType ao selecionar produto
- ✅ Criado `handlePaperTypeSelect()` para capturar seleção de papel
- ✅ Atualizado `handleBack()` com lógica de navegação para step de papel
- ✅ Adicionado `useEffect` para decisão automática de exibição do step de papel
- ✅ Criado componente `PaperTypeSelector` para renderização da seleção
- ✅ Modificado passagem de variações para `VariationSelector` com filtro por paperType
- ✅ Atualizado `handleVariationSelect()` para incluir paperType no ProductConfig
- ✅ Adicionado display do tipo de papel selecionado no header do VariationSelector

#### 2. `src/pages/NewQuote/components/QuickProductsStep.tsx`
**Modificações**:
- ✅ Atualizado `handleProductSelected()` para incluir `paperType` ao construir QuoteProduct

#### 3. `src/lib/quotes.ts`
**Modificações**:
- ✅ Adicionado campo `paperType?: string` ao tipo `QuoteProduct`

### Backend

#### 4. `backend/src/types/quote.ts`
**Modificações**:
- ✅ Adicionado campo `paperType?: string` ao tipo `QuoteProduct`

---

## Fluxo de Navegação Implementado

### Antes (v2.1)
```
Categoria → Linha → Produto/SKU → Variações
```

### Depois (v2.2)
```
Categoria → Linha → Produto/SKU → [Tipo de Papel]* → Variações
```

*Etapa condicional: aparece apenas para Sacolas de Papel com atributo PAPEL

---

## Lógica de Detecção

### Quando a etapa de papel é exibida?

```typescript
// Condições:
1. Categoria contém "sacola" E "papel" (case-insensitive)
2. Produto tem atributo PAPEL nas variações
3. Há mais de 1 tipo de papel disponível
```

### Quando a etapa é pulada?

```typescript
// Casos:
1. Categoria NÃO é "Sacola de Papel"
2. Produto NÃO tem atributo PAPEL
3. Produto tem apenas 1 tipo de papel (auto-selecionado)
```

---

## Funcionalidades Implementadas

### 1. Detecção Automática
- Sistema detecta automaticamente produtos com atributo PAPEL
- Auto-seleciona quando há apenas 1 tipo de papel
- Exibe step de seleção quando há múltiplos tipos

### 2. Interface de Seleção
- Grid responsivo (1 coluna em mobile, 2 em desktop)
- Cards clicáveis com hover effect
- Breadcrumb atualizado com tipo de papel selecionado
- Loading state durante carregamento de variações

### 3. Filtragem de Variações
- Variações filtradas automaticamente após seleção de papel
- Apenas variações do tipo de papel escolhido são exibidas
- Display do tipo de papel no header do VariationSelector

### 4. Navegação
- Botão "Voltar" retorna para seleção de papel
- Breadcrumb mostra caminho completo incluindo papel
- Estado preservado durante navegação

---

## Estrutura de Dados

### ProductConfig
```typescript
export interface ProductConfig {
  product: WooCommerceProduct;
  variationId?: number;
  quantity: number;
  price: number;
  color?: string;
  attributes?: Record<string, string>;
  finishing?: FinishingOptions;
  displayName?: string;
  paperType?: string; // ← NOVO
}
```

### QuoteProduct
```typescript
export interface QuoteProduct {
  // ... campos existentes
  paperType?: string; // ← NOVO (ex: "Kraft", "Duplex")
}
```

### NavigationStep
```typescript
type NavigationStep = 
  | 'line' 
  | 'category' 
  | 'subcategory' 
  | 'product' 
  | 'paperType'  // ← NOVO
  | 'variation';
```

---

## Componente PaperTypeSelector

Novo componente criado para renderização da etapa de seleção:

```typescript
interface PaperTypeSelectorProps {
  groupedProduct: GroupedProduct;
  variations: VariationWithProduct[];
  loading: boolean;
  onSelect: (paperType: string) => void;
}
```

**Características**:
- Grid responsivo de cards
- Loading state
- Empty state (nenhum papel disponível)
- Display do nome do produto
- Touch-friendly (mobile-first)

---

## Testes Recomendados

### Teste 1: Sacola de Papel COM atributo PAPEL
1. ✅ Ir para Nova Cotação
2. ✅ Selecionar "Sacola de Papel"
3. ✅ Selecionar uma linha (ex: Linha Econômica)
4. ✅ Selecionar um modelo (ex: k-034)
5. ✅ **Verificar**: Step de seleção de papel aparece
6. ✅ Selecionar tipo de papel (ex: Kraft)
7. ✅ **Verificar**: Variações mostradas são apenas as de Kraft
8. ✅ Selecionar cor e quantidade
9. ✅ **Verificar**: Produto adicionado com campo `paperType: "Kraft"`

### Teste 2: Sacola de Papel SEM atributo PAPEL
1. ✅ Ir para Nova Cotação
2. ✅ Selecionar "Sacola de Papel"
3. ✅ Selecionar uma linha
4. ✅ Selecionar um modelo sem atributo papel
5. ✅ **Verificar**: Step de papel NÃO aparece, vai direto para variações

### Teste 3: Produto que NÃO é Sacola de Papel
1. ✅ Ir para Nova Cotação
2. ✅ Selecionar "Sacola Plástica" ou "Tags"
3. ✅ **Verificar**: Fluxo normal, sem step de papel

### Teste 4: Navegação Back
1. ✅ Durante fluxo de Sacola de Papel com papel selecionado
2. ✅ Clicar em voltar na tela de variações
3. ✅ **Verificar**: Volta para seleção de tipo de papel
4. ✅ Clicar em voltar novamente
5. ✅ **Verificar**: Volta para seleção de produto

### Teste 5: Breadcrumb
1. ✅ Navegar até seleção de papel
2. ✅ **Verificar**: Breadcrumb mostra "Escolha o Tipo de Papel"
3. ✅ Selecionar papel (ex: Kraft)
4. ✅ **Verificar**: Breadcrumb mostra "Papel: Kraft"

---

## Impacto em Outros Módulos

### Mínimo Impacto
- ✅ **Backend**: Apenas adição de campo opcional `paperType`
- ✅ **API**: Nenhuma mudança necessária (campo é opcional)
- ✅ **Database**: Campo já suportado (JSONB permite campos dinâmicos)
- ✅ **PDFs**: Campo paperType pode ser exibido nas impressões

### Sem Impacto
- ✅ **NewOrder**: Fluxo de pedidos não foi modificado (implementação futura)
- ✅ **Products**: Página de produtos não alterada
- ✅ **Customers**: Sem alterações
- ✅ **Reports**: Sem alterações

---

## Deploy

### Frontend (raiz do projeto)
```bash
git add .
git commit -m "feat: adiciona etapa de seleção de tipo de papel para sacolas de papel"
git push origin main
```

### Backend (pasta /backend)
```bash
cd backend
git add .
git commit -m "chore: adiciona campo paperType ao tipo QuoteProduct"
git push origin main
cd ..
```

---

## Próximos Passos (Backlog)

### Curto Prazo
- [ ] Implementar mesma lógica no fluxo de Pedidos (`NewOrder`)
- [ ] Adicionar campo paperType na exibição de produtos salvos
- [ ] Incluir paperType nos PDFs gerados

### Médio Prazo
- [ ] Adicionar filtro por tipo de papel na listagem de cotações
- [ ] Exibir estatísticas de tipos de papel mais vendidos
- [ ] Permitir configuração de tipos de papel no admin

### Longo Prazo
- [ ] Integrar com sistema de estoque por tipo de papel
- [ ] Alertas de disponibilidade de papel

---

## Logs de Debug

O sistema inclui logs detalhados para facilitar debug:

```javascript
console.log('🚀 ProductNavigator v2.2 carregado - com etapa de seleção de tipo de papel');
console.log('🔍 extractPaperAttributeValue - Variação ${variation?.id}:', {...});
console.log('📄 VariationSelector - hasPaperAttribute:', hasPaperAttribute);
```

---

## Suporte e Manutenção

### Arquivos de Referência
- `AGENTS.md` - Documentação para agentes IA
- `.github/copilot-instructions.md` - Instruções do Copilot
- `README.md` - Documentação geral do projeto

### Contato
Para dúvidas ou sugestões sobre esta implementação, consulte a documentação ou abra uma issue no repositório.

---

**FIM DO DOCUMENTO**
