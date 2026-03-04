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
import { calculateFinishingCosts, calculateItemTotal, getFinishingDetailsWithTotal } from "../utils/pricing";
import { useEffect, useState } from "react";
import { getProductVariations } from "@/lib/woocommerce";

interface ProductItemEditorProps {
  item: ProductItem;
  index: number;
  onUpdate: (index: number, item: ProductItem) => void;
  onRemove: (index: number) => void;
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

export function ProductItemEditor({ item, index, onUpdate, onRemove }: ProductItemEditorProps) {
  const [availableImpressionTypes, setAvailableImpressionTypes] = useState<string[]>([]);
  const [availableQuantities, setAvailableQuantities] = useState<number[]>([]);
  const [priceByQuantity, setPriceByQuantity] = useState<Map<number, number>>(new Map());
  // Novo mapa que considera quantidade + tipo de impressão: "1000_policromia" => preço
  const [priceByQtyAndType, setPriceByQtyAndType] = useState<Map<string, number>>(new Map());
  const [isVariableProduct, setIsVariableProduct] = useState(false);

  const handleProductSelect = async (product: WooCommerceProduct) => {
    const updatedItem: ProductItem = {
      ...item,
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
        
        // Processar variações para extrair quantidades, tipos de impressão e preços
        const quantityMap = new Map<number, number>();
        const quantitiesSet = new Set<number>(); // Usar Set para evitar duplicatas
        const impressionTypesSet = new Set<string>();
        const qtyAndTypePriceMap = new Map<string, number>(); // "1000_policromia" => preço
        
        variations.forEach((variation: ProductVariation) => {
          // Procurar atributo de quantidade
          const qtyAttr = variation.attributes.find(attr => {
            const attrName = attr.name.toLowerCase();
            return attrName.includes('quantidade') || attrName.includes('qtd');
          });
          
          // Procurar atributo de tipo de impressão
          const impressionAttr = variation.attributes.find(attr => {
            const attrName = attr.name.toLowerCase();
            const attrSlug = attr.name?.toLowerCase() || '';
            return attrName.includes('tipo de impressão') || 
                   attrName.includes('tipo de impressao') ||
                   attrName.includes('impressão') ||
                   attrName.includes('impressao') ||
                   attrSlug.includes('tipo-de-impressao');
          });
          
          if (qtyAttr) {
            const qty = parseInt(qtyAttr.option.replace(/\D/g, ''));
            const price = parseFloat(variation.price || variation.regular_price || '0');
            
            if (!isNaN(qty) && qty > 0) {
              quantitiesSet.add(qty);
              
              if (impressionAttr) {
                // Tem tipo de impressão - usar chave composta
                const impressionType = impressionAttr.option.toLowerCase().trim();
                impressionTypesSet.add(impressionType);
                const key = `${qty}_${impressionType}`;
                qtyAndTypePriceMap.set(key, price);
                console.log(`  📊 Variação: ${qty} un + ${impressionType} = R$ ${price}`);
              } else {
                // Sem tipo de impressão - usar só quantidade
                quantityMap.set(qty, price);
                console.log(`  📊 Variação: ${qty} un = R$ ${price}`);
              }
            }
          }
        });
        
        // Converter Sets para Arrays e ordenar
        const quantities = Array.from(quantitiesSet).sort((a, b) => a - b);
        const impressionTypes = Array.from(impressionTypesSet);
        
        setAvailableQuantities(quantities);
        setPriceByQuantity(quantityMap);
        setPriceByQtyAndType(qtyAndTypePriceMap);
        
        if (impressionTypes.length > 0) {
          setAvailableImpressionTypes(impressionTypes);
          updatedItem.tipoImpressao = impressionTypes[0];
        }
        
        // Definir quantidade e preço inicial
        if (quantities.length > 0) {
          updatedItem.quantity = quantities[0];
          
          // Buscar preço considerando tipo de impressão se disponível
          if (updatedItem.tipoImpressao && qtyAndTypePriceMap.size > 0) {
            const key = `${quantities[0]}_${updatedItem.tipoImpressao}`;
            updatedItem.unitPrice = qtyAndTypePriceMap.get(key) || quantityMap.get(quantities[0]) || 0;
            console.log(`💰 Preço inicial (variável com tipo): ${quantities[0]} un + ${updatedItem.tipoImpressao} = R$ ${updatedItem.unitPrice}`);
          } else {
            updatedItem.unitPrice = quantityMap.get(quantities[0]) || 0;
            console.log(`💰 Preço inicial (variável): ${quantities[0]} un = R$ ${updatedItem.unitPrice}`);
          }
        }
        
      } catch (error) {
        console.error('Erro ao buscar variações:', error);
      }
    } else {
      // Produto simples - usar lógica anterior
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

      // Pegar quantidade disponível do atributo
      const quantityAttr = product.attributes?.find(attr => {
        const attrName = attr.name.toLowerCase();
        return attrName.includes('quantidade') || attrName.includes('qtd');
      });
      
      if (quantityAttr && quantityAttr.options) {
        // Usar Set para evitar duplicatas
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

      // Buscar preços por quantidade nos meta_data do produto
      const priceMetaData = product.meta_data?.find(meta => 
        meta.key === 'precos_por_quantidade' || meta.key === '_precos_por_quantidade'
      );
      
      console.log('🔍 Procurando preços por quantidade no meta_data...');
      
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
        
        // Definir o preço inicial baseado na primeira quantidade
        if (updatedItem.quantity && priceMap.has(updatedItem.quantity)) {
          updatedItem.unitPrice = priceMap.get(updatedItem.quantity)!;
          console.log(`💰 Preço inicial: ${updatedItem.quantity} un = R$ ${updatedItem.unitPrice}`);
        }
      } else {
        console.log('⚠️ Meta data de preços NÃO encontrado');
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
    
    if (lengthAttr?.options?.[0]) {
      const lengthValue = parseFloat(lengthAttr.options[0].replace(',', '.').replace(/[^0-9.]/g, ''));
      if (!isNaN(lengthValue) && lengthValue > 0) {
        updatedItem.comprimentoCm = lengthValue;
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
    
    if (!updatedItem.comprimentoCm && product.dimensions?.length) {
      const lengthValue = parseFloat(product.dimensions.length.replace(',', '.'));
      if (!isNaN(lengthValue) && lengthValue > 0) {
        updatedItem.comprimentoCm = lengthValue;
      }
    }

    // Extrair atributos de MODELO, PAPEL e LAMINAÇÃO
    // Modelo: pode ser atributo "Modelo", "Tamanho" ou "Medida"
    const modelAttr = product.attributes?.find(attr => {
      const name = attr.name?.toLowerCase() || '';
      const slug = attr.slug?.toLowerCase() || '';
      return name.includes('modelo') || name.includes('model') || 
             name.includes('tamanho') || name.includes('medida') ||
             slug.includes('modelo') || slug.includes('model');
    });
    
    if (modelAttr?.options?.[0]) {
      updatedItem.modelo = modelAttr.options[0];
    }

    // Papel: atributo "PAPEL" ou "Tipo de Papel"
    const paperAttr = product.attributes?.find(attr => {
      const name = attr.name?.toLowerCase() || '';
      const slug = attr.slug?.toLowerCase() || '';
      return name.includes('papel') || name === 'paper' ||
             slug.includes('papel') || slug.includes('paper');
    });
    
    if (paperAttr?.options?.[0]) {
      updatedItem.paperType = paperAttr.options[0];
    }

    // Laminação: pode ser inferida do nome ou atributo específico
    const laminationAttr = product.attributes?.find(attr => {
      const name = attr.name?.toLowerCase() || '';
      const slug = attr.slug?.toLowerCase() || '';
      return name.includes('lamina') || name.includes('verniz') || name.includes('acabamento') ||
             slug.includes('lamina') || slug.includes('verniz') || slug.includes('acabamento');
    });
    
    if (laminationAttr?.options?.[0]) {
      updatedItem.lamination = laminationAttr.options[0];
    } else {
      // Tentar inferir do nome do produto
      const productNameLower = product.name?.toLowerCase() || '';
      if (productNameLower.includes('laminado') && productNameLower.includes('brilho')) {
        updatedItem.lamination = 'Laminado Brilho';
      } else if (productNameLower.includes('laminado') && productNameLower.includes('fosco')) {
        updatedItem.lamination = 'Laminado Fosco';
      } else if (productNameLower.includes('verniz')) {
        updatedItem.lamination = 'Verniz';
      } else if (productNameLower.includes('laminado')) {
        updatedItem.lamination = 'Laminado';
      }
    }

    onUpdate(index, updatedItem);
  };

  const handleClearProduct = () => {
    setAvailableImpressionTypes([]);
    setAvailableQuantities([]);
    setPriceByQuantity(new Map());
    setPriceByQtyAndType(new Map());
    setIsVariableProduct(false);
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
    
    // Se mudou a quantidade OU tipo de impressão, recalcular o preço
    if ((field === 'quantity' || field === 'tipoImpressao') && (priceByQtyAndType.size > 0 || priceByQuantity.size > 0)) {
      const newQuantity = field === 'quantity' ? (value as number) : item.quantity;
      const newImpressionType = field === 'tipoImpressao' ? (value as string) : item.tipoImpressao;
      
      console.log('🔄 Mudança detectada:', field, '=', value);
      console.log('📊 Buscando preço para: quantidade =', newQuantity, '+ tipo =', newImpressionType);
      
      // Primeiro, tentar buscar preço com quantidade + tipo de impressão
      if (newImpressionType && priceByQtyAndType.size > 0) {
        const key = `${newQuantity}_${newImpressionType.toLowerCase()}`;
        console.log('🔍 Buscando chave:', key);
        console.log('📋 Chaves disponíveis:', Array.from(priceByQtyAndType.keys()));
        
        if (priceByQtyAndType.has(key)) {
          const newPrice = priceByQtyAndType.get(key)!;
          console.log('✅ Preço encontrado (quantidade + tipo):', newPrice);
          updatedItem.unitPrice = newPrice;
        } else {
          console.log('⚠️ Preço não encontrado para', key);
        }
      }
      // Se não encontrou com tipo de impressão, tentar só com quantidade
      else if (priceByQuantity.has(newQuantity)) {
        const newPrice = priceByQuantity.get(newQuantity)!;
        console.log('✅ Preço encontrado (só quantidade):', newPrice);
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
  }, [item.unitPrice, item.quantity, item.finishing, item.tipoImpressao, item.discountPercent]);

  const finishingCost = calculateFinishingCosts(item.finishing);
  const unitWithFinishing = item.unitPrice + finishingCost;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">
          Produto {index + 1}
          {isVariableProduct && (
            <span className="ml-2 text-xs text-muted-foreground font-normal">
              (Produto Variável)
            </span>
          )}
        </CardTitle>
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
          {(priceByQtyAndType.size > 0 || priceByQuantity.size > 0) && (
            <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-950 rounded border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">
                📊 Tabela de Preços:
              </p>
              <div className="grid grid-cols-1 gap-1 text-xs">
                {/* Mostrar preços com quantidade + tipo de impressão */}
                {priceByQtyAndType.size > 0 && Array.from(priceByQtyAndType.entries())
                  .sort((a, b) => {
                    const [qtyA] = a[0].split('_');
                    const [qtyB] = b[0].split('_');
                    return parseInt(qtyA) - parseInt(qtyB);
                  })
                  .map(([key, price]) => {
                    const [qty, type] = key.split('_');
                    const isSelected = item.quantity === parseInt(qty) && item.tipoImpressao === type;
                    return (
                      <div 
                        key={key} 
                        className={`flex justify-between px-2 py-1 rounded ${
                          isSelected
                            ? 'bg-blue-200 dark:bg-blue-900 font-semibold' 
                            : 'bg-blue-100 dark:bg-blue-950'
                        }`}
                      >
                        <span>{qty} un + {type}:</span>
                        <span>R$ {price.toFixed(2).replace('.', ',')}</span>
                      </div>
                    );
                  })}
                
                {/* Mostrar preços só com quantidade (se não houver tipo de impressão) */}
                {priceByQtyAndType.size === 0 && Array.from(priceByQuantity.entries())
                  .sort((a, b) => a[0] - b[0])
                  .map(([qty, price]) => (
                    <div 
                      key={qty} 
                      className={`flex justify-between px-2 py-1 rounded ${
                        item.quantity === qty 
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
              R$ {item.unitPrice.toFixed(2).replace('.', ',')}
            </span>
          </div>
          {finishingCost > 0 && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Acabamentos (total):</span>
                <span className="font-medium text-primary">
                  + R$ {(finishingCost * item.quantity).toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="pl-4 space-y-1">
                {getFinishingDetailsWithTotal(item.finishing, item.quantity).map((detail, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-muted-foreground">
                    <span>{detail.label}:</span>
                    <span>R$ {detail.unitValue.toFixed(2).replace('.', ',')}/un × {item.quantity} = R$ {detail.total.toFixed(2).replace('.', ',')}</span>
                  </div>
                ))}
              </div>
            </>
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
