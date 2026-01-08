# 🔍 PROBLEMA: Clientes não carregam para alguns usuários

## 📋 Diagnóstico

O problema identificado é que **a rota de clientes exige autenticação**, mas a rota de produtos não.

### Por que isso acontece?

No arquivo `backend/src/index.ts`:

- ✅ **Produtos** (`/api/wc/products`): Rota **PÚBLICA** (sem `authenticateToken`)
- 🔒 **Clientes** (`/api/wc/customers`): Rota **PROTEGIDA** (com `authenticateToken`)

### Possíveis causas do erro

1. **Token expirado ou inválido** (mais provável)
2. **Token não está sendo enviado corretamente**
3. **localStorage foi limpo acidentalmente**
4. **Problema no navegador (cache/cookies)**

---

## 🛠️ SOLUÇÃO RÁPIDA: Como Testar

### 1️⃣ Executar Script de Diagnóstico

Peça para os usuários que não conseguem acessar clientes fazerem o seguinte:

1. Abrir a página do sistema
2. Pressionar **F12** (DevTools)
3. Ir na aba **Console**
4. Copiar e colar o conteúdo do arquivo `diagnose-auth.js`
5. Pressionar **Enter**
6. Enviar screenshot dos resultados

O script vai mostrar:
- ✅ Se o token existe
- ✅ Se o token está válido
- ✅ Se o token está expirado
- ✅ Resultado do teste de produtos
- ✅ Resultado do teste de clientes

### 2️⃣ Solução Imediata para Usuários

Se o problema for **token expirado**:

1. Fazer **Logout**
2. Fazer **Login** novamente
3. Tentar acessar os clientes

---

## 🔧 CORREÇÕES IMPLEMENTADAS

### 1. Logs Detalhados

Agora o sistema registra logs no console do navegador para facilitar o diagnóstico:

```
🔍 [Customers] Buscando clientes...
   Token presente: true
   Params: {page: 1, per_page: 20, ...}
✅ [Customers] Clientes recebidos: 15
```

Ou em caso de erro:

```
❌ [Customers] Token de autenticação não encontrado!
❌ [Customers] Token inválido ou expirado. Limpando localStorage...
```

### 2. Mensagens de Erro Melhoradas

A página de clientes agora mostra mensagens específicas:

- **Token expirado**: "Sua sessão expirou. Por favor, faça login novamente."
- **Sem autenticação**: "Você precisa estar autenticado para acessar os clientes."
- **Erro de conexão**: "Não foi possível conectar à API do WooCommerce."

### 3. Botão de Re-login Automático

Se detectar erro de autenticação, um botão "Fazer Login" aparece automaticamente, redirecionando para a tela de login.

---

## ⚠️ OPÇÃO: Remover Autenticação de Clientes (NÃO RECOMENDADO)

Se você quiser que a rota de clientes funcione **sem autenticação** (como produtos), você pode remover o middleware `authenticateToken`:

### Antes:
```typescript
app.get('/api/wc/customers', authenticateToken, async (req: AuthenticatedRequest, res) => {
```

### Depois:
```typescript
app.get('/api/wc/customers', async (req, res) => {
```

⚠️ **IMPORTANTE**: Isso permite que qualquer pessoa acesse a lista de clientes sem estar logada, o que pode ser um risco de segurança.

---

## 📊 Verificação de Logs no Backend

Se quiser ver logs no backend, verifique o console onde o servidor está rodando:

```
🔍 Buscando clientes - Usuário: vendedor1 (vendedor)
📊 Total de clientes retornados do WooCommerce: 45
✅ Clientes filtrados para vendedor "vendedor1": 12 de 45
```

Ou em caso de erro de autenticação:

```
❌ Token inválido ou ausente
401 Unauthorized
```

---

## 🎯 CHECKLIST DE TROUBLESHOOTING

Para cada usuário com problema, verificar:

- [ ] Usuário está logado no sistema?
- [ ] Token existe no localStorage?
- [ ] Token não está expirado? (validade: 12 horas)
- [ ] Erro 401 aparece no Network (aba Rede do DevTools)?
- [ ] Fazer logout + login resolve o problema?
- [ ] Limpar cache do navegador ajuda?
- [ ] Testar em navegador incógnito funciona?

---

## 📞 Próximos Passos

1. ✅ Pedir para usuários testarem com o script de diagnóstico
2. ✅ Verificar se fazendo logout/login resolve
3. ✅ Verificar logs no console do navegador
4. ✅ Verificar se há erros 401 na aba Network
5. ⚠️ Se persistir, considerar aumentar tempo de expiração do token (atualmente 12h)

---

## 🔐 Aumentar Tempo de Expiração do Token (Opcional)

Se os usuários ficam muito tempo sem fazer requisições e o token expira, você pode aumentar o tempo:

No arquivo `backend/src/index.ts`, linha ~119:

```typescript
// Antes (12 horas)
const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '12h' });

// Depois (24 horas)
const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

// Ou sem expiração (não recomendado)
const accessToken = jwt.sign(tokenPayload, JWT_SECRET);
```

---

## 📝 Resumo

**PROBLEMA**: Clientes exigem autenticação, produtos não. Token pode estar expirado.

**SOLUÇÃO**: 
1. Usuários devem fazer logout + login
2. Verificar token com script de diagnóstico
3. Logs agora mostram erro específico
4. Sistema redireciona automaticamente para login se token inválido

**TESTE**: Executar `diagnose-auth.js` no console do navegador
