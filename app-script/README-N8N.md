# 📋 README - Migração App Script → n8n

## 🎯 O que foi criado?

Uma solução completa para migrar o processamento de webhooks do RD Station do Google Apps Script para o n8n.

---

## 📁 Arquivos Criados

### 1. **`CONFIGURACAO-N8N.md`** ⭐ COMECE AQUI
Guia completo explicando toda a configuração do n8n, incluindo:
- Estrutura do workflow
- Como cada nó funciona
- Diferenças vs App Script
- Troubleshooting

### 2. **`n8n-function-processar-lead.js`** 🔧 CÓDIGO PRINCIPAL
Código JavaScript pronto para copiar e colar no Function Node do n8n.
- Processa dados do RD Station
- Formata campos
- Extrai UTMs
- Gera JSON completo

### 3. **`n8n-mapeamento-sheets.md`** 📊 MAPEAMENTO EXATO
Guia detalhado de como mapear cada coluna no Google Sheets Node.
- Lista TODAS as 24 colunas (A até X)
- Expressões prontas para copiar
- JSON de configuração rápida

### 4. **`n8n-workflow-completo.json`** 📥 IMPORTAÇÃO RÁPIDA
Workflow completo pronto para importar no n8n.
- Basta importar e configurar credenciais
- Já tem todos os nós conectados
- Inclui verificação de duplicados

### 5. **`n8n-guia-instalacao.md`** 🚀 PASSO A PASSO
Tutorial completo de instalação e configuração.
- Como importar o workflow
- Como configurar Google Sheets
- Como testar
- Troubleshooting

### 6. **`n8n-analise-problemas.md`** 🔍 ANÁLISE DOS PROBLEMAS
Análise detalhada dos problemas que você encontrou:
- Data duplicada
- Campos com erro
- Espaçamento diferente
- Soluções para cada um

### 7. **`n8n-melhorias-otimizacoes.md`** 💡 IDEIAS FUTURAS
20+ melhorias que você pode implementar depois:
- Notificações de leads VIP
- Score automático
- Integração com CRM
- Dashboard em tempo real

---

## 🚀 Como Começar (Versão Rápida)

### Opção A: Importação Rápida (Recomendado)

1. **Importe o workflow:**
   - No n8n: Menu → Import → Selecione `n8n-workflow-completo.json`

2. **Configure credenciais:**
   - Clique em "Verificar Email Duplicado"
   - Conecte sua conta Google
   - Selecione o documento e sheet "CAV"
   - Repita para "Inserir na Planilha"

3. **Configure webhook no RD Station:**
   - Copie a URL do webhook do n8n
   - Configure no RD Station

4. **Ative e teste:**
   - Ative o workflow
   - Envie um teste
   - Verifique a planilha

**Tempo:** 15 minutos

### Opção B: Configuração Manual

1. **Leia:** `CONFIGURACAO-N8N.md`
2. **Siga:** `n8n-guia-instalacao.md`
3. **Use:** `n8n-function-processar-lead.js` e `n8n-mapeamento-sheets.md`

**Tempo:** 30-40 minutos

---

## 📊 Estrutura da Planilha Esperada

A primeira linha da planilha "CAV" deve ter EXATAMENTE estes cabeçalhos:

```
A: Data conver.
B: Hora conver.
C: Id
D: Nome
E: Email
F: Telefone
G: Instagram
H: Tempo existência
I: Faturamento
J: Domínio
K: Página
L: utm_source
M: utm_medium
N: utm_campaign
O: utm_content
P: Link RD
Q: UTM Geral
R: JSON
S: NICHOS
T: (vazia)
U: (vazia)
V: UF
W: Sub-origem
X: (vazia)
```

---

## ⚙️ Fluxo do Workflow

```
1. Webhook RD Station
   ↓
2. Processar Lead (Function)
   ↓
3. Verificar Email Duplicado (Google Sheets)
   ↓
4. Lead Não Existe? (IF)
   ↓
   TRUE → 5a. Inserir na Planilha (Google Sheets)
   FALSE → 5b. Log Lead Duplicado (Function)
```

---

## 🔑 Campos Importantes

### Campos Obrigatórios (sempre preenchidos):
- Data conver.
- Hora conver.
- Id
- Nome
- Email
- Domínio
- Página

### Campos Opcionais (podem estar vazios):
- Telefone
- Instagram
- Faturamento
- UF
- Sub-origem

### Campos com Valor Padrão:
- Tempo existência: "Tempo não disponível"
- utm_source: "unknown"
- utm_medium: "unknown"
- utm_campaign: "unknown"

---

## ⚠️ Problemas Comuns e Soluções

### ❌ Data duplicada (ex: "12/2025 03/12/2025")
**Causa:** Coluna A mapeada duas vezes
**Solução:** Delete todos os mapeamentos e refaça usando `n8n-mapeamento-sheets.md`

### ❌ Campos com #ERRO!
**Causa:** Nome do campo personalizado mudou no RD Station
**Solução:** O código em `n8n-function-processar-lead.js` já trata múltiplas variações

### ⚠️ Espaçamento diferente
**Causa:** Google Sheets API renderiza diferente do Apps Script
**Solução:** Não é um problema real, apenas visual. Os dados estão corretos.

### ❌ Webhook não executa
**Causa:** Workflow não está ativo
**Solução:** Ative o botão verde no canto superior direito

