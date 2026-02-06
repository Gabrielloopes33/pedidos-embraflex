# Checklist de Testes Pré-Produção - Sistema Embraflex

**Data de criação:** 06/02/2026  
**Versão:** 1.0  
**Objetivo:** Validar todas as funcionalidades críticas antes de liberar o sistema para usuários finais

---

## 🎯 Como Usar Este Checklist

1. **Execute os testes na ordem apresentada** (dependências entre módulos)
2. **Marque cada item** com ✅ (passou) ou ❌ (falhou)
3. **Documente falhas** na seção "Registro de Erros" ao final
4. **Não pule etapas** - cada teste valida funcionalidade crítica
5. **Teste em ambiente de produção** (ou staging idêntico)

---

## 📋 SEÇÃO A: Autenticação e Permissões

### A1. Login e Sessão

| # | Teste | Status | Observações |
|---|-------|--------|-------------|
| A1.1 | Login como **admin** com credenciais corretas | ⬜ | URL: `/login` |
| A1.2 | Login como **vendedor** com credenciais corretas | ⬜ | |
| A1.3 | Tentativa de login com senha incorreta (deve bloquear) | ⬜ | Espera: mensagem de erro |
| A1.4 | Tentativa de login com usuário inexistente (deve bloquear) | ⬜ | Espera: mensagem de erro |
| A1.5 | Token persiste após refresh da página | ⬜ | F5 na página inicial |
| A1.6 | Logout limpa token e redireciona para /login | ⬜ | |
| A1.7 | Token expirado redireciona automaticamente para login | ⬜ | Limpar localStorage manualmente e navegar |

**Pré-requisitos:**
- Backend rodando em produção
- Usuários existem no banco (admin + pelo menos 1 vendedor)

---

## 📋 SEÇÃO B: Gestão de Usuários (Admin Only)

### B1. Criar Usuário

| # | Teste | Status | Observações |
|---|-------|--------|-------------|
| B1.1 | Login como **admin** | ⬜ | |
| B1.2 | Navegar para `/user-management` | ⬜ | |
| B1.3 | Clicar em "Novo Usuário" | ⬜ | Abre modal |
| B1.4 | Preencher formulário: username `teste_vendedor`, senha `teste123`, role `vendedor`, nome `Vendedor Teste`, email `teste@embraflex.com` | ⬜ | |
| B1.5 | Clicar em "Criar Usuário" | ⬜ | **Espera: status 201, NÃO 500** |
| B1.6 | Verificar que usuário aparece na lista | ⬜ | Nome, role, status ativo |
| B1.7 | Tentar criar usuário com username duplicado (deve falhar) | ⬜ | Espera: erro "Username já existe" |
| B1.8 | Tentar criar usuário com email duplicado (deve falhar) | ⬜ | Espera: erro "Email já existe" |

### B2. Editar Usuário

| # | Teste | Status | Observações |
|---|-------|--------|-------------|
| B2.1 | Clicar em "Editar" no usuário `teste_vendedor` | ⬜ | |
| B2.2 | Alterar nome para `Vendedor Teste Editado` | ⬜ | |
| B2.3 | Alterar email para `teste-editado@embraflex.com` | ⬜ | |
| B2.4 | Salvar alterações | ⬜ | Espera: sucesso |
| B2.5 | Verificar que mudanças aparecem na lista | ⬜ | |
| B2.6 | Verificar log de auditoria (se UI disponível) | ⬜ | Deve registrar ação "updated" |

### B3. Desativar/Ativar Usuário

| # | Teste | Status | Observações |
|---|-------|--------|-------------|
| B3.1 | Desativar usuário `teste_vendedor` (toggle is_active) | ⬜ | |
| B3.2 | Verificar que status mudou para "Inativo" | ⬜ | |
| B3.3 | Tentar fazer login com usuário desativado (deve bloquear) | ⬜ | Espera: erro "Usuário inativo" |
| B3.4 | Reativar usuário | ⬜ | |
| B3.5 | Login agora deve funcionar | ⬜ | |

### B4. Alterar Senha de Usuário

