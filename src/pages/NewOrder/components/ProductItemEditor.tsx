import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { Button } from "@/componentes/ui/button";
import { Separator } from "@/componentes/ui/separator";
import { Trash2 } from "lucide-react";
import type { ProductItem } from "../types";
import type { WooCommerceProduct } from "@/lib/types";
import { ProductSearch } from "./ProductSearch";
import { ProductBasicInfo } from "./ProductBasicInfo";
import { ProductDimensions } from "./ProductDimensions";
import { ProductFinishing } from "./ProductFinishing";
import { calculateFinishingCosts, calculateItemTotal } from "../utils/pricing";
import { useEffect, useState } from "react";

interface ProductItemEditorProps {
  item: ProductItem;
  index: number;
  onUpdate: (index: number, item: ProductItem) => void;
  onRemove: (index: number) => void;
}

export function ProductItemEditor({ item, index, onUpdate, onRemove }: ProductItemEditorProps) {
  const [availableImpressionTypes, setAvailableImpressionTypes] = useState<string[]>([]);
  const [availableQuantities, setAvailableQuantities] = useState<number[]>([]);

  const handleProductSelect = (product: WooCommerceProduct) => {
    const updatedItem: ProductItem = {
      ...item,
      productId: product.id,
      productName: product.name,
      unitPrice: parseFloat(product.price || '0'),
      codigo: product.sku || '',
      discriminacaoProduto: product.name,
    };

    // Pegar "Cor de Impressão" como tipo de impressão
    const impressionAttr = product.attributes?.find(attr => {
      const attrName = attr.name.toLowerCase();
      return attrName.includes('cor de impressão') || attrName.includes('cor de impressao');
    });
    
    if (impressionAttr && impressionAttr.options) {
      setAvailableImpressionTypes(impressionAttr.options);
      // Definir o primeiro como padrão
      updatedItem.tipoImpressao = impressionAttr.options[0]?.toLowerCase() || '';
    }

    // Pegar quantidade disponível do atributo
    const quantityAttr = product.attributes?.find(attr => {
      const attrName = attr.name.toLowerCase();
      return attrName.includes('quantidade') || attrName.includes('qtd');
    });
    
    if (quantityAttr && quantityAttr.options) {
      const quantities = quantityAttr.options
        .map(q => parseInt(q.replace(/\D/g, '')))
        .filter(q => !isNaN(q) && q > 0);
      setAvailableQuantities(quantities);
      if (quantities.length > 0) {
        updatedItem.quantity = quantities[0];
      }
    }

    // Pegar largura e altura dos atributos
    const widthAttr = product.attributes?.find(attr => {
      const slug = attr.slug?.toLowerCase() || '';
      return slug.includes('largura') || slug.includes('width');
    });
    
    const heightAttr = product.attributes?.find(attr => {
      const slug = attr.slug?.toLowerCase() || '';
      return slug.includes('altura') || slug.includes('height');
    });

    if (widthAttr?.options?.[0]) {
      const widthValue = parseFloat(widthAttr.options[0].replace(',', '.'));
      if (!isNaN(widthValue)) {
        updatedItem.larguraCm = widthValue;
      }
    }

    if (heightAttr?.options?.[0]) {
      const heightValue = parseFloat(heightAttr.options[0].replace(',', '.'));
      if (!isNaN(heightValue)) {
        updatedItem.alturaCm = heightValue;
      }
    }

    onUpdate(index, updatedItem);
  };

  const handleClearProduct = () => {
    setAvailableImpressionTypes([]);
    setAvailableQuantities([]);
    onUpdate(index, {
      ...item,
      productId: 0,
      productName: '',
      unitPrice: 0,
      codigo: '',
    });
  };

  const handleUpdate = <K extends keyof ProductItem>(field: K, value: ProductItem[K]) => {
    onUpdate(index, {
      ...item,
      [field]: value,
    });
  };

  // Recalcular total quando os valores mudarem
  useEffect(() => {
    const total = calculateItemTotal(item);
    if (total !== item.total) {
      onUpdate(index, { ...item, total });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.unitPrice, item.quantity, item.finishing, item.tipoImpressao]);

  const finishingCost = calculateFinishingCosts(item.finishing);
  const unitWithFinishing = item.unitPrice + finishingCost;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Produto {index + 1}</CardTitle>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemove(index)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <ProductSearch
          item={item}
          onSelect={handleProductSelect}
          onClear={handleClearProduct}
        />

        <Separator />

        <ProductBasicInfo 
          item={item} 
          onUpdate={handleUpdate}
          availableQuantities={availableQuantities}
        />

        <Separator />

        <ProductDimensions 
          item={item} 
          onUpdate={handleUpdate}
          availableImpressionTypes={availableImpressionTypes}
        />

        <Separator />

        <ProductFinishing item={item} onUpdate={handleUpdate} />

        <Separator />

        {/* Resumo de Preços */}
        <div className="bg-primary/5 rounded-md p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Valor base unitário:</span>
            <span className="font-medium">
              R$ {item.unitPrice.toFixed(2).replace('.', ',')}
            </span>
          </div>
          {finishingCost > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Acabamentos (unitário):</span>
              <span className="font-medium text-primary">
                + R$ {finishingCost.toFixed(2).replace('.', ',')}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm pt-2 border-t">
            <span className="text-muted-foreground">Valor unitário final:</span>
            <span className="font-semibold">
              R$ {unitWithFinishing.toFixed(2).replace('.', ',')}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Quantidade:</span>
            <span className="font-medium">{item.quantity} un</span>
          </div>
          <div className="flex justify-between text-base pt-2 border-t">
            <span className="font-semibold">Total do Item:</span>
            <span className="font-bold text-lg text-primary">
              R$ {item.total.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