### ❌ "Column not found"
**Causa:** Cabeçalhos da planilha diferentes
**Solução:** Verifique se a primeira linha tem os cabeçalhos exatos listados acima

---

## 🎯 Checklist de Validação

Antes de considerar concluído:

- [ ] Workflow importado com sucesso
- [ ] Google Sheets conectado
- [ ] Documento correto selecionado
- [ ] Sheet "CAV" selecionado
- [ ] Todas as 24 colunas mapeadas
- [ ] Webhook configurado no RD Station
- [ ] Workflow ativado
- [ ] Teste manual realizado
- [ ] Lead apareceu na planilha
- [ ] Todos os campos corretos
- [ ] Teste de duplicação OK
- [ ] App Script desativado (para evitar duplicação)

---

## 📊 Comparação: App Script vs n8n

| Aspecto | App Script | n8n | Vencedor |
|---------|-----------|-----|----------|
| Visual | ❌ Código apenas | ✅ Interface visual | n8n |
| Debug | ⚠️ Console.log | ✅ Ver dados em cada nó | n8n |
| Logs | ⚠️ Limitados | ✅ Todas execuções salvas | n8n |
| Performance | ✅ Rápido | ✅ Rápido | Empate |
| Anti-duplicação | ⚠️ Após inserir | ✅ Antes de inserir | n8n |
| Limite de execução | ⚠️ 6 minutos | ✅ Sem limite | n8n |
| Configuração | ✅ Simples | ⚠️ Média | App Script |
| Integrações | ⚠️ Limitadas | ✅ 400+ integrações | n8n |
| Escalabilidade | ⚠️ Limitada | ✅ Alta | n8n |

**Veredito:** n8n é superior em quase todos os aspectos, exceto facilidade inicial.

---

## 💰 Custos

### App Script:
- ✅ Gratuito
- ⚠️ Limitado a 6min de execução

### n8n:
- ✅ Open source (auto-hospedado = grátis)
- ⚠️ Requer servidor (você já tem)
- 💡 n8n Cloud: $20-50/mês (opcional)

---

## 📈 Próximos Passos Recomendados

### Semana 1 (Estabilização):
1. Implementar workflow básico
2. Testar por 48h em paralelo com App Script
3. Desativar App Script quando validado

### Semana 2 (Melhorias):
1. Adicionar notificações de leads VIP
2. Implementar validação de email
3. Configurar backup automático

### Semana 3 (Otimizações):
1. Criar score de qualificação
2. Adicionar identificação de origem
3. Implementar deduplicação avançada

### Longo Prazo (Avançado):
- Integrar com CRM
- Dashboard em tempo real
- Análise de sentimento com IA
- Webhook de retorno para RD Station

Ver `n8n-melhorias-otimizacoes.md` para todas as ideias.

---

## 🆘 Suporte

### Se algo der errado:

1. **Primeiro:** Leia `n8n-analise-problemas.md`
2. **Segundo:** Verifique logs no n8n (Executions → clique na execução)
3. **Terceiro:** Teste manualmente cada nó
4. **Quarto:** Verifique se os cabeçalhos da planilha estão corretos

### Comandos úteis para debug:

```powershell
# Testar webhook manualmente (substitua a URL)
$body = '{"leads":[{"id":"TEST","name":"Teste","email":"teste@teste.com"}]}' | ConvertFrom-Json | ConvertTo-Json
Invoke-RestMethod -Uri "SUA_URL" -Method Post -Body $body -ContentType "application/json"
```

---

## 📝 Notas Importantes

1. **Não delete o App Script ainda!** Rode em paralelo por alguns dias
2. **Teste com dados reais** antes de desativar completamente
3. **Monitore as primeiras 50-100 execuções** para garantir que está tudo OK
4. **Faça backup da planilha** antes de começar
5. **Documente qualquer customização** que você fizer

---

## 🏆 Vantagens Conquistadas

Ao migrar para n8n, você ganhou:

✅ **Visibilidade:** Vê cada etapa do processamento
✅ **Logs Automáticos:** Todas as execuções salvas por 7 dias
✅ **Eficiência:** Verifica duplicação ANTES de inserir
✅ **Escalabilidade:** Pode adicionar novas integrações facilmente
✅ **Profissionalismo:** Workflow robusto e confiável
✅ **Flexibilidade:** Fácil adicionar validações e notificações
✅ **Sem Limites:** Não há limite de 6 minutos do Apps Script

---

## 📞 Contato e Feedback

Se você implementar melhorias ou encontrar problemas, documente em:
- `n8n-melhorias-otimizacoes.md` (para melhorias)
- `n8n-analise-problemas.md` (para problemas)

---

**Criado em:** 04/12/2025  
**Versão:** 1.0  
**Compatível com:** n8n v1.0+, RD Station API v2, Google Sheets API v4  
**Status:** ✅ Pronto para produção

---

## ✨ Resumo Final

Você tem agora:
- 📄 7 arquivos de documentação completa
- 🔧 Código JavaScript otimizado
- 📊 Mapeamento exato de colunas
- 📥 Workflow pronto para importar
- 🚀 Guia passo a passo de instalação
- 🔍 Análise de problemas e soluções
- 💡 20+ ideias de melhorias futuras

**Tudo que você precisa para migrar do App Script para n8n com sucesso!**

Boa sorte! 🚀
