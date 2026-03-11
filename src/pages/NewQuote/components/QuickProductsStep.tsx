// QuickProductsStep - Step 2: Seleção rápida de produtos com navegação mobile-first
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Button } from '@/componentes/ui/button';
import { Badge } from '@/componentes/ui/badge';
import { Plus, Trash2, ShoppingCart, Sparkles, Pencil, Hash } from 'lucide-react';
import { QuoteProduct } from '@/lib/quotes';
import { ProductNavigator, ProductConfig } from './ProductNavigator';
import { FinishingModal, FinishingOptions } from './FinishingModal';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/componentes/ui/dialog';
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
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [editingDiscountIndex, setEditingDiscountIndex] = useState<number | null>(null);
  const [editingQuantityIndex, setEditingQuantityIndex] = useState<number | null>(null);
  const [discountValue, setDiscountValue] = useState('');
  const [quantityValue, setQuantityValue] = useState('');
  const [editingProductIndex, setEditingProductIndex] = useState<number | null>(null);

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
      paperType: config.paperType, // Tipo de papel selecionado
      finishing: config.finishing ? {
        hotStamp: config.finishing.hotStamp || false,
        hotStampCor: config.finishing.hotStampCor || 'nenhum',
        hotStampCorManual: config.finishing.hotStampCor === 'colorido' ? config.finishing.hotStampCorManual : undefined,
        eyelets: config.finishing.ilhos || false,
        ilhosCorManual: config.finishing.ilhos ? config.finishing.ilhosCorManual : undefined,
        furoPresente: config.finishing.furoPresente || false,
        cord: config.finishing.cordao !== 'nenhum',
        cordao: config.finishing.cordao || 'nenhum',
        corCordao: config.finishing.corCordao || 'nenhum',
        cordaoCorManual: config.finishing.corCordao === 'colorido' ? config.finishing.cordaoCorManual : undefined,
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
    const finishingCostPerUnit = cost / product.quantity; // Custo de acabamento por unidade
    const unitPriceWithFinishing = product.price + finishingCostPerUnit;

    const updatedProduct: QuoteProduct = {
      ...product,
      finishing: {
        hotStamp: finishing.hotStamp,
        hotStampCor: finishing.hotStampCor || 'nenhum',
        hotStampCorManual: finishing.hotStampCor === 'colorido' ? finishing.hotStampCorManual : undefined,
        eyelets: finishing.ilhos,
        ilhosCorManual: finishing.ilhos ? finishing.ilhosCorManual : undefined,
        furoPresente: finishing.furoPresente || false,
        cord: finishing.cordao !== 'nenhum',
        cordao: finishing.cordao || 'nenhum',
        corCordao: finishing.corCordao || 'nenhum',
        cordaoCorManual: finishing.corCordao === 'colorido' ? finishing.cordaoCorManual : undefined,
      },
      // Guardar preço unitário com acabamentos
      unitPriceWithFinishing: unitPriceWithFinishing,
      // Subtotal: (preço base + acabamentos) × quantidade
      subtotal: product.quantity * unitPriceWithFinishing,
    };

    onUpdateProduct(editingProductIndex, updatedProduct);
    setEditingProductIndex(null);
  };

  const openDiscountModal = (index: number) => {
    const product = products[index];
    setEditingDiscountIndex(index);
    setDiscountValue(product.discountPercent?.toString() || '');
    setShowDiscountModal(true);
  };

  const openQuantityModal = (index: number) => {
    const product = products[index];
    setEditingQuantityIndex(index);
    setQuantityValue(product.quantity.toString());
    setShowQuantityModal(true);
  };

  const handleDiscountBlur = () => {
    if (editingDiscountIndex === null) return;

    // Se vazio, fecha sem alterar
    if (!discountValue.trim()) {
      setShowDiscountModal(false);
      setEditingDiscountIndex(null);
      return;
    }

    // Parse valor (permite decimais)
    const value = parseFloat(discountValue.replace(',', '.'));

    // Validação: entre -11 e 11
    if (value < -11 || value > 11) {
      return;
    }

    // Atualizar produto com lógica corrigida
    const product = products[editingDiscountIndex];
    // Usar preço unitário com acabamentos se disponível para calcular o base
    const unitPrice = product.unitPriceWithFinishing || product.price;
    const basePrice = unitPrice * product.quantity;

    let newSubtotal: number;

    if (value < 0) {
      // Desconto (negativo): remove valor do total
      const discountAmount = basePrice * Math.abs(value / 100);
      newSubtotal = basePrice - discountAmount;
    } else if (value > 0) {
      // Acrécimo (positivo): adiciona valor ao total
      const markupAmount = basePrice * (value / 100);
      newSubtotal = basePrice + markupAmount;
    } else {
      // Zero: mantém valor original
      newSubtotal = basePrice;
    }

    onUpdateProduct(editingDiscountIndex, {
      ...product,
      discountPercent: value,
      subtotal: newSubtotal,
    });

    setShowDiscountModal(false);
    setEditingDiscountIndex(null);
    setDiscountValue('');
  };

  const handleQuantityBlur = () => {
    if (editingQuantityIndex === null) return;

    // Se vazio, fecha sem alterar
    if (!quantityValue.trim()) {
      setShowQuantityModal(false);
      setEditingQuantityIndex(null);
      return;
    }

    // Parse valor
    const value = parseInt(quantityValue);

    // Validação: mínimo 1
    if (value < 1) {
      return;
    }

    // Atualizar produto
    const product = products[editingQuantityIndex];
    // Usar preço com acabamentos se disponível, senão preço base
    const basePrice = product.unitPriceWithFinishing || product.price;
    const discountAmount = product.discountPercent
      ? basePrice * value * ((product.discountPercent || 0) / 100)
      : 0;
    const newSubtotal = basePrice * value - discountAmount;

    onUpdateProduct(editingQuantityIndex, {
      ...product,
      quantity: value,
      subtotal: newSubtotal,
    });

    setShowQuantityModal(false);
    setEditingQuantityIndex(null);
    setQuantityValue('');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatProductDisplayName = (name: string, sku: string) => {
    if (!sku) return name;
    // Se o nome já começa com o SKU (case insensitive), retorna o nome
    if (name.toLowerCase().startsWith(sku.toLowerCase())) {
      return name;
    }
    return `${sku} - ${name}`;
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
                               {formatProductDisplayName(product.name, product.sku)}
                             </h4>
                           </div>

                          {/* Actions - apenas botão remover */}
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
                          {/* Descrições do produto (atributos) */}
                          {product.attributes && Object.keys(product.attributes).length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {Object.entries(product.attributes)
                                .map(([key, value]) => `${key}: ${value}`)
                                .join(' • ')}
                            </p>
                          )}

                           <div className="flex flex-wrap gap-2">
                             <Badge 
                               variant="secondary" 
                               className="bg-green-100 text-green-800 cursor-pointer hover:bg-green-200 transition-colors group relative"
                               onClick={() => openQuantityModal(index)}
                               title="Clique para alterar quantidade"
                             >
                               <Hash className="absolute -left-4 top-1/2 -translate-y-1/2 w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                               Qtd: {product.quantity}
                             </Badge>
                             {product.color && (
                               <Badge variant="outline">
                                 {product.color}
                               </Badge>
                             )}
                           </div>

                           <div className="flex flex-wrap gap-2">
                             {product.finishing?.hotStamp && (
                               <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700 font-medium">
                                 Hot Stamp
                                 {product.finishing.hotStampCor && product.finishing.hotStampCor !== 'nenhum' && (
                                   <span>
                                     {' '}({product.finishing.hotStampCor}
                                     {product.finishing.hotStampCor === 'colorido' && product.finishing.hotStampCorManual && (
                                       <span>: {product.finishing.hotStampCorManual}</span>
                                     )}
                                     )
                                   </span>
                                 )}
                               </Badge>
                             )}
                             {product.finishing?.eyelets && (
                               <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 font-medium">
                                 Ilhós
                                 {product.finishing.ilhosCorManual && (
                                   <span className="ml-1">({product.finishing.ilhosCorManual})</span>
                                 )}
                               </Badge>
                             )}
                             {product.finishing?.furoPresente && (
                               <Badge variant="outline" className="bg-pink-50 border-pink-200 text-pink-700 font-medium">Furo de Presente</Badge>
                             )}
                             {product.finishing?.cord && (
                               <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700 font-medium">
                                 Cordão
                                 {product.finishing.cordao && product.finishing.cordao !== 'nenhum' && (
                                   <span className="ml-1">{product.finishing.cordao}</span>
                                 )}
                                 {product.finishing.corCordao && product.finishing.corCordao !== 'nenhum' && (
                                   <span>
                                     {' '}({product.finishing.corCordao}
                                     {product.finishing.corCordao === 'colorido' && product.finishing.cordaoCorManual && (
                                       <span>: {product.finishing.cordaoCorManual}</span>
                                     )}
                                     )
                                   </span>
                                 )}
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

                        {/* Price - Mostrar preço unitário real (subtotal / quantidade) */}
                        <div className="flex items-baseline gap-2 mt-3">
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(product.subtotal / product.quantity)} x {product.quantity} =
                          </span>
                          <span
                            className="text-lg font-semibold cursor-pointer hover:bg-primary/10 rounded px-2 py-1 transition-colors group relative"
                            onClick={() => openDiscountModal(index)}
                            title="Clique para aplicar desconto"
                          >
                            {formatCurrency(product.subtotal)}
                            {/* Ícone de lápis pequeno que aparece no hover */}
                            <Pencil className="absolute -right-6 top-1/2 -translate-y-1/2 w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
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
            hotStampCor: products[editingProductIndex]?.finishing?.hotStampCor || 'nenhum',
            ilhos: products[editingProductIndex]?.finishing?.eyelets || false,
            furoPresente: products[editingProductIndex]?.finishing?.furoPresente || false,
            cordao: products[editingProductIndex]?.finishing?.cordao || (products[editingProductIndex]?.finishing?.cord ? 'padrao' : 'nenhum'),
            corCordao: products[editingProductIndex]?.finishing?.corCordao || 'nenhum',
          }}
          quantity={products[editingProductIndex]?.quantity || 1000}
        />
      )}

      {/* Modal de Desconto */}
      {showDiscountModal && editingDiscountIndex !== null && (
        <Dialog open={showDiscountModal} onOpenChange={(open) => {
          // Só permite fechar quando open é false via botão OK ou X
          if (!open) {
            setShowDiscountModal(false);
            setEditingDiscountIndex(null);
            setDiscountValue('');
          }
        }}>
          <DialogContent className="max-w-sm" onPointerDownOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>Desconto/Acréscimo</DialogTitle>
              <DialogDescription className="text-center">
                Digite o percentual ou use os botões rápidos
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="discount-input" className="text-center">Percentual (%)</Label>
                <Input
                  id="discount-input"
                  type="number"
                  min="-11"
                  max="11"
                  step="0.1"
                  placeholder="0"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleDiscountBlur();
                    } else if (e.key === 'Escape') {
                      setShowDiscountModal(false);
                      setEditingDiscountIndex(null);
                      setDiscountValue('');
                    }
                  }}
                  autoFocus
                  className="text-center text-2xl font-bold h-16"
                />
                 <div className="flex justify-center gap-2 text-xs text-muted-foreground mt-2">
                   <Badge variant="outline" className="text-red-600">-11%</Badge>
                   <span>a</span>
                   <Badge variant="outline" className="text-blue-600">+11%</Badge>
                 </div>
              </div>

              {/* Botões rápidos de 0,5% */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                <Button
                  type="button"
                  variant="destructive"
                  size="lg"
                  onClick={() => setDiscountValue((prev) => {
                    const current = parseFloat(prev.replace(',', '.')) || 0;
                    const newVal = Math.max(-11, current - 0.5);
                    return newVal.toString();
                  })}
                  className="h-14 text-base font-semibold"
                >
                  -0,5%
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="lg"
                  onClick={() => setDiscountValue((prev) => {
                    const current = parseFloat(prev.replace(',', '.')) || 0;
                    const newVal = Math.min(11, current + 0.5);
                    return newVal.toString();
                  })}
                  className="h-14 text-base font-semibold bg-green-600 text-white hover:bg-green-700"
                >
                  +0,5%
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={() => setDiscountValue('0')}
                  className="h-14 text-base font-semibold"
                >
                  Reset
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setDiscountValue((prev) => {
                    const current = parseFloat(prev.replace(',', '.')) || 0;
                    const newVal = Math.max(-11, current - 1);
                    return newVal.toString();
                  })}
                  className="h-14 text-base font-semibold text-red-600 border-red-600 hover:bg-red-50"
                >
                  -1%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setDiscountValue((prev) => {
                    const current = parseFloat(prev.replace(',', '.')) || 0;
                    const newVal = Math.min(11, current + 1);
                    return newVal.toString();
                  })}
                  className="h-14 text-base font-semibold text-green-600 border-green-600 hover:bg-green-50"
                >
                  +1%
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="lg"
                  onClick={() => {
                    handleDiscountBlur();
                    setShowDiscountModal(false);
                    setEditingDiscountIndex(null);
                  }}
                  className="h-14 text-base font-semibold bg-green-600 text-white hover:bg-green-700"
                >
                  OK
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Quantidade */}
      {showQuantityModal && editingQuantityIndex !== null && (
        <Dialog open={showQuantityModal} onOpenChange={(open) => {
          setShowQuantityModal(open);
          if (!open) {
            setEditingQuantityIndex(null);
            setQuantityValue('');
          }
        }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Alterar Quantidade</DialogTitle>
              <DialogDescription className="text-center">
                Digite a nova quantidade do produto
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quantity-input" className="text-center">Quantidade</Label>
                <Input
                  id="quantity-input"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="1"
                  value={quantityValue}
                  onChange={(e) => setQuantityValue(e.target.value)}
                  onBlur={handleQuantityBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    } else if (e.key === 'Escape') {
                      setShowQuantityModal(false);
                      setEditingQuantityIndex(null);
                      setQuantityValue('');
                    }
                  }}
                  autoFocus
                  className="text-center text-2xl font-bold h-16"
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
      )}
    </div>
  );
}
