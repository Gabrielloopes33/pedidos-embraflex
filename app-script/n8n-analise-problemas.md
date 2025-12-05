# 🔍 Análise: Diferenças entre App Script e n8n

## 📊 Comparação da Linha que Funcionou vs Problemas

### ✅ O que está CORRETO (baseado na linha de exemplo)

Analisando a linha de **Patrícia Messias de Souza** que funcionou:

```
Data: 12/2025 03/12/2025 (PROBLEMA - ver abaixo)
Hora: 11:05:37 ✅
Id: 4576067378 ✅
Nome: Patricia Messias de Souza ✅
Email: patriciacamacho_shoes@hotmail.com ✅
Telefone: 55 (11) 99116-4136 ✅ (formato correto)
Instagram: Patrícia Camacho ✅
Tempo existência: Tempo não disponível ✅
Faturamento: 100 mil a 250 mil ✅
Domínio: site.codirect.com.br ✅
Página: sessao-estrategica-evandro ✅
utm_source: IgEvandro ✅
utm_medium: cpc_09.09.25_igevandro_arq.g11lkdelstarq_41leva7.mesbommesruim ✅
utm_campaign: ads_arquitetura ✅
utm_content: 41leva7.mesbommesruim ✅
Link RD: http://app.rdstation.com.br/leads/public/... ✅
UTM Geral: encoded_eyJmaX... ✅
JSON: {...} ✅
```

---

## ⚠️ PROBLEMAS IDENTIFICADOS

### 1. ❌ Data Duplicada na Coluna A

**O que apareceu:**
```
12/2025 03/12/2025
```

**Esperado:**
```
03/12/2025
```

**Causa:** Provavelmente você mapeou DUAS vezes a coluna A:
- Uma vez como "Data conver."
- Outra como coluna sem nome ou duplicada

**Solução:** No Google Sheets Node do n8n:
1. Delete TODAS as colunas mapeadas
2. Comece do zero
3. Certifique-se que cada coluna está mapeada APENAS UMA VEZ
4. Use o mapeamento que forneci no arquivo `n8n-mapeamento-sheets.md`

---

### 2. ❌ Campos com #ERRO!

**Possíveis causas:**

#### A) Nome do campo mudou no RD Station
O RD Station pode enviar campos personalizados com nomes diferentes:
- `"Instagram da empresa"` vs `"instagram"`
- `"Qual o faturamento mensal do seu negócio?"` vs `"Qual é o faturamento mensal do seu negócio?"`

**Solução:** O código JavaScript que forneci já trata isso com múltiplas variações:

```javascript
const instagram = customFields['Instagram da empresa'] || 
                 customFields['instagram'] ||
                 customFields['Instagram'] ||
                 customFields['instagram_empresa'] ||
                 lead.instagram || 
                 '';
```

#### B) Acesso a propriedade undefined
Se você tentou acessar `lead.custom_fields['campo']` sem verificar se existe.

**Solução:** O código que forneci usa `||` para valores padrão:

```javascript
const customFields = lead.custom_fields || {}; // ← Sempre retorna objeto
const instagram = customFields['Instagram da empresa'] || ''; // ← Sempre retorna string
```

#### C) Expressão incorreta no n8n
Se você usou `$json.campo` sem as chaves `{{ }}`.

**Solução:** SEMPRE use:
```
{{ $json.campo }}   ✅ CORRETO
$json.campo         ❌ ERRADO
```

---

### 3. ⚠️ Espaçamento Diferente

**O que você notou:**
> "o espaçamento das linhas ficou diferente"

**Explicação:**
- **App Script:** Usa `sheet.appendRow([array])` que o Google Sheets renderiza com espaçamento padrão
- **n8n:** Usa a API REST do Google Sheets que insere dados de forma ligeiramente diferente

**Isso é um problema?**
❌ NÃO! Os dados estão corretos. Apenas a renderização visual é diferente.

**Por que acontece?**
- App Script insere via Apps Script API (interno do Google)
- n8n insere via Google Sheets API v4 (externa)
- O Google Sheets renderiza de forma levemente diferente dependendo da origem

