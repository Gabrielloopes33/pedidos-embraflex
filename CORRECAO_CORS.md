# 🔧 Correção do Problema de CORS - WooCommerce

## 🐛 Problema Identificado

O problema estava ocorrendo porque:

1. **Requisições Preflight (OPTIONS)**: O navegador web faz requisições OPTIONS antes de enviar GET/POST com headers de autenticação
2. **Middleware de Autenticação**: O middleware `authenticateToken` estava bloqueando requisições OPTIONS que não possuíam token
3. **CORS**: A configuração do CORS não estava tratando corretamente as requisições preflight

**Por que funcionava no mobile?**
- Navegadores mobile (Safari/Chrome) podem ter tratamento diferente de requisições CORS
- Algumas requisições podem não gerar preflight dependendo do contexto

## ✅ Correções Implementadas

### 1. Backend (`backend/src/index.ts`)

#### 1.1 Middleware de Autenticação
Adicionado tratamento para requisições OPTIONS:

```typescript
const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Permitir requisições OPTIONS (preflight) sem autenticação
  if (req.method === 'OPTIONS') {
    return next();
  }
  // ... resto do código
}
```

#### 1.2 Configuração CORS Melhorada
- Implementado função de origem dinâmica
- Adicionado suporte para requisições sem origin (mobile apps)
- Cache de preflight de 24 horas (maxAge)
- Headers expostos adicionais

```typescript
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requisições sem origin (mobile apps, Postman, etc)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  maxAge: 86400 // 24 horas
  // ...
}
```

#### 1.3 Logs Melhorados
Adicionados logs detalhados para facilitar debug:
- Log de origem bloqueada pelo CORS
- Log de produtos buscados
- Log de erros com detalhes completos

### 2. Frontend (`src/lib/woocommerce.ts`)

Adicionados logs detalhados para debug:

```typescript
console.log('🔍 Buscando produtos via proxy com params:', params);
console.error('❌ Erro ao buscar produtos via proxy:', {
  status: error.response?.status,
  statusText: error.response?.statusText,
  data: error.response?.data,
  message: error.message
});
```

### 3. Configuração Netlify (`netlify.toml`)

Criado arquivo de configuração do Netlify com:
- Headers de segurança
- Cache para assets estáticos
- Configuração de redirects

## 🚀 Deploy

### Backend (Render)

1. Faça commit e push das mudanças:
```bash
git add .
git commit -m "fix: correção de CORS para requisições web"
git push
```

2. No Render, o deploy será automático se você configurou auto-deploy

3. Verifique os logs do Render após o deploy para confirmar que está funcionando

### Frontend (Netlify)

1. Faça commit e push:
```bash
git add .
git commit -m "fix: logs melhorados e configuração Netlify"
git push
```

2. No Netlify:
   - Vá em **Site settings** > **Build & deploy** > **Environment variables**
   - Confirme que `VITE_API_BASE_URL` está definido como:
     ```
     https://backend-embraflex.onrender.com/api
     ```

3. **Limpe o cache do build**:
   - Vá em **Deploys**
   - Clique em **Trigger deploy** > **Clear cache and deploy site**

## 🧪 Testando

Após o deploy, teste no navegador web:

1. Abra o DevTools (F12)
2. Vá na aba **Console**
3. Navegue até a página de Produtos
4. Você deverá ver logs como:
   ```
   🔍 Buscando produtos via proxy com params: {...}
   ✅ Produtos recebidos: 10
   ```

5. Se houver erro, você verá detalhes no console:
   ```
   ❌ Erro ao buscar produtos via proxy: {
     status: 401,
     statusText: "Unauthorized",
     ...
   }
   ```

## 🔍 Debug

Se ainda houver problemas:

1. **Verifique o token de autenticação**:
   - Abra DevTools > Application > Local Storage
   - Verifique se `authToken` existe

2. **Verifique os headers da requisição**:
   - DevTools > Network
   - Clique na requisição para `/api/wc/products`
   - Verifique se o header `Authorization` está presente

3. **Verifique os logs do backend**:
   - Acesse o painel do Render
   - Veja os logs em tempo real

## 📝 Notas Adicionais

- O problema era específico de requisições preflight CORS
- Mobile funcionava porque alguns navegadores mobile tratam CORS de forma diferente
- A correção não afeta a segurança, apenas permite que requisições OPTIONS passem pelo middleware

## 🎯 Resultado Esperado

Após as correções, a página de Produtos deve:
- ✅ Carregar corretamente no navegador web
- ✅ Carregar corretamente no mobile
- ✅ Mostrar logs detalhados no console
- ✅ Exibir mensagens de erro claras em caso de problema
