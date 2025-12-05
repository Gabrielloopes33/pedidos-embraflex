# 🔧 Solução para Erro 500 no Webhook RD Station

## O que está acontecendo:

O erro 500 (Internal Server Error) está vindo do **RD Station**, não do seu código. Isso pode acontecer por:

1. ❌ O RD Station não consegue validar webhooks do Google Apps Script em alguns casos
2. ❌ Problema temporário nos servidores do RD Station
3. ❌ A URL do Apps Script precisa estar "aquecida" (primeiro acesso pode falhar)

---

## ✅ SOLUÇÃO 1: Testar sem validação (RECOMENDADO)

Segundo a documentação do RD Station, a validação do webhook é opcional. Você pode:

### 1. **Salve o webhook SEM clicar em "Verificar"**
   - No RD Station, crie o webhook normalmente
   - Cole a URL do Apps Script
   - Configure o gatilho (Conversão)
   - **NÃO clique em "Verificar"** - apenas salve

### 2. **Faça uma conversão de teste real**
   - Preencha um formulário do RD Station
   - Ou crie um lead manualmente e marque como conversão
   - Aguarde 30 segundos
   - Verifique se apareceu na planilha

### 3. **Verifique os logs**
   - Apps Script > Execuções
   - Procure por execuções recentes
   - Veja se o webhook foi recebido

---

## ✅ SOLUÇÃO 2: Aquecer a URL primeiro

Antes de configurar no RD Station:

### 1. **Acesse a URL do webhook no navegador**
   - Cole sua URL do Apps Script no navegador
   - Você deve ver: "Webhook ativo e funcionando!"
   - Isso "aquece" a URL

### 2. **Aguarde 1 minuto**

### 3. **Agora configure no RD Station**
   - Vá em Relacionar > Webhooks
   - Novo Webhook
   - Cole a URL
   - Tente verificar novamente

---

## ✅ SOLUÇÃO 3: Usar ferramenta externa para testar

### 1. **Teste a URL com o Webhook.site**
   - Acesse: https://webhook.site
   - Copie a URL única que ele gera
   - Vá em Apps Script > Executar > `testarWebhook()`
   - Veja se o webhook funciona

### 2. **Use o Postman ou Insomnia**
   - Faça um POST para a URL do Apps Script
   - Body (raw JSON):
   ```json
   {
     "leads": [{
       "id": "123456",
       "name": "Teste Manual",
       "email": "teste@email.com",
       "mobile_phone": "11999999999",
       "custom_fields": {
         "Instagram da empresa": "@teste",
         "Qual é o faturamento mensal do seu negócio?": "50 mil a 100 mil",
         "Tempo de existência": "2-3 anos"
       },
       "last_conversion": {
         "source": "google",
         "medium": "cpc",
         "campaign": "teste",
         "content": "teste"
       }
     }]
   }
   ```
   - Veja se insere na planilha

---

## ✅ SOLUÇÃO 4: Verificar se o Apps Script está público

### 1. **Reimplante garantindo acesso público**
   - Apps Script > Implantar > Gerenciar implantações
   - Clique no lápis ✏️
   - **IMPORTANTE**: Verifique se está:
     - ✅ Executar como: **Eu (seu email)**
     - ✅ Quem tem acesso: **Qualquer pessoa**
   - Clique em "Nova versão"
   - Implantar

### 2. **Copie a URL COMPLETA novamente**
   - A URL deve começar com: `https://script.google.com/macros/s/`
   - Terminar com: `/exec`
   - Exemplo: `https://script.google.com/macros/s/AKfycbxOREQUpVHF1jlPWStv...../exec`

---

## ✅ SOLUÇÃO 5: URL alternativa (desenvolvimento)

Se mesmo assim não funcionar, use o modo de desenvolvimento:

### 1. **Copie a URL de TESTE**
   - Apps Script > Implantar > Testar implantações
   - Copie a URL que termina com `/dev`

### 2. **Use essa URL no RD Station**
   - Configure o webhook com a URL `/dev`
   - Tente verificar

---

## 🎯 MINHA RECOMENDAÇÃO:

**Use a SOLUÇÃO 1**: Simplesmente **ignore o erro de validação** e salve o webhook mesmo assim.

### Por quê?
- ✅ O código está correto (testamos e funcionou)
- ✅ A documentação do RD Station diz que basta responder com status 2xx
- ✅ O erro 500 está no lado do RD Station, não no seu código
- ✅ Muitos usuários relatam que webhooks funcionam mesmo sem validar

### Como fazer:
1. Configure o webhook no RD Station
2. **Ignore o erro vermelho** de validação
3. Clique em **"Salvar Webhook"** mesmo assim
4. Faça uma conversão de teste real
5. Verifique se aparece na planilha

---

## 📊 Para verificar se está funcionando:

### Checklist:
- [ ] Webhook salvo no RD Station (mesmo com erro de validação)
- [ ] Conversão de teste realizada
- [ ] Aguardou 30-60 segundos
- [ ] Verificou a planilha (nova linha apareceu?)
- [ ] Verificou Apps Script > Execuções (há execuções recentes?)
- [ ] Verificou a aba "Log" da planilha (registrou o recebimento?)

---

## 🆘 Se NADA funcionar:

Entre em contato com o suporte do RD Station informando:
- URL do webhook: `https://script.google.com/macros/s/...`
- Erro recebido: "POST /api/1.3/webhooks/validate 500"
- Plataforma: Google Apps Script
- Requisito: O webhook responde corretamente com status 200

Ou tente:
- Usar uma plataforma alternativa (Make.com, Zapier, n8n)
- Criar um servidor intermediário (Node.js, Python)
- Usar Google Cloud Functions
