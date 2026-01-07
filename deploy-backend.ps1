# PowerShell Script de Deploy - Backend
# Execute: .\deploy-backend.ps1

Write-Host "🚀 Iniciando deploy do Backend Embraflex..." -ForegroundColor Cyan

# 1. Verificar diretório
if (-Not (Test-Path "backend")) {
    Write-Host "❌ Erro: Diretório backend não encontrado" -ForegroundColor Red
    Write-Host "Execute este script na raiz do projeto"
    exit 1
}

# 2. Instalar dependências
Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
Set-Location backend
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao instalar dependências" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# 3. Build
Write-Host "🔨 Compilando TypeScript..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao compilar projeto" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "✅ Build concluído com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Fazer commit: git add . && git commit -m 'Deploy backend'"
Write-Host "2. Push: git push origin main"
Write-Host "3. O Render.com fará deploy automático"
Write-Host ""
Write-Host "Ou deploy manual no Render:" -ForegroundColor Cyan
Write-Host "1. Acesse render.com"
Write-Host "2. Selecione seu serviço"
Write-Host "3. Clique em 'Manual Deploy' → 'Deploy latest commit'"

Set-Location ..
