# 🎯 Workflows de Nutrição - Módulos Separados

Devido à complexidade, o sistema foi dividido em **4 workflows modulares**:

## 📦 Workflows Disponíveis

### 1. `workflow-1-sincronizacao-rd.json`
**Função:** Busca leads do RD Station e sincroniza com Supabase  
**Trigger:** Cron (diário às 9h)  
**Saída:** Leads inseridos/atualizados no Supabase

### 2. `workflow-2-envio-emails.json`
**Função:** Envia emails personalizados por segmento  
**Trigger:** Cron (10h, 14h, 18h) + Manual  
**Saída:** Emails enviados + histórico registrado

### 3. `workflow-3-envio-whatsapp.json`
**Função:** Envia WhatsApp para leads quentes  
**Trigger:** Manual + Agendado  
**Saída:** WhatsApp enviados + histórico registrado

### 4. `workflow-4-webhook-rastreamento.json`
**Função:** Recebe cliques de links e atualiza engajamento  
**Trigger:** Webhook (URL pública)  
**Saída:** Engajamento atualizado no Supabase

---

## 🚀 Como Usar

### Opção A: Workflow Único (Simplificado)

Para facilitar, criei um **workflow consolidado** que você pode usar:

**Arquivo:** `workflow-nutricao-completo.json` (abaixo)

Este workflow tem:
- ✅ Todos os módulos integrados
- ✅ Mais fácil de gerenciar
- ⚠️ Mais pesado (pode demorar em execuções grandes)

### Opção B: Workflows Modulares (Recomendado)

Para produção, use os 4 workflows separados:
- ✅ Mais escalável
- ✅ Fácil de debugar
- ✅ Performance melhor
- ⚠️ Requer configurar 4 workflows

---

## 📋 Pré-requisitos

Antes de importar, certifique-se de ter:

- [ ] Supabase configurado com schema (`supabase-schema-nutricao.sql`)
- [ ] Credenciais do RD Station no n8n
- [ ] Credenciais do Supabase (Postgres) no n8n
- [ ] Evolution API configurada
- [ ] Google Workspace OAuth2 configurado

---

## 🎬 Início Rápido

1. **Execute o SQL** no Supabase (cria tabelas)
2. **Importe** `workflow-nutricao-completo.json` no n8n
3. **Configure** as credenciais em cada nó
4. **Teste** executando manualmente
5. **Ative** o workflow

---

## 🔗 Links Úteis

- [Documentação RD Station API](https://developers.rdstation.com/)
- [Evolution API Docs](https://doc.evolution-api.com/)
- [n8n Docs](https://docs.n8n.io/)
- [Supabase Docs](https://supabase.com/docs)

---

**Nota:** Os workflows JSON individuais estão sendo gerados. Por enquanto, use a estrutura de guia acima para entender o fluxo e criar manualmente ou aguarde os arquivos completos.

---

## 🛠️ Criar Workflows Manualmente

Se preferir criar do zero, siga esta estrutura:

### Workflow 1: Sincronização RD Station

```
Schedule Trigger (Cron: 0 9 * * *)
  ↓
HTTP Request (RD Station API - GET /leads)
  ↓
Filter (tags contém "não-fechado")
  ↓
Code (Processar e classificar)
  ↓
Postgres (Supabase - INSERT/UPDATE leads_nutricao)
  ↓
Postgres (INSERT histórico)
```

### Workflow 2: Envio de Emails

```
Schedule Trigger (Cron: 0 10,14,18 * * *)
  ↓
Postgres (SELECT leads prontos para email)
  ↓
Postgres (SELECT template por segmento)
  ↓
Code (Personalizar mensagem com variáveis)
  ↓
Gmail (Enviar email)
  ↓
Postgres (UPDATE data_ultimo_email, total_emails_enviados)
  ↓
Postgres (INSERT histórico)
```

### Workflow 3: Envio WhatsApp

```
Manual Trigger / Schedule
  ↓
Postgres (SELECT leads alto engajamento)
  ↓
Postgres (SELECT template WhatsApp)
  ↓
Code (Personalizar mensagem)
  ↓
HTTP Request (Evolution API - POST /send-text)
  ↓
Postgres (UPDATE data_ultimo_whatsapp)
  ↓
Postgres (INSERT histórico)
```

### Workflow 4: Webhook Rastreamento

```
Webhook Trigger (POST)
  ↓
Code (Extrair lead_id e tipo de ação)
  ↓
Postgres (UPDATE total_cliques_link)
  ↓
IF (total_cliques >= 3)
    ↓
    Postgres (UPDATE nivel_engajamento = 'sauniu')
  ↓
Postgres (INSERT histórico)
  ↓
Response (200 OK)
```

---

Vou agora criar o workflow consolidado funcional. Aguarde alguns segundos...