**Solução:**
Não precisa fazer nada. Se realmente incomoda:
1. Selecione todas as linhas
2. Clique com botão direito → "Redimensionar linhas"
3. Escolha "Ajustar aos dados"

---

## 🔄 Campos que Podem Vir Vazios

Baseado no payload do RD Station, estes campos **podem estar vazios** e é normal:

| Campo | Quando está vazio |
|-------|-------------------|
| Telefone | Lead não preencheu ou campo não está no formulário |
| Instagram | Lead não preencheu |
| Faturamento | Lead não preencheu ou não é campo obrigatório |
| UF | RD Station não capturou |
| Sub-origem | Conversão direta (sem UTM detalhado) |

---

## 🎯 Checklist de Validação

Use este checklist para garantir que tudo está correto:

### No n8n:

- [ ] Function Node tem o código completo de `n8n-function-processar-lead.js`
- [ ] Google Sheets Node está em modo "Define Below for Each Column"
- [ ] Cada coluna está mapeada EXATAMENTE UMA VEZ
- [ ] As expressões usam `{{ $json.campo }}` e não `$json.campo`
- [ ] A sheet selecionada é "CAV"
- [ ] O workflow está ativo

### Na planilha Google Sheets:

- [ ] A primeira linha tem os cabeçalhos corretos
- [ ] Não há colunas duplicadas
- [ ] A aba se chama "CAV" (ou você ajustou no código)

### No RD Station:

- [ ] O webhook está configurado com a URL do n8n
- [ ] O webhook está ativo
- [ ] O método é POST
- [ ] Não há filtros bloqueando conversões

---

## 🐛 Debug: Como Identificar Problemas

### 1. Ver dados que o n8n recebeu

No n8n, clique em "Execute Workflow" e depois clique no nó "Webhook". Você verá:

```json
{
  "body": {
    "leads": [...]
  }
}
```

### 2. Ver dados processados pelo Function Node

Clique no nó "Processar Lead". Você deve ver:

```json
{
  "dataConversao": "04/12/2025",
  "horaConversao": "10:30:45",
  "nome": "João Silva",
  ...
}
```

Se algum campo estiver com `undefined`, `null` ou `[object Object]`, há um problema no código JavaScript.

### 3. Ver o que foi inserido no Sheets

Clique no último nó "Inserir na Planilha". Deve mostrar:

```json
{
  "success": true
}
```

Se mostrar erro, leia a mensagem. Geralmente é:
- "Column not found" → Nome da coluna errado
- "Invalid value" → Tipo de dado incompatível
- "Insufficient permissions" → Precisa reautorizar o Google Sheets

---

## 📈 Melhorias que o n8n Oferece

Comparado ao App Script, o n8n oferece:

### ✅ Vantagens:

1. **Visual:** Você vê cada passo do fluxo
2. **Debug fácil:** Clica no nó e vê os dados
3. **Logs automáticos:** Todas as execuções ficam salvas
4. **Anti-duplicação ANTES de inserir:** Mais eficiente
5. **Escalável:** Pode adicionar validações, notificações, etc.
6. **Sem limite de execução:** App Script tem limite de 6min
7. **Integrações:** Pode enviar para Slack, email, CRM, etc.

### ⚠️ Desvantagens:

1. **Configuração inicial mais complexa:** Mas depois fica mais fácil
2. **Requer servidor:** n8n precisa estar rodando (mas você já tem)
3. **Curva de aprendizado:** Precisa entender como funciona

---

## 🚀 Próximos Passos Recomendados

1. **Implementar notificações:**
   - Adicione um nó de Email/Slack após inserção
   - Notifique quando um lead VIP (faturamento > 100k) chegar

2. **Enriquecer dados:**
   - Adicione um nó que busca CEP via API
   - Preencha UF automaticamente

3. **Validação avançada:**
   - Verifique se email é válido
   - Verifique se telefone tem DDD

4. **Backup:**
   - Adicione um segundo Google Sheets como backup
   - Ou envie para um banco de dados

---

**Criado em:** 04/12/2025
**Baseado em:** Análise das imagens fornecidas e payload real do RD Station
