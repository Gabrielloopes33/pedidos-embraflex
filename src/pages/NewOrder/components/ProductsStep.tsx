import { Button } from "@/componentes/ui/button";
import { Plus } from "lucide-react";
import type { ProductItem } from "../types";
import { ProductItemEditor } from "./ProductItemEditor";
import { calculateOrderTotal } from "../utils/pricing";

interface ProductsStepProps {
  products: ProductItem[];
  onUpdateProducts: (products: ProductItem[]) => void;
}

export function ProductsStep({ products, onUpdateProducts }: ProductsStepProps) {
  const handleAddProduct = () => {
    const newProduct: ProductItem = {
      productId: 0,
      productName: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
      codigo: '',
      discriminacaoProduto: '',
      larguraCm: 0,
      alturaCm: 0,
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

    onUpdateProducts([...products, newProduct]);
  };

  const handleUpdateProduct = (index: number, updatedProduct: ProductItem) => {
    const newProducts = [...products];
    newProducts[index] = updatedProduct;
    onUpdateProducts(newProducts);
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
          <div className="space-y-4">
            {products.map((product, index) => (
              <ProductItemEditor
                key={index}
                item={product}
                index={index}
                onUpdate={handleUpdateProduct}
                onRemove={handleRemoveProduct}
              />
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
    </div>
  );
}
