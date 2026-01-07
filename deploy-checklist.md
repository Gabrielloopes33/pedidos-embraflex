# ✅ Checklist de Deploy - Embraflex

## 📦 Pré-Deploy

### Backend
- [ ] Código compilando sem erros (`npm run build`)
- [ ] Testes passando (quando implementados)
- [ ] `.env.production` configurado localmente para testes
- [ ] Dependências atualizadas e sem vulnerabilidades
- [ ] Credenciais WooCommerce testadas e válidas
- [ ] Banco de dados acessível e configurado
- [ ] JWT_SECRET gerado (mínimo 32 caracteres)

### Frontend
- [ ] Build de produção funcionando (`npm run build`)
- [ ] Sem erros TypeScript (`npm run lint`)
- [ ] Variáveis de ambiente configuradas
- [ ] URL do backend atualizada para produção
- [ ] Imagens e assets otimizados
- [ ] PWA configurado (se aplicável)

---

## 🚀 Deploy Backend (Render.com)

### Configuração Inicial
- [ ] Conta Render.com criada e verificada
- [ ] Repositório conectado ou upload manual preparado
- [ ] Web Service criado
- [ ] Plano selecionado (Free/Starter/Standard)

### Build Settings
```
Build Command: cd backend && npm install && npm run build
Start Command: cd backend && npm start
Root Directory: /
```

### Environment Variables
- [ ] `WOOCOMMERCE_URL` → https://embraflexbr.com.br
- [ ] `WOOCOMMERCE_KEY` → ck_...
- [ ] `WOOCOMMERCE_SECRET` → cs_...
- [ ] `DB_HOST` → supabase host
- [ ] `DB_USER` → postgres
- [ ] `DB_PASSWORD` → senha segura
- [ ] `DB_NAME` → postgres
- [ ] `DB_PORT` → 5432
- [ ] `DB_SSL` → true
- [ ] `JWT_SECRET` → string aleatória 32+ chars
- [ ] `SUPABASE_URL` → https://...supabase.co
- [ ] `SUPABASE_ANON_KEY` → eyJ...
- [ ] `SUPABASE_SERVICE_KEY` → eyJ...
- [ ] `NODE_ENV` → production
- [ ] `PORT` → 10000

### Health Check
- [ ] Health check path configurado: `/api/health`
- [ ] Timeout: 30 segundos

### Deploy
- [ ] Deploy iniciado
- [ ] Build completado com sucesso
- [ ] Service online e respondendo
- [ ] URL pública anotada: `https://________.onrender.com`

---

## 🎨 Deploy Frontend (Netlify)

### Configuração Inicial
- [ ] Conta Netlify criada e verificada
- [ ] Site criado (Git ou manual)
- [ ] Nome do site definido

### Build Settings
```
Base directory: (vazio)
Build command: npm run build
Publish directory: dist
```

### Environment Variables
- [ ] `VITE_API_BASE_URL` → https://seu-backend.onrender.com/api
- [ ] `VITE_WOOCOMMERCE_URL` → https://embraflexbr.com.br
- [ ] `VITE_WOOCOMMERCE_CONSUMER_KEY` → ck_...
- [ ] `VITE_WOOCOMMERCE_CONSUMER_SECRET` → cs_...

### Deploy Settings
- [ ] Auto-deploy habilitado (se via Git)
- [ ] Branch de produção configurada (main/master)
- [ ] Build hooks configurados (opcional)

### Domain & HTTPS
- [ ] HTTPS automático habilitado (padrão)
- [ ] Domínio personalizado configurado (opcional)
- [ ] DNS configurado corretamente (se custom domain)

### Deploy
- [ ] Deploy iniciado
- [ ] Build completado com sucesso
- [ ] Site online e acessível
- [ ] URL anotada: `https://________.netlify.app`

---

## 🔧 Configuração Backend

### CORS
- [ ] CORS configurado com origem do Netlify
- [ ] Verificar `src/index.ts`:
```typescript
app.use(cors({
  origin: [
    'https://seu-site.netlify.app',
    'http://localhost:5173'
  ],
  credentials: true
}));
```

### Database
- [ ] Tabelas criadas (users, orders, customers)
- [ ] Usuário admin criado
- [ ] Índices criados para performance
- [ ] Backup configurado
- [ ] IP do Render na whitelist do Supabase

---

## ✅ Testes Pós-Deploy

### Backend API

**1. Health Check**
```bash
curl https://seu-backend.onrender.com/api/health
# Esperado: {"status":"ok"}
```
- [ ] Status 200 OK
- [ ] Resposta JSON válida

**2. Login**
```bash
curl -X POST https://seu-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"sua_senha"}'
```
- [ ] Status 200 OK
- [ ] Token JWT retornado
- [ ] Dados do usuário retornados

