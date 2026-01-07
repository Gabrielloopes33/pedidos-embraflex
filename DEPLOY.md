# 🚀 Guia de Deploy - Embraflex Sistema de Pedidos

## 📋 Sumário
- [Pré-requisitos](#pré-requisitos)
- [Deploy do Backend](#deploy-do-backend)
- [Deploy do Frontend](#deploy-do-frontend)
- [Verificação Pós-Deploy](#verificação-pós-deploy)
- [Troubleshooting](#troubleshooting)

---

## ✅ Pré-requisitos

### Contas Necessárias
- [ ] Conta no [Render.com](https://render.com) (Backend)
- [ ] Conta no [Netlify](https://netlify.com) (Frontend)
- [ ] Acesso ao WooCommerce da Embraflex
- [ ] Banco de dados configurado (Supabase/PostgreSQL)

### Credenciais Necessárias
- [ ] Consumer Key do WooCommerce
- [ ] Consumer Secret do WooCommerce
- [ ] Credenciais do banco de dados
- [ ] JWT Secret gerado

---

## 🔧 Deploy do Backend

### 1. Preparar Backend para Produção

```bash
cd backend
npm install
npm run build
```

### 2. Configurar no Render.com

1. **Criar novo Web Service**
   - Blueprint: Node
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

2. **Configurar Variáveis de Ambiente**

```env
# WooCommerce API
WOOCOMMERCE_URL=https://embraflexbr.com.br
WOOCOMMERCE_KEY=ck_sua_chave_aqui
WOOCOMMERCE_SECRET=cs_seu_secret_aqui

# Database (Supabase/PostgreSQL)
DB_HOST=seu_host.supabase.co
DB_USER=postgres
DB_PASSWORD=sua_senha_segura
DB_NAME=postgres
DB_PORT=5432
DB_SSL=true

# JWT Authentication
JWT_SECRET=seu_jwt_secret_super_seguro_min_32_chars

# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_KEY=sua_service_key

# Node Environment
NODE_ENV=production
PORT=10000
```

3. **Configurar Health Check**
   - Path: `/api/health`
   - Timeout: 30 segundos

4. **Deploy**
   - Clique em "Deploy" e aguarde o build

### 3. Verificar Backend

```bash
# Testar endpoint de health
curl https://seu-backend.onrender.com/api/health

# Testar autenticação
curl -X POST https://seu-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"sua_senha"}'
```

---

## 🎨 Deploy do Frontend

### 1. Preparar Frontend para Produção

```bash
# Na raiz do projeto
npm install

# Criar arquivo .env.production
cat > .env.production << EOF
VITE_API_BASE_URL=https://seu-backend.onrender.com/api
VITE_WOOCOMMERCE_URL=https://embraflexbr.com.br
VITE_WOOCOMMERCE_CONSUMER_KEY=ck_sua_chave
VITE_WOOCOMMERCE_CONSUMER_SECRET=cs_seu_secret
EOF

# Build de produção
npm run build
```

### 2. Configurar no Netlify

#### Opção A: Deploy via Git (Recomendado)

1. **Conectar Repositório**
   - Acesse Netlify Dashboard
   - "New site from Git"
   - Conecte seu repositório GitHub/GitLab

2. **Configurar Build**
   ```
   Base directory: (deixe vazio)
   Build command: npm run build
   Publish directory: dist
   ```

3. **Adicionar Variáveis de Ambiente**
   - Site Settings → Environment Variables
   - Adicione as variáveis do `.env.production`

#### Opção B: Deploy Manual

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login no Netlify
netlify login

# Deploy
netlify deploy --prod --dir=dist
```

### 3. Configurar Netlify (netlify.toml já configurado)

O arquivo `netlify.toml` já está configurado com:
- ✅ Redirects SPA (Single Page Application)
- ✅ Headers de segurança
- ✅ Cache para assets estáticos
- ✅ Build settings

### 4. Configurar Domínio Personalizado (Opcional)

1. Netlify Dashboard → Domain Settings
2. Add custom domain
3. Configurar DNS conforme instruções

---

## ✨ Verificação Pós-Deploy

### Checklist Backend ✓

```bash
# 1. Health check
curl https://seu-backend.onrender.com/api/health
# Esperado: {"status": "ok"}

# 2. Login
curl -X POST https://seu-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
# Esperado: {"token": "...", "user": {...}}

# 3. Produtos WooCommerce
curl https://seu-backend.onrender.com/api/products \
  -H "Authorization: Bearer SEU_TOKEN"
# Esperado: Array de produtos

# 4. Clientes
curl https://seu-backend.onrender.com/api/customers \
  -H "Authorization: Bearer SEU_TOKEN"
# Esperado: Array de clientes
```

### Checklist Frontend ✓

- [ ] Site carrega corretamente em `https://seu-site.netlify.app`
- [ ] Login funciona e redireciona para dashboard
- [ ] Produtos carregam da API WooCommerce
- [ ] Clientes carregam corretamente
- [ ] Criação de pedido funciona
- [ ] PDF é gerado corretamente
- [ ] Logout funciona
- [ ] Rotas protegidas redirecionam para login
- [ ] Responsividade em mobile/tablet/desktop

### Performance Check

```bash
# Lighthouse CI (Google Chrome)
npm install -g @lhci/cli
lhci autorun --collect.url=https://seu-site.netlify.app

# Ou usar https://web.dev/measure/
```

---

## 🐛 Troubleshooting

### Backend Não Inicia

**Erro: ECONNREFUSED ao conectar ao banco**
```bash
# Verificar variáveis de ambiente
# Confirmar que DB_HOST, DB_USER, DB_PASSWORD estão corretas
# Verificar se IP do Render está na whitelist do Supabase
```

**Erro: JWT malformed**
```bash
# Verificar JWT_SECRET
# Deve ter no mínimo 32 caracteres
# Gerar novo: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Erro: WooCommerce API 401**
```bash
# Verificar Consumer Key e Secret
# Confirmar que credenciais têm permissão de leitura/escrita
# Testar no WooCommerce API Tester
```

### Frontend Não Conecta ao Backend

**Erro: CORS**
```javascript
// Backend deve ter configuração CORS correta
// Verificar src/index.ts no backend:
app.use(cors({
  origin: ['https://seu-site.netlify.app', 'http://localhost:5173'],
  credentials: true
}));
```

**Erro: 404 em rotas**
```toml
# Confirmar que netlify.toml tem o redirect:
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Variáveis de ambiente não funcionam**
```bash
# Variáveis VITE_ devem estar em:
# 1. Netlify Environment Variables
# 2. Build time (não runtime)
# Fazer redeploy após adicionar variáveis
```

### Build Falha

**Erro: TypeScript errors**
```bash
# Verificar tipagem
npm run lint
npm run build

# Se necessário, adicionar // @ts-ignore temporariamente
```

**Erro: Out of memory**
```json
// package.json - aumentar memória do Node
"scripts": {
  "build": "NODE_OPTIONS=--max-old-space-size=4096 vite build"
}
```

### Performance Issues

**Backend lento**
- Verificar índices no banco de dados
- Implementar cache Redis (futuro)
- Otimizar queries SQL
- Usar conexão pooling

**Frontend lento**
- Code splitting implementado
- Lazy loading de rotas
- Otimizar imagens
- Usar CDN para assets

---

## 🔐 Segurança

### Checklist de Segurança

- [ ] JWT_SECRET forte (32+ caracteres)
- [ ] HTTPS habilitado (Render e Netlify fazem isso automaticamente)
- [ ] CORS configurado para domínios específicos
- [ ] Rate limiting implementado (futuro)
- [ ] Passwords hasheados com bcrypt
- [ ] Variáveis sensíveis em .env (não commitadas)
- [ ] Headers de segurança configurados (netlify.toml)

### Rotação de Credenciais

```bash
# 1. Gerar novo JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 2. Atualizar no Render
# 3. Fazer logout de todos os usuários (tokens antigos expiram)

# 4. Rotacionar credenciais WooCommerce a cada 6 meses
```

---

## 📊 Monitoramento

### Backend (Render)

- Logs: Render Dashboard → Logs
- Métricas: CPU, Memory, Response Time
- Alertas: Configurar notificações de downtime

### Frontend (Netlify)

- Analytics: Netlify Analytics (pago)
- Deploy logs: Netlify Dashboard
- Error tracking: Integrar Sentry (futuro)

### Uptime Monitoring

```bash
# Configurar UptimeRobot ou similar
# Endpoint: https://seu-backend.onrender.com/api/health
# Intervalo: 5 minutos
# Alertas: Email/SMS/Slack
```

---

## 🔄 CI/CD Automático

### GitHub Actions (Opcional)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      # Backend
      - name: Deploy Backend
        run: |
          cd backend
          npm install
          npm run build
        # Render faz deploy automático via Git
      
      # Frontend
      - name: Deploy Frontend
        run: |
          npm install
          npm run build
        env:
          VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}
      
      - name: Deploy to Netlify
        uses: netlify/actions/cli@master
        with:
          args: deploy --prod --dir=dist
        env:
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
```

---

## 📞 Suporte

### URLs Importantes

- **Frontend**: https://embraflex-pedidos.netlify.app
- **Backend**: https://backend-embraflex.onrender.com
- **API Docs**: https://backend-embraflex.onrender.com/api/docs
- **WooCommerce**: https://embraflexbr.com.br

### Contatos

- **Desenvolvedor**: [seu-email@example.com]
- **Suporte Render**: https://render.com/docs
- **Suporte Netlify**: https://docs.netlify.com

---

## 🎯 Próximos Passos

- [ ] Configurar domínio personalizado
- [ ] Implementar backup automático do banco
- [ ] Adicionar monitoramento de erros (Sentry)
- [ ] Configurar CI/CD com GitHub Actions
- [ ] Implementar rate limiting
- [ ] Adicionar testes automatizados
- [ ] Configurar staging environment

---

**Última atualização**: Janeiro 2026  
**Versão**: 1.0.0
