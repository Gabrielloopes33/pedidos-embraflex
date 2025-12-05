# Configuração do n8n para RD Station → Google Sheets

## 📋 Visão Geral

Este guia configura o n8n para substituir o Google Apps Script, processando webhooks do RD Station e inserindo dados formatados no Google Sheets.

## 🔧 Estrutura do Workflow

### 1. **Webhook Node** (já configurado)
- Método: POST
- Recebe dados do RD Station

### 2. **Function Node - Processar Lead**
Esta é a parte principal que substitui o `processarLead()` do App Script.

```javascript
// ==========================================
// PROCESSAMENTO DE LEAD DO RD STATION
// ==========================================

const items = $input.all();
const processedItems = [];

for (const item of items) {
  try {
    const body = item.json.body;
    
    // Verifica se tem leads
    if (!body.leads || body.leads.length === 0) {
      continue;
    }
    
    const lead = body.leads[0];
    const lastConversion = lead.last_conversion || {};
    const conversionContent = lastConversion.content || {};
    const conversionOrigin = lastConversion.conversion_origin || {};
    const customFields = lead.custom_fields || {};
    
    // ==========================================
    // EXTRAÇÃO DE DATA E HORA
    // ==========================================
    const now = new Date();
    
    // Formata data como dd/MM/yyyy
    const dia = String(now.getDate()).padStart(2, '0');
    const mes = String(now.getMonth() + 1).padStart(2, '0');
    const ano = now.getFullYear();
    const dataConversao = `${dia}/${mes}/${ano}`;
    
    // Formata hora como HH:mm:ss
    const horas = String(now.getHours()).padStart(2, '0');
    const minutos = String(now.getMinutes()).padStart(2, '0');
    const segundos = String(now.getSeconds()).padStart(2, '0');
    const horaConversao = `${horas}:${minutos}:${segundos}`;
    
    // ==========================================
    // EXTRAÇÃO DE DADOS BÁSICOS
    // ==========================================
    const id = lead.id || '';
    const nome = lead.name || '';
    const email = lead.email || '';
    
    // Telefone - tenta múltiplas fontes
    let telefone = lead.personal_phone || 
                   lead.mobile_phone || 
                   lead.phone || 
                   customFields.telefone || 
                   customFields.celular || '';
    
    // Limpa formatação do telefone se necessário
    telefone = telefone.replace(/^\+/, ''); // Remove + inicial se houver
    
    // ==========================================
    // CAMPOS PERSONALIZADOS
    // ==========================================
    
    // Instagram
    const instagram = customFields['Instagram da empresa'] || 
                     customFields['instagram'] ||
                     customFields['Instagram'] ||
                     lead.instagram || 
                     conversionContent['Instagram da empresa'] || '';
    
    // Faturamento
    const faturamento = customFields['Qual o faturamento mensal do seu negócio?'] ||
                       customFields['Qual é o faturamento mensal do seu negócio?'] ||
                       customFields['faturamento'] ||
                       customFields['Faturamento'] ||
                       conversionContent['Qual o faturamento mensal do seu negócio?'] ||
                       conversionContent['Qual é o faturamento mensal do seu negócio?'] || '';
    
    // Tempo de existência
    const tempoExistencia = customFields['Tempo de existência'] ||
                           customFields['tempo_existencia'] ||
                           customFields['Tempo existência'] ||
                           customFields['tempo de existência'] ||
                           'Tempo não disponível';
    
    // ==========================================
    // PÁGINA E DOMÍNIO
    // ==========================================
    const paginaCompleta = conversionContent.conversion_url || 
                          lastConversion.url || '';
    
    // Extrai apenas o path da URL (após o domínio)
    let pagina = '';
    if (paginaCompleta) {
      try {
        const url = new URL(paginaCompleta);
        pagina = url.pathname.replace(/^\//, ''); // Remove / inicial
      } catch (e) {
        pagina = paginaCompleta;
      }
    }
    
    // Extrai domínio
    const dominio = conversionContent.conversion_domain || '';
    
    // ==========================================
    // PARÂMETROS UTM
    // ==========================================
    const utmSource = conversionOrigin.source || 'unknown';
    const utmMedium = conversionOrigin.medium || 'unknown';
    const utmCampaign = conversionOrigin.campaign || 'unknown';
    const utmContent = conversionOrigin.value || '';
    
    // ==========================================
    // LINK RD STATION
    // ==========================================
    const linkRD = lead.public_url || 
                  (id ? `http://app.rdstation.com.br/leads/public/${lead.uuid}` : '');
    
    // ==========================================
    // UTM GERAL (concatenação)
    // ==========================================
    const utmGeral = conversionContent.traffic_source || '';
    
    // ==========================================
    // JSON COMPLETO
    // ==========================================
    let jsonCompleto = JSON.stringify(body);
    if (jsonCompleto.length > 50000) {
      jsonCompleto = jsonCompleto.substring(0, 50000) + '... (truncado)';
    }
    
    // ==========================================
    // UF (Estado)
    // ==========================================
    const uf = lead.state || 
               customFields.estado || 
               customFields.uf || 
               '';
    
    // ==========================================
    // SUB-ORIGEM
    // ==========================================
    const subOrigem = lastConversion.source_detail || '';
    
    // ==========================================
    // MONTA ARRAY DE DADOS NA ORDEM EXATA
    // ==========================================
    const dadosLinha = {
      dataConversao,      // A - Data conver.
      horaConversao,      // B - Hora conver.
      id,                 // C - Id
      nome,               // D - Nome
      email,              // E - Email
      telefone,           // F - Telefone
      instagram,          // G - Instagram
      tempoExistencia,    // H - Tempo existência
      faturamento,        // I - Faturamento
      dominio,            // J - Domínio
      pagina,             // K - Página
      utmSource,          // L - utm_source
      utmMedium,          // M - utm_medium
      utmCampaign,        // N - utm_campaign
      utmContent,         // O - utm_content
      linkRD,             // P - Link RD
      utmGeral,           // Q - UTM Geral
      jsonCompleto,       // R - JSON
      nichos: '',         // S - NICHOS (vazio)
      extra1: '',         // T - Coluna extra 1
      extra2: '',         // U - Coluna extra 2
      uf,                 // V - UF
      subOrigem,          // W - Sub-origem
      x: ''               // X - (vazio)
    };
    
    processedItems.push({
      json: dadosLinha
    });
    
  } catch (error) {
    console.error('Erro ao processar lead:', error);
    // Continua processamento mesmo com erro
  }
}

