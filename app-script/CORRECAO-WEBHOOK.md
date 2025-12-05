# 🔧 Correção do Webhook - Problemas Resolvidos

## ✅ O que foi corrigido:

### 1. **Erro "Não foi possível validar o webhook"**
- **Causa**: O RD Station envia uma requisição de validação vazia ao criar o webhook
- **Solução**: Código agora responde com `{status: 'ok'}` mesmo sem dados

### 2. **Campos não preenchidos na planilha**
- **Causa**: Os nomes dos campos personalizados no RD Station podem ser diferentes
- **Solução**: Código agora tenta múltiplas variações de nome para cada campo

### 3. **Melhorias adicionadas**
- ✅ Proteção contra JSON muito grande (trunca se > 50KB)
- ✅ Múltiplas tentativas para encontrar campos personalizados
- ✅ Função de debug para ver estrutura real dos dados

---

## 🚀 Como aplicar a correção:

### Passo 1: Atualizar o código
1. Copie TODO o conteúdo do arquivo `webhook-rd-station.gs` atualizado
2. Abra sua planilha > **Extensões > Apps Script**
3. **SUBSTITUA TODO** o código antigo pelo novo
4. Clique em **Salvar** (Ctrl+S)

### Passo 2: Reimplantar
1. No Apps Script, clique em **Implantar > Gerenciar implantações**
2. Clique no ícone de lápis ✏️ da implantação ativa
3. Em "Versão", selecione **Nova versão**
4. Clique em **Implantar**
5. **A URL permanece a mesma**, não precisa alterar no RD Station

### Passo 3: Testar novamente no RD Station
1. Vá em **Relacionar > Webhooks**
2. Clique em **Verificar** no webhook "PLANILHA CAV"
3. Deve aparecer: ✅ **Webhook validado com sucesso**

---

## 🔍 Como descobrir os nomes reais dos campos

Se ainda houver campos vazios na planilha, siga estes passos:

### 1. Aguarde uma conversão real do RD Station

### 2. Execute a função de debug
1. Na planilha, vá em **Extensões > Apps Script**
2. Selecione a função `verUltimoWebhookRecebido` no menu suspenso
3. Clique em **Executar**
4. Vá em **Execuções** (menu lateral) ou **Ctrl+Enter**
5. Clique na última execução
6. Veja o log com a estrutura completa

### 3. Ajuste os nomes dos campos
No código, procure por esta seção (aproximadamente linha 75):

```javascript
// Instagram - tenta várias possibilidades
var instagram = campos['Instagram da empresa'] || 
                campos['instagram'] ||
                campos['Instagram'] ||
                lead.instagram || '';

// Faturamento - tenta várias possibilidades
var faturamento = campos['Qual é o faturamento mensal do seu negócio?'] || 
                  campos['faturamento'] ||
                  campos['Faturamento'] ||
                  campos['qual_e_o_faturamento_mensal_do_seu_negocio'] || '';
```

**Adicione o nome EXATO** que apareceu no log de debug.

---

## 📊 Exemplo de saída do debug

Quando você executar `verUltimoWebhookRecebido`, verá algo assim:

```json
=== CAMPOS PERSONALIZADOS DISPONÍVEIS ===
{
  "cf_instagram_da_empresa": "@empresa123",
  "cf_faturamento_mensal": "100 mil a 250 mil",
  "cf_tempo_de_existencia": "2-3 anos"
}
```

Se os nomes forem diferentes, adicione-os no código!

---

## ✅ Checklist de validação

- [ ] Código atualizado no Apps Script
- [ ] Código salvo (Ctrl+S)
- [ ] Nova versão implantada
- [ ] Webhook validado com sucesso no RD Station (sem erro vermelho)
- [ ] Conversão de teste criou uma nova linha na planilha
- [ ] Todos os campos principais foram preenchidos (nome, email, telefone, UTMs)

---

## 🆘 Se ainda houver campos vazios:

1. Execute `verUltimoWebhookRecebido` (função de debug)
2. Copie o log que aparecer
3. Me envie para eu ajustar os nomes exatos dos campos personalizados

---

## 💡 Dica importante

O webhook agora **sempre responde com sucesso** ao RD Station, mesmo se houver algum erro interno. Isso evita que o RD Station desative o webhook.

Para ver se há erros:
- Vá em **Apps Script > Execuções**
- Procure por execuções com status de erro
- Clique para ver os detalhes

---

## 📝 Campos que o código busca automaticamente:

| Campo na Planilha | Variações que o código procura |
|------------------|--------------------------------|
| Instagram | "Instagram da empresa", "instagram", "Instagram" |
| Faturamento | "Qual é o faturamento mensal do seu negócio?", "faturamento", "Faturamento" |
| Tempo existência | "Tempo de existência", "tempo_existencia", "Tempo existência" |
| Telefone | mobile_phone, personal_phone, phone, campos personalizados |
| UF | state, estado, uf |

Se seus campos tiverem nomes diferentes, me avise!
