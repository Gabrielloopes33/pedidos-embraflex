// ProductNavigator - Versão simplificada para debug
import { useState } from 'react';
import { Button } from '@/componentes/ui/button';
import { Card, CardContent } from '@/componentes/ui/card';
import { Plus } from 'lucide-react';

interface ProductNavigatorProps {
  onAddProduct: (config: any) => void;
}

export function ProductNavigator({ onAddProduct }: ProductNavigatorProps) {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <p className="text-muted-foreground mb-4">
          Navegação de produtos em desenvolvimento
        </p>
        <Button onClick={() => {
          // Mock product para testar
          onAddProduct({
            product: {
              name: 'Produto Teste',
              sku: 'TEST-001',
              images: []
            },
            quantity: 1000,
            price: 2.50,
            hotStamp: false,
            ilhos: false,
            cordao: false
          });
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Produto Teste
        </Button>
      </CardContent>
    </Card>
  );
}