| # | Teste | Status | Observações |
|---|-------|--------|-------------|
| B4.1 | Clicar em "Alterar Senha" no usuário `teste_vendedor` | ⬜ | |
| B4.2 | Definir nova senha: `nova_senha_123` | ⬜ | |
| B4.3 | Salvar | ⬜ | Espera: sucesso |
| B4.4 | Fazer logout e tentar login com senha antiga (deve falhar) | ⬜ | |
| B4.5 | Login com nova senha (deve funcionar) | ⬜ | |

### B5. Deletar Usuário

| # | Teste | Status | Observações |
|---|-------|--------|-------------|
| B5.1 | Clicar em "Deletar" no usuário `teste_vendedor` | ⬜ | |
| B5.2 | Confirmar deleção | ⬜ | |
| B5.3 | Verificar que usuário sumiu da lista | ⬜ | |
| B5.4 | Tentar deletar o próprio usuário admin (deve bloquear) | ⬜ | Espera: erro "Não pode deletar a si mesmo" |

### B6. Permissões (Vendedor NÃO pode gerenciar usuários)

| # | Teste | Status | Observações |
|---|-------|--------|-------------|
| B6.1 | Criar novo vendedor: `vendedor_permissao_teste` | ⬜ | |
| B6.2 | Fazer logout e login como vendedor | ⬜ | |
| B6.3 | Tentar acessar `/user-management` | ⬜ | **Espera: bloqueio ou redirect** |
| B6.4 | Tentar fazer POST direto via DevTools/Postman para `/api/users` | ⬜ | **Espera: 403 Forbidden** |

---

## 📋 SEÇÃO C: Orçamentos - Fluxo Completo (Assinatura + Email)

### C1. Criar Orçamento

| # | Teste | Status | Observações |
|---|-------|--------|-------------|
| C1.1 | Login como **vendedor** | ⬜ | |
| C1.2 | Navegar para "Novo Orçamento" (`/quotes/new`) | ⬜ | |
| C1.3 | Preencher dados do cliente: Nome, Email válido, Telefone | ⬜ | Email: usar email real que você acessa |
| C1.4 | Adicionar pelo menos 2 produtos | ⬜ | Buscar produtos do WooCommerce |
| C1.5 | Definir quantidades e verificar cálculo automático de preços | ⬜ | Preços variam por quantidade? |
| C1.6 | Salvar orçamento | ⬜ | Espera: sucesso + número QT-YYYY-NNNN |
| C1.7 | Voltar para lista de orçamentos e verificar que aparece | ⬜ | Status: "draft" ou "sent" |

### C2. Gerar Link de Assinatura

| # | Teste | Status | Observações |
|---|-------|--------|-------------|
| C2.1 | Abrir orçamento criado | ⬜ | |
| C2.2 | Clicar em "Gerar Link de Assinatura" | ⬜ | |
| C2.3 | Copiar link gerado | ⬜ | Formato: `/signature/:token` |
| C2.4 | Verificar que status mudou para "sent" | ⬜ | |
| C2.5 | Abrir link em **navegador anônimo** (simular cliente) | ⬜ | **IMPORTANTE: usar anônimo** |
| C2.6 | Verificar que página de assinatura carrega corretamente | ⬜ | Dados do orçamento visíveis |

### C3. Assinar Orçamento (Simulando Cliente)

| # | Teste | Status | Observações |
|---|-------|--------|-------------|
| C3.1 | Na página de assinatura, revisar produtos e valores | ⬜ | |
| C3.2 | Aceitar termos (se houver checkbox) | ⬜ | |
| C3.3 | Clicar em "Confirmar Assinatura" | ⬜ | |
| C3.4 | Verificar mensagem de sucesso | ⬜ | "Orçamento confirmado" |
| C3.5 | Fechar navegador anônimo | ⬜ | |

### C4. Verificar Webhook Disparou (n8n)

| # | Teste | Status | Observações |
|---|-------|--------|-------------|
| C4.1 | Abrir n8n: `flow.agenciatouch.com.br` | ⬜ | |
| C4.2 | Ir para workflow "Orçamentos Assinados - Embraflex" | ⬜ | |
| C4.3 | Verificar aba "Executions" (execuções) | ⬜ | |
| C4.4 | Última execução deve estar com status **Success** | ⬜ | Timestamp recente |
| C4.5 | Clicar na execução e verificar dados recebidos | ⬜ | event: "quote.signed", quoteNumber correto |
| C4.6 | Verificar que nodes de email executaram | ⬜ | "Email Cliente" e "Email Equipe" verdes |

