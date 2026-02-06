# Workflow n8n: Envio Automático de Orçamentos Assinados via Brevo

## Visão Geral

Este workflow captura orçamentos assinados pelo cliente via webhook, formata os dados e envia emails automáticos via Brevo (Sendinblue) tanto para o cliente quanto para a equipe interna.

**Webhook já configurado no backend:**
- URL: `https://flow.agenciatouch.com.br/webhook/4d62d41b-5bd9-4014-9a4a-5f713be6bb31-PEDIDOS`
- Disparo: Configurado em [backend/src/services/webhook.ts](backend/src/services/webhook.ts)
- Trigger: Quando cliente assina orçamento via link público

---

## Estrutura do Payload Recebido

O backend envia o seguinte JSON quando um orçamento é assinado:

```json
{
  "event": "quote.signed",
  "timestamp": "2026-02-06T15:30:00.000Z",
  "data": {
    "quoteNumber": "QT-2026-0001",
    "customerName": "João Silva",
    "customerEmail": "joao@empresa.com.br",
    "customerPhone": "(11) 98765-4321",
    "products": [
      {
        "id": 123,
        "name": "Mangueira 1/2 polegada",
        "quantity": 100,
        "price": 15.50,
        "total": 1550.00
      }
    ],
    "totalPrice": 1550.00,
    "signedAt": "2026-02-06T15:29:45.000Z",
    "signatureData": {
      "ip": "191.123.45.67",
      "userAgent": "Mozilla/5.0...",
      "timestamp": "2026-02-06T15:29:45.000Z",
      "geolocation": {
        "city": "São Paulo",
        "country": "Brazil"
      }
    }
  },
  "pdfUrl": null
}
```

**Nota:** `pdfUrl` atualmente retorna `null`. PDF será gerado no futuro ou pode ser gerado pelo próprio n8n.

---

## Workflow: Configuração Passo a Passo

### **Node 1: Webhook Trigger**

**Tipo:** `Webhook` (Trigger)

**Configuração:**
- **Webhook Name:** `Orçamentos Assinados - Embraflex`
- **Authentication:** `None` (webhook já tem UUID único na URL)
- **HTTP Method:** `POST`
- **Path:** `/webhook/4d62d41b-5bd9-4014-9a4a-5f713be6bb31-PEDIDOS` (já configurado)
- **Response Mode:** `Respond Immediately`
- **Response Code:** `200`

**Test:** Clique em "Listen for Test Event" e assine um orçamento no sistema para validar.

---

### **Node 2: Validar Evento**

**Tipo:** `IF` (Decision)

**Configuração:**
- **Condition:** `{{ $json.event }} === 'quote.signed'`
- **True:** Continuar workflow
- **False:** Parar (ignorar eventos que não são assinatura)

**Motivo:** Garantir que apenas eventos `quote.signed` sejam processados (webhook pode receber outros tipos no futuro).

---

### **Node 3: Extrair e Formatar Dados**

**Tipo:** `Code` (JavaScript)

**Código:**

```javascript
// Extrair dados do payload
const data = $input.item.json.data;
const event = $input.item.json.event;

// Validações básicas
if (!data.customerEmail) {
  throw new Error('Email do cliente não encontrado no payload');
}

// Formatar produtos para o email (tabela HTML)
const productsHtml = data.products.map(p => `
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd;">${p.name}</td>
    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${p.quantity}</td>
    <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">R$ ${parseFloat(p.price).toFixed(2)}</td>
    <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">R$ ${parseFloat(p.total).toFixed(2)}</td>
  </tr>
`).join('');

// Formatar data de assinatura
const signedDate = new Date(data.signedAt);
const signedDateFormatted = signedDate.toLocaleDateString('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

// Retornar dados formatados
return {
  // Dados do cliente
  customerName: data.customerName,
  customerEmail: data.customerEmail,
  customerPhone: data.customerPhone || 'Não informado',
  
  // Dados do orçamento
  quoteNumber: data.quoteNumber,
  totalPrice: parseFloat(data.totalPrice).toFixed(2),
  signedDate: signedDateFormatted,
  
  // HTML formatado
  productsHtml: productsHtml,
  
  // Dados de assinatura
  signatureIp: data.signatureData?.ip || 'N/A',
  signatureCity: data.signatureData?.geolocation?.city || 'N/A',
  signatureCountry: data.signatureData?.geolocation?.country || 'N/A',
  
  // Original data (para debug)
  _original: data
};
```

