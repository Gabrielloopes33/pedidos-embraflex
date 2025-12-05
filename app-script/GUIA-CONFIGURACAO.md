# Guia de Configuração - Webhook RD Station → Google Sheets

## 📋 Passo a Passo

### 1. Configurar o App Script

1. Acesse sua planilha do Google Sheets
2. Vá em **Extensões > Apps Script**
3. Cole o código do arquivo `webhook-rd-station.gs`
4. **IMPORTANTE**: Ajuste o nome da aba na linha 41:
   ```javascript
   var sheet = ss.getSheetByName('CAV'); // Altere 'CAV' para o nome da sua aba
   ```

### 2. Publicar como Web App

1. No Apps Script, clique em **Implantar > Nova implantação**
2. Clique no ícone de engrenagem ⚙️ e selecione **Aplicativo da Web**
3. Configure:
   - **Descrição**: Webhook RD Station
   - **Executar como**: Eu (seu email)
   - **Quem tem acesso**: Qualquer pessoa
4. Clique em **Implantar**
5. **COPIE A URL** que será gerada (algo como: `https://script.google.com/macros/s/AKf...`)
6. Clique em **Autorizar acesso** e permita as autorizações necessárias

### 3. Configurar Webhook no RD Station

1. Acesse o RD Station Marketing
2. Vá em **Relacionar > Webhooks**
3. Clique em **Novo Webhook**
4. Preencha:
   - **Nome**: PLANILHA CAV (ou outro nome de sua preferência)
   - **URL**: Cole a URL gerada no passo anterior
   - **Gatilho**: Conversão
   - **Eventos de Conversão**: Deixe em branco para receber TODAS as conversões

5. Clique em **Salvar Webhook**

### 4. Testar a Integração

#### Opção 1: Teste Direto no Apps Script
1. No Apps Script, execute a função `testarWebhook()`
2. Verifique se uma linha de teste foi inserida na planilha

#### Opção 2: Teste Real no RD Station
1. Faça uma conversão de teste no RD Station
2. Aguarde alguns segundos
3. Verifique se os dados aparecem na planilha

### 5. Verificar Logs (Opcional)

O código cria automaticamente uma aba "Log" para registrar os recebimentos do webhook.
Você pode verificar essa aba para monitorar se os webhooks estão chegando.

## 📊 Estrutura da Planilha

Certifique-se de que sua planilha tenha as seguintes colunas (na ordem):

| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S | T | U | V | W | X |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Data conver. | Hora conver. | Id | Nome | Email | Telefone | Instagram | Tempo existência | Faturamento | Domínio | Página | utm_source | utm_medium | utm_campaign | utm_content | Link RD | UTM Geral | JSON | NICHOS | (vazio) | (vazio) | UF | Sub-origem | X |

## 🔍 Mapeamento de Dados RD Station → Planilha

| Campo na Planilha | Origem no RD Station |
|------------------|---------------------|
| Data conver. | Data/hora do recebimento |
| Hora conver. | Hora do recebimento |
| Id | `lead.id` |
| Nome | `lead.name` |
| Email | `lead.email` |
| Telefone | `lead.mobile_phone` ou `lead.personal_phone` ou `lead.phone` |
| Instagram | Campo personalizado "Instagram da empresa" |
| Tempo existência | Campo personalizado "Tempo de existência" |
| Faturamento | Campo personalizado "Qual é o faturamento mensal do seu negócio?" |
| Domínio | Extraído da URL de conversão |
| Página | `last_conversion.conversion_origin.url` |
| utm_source | `last_conversion.source` |
| utm_medium | `last_conversion.medium` |
| utm_campaign | `last_conversion.campaign` |
| utm_content | `last_conversion.content` |
| Link RD | URL do lead no RD Station |
| UTM Geral | Concatenação dos UTMs |
| JSON | JSON completo da conversão |
| UF | `lead.state` ou campos personalizados |
| Sub-origem | `last_conversion.source_detail` |

## 🚫 Prevenção de Duplicados

O código verifica se o email já existe na planilha antes de inserir.
Se o lead já existir, ele será ignorado e registrado no log.

## ⚠️ Ajustes Necessários

### Se seus campos personalizados do RD Station tiverem nomes diferentes:

Edite as linhas 64-68 do código:

```javascript
var tempoExistencia = campos['SEU_NOME_DO_CAMPO_AQUI'] || '';
var faturamento = campos['SEU_NOME_DO_CAMPO_AQUI'] || '';
var instagram = campos['SEU_NOME_DO_CAMPO_AQUI'] || '';
```

### Se sua planilha tiver uma estrutura diferente:

Ajuste a ordem dos campos no array `novaLinha` (linhas 91-115).

## 🆘 Solução de Problemas

### Webhook não está recebendo dados
1. Verifique se a URL está correta no RD Station
2. Certifique-se de que o aplicativo foi implantado com acesso "Qualquer pessoa"
3. Verifique os logs de execução no Apps Script (Execuções)

### Dados não aparecem na planilha
1. Verifique o nome da aba (deve ser exatamente igual ao código)
2. Verifique se há erros no log de execução
3. Execute a função `testarWebhook()` para debug

### Leads duplicados
1. O código já tem proteção contra duplicados por email
2. Se quiser mudar o critério, edite a função `leadJaExiste()`

## 📞 Suporte

Em caso de dúvidas, verifique:
- Log de execução do Apps Script
- Aba "Log" da planilha
- Console do navegador (F12) ao fazer conversões de teste