return processedItems;
```

### 3. **Google Sheets Node - Verificar Duplicação**

**Configuração:**
- **Operation:** Get Many (Search)
- **Document:** [Seu documento]
- **Sheet:** CAV
- **Filters:**
  - Column: Email (coluna E)
  - Condition: Equals
  - Value: `={{ $json.email }}`
- **Return All:** True

### 4. **IF Node - Checa se Lead Existe**

**Configuração:**
- **Condition:** Number
- **Value 1:** `={{ $input.all().length }}`
- **Operation:** Equal
- **Value 2:** `0`

Se **TRUE** (não existe) → continua para inserção
Se **FALSE** (já existe) → para aqui

### 5. **Google Sheets Node - Append Row**

**Configuração:**
- **Operation:** Append or Update
- **Document:** [Seu documento]
- **Sheet:** CAV
- **Data Mode:** Define Below for Each Column
- **Mapping:**

```
Coluna A (Data conver.):     {{ $json.dataConversao }}
Coluna B (Hora conver.):     {{ $json.horaConversao }}
Coluna C (Id):               {{ $json.id }}
Coluna D (Nome):             {{ $json.nome }}
Coluna E (Email):            {{ $json.email }}
Coluna F (Telefone):         {{ $json.telefone }}
Coluna G (Instagram):        {{ $json.instagram }}
Coluna H (Tempo existência): {{ $json.tempoExistencia }}
Coluna I (Faturamento):      {{ $json.faturamento }}
Coluna J (Domínio):          {{ $json.dominio }}
Coluna K (Página):           {{ $json.pagina }}
Coluna L (utm_source):       {{ $json.utmSource }}
Coluna M (utm_medium):       {{ $json.utmMedium }}
Coluna N (utm_campaign):     {{ $json.utmCampaign }}
Coluna O (utm_content):      {{ $json.utmContent }}
Coluna P (Link RD):          {{ $json.linkRD }}
Coluna Q (UTM Geral):        {{ $json.utmGeral }}
Coluna R (JSON):             {{ $json.jsonCompleto }}
Coluna S (NICHOS):           {{ $json.nichos }}
Coluna T:                    {{ $json.extra1 }}
Coluna U:                    {{ $json.extra2 }}
Coluna V (UF):               {{ $json.uf }}
Coluna W (Sub-origem):       {{ $json.subOrigem }}
Coluna X:                    {{ $json.x }}
```

## 🎯 Diferenças vs App Script

### ✅ O que MELHOROU no n8n:

1. **Visual e Fácil de Debugar:** Você vê cada etapa visualmente
2. **Verificação de Duplicação ANTES de Inserir:** Mais eficiente
3. **Logs Automáticos:** Cada execução fica registrada
4. **Melhor Tratamento de Erros:** Não para o fluxo todo

### ⚠️ Pontos de Atenção:

1. **Espaçamento:** O n8n adiciona dados diretamente, sem linhas em branco
2. **Formatação de Data:** Garanta que está no formato `dd/MM/yyyy`
3. **Telefone:** O App Script tinha `55 (11) 99999-9999`, o webhook vem `+55 (11) 99999-9999`

## 🔍 Troubleshooting

### Problema: Campos com #ERRO!

**Causa:** Nome do campo personalizado mudou no RD Station

**Solução:** No Function Node, adicione mais variações:

```javascript
const instagram = customFields['Instagram da empresa'] || 
                 customFields['instagram'] ||
                 customFields['Instagram'] ||
                 customFields['instagram_empresa'] || // ← adicionar
                 lead.instagram || '';
