// QuickProductsStep - Step 2: Seleção rápida de produtos com navegação mobile-first
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Button } from '@/componentes/ui/button';
import { Badge } from '@/componentes/ui/badge';
import { Plus, Trash2, ShoppingCart, Sparkles, Pencil } from 'lucide-react';
import { QuoteProduct } from '@/lib/quotes';
import { ProductNavigator, ProductConfig } from './ProductNavigator';
import { FinishingModal, FinishingOptions } from './FinishingModal';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/componentes/ui/dialog';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';

interface QuickProductsStepProps {
  products: QuoteProduct[];
  onAddProduct: (product: QuoteProduct) => void;
  onUpdateProduct: (index: number, product: QuoteProduct) => void;
  onRemoveProduct: (index: number) => void;
}

export function QuickProductsStep({
  products,
  onAddProduct,
  onUpdateProduct,
  onRemoveProduct,
}: QuickProductsStepProps) {
  const [showNavigator, setShowNavigator] = useState(products.length === 0);
  const [showFinishingModal, setShowFinishingModal] = useState(false);
  const [editingProductIndex, setEditingProductIndex] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<QuoteProduct | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleProductSelected = (config: ProductConfig) => {
    // Converter formato do ProductNavigator para QuoteProduct
    // Usar displayName se disponível (nome completo com linha), senão nome do produto
    const quoteProduct: QuoteProduct = {
      name: config.displayName || config.product.name,
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
        hotStampCor: config.finishing.hotStampCor || 'nenhum',
        eyelets: config.finishing.ilhos || false,
        furoPresente: config.finishing.furoPresente || false,
        cord: config.finishing.cordao !== 'nenhum',
        cordao: config.finishing.cordao || 'nenhum',
        corCordao: config.finishing.corCordao || 'nenhum',
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
        hotStampCor: finishing.hotStampCor || 'nenhum',
        eyelets: finishing.ilhos,
        furoPresente: finishing.furoPresente || false,
        cord: finishing.cordao !== 'nenhum',
        cordao: finishing.cordao || 'nenhum',
        corCordao: finishing.corCordao || 'nenhum',
      },
      // Atualizar preço e subtotal com o custo dos acabamentos
      subtotal: product.quantity * (product.price + cost / product.quantity),
    };

    onUpdateProduct(editingProductIndex, updatedProduct);
    setEditingProductIndex(null);
  };

  const handleEditProduct = (product: QuoteProduct, index: number) => {
    setEditingProduct({ ...product });
    setEditingProductIndex(index);
    setShowEditModal(true);
  };

  const handleSaveEdit = (updatedProduct: QuoteProduct) => {
    if (editingProductIndex !== null) {
      onUpdateProduct(editingProductIndex, updatedProduct);
    }
    setShowEditModal(false);
    setEditingProduct(null);
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
                              onClick={() => handleEditProduct(product, index)}
                              className="hover:bg-primary/10"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
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
                          {/* Descrições do produto (atributos) */}
                          {product.attributes && Object.keys(product.attributes).length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {Object.entries(product.attributes)
                                .map(([key, value]) => `${key}: ${value}`)
                                .join(' • ')}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Qtd: {product.quantity}
                            </Badge>
                            {product.color && (
                              <Badge variant="outline">
                                {product.color}
                              </Badge>
                            )}
                            {product.finishing?.hotStamp && (
                              <Badge variant="outline">
                                Hot Stamp{product.finishing.hotStampCor && product.finishing.hotStampCor !== 'nenhum' ? ` (${product.finishing.hotStampCor})` : ''}
                              </Badge>
                            )}
                            {product.finishing?.eyelets && (
                              <Badge variant="outline">Ilhós</Badge>
                            )}
                            {product.finishing?.furoPresente && (
                              <Badge variant="outline">Furo de Presente</Badge>
                            )}
                            {product.finishing?.cord && (
                              <Badge variant="outline">
                                Cordão{product.finishing.cordao && product.finishing.cordao !== 'nenhum' ? ` ${product.finishing.cordao}` : ''}
                                {product.finishing.corCordao && product.finishing.corCordao !== 'nenhum' ? ` (${product.finishing.corCordao})` : ''}
                              </Badge>
                            )}
                          </div>

                          {/* Botão Adicionar Acabamento - para sacolas de papel (Kraft e linhas Premium/Comercial/Econômica) */}
                          {(product.sku?.toLowerCase().startsWith('k-') ||
                            (product.name?.toLowerCase().includes('sacola') &&
                             product.name?.toLowerCase().includes('papel')) ||
                            product.name?.toLowerCase().includes('sacola de papel') ||
                            product.name?.toLowerCase().includes('kraft') ||
                            product.name?.toLowerCase().includes('linha premium') ||
                            product.name?.toLowerCase().includes('linha comercial') ||
                            product.name?.toLowerCase().includes('linha econômica') ||
                            product.name?.toLowerCase().includes('linha economica')) && (
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
                          )}
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

                        {/* Desconto/Acréscimo */}
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                          <label className="text-xs text-muted-foreground">Desconto/Acréscimo %:</label>
                          <input
                            type="number"
                            min="-50"
                            max="50"
                            step="0.1"
                            value={product.discountPercent || 0}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              if (value >= -50 && value <= 50) {
                                const discountAmount = product.price * product.quantity * (value / 100);
                                const newSubtotal = product.price * product.quantity - discountAmount;

                                onUpdateProduct(index, {
                                  ...product,
                                  discountPercent: value,
                                  subtotal: newSubtotal,
                                });
                              }
                            }}
                            className="w-20 px-2 py-1 text-sm border rounded-md text-center"
                          />
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
            hotStampCor: products[editingProductIndex]?.finishing?.hotStampCor || 'nenhum',
            ilhos: products[editingProductIndex]?.finishing?.eyelets || false,
            furoPresente: products[editingProductIndex]?.finishing?.furoPresente || false,
            cordao: products[editingProductIndex]?.finishing?.cordao || (products[editingProductIndex]?.finishing?.cord ? 'padrao' : 'nenhum'),
            corCordao: products[editingProductIndex]?.finishing?.corCordao || 'nenhum',
          }}
          quantity={products[editingProductIndex]?.quantity || 1000}
        />
      )}

      {/* Modal de Edição de Produto */}
      {showEditModal && editingProduct && (
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Produto</DialogTitle>
              <DialogDescription>
                Altere quantidade e desconto do produto
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  min="1"
                  value={editingProduct.quantity}
                  onChange={(e) => {
                    const newQuantity = parseInt(e.target.value) || 1;
                    const discountAmount = editingProduct.discountPercent || 0
                      ? editingProduct.price * newQuantity * ((editingProduct.discountPercent || 0) / 100)
                      : 0;
                    setEditingProduct({
                      ...editingProduct,
                      quantity: newQuantity,
                      subtotal: editingProduct.price * newQuantity - discountAmount,
                    });
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Desconto/Acréscimo %</Label>
                <Input
                  type="number"
                  min="-50"
                  max="50"
                  step="0.1"
                  value={editingProduct.discountPercent || 0}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    const discountAmount = editingProduct.price * editingProduct.quantity * (value / 100);
                    setEditingProduct({
                      ...editingProduct,
                      discountPercent: value,
                      subtotal: editingProduct.price * editingProduct.quantity - discountAmount,
                    });
                  }}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancelar
              </Button>
              <Button onClick={() => handleSaveEdit(editingProduct)}>
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
      )}
    </div>
  );
}
