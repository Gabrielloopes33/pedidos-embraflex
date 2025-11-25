# Script para testar CORS localmente
# Execute este script antes de fazer deploy

Write-Host "🧪 Testando configuração CORS..." -ForegroundColor Cyan

# 1. Verificar se o backend está rodando
Write-Host "`n1️⃣ Verificando backend..." -ForegroundColor Yellow
try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Backend está rodando" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend não está rodando. Inicie com 'cd backend && npm run dev'" -ForegroundColor Red
    exit 1
}

# 2. Testar requisição OPTIONS (preflight)
Write-Host "`n2️⃣ Testando requisição OPTIONS (preflight)..." -ForegroundColor Yellow
try {
    $headers = @{
        "Origin" = "http://localhost:5173"
        "Access-Control-Request-Method" = "GET"
        "Access-Control-Request-Headers" = "authorization,content-type"
    }
    
    $optionsResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/wc/products" -Method OPTIONS -Headers $headers -UseBasicParsing -ErrorAction Stop
    
    if ($optionsResponse.StatusCode -eq 200 -or $optionsResponse.StatusCode -eq 204) {
        Write-Host "✅ Requisição OPTIONS permitida" -ForegroundColor Green
        Write-Host "   Headers CORS:" -ForegroundColor Gray
        $optionsResponse.Headers['Access-Control-Allow-Origin']
        $optionsResponse.Headers['Access-Control-Allow-Methods']
    }
} catch {
    Write-Host "❌ Requisição OPTIONS falhou: $_" -ForegroundColor Red
    Write-Host "   Isso pode causar problemas de CORS no navegador" -ForegroundColor Red
}

# 3. Verificar variáveis de ambiente
Write-Host "`n3️⃣ Verificando variáveis de ambiente..." -ForegroundColor Yellow

if (Test-Path ".env.production") {
    Write-Host "✅ Arquivo .env.production encontrado" -ForegroundColor Green
    $envContent = Get-Content ".env.production"
    foreach ($line in $envContent) {
        if ($line -match "VITE_API_BASE_URL") {
            Write-Host "   $line" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "⚠️  Arquivo .env.production não encontrado" -ForegroundColor Yellow
}

# 4. Verificar configuração do Netlify
Write-Host "`n4️⃣ Verificando configuração do Netlify..." -ForegroundColor Yellow
if (Test-Path "netlify.toml") {
    Write-Host "✅ netlify.toml encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ netlify.toml não encontrado" -ForegroundColor Red
}

# 5. Resumo
Write-Host "`n📋 RESUMO" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Se todos os testes passaram:" -ForegroundColor White
Write-Host "1. Faça commit das mudanças" -ForegroundColor White
Write-Host "2. Push para o repositório" -ForegroundColor White
Write-Host "3. Aguarde o deploy automático no Render e Netlify" -ForegroundColor White
Write-Host "4. Limpe o cache do Netlify (Trigger deploy > Clear cache)" -ForegroundColor White
Write-Host "`nSe houver falhas, revise o arquivo CORRECAO_CORS.md" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
