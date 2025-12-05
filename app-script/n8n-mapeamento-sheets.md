# 📊 Configuração do Google Sheets Node no n8n

## Nó: "Inserir na Planilha"

### Configurações Básicas

```
Node Type: Google Sheets
Operation: Append or Update
Document: [Selecione seu documento]
Sheet: CAV
Data Mode: Define Below for Each Column
```

### ⚠️ IMPORTANTE: Ordem e Mapeamento Exato

Cole cada expressão **EXATAMENTE** como está abaixo. No n8n, ao selecionar "Define Below for Each Column", você verá uma interface para mapear cada coluna.

---

## 🗂️ Mapeamento das Colunas

### Coluna A - Data conver.
```
{{ $json.dataConversao }}
```

### Coluna B - Hora conver.
```
{{ $json.horaConversao }}
```

### Coluna C - Id
```
{{ $json.id }}
```

### Coluna D - Nome
```
{{ $json.nome }}
```

### Coluna E - Email
```
{{ $json.email }}
```

### Coluna F - Telefone
```
{{ $json.telefone }}
```

### Coluna G - Instagram
```
{{ $json.instagram }}
```

### Coluna H - Tempo existência
```
{{ $json.tempoExistencia }}
```

### Coluna I - Faturamento
```
{{ $json.faturamento }}
```

### Coluna J - Domínio
```
{{ $json.dominio }}
```

### Coluna K - Página
```
{{ $json.pagina }}
```

### Coluna L - utm_source
```
{{ $json.utmSource }}
```

### Coluna M - utm_medium
```
{{ $json.utmMedium }}
```

### Coluna N - utm_campaign
```
{{ $json.utmCampaign }}
```

### Coluna O - utm_content
```
{{ $json.utmContent }}
```

### Coluna P - Link RD
```
{{ $json.linkRD }}
```

### Coluna Q - UTM Geral
```
{{ $json.utmGeral }}
```

### Coluna R - JSON
```
{{ $json.jsonCompleto }}
```

### Coluna S - NICHOS
```
{{ $json.nichos }}
```

### Coluna T - (extra 1)
```
{{ $json.extra1 }}
```

### Coluna U - (extra 2)
```
{{ $json.extra2 }}
```

### Coluna V - UF
```
{{ $json.uf }}
```

### Coluna W - Sub-origem
```
{{ $json.subOrigem }}
```

### Coluna X - (vazio)
```
{{ $json.x }}
```

---

## 🎯 Checklist de Configuração

- [ ] Todas as 24 colunas estão mapeadas (A até X)
- [ ] As expressões usam `{{ }}` e não apenas `$json.campo`
- [ ] A sheet selecionada é "CAV"
- [ ] O modo de dados é "Define Below for Each Column" (não "Auto-Map")
- [ ] Testou com um webhook do RD Station

---

## 🔧 Opções Adicionais Recomendadas

### No Google Sheets Node:

```
Options > Value Input Mode: USER_ENTERED
```
Isso permite que o Google Sheets interprete os dados corretamente (datas, números, etc.)

### No Workflow Settings:

```
Error Workflow: [Opcional - criar workflow de notificação de erro]
Timezone: America/Sao_Paulo
```

---

## 🐛 Troubleshooting

### ❌ Erro: "Column not found"
**Solução:** Certifique-se que a primeira linha da planilha tem EXATAMENTE estes cabeçalhos:
```
Data conver. | Hora conver. | Id | Nome | Email | Telefone | Instagram | Tempo existência | Faturamento | Domínio | Página | utm_source | utm_medium | utm_campaign | utm_content | Link RD | UTM Geral | JSON | NICHOS | [vazio] | [vazio] | UF | Sub-origem | X
```

### ❌ Erro: "Invalid expression"
**Solução:** Certifique-se de usar `{{ }}` ao redor de cada expressão.

### ❌ Dados aparecem em colunas erradas
**Solução:** Delete e recrie o mapeamento. Às vezes o n8n cacheia configurações antigas.

### ⚠️ Espaçamento diferente do App Script
**Isso é normal!** O Google Sheets renderiza linhas de forma diferente quando inseridas via API vs Apps Script. Os dados estão corretos.

---

## 📋 Template de Configuração Rápida

Se preferir, você pode usar este JSON no modo "Code" do Google Sheets Node:

```json
{
  "columns": [
    {
      "column": "Data conver.",
      "value": "={{ $json.dataConversao }}"
    },
    {
      "column": "Hora conver.",
      "value": "={{ $json.horaConversao }}"
    },
    {
      "column": "Id",
      "value": "={{ $json.id }}"
    },
    {
      "column": "Nome",
      "value": "={{ $json.nome }}"
    },
    {
      "column": "Email",
      "value": "={{ $json.email }}"
    },
    {
      "column": "Telefone",
      "value": "={{ $json.telefone }}"
    },
    {
      "column": "Instagram",
      "value": "={{ $json.instagram }}"
    },
    {
      "column": "Tempo existência",
      "value": "={{ $json.tempoExistencia }}"
    },
    {
      "column": "Faturamento",
      "value": "={{ $json.faturamento }}"
    },
    {
      "column": "Domínio",
      "value": "={{ $json.dominio }}"
    },
    {
      "column": "Página",
      "value": "={{ $json.pagina }}"
    },
    {
      "column": "utm_source",
      "value": "={{ $json.utmSource }}"
    },
    {
      "column": "utm_medium",
      "value": "={{ $json.utmMedium }}"
    },
    {
      "column": "utm_campaign",
      "value": "={{ $json.utmCampaign }}"
    },
    {
      "column": "utm_content",
      "value": "={{ $json.utmContent }}"
    },
    {
      "column": "Link RD",
      "value": "={{ $json.linkRD }}"
    },
    {
      "column": "UTM Geral",
      "value": "={{ $json.utmGeral }}"
    },
    {
      "column": "JSON",
      "value": "={{ $json.jsonCompleto }}"
    },
    {
      "column": "NICHOS",
      "value": "={{ $json.nichos }}"
    },
    {
      "column": "UF",
      "value": "={{ $json.uf }}"
    },
    {
      "column": "Sub-origem",
      "value": "={{ $json.subOrigem }}"
    },
    {
      "column": "X",
      "value": "={{ $json.x }}"
    }
  ]
}
```

---

**Última atualização:** 04/12/2025
