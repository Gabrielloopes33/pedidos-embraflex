# PowerShell Script de Deploy - Frontend
# Execute: .\deploy-frontend.ps1

Write-Host "🚀 Iniciando deploy do Frontend Embraflex..." -ForegroundColor Cyan

# 1. Verificar .env.production
if (-Not (Test-Path ".env.production")) {
    Write-Host "⚠️  Arquivo .env.production não encontrado" -ForegroundColor Yellow
    Write-Host "Criando template..." -ForegroundColor Yellow
    
    @"
VITE_API_BASE_URL=https://seu-backend.onrender.com/api
VITE_WOOCOMMERCE_URL=https://embraflexbr.com.br
VITE_WOOCOMMERCE_CONSUMER_KEY=ck_sua_chave
VITE_WOOCOMMERCE_CONSUMER_SECRET=cs_seu_secret
"@ | Out-File -FilePath ".env.production" -Encoding UTF8
    
    Write-Host "❌ Configure .env.production antes de continuar" -ForegroundColor Red
    exit 1
}

# 2. Instalar dependências
Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao instalar dependências" -ForegroundColor Red
    exit 1
}

# 3. Build
Write-Host "🔨 Compilando projeto..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao compilar projeto" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build concluído com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Build gerado em: ./dist" -ForegroundColor Cyan
Write-Host ""
Write-Host "Opções de deploy:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Deploy via Git (recomendado):" -ForegroundColor White
Write-Host "   git add ."
Write-Host "   git commit -m 'Deploy frontend'"
Write-Host "   git push origin main"
Write-Host "   (Netlify fará deploy automático)"
Write-Host ""
Write-Host "2. Deploy manual via Netlify CLI:" -ForegroundColor White
Write-Host "   npm install -g netlify-cli"
Write-Host "   netlify login"
Write-Host "   netlify deploy --prod --dir=dist"
Write-Host ""
Write-Host "3. Deploy via drag & drop:" -ForegroundColor White
Write-Host "   Acesse: https://app.netlify.com/drop"
Write-Host "   Arraste a pasta ./dist"
