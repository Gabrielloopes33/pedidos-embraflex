#!/bin/bash

# Script de Deploy Rápido - Backend
# Execute: bash deploy-backend.sh

echo "🚀 Iniciando deploy do Backend Embraflex..."

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Verificar se está no diretório correto
if [ ! -d "backend" ]; then
    echo -e "${RED}❌ Erro: Diretório backend não encontrado${NC}"
    echo "Execute este script na raiz do projeto"
    exit 1
fi

echo -e "${YELLOW}📦 Instalando dependências...${NC}"
cd backend
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao instalar dependências${NC}"
    exit 1
fi

echo -e "${YELLOW}🔨 Compilando TypeScript...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao compilar projeto${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build concluído com sucesso!${NC}"
echo ""
echo "Próximos passos:"
echo "1. Fazer commit das alterações: git add . && git commit -m 'Deploy backend'"
echo "2. Push para o repositório: git push origin main"
echo "3. O Render.com fará deploy automático"
echo ""
echo "Ou faça deploy manual:"
echo "1. Acesse render.com"
echo "2. Selecione seu serviço"
echo "3. Clique em 'Manual Deploy' → 'Deploy latest commit'"

cd ..