**Saída esperada:** Objeto com dados formatados prontos para inserir no template de email.

---

### **Node 4: Enviar Email para Cliente**

**Tipo:** `Brevo` (Send Email)

**Pré-requisito:** Conectar sua conta Brevo em n8n:
1. No n8n, vá em **Credentials** > **New** > **Brevo API**
2. Cole sua **API Key** do Brevo (pegar em: Brevo Dashboard > Account > SMTP & API)
3. Salvar como "Brevo - Embraflex"

**Configuração:**

| Campo | Valor |
|-------|-------|
| **Credential** | Brevo - Embraflex |
| **From Email** | `vendas@embraflex.com.br` (ou email verificado no Brevo) |
| **From Name** | `Embraflex - Vendas` |
| **To Email** | `{{ $json.customerEmail }}` |
| **Subject** | `✅ Orçamento {{ $json.quoteNumber }} Confirmado - Embraflex` |
| **Email Type** | `HTML` |

**HTML Template:**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Orçamento Confirmado</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Orçamento Confirmado! ✅</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Olá <strong>{{ $json.customerName }}</strong>,</p>
    
    <p>Recebemos a confirmação da sua assinatura do orçamento <strong style="color: #667eea;">{{ $json.quoteNumber }}</strong>!</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
      <h2 style="margin-top: 0; color: #667eea;">Detalhes do Pedido</h2>
      <p><strong>Data de Confirmação:</strong> {{ $json.signedDate }}</p>
      <p><strong>Cliente:</strong> {{ $json.customerName }}</p>
      <p><strong>Telefone:</strong> {{ $json.customerPhone }}</p>
    </div>
    
    <h3 style="color: #667eea;">Produtos:</h3>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background: #667eea; color: white;">
          <th style="padding: 10px; text-align: left;">Produto</th>
          <th style="padding: 10px; text-align: center;">Qtd</th>
          <th style="padding: 10px; text-align: right;">Preço Unit.</th>
          <th style="padding: 10px; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        {{ $json.productsHtml }}
      </tbody>
      <tfoot>
        <tr style="background: #f0f0f0; font-weight: bold;">
          <td colspan="3" style="padding: 10px; text-align: right;">TOTAL:</td>
          <td style="padding: 10px; text-align: right; color: #667eea; font-size: 18px;">R$ {{ $json.totalPrice }}</td>
        </tr>
      </tfoot>
    </table>
    
    <div style="background: #e8f4f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0;"><strong>📋 Próximos Passos:</strong></p>
      <ol style="margin: 10px 0 0 20px; padding: 0;">
        <li>Nossa equipe irá processar seu pedido em até 24 horas úteis</li>
        <li>Você receberá uma confirmação de produção em breve</li>
        <li>Qualquer dúvida, entre em contato conosco</li>
      </ol>
    </div>
    
    <p style="text-align: center; margin-top: 30px;">
      <a href="https://embraflex.com.br" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Acessar Site Embraflex</a>
    </p>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #666; text-align: center;">
      Este é um email automático. Em caso de dúvidas, responda este email ou entre em contato pelo telefone (XX) XXXX-XXXX.
    </p>
    <p style="font-size: 12px; color: #666; text-align: center;">
      © 2026 Embraflex - Todos os direitos reservados
    </p>
  </div>
