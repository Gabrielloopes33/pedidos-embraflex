# Configuração de Produtos no WooCommerce

## ✅ Ajustes Implementados

### 1. **Filtro de Categoria INTERNO** ✅
- Apenas produtos da categoria "Interno" ou "Interna" serão exibidos no sistema
- Se a categoria não existir, uma lista vazia será retornada
- Backend modificado para forçar o filtro sempre

### 2. **Preço Variável por Quantidade E Tipo de Impressão** ✅
- Sistema agora suporta **Produtos Variáveis** do WooCommerce
- O preço unitário muda automaticamente quando a quantidade OU tipo de impressão é alterado
- Funciona com múltiplos atributos de variação

#### **Como Funciona:**

O sistema procura nas variações do produto por dois atributos principais:
1. **Quantidade** (ex: 1000, 1500, 3000 unidades)
2. **Tipo de Impressão** (ex: Policromia, Pantone, Preto)

Quando AMBOS os atributos existem, o sistema busca o preço pela combinação:
- Exemplo: `1000 unidades + Policromia = R$ 3,92`
- Exemplo: `1000 unidades + Pantone = R$ 3,16`
- Exemplo: `1000 unidades + Preto = R$ 3,14`

#### **Método: Produtos Variáveis com Múltiplos Atributos (RECOMENDADO)**

Este é o método mais completo e funciona automaticamente:

1. **Criar Produto Variável no WooCommerce:**
   - Tipo de Produto: **Variable product**
   - Adicionar atributo "Quantidade" nas variações
   - Adicionar atributo "Tipo de Impressão" nas variações
   - Cada variação representa uma combinação única de quantidade + tipo de impressão com seu preço

2. **Exemplo de Configuração (com Tipo de Impressão):**
   ```
   Produto: k-034 - Duplex Klabim - Laminado - Linha Premium
   Tipo: Variable product
   
   Atributos:
   - Quantidade (usado para variações)
     • 1000
     • 1500
     • 3000
   
   - Tipo de Impressão (usado para variações)
     • Policromia
     • Pantone
     • Preto
   
   Variações (9 combinações):
   1. Quantidade: 1000 | Tipo: Policromia | Preço: R$ 3,92
   2. Quantidade: 1000 | Tipo: Pantone    | Preço: R$ 3,16
   3. Quantidade: 1000 | Tipo: Preto      | Preço: R$ 3,14
   4. Quantidade: 1500 | Tipo: Policromia | Preço: R$ 3,80
   5. Quantidade: 1500 | Tipo: Pantone    | Preço: R$ 3,00
   6. Quantidade: 1500 | Tipo: Preto      | Preço: R$ 2,98
   7. Quantidade: 3000 | Tipo: Policromia | Preço: R$ 3,60
   8. Quantidade: 3000 | Tipo: Pantone    | Preço: R$ 2,85
   9. Quantidade: 3000 | Tipo: Preto      | Preço: R$ 2,82
   ```

3. **Como o sistema detecta:**
   - Busca automaticamente as variações do produto
   - Extrai quantidade, tipo de impressão e preço de cada variação
   - Popula o dropdown de quantidade
   - Popula o dropdown de tipo de impressão
   - Atualiza o preço quando QUALQUER um dos dois é alterado

---

## 🏷️ Como Criar Produtos Variáveis com Múltiplos Atributos

### Passo a Passo Completo:

1. **Criar Novo Produto:**
   - Produtos > Adicionar novo
   - Dar nome ao produto (ex: "k-034 - Duplex Klabim - Laminado - Linha Premium")

2. **Configurar como Variável:**
   - Dados do produto > Tipo de produto: **Variable product**

3. **Adicionar Atributos:**
   
   **a) Atributo de Quantidade:**
   - Aba "Atributos"
   - Adicionar atributo "Quantidade" (ou "Qtd")
   - Marcar ✅ "Usado para variações"
   - Adicionar valores: `1000 | 1500 | 3000` (separados por |)
   - Salvar atributos
   
   **b) Atributo de Tipo de Impressão:**
   - Adicionar atributo "Tipo de Impressão"
   - Marcar ✅ "Usado para variações"
   - Adicionar valores: `Policromia | Pantone | Preto` (separados por |)
   - Salvar atributos

