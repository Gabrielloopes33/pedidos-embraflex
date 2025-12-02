import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/componentes/ui/dialog";
import { Button } from "@/componentes/ui/button";
import { Card, CardContent } from "@/componentes/ui/card";
import { Badge } from "@/componentes/ui/badge";
import { Separator } from "@/componentes/ui/separator";
import { Save, X, Plus, Pencil, Trash2, FileDown } from "lucide-react";
import type { ProductionOrder, ProductionProduct } from "@/lib/types";
import type { ProductItem } from "@/pages/NewOrder/types";
import { ProductFormModal } from "@/pages/NewOrder/components/ProductFormModal";
import { downloadOrderPDF } from "@/lib/pdf-generator";
import { toast } from "sonner";

interface OrderEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: ProductionOrder | null;
  onSave?: (updatedOrder: ProductionOrder) => void;
}

// Função para converter ProductionProduct para ProductItem
const convertToProductItem = (product: ProductionProduct): ProductItem => {
  return {
    productId: product.productId,
    productName: product.productName || product.name || '',
    quantity: product.quantity,
    unitPrice: product.unitPrice,
    total: product.unitPrice * product.quantity,
    codigo: product.codigo || '',
    discriminacaoProduto: product.discriminacaoProduto || '',
    larguraCm: parseFloat(product.largura || '0'),
    alturaCm: parseFloat(product.altura || '0'),
    comprimentoCm: parseFloat(product.comprimentoCm || '0'),
    tipoImpressao: product.tipoImpressao || '',
    finishing: {
      hotStamp: product.finishing?.acessorios?.hotStampSacola || false,
      ilhos: product.finishing?.acessorios?.ilhos || false,
      furoPresente: product.furosPresente === 'sim',
      cordao: product.finishing?.cordao === 'colorido' ? 'colorido' : 
              product.finishing?.acessorios?.gorgurinho35cm ? 'gorgurinho' :
              product.finishing?.acessorios?.gorgurao35cm ? 'gorgurão' :
              product.finishing?.acessorios?.sFrancisco35cm ? 'são francisco' :
              product.finishing?.cordao === 'padrão' ? 'padrão' : '',
      corCordao: product.finishing?.corCordao || '',
    },
    discountPercent: product.discountPercent || 0,
  };
};

// Função para converter ProductItem para ProductionProduct
const convertToProductionProduct = (item: ProductItem, existingProduct?: ProductionProduct): ProductionProduct => {
  return {
    id: existingProduct?.id || crypto.randomUUID(),
    productId: item.productId,
    name: item.productName,
    productName: item.productName,
    quantity: item.quantity,
    codigo: item.codigo,
    material: existingProduct?.material || '',
    discriminacaoProduto: item.discriminacaoProduto,
    largura: item.larguraCm.toString(),
    altura: item.alturaCm.toString(),
    lateral: existingProduct?.lateral || '',
    comprimentoCm: item.comprimentoCm.toString(),
    tipoImpressao: item.tipoImpressao,
    laminadoBrilho: existingProduct?.laminadoBrilho || false,
    laminadoFosco: existingProduct?.laminadoFosco || false,
    vernizIE: existingProduct?.vernizIE || false,
    autoMatizada: existingProduct?.autoMatizada || false,
    furosPresente: item.finishing.furoPresente ? 'sim' : 'nao',
    refile: existingProduct?.refile || '',
    finishing: {
      acessorios: {
        gorgurinho35cm: item.finishing.cordao === 'gorgurinho',
        gorgurao35cm: item.finishing.cordao === 'gorgurão',
        sFrancisco35cm: item.finishing.cordao === 'são francisco',
        ilhos: item.finishing.ilhos,
        hotStampSacola: item.finishing.hotStamp,
        hotStampEtiqueta: existingProduct?.finishing?.acessorios?.hotStampEtiqueta || false,
        outros: existingProduct?.finishing?.acessorios?.outros || '',
      },
      cordao: item.finishing.cordao === 'padrão' ? 'padrão' :
              item.finishing.cordao === 'colorido' ? 'colorido' : 'nenhum',
      corCordao: (item.finishing.corCordao || undefined) as 'preto' | 'branco' | 'bege' | undefined,
    },
    unitPrice: item.unitPrice,
    discountPercent: item.discountPercent || 0,
  };
};