```

### Problema: Data/Hora errada

**Causa:** Timezone

**Solução:** Ajuste o timezone no Function Node:

```javascript
const now = new Date();
// Ajusta para horário de Brasília (UTC-3)
const brTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
```

### Problema: Espaçamento diferente

**Causa:** Google Sheets adiciona espaçamento automático

**Solução:** Não é um problema real - os dados estão corretos, apenas a visualização é diferente

## 📊 Workflow Completo (JSON)

Para importar no n8n:

```json
{
  "name": "RD Station → Google Sheets",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "webhook/rd-station",
        "responseMode": "lastNode",
        "options": {}
      },
      "id": "webhook-node",
      "name": "Webhook RD Station",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "functionCode": "// Cole aqui o código do Function Node acima"
      },
      "id": "function-node",
      "name": "Processar Lead",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "operation": "getMany",
        "sheetName": "CAV",
        "filters": {
          "column": "Email",
          "condition": "equals",
          "value": "={{ $json.email }}"
        }
      },
      "id": "sheets-check",
      "name": "Verificar Email Duplicado",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 3,
      "position": [650, 300]
    },
    {
      "parameters": {
        "conditions": {
          "number": [
            {
              "value1": "={{ $input.all().length }}",
              "operation": "equal",
              "value2": 0
            }
          ]
        }
      },
      "id": "if-node",
      "name": "Lead Não Existe?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [850, 300]
    },
    {
      "parameters": {
        "operation": "appendOrUpdate",
        "sheetName": "CAV",
        "dataMode": "defineBelow",
        "columns": "// Veja mapeamento acima"
      },
      "id": "sheets-append",
      "name": "Inserir na Planilha",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 3,
      "position": [1050, 200]
    }
  ],
  "connections": {
    "Webhook RD Station": {
      "main": [[{ "node": "Processar Lead" }]]
    },
    "Processar Lead": {
      "main": [[{ "node": "Verificar Email Duplicado" }]]
    },
    "Verificar Email Duplicado": {
      "main": [[{ "node": "Lead Não Existe?" }]]
    },
    "Lead Não Existe?": {
      "main": [[{ "node": "Inserir na Planilha" }], []]
    }
  }
}
```

## 🚀 Próximos Passos

1. **Ativar o Workflow:** Certifique-se que está "Active"
2. **Testar:** Envie um webhook de teste do RD Station
3. **Verificar:** Confira se a linha foi adicionada corretamente
4. **Ajustar:** Se necessário, refine os mapeamentos de campos

## 📝 Notas Importantes

- O n8n sempre retorna HTTP 200 ao RD Station (mesmo com erro interno)
- Execuções ficam salvas por 168 horas (7 dias) por padrão
- Você pode adicionar notificações (email, Slack) em caso de erro
- O campo "Tempo existência" usa valor padrão "Tempo não disponível" quando não informado

---

**Criado em:** 04/12/2025
**Versão:** 1.0
**Compatível com:** n8n v1.0+, RD Station API v2