### C5. Verificar Email Recebido (Cliente)

| # | Teste | Status | Observações |
|---|-------|--------|-------------|
| C5.1 | Abrir inbox do email usado no orçamento | ⬜ | |
| C5.2 | Verificar que email chegou | ⬜ | Assunto: "Orçamento QT-... Confirmado" |
| C5.3 | Abrir email e verificar formatação HTML | ⬜ | Sem quebras, imagens OK |
| C5.4 | Verificar dados corretos: nome, número orçamento, produtos | ⬜ | |
| C5.5 | Verificar tabela de produtos formatada corretamente | ⬜ | Colunas alinhadas, valores corretos |
| C5.6 | Verificar valor total correto | ⬜ | Conferir com orçamento original |
| C5.7 | Clicar em links (se houver) | ⬜ | Links funcionam? |

### C6. Verificar Email Recebido (Equipe Interna)

| # | Teste | Status | Observações |
|---|-------|--------|-------------|
| C6.1 | Abrir inbox de `vendas@embraflex.com.br` (ou email configurado) | ⬜ | |
| C6.2 | Verificar que email chegou | ⬜ | Assunto: "NOVO PEDIDO CONFIRMADO" |
| C6.3 | Verificar dados de assinatura digital presentes | ⬜ | IP, localização, timestamp |
| C6.4 | Clicar em "Ver no Sistema" | ⬜ | Redireciona para dashboard? |
| C6.5 | Verificar que orçamento no sistema está com status "approved" | ⬜ | |

### C7. Rejeitar Orçamento (Fluxo Alternativo)

| # | Teste | Status | Observações |
|---|-------|--------|-------------|
| C7.1 | Criar novo orçamento de teste | ⬜ | |
| C7.2 | Gerar link de assinatura | ⬜ | |
| C7.3 | Abrir em navegador anônimo | ⬜ | |
| C7.4 | Clicar em "Rejeitar" ou "Recusar" | ⬜ | |
| C7.5 | Informar motivo da rejeição | ⬜ | Ex: "Preço alto" |
| C7.6 | Confirmar rejeição | ⬜ | |
| C7.7 | Verificar no dashboard: status deve ser "rejected" | ⬜ | |
| C7.8 | Verificar se webhook também dispara (opcional) | ⬜ | event: "quote.rejected" |

---

## 📋 SEÇÃO D: Integração WooCommerce

### D1. Buscar e Listar Produtos

| # | Teste | Status | Observações |
|---|-------|--------|-------------|
| D1.1 | Login como vendedor | ⬜ | |
| D1.2 | Ir para "Novo Pedido" ou "Novo Orçamento" | ⬜ | |
| D1.3 | Buscar produto por nome (ex: "mangueira") | ⬜ | |
| D1.4 | Verificar que produtos aparecem | ⬜ | Dados: nome, preço, categoria |
| D1.5 | Verificar filtro por categoria "Interna" funciona | ⬜ | Apenas produtos internos listados |
| D1.6 | Adicionar produto ao pedido | ⬜ | |
| D1.7 | Alterar quantidade | ⬜ | Preço deve recalcular |

### D2. Preços por Quantidade

| # | Teste | Status | Observações |
|---|-------|--------|-------------|
| D2.1 | Selecionar produto com preços por quantidade configurado | ⬜ | Ver: PRECOS_POR_QUANTIDADE.md |
| D2.2 | Definir quantidade: 1 unidade | ⬜ | Anote o preço |
| D2.3 | Alterar para 50 unidades | ⬜ | Preço unitário deve DIMINUIR |
| D2.4 | Alterar para 500 unidades | ⬜ | Preço deve diminuir ainda mais |
| D2.5 | Verificar que total está correto (qtd × preço unitário) | ⬜ | |

### D3. Buscar e Listar Clientes

