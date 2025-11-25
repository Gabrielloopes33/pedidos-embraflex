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
  const [priceByQuantity, setPriceByQuantity] = useState<Map<number, number>>(new Map());

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

    // Buscar preços por quantidade nos meta_data do produto
    // Formato esperado: "1000:2.22|1500:2.10|3000:2.01"
    const priceMetaData = product.meta_data?.find(meta => 
      meta.key === 'precos_por_quantidade' || meta.key === '_precos_por_quantidade'
    );
    
    console.log('🔍 Procurando preços por quantidade no produto:', product.name);
    console.log('📦 Meta data do produto:', product.meta_data);
    
    if (priceMetaData && typeof priceMetaData.value === 'string') {
      console.log('✅ Meta data de preços encontrado:', priceMetaData.value);
      const priceMap = new Map<number, number>();
      const priceEntries = priceMetaData.value.split('|');
      
      priceEntries.forEach(entry => {
        const [qty, price] = entry.split(':');
        const qtyNum = parseInt(qty);
        const priceNum = parseFloat(price);
        if (!isNaN(qtyNum) && !isNaN(priceNum)) {
          priceMap.set(qtyNum, priceNum);
          console.log(`  📊 Adicionado: ${qtyNum} un = R$ ${priceNum}`);
        }
      });
      
      setPriceByQuantity(priceMap);
      console.log('✅ Tabela de preços carregada:', Array.from(priceMap.entries()));
      
      // Definir o preço inicial baseado na primeira quantidade
      if (updatedItem.quantity && priceMap.has(updatedItem.quantity)) {
        updatedItem.unitPrice = priceMap.get(updatedItem.quantity)!;
        console.log(`💰 Preço inicial definido: ${updatedItem.quantity} un = R$ ${updatedItem.unitPrice}`);
      }
    } else {
      console.log('⚠️ Meta data de preços NÃO encontrado');
      setPriceByQuantity(new Map()); // Limpar mapa se não houver preços
    }

    // Pegar largura e altura dos atributos
    const widthAttr = product.attributes?.find(attr => {
      const name = attr.name?.toLowerCase() || '';
      const slug = attr.slug?.toLowerCase() || '';
      return name.includes('largura') || name.includes('width') || 
             slug.includes('largura') || slug.includes('width');
    });
    
    const heightAttr = product.attributes?.find(attr => {
      const name = attr.name?.toLowerCase() || '';
      const slug = attr.slug?.toLowerCase() || '';
      return name.includes('altura') || name.includes('height') || 
             slug.includes('altura') || slug.includes('height');
    });

    // Tentar pegar dos attributes primeiro
    if (widthAttr?.options?.[0]) {
      const widthValue = parseFloat(widthAttr.options[0].replace(',', '.').replace(/[^0-9.]/g, ''));
      if (!isNaN(widthValue) && widthValue > 0) {
        updatedItem.larguraCm = widthValue;
      }
    }

    if (heightAttr?.options?.[0]) {
      const heightValue = parseFloat(heightAttr.options[0].replace(',', '.').replace(/[^0-9.]/g, ''));
      if (!isNaN(heightValue) && heightValue > 0) {
        updatedItem.alturaCm = heightValue;
      }
    }

    // Se não encontrou nos attributes, tentar nas dimensions do produto
    if (!updatedItem.larguraCm && product.dimensions?.width) {
      const widthValue = parseFloat(product.dimensions.width.replace(',', '.'));
      if (!isNaN(widthValue) && widthValue > 0) {
        updatedItem.larguraCm = widthValue;
      }
    }

    if (!updatedItem.alturaCm && product.dimensions?.height) {
      const heightValue = parseFloat(product.dimensions.height.replace(',', '.'));
      if (!isNaN(heightValue) && heightValue > 0) {
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
    const updatedItem = {
      ...item,
      [field]: value,
    };
    
    // Se mudou a quantidade e temos preços tabelados, atualizar o preço unitário
    if (field === 'quantity' && priceByQuantity.size > 0) {
      const newQuantity = value as number;
      console.log('🔄 Mudança de quantidade detectada:', newQuantity);
      console.log('📊 Tabela de preços disponível:', Array.from(priceByQuantity.entries()));
      
      if (priceByQuantity.has(newQuantity)) {
        const newPrice = priceByQuantity.get(newQuantity)!;
        console.log('✅ Preço encontrado para quantidade', newQuantity, ':', newPrice);
        updatedItem.unitPrice = newPrice;
      } else {
        console.log('⚠️ Preço não encontrado para quantidade', newQuantity);
      }
    }
    
    // Recalcular total imediatamente
    const total = calculateItemTotal(updatedItem);
    console.log('💰 Total recalculado:', total, 'para item:', updatedItem);
    onUpdate(index, { ...updatedItem, total });
  };

  // Recalcular total quando os valores mudarem (backup)
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
          availableImpressionTypes={availableImpressionTypes}
        />

        <Separator />

        <ProductDimensions 
          item={item} 
          onUpdate={handleUpdate}
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
