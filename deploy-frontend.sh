#!/bin/bash

# Script de Deploy Rápido - Frontend
# Execute: bash deploy-frontend.sh

echo "🚀 Iniciando deploy do Frontend Embraflex..."

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Verificar variáveis de ambiente
if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env.production não encontrado${NC}"
    echo "Criando template..."
    cat > .env.production << EOF
VITE_API_BASE_URL=https://seu-backend.onrender.com/api
VITE_WOOCOMMERCE_URL=https://embraflexbr.com.br
VITE_WOOCOMMERCE_CONSUMER_KEY=ck_sua_chave
VITE_WOOCOMMERCE_CONSUMER_SECRET=cs_seu_secret
EOF
    echo -e "${RED}❌ Configure .env.production antes de continuar${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Instalando dependências...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao instalar dependências${NC}"
    exit 1
fi

echo -e "${YELLOW}🔨 Compilando projeto...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao compilar projeto${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build concluído com sucesso!${NC}"
echo ""
echo "📁 Build gerado em: ./dist"
echo ""
echo "Opções de deploy:"
echo ""
echo "1. Deploy via Git (recomendado):"
echo "   git add . && git commit -m 'Deploy frontend'"
echo "   git push origin main"
echo "   (Netlify fará deploy automático)"
echo ""
echo "2. Deploy manual via Netlify CLI:"
echo "   npm install -g netlify-cli"
echo "   netlify login"
echo "   netlify deploy --prod --dir=dist"
echo ""
echo "3. Deploy via drag & drop:"
echo "   Acesse: https://app.netlify.com/drop"
echo "   Arraste a pasta ./dist"