| # | Teste | Status | Observações |
|---|-------|--------|-------------|
| D3.1 | Navegar para "Clientes" (`/customers`) | ⬜ | |
| D3.2 | Verificar lista de clientes carrega | ⬜ | Dados do WooCommerce |
| D3.3 | Buscar cliente por nome | ⬜ | Busca funciona? |
| D3.4 | Buscar cliente por email | ⬜ | |
| D3.5 | Clicar em cliente para ver detalhes | ⬜ | Histórico de pedidos? |

### D4. Criar Novo Cliente

| # | Teste | Status | Observações |
|---|-------|--------|-------------|
| D4.1 | Clicar em "Novo Cliente" | ⬜ | |
| D4.2 | Preencher: Nome `Cliente WC Teste`, Email `wc_teste@test.com`, Telefone | ⬜ | |
| D4.3 | Salvar | ⬜ | |
| D4.4 | Verificar que cliente aparece na lista local | ⬜ | |
| D4.5 | (Opcional) Verificar no WooCommerce admin se sincronizou | ⬜ | Login em wp-admin > WooCommerce > Clientes |

### D5. Cache WooCommerce

| # | Teste | Status | Observações |
|---|-------|--------|-------------|
| D5.1 | Abrir DevTools > Network | ⬜ | |
| D5.2 | Carregar lista de produtos pela primeira vez | ⬜ | Anote tempo de resposta (ex: 2s) |
| D5.3 | Atualizar página (F5) | ⬜ | |
| D5.4 | Carregar lista novamente | ⬜ | Deve ser mais rápido (cache) |
| D5.5 | Verificar no Supabase: tabela `wc_products_cache` tem dados | ⬜ | SQL Editor: `SELECT * FROM wc_products_cache LIMIT 10` |

---

## 📋 SEÇÃO E: Performance e Carga

### E1. Tempos de Resposta

| # | Teste | Status | Tempo (seg) | Observações |
|---|-------|--------|-------------|-------------|
| E1.1 | Login | ⬜ | | Deve ser < 2s |
| E1.2 | Dashboard inicial | ⬜ | | Deve ser < 2s |
| E1.3 | Lista de orçamentos (sem filtros) | ⬜ | | Deve ser < 3s |
| E1.4 | Lista de produtos WooCommerce | ⬜ | | Primeira: < 5s, Cache: < 1s |
| E1.5 | Lista de clientes | ⬜ | | Deve ser < 3s |
| E1.6 | Criar novo orçamento (POST) | ⬜ | | Deve ser < 2s |
| E1.7 | Gerar link de assinatura | ⬜ | | Deve ser < 1s |

### E2. Carga Simultânea (Simular Múltiplos Vendedores)

| # | Teste | Status | Observações |
|---|-------|--------|-------------|
| E2.1 | Abrir 3 abas do navegador (ou 3 navegadores) | ⬜ | |
| E2.2 | Login com 3 vendedores diferentes (ou mesmo vendedor) | ⬜ | |
| E2.3 | Em cada aba, criar orçamento simultaneamente | ⬜ | Clicar "Salvar" ao mesmo tempo |
| E2.4 | Verificar que TODOS foram salvos com sucesso | ⬜ | Sem conflitos de ID |
| E2.5 | Verificar números de orçamento sequenciais e únicos | ⬜ | Ex: QT-2026-0001, 0002, 0003 |
| E2.6 | Backend não deve travar (verificar logs Render) | ⬜ | |

### E3. Navegação e Usabilidade

| # | Teste | Status | Observações |
|---|-------|--------|-------------|
| E3.1 | Testar em desktop (Chrome) | ⬜ | |
| E3.2 | Testar em desktop (Firefox) | ⬜ | |
| E3.3 | Testar em mobile (Chrome mobile ou emulador) | ⬜ | DevTools > Toggle device toolbar |
| E3.4 | Testar em tablet (iPad ou emulador) | ⬜ | |
| E3.5 | Sidebar responsivo funciona | ⬜ | Mobile: menu hamburguer |
| E3.6 | Tabelas são scrollable em mobile | ⬜ | |

---

## 📋 SEÇÃO F: Segurança e Edge Cases

### F1. Tentativas de Bypass de Autenticação

