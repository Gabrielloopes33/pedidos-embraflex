# Configuração de Produtos no WooCommerce

## ✅ Ajustes Implementados

### 1. **Filtro de Categoria INTERNO** ✅
- Apenas produtos da categoria "Interno" ou "Interna" serão exibidos no sistema
- Se a categoria não existir, uma lista vazia será retornada
- Backend modificado para forçar o filtro sempre

### 2. **Preço Variável por Quantidade** ✅
- Sistema agora suporta **Produtos Variáveis** do WooCommerce
- O preço unitário muda automaticamente quando a quantidade é alterada
- Funciona com dois métodos:

#### **Método 1: Produtos Variáveis (RECOMENDADO)**

Este é o método nativo do WooCommerce e funciona automaticamente:

1. **Criar Produto Variável no WooCommerce:**
   - Tipo de Produto: **Variable product**
   - Adicionar atributo "Quantidade" nas variações
   - Cada variação representa uma quantidade diferente com seu preço

2. **Exemplo de Configuração:**
   ```
   Produto: Sacola Extra Alvura 150gr - Natural - Linha Econômica
   Tipo: Variable product
   
   Atributos:
   - Quantidade (usado para variações)
     • 1000
     • 1500
     • 3000
   
   Variações:
   1. Quantidade: 1000 | Preço: R$ 2,27
   2. Quantidade: 1500 | Preço: R$ 2,10  
   3. Quantidade: 3000 | Preço: R$ 2,01
   ```

3. **Como o sistema detecta:**
   - Busca automaticamente as variações do produto
   - Extrai quantidade e preço de cada variação
   - Popula o dropdown de quantidade
   - Atualiza o preço quando a quantidade é selecionada

#### **Método 2: Meta Data (Alternativo)**

Para produtos simples, você pode adicionar preços manualmente:

1. Adicionar campo customizado `precos_por_quantidade` no produto
2. Formato: `quantidade:preco|quantidade:preco|...`
3. Exemplo: `1000:2.27|1500:2.10|3000:2.01`

**Nota:** Este método é menos robusto e não é recomendado para novos produtos.

---

## 🏷️ Como Criar Produtos Variáveis no WooCommerce

### Passo a Passo:

1. **Criar Novo Produto:**
   - Produtos > Adicionar novo
   - Dar nome ao produto

2. **Configurar como Variável:**
   - Dados do produto > Tipo de produto: **Variable product**

3. **Adicionar Atributos:**
   - Aba "Atributos"
   - Adicionar atributo "Quantidade" (ou "Qtd")
   - Marcar "Usado para variações"
   - Adicionar valores: `1000 | 1500 | 3000` (separados por |)
   - Salvar atributos

4. **Criar Variações:**
   - Aba "Variações"
   - Selecionar "Criar variações de todos os atributos"
   - Isso criará uma variação para cada quantidade

5. **Definir Preços das Variações:**
   - Expandir cada variação
   - Definir:
     - Preço regular: `2.27` (para 1000 un)
     - Preço regular: `2.10` (para 1500 un)
     - Preço regular: `2.01` (para 3000 un)
   - SKU (opcional): `K-034-1000`, `K-034-1500`, etc.

6. **Configurar Categoria:**
   - **IMPORTANTE:** Adicionar à categoria "Interno" ou "Interna"
   - Apenas produtos desta categoria serão exibidos

7. **Publicar Produto**

---

## 📊 Exemplo Completo

**Produto: k-034 - Extra Alvura 150gr - Natural - Linha Econômica**

```
Tipo: Variable product
Categoria: Interno ✅

Atributos:
└─ Quantidade (usado para variações)
   ├─ 1000
   ├─ 1500
   └─ 3000

Variações:
├─ Quantidade: 1000
│  ├─ Preço regular: 2.27
│  └─ SKU: k-034-1000
│
├─ Quantidade: 1500
│  ├─ Preço regular: 2.10
│  └─ SKU: k-034-1500
│
└─ Quantidade: 3000
   ├─ Preço regular: 2.01
   └─ SKU: k-034-3000
```

---

## 🔧 Comportamento no Sistema

### Quando o usuário seleciona um produto:

1. **Sistema detecta tipo:**
   - Se `type === 'variable'` → busca variações
   - Se `type === 'simple'` → busca meta_data

2. **Carrega tabela de preços:**
   - Extrai todas as variações
   - Mapeia quantidade → preço
   - Exibe tabela visual no formulário

3. **Ao mudar quantidade:**
   - Busca o preço correspondente na tabela
   - Atualiza campo "Valor Unitário (R$)" automaticamente
   - Recalcula total do item

4. **Indicadores visuais:**
   - Título mostra "(Produto Variável)" 
   - Tabela de preços destacada em azul
   - Quantidade selecionada aparece destacada

---

## ⚠️ Checklist de Verificação

Antes de publicar um produto, verifique:

- [ ] Produto está na categoria **"Interno"** ou **"Interna"**
- [ ] Tipo do produto é **Variable product**
- [ ] Atributo "Quantidade" criado e marcado como "usado para variações"
- [ ] Todas as variações têm preços definidos
- [ ] Preços estão corretos (use ponto para decimal: `2.27` não `2,27`)
- [ ] SKUs são únicos (opcional mas recomendado)

---

## 🐛 Troubleshooting

### Produto não aparece no sistema:
- Verifique se está na categoria "Interno" ou "Interna"
- Verifique se o produto está publicado (não rascunho)

### Preço não muda ao alterar quantidade:
- Verifique se o produto é do tipo "Variable product"
- Verifique se as variações têm preços definidos
- Abra o console do navegador (F12) para ver logs detalhados

### Categorias não aparecem:
- Verifique se a categoria se chama exatamente "Interno" ou "Interna"
- Backend filtra apenas categorias com esses nomes

---

## 📝 Logs do Console

O sistema gera logs detalhados no console do navegador:

```
🔍 Produto selecionado: k-034 - Extra Alvura 150gr - Tipo: variable
📦 Buscando variações do produto...
✅ Variações encontradas: 3
  📊 Variação: 1000 un = R$ 2.27
  📊 Variação: 1500 un = R$ 2.1
  📊 Variação: 3000 un = R$ 2.01
💰 Preço inicial (variável): 1000 un = R$ 2.27
🔄 Mudança de quantidade detectada: 3000
✅ Preço encontrado para quantidade 3000 : 2.01
💰 Total recalculado: 6030 para item: {...}
```

Use esses logs para diagnosticar problemas!

---

## 🎯 Resumo

- **Use Produtos Variáveis** para melhor integração
- **Sempre adicione à categoria INTERNO**
- **Configure variações com quantidade e preço**
- **O sistema detecta e aplica preços automaticamente**

O sistema foi projetado para funcionar de forma intuitiva com a estrutura nativa do WooCommerce! 🚀