4. **Criar Variações:**
   - Aba "Variações"
   - Selecionar "Criar variações de todos os atributos"
   - ⚠️ Isso criará TODAS as combinações possíveis (3 quantidades × 3 tipos = 9 variações)
   - Confirmar criação

5. **Definir Preços das Variações:**
   
   Expandir cada variação e definir o preço:
   
   ```
   Variação 1:
   - Quantidade: 1000
   - Tipo de Impressão: Policromia
   - Preço regular: 3.92
   - SKU (opcional): k-034-1000-policromia
   
   Variação 2:
   - Quantidade: 1000
   - Tipo de Impressão: Pantone
   - Preço regular: 3.16
   - SKU (opcional): k-034-1000-pantone
   
   Variação 3:
   - Quantidade: 1000
   - Tipo de Impressão: Preto
   - Preço regular: 3.14
   - SKU (opcional): k-034-1000-preto
   
   ... (repetir para 1500 e 3000 unidades)
   ```

6. **Configurar Categoria:**
   - **IMPORTANTE:** Adicionar à categoria "Interno" ou "Interna"
   - Apenas produtos desta categoria serão exibidos

7. **Publicar Produto**

---

## 📊 Exemplo Completo

**Produto: k-034 - Duplex Klabim - Laminado - Linha Premium**

```
Tipo: Variable product
Categoria: Interno ✅

Atributos:
├─ Quantidade (usado para variações)
│  ├─ 1000
│  ├─ 1500
│  └─ 3000
│
└─ Tipo de Impressão (usado para variações)
   ├─ Policromia
   ├─ Pantone
   └─ Preto

Variações (9 total):
├─ Quantidade: 1000 | Tipo: Policromia
│  ├─ Preço regular: 3.92
│  └─ SKU: k-034-1000-policromia
│
├─ Quantidade: 1000 | Tipo: Pantone
│  ├─ Preço regular: 3.16
│  └─ SKU: k-034-1000-pantone
│
├─ Quantidade: 1000 | Tipo: Preto
│  ├─ Preço regular: 3.14
│  └─ SKU: k-034-1000-preto
│
├─ Quantidade: 1500 | Tipo: Policromia
│  ├─ Preço regular: 3.80
│  └─ SKU: k-034-1500-policromia
│
... (e assim por diante)
```

---

## 🔧 Comportamento no Sistema

### Quando o usuário seleciona um produto:

1. **Sistema detecta tipo:**
   - Se `type === 'variable'` → busca variações
   - Extrai TODOS os atributos de variação (quantidade, tipo de impressão, etc.)

2. **Carrega tabela de preços:**
   - Mapeia todas as variações
   - Cria chave composta: `quantidade_tipodeimpressao` → preço
   - Exemplo: `1000_policromia` → R$ 3,92
   - Exibe tabela visual no formulário

3. **Ao mudar quantidade OU tipo de impressão:**
   - Busca o preço correspondente à combinação
   - Atualiza campo "Valor Unitário (R$)" automaticamente
   - Recalcula total do item

4. **Indicadores visuais:**
   - Título mostra "(Produto Variável)" 
   - Tabela de preços mostra: `1000 un + policromia: R$ 3,92`
   - Combinação selecionada aparece destacada

---

## ⚠️ Checklist de Verificação

Antes de publicar um produto com múltiplos atributos:

- [ ] Produto está na categoria **"Interno"** ou **"Interna"**
- [ ] Tipo do produto é **Variable product**
- [ ] Atributo "Quantidade" criado e marcado como "usado para variações"
- [ ] Atributo "Tipo de Impressão" criado e marcado como "usado para variações"
- [ ] Todas as variações (combinações) têm preços definidos
- [ ] Preços estão corretos (use ponto para decimal: `3.92` não `3,92`)
- [ ] SKUs são únicos e descritivos (opcional mas recomendado)
- [ ] Testado no sistema: trocar quantidade E tipo de impressão altera o preço