| # | Teste | Status | Observações |
|---|-------|--------|-------------|
| F1.1 | Tentar acessar `/dashboard` sem login (deve redirecionar) | ⬜ | |
| F1.2 | Tentar acessar `/user-management` sem ser admin (deve bloquear) | ⬜ | |
| F1.3 | Limpar token no localStorage e tentar fazer requisição (deve bloquear) | ⬜ | |
| F1.4 | Token JWT expirado deve redirecionar para login | ⬜ | Aguardar expiração ou manipular manualmente |

### F2. Validações de Formulário

| # | Teste | Status | Observações |
|---|-------|--------|-------------|
| F2.1 | Criar usuário sem preencher username (deve bloquear) | ⬜ | Mensagem de erro |
| F2.2 | Criar usuário com email inválido (deve bloquear) | ⬜ | Ex: "email@" |
| F2.3 | Criar orçamento sem cliente (deve bloquear) | ⬜ | |
| F2.4 | Criar orçamento sem produtos (deve bloquear) | ⬜ | |
| F2.5 | Criar orçamento com quantidade negativa (deve bloquear) | ⬜ | |

### F3. Links de Assinatura

| # | Teste | Status | Observações |
|---|-------|--------|-------------|
| F3.1 | Tentar acessar link de assinatura inexistente (deve dar erro 404) | ⬜ | URL: `/signature/token-invalido` |
| F3.2 | Assinar o mesmo orçamento duas vezes (segunda deve bloquear) | ⬜ | "Orçamento já assinado" |
| F3.3 | Link expirado deve mostrar mensagem apropriada | ⬜ | Expiração: 7 dias (padrão) |
| F3.4 | Rastreamento de views funciona | ⬜ | Verificar `quote_views` no Supabase |

---

## 📋 SEÇÃO G: Deploy e Ambiente

### G1. Build de Produção

| # | Teste | Status | Observações |
|---|-------|--------|-------------|
| G1.1 | Executar `npm run build` (frontend) | ⬜ | Sem erros? |
| G1.2 | Verificar pasta `dist/` gerada | ⬜ | Arquivos otimizados |
| G1.3 | Verificar `.env.production` tem variáveis corretas | ⬜ | URLs, API keys, webhooks |
| G1.4 | Build TypeScript (backend) sem erros | ⬜ | `npx tsc --noEmit` |

### G2. Deploy Frontend (Netlify)

| # | Teste | Status | Observações |
|---|-------|--------|-------------|
| G2.1 | Deploy manual ou via CI/CD | ⬜ | |
| G2.2 | Verificar logs de deploy (sucesso?) | ⬜ | |
| G2.3 | Acessar URL de produção (ex: embraflex1.netlify.app) | ⬜ | |
| G2.4 | Verificar que assets carregam (CSS, JS, imagens) | ⬜ | DevTools > Network |
| G2.5 | Console do navegador sem erros críticos | ⬜ | F12 > Console |

### G3. Deploy Backend (Render)

| # | Teste | Status | Observações |
|---|-------|--------|-------------|
| G3.1 | Verificar logs do Render | ⬜ | Logs > Ver últimas 100 linhas |
| G3.2 | Backend iniciou sem erros? | ⬜ | "Banco de dados conectado" |
| G3.3 | Health check funciona | ⬜ | Acessar: `https://backend-embraflex.onrender.com/health` |
| G3.4 | Variáveis de ambiente configuradas | ⬜ | Render Dashboard > Environment |
| G3.5 | Cold start (primeira requisição) funciona? | ⬜ | Pode demorar 30s+ |

### G4. CORS e Conectividade

| # | Teste | Status | Observações |
|---|-------|--------|-------------|
| G4.1 | Frontend produção consegue chamar backend produção | ⬜ | DevTools > Network > Ver requisições |
| G4.2 | Sem erros de CORS no console | ⬜ | |
| G4.3 | Webhook n8n consegue receber do backend | ⬜ | Testar assinar orçamento em prod |
| G4.4 | Backend consegue acessar Supabase | ⬜ | Verificar logs de conexão |
| G4.5 | Backend consegue acessar WooCommerce API | ⬜ | Listar produtos funciona? |

---

## 📋 SEÇÃO H: Testes Finais (Smoke Test em Produção)

