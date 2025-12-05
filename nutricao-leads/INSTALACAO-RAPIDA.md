# 🚀 Guia Rápido - Configurar Workflow n8n

## ⚡ Instalação em 5 Passos

### 1️⃣ Executar SQL no Supabase

```bash
# Acesse: https://app.supabase.com/project/SEU_PROJETO/editor

# Execute o arquivo:
supabase-schema-nutricao.sql
```

**✅ Sucesso:** Tabelas `leads_nutricao`, `nutricao_historico`, etc. criadas

---

### 2️⃣ Importar Workflow no n8n

1. Abra n8n: `http://localhost:5678` ou seu servidor
2. Clique em **"Import from File"**
3. Selecione: `workflow-nutricao-leads.json`
4. Clique **"Import"**

**✅ Sucesso:** Workflow com 24 nós importado

---

### 3️⃣ Configurar Credenciais

#### A) RD Station API

1. Vá em **Settings → Credentials**
2. Clique **"+ Create New"**
3. Selecione **"RD Station API"**
4. Preencha:
   - **Client ID:** `SEU_CLIENT_ID`
   - **Client Secret:** `SEU_CLIENT_SECRET`
   - **Redirect URL:** `https://seu-n8n.com/rest/oauth2-credential/callback`
5. Clique **"Connect my account"**
6. Autorize no RD Station

#### B) Supabase (Postgres)

1. Criar nova credencial **"Postgres"**
2. Preencher:
   - **Host:** `aws-0-us-east-1.pooler.supabase.com`
   - **Database:** `postgres`
   - **User:** `postgres.XXXXX`
   - **Password:** Sua senha do Supabase
   - **Port:** `6543`
   - **SSL:** `require`

#### C) Gmail OAuth2

1. Criar credencial **"Gmail OAuth2"**
2. Preencher:
   - **Client ID:** Do Google Cloud Console
   - **Client Secret:** Do Google Cloud Console
   - **Redirect URL:** `https://seu-n8n.com/rest/oauth2-credential/callback`
3. Conectar conta Gmail

#### D) Evolution API (Header Auth)

1. Criar credencial **"HTTP Header Auth"**
2. Preencher:
   - **Name:** `apikey`
   - **Value:** Sua API Key da Evolution

---

### 4️⃣ Configurar URLs e Instâncias

Edite os nós que têm URLs hardcoded:

#### Nó "Enviar WhatsApp Evolution"

Substitua:
```
https://sua-evolution-api.com/message/sendText/SUA_INSTANCIA
```

Por:
```
https://evolution.seudominio.com/message/sendText/NOME_DA_SUA_INSTANCIA
```

#### Nós "Personalizar Email" e "Personalizar WhatsApp"

Substitua:
```javascript
const trackingUrl = `https://seu-dominio.com/track?lead_id=${lead.id}&action=click`;
```

Por:
```javascript
const trackingUrl = `https://SEU_DOMINIO_N8N.com/webhook/track?lead_id=${lead.id}&action=click`;
```

---

### 5️⃣ Testar e Ativar

#### Testar Manualmente

1. Clique no nó **"Executar Diariamente 9h"**
2. Clique **"Execute Node"**
3. Verifique se os leads aparecem no Supabase

#### Ativar Automação

1. No topo do workflow, clique no **toggle "Inactive"**
2. Mude para **"Active"**
3. Workflow rodará automaticamente nos horários programados

---

## 🔧 Configurações Importantes

### Frequências dos Triggers

| Trigger | Horário | Função |
|---------|---------|--------|
| Executar Diariamente 9h | `0 9 * * *` | Sincroniza leads do RD Station |
| Enviar Emails 10h/14h/18h | `0 10,14,18 * * *` | Envia emails em 3 horários |
| Trigger Manual WhatsApp | Manual | Execute quando quiser enviar WhatsApp |
| Webhook Rastreamento | Sempre ativo | Recebe cliques de links |

### Limites de Segurança

Configurados nas queries SQL:

- **Emails:** Máximo 5 por lead, intervalo de 2 dias
- **WhatsApp:** Máximo 3 por lead, intervalo de 3 dias
- **Batch Size:** 50 emails e 20 WhatsApp por execução

---

## 📊 Inserir Templates

### Templates de Email

```sql
INSERT INTO nutricao_campanhas_email (nome, segmento, assunto, corpo_html, ativa) VALUES
('Reativação Dentistas', 'dentistas_50k_200k', 
 'Dr(a). {{nome}}, saudades! 🦷', 
 '<p>Olá Dr(a). {{nome}},</p><p>Notamos que você não finalizou seu pedido...</p><a href="{{link_cta}}">Ver condição especial</a>',
 true);
```

### Templates de WhatsApp

```sql
INSERT INTO nutricao_templates_whatsapp (nome, segmento, mensagem, ativo) VALUES
('WhatsApp Quente Dentistas', 'dentistas_acima_200k',
 'Olá {{nome}}! 👋\n\nVi que você está interessado em nossos produtos.\n\nTenho uma condição exclusiva pra você: {{link}}\n\nPosso tirar dúvidas?',
 true);
```

---

## 🎯 URL do Webhook de Rastreamento

Após ativar o workflow, copie a URL do webhook:

1. Abra o nó **"Webhook Rastreamento"**
2. Copie a **"Production URL"**
3. Exemplo: `https://seu-n8n.com/webhook/abc123/track`

Use essa URL nos templates de email/WhatsApp substituindo `{{link_cta}}` e `{{link}}`.

---

## 🐛 Troubleshooting

### Erro: "Could not connect to Supabase"

- ✅ Verifique host/porta/senha
- ✅ Certifique-se que SSL está `require`
- ✅ Use pooler URL (porta 6543) não direta (5432)

### Erro: "RD Station unauthorized"

- ✅ Refaça OAuth2 nas credenciais
- ✅ Verifique Client ID/Secret
- ✅ Certifique-se que redirect URL está correto

### WhatsApp não enviando

- ✅ Verifique se Evolution API está online
- ✅ Teste a API manualmente com Postman
- ✅ Verifique formato do número: `5511999999999@s.whatsapp.net`

### Emails indo para spam

- ✅ Configure SPF/DKIM do seu domínio
- ✅ Use remetente verificado no Gmail
- ✅ Evite palavras como "grátis", "promoção" em excesso

---

## 📈 Monitoramento

### Verificar Performance

```sql
-- Leads por nível de engajamento
SELECT nivel_engajamento, COUNT(*) 
FROM leads_nutricao 
GROUP BY nivel_engajamento;

-- Emails enviados hoje
SELECT COUNT(*) 
FROM nutricao_historico 
WHERE tipo_acao = 'email_enviado' 
  AND criado_em::date = CURRENT_DATE;

-- Taxa de cliques
SELECT 
  SUM(total_cliques_link) as total_cliques,
  COUNT(*) as total_leads,
  ROUND(SUM(total_cliques_link)::numeric / COUNT(*) * 100, 2) as taxa_cliques
FROM leads_nutricao;
```

---

## ✅ Checklist Final

- [ ] SQL executado no Supabase
- [ ] Workflow importado no n8n
- [ ] 4 credenciais configuradas (RD, Supabase, Gmail, Evolution)
- [ ] URLs substituídas (Evolution, tracking)
- [ ] Templates de email inseridos
- [ ] Templates de WhatsApp inseridos
- [ ] Testado manualmente (pelo menos sincronização RD)
- [ ] Workflow ativado
- [ ] URL do webhook copiada e inserida nos templates

---

🎉 **Pronto!** Seu sistema de nutrição está funcionando.

Monitore os primeiros dias e ajuste templates conforme necessário.