</body>
</html>
```

**Importante:** Substitua `vendas@embraflex.com.br` pelo email verificado no Brevo e ajuste telefone/link do site.

---

### **Node 5: Enviar Email para Equipe Interna**

**Tipo:** `Brevo` (Send Email)

**Configuração:**

| Campo | Valor |
|-------|-------|
| **Credential** | Brevo - Embraflex |
| **From Email** | `sistema@embraflex.com.br` (ou email verificado) |
| **From Name** | `Sistema Embraflex` |
| **To Email** | `vendas@embraflex.com.br` (email da equipe/admin) |
| **Subject** | `🔔 NOVO PEDIDO CONFIRMADO - {{ $json.quoteNumber }}` |
| **Email Type** | `HTML` |

**HTML Template:**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Novo Pedido</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #dc2626; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">🔔 NOVO PEDIDO CONFIRMADO</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 20px;">
      <p style="margin: 0; font-weight: bold;">⚠️ AÇÃO NECESSÁRIA: Processar pedido {{ $json.quoteNumber }}</p>
    </div>
    
    <h2 style="color: #dc2626;">Dados do Cliente</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px; background: #f0f0f0; font-weight: bold;">Nome:</td>
        <td style="padding: 8px;">{{ $json.customerName }}</td>
      </tr>
      <tr>
        <td style="padding: 8px; background: #f0f0f0; font-weight: bold;">Email:</td>
        <td style="padding: 8px;">{{ $json.customerEmail }}</td>
      </tr>
      <tr>
        <td style="padding: 8px; background: #f0f0f0; font-weight: bold;">Telefone:</td>
        <td style="padding: 8px;">{{ $json.customerPhone }}</td>
      </tr>
      <tr>
        <td style="padding: 8px; background: #f0f0f0; font-weight: bold;">Data Assinatura:</td>
        <td style="padding: 8px;">{{ $json.signedDate }}</td>
      </tr>
    </table>
    
    <h2 style="color: #dc2626; margin-top: 30px;">Produtos</h2>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background: #dc2626; color: white;">
          <th style="padding: 10px; text-align: left;">Produto</th>
          <th style="padding: 10px; text-align: center;">Qtd</th>
          <th style="padding: 10px; text-align: right;">Preço Unit.</th>
          <th style="padding: 10px; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        {{ $json.productsHtml }}
      </tbody>
      <tfoot>
        <tr style="background: #f0f0f0; font-weight: bold;">
          <td colspan="3" style="padding: 10px; text-align: right;">TOTAL:</td>
          <td style="padding: 10px; text-align: right; color: #dc2626; font-size: 18px;">R$ {{ $json.totalPrice }}</td>
        </tr>
      </tfoot>
    </table>
    
    <h2 style="color: #dc2626;">Dados da Assinatura Digital</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px; background: #f0f0f0; font-weight: bold;">IP:</td>
        <td style="padding: 8px;">{{ $json.signatureIp }}</td>
      </tr>
      <tr>
        <td style="padding: 8px; background: #f0f0f0; font-weight: bold;">Localização:</td>
        <td style="padding: 8px;">{{ $json.signatureCity }}, {{ $json.signatureCountry }}</td>
      </tr>
    </table>
    
    <div style="text-align: center; margin-top: 30px;">
      <a href="https://embraflex1.netlify.app/quotes" style="background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Ver no Sistema</a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #666; text-align: center;">
      Email automático gerado pelo sistema Embraflex - n8n
    </p>
  </div>
</body>
</html>
```

**Importante:** Ajuste o link "Ver no Sistema" para a URL real do dashboard de orçamentos.

---

### **Node 6: Log de Sucesso (Opcional)**

**Tipo:** `Code` (JavaScript)

**Código:**

```javascript
// Log de sucesso para debug
console.log(`✅ Emails enviados com sucesso para orçamento ${$json.quoteNumber}`);
console.log(`📧 Cliente: ${$json.customerEmail}`);
console.log(`💰 Valor: R$ ${$json.totalPrice}`);

return {
  success: true,
  quoteNumber: $json.quoteNumber,
  customerEmail: $json.customerEmail,
  sentAt: new Date().toISOString()
};
```

---

## Estrutura Visual do Workflow

```
[Webhook Trigger]
       ↓
  [Validar Evento: IF]
    ↓ (true)
  [Extrair e Formatar Dados: Code]
       ↓
  ┌────┴────┐
  ↓         ↓
[Email Cliente] [Email Equipe]
  ↓         ↓
  └────┬────┘
       ↓
  [Log Sucesso]
```