### H1. Fluxo Completo End-to-End

**Objetivo:** Simular um dia típico de trabalho

| # | Teste | Status | Observações |
|---|-------|--------|-------------|
| H1.1 | **Admin:** Login | ⬜ | |
| H1.2 | **Admin:** Criar novo vendedor "João da Silva" | ⬜ | |
| H1.3 | **Admin:** Fazer logout | ⬜ | |
| H1.4 | **Vendedor João:** Login | ⬜ | |
| H1.5 | **Vendedor João:** Criar orçamento para cliente "Empresa ABC" | ⬜ | |
| H1.6 | **Vendedor João:** Adicionar 3 produtos diferentes com quantidades variadas | ⬜ | |
| H1.7 | **Vendedor João:** Salvar e gerar link de assinatura | ⬜ | |
| H1.8 | **Vendedor João:** Copiar link e enviar (simular envio) | ⬜ | |
| H1.9 | **Cliente (anônimo):** Abrir link em navegador privado | ⬜ | |
| H1.10 | **Cliente:** Revisar orçamento e assinar | ⬜ | |
| H1.11 | **Sistema:** Webhook dispara, emails enviados | ⬜ | Verificar n8n + inboxes |
| H1.12 | **Vendedor João:** Ver orçamento aprovado no dashboard | ⬜ | Status: "approved" |
| H1.13 | **Admin:** Ver estatísticas atualizadas | ⬜ | Dashboard de admin |

**Se TODOS os passos acima passaram ✅, sistema está pronto para produção!**

---

## 🐛 Registro de Erros Encontrados

Use esta seção para documentar TODOS os erros encontrados durante testes:

### Erro #1
- **Teste:** [ID do teste, ex: B1.5]
- **Descrição:** [O que aconteceu]
- **Esperado:** [O que deveria acontecer]
- **Como reproduzir:**
  1. [Passo 1]
  2. [Passo 2]
- **Logs/Screenshots:** [Cole aqui ou anexe]
- **Severidade:** 🔴 Crítico / 🟡 Médio / 🟢 Baixo
- **Status:** ⬜ Não resolvido / ✅ Resolvido

---

### Erro #2
- **Teste:**
- **Descrição:**
- **Esperado:**
- **Como reproduzir:**
- **Logs/Screenshots:**
- **Severidade:**
- **Status:**

---

*(Adicione mais conforme necessário)*

---

## 📊 Resumo Final

Preencher após completar TODOS os testes:

| Categoria | Total Testes | Passou ✅ | Falhou ❌ | % Sucesso |
|-----------|--------------|-----------|-----------|-----------|
| A. Autenticação | 7 | | | |
| B. Gestão Usuários | 30 | | | |
| C. Orçamentos | 33 | | | |
| D. WooCommerce | 18 | | | |
| E. Performance | 13 | | | |
| F. Segurança | 11 | | | |
| G. Deploy | 15 | | | |
| H. Smoke Test | 13 | | | |
| **TOTAL** | **140** | | | |

**Critério de Aprovação:** Mínimo **95% de sucesso** (≤ 7 falhas) E **nenhuma falha crítica (🔴)**

---

## ✅ Aprovação para Produção

- [ ] Todos os testes críticos (marcados 🔴) passaram
- [ ] Taxa de sucesso ≥ 95%
- [ ] Erros documentados e priorizados
- [ ] Deploy em produção validado
- [ ] Backups de banco de dados realizados
- [ ] Plano de rollback preparado
- [ ] Equipe treinada nas funcionalidades

**Assinatura Responsável:** ______________________  
**Data:** ___/___/2026  
**Aprovado para ir LIVE:** ⬜ SIM / ⬜ NÃO (justificar abaixo)

**Justificativa (se NÃO):**

---

## 📝 Notas Adicionais

- **Ambiente testado:** Produção / Staging / Local
- **Navegadores testados:** Chrome, Firefox, Safari, Mobile
- **Versão do sistema:** [Inserir versão ou commit hash]
- **Testers:** [Nomes das pessoas que executaram os testes]

---

**Documento criado por:** GitHub Copilot  
**Última atualização:** 06/02/2026
