// ProductNavigator - Navegação hierárquica de produtos (Categoria → Subcategoria → Produto → Variações)
import { useState } from 'react';
import { Button } from '@/componentes/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card';
import { ChevronLeft, Loader2, X } from 'lucide-react';
import { getProducts, getProductVariations } from '@/lib/woocommerce';
import type { WooCommerceProduct } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { FinishingModal, FinishingOptions } from './FinishingModal';

interface ProductNavigatorProps {
  onAddProduct: (config: ProductConfig) => void;
  onClose: () => void;
}

interface WooCommerceProductVariation {
  id: number;
  price: string;
  attributes: Array<{
    name: string;
    option: string;
  }>;
  quantity?: number;
  color?: string;
}

export interface ProductConfig {
  product: WooCommerceProduct;
  variationId?: number;
  quantity: number;
  price: number;
  color?: string;
  attributes?: Record<string, string>;
  finishing?: FinishingOptions;
}

type NavigationStep = 'line' | 'category' | 'subcategory' | 'product' | 'variation';

interface Category {
  id: number;
  name: string;
  slug: string;
  parent: number;
  count: number;
}

export function ProductNavigator({ onAddProduct, onClose }: ProductNavigatorProps) {
  const [currentStep, setCurrentStep] = useState<NavigationStep>('line');
  const [selectedLine, setSelectedLine] = useState<Category | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<WooCommerceProduct | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<string[]>(['Escolha a Linha']);

  // Buscar TODOS os produtos (ao invés de categorias)
  const { data: allProducts, isLoading: loadingProducts, error: productsError } = useQuery({
    queryKey: ['all-products-navigator'],
    queryFn: async () => {
      console.log('🔍 Buscando todos os produtos...');
      const result = await getProducts({ per_page: 100, orderby: 'menu_order', order: 'asc' });
      console.log('✅ Produtos recebidos:', result?.length || 0);
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Extrair linhas únicas das categorias dos produtos
  const mainCategories = (() => {
    if (!allProducts || allProducts.length === 0) return [];
    
    const linesSet = new Set<string>();
    const linesMap = new Map<string, Category>();
    
    allProducts.forEach((product: WooCommerceProduct) => {
      if (product.categories && product.categories.length > 0) {
        product.categories.forEach((cat) => {
          const catName = cat.name.toLowerCase();
          // Procurar por categorias que são linhas
          if (catName.includes('linha') || 
              catName.includes('premium') || 
              catName.includes('comercial') ||
              catName.includes('econômica') ||
              catName.includes('economica')) {
            // Adicionar apenas se não for uma quantidade
            if (!catName.match(/\d+\s*unidades?/i)) {
              linesSet.add(cat.name);
              linesMap.set(cat.name, {
                id: cat.id,
                name: cat.name,
                slug: cat.slug,
                parent: 0,
                count: 0
              });
            }
          }
        });
      }
    });
    
    const result = Array.from(linesMap.values());
    console.log('📦 Linhas encontradas nos produtos:', result.map(c => c.name));
    return result;
  })();

  // Filtrar produtos da linha selecionada
  const products = (() => {
    if (!selectedLine || !allProducts) return [];
    
    return allProducts.filter((product: WooCommerceProduct) => {
      return product.categories?.some((cat) => cat.id === selectedLine.id);
    });
  })();

  // Buscar variações do produto selecionado
  const { data: variations, isLoading: loadingVariations } = useQuery({
    queryKey: ['variations', selectedProduct?.id],
    queryFn: () => getProductVariations(selectedProduct!.id),
    enabled: !!selectedProduct && selectedProduct.type === 'variable',
    staleTime: 2 * 60 * 1000,
  });

  const handleLineSelect = (line: Category) => {
    setSelectedLine(line);
    setBreadcrumb(['Escolha a Linha', line.name, 'Produtos']);
    setCurrentStep('product');
  };

  const handleProductSelect = (product: WooCommerceProduct) => {
    setSelectedProduct(product);
    setBreadcrumb([
      'Escolha a Linha',
      selectedLine?.name || '',
      'Produtos',
      product.name,
    ]);

    // Se o produto tem variações, mostrar tela de variações
    if (product.type === 'variable') {
      setCurrentStep('variation');
    } else {
      // Produto simples - adicionar diretamente
      onAddProduct({
        product,
        quantity: 1000, // Quantidade padrão
        price: parseFloat(product.price) || 0,
      });
      onClose();
    }
  };

  const handleVariationSelect = (variation: WooCommerceProductVariation, quantity: number, finishing?: FinishingOptions) => {
    if (!selectedProduct) return;

    // Extrair atributos da variação
    const attributes: Record<string, string> = {};
    variation.attributes?.forEach((attr) => {
      attributes[attr.name] = attr.option;
    });

    onAddProduct({
      product: selectedProduct,
      variationId: variation.id,
      quantity,
      price: parseFloat(variation.price) || 0,
      color: attributes['Cor'] || attributes['cor'] || attributes['Color'],
      attributes,
      finishing,
    });
    onClose();
  };

  const handleBack = () => {
    if (currentStep === 'variation') {
      setSelectedProduct(null);
      setCurrentStep('product');
      setBreadcrumb(['Escolha a Linha', selectedLine?.name || '', 'Produtos']);
    } else if (currentStep === 'product') {
      setSelectedLine(null);
      setCurrentStep('line');
      setBreadcrumb(['Escolha a Linha']);
    }
  };

  return (
    <Card className="w-full">
      {/* Header com navegação */}
      <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {(currentStep === 'variation' || currentStep === 'product') && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="text-primary-foreground hover:bg-primary-foreground/20 h-12 w-12 touch-manipulation"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            )}
            <div>
              <CardTitle className="text-xl">{breadcrumb[breadcrumb.length - 1]}</CardTitle>
              {breadcrumb.length > 1 && (
                <p className="text-sm text-primary-foreground/80 mt-1">
                  {breadcrumb.slice(0, -1).join(' → ')}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-primary-foreground hover:bg-primary-foreground/20 h-12 w-12 touch-manipulation"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Step 1: Escolha da Linha (Comercial, Premium, Econômica) */}
        {currentStep === 'line' && (
          <div className="space-y-4">
            {loadingProducts ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Carregando linhas...</p>
              </div>
            ) : productsError ? (
              <div className="text-center py-12">
                <p className="text-destructive mb-4">Erro ao carregar linhas</p>
                <p className="text-sm text-muted-foreground">{String(productsError)}</p>
              </div>
            ) : mainCategories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhuma linha encontrada</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Verifique se os produtos têm categorias de linha
                </p>
              </div>
            ) : (
              mainCategories.map((line: Category) => (
                <Card
                  key={line.id}
                  onClick={() => handleLineSelect(line)}
                  className="cursor-pointer hover:bg-accent transition-colors touch-manipulation"
                >
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-center">{line.name}</h3>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Step 2: Lista de Produtos (Códigos K-034, K-038, etc) */}
        {currentStep === 'product' && (
          <div className="grid grid-cols-2 gap-4">
            {loadingProducts ? (
              <div className="col-span-2 flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Carregando produtos...</p>
              </div>
            ) : products && products.length > 0 ? (
              products.map((product: WooCommerceProduct) => {
                // Usar o SKU do WooCommerce, ou extrair do nome
                let sku = product.sku;
                
                // Se não tiver SKU, tentar extrair do nome (formato: "k-034 - Descrição...")
                if (!sku) {
                  const nameMatch = product.name.match(/^([kK]-\d+)/);
                  sku = nameMatch ? nameMatch[1] : `#${product.id}`;
                }
                
                // Remover o SKU do nome para pegar só a descrição
                const description = product.name
                  .replace(product.sku || '', '')
                  .replace(/^[kK]-\d+/, '')
                  .replace(/^[\s-]+/, '')
                  .trim();
                
                return (
                  <Card
                    key={product.id}
                    onClick={() => handleProductSelect(product)}
                    className="cursor-pointer hover:bg-accent transition-colors touch-manipulation"
                  >
                    <CardContent className="p-6 flex flex-col items-center justify-center min-h-[120px]">
                      <span className="text-2xl font-bold text-primary">
                        {sku}
                      </span>
                      {description && (
                        <p className="text-xs text-muted-foreground text-center mt-2 line-clamp-2">
                          {description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-2 text-center py-12 text-muted-foreground">
                Nenhum produto encontrado
              </div>
            )}
          </div>
        )}

        {/* Step 3: Variações (Cor/Quantidade) */}
        {currentStep === 'variation' && selectedProduct && (
          <VariationSelector
            product={selectedProduct}
            variations={variations || []}
            loading={loadingVariations}
            onSelect={handleVariationSelect}
          />
        )}
      </CardContent>
    </Card>
  );
}

// Componente para seleção de variações
interface VariationSelectorProps {
  product: WooCommerceProduct;
  variations: WooCommerceProductVariation[];
  loading: boolean;
  onSelect: (variation: WooCommerceProductVariation, quantity: number, finishing?: FinishingOptions) => void;
}

function VariationSelector({ product, variations, loading, onSelect }: VariationSelectorProps) {
  const [selectedVariation, setSelectedVariation] = useState<WooCommerceProductVariation | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1000);
  const [showFinishingModal, setShowFinishingModal] = useState(false);
  const [finishing, setFinishing] = useState<FinishingOptions>({
    hotStamp: false,
    ilhos: false,
    furoPresente: false,
    cordao: 'nenhum',
    corCordao: 'nenhum',
  });

  console.log('🔧 VariationSelector - Produto:', product.name);
  console.log('🔧 VariationSelector - Total variações:', variations?.length || 0);
  console.log('🔧 VariationSelector - Variações recebidas:', variations);
  console.log('🔧 VariationSelector - Loading:', loading);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Agrupar variações por cor e quantidade
  const groupedVariations = variations.reduce((acc: Record<string, WooCommerceProductVariation[]>, variation) => {
    // Log detalhado dos atributos de CADA variação
    console.log('🔍 Analisando variação ID:', variation.id);
    console.log('  📋 Atributos:', variation.attributes);
    variation.attributes?.forEach((attr, index) => {
      console.log(`  ➡️ Atributo ${index + 1}:`, {
        name: attr.name,
        nameLower: attr.name.toLowerCase(),
        option: attr.option
      });
    });
    
    const colorAttr = variation.attributes?.find(
      (attr) => {
        const nameLower = attr.name.toLowerCase();
        return nameLower === 'cor' || 
               nameLower === 'color' ||
               nameLower.includes('cor de impressão') ||
               nameLower.includes('cor de impressao') ||
               nameLower.includes('tipo de impressão') ||
               nameLower.includes('tipo de impressao') ||
               nameLower.includes('impressao');
      }
    );
    const quantityAttr = variation.attributes?.find(
      (attr) => attr.name.toLowerCase() === 'quantidade' || 
                     attr.name.toLowerCase() === 'quantity' ||
                     attr.name.toLowerCase() === 'qtd'
    );

    const color = colorAttr?.option || 'Padrão';
    const quantity = parseInt(quantityAttr?.option?.toString().replace(/\D/g, '') || '1000');

    console.log('  ✅ Resultado:', { 
      colorAttr: colorAttr ? `${colorAttr.name} = ${colorAttr.option}` : 'NÃO ENCONTRADO',
      quantityAttr: quantityAttr ? `${quantityAttr.name} = ${quantityAttr.option}` : 'NÃO ENCONTRADO',
      color, 
      quantity, 
      price: variation.price
    });
    console.log('  ---');

    if (!acc[color]) {
      acc[color] = [];
    }

    acc[color].push({
      ...variation,
      quantity,
      color,
    });

    return acc;
  }, {});

  const colors = Object.keys(groupedVariations);
  
  console.log('🎨 Cores encontradas:', colors);
  console.log('📦 Variações agrupadas:', groupedVariations);

  // Cores de fundo para cada tipo (bem claras)
  const getColorBackground = (color: string) => {
    const lowerColor = color.toLowerCase();
    
    if (lowerColor.includes('preto') || lowerColor.includes('black')) {
      return 'bg-slate-100 dark:bg-slate-900';
    }
    if (lowerColor.includes('policromia') || lowerColor.includes('colorido')) {
      return 'bg-pink-100 dark:bg-pink-900/30';
    }
    if (lowerColor.includes('pantone') || lowerColor.includes('cyan')) {
      return 'bg-cyan-100 dark:bg-cyan-900/30';
    }
    if (lowerColor.includes('padrão') || lowerColor.includes('padrao')) {
      return 'bg-gray-100 dark:bg-gray-900';
    }
    
    return 'bg-muted';
  };

  // Cor do texto do título
  const getColorTitle = (color: string) => {
    const lowerColor = color.toLowerCase();
    
    if (lowerColor.includes('preto') || lowerColor.includes('black')) {
      return 'text-slate-800 dark:text-slate-100 font-bold';
    }
    if (lowerColor.includes('policromia') || lowerColor.includes('colorido')) {
      return 'text-pink-700 dark:text-pink-300 font-bold';
    }
    if (lowerColor.includes('pantone') || lowerColor.includes('cyan')) {
      return 'text-cyan-700 dark:text-cyan-300 font-bold';
    }
    
    return 'text-foreground font-bold';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
        <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
      </div>

      {/* Exibir todas as cores/tipos em layout vertical */}
      <div className="space-y-4">
        {colors.map((color) => (
          <div 
            key={color} 
            className={`rounded-lg p-4 ${getColorBackground(color)} border-2 border-transparent hover:border-primary/20 transition-all`}
          >
            {/* Título da seção */}
            <h4 className={`text-base text-center mb-3 ${getColorTitle(color)}`}>
              {color.toUpperCase()}
            </h4>

            {/* Grid de quantidades e preços */}
            <div className="grid grid-cols-3 gap-3">
              {groupedVariations[color]
                .sort((a, b) => (a.quantity || 0) - (b.quantity || 0))
                .map((variation) => {
                  const price = parseFloat(variation.price) || 0;
                  const isSelected = selectedVariation?.id === variation.id;
                  
                  return (
                    <Button
                      key={variation.id}
                      variant={isSelected ? 'default' : 'outline'}
                      onClick={() => {
                        setSelectedVariation(variation);
                        setSelectedQuantity(variation.quantity || 1000);
                      }}
                      className="h-24 flex flex-col items-center justify-center gap-1 text-center touch-manipulation"
                    >
                      <span className="text-2xl font-bold">{variation.quantity}</span>
                      <span className="text-sm">{formatCurrency(price)}</span>
                    </Button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      {/* Botão de adicionar */}
      {selectedVariation && (
        <div className="space-y-3">
          {/* Botão Adicionar Acabamento */}
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowFinishingModal(true)}
            className="w-full h-14 text-base font-semibold touch-manipulation"
          >
            {finishing.hotStamp || finishing.ilhos || finishing.furoPresente || finishing.cordao !== 'nenhum'
              ? '✓ Acabamentos Selecionados'
              : 'Adicionar Acabamento'}
          </Button>

          {/* Botão Adicionar ao Pedido */}
          <Button
            size="lg"
            onClick={() => onSelect(selectedVariation, selectedQuantity, finishing)}
            className="w-full h-16 text-lg font-semibold touch-manipulation"
          >
            Adicionar ao Pedido
          </Button>
        </div>
      )}

      {/* Modal de Acabamentos */}
      <FinishingModal
        open={showFinishingModal}
        onOpenChange={setShowFinishingModal}
        onConfirm={(newFinishing) => {
          setFinishing(newFinishing);
        }}
        initialFinishing={finishing}
        quantity={selectedQuantity}
      />
    </div>
  );
}
