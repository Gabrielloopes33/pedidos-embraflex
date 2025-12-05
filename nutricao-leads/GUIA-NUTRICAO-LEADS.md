# 🎯 Sistema de Nutrição de Leads Perdidos

## 📋 Visão Geral

Sistema completo de nutrição automatizada para reativar leads que não fecharam, usando n8n, Supabase, RD Station, Evolution API (WhatsApp) e Google Workspace (Email).

---

## 🏗️ Arquitetura do Sistema

```
RD Station (Fonte de Leads)
    ↓
Supabase (Banco Central + Lógica)
    ↓
n8n (Automação + Orquestração)
    ↓
├─→ Evolution API (WhatsApp)
├─→ Google Workspace (Email)
└─→ Google Sheets (Dashboard)
```

---

## 📊 Fases do Sistema

### **Fase 1: Centralização e Segmentação**
- Importa leads "não fechados" do RD Station
- Armazena no Supabase para controle
- Segmenta automaticamente por:
  - **Nicho** (dentista, arquiteto, clínica estética, etc.)
  - **Faturamento** (30-50k, 50-100k, 100-250k, 250k+)
  - **Engajamento** (prego, taquinho, sauniu, últimos 30d, últimos 90d)
  - **Tempo desde último contato** (0-30d, 30-90d, 90d+)

### **Fase 2: Campanha de Reativação**
- **Email personalizado** por segmento
- **WhatsApp direto** para leads mais quentes
- Mensagens contextualizadas por nicho

### **Fase 3: Lembretes**
- **D-1 (24h antes)**: Email + WhatsApp sobre a live
- **H-1 (1h antes)**: WhatsApp de lembrete direto
- **AO VIVO**: Notificação quando live começar

### **Fase 4: Follow-up Pós-Live**
- **Compareceu**: Mensagem de agradecimento + próximos passos
- **Não compareceu**: Mensagem incentivando agendamento de sessão estratégica
- Rastreamento por webhook (cliques em links)

---

## 🚀 Passo a Passo de Implementação

### **1. Configurar Supabase**

1. Acesse seu projeto Supabase
2. Vá em **SQL Editor**
3. Cole o conteúdo de `supabase-schema-nutricao.sql`
4. Execute o script
5. Verifique se as 5 tabelas foram criadas:
   - `leads_nutricao`
   - `nutricao_historico`
   - `nutricao_campanhas_email`
   - `nutricao_templates_whatsapp`
   - `nutricao_agendamentos`

### **2. Configurar Credenciais no n8n**

#### A) RD Station API
1. No n8n: **Settings** → **Credentials** → **Add Credential**
2. Tipo: **HTTP Request** (ou RD Station se tiver)
3. Configuração:
   - **Authentication:** Bearer Token
   - **Token:** Seu token do RD Station
   - Nome: `RD Station API`

#### B) Supabase
1. **Add Credential** → **Postgres**
2. Configuração:
   - **Host:** Seu host Supabase (ex: `db.xxx.supabase.co`)
   - **Database:** `postgres`
   - **User:** `postgres`
   - **Password:** Sua senha do Supabase
   - **Port:** `5432`
   - **SSL:** Enabled
   - Nome: `Supabase Nutrição`

#### C) Evolution API (WhatsApp)
1. **Add Credential** → **HTTP Request**
2. Configuração:
   - **Authentication:** API Key
   - **API Key:** Sua chave da Evolution
   - **Header Name:** `apikey`
   - Nome: `Evolution WhatsApp`

#### D) Google Workspace (Email)
1. **Add Credential** → **Gmail OAuth2**
2. Siga o fluxo de autenticação
3. Nome: `Google Workspace Email`

### **3. Importar Workflow no n8n**

1. No n8n, vá em **Workflows**
2. Clique em **Import from File**
3. Selecione `workflow-nutricao-leads.json`
4. Ative o workflow

### **4. Configurar Templates**

#### Templates de Email

Acesse o Supabase e insira templates na tabela `nutricao_campanhas_email`:

```sql
INSERT INTO nutricao_campanhas_email (nome, assunto, template_html, segmento_nicho, tipo) VALUES
('Reativação Dentista', 
 'Olá [Nome], transforme sua clínica de odontologia! 🦷',
 '<html>...</html>',
 'dentista',
 'reativacao');
```

Variáveis disponíveis:
- `[Nome]` - Nome do lead
- `[Nicho]` - Nicho do lead
- `[Link]` - Link da live/ação
- `[Tema]` - Tema da live

#### Templates de WhatsApp

```sql
INSERT INTO nutricao_templates_whatsapp (nome, mensagem, segmento_nicho, tipo) VALUES
('Lembrete 1h Dentista',
 'Olá [Nome]! 👋\n\nEm 60 minutos começa nossa live sobre como dentistas estão dobrando seu faturamento. Pegue seu café! ☕\n\nLink: [Link]',
 'dentista',
 'lembrete');
```

---

## 🎨 Personalização por Segmento

### Exemplo: Dentistas

**Email de Reativação:**
- Assunto: "Dr(a). [Nome], veja como dentistas estão faturando R$ 85 mil/mês"
- Conteúdo: Cases de dentistas, dores específicas (agenda lotada, dificuldade de fechar tratamentos grandes)

**WhatsApp:**
- Mais direto: "Olá Dr(a). [Nome]! Evandro aqui. Vi que você se interessou por marketing para dentistas..."

### Exemplo: Arquitetos