---

## Testes

### Teste 1: Webhook Funcionando
1. Ativar workflow no n8n
2. No sistema Embraflex, criar orçamento de teste
3. Gerar link de assinatura
4. Abrir em navegador anônimo e assinar
5. Verificar no n8n: execução deve aparecer com status "Success"

### Teste 2: Email Cliente
1. Verificar inbox do email do cliente de teste
2. Validar:
   - ✅ Email chegou
   - ✅ Dados corretos (nome, número orçamento, produtos)
   - ✅ Tabela de produtos formatada
   - ✅ Valor total correto

### Teste 3: Email Equipe
1. Verificar inbox `vendas@embraflex.com.br`
2. Validar:
   - ✅ Email chegou com prioridade
   - ✅ Dados de assinatura digital estão presentes
   - ✅ Link para sistema funciona

### Teste 4: Erros
1. Enviar payload inválido (sem email)
2. Workflow deve falhar gracefully
3. Verificar logs de erro no n8n

---

## Configuração do Brevo

### 1. Obter API Key
1. Acesse: https://app.brevo.com/
2. Login na conta Embraflex
3. Menu: **Account** > **SMTP & API** > **API Keys**
4. Criar nova key: `n8n-embraflex-automacao`
5. Copiar e salvar em local seguro

### 2. Verificar Domínio de Envio
1. Menu: **Senders & IP**
2. Verificar que domínio está validado (SPF, DKIM)
3. Adicionar emails: `vendas@embraflex.com.br`, `sistema@embraflex.com.br`

### 3. Templates (Opcional - Futuro)
Atualmente usando HTML inline. Futuramente pode migrar para templates do Brevo:
1. Menu: **Campaigns** > **Email Templates**
2. Criar template "Orçamento Confirmado Cliente"
3. Criar template "Novo Pedido Interno"
4. No n8n, trocar para "Template ID" em vez de HTML

---

## Troubleshooting

### Webhook não recebe dados
- ✅ Verificar URL no `.env.production` do backend
- ✅ Backend em produção (Render) está rodando?
- ✅ Webhook ativo no n8n (botão "Active")
- ✅ Logs do backend: `triggerQuoteSignedWebhook chamado`

### Email não enviado
- ✅ API Key Brevo válida?
- ✅ Email remetente verificado no Brevo?
- ✅ Conta Brevo tem créditos/plano ativo?
- ✅ Email destinatário válido?
- ✅ Verificar logs n8n: erro aparece?

### Formatação HTML quebrada
- ✅ Variáveis `{{ $json.xxx }}` corretas?
- ✅ Node "Extrair Dados" executou antes?
- ✅ Testar template em: https://www.campaignmonitor.com/testing/

### Performance lenta
- ✅ Workflow tem timeout configurado (30s+)
- ✅ Backend Render cold start? (primeira requisição demora)
- ✅ Considerar adicionar retry em caso de falha

---

## Melhorias Futuras

1. **Geração de PDF no n8n:**
   - Adicionar node `Puppeteer` ou `HTML to PDF`
   - Gerar PDF do orçamento inline
   - Anexar ao email do cliente

2. **Notificação WhatsApp:**
   - Integrar Twilio/Evolution API
   - Enviar mensagem ao cliente após assinatura

3. **Integração ERP:**
   - Criar pedido automaticamente no ERP
   - Atualizar estoque

4. **Dashboard Analytics:**
   - Enviar métricas para Google Sheets/Data Studio
   - Acompanhar taxa de conversão

5. **Templates Dinâmicos:**
   - Migrar para templates Brevo
   - Personalização por tipo de produto

---

## Suporte

Em caso de dúvidas sobre este workflow:
1. Verificar logs do n8n (execuções)
2. Verificar logs do backend Render
3. Consultar documentação Brevo: https://developers.brevo.com/
4. Documentação n8n: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.brevo/

---

**Workflow criado por:** GitHub Copilot  
**Data:** 06/02/2026  
**Versão:** 1.0
