import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/componentes/ui/dialog";
import { Button } from "@/componentes/ui/button";
import { Separator } from "@/componentes/ui/separator";
import { Save, X } from "lucide-react";
import type { ProductItem } from "../types";
import type { WooCommerceProduct } from "@/lib/types";
import { ProductSearch } from "./ProductSearch";
import { ProductBasicInfo } from "./ProductBasicInfo";
import { ProductDimensions } from "./ProductDimensions";
import { ProductFinishing } from "./ProductFinishing";
import { calculateFinishingCosts, calculateItemTotal } from "../utils/pricing";
import { useEffect, useState } from "react";
import { getProductVariations } from "@/lib/woocommerce";

interface ProductFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ProductItem | null;
  onSave: (item: ProductItem) => void;
}

interface ProductVariation {
  id: number;
  price: string;
  regular_price: string;
  sale_price: string;
  attributes: Array<{
    name: string;
    option: string;
  }>;
}

export function ProductFormModal({ open, onOpenChange, item, onSave }: ProductFormModalProps) {
  const [editedItem, setEditedItem] = useState<ProductItem | null>(item);
  const [availableImpressionTypes, setAvailableImpressionTypes] = useState<string[]>([]);
  const [availableQuantities, setAvailableQuantities] = useState<number[]>([]);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [priceByQuantity, setPriceByQuantity] = useState<Map<number, number>>(new Map());
  const [isVariableProduct, setIsVariableProduct] = useState(false);

  // Sincronizar com item prop quando mudar
  useEffect(() => {
    setEditedItem(item);
  }, [item]);

  const handleProductSelect = async (product: WooCommerceProduct) => {
    if (!editedItem) return;

    const updatedItem: ProductItem = {
      ...editedItem,
      productId: product.id,
      productName: product.name,
      unitPrice: parseFloat(product.price || '0'),
      codigo: product.sku || '',
      discriminacaoProduto: product.name,
    };

    // Verificar se é produto variável
    const isVariable = product.type === 'variable';
    setIsVariableProduct(isVariable);
    
    console.log('🔍 Produto selecionado:', product.name, '- Tipo:', product.type);

    // Se for produto variável, buscar variações
    if (isVariable) {
      try {
        console.log('📦 Buscando variações do produto...');
        const variations = await getProductVariations(product.id);
        console.log('✅ Variações encontradas:', variations.length);
        
        // Processar variações para extrair quantidades, preços e cores
        const quantityMap = new Map<number, number>();
        const quantitiesSet = new Set<number>();
        const colorsSet = new Set<string>();
        const impressionTypesSet = new Set<string>();
        
        variations.forEach((variation: ProductVariation) => {
          const qtyAttr = variation.attributes.find(attr => {
            const attrName = attr.name.toLowerCase();
            return attrName.includes('quantidade') || attrName.includes('qtd');
          });
          
          const colorAttr = variation.attributes.find(attr => {
            const attrName = attr.name.toLowerCase();
            return attrName.includes('cor de impressão') || 
                   attrName.includes('cor de impressao') ||
                   attrName.includes('cores');
          });
          
          const impressionAttr = variation.attributes.find(attr => {
            const attrName = attr.name.toLowerCase();
            return attrName.includes('tipo de impressão') || 
                   attrName.includes('tipo de impressao') ||
                   attrName.includes('impressão') ||
                   attrName.includes('impressao');
          });
          
          if (qtyAttr) {
            const qty = parseInt(qtyAttr.option.replace(/\D/g, ''));
            if (!isNaN(qty) && qty > 0 && !quantitiesSet.has(qty)) {
              quantitiesSet.add(qty);
              const price = parseFloat(variation.price || variation.regular_price || '0');
              quantityMap.set(qty, price);
              console.log(`  📊 Variação: ${qty} un = R$ ${price}`);
            }
          }
          
          if (colorAttr && colorAttr.option) {
            colorsSet.add(colorAttr.option);
          }
          
          if (impressionAttr && impressionAttr.option) {
            impressionTypesSet.add(impressionAttr.option);
          }
        });
        
        const quantities = Array.from(quantitiesSet).sort((a, b) => a - b);
        const colors = Array.from(colorsSet);
        const impressionTypes = Array.from(impressionTypesSet);
        
        setAvailableQuantities(quantities);
        setPriceByQuantity(quantityMap);
        
        // Definir tipos de impressão disponíveis das variações
        if (impressionTypes.length > 0) {
          setAvailableImpressionTypes(impressionTypes);
          updatedItem.tipoImpressao = impressionTypes[0].toLowerCase();
          console.log('🖨️ Tipos de impressão disponíveis (variações):', impressionTypes);
        }
        
        // Definir cores disponíveis das variações
        if (colors.length > 0) {
          setAvailableColors(colors);
          updatedItem.coresImpressao = colors[0];
          console.log('🎨 Cores de impressão disponíveis (variações):', colors);
        }
        
        if (quantities.length > 0) {
          updatedItem.quantity = quantities[0];
          updatedItem.unitPrice = quantityMap.get(quantities[0]) || 0;
          console.log(`💰 Preço inicial (variável): ${quantities[0]} un = R$ ${updatedItem.unitPrice}`);
        }
        
      } catch (error) {
        console.error('Erro ao buscar variações:', error);
      }
    } else {
      // Produto simples
      console.log('📝 Produto simples - buscando atributos...');
      
      // Pegar "Tipo de Impressão" dos atributos
      const impressionAttr = product.attributes?.find(attr => {
        const attrName = attr.name.toLowerCase();
        const attrSlug = attr.slug?.toLowerCase() || '';
        return attrName.includes('tipo de impressão') || 
               attrName.includes('tipo de impressao') ||
               attrName.includes('impressão') ||
               attrName.includes('impressao') ||
               attrSlug.includes('tipo-de-impressao') ||
               attrSlug.includes('impressao');
      });
      
      console.log('🎨 Atributo de impressão encontrado:', impressionAttr);
      
      if (impressionAttr && impressionAttr.options) {
        setAvailableImpressionTypes(impressionAttr.options);
        updatedItem.tipoImpressao = impressionAttr.options[0]?.toLowerCase() || '';
        console.log('✅ Tipos de impressão disponíveis:', impressionAttr.options);
      }

      // Pegar "Cores de Impressão" dos atributos
      const colorsAttr = product.attributes?.find(attr => {
        const attrName = attr.name.toLowerCase();
        const attrSlug = attr.slug?.toLowerCase() || '';
        return attrName.includes('cor de impressão') || 
               attrName.includes('cor de impressao') ||
               attrName.includes('cores de impressão') ||
               attrName.includes('cores de impressao') ||
               attrName.includes('cores') ||
               attrSlug.includes('cor-de-impressao') ||
               attrSlug.includes('cores-de-impressao') ||
               attrSlug.includes('cores');
      });
      
      console.log('🌈 Atributo de cores encontrado:', colorsAttr);
      
      if (colorsAttr && colorsAttr.options) {
        setAvailableColors(colorsAttr.options);
        updatedItem.coresImpressao = colorsAttr.options[0] || '';
        console.log('✅ Cores de impressão disponíveis:', colorsAttr.options);
      } else {
        setAvailableColors([]);
      }

      // Pegar quantidade disponível do atributo
      const quantityAttr = product.attributes?.find(attr => {
        const attrName = attr.name.toLowerCase();
        return attrName.includes('quantidade') || attrName.includes('qtd');
      });
      
      if (quantityAttr && quantityAttr.options) {
        const quantitiesSet = new Set<number>();
        quantityAttr.options.forEach(q => {
          const qty = parseInt(q.replace(/\D/g, ''));
          if (!isNaN(qty) && qty > 0) {
            quantitiesSet.add(qty);
          }
        });
        const quantities = Array.from(quantitiesSet).sort((a, b) => a - b);
        setAvailableQuantities(quantities);
        if (quantities.length > 0) {
          updatedItem.quantity = quantities[0];
        }
      }

      // Buscar preços por quantidade nos meta_data
      const priceMetaData = product.meta_data?.find(meta => 
        meta.key === 'precos_por_quantidade' || meta.key === '_precos_por_quantidade'
      );
      
      if (priceMetaData && typeof priceMetaData.value === 'string') {
        const priceMap = new Map<number, number>();
        const priceEntries = priceMetaData.value.split('|');
        
        priceEntries.forEach(entry => {
          const [qty, price] = entry.split(':');
          const qtyNum = parseInt(qty);
          const priceNum = parseFloat(price);
          if (!isNaN(qtyNum) && !isNaN(priceNum)) {
            priceMap.set(qtyNum, priceNum);
          }
        });
        
        setPriceByQuantity(priceMap);
        
        if (updatedItem.quantity && priceMap.has(updatedItem.quantity)) {
          updatedItem.unitPrice = priceMap.get(updatedItem.quantity)!;
        }
      } else {
        setPriceByQuantity(new Map());
      }
    }

    // Pegar largura, altura e comprimento dos atributos
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
    
    const lengthAttr = product.attributes?.find(attr => {
      const name = attr.name?.toLowerCase() || '';
      const slug = attr.slug?.toLowerCase() || '';
      return name.includes('comprimento') || name.includes('length') || 
             slug.includes('comprimento') || slug.includes('length');
    });

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
    
    if (lengthAttr?.options?.[0]) {
      const lengthValue = parseFloat(lengthAttr.options[0].replace(',', '.').replace(/[^0-9.]/g, ''));
      if (!isNaN(lengthValue) && lengthValue > 0) {
        updatedItem.comprimentoCm = lengthValue;
      }
    }

    // Se não encontrou nos attributes, tentar nas dimensions
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
    
    if (!updatedItem.comprimentoCm && product.dimensions?.length) {
      const lengthValue = parseFloat(product.dimensions.length.replace(',', '.'));
      if (!isNaN(lengthValue) && lengthValue > 0) {
        updatedItem.comprimentoCm = lengthValue;
      }
    }

    setEditedItem(updatedItem);
  };

  const handleClearProduct = () => {
    if (!editedItem) return;
    
    setAvailableImpressionTypes([]);
    setAvailableQuantities([]);
    setAvailableColors([]);
    setPriceByQuantity(new Map());
    setIsVariableProduct(false);
    
    setEditedItem({
      ...editedItem,
      productId: 0,
      productName: '',
      unitPrice: 0,
      codigo: '',
    });
  };

  const handleUpdate = <K extends keyof ProductItem>(field: K, value: ProductItem[K]) => {
    if (!editedItem) return;
    
    const updatedItem = {
      ...editedItem,
      [field]: value,
    };
    
    // Se mudou a quantidade e temos preços tabelados, atualizar o preço unitário
    if (field === 'quantity' && priceByQuantity.size > 0) {
      const newQuantity = value as number;
      
      if (priceByQuantity.has(newQuantity)) {
        const newPrice = priceByQuantity.get(newQuantity)!;
        updatedItem.unitPrice = newPrice;
      } else {
        // Tentar encontrar o preço mais próximo
        const sortedQtys = Array.from(priceByQuantity.keys()).sort((a, b) => a - b);
        const closestQty = sortedQtys.reduce((prev, curr) => {
          return Math.abs(curr - newQuantity) < Math.abs(prev - newQuantity) ? curr : prev;
        });
        if (closestQty) {
          const closestPrice = priceByQuantity.get(closestQty)!;
          updatedItem.unitPrice = closestPrice;
        }
      }
    }
    
    // Recalcular total
    const total = calculateItemTotal(updatedItem);
    setEditedItem({ ...updatedItem, total });
  };

  // Recalcular total quando os valores mudarem
  useEffect(() => {
    if (editedItem) {
      const total = calculateItemTotal(editedItem);
      if (total !== editedItem.total) {
        setEditedItem({ ...editedItem, total });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editedItem?.unitPrice, editedItem?.quantity, editedItem?.finishing, editedItem?.tipoImpressao]);

  const handleSave = () => {
    if (editedItem) {
      onSave(editedItem);
      onOpenChange(false);
    }
  };

  if (!editedItem) return null;

  const finishingCost = calculateFinishingCosts(editedItem.finishing);
  const unitWithFinishing = editedItem.unitPrice + finishingCost;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {editedItem.productId === 0 ? 'Adicionar Produto' : 'Editar Produto'}
            {isVariableProduct && (
              <span className="ml-2 text-sm text-muted-foreground font-normal">
                (Produto Variável)
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Preencha as informações do produto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <ProductSearch
            item={editedItem}
            onSelect={handleProductSelect}
            onClear={handleClearProduct}
          />

          <Separator />

          <ProductBasicInfo 
            item={editedItem} 
            onUpdate={handleUpdate}
            availableQuantities={availableQuantities}
            availableImpressionTypes={availableImpressionTypes}
            availableColors={availableColors}
          />

          <Separator />

          <ProductDimensions 
            item={editedItem} 
            onUpdate={handleUpdate}
          />

          <Separator />

          <ProductFinishing item={editedItem} onUpdate={handleUpdate} />

          <Separator />

          {/* Resumo de Preços */}
          <div className="bg-primary/5 rounded-md p-4 space-y-2">
            {priceByQuantity.size > 0 && (
              <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-950 rounded border border-blue-200 dark:border-blue-800">
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  📊 Tabela de Preços por Quantidade:
                </p>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {Array.from(priceByQuantity.entries())
                    .sort((a, b) => a[0] - b[0])
                    .map(([qty, price]) => (
                      <div 
                        key={qty} 
                        className={`flex justify-between px-2 py-1 rounded ${
                          editedItem.quantity === qty 
                            ? 'bg-blue-200 dark:bg-blue-900 font-semibold' 
                            : 'bg-blue-100 dark:bg-blue-950'
                        }`}
                      >
                        <span>{qty} un:</span>
                        <span>R$ {price.toFixed(2).replace('.', ',')}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Valor base unitário:</span>
              <span className="font-medium">
                R$ {editedItem.unitPrice.toFixed(2).replace('.', ',')}
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
              <span className="font-medium">{editedItem.quantity} un</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-semibold">
                R$ {(unitWithFinishing * editedItem.quantity).toFixed(2).replace('.', ',')}
              </span>
            </div>
            
            {/* Campo de Desconto */}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground flex-1">Desconto (máx. 11%):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="11"
                    step="0.1"
                    value={editedItem.discountPercent || 0}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      handleUpdate('discountPercent', Math.min(Math.max(value, 0), 11));
                    }}
                    className="w-20 px-2 py-1 text-sm border rounded-md text-center"
                  />
                  <span className="text-sm font-medium">%</span>
                </div>
              </div>
              {editedItem.discountPercent && editedItem.discountPercent > 0 && (
                <div className="flex justify-between text-sm text-destructive">
                  <span>Desconto aplicado:</span>
                  <span className="font-medium">
                    - R$ {((unitWithFinishing * editedItem.quantity) * (editedItem.discountPercent / 100)).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex justify-between text-base pt-2 border-t">
              <span className="font-semibold">Total do Item:</span>
              <span className="font-bold text-lg text-primary">
                R$ {editedItem.total.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!editedItem.productName || editedItem.quantity <= 0}>
            <Save className="w-4 h-4 mr-2" />
            Salvar Produto
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
