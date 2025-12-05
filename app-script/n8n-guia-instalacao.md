# 🚀 Guia Rápido: Importar e Configurar o Workflow n8n

## 📥 Passo 1: Importar o Workflow

1. Abra o n8n
2. Clique no menu (☰) no canto superior esquerdo
3. Clique em **"Import from File"** ou **"Import from URL"**
4. Selecione o arquivo `n8n-workflow-completo.json`
5. Clique em **"Import"**

## ⚙️ Passo 2: Configurar Credenciais do Google Sheets

### 2.1 Conectar Google Sheets

1. Clique no nó **"Verificar Email Duplicado"**
2. Em **Credential to connect with**, clique em **"Select Credential"**
3. Escolha **"Create New Credential"**
4. Selecione **"Google Sheets OAuth2 API"**
5. Clique em **"Sign in with Google"**
6. Autorize o acesso à sua conta Google
7. Dê um nome à credencial (ex: "Google Sheets - Marketing")
8. Clique em **"Save"**

### 2.2 Aplicar a mesma credencial no outro nó

1. Clique no nó **"Inserir na Planilha"**
2. Selecione a mesma credencial que você acabou de criar
3. Clique em **"Save"**

## 📊 Passo 3: Configurar o Documento do Google Sheets

### 3.1 No nó "Verificar Email Duplicado"

1. Clique no nó **"Verificar Email Duplicado"**
2. Em **Document**, clique no dropdown
3. Aguarde carregar a lista de documentos
4. Selecione sua planilha (ex: "Marketing Codirect Dash Marketing 2025")
5. Em **Sheet**, selecione **"CAV"**
6. Clique em **"Save"**

### 3.2 No nó "Inserir na Planilha"

1. Clique no nó **"Inserir na Planilha"**
2. Repita o processo: selecione o mesmo documento e sheet "CAV"
3. ⚠️ **IMPORTANTE:** Verifique se TODAS as colunas estão mapeadas corretamente
4. Clique em **"Save"**

## 🔗 Passo 4: Configurar o Webhook no RD Station

### 4.1 Obter URL do Webhook

1. No n8n, clique no nó **"Webhook RD Station"**
2. Você verá a **Production URL** (algo como: `https://seu-n8n.com/webhook/...`)
3. **Copie esta URL**

### 4.2 Configurar no RD Station

