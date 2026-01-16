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

// Interface para produtos agrupados por SKU
interface GroupedProduct {
  sku: string;
  products: WooCommerceProduct[];
  paperTypes: string[]; // Laminado, Verniz, Klabin, etc.
}

// Interface para variação com informação do produto pai
interface VariationWithProduct extends WooCommerceProductVariation {
  parentProduct: WooCommerceProduct;
  paperType: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  parent: number;
  count: number;
}

export function ProductNavigator({ onAddProduct, onClose }: ProductNavigatorProps) {
  const [currentStep, setCurrentStep] = useState<NavigationStep>('category');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null); // Sacola de Papel, Sacola Plástica
  const [selectedLine, setSelectedLine] = useState<Category | null>(null); // Linha Premium, Boca Vazada
  const [selectedGroupedProduct, setSelectedGroupedProduct] = useState<GroupedProduct | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<string[]>(['Escolha o Tipo']);

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

  // Extrair categorias principais - usando hierarquia do WooCommerce
  // Nível 1: Categorias de tipo de produto (Sacola de Papel, Sacola Plástica, etc.)
  const mainCategories = (() => {
    if (!allProducts || allProducts.length === 0) return [];

    const categoriesMap = new Map<string, Category>();

    // Primeiro, coletar TODAS as categorias de todos os produtos
    const allCategories: Array<{ id: number; name: string; slug: string }> = [];
    allProducts.forEach((product: WooCommerceProduct) => {
      if (product.categories && product.categories.length > 0) {
        product.categories.forEach((cat) => {
          allCategories.push(cat);
        });
      }
    });

    console.log('🔍 Todas as categorias encontradas:', [...new Set(allCategories.map(c => c.name))]);

    // Identificar categorias que NÃO são linhas (Linha Premium, etc.)
    // Essas são as categorias principais de tipo de produto
    allCategories.forEach((cat) => {
      const catName = cat.name.toLowerCase();

      // Ignorar categorias que são claramente linhas/subcategorias
      const isLine = catName.includes('linha') ||
                     catName.includes('premium') ||
                     catName.includes('comercial') ||
                     catName.includes('econômica') ||
                     catName.includes('economica') ||
                     catName.includes('boca vazada') ||
                     catName.includes('interno') || // Categoria raiz
                     catName.includes('uncategorized') ||
                     catName.includes('sem categoria');

      if (!isLine) {
        categoriesMap.set(cat.name, {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          parent: 0,
          count: 0
        });
      }
    });

    const result = Array.from(categoriesMap.values());
    console.log('📦 Categorias principais encontradas:', result.map(c => c.name));
    return result;
  })();

  // Extrair linhas/subcategorias da categoria selecionada
  // Nível 2: Linhas (Linha Premium, Boca Vazada, etc.)
  const linesInCategory = (() => {
    if (!selectedCategory || !allProducts) return [];

    const linesMap = new Map<string, Category>();

    // Filtrar produtos que pertencem à categoria selecionada
    const categoryProducts = allProducts.filter((product: WooCommerceProduct) => {
      return product.categories?.some((cat) => cat.id === selectedCategory.id);
    });

    console.log('🔍 Produtos na categoria selecionada:', categoryProducts.length);

    categoryProducts.forEach((product: WooCommerceProduct) => {
      if (product.categories && product.categories.length > 0) {
        product.categories.forEach((cat) => {
          // Pegar todas as outras categorias do produto que não são a categoria selecionada
          // e não são categorias raiz
          const catName = cat.name.toLowerCase();
          const isRoot = catName.includes('interno') ||
                         catName.includes('uncategorized') ||
                         catName.includes('sem categoria');

          if (cat.id !== selectedCategory.id && !isRoot) {
            linesMap.set(cat.name, {
              id: cat.id,
              name: cat.name,
              slug: cat.slug,
              parent: selectedCategory.id,
              count: 0
            });
          }
        });
      }
    });

    const result = Array.from(linesMap.values());
    console.log('📦 Linhas encontradas na categoria:', result.map(c => c.name));
    return result;
  })();

  // Filtrar produtos da linha selecionada e agrupar por SKU
  const groupedProducts: GroupedProduct[] = (() => {
    if (!selectedLine || !allProducts) return [];

    const lineProducts = allProducts.filter((product: WooCommerceProduct) => {
      return product.categories?.some((cat) => cat.id === selectedLine.id);
    });

    // Agrupar por SKU (ex: k-034, k-126)
    const grouped = new Map<string, GroupedProduct>();

    lineProducts.forEach((product: WooCommerceProduct) => {
      // Extrair SKU do produto ou do nome
      let sku = product.sku;
      if (!sku) {
        const nameMatch = product.name.match(/^([kK]-\d+)/);
        sku = nameMatch ? nameMatch[1] : `#${product.id}`;
      }
      // Normalizar SKU para lowercase
      const normalizedSku = sku.toLowerCase();

      // Extrair tipo de papel do nome (ex: "Duplex - Laminado", "Duplex Klabin - Verniz")
      const name = product.name;
      let paperType = 'Padrão';

      // Detectar tipo de papel
      if (name.toLowerCase().includes('laminado')) {
        paperType = 'Laminado';
      } else if (name.toLowerCase().includes('verniz')) {
        paperType = 'Verniz';
      }

      // Detectar se é Klabin
      const isKlabin = name.toLowerCase().includes('klabin');
      if (isKlabin) {
        paperType = `Klabin - ${paperType}`;
      }

      if (!grouped.has(normalizedSku)) {
        grouped.set(normalizedSku, {
          sku: sku,
          products: [product],
          paperTypes: [paperType]
        });
      } else {
        const existing = grouped.get(normalizedSku)!;
        existing.products.push(product);
        if (!existing.paperTypes.includes(paperType)) {
          existing.paperTypes.push(paperType);
        }
      }
    });

    return Array.from(grouped.values());
  })();

  // Buscar variações de TODOS os produtos do grupo selecionado
  const { data: allGroupVariations, isLoading: loadingVariations } = useQuery({
    queryKey: ['group-variations', selectedGroupedProduct?.sku],
    queryFn: async () => {
      if (!selectedGroupedProduct) return [];

      // Buscar variações de todos os produtos do grupo em paralelo
      const variationsPromises = selectedGroupedProduct.products.map(async (product) => {
        if (product.type !== 'variable') return [];

        const variations = await getProductVariations(product.id);

        // Extrair tipo de papel do nome do produto
        const name = product.name;
        let paperType = name.replace(/^[kK]-\d+\s*-?\s*/, '').trim();

        // Adicionar informação do produto pai a cada variação
        return variations.map((variation: WooCommerceProductVariation) => ({
          ...variation,
          parentProduct: product,
          paperType,
        }));
      });

      const results = await Promise.all(variationsPromises);
      return results.flat() as VariationWithProduct[];
    },
    enabled: !!selectedGroupedProduct,
    staleTime: 2 * 60 * 1000,
  });

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setBreadcrumb(['Escolha o Tipo', category.name]);
    setCurrentStep('line');
  };

  const handleLineSelect = (line: Category) => {
    setSelectedLine(line);
    setBreadcrumb(['Escolha o Tipo', selectedCategory?.name || '', line.name, 'Produtos']);
    setCurrentStep('product');
  };

  const handleGroupedProductSelect = (grouped: GroupedProduct) => {
    setSelectedGroupedProduct(grouped);

    // Ir direto para variações (com todos os tipos de papel)
    setBreadcrumb([
      'Escolha o Tipo',
      selectedCategory?.name || '',
      selectedLine?.name || '',
      'Produtos',
      grouped.sku,
    ]);
    setCurrentStep('variation');
  };

  const handleVariationSelect = (variation: VariationWithProduct, quantity: number, finishing?: FinishingOptions) => {
    // Extrair atributos da variação
    const attributes: Record<string, string> = {};
    variation.attributes?.forEach((attr) => {
      attributes[attr.name] = attr.option;
    });

    onAddProduct({
      product: variation.parentProduct,
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
      setSelectedGroupedProduct(null);
      setCurrentStep('product');
      setBreadcrumb(['Escolha o Tipo', selectedCategory?.name || '', selectedLine?.name || '', 'Produtos']);
    } else if (currentStep === 'product') {
      setSelectedLine(null);
      setCurrentStep('line');
      setBreadcrumb(['Escolha o Tipo', selectedCategory?.name || '']);
    } else if (currentStep === 'line') {
      setSelectedCategory(null);
      setCurrentStep('category');
      setBreadcrumb(['Escolha o Tipo']);
    }
  };

  return (
    <Card className="w-full">
      {/* Header com navegação */}
      <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {(currentStep === 'variation' || currentStep === 'product' || currentStep === 'line') && (
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
        {/* Step 0: Escolha do Tipo de Produto (Sacola de Papel, Sacola Plástica) */}
        {currentStep === 'category' && (
          <div className="space-y-4">
            {loadingProducts ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Carregando tipos...</p>
              </div>
            ) : productsError ? (
              <div className="text-center py-12">
                <p className="text-destructive mb-4">Erro ao carregar tipos</p>
                <p className="text-sm text-muted-foreground">{String(productsError)}</p>
              </div>
            ) : mainCategories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhum tipo encontrado</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Verifique se os produtos têm categorias configuradas
                </p>
              </div>
            ) : (
              mainCategories.map((category: Category) => (
                <Card
                  key={category.id}
                  onClick={() => handleCategorySelect(category)}
                  className="cursor-pointer hover:bg-accent transition-colors touch-manipulation"
                >
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-center">{category.name}</h3>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Step 1: Escolha da Linha (Linha Premium, Boca Vazada, etc.) */}
        {currentStep === 'line' && (
          <div className="space-y-4">
            {linesInCategory.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhuma linha encontrada</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Verifique se existem subcategorias configuradas
                </p>
              </div>
            ) : (
              linesInCategory.map((line: Category) => (
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

        {/* Step 2: Lista de Produtos Agrupados por SKU (K-034, K-126, etc) */}
        {currentStep === 'product' && (
          <div className="grid grid-cols-2 gap-4">
            {loadingProducts ? (
              <div className="col-span-2 flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Carregando produtos...</p>
              </div>
            ) : groupedProducts && groupedProducts.length > 0 ? (
              groupedProducts.map((grouped: GroupedProduct) => {
                // Pegar a descrição base do primeiro produto (sem variação de papel)
                const firstProduct = grouped.products[0];
                let description = firstProduct.name
                  .replace(/^[kK]-\d+\s*-?\s*/, '') // Remove SKU
                  .replace(/\s*-?\s*(laminado|verniz|klabin)/gi, '') // Remove tipo de papel
                  .replace(/\s*-\s*$/, '') // Remove traços no final
                  .trim();

                // Simplificar descrição se muito longa
                if (description.length > 30) {
                  description = description.split(' - ')[0];
                }

                return (
                  <Card
                    key={grouped.sku}
                    onClick={() => handleGroupedProductSelect(grouped)}
                    className="cursor-pointer hover:bg-accent transition-colors touch-manipulation"
                  >
                    <CardContent className="p-6 flex flex-col items-center justify-center min-h-[120px]">
                      <span className="text-2xl font-bold text-primary">
                        {grouped.sku}
                      </span>
                      {description && (
                        <p className="text-xs text-muted-foreground text-center mt-2 line-clamp-2">
                          {description}
                        </p>
                      )}
                      {grouped.products.length > 1 && (
                        <p className="text-xs text-primary/70 mt-1">
                          {grouped.products.length} variações
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

        {/* Step 3: Variações agrupadas por tipo de papel (Cor/Quantidade) */}
        {currentStep === 'variation' && selectedGroupedProduct && (
          <VariationSelector
            groupedProduct={selectedGroupedProduct}
            variations={allGroupVariations || []}
            loading={loadingVariations}
            onSelect={handleVariationSelect}
          />
        )}
      </CardContent>
    </Card>
  );
}

// Componente para seleção de variações - agrupado por tipo de papel
interface VariationSelectorProps {
  groupedProduct: GroupedProduct;
  variations: VariationWithProduct[];
  loading: boolean;
  onSelect: (variation: VariationWithProduct, quantity: number, finishing?: FinishingOptions) => void;
}

function VariationSelector({ groupedProduct, variations, loading, onSelect }: VariationSelectorProps) {
  const [selectedVariation, setSelectedVariation] = useState<VariationWithProduct | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1000);
  const [showFinishingModal, setShowFinishingModal] = useState(false);
  const [finishing, setFinishing] = useState<FinishingOptions>({
    hotStamp: false,
    ilhos: false,
    furoPresente: false,
    cordao: 'nenhum',
    corCordao: 'nenhum',
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Agrupar variações: primeiro por tipo de papel, depois por cor
  const groupedByPaper = variations.reduce((acc: Record<string, VariationWithProduct[]>, variation) => {
    const paperType = variation.paperType;

    if (!acc[paperType]) {
      acc[paperType] = [];
    }
    acc[paperType].push(variation);

    return acc;
  }, {});

  // Para cada tipo de papel, agrupar por cor
  const paperTypes = Object.keys(groupedByPaper);

  // Cores de fundo para cada tipo de impressão
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

    return 'bg-gray-50 dark:bg-gray-900';
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

  // Extrair cor e quantidade de uma variação
  const extractColorAndQuantity = (variation: VariationWithProduct) => {
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

    return {
      color: colorAttr?.option || 'Padrão',
      quantity: parseInt(quantityAttr?.option?.toString().replace(/\D/g, '') || '1000'),
    };
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
        <h3 className="text-lg font-semibold mb-2">{groupedProduct.sku}</h3>
        <p className="text-sm text-muted-foreground">Selecione o tipo e quantidade</p>
      </div>

      {/* Exibir por tipo de papel */}
      <div className="space-y-6">
        {paperTypes.map((paperType) => {
          const paperVariations = groupedByPaper[paperType];

          // Agrupar por cor dentro deste tipo de papel
          const byColor = paperVariations.reduce((acc: Record<string, VariationWithProduct[]>, variation) => {
            const { color, quantity } = extractColorAndQuantity(variation);

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

          const colors = Object.keys(byColor);

          return (
            <div key={paperType} className="border rounded-lg overflow-hidden">
              {/* Header do tipo de papel */}
              <div className="bg-muted/50 px-4 py-3 border-b">
                <h4 className="font-semibold text-base">{paperType}</h4>
              </div>

              {/* Cores e quantidades */}
              <div className="p-4 space-y-4">
                {colors.map((color) => (
                  <div
                    key={`${paperType}-${color}`}
                    className={`rounded-lg p-3 ${getColorBackground(color)}`}
                  >
                    {/* Título da cor */}
                    <h5 className={`text-sm text-center mb-2 ${getColorTitle(color)}`}>
                      {color.toUpperCase()}
                    </h5>

                    {/* Grid de quantidades e preços */}
                    <div className="grid grid-cols-3 gap-2">
                      {byColor[color]
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
                              className="h-20 flex flex-col items-center justify-center gap-1 text-center touch-manipulation"
                            >
                              <span className="text-xl font-bold">{variation.quantity}</span>
                              <span className="text-xs">{formatCurrency(price)}</span>
                            </Button>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
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
