import { Button } from "@/componentes/ui/button";
import { Card, CardContent } from "@/componentes/ui/card";
import { Badge } from "@/componentes/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { ProductItem } from "../types";
import { ProductFormModal } from "./ProductFormModal";
import { calculateOrderTotal } from "../utils/pricing";
import { useState } from "react";

interface ProductsStepProps {
  products: ProductItem[];
  onUpdateProducts: (products: ProductItem[]) => void;
}

export function ProductsStep({ products, onUpdateProducts }: ProductsStepProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

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
    coresImpressao: '',
    finishing: {
      hotStamp: false,
      ilhos: false,
      furoPresente: false,
      cordao: '',
      corCordao: '',
    },
  };

  const handleAddProduct = () => {
    setEditingIndex(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (index: number) => {
    setEditingIndex(index);
    setIsModalOpen(true);
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
  };

  const handleRemoveProduct = (index: number) => {
    const newProducts = products.filter((_, i) => i !== index);
    onUpdateProducts(newProducts);
  };

  const orderTotal = calculateOrderTotal(products);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Produtos do Pedido</h3>
          <p className="text-sm text-muted-foreground">
            Adicione os produtos que fazem parte deste pedido
          </p>
        </div>
        <Button type="button" onClick={handleAddProduct} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Produto
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-12 text-center">
          <p className="text-muted-foreground mb-4">
            Nenhum produto adicionado ainda
          </p>
          <Button type="button" onClick={handleAddProduct} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Primeiro Produto
          </Button>
        </div>
      ) : (
        <>
          {/* Lista de Produtos */}
          <div className="space-y-3">
            {products.map((product, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
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
                            R$ {product.unitPrice.toFixed(2).replace('.', ',')}
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

                      {/* Acabamentos */}
                      {(product.finishing.hotStamp || product.finishing.ilhos || product.finishing.furoPresente || product.finishing.cordao) && (
                        <div className="flex flex-wrap gap-1">
                          {product.finishing.hotStamp && (
                            <Badge variant="secondary" className="text-xs">Hot Stamp</Badge>
                          )}
                          {product.finishing.ilhos && (
                            <Badge variant="secondary" className="text-xs">Ilhós</Badge>
                          )}
                          {product.finishing.furoPresente && (
                            <Badge variant="secondary" className="text-xs">Furo de Presente</Badge>
                          )}
                          {product.finishing.cordao && (
                            <Badge variant="secondary" className="text-xs">
                              Cordão: {product.finishing.cordao}
                              {product.finishing.corCordao && ` (${product.finishing.corCordao})`}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditProduct(index)}
                        className="hover:bg-primary/10"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
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
            ))}
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

      {/* Modal de Produto */}
      <ProductFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        item={editingIndex !== null ? products[editingIndex] : emptyProduct}
        onSave={handleSaveProduct}
      />
    </div>
  );
}