export function OrderEditModal({ open, onOpenChange, order, onSave }: OrderEditModalProps) {
  const [editedProducts, setEditedProducts] = useState<ProductItem[]>([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [orderDiscount, setOrderDiscount] = useState<number>(0);

  // Sincronizar produtos quando o pedido mudar
  useEffect(() => {
    if (order) {
      const productItems = order.products.map(convertToProductItem);
      setEditedProducts(productItems);
    }
  }, [order]);

  if (!order) return null;

  // Verificar se o pedido pode ser editado (apenas se status for "Pendente")
  const isEditable = order.status === 'Pendente';
  
  // Log para debug
  console.log('📝 OrderEditModal - Status do pedido:', order.status, '- Editável:', isEditable);

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
      ilhos: false,
      furoPresente: false,
      cordao: '',
      corCordao: '',
    },
  };

  const handleAddProduct = () => {
    setEditingIndex(null);
    setIsProductModalOpen(true);
  };

  const handleEditProduct = (index: number) => {
    setEditingIndex(index);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (product: ProductItem) => {
    if (editingIndex !== null) {
      // Editando produto existente
      const newProducts = [...editedProducts];
      newProducts[editingIndex] = product;
      setEditedProducts(newProducts);
    } else {
      // Adicionando novo produto
      setEditedProducts([...editedProducts, product]);
    }
    setEditingIndex(null);
  };

  const handleRemoveProduct = (index: number) => {
    const newProducts = editedProducts.filter((_, i) => i !== index);
    setEditedProducts(newProducts);
  };

  const handleSaveOrder = () => {
    // Converter produtos de volta para ProductionProduct
    const updatedProductionProducts = editedProducts.map((item, index) => {
      const existingProduct = order.products[index];
      return convertToProductionProduct(item, existingProduct);
    });

    const updatedOrder: ProductionOrder = {
      ...order,
      products: updatedProductionProducts,
    };

    if (onSave) {
      onSave(updatedOrder);
    }

    toast.success("Pedido atualizado com sucesso!");
    onOpenChange(false);
  };

  const handleGeneratePDF = () => {
    try {
      // Convert NewOrder ProductItems to PDF-generator ProductItems
      const pdfProducts = editedProducts.map((item): import('@/lib/pdf-generator').OrderData['produtos'][number] => ({
        id: crypto.randomUUID(),
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        codigo: item.codigo,
        material: '',
        discriminacaoProduto: item.discriminacaoProduto,
        largura: item.larguraCm.toString(),
        altura: item.alturaCm.toString(),
        lateral: '0',
        tipoImpressao: item.tipoImpressao,
        laminadoBrilho: false,
        laminadoFosco: false,
        vernizIE: false,
        autoMatizada: false,
        furosPresente: item.finishing.furoPresente ? 'sim' : 'nao',
        refile: '0',
        finishing: {
          acessorios: {
            gorgurinho35cm: item.finishing.cordao === 'gorgurinho',
            gorgurao35cm: item.finishing.cordao === 'gorgurão',
            sFrancisco35cm: item.finishing.cordao === 'são francisco',
            ilhos: item.finishing.ilhos,
            hotStampSacola: item.finishing.hotStamp,
            hotStampEtiqueta: false,
            outros: '',
          },
          cordao: item.finishing.cordao === 'padrão' ? 'padrão' :
                  item.finishing.cordao === 'colorido' ? 'colorido' : 'nenhum',
          corCordao: (item.finishing.corCordao || undefined) as 'branco' | 'preto' | 'bege' | undefined,
        },
        observacoes: '',
        unitPrice: item.unitPrice,
      }));
      
      const orderPDF = {
        nomeFantasia: order.customerName,
        razaoSocial: order.customerName,
        cpfCnpj: '',
        representante: '',
        produtos: pdfProducts,
        total: editedProducts.reduce((sum, p) => sum + p.total, 0)
      };
      downloadOrderPDF(orderPDF);
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error("Erro ao gerar PDF");
    }
  };

  const orderTotal = editedProducts.reduce((sum, p) => sum + p.total, 0);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-3">
              {isEditable ? 'Editar Pedido' : 'Visualizar Pedido'}
              <Badge variant="outline" className="text-sm font-normal">
                ID: {order.id}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Cliente: {order.customerName}
              {!isEditable && (
                <span className="block mt-1 text-amber-600 dark:text-amber-400 font-semibold">
                  ⚠️ Este pedido não pode ser editado pois está em {order.status}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Informações do Pedido */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className="mt-1">{order.status}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Prioridade</p>
                <Badge variant={order.priority === 'Urgente' ? 'destructive' : 'default'} className="mt-1">
                  {order.priority}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Produtos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Produtos do Pedido</h3>
                  <p className="text-sm text-muted-foreground">
                    {editedProducts.length} {editedProducts.length === 1 ? 'produto' : 'produtos'}
                  </p>
                </div>
                {isEditable && (
                  <Button type="button" onClick={handleAddProduct} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Produto
                  </Button>
                )}
              </div>

              {editedProducts.length === 0 ? (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <p className="text-muted-foreground mb-4">
                    Nenhum produto no pedido
                  </p>
                  {isEditable && (
                    <Button type="button" onClick={handleAddProduct} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Produto
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {editedProducts.map((product, index) => (
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
                          {isEditable && (
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
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Total Geral */}
              {editedProducts.length > 0 && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 mt-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-primary/20">
                    <div>
                      <p className="text-sm text-muted-foreground">Subtotal do Pedido</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {editedProducts.length} {editedProducts.length === 1 ? 'produto' : 'produtos'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-semibold text-foreground">
                        R$ {orderTotal.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>
                  
                  {/* Campo de Desconto */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-muted-foreground">Desconto (máx. 11%):</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="11"
                          step="0.1"
                          value={orderDiscount}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setOrderDiscount(Math.min(Math.max(value, 0), 11));
                          }}
                          disabled={!isEditable}
                          className="w-20 px-3 py-1.5 text-sm border rounded-md text-center font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <span className="text-sm font-medium">%</span>
                      </div>
                    </div>
                    {orderDiscount > 0 && (
                      <div className="flex justify-between text-sm text-destructive">
                        <span>Desconto aplicado:</span>
                        <span className="font-semibold">
                          - R$ {(orderTotal * (orderDiscount / 100)).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-primary/20">
                    <div>
                      <p className="text-base font-semibold text-foreground">Valor Total do Pedido</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-primary">
                        R$ {(orderTotal * (1 - orderDiscount / 100)).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="flex justify-between gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={handleGeneratePDF}
              disabled={editedProducts.length === 0}
            >
              <FileDown className="w-4 h-4 mr-2" />
              Gerar PDF
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                <X className="w-4 h-4 mr-2" />
                Fechar
              </Button>
              {isEditable && (
                <Button onClick={handleSaveOrder} disabled={editedProducts.length === 0}>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Produto */}
      <ProductFormModal
        open={isProductModalOpen}
        onOpenChange={setIsProductModalOpen}
        item={editingIndex !== null ? editedProducts[editingIndex] : emptyProduct}
        onSave={handleSaveProduct}
      />
    </>
  );
}