1. Acesse [RD Station](https://app.rdstation.com.br)
2. Vá em **Configurações** → **Integrações** → **Webhooks**
3. Clique em **"Novo Webhook"**
4. Configure:
   - **URL:** Cole a URL do n8n
   - **Método:** POST
   - **Evento:** Conversão
   - **Identificador:** (deixe vazio para receber todas as conversões)
5. Clique em **"Salvar"**

## ✅ Passo 5: Ativar o Workflow

1. No n8n, no canto superior direito, certifique-se que o botão **"Active"** está ligado (verde)
2. Se não estiver, clique para ativar

## 🧪 Passo 6: Testar

### Opção A: Teste Manual no n8n

1. Clique em **"Execute Workflow"** no canto superior direito
2. Você verá uma mensagem "Waiting for webhook call..."
3. Em outra aba, acesse a URL do webhook no navegador
4. Você deve ver "OK" ou uma resposta vazia
5. Volte ao n8n e veja se o workflow executou

### Opção B: Teste com Webhook Real do RD Station

1. No RD Station, vá até o webhook que você configurou
2. Clique em **"Testar Webhook"**
3. Ou preencha um formulário real no seu site
4. No n8n, você verá a execução aparecer automaticamente

### Opção C: Teste com cURL (via PowerShell)

Execute no PowerShell:

```powershell
$body = @{
  leads = @(
    @{
      id = "TEST123"
      name = "João Teste"
      email = "joao.teste@email.com"
      personal_phone = "55 (11) 99999-9999"
      custom_fields = @{
        "Instagram da empresa" = "@empresateste"
        "Qual o faturamento mensal do seu negócio?" = "30 mil a 50 mil"
      }
      last_conversion = @{
        content = @{
          conversion_url = "https://site.codirect.com.br/sessao-estrategica-evandro"
          conversion_domain = "site.codirect.com.br"
          traffic_source = "test_source"
        }
        conversion_origin = @{
          source = "IgEvandro"
          medium = "cpc_test"
          campaign = "ads_test"
          value = "test_content"
        }
      }
      public_url = "http://app.rdstation.com.br/leads/public/test-uuid"
    }
  )
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "SUA_URL_DO_WEBHOOK_AQUI" -Method Post -Body $body -ContentType "application/json"
```

## 🔍 Passo 7: Verificar Resultado

1. Abra sua planilha do Google Sheets
2. Vá para a aba **"CAV"**
3. Verifique se uma nova linha foi adicionada com os dados do teste
4. Confira se todos os campos estão preenchidos corretamente

## ⚠️ Troubleshooting

### ❌ Erro: "Node has no credentials"

**Solução:**
1. Clique no nó com erro
2. Configure as credenciais do Google Sheets
3. Salve

### ❌ Erro: "Document not found"

**Solução:**
1. Verifique se você tem permissão para acessar o documento
2. Tente desconectar e reconectar as credenciais do Google
3. Certifique-se que selecionou o documento correto

### ❌ Erro: "Column not found"

**Solução:**
1. Abra a planilha do Google Sheets
2. Verifique se a primeira linha tem EXATAMENTE estes cabeçalhos:
   ```
   Data conver. | Hora conver. | Id | Nome | Email | Telefone | Instagram | Tempo existência | Faturamento | Domínio | Página | utm_source | utm_medium | utm_campaign | utm_content | Link RD | UTM Geral | JSON | NICHOS | | | UF | Sub-origem | X
   ```
3. Se estiver faltando algum, adicione
4. Salve a planilha e teste novamente

### ⚠️ Workflow não executa automaticamente

**Solução:**
1. Certifique-se que o workflow está **ATIVO** (botão verde no canto superior direito)
2. Verifique se a URL do webhook no RD Station está correta
3. Teste enviando um POST manual (veja Opção C acima)

### ⚠️ Leads duplicados estão sendo inseridos

**Solução:**
1. Verifique se o nó "Verificar Email Duplicado" está conectado corretamente
2. Certifique-se que o filtro está usando a coluna "Email" (coluna E)
3. Teste executando o workflow manualmente com um email que já existe

## 📊 Monitoramento

### Ver execuções do workflow

1. No n8n, clique em **"Executions"** (menu lateral esquerdo)
2. Você verá todas as execuções, sucesso e erro
3. Clique em qualquer execução para ver detalhes

### Ver logs

1. Cada nó pode ter logs no console
2. Para ver, execute o workflow manualmente
3. Clique em cada nó e veja o output

## 🎯 Checklist Final

Antes de considerar tudo pronto:

- [ ] Workflow importado com sucesso
- [ ] Credenciais do Google Sheets configuradas
- [ ] Documento e sheet "CAV" selecionados em ambos os nós
- [ ] URL do webhook copiada
- [ ] Webhook configurado no RD Station
- [ ] Workflow ativado (botão verde)
- [ ] Teste realizado com sucesso
- [ ] Nova linha apareceu na planilha
- [ ] Todos os campos estão corretos
- [ ] Teste de duplicação funcionou (lead não foi inserido 2x)

## 📞 Próximos Passos

Após tudo funcionando:

1. **Desative o webhook do Google Apps Script** para evitar duplicação
2. **Monitore por 24-48h** para garantir estabilidade
3. **Configure alertas** (opcional): adicione um nó de email/Slack para notificações
4. **Documente qualquer personalização** que você fizer

---

**Tempo estimado de configuração:** 15-20 minutos

**Dificuldade:** ⭐⭐☆☆☆ (Média)

**Criado em:** 04/12/2025