---

## 🎯 Casos de Uso

### Caso 1: Produto com Quantidade + Tipo de Impressão
```
✅ Recomendado para: Produtos com preço que varia por quantidade E tipo
Exemplo: Sacolas, Etiquetas, Adesivos com múltiplas opções de impressão
```

### Caso 2: Produto apenas com Quantidade
```
✅ Recomendado para: Produtos simples com preço que varia apenas por volume
Exemplo: Produtos com um único tipo de impressão padrão
```

---

## 🐛 Troubleshooting

### Produto não aparece no sistema:
- Verifique se está na categoria "Interno" ou "Interna"
- Verifique se o produto está publicado (não rascunho)

### Preço não muda ao alterar quantidade ou tipo de impressão:
- Verifique se o produto é do tipo "Variable product"
- Verifique se as variações têm preços definidos
- Abra o console do navegador (F12) para ver logs detalhados
- Verifique se os nomes dos atributos estão corretos:
  - "Quantidade" ou "Qtd"
  - "Tipo de Impressão" ou "Tipo de impressao"

### Tabela de preços não aparece:
- Verifique se o produto tem variações criadas
- Verifique se os atributos estão marcados como "usado para variações"
- Veja os logs do console para identificar o problema

### Preço errado ao selecionar combinação:
- Verifique se todas as combinações de quantidade + tipo têm preços definidos
- Use logs do console para ver qual chave está sendo buscada
- Formato da chave: `1000_policromia`, `1500_pantone`, etc.
- Certifique-se que os nomes estão em minúsculas e sem espaços extras

---

## 📝 Logs do Console

O sistema gera logs detalhados no console do navegador (F12):

**Para produtos com Quantidade + Tipo de Impressão:**
```
🔍 Produto selecionado: k-034 - Duplex Klabim - Tipo: variable
📦 Buscando variações do produto...
✅ Variações encontradas: 9
  📊 Variação: 1000 un + policromia = R$ 3.92
  📊 Variação: 1000 un + pantone = R$ 3.16
  📊 Variação: 1000 un + preto = R$ 3.14
  ... (mais variações)
💰 Preço inicial (variável com tipo): 1000 un + policromia = R$ 3.92
🔄 Mudança detectada: tipoImpressao = pantone
📊 Buscando preço para: quantidade = 1000 + tipo = pantone
🔍 Buscando chave: 1000_pantone
📋 Chaves disponíveis: ["1000_policromia", "1000_pantone", "1000_preto", ...]
✅ Preço encontrado (quantidade + tipo): 3.16
💰 Total recalculado: 3160 para item: {...}
```

**Para produtos apenas com Quantidade:**
```
🔍 Produto selecionado: k-034 - Extra Alvura - Tipo: variable
📦 Buscando variações do produto...
✅ Variações encontradas: 3
  📊 Variação: 1000 un = R$ 2.27
  📊 Variação: 1500 un = R$ 2.10
  📊 Variação: 3000 un = R$ 2.01
💰 Preço inicial (variável): 1000 un = R$ 2.27
```

Use esses logs para diagnosticar problemas!

---

## 🎯 Resumo

- **Use Produtos Variáveis** para melhor integração
- **Sempre adicione à categoria INTERNO**
- **Configure variações com quantidade e/ou tipo de impressão**
- **Defina preços para TODAS as combinações**
- **O sistema detecta e aplica preços automaticamente**
- **Mudança em QUALQUER atributo recalcula o preço**

### Vantagens do Sistema:

✅ **Flexível**: Suporta produtos simples (só quantidade) ou complexos (quantidade + tipo)  
✅ **Automático**: Preços são atualizados em tempo real  
✅ **Visual**: Tabela de preços mostra todas as opções disponíveis  
✅ **Inteligente**: Destaca a combinação selecionada  
✅ **Robusto**: Logs detalhados para debug

O sistema foi projetado para funcionar de forma intuitiva com a estrutura nativa do WooCommerce! 🚀