**3. Produtos**
```bash
curl https://seu-backend.onrender.com/api/products \
  -H "Authorization: Bearer SEU_TOKEN"
```
- [ ] Status 200 OK
- [ ] Array de produtos retornado
- [ ] Produtos do WooCommerce carregando

**4. Clientes**
```bash
curl https://seu-backend.onrender.com/api/customers \
  -H "Authorization: Bearer SEU_TOKEN"
```
- [ ] Status 200 OK
- [ ] Array de clientes retornado

**5. Criar Pedido**
```bash
curl -X POST https://seu-backend.onrender.com/api/orders \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customer":{},"products":[],"total":0}'
```
- [ ] Status 201 Created
- [ ] Pedido salvo no banco

### Frontend

**Navegação**
- [ ] Homepage carrega (`/`)
- [ ] Login carrega (`/login`)
- [ ] Dashboard carrega após login (`/dashboard`)
- [ ] Rota protegida redireciona se não logado

**Funcionalidades**
- [ ] Login funciona com credenciais corretas
- [ ] Login rejeita credenciais inválidas
- [ ] Dashboard mostra dados reais
- [ ] Produtos carregam da API
- [ ] Clientes carregam da API
- [ ] Busca de clientes funciona
- [ ] Criação de pedido funciona
- [ ] Wizard multi-step funciona
- [ ] PDF é gerado corretamente
- [ ] Logout funciona e limpa sessão

**Performance**
- [ ] Página carrega em < 3 segundos
- [ ] Lighthouse Score > 80
- [ ] Sem erros no Console
- [ ] Imagens carregam rapidamente

**Responsividade**
- [ ] Mobile (< 768px) ✓
- [ ] Tablet (768px - 1024px) ✓
- [ ] Desktop (> 1024px) ✓
- [ ] Menu lateral responsivo
- [ ] Tabelas responsivas

---

## 🔐 Segurança

- [ ] HTTPS habilitado (automático)
- [ ] Headers de segurança configurados (netlify.toml)
- [ ] JWT_SECRET forte (32+ caracteres)
- [ ] Senhas hasheadas com bcrypt
- [ ] CORS restrito a domínios específicos
- [ ] Credenciais WooCommerce em variáveis de ambiente
- [ ] Credenciais banco de dados seguras
- [ ] Rate limiting configurado (futuro)
- [ ] SQL injection protegido (usando prepared statements)

---

## 📊 Monitoramento

### Uptime
- [ ] UptimeRobot configurado (ou similar)
- [ ] Endpoint: `/api/health`
- [ ] Intervalo: 5 minutos
- [ ] Alertas configurados (email/SMS)

### Logs
- [ ] Logs do Render acessíveis
- [ ] Logs do Netlify acessíveis
- [ ] Error tracking configurado (Sentry - futuro)

### Analytics
- [ ] Google Analytics instalado (opcional)
- [ ] Netlify Analytics ativo (opcional)

---

## 📝 Documentação

- [ ] URLs de produção documentadas
- [ ] Credenciais salvas em gerenciador seguro (1Password, LastPass)
- [ ] Contatos de suporte anotados
- [ ] Procedimentos de rollback documentados
- [ ] Guia de troubleshooting criado
- [ ] README atualizado com URLs de produção

---

## 🎯 Pós-Deploy

### Comunicação
- [ ] Stakeholders notificados
- [ ] Usuários informados (se aplicável)
- [ ] Credenciais de acesso enviadas

### Backup
- [ ] Backup do banco de dados realizado
- [ ] Backup das variáveis de ambiente
- [ ] Backup do código (Git tag de release)

### Versioning
- [ ] Tag Git criada: `git tag v1.0.0`
- [ ] Release notes criadas
- [ ] CHANGELOG.md atualizado

---

## 🚨 Rollback Plan

Se algo der errado:

1. **Backend (Render)**
   ```
   Dashboard → Manual Deploy → Previous commit
   ```

2. **Frontend (Netlify)**
   ```
   Deploys → [deploy anterior] → Publish deploy
   ```

3. **Banco de Dados**
   ```sql
   -- Restaurar do backup
   pg_restore -d postgres backup.sql
   ```

---

## 📞 Contatos de Emergência

| Serviço | Suporte | Docs |
|---------|---------|------|
| Render | support@render.com | render.com/docs |
| Netlify | support@netlify.com | docs.netlify.com |
| Supabase | support@supabase.com | supabase.com/docs |
| WooCommerce | - | woocommerce.github.io/woocommerce-rest-api-docs |

---

## ✨ Deploy Concluído!

- **Frontend**: https://________.netlify.app
- **Backend**: https://________.onrender.com
- **Data**: ___/___/______
- **Versão**: v1.0.0

**Próximos passos:**
1. Monitorar por 24-48h
2. Coletar feedback dos usuários
3. Fazer ajustes necessários
4. Planejar próxima release

---

**Notas Adicionais:**

_______________________________________
_______________________________________
_______________________________________
