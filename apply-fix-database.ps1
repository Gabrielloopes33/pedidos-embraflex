# Script para aplicar correção no banco de dados Supabase
# Executa a migration 005_fix_users_created_at.sql

Write-Host "🔧 Aplicando Correção no Banco de Dados Supabase..." -ForegroundColor Cyan
Write-Host ""

# Carregar variáveis de ambiente
$envFile = ".\.env"
if (Test-Path $envFile) {
    Write-Host "✅ Carregando variáveis de ambiente de .env" -ForegroundColor Green
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
} else {
    Write-Host "⚠️  Arquivo .env não encontrado" -ForegroundColor Yellow
}

$SUPABASE_URL = $env:SUPABASE_URL
$SUPABASE_SERVICE_KEY = $env:SUPABASE_SERVICE_KEY

if (-not $SUPABASE_URL -or -not $SUPABASE_SERVICE_KEY) {
    Write-Host "❌ ERRO: Variáveis SUPABASE_URL e SUPABASE_SERVICE_KEY não configuradas" -ForegroundColor Red
    Write-Host "Configure no arquivo .env ou como variáveis de ambiente" -ForegroundColor Yellow
    exit 1
}

Write-Host "📊 Conectando ao Supabase: $SUPABASE_URL" -ForegroundColor Cyan
Write-Host ""

# Ler o arquivo de migração
$migrationFile = ".\backend\migrations\005_fix_users_created_at.sql"
if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ ERRO: Arquivo de migração não encontrado: $migrationFile" -ForegroundColor Red
    exit 1
}

$migrationSQL = Get-Content $migrationFile -Raw
Write-Host "📄 SQL a ser executado:" -ForegroundColor Cyan
Write-Host "---" -ForegroundColor Gray
Write-Host $migrationSQL -ForegroundColor White
Write-Host "---" -ForegroundColor Gray
Write-Host ""

# Confirmar execução
$confirm = Read-Host "Deseja executar esta migração? (S/N)"
if ($confirm -ne "S" -and $confirm -ne "s") {
    Write-Host "❌ Operação cancelada pelo usuário" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🚀 Executando migração..." -ForegroundColor Cyan

# Executar via API do Supabase (PostgREST)
# Nota: Para executar SQL direto, precisaríamos usar a API do Supabase Management
# ou executar via psql. Vamos mostrar as instruções para execução manual:

Write-Host ""
Write-Host "⚠️  IMPORTANTE: Migração SQL deve ser executada manualmente" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 Opções para executar a migração:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  Via Supabase Studio (RECOMENDADO):" -ForegroundColor White
Write-Host "   - Acesse: $SUPABASE_URL" -ForegroundColor Gray
Write-Host "   - Vá em: SQL Editor" -ForegroundColor Gray
Write-Host "   - Cole o conteúdo de: $migrationFile" -ForegroundColor Gray
Write-Host "   - Clique em 'Run'" -ForegroundColor Gray
Write-Host ""
Write-Host "2️⃣  Via psql (linha de comando):" -ForegroundColor White
Write-Host "   psql `"postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres`"" -ForegroundColor Gray
Write-Host "   \i $migrationFile" -ForegroundColor Gray
Write-Host ""
Write-Host "3️⃣  Via Node.js (execute no terminal):" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   npx ts-node -e `"require('./src/database').initializeDb()`"" -ForegroundColor Gray
Write-Host ""

# Testar conexão com a tabela users
Write-Host "🔍 Testando conexão com a tabela users..." -ForegroundColor Cyan
try {
    $headers = @{
        "apikey" = $SUPABASE_SERVICE_KEY
        "Authorization" = "Bearer $SUPABASE_SERVICE_KEY"
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/users?select=count" -Method Get -Headers $headers
    Write-Host "✅ Conexão com Supabase OK" -ForegroundColor Green
    Write-Host "📊 Usuários na tabela: $($response.count)" -ForegroundColor Cyan
} catch {
    Write-Host "⚠️  Erro ao conectar com Supabase" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Script concluído" -ForegroundColor Green
Write-Host "📝 Após executar a migração, teste criando um novo usuário no sistema" -ForegroundColor Cyan
