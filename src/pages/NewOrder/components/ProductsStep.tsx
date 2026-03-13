import { Button } from "@/componentes/ui/button";
import { Card, CardContent } from "@/componentes/ui/card";
import { Badge } from "@/componentes/ui/badge";
import { Plus, Pencil, Trash2, Settings } from "lucide-react";
import type { ProductItem } from "../types";
import { ProductFormModal } from "./ProductFormModal";
import { FinishingModal } from "./FinishingModal";
import { calculateOrderTotal, calculateItemTotal, getFinishingDetailsWithTotal } from "../utils/pricing";
import { useState } from "react";

interface ProductsStepProps {
  products: ProductItem[];
  onUpdateProducts: (products: ProductItem[]) => void;
}

export type ProductLine = 'premium' | 'comercial' | 'economica' | null;

export function ProductsStep({ products, onUpdateProducts }: ProductsStepProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [selectedLine, setSelectedLine] = useState<ProductLine>(null);
  const [finishingModalOpen, setFinishingModalOpen] = useState(false);
  const [finishingProductIndex, setFinishingProductIndex] = useState<number | null>(null);

  const emptyProduct: ProductItem = {
    productId: 0,
    productName: '',
    quantity: 1,
    unitPrice: 0,
    total: 0,
    codigo: '',
    discriminacaoProduto: '',
    larguraCm: 0,
    alturaCm: 0,
    comprimentoCm: 0,
    tipoImpressao: '',
    finishing: {
      hotStamp: false,
      hotStampCor: '',
      hotStampCorManual: '',
      ilhos: false,
      ilhosCorManual: '',
      furoPresente: false,
      cordao: '',
      corCordao: '',
      cordaoCorManual: '',
    },
  };

  const handleAddProduct = () => {
    setEditingIndex(null);
    setIsModalOpen(true);
  };

  const handleAddProductWithLine = (line: ProductLine) => {
    setSelectedLine(line);
    setEditingIndex(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (index: number) => {
    setEditingIndex(index);
    setIsModalOpen(true);
  };

  const handleEditFinishing = (index: number) => {
    setFinishingProductIndex(index);
    setFinishingModalOpen(true);
  };

  const handleSaveFinishing = (finishing: ProductItem['finishing'], laminationType?: ProductItem['laminationType']) => {
    if (finishingProductIndex !== null) {
      const newProducts = [...products];
      newProducts[finishingProductIndex] = {
        ...newProducts[finishingProductIndex],
        finishing,
        laminationType,
        total: calculateItemTotal({ ...newProducts[finishingProductIndex], finishing })
      };
      onUpdateProducts(newProducts);
    }
  };

  const handleSaveProduct = (product: ProductItem) => {
    if (editingIndex !== null) {
      // Editando produto existente
      const newProducts = [...products];
      newProducts[editingIndex] = product;
      onUpdateProducts(newProducts);
    } else {
      // Adicionando novo produto
      onUpdateProducts([...products, product]);
    }
    setEditingIndex(null);
    setSelectedLine(null); // Resetar linha selecionada
  };

  const handleRemoveProduct = (index: number) => {
    const newProducts = products.filter((_, i) => i !== index);
    onUpdateProducts(newProducts);
  };

  const orderTotal = calculateOrderTotal(products);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Produtos do Pedido</h3>
          <p className="text-sm text-muted-foreground">
            Adicione os produtos que fazem parte deste pedido
          </p>
        </div>
        <Button type="button" onClick={handleAddProduct} size="sm" className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Produto
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-12 text-center">
          <p className="text-muted-foreground mb-6">
            Nenhum produto adicionado ainda
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Selecione a linha de produtos que deseja adicionar:
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-2xl mx-auto">
            <Button 
              type="button" 
              onClick={() => handleAddProductWithLine('premium')} 
              variant="outline"
              className="flex-1 h-auto py-4 px-6 flex flex-col items-center gap-2 hover:bg-amber-50 hover:border-amber-300 transition-all"
            >
              <span className="text-lg font-semibold text-amber-600">LINHA PREMIUM</span>
              <span className="text-xs text-muted-foreground">Produtos de alta qualidade</span>
            </Button>
            <Button 
              type="button" 
              onClick={() => handleAddProductWithLine('comercial')} 
              variant="outline"
              className="flex-1 h-auto py-4 px-6 flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-blue-300 transition-all"
            >
              <span className="text-lg font-semibold text-blue-600">LINHA COMERCIAL</span>
              <span className="text-xs text-muted-foreground">Produtos para uso comercial</span>
            </Button>
            <Button 
              type="button" 
              onClick={() => handleAddProductWithLine('economica')} 
              variant="outline"
              className="flex-1 h-auto py-4 px-6 flex flex-col items-center gap-2 hover:bg-green-50 hover:border-green-300 transition-all"
            >
              <span className="text-lg font-semibold text-green-600">LINHA ECONÔMICA</span>
              <span className="text-xs text-muted-foreground">Produtos custo-benefício</span>
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Lista de Produtos */}
          <div className="space-y-3">
            {products.map((product, index) => {
              // Preço unitário real = total / quantidade (inclui acabamentos e desconto)
              const unitPrice = product.total / product.quantity;
              
              return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="mt-1">
                          #{index + 1}
                        </Badge>
                        <div className="flex-1">
                          <h4 className="font-semibold text-base">
                            {product.productName || 'Produto sem nome'}
                          </h4>
                          {product.codigo && (
                            <p className="text-sm text-muted-foreground">
                              Código: {product.codigo}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Quantidade:</span>
                          <p className="font-medium">{product.quantity} un</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Valor Unit.:</span>
                          <p className="font-medium">
                            R$ {unitPrice.toFixed(2).replace('.', ',')}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Dimensões:</span>
                          <p className="font-medium">
                            {product.larguraCm}x{product.alturaCm}
                            {product.comprimentoCm > 0 && `x${product.comprimentoCm}`} cm
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total:</span>
                          <p className="font-bold text-primary">
                            R$ {product.total.toFixed(2).replace('.', ',')}
                          </p>
                        </div>
                      </div>

                      {/* Atributos adicionais: Modelo, Papel, Laminação */}
                      {(product.modelo || product.paperType || product.lamination) && (
                        <div className="bg-muted/50 rounded-md p-2 space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Especificações:</p>
                          <div className="flex flex-wrap gap-2">
                            {product.modelo && (
                              <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-800">
                                Modelo: {product.modelo}
                              </Badge>
                            )}
                            {product.paperType && (
                              <Badge variant="outline" className="text-xs bg-amber-50 border-amber-200 text-amber-800">
                                Papel: {product.paperType}
                              </Badge>
                            )}
                            {product.lamination && (
                              <Badge variant="outline" className="text-xs bg-purple-50 border-purple-200 text-purple-800">
                                Laminação: {product.lamination}
                                {product.laminationType && ` (${product.laminationType === 'fosco' ? 'Fosco' : 'Brilho'})`}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Acabamentos */}
                      {(product.finishing.hotStamp || product.finishing.ilhos || product.finishing.furoPresente || product.finishing.cordao) && (
                        <div className="flex flex-wrap gap-1">
                          {(() => {
                            const finishingDetails = getFinishingDetailsWithTotal(product.finishing, product.quantity);
                            return finishingDetails.map((detail, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs flex-wrap">
                                {detail.label}
                                {detail.unitValue > 0 && (
                                  <span className="ml-1 text-xs opacity-75">
                                    - R$ {detail.unitValue.toFixed(2).replace('.', ',')}/un × {product.quantity} = R$ {detail.total.toFixed(2).replace('.', ',')}
                                  </span>
                                )}
                              </Badge>
                            ));
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2 self-end sm:self-start">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditProduct(index)}
                        className="hover:bg-primary/10"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      {/* Botão de Acabamentos para sacolas de papel (inclui produtos Kraft e linhas Premium/Comercial/Econômica) */}
                      {(product.codigo?.toLowerCase().startsWith('k-') ||
                        (product.productName?.toLowerCase().includes('sacola') &&
                         product.productName?.toLowerCase().includes('papel')) ||
                        product.productName?.toLowerCase().includes('sacola de papel') ||
                        product.productName?.toLowerCase().includes('kraft') ||
                        product.productName?.toLowerCase().includes('linha premium') ||
                        product.productName?.toLowerCase().includes('linha comercial') ||
                        product.productName?.toLowerCase().includes('linha econômica') ||
                        product.productName?.toLowerCase().includes('linha economica')) && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditFinishing(index)}
                          className="hover:bg-secondary/10"
                          title="Configurar Acabamentos"
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveProduct(index)}
                        className="hover:bg-destructive/10 text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
            })}
          </div>

          {/* Total Geral */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Total do Pedido</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {products.length} {products.length === 1 ? 'produto' : 'produtos'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">
                  R$ {orderTotal.toFixed(2).replace('.', ',')}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal de Acabamentos */}
      <FinishingModal
        open={finishingModalOpen}
        onOpenChange={setFinishingModalOpen}
        product={finishingProductIndex !== null ? products[finishingProductIndex] : emptyProduct}
        onSave={handleSaveFinishing}
      />

      {/* Modal de Produto */}
      <ProductFormModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) setSelectedLine(null); // Resetar linha ao fechar modal
        }}
        item={editingIndex !== null ? products[editingIndex] : emptyProduct}
        onSave={handleSaveProduct}
        selectedLine={selectedLine}
      />
    </div>
  );
}