**Email:**
- Assunto: "[Nome], arquitetos estão saindo de R$ 18k para R$ 85k/mês"
- Conteúdo: Cases de arquitetos, portfolio, Instagram

**WhatsApp:**
- Tom mais criativo: "Olá [Nome]! Você projeta ambientes incríveis, que tal projetar também o crescimento do seu escritório?"

---

## 📈 Métricas e Dashboards

### KPIs Principais

1. **Taxa de Reativação**: % de leads que voltaram a engajar
2. **Taxa de Abertura de Email**: Média geral e por segmento
3. **Taxa de Clique**: % que clicou no CTA
4. **Taxa de Comparecimento na Live**: % que realmente assistiu
5. **Taxa de Conversão Pós-Live**: % que agendou sessão estratégica

### Consultas Úteis

#### Ver leads ativos por segmento:
```sql
SELECT * FROM v_leads_por_segmento;
```

#### Performance de campanhas:
```sql
SELECT * FROM v_performance_campanhas;
```

#### Leads que abriram email mas não clicaram:
```sql
SELECT nome, email, nicho, total_emails_abertos, total_cliques_link
FROM leads_nutricao
WHERE total_emails_abertos > 0 AND total_cliques_link = 0
AND status = 'ativo';
```

#### Leads prontos para WhatsApp (alto engajamento):
```sql
SELECT nome, telefone, nicho, nivel_engajamento
FROM leads_nutricao
WHERE nivel_engajamento IN ('sauniu', 'ultimos_30d')
AND telefone IS NOT NULL
AND data_ultimo_whatsapp < NOW() - INTERVAL '7 days'
OR data_ultimo_whatsapp IS NULL;
```

---

## 🔄 Fluxo de Automação

### 1. Sincronização Diária (Cron: 9h)
```
RD Station API (buscar leads não fechados)
  ↓
Filtrar por tags (não-fechado, perdido)
  ↓
Inserir/Atualizar no Supabase
  ↓
Classificar segmento automático
```

### 2. Envio de Emails (Cron: 10h, 14h, 18h)
```
Buscar leads no Supabase (status = ativo, sem email nas últimas 48h)
  ↓
Selecionar template por nicho + faturamento
  ↓
Enviar via Google Workspace
  ↓
Registrar em historico
```

### 3. Envio de WhatsApp (Manual + Agendado)
```
Leads com alto engajamento
  ↓
Template personalizado
  ↓
Evolution API
  ↓
Registrar em histórico
```

### 4. Webhook de Rastreamento
```
Link clicado no email/WhatsApp
  ↓
Webhook do RD Station
  ↓
Atualizar total_cliques_link
  ↓
Se >= 3 cliques → mudar nivel_engajamento para 'sauniu'
```

---

## 🛡️ Regras de Negócio

### Frequência de Contato
- **Email:** Máximo 1 a cada 48h por lead
- **WhatsApp:** Máximo 1 a cada 7 dias por lead
- **Live:** Convite enviado 7 dias antes, lembrete 24h antes e 1h antes

### Escalonamento
1. **Dia 0:** Email de reativação
2. **Dia 3:** Se abriu email → WhatsApp
3. **Dia 7:** Se não respondeu → Convidar para live
4. **Dia 14:** Último contato (email com oferta especial)
5. **Dia 21:** Marcar como "pausado" se sem engajamento

### Conversão
- Lead clicou em "Agendar Sessão" → Mudar status para "convertido"
- Lead respondeu WhatsApp → Avisar time de vendas
- Lead compareceu live → Enviar WhatsApp dentro de 2h

---

## 🧪 Testes

### Teste 1: Importação do RD Station
1. Execute o workflow manualmente
2. Verifique se leads foram inseridos no Supabase
3. Confira se segmentação foi aplicada corretamente

### Teste 2: Envio de Email
1. Adicione seu próprio email como lead de teste
2. Aguarde o horário agendado ou execute manualmente
3. Verifique se recebeu o email com personalização correta

### Teste 3: WhatsApp
1. Adicione seu número como lead de teste
2. Execute envio de WhatsApp
3. Verifique mensagem recebida

### Teste 4: Webhook de Clique
1. Clique no link do email de teste
2. Verifique se `total_cliques_link` aumentou no Supabase

---

## 🔧 Troubleshooting

### Leads não aparecem no Supabase
- Verifique credenciais do RD Station
- Confira se há leads com tag "não-fechado" no RD
- Veja logs do n8n em Executions

### Emails não estão sendo enviados
- Verifique quota do Google Workspace (500/dia por conta)
- Confira se templates têm todas as variáveis necessárias
- Teste autenticação OAuth2

### WhatsApp não envia
- Verifique se Evolution API está online
- Confira formato do número (55XXXXXXXXXXX)
- Teste endpoint da API manualmente

### Webhook não registra cliques
- Verifique se URL do webhook está correta no RD Station
- Confira se workflow está ativo
- Teste envio manual de POST para o webhook

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs no n8n (Executions)
2. Consulte a documentação do Supabase
3. Revise este guia

---

## 🎉 Próximos Passos

Após implementação básica:

1. **Criar mais segmentos**: Adicionar critérios como região, tamanho da empresa
2. **A/B Testing**: Testar diferentes assuntos e CTAs
3. **Pontuação de Lead**: Sistema de score para priorizar leads
4. **Integração com CRM**: Sincronizar com Pipedrive/HubSpot
5. **Dashboard Analytics**: Criar dashboard visual no Google Data Studio

---

**Criado em:** 04/12/2025  
**Versão:** 1.0  
**Status:** ✅ Pronto para produção
