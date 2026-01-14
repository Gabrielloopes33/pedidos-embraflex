// QuickProductsStep - Step 2: Seleção rápida de produtos com navegação mobile-first
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Button } from '@/componentes/ui/button';
import { Badge } from '@/componentes/ui/badge';
import { Plus, Trash2, ShoppingCart, Sparkles } from 'lucide-react';
import { QuoteProduct } from '@/lib/quotes';
import { ProductNavigator, ProductConfig } from './ProductNavigator';
import { FinishingModal, FinishingOptions } from './FinishingModal';
import type { WooCommerceProduct } from '@/lib/woocommerce';

interface QuickProductsStepProps {
  products: QuoteProduct[];
  onAddProduct: (product: QuoteProduct) => void;
  onUpdateProduct: (index: number, product: QuoteProduct) => void;
  onRemoveProduct: (index: number) => void;
  isValid: boolean;
}

export function QuickProductsStep({
  products,
  onAddProduct,
  onUpdateProduct,
  onRemoveProduct,
  isValid,
}: QuickProductsStepProps) {
  const [showNavigator, setShowNavigator] = useState(products.length === 0);
  const [showFinishingModal, setShowFinishingModal] = useState(false);
  const [editingProductIndex, setEditingProductIndex] = useState<number | null>(null);

  const handleProductSelected = (config: ProductConfig) => {
    // Converter formato do ProductNavigator para QuoteProduct
    const quoteProduct: QuoteProduct = {
      name: config.product.name,
      sku: config.product.sku,
      quantity: config.quantity,
      price: config.price,
      subtotal: config.quantity * config.price,
      imageUrl: config.product.images?.[0]?.src || undefined,
      variationId: config.variationId,
      color: config.color,
      attributes: config.attributes,
      finishing: config.finishing ? {
        hotStamp: config.finishing.hotStamp || false,
        eyelets: config.finishing.ilhos || false,
        cord: config.finishing.cordao !== 'nenhum',
      } : {
        hotStamp: false,
        eyelets: false,
        cord: false,
      },
    };

    onAddProduct(quoteProduct);
    setShowNavigator(false);
  };

  const handleFinishingConfirm = (finishing: FinishingOptions, cost: number) => {
    if (editingProductIndex === null) return;
    
    const product = products[editingProductIndex];
    const updatedProduct: QuoteProduct = {
      ...product,
      finishing: {
        hotStamp: finishing.hotStamp,
        eyelets: finishing.ilhos,
        cord: finishing.cordao !== 'nenhum',
      },
      // Atualizar preço e subtotal com o custo dos acabamentos
      subtotal: product.quantity * (product.price + cost / product.quantity),
    };
    
    onUpdateProduct(editingProductIndex, updatedProduct);
    setEditingProductIndex(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const calculateTotal = () => {
    return products.reduce((sum, p) => sum + p.subtotal, 0);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {showNavigator ? (
        <ProductNavigator 
          onAddProduct={handleProductSelected} 
          onClose={() => setShowNavigator(false)}
        />
      ) : (
        <div className="space-y-6">
          {/* Carrinho de produtos */}
          <Card>
            <CardHeader className="bg-primary text-primary-foreground">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-6 h-6" />
                  <div>
                    <CardTitle>Produtos Selecionados</CardTitle>
                    <CardDescription className="text-primary-foreground/80">
                      {products.length} {products.length === 1 ? 'produto' : 'produtos'} adicionado{products.length !== 1 && 's'}
                    </CardDescription>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm text-primary-foreground/80">Total</p>
                  <p className="text-2xl font-bold whitespace-nowrap">{formatCurrency(calculateTotal())}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              {products.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground mb-4">
                    Nenhum produto adicionado ainda
                  </p>
                  <Button onClick={() => setShowNavigator(true)} size="lg">
                    <Plus className="mr-2 h-5 w-5" />
                    Adicionar Primeiro Produto
                  </Button>
                </div>
              ) : (
            <div className="space-y-4">
              {products.map((product, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Product Image */}
                      {product.imageUrl && (
                        <div className="flex-shrink-0 w-20 h-20 rounded-md overflow-hidden bg-muted">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h4 className="font-medium text-base leading-tight">
                              {product.name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              SKU: {product.sku}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onRemoveProduct(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>

                        {/* Product Details */}
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">
                              Qtd: {product.quantity}
                            </Badge>
                            {product.color && (
                              <Badge variant="outline">
                                {product.color}
                              </Badge>
                            )}
                            {product.finishing?.hotStamp && (
                              <Badge variant="outline">Hot Stamp</Badge>
                            )}
                            {product.finishing?.eyelets && (
                              <Badge variant="outline">Ilhós</Badge>
                            )}
                            {product.finishing?.cord && (
                              <Badge variant="outline">Cordão</Badge>
                            )}
                          </div>

                          {/* Botão Adicionar Acabamento */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingProductIndex(index);
                              setShowFinishingModal(true);
                            }}
                            className="w-full h-10 text-xs touch-manipulation"
                          >
                            <Sparkles className="mr-2 h-4 w-4" />
                            Adicionar Acabamento
                          </Button>
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline gap-2 mt-3">
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(product.price)} x {product.quantity} =
                          </span>
                          <span className="text-lg font-semibold">
                            {formatCurrency(product.subtotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add More Button */}
              <Button
                onClick={() => setShowNavigator(true)}
                variant="outline"
                size="lg"
                className="w-full h-12"
              >
                <Plus className="mr-2 h-5 w-5" />
                Adicionar Mais Produtos
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Acabamentos */}
      {editingProductIndex !== null && (
        <FinishingModal
          open={showFinishingModal}
          onOpenChange={setShowFinishingModal}
          onConfirm={handleFinishingConfirm}
          initialFinishing={{
            hotStamp: products[editingProductIndex]?.finishing?.hotStamp || false,
            ilhos: products[editingProductIndex]?.finishing?.eyelets || false,
            furoPresente: false,
            cordao: products[editingProductIndex]?.finishing?.cord ? 'padrao' : 'nenhum',
            corCordao: 'nenhum',
          }}
          quantity={products[editingProductIndex]?.quantity || 1000}
        />
      )}
    </div>
      )}
    </div>
  );
}
