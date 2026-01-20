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
  displayName?: string; // Nome completo para exibição (ex: "Boca Vazada - 25x35 cm")
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
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null); // Sacola de Papel, Caixa, etc.
  const [selectedLine, setSelectedLine] = useState<Category | null>(null); // Linha Premium, Boca Vazada
  const [selectedGroupedProduct, setSelectedGroupedProduct] = useState<GroupedProduct | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<string[]>(['Escolha a Categoria']);

  // Buscar TODOS os produtos
  const { data: allProducts, isLoading: loadingProducts, error: productsError } = useQuery({
    queryKey: ['all-products-navigator'],
    queryFn: async () => {
      console.log('🔍 Buscando todos os produtos...');
      const result = await getProducts({ per_page: 100, orderby: 'menu_order', order: 'asc' });
      console.log('✅ Produtos recebidos:', result?.length || 0);
      // Log detalhado das categorias de cada produto
      result?.forEach((p: WooCommerceProduct) => {
        console.log(`📦 ${p.name} -> Categorias:`, p.categories?.map(c => c.name));
      });
      return result;
    },
    staleTime: 1 * 60 * 1000, // 1 minuto
  });

  // Categorias principais extraídas dos produtos (Sacola de Papel, Sacolas Plásticas, etc.)
  // Detectamos pelo nome que contém "Sacola" ou outras palavras-chave de categoria principal
  const mainCategories = (() => {
    if (!allProducts || allProducts.length === 0) return [];

    const categoriesMap = new Map<number, Category>();

    allProducts.forEach((product: WooCommerceProduct) => {
      product.categories?.forEach((cat) => {
        const catName = cat.name.toLowerCase();

        // Ignorar categorias genéricas e subcategorias (linhas, quantidades, tamanhos, segmentos)
        const isGenericOrSubcategory =
          catName.includes('interno') ||
          catName.includes('uncategorized') ||
          catName.includes('sem categoria') ||
          catName.includes('linha ') ||  // Linha Premium, Linha Econômica, etc.
          catName.includes('boca vazada') ||  // Subcategoria de sacolas plásticas
          catName.match(/^\d+\s*unidades?$/) ||  // 50 unidades, 100 unidades, etc.
          catName.match(/^[pmg]$/) ||  // P, M, G (tamanhos)
          // Categorias de segmento/nicho
          catName.includes('joalheria') ||
          catName.includes('clínicas') ||
          catName.includes('óticas') ||
          catName.includes('infantil') ||
          catName.includes('vestuário') ||
          catName.includes('moda íntima') ||
          catName.includes('enxovais');

        if (!isGenericOrSubcategory) {
          categoriesMap.set(cat.id, {
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            parent: 0,
            count: 1
          });
        }
      });
    });

    const result = Array.from(categoriesMap.values());
    console.log('📦 Categorias principais:', result.map(c => c.name));
    return result;
  })();

  // Linhas disponíveis para a categoria selecionada (Linha Premium, Linha Econômica, Boca Vazada, etc.)
  // Extraídas dos produtos que pertencem à categoria selecionada
  const availableLines = (() => {
    if (!allProducts || allProducts.length === 0 || !selectedCategory) return [];

    const linesMap = new Map<number, Category>();

    // Filtrar produtos que pertencem à categoria selecionada
    const categoryProducts = allProducts.filter((product: WooCommerceProduct) =>
      product.categories?.some(cat => cat.id === selectedCategory.id)
    );

    // Extrair as outras categorias desses produtos (que são as linhas)
    categoryProducts.forEach((product: WooCommerceProduct) => {
      product.categories?.forEach((cat) => {
        // Pular a categoria principal (já selecionada)
        if (cat.id === selectedCategory.id) return;

        const catName = cat.name.toLowerCase();

        // Ignorar categorias genéricas
        const isGeneric = catName.includes('interno') ||
                          catName.includes('uncategorized') ||
                          catName.includes('sem categoria');

        if (!isGeneric) {
          linesMap.set(cat.id, {
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            parent: selectedCategory.id,
            count: 1
          });
        }
      });
    });

    const result = Array.from(linesMap.values());
    console.log('📦 Linhas disponíveis para', selectedCategory.name, ':', result.map(c => c.name));
    return result;
  })();

  // Filtrar produtos da linha selecionada (ou categoria, se não houver linha) e agrupar por SKU
  const groupedProducts: GroupedProduct[] = (() => {
    if (!allProducts) return [];
    // Se não tem linha nem categoria selecionada, não mostrar nada
    if (!selectedLine && !selectedCategory) return [];

    // Filtrar por linha se existir, senão por categoria
    const filterCategory = selectedLine || selectedCategory;
    const lineProducts = allProducts.filter((product: WooCommerceProduct) => {
      return product.categories?.some((cat) => cat.id === filterCategory!.id);
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

  // Função auxiliar para calcular linhas disponíveis para uma categoria
  const getLinesForCategory = (category: Category) => {
    if (!allProducts || allProducts.length === 0) return [];

    const linesMap = new Map<number, Category>();
    const categoryProducts = allProducts.filter((product: WooCommerceProduct) =>
      product.categories?.some(cat => cat.id === category.id)
    );

    categoryProducts.forEach((product: WooCommerceProduct) => {
      product.categories?.forEach((cat) => {
        if (cat.id === category.id) return;

        const catName = cat.name.toLowerCase();
        const isGeneric = catName.includes('interno') ||
                          catName.includes('uncategorized') ||
                          catName.includes('sem categoria');

        if (!isGeneric) {
          linesMap.set(cat.id, {
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            parent: category.id,
            count: 1
          });
        }
      });
    });

    return Array.from(linesMap.values());
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);

    // Verificar se há linhas disponíveis para esta categoria
    const lines = getLinesForCategory(category);

    if (lines.length === 0) {
      // Sem linhas - pular direto para produtos
      setSelectedLine(null);
      setBreadcrumb(['Escolha a Categoria', category.name, 'Produtos']);
      setCurrentStep('product');
    } else {
      // Com linhas - mostrar seleção de linha
      setBreadcrumb(['Escolha a Categoria', category.name, 'Escolha a Linha']);
      setCurrentStep('line');
    }
  };

  const handleLineSelect = (line: Category) => {
    setSelectedLine(line);
    setBreadcrumb(['Escolha a Categoria', selectedCategory?.name || '', line.name, 'Produtos']);
    setCurrentStep('product');
  };

  const handleGroupedProductSelect = (grouped: GroupedProduct) => {
    setSelectedGroupedProduct(grouped);

    // Ir direto para variações (com todos os tipos de papel)
    // Filtrar valores vazios para quando não há linha
    setBreadcrumb([
      'Escolha a Categoria',
      selectedCategory?.name,
      selectedLine?.name,
      grouped.sku,
    ].filter(Boolean) as string[]);
    setCurrentStep('variation');
  };

  const handleVariationSelect = (variation: VariationWithProduct, quantity: number, finishing?: FinishingOptions, displayName?: string) => {
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
      displayName, // Nome completo para exibição
    });
    onClose();
  };

  const handleBack = () => {
    if (currentStep === 'variation') {
      setSelectedGroupedProduct(null);
      setCurrentStep('product');
      setBreadcrumb(['Escolha a Categoria', selectedCategory?.name || '', selectedLine?.name || '', 'Produtos'].filter(Boolean));
    } else if (currentStep === 'product') {
      // Se não tinha linha (pulou direto da categoria), voltar para categoria
      if (!selectedLine) {
        setSelectedCategory(null);
        setCurrentStep('category');
        setBreadcrumb(['Escolha a Categoria']);
      } else {
        setSelectedLine(null);
        setCurrentStep('line');
        setBreadcrumb(['Escolha a Categoria', selectedCategory?.name || '', 'Escolha a Linha']);
      }
    } else if (currentStep === 'line') {
      setSelectedCategory(null);
      setCurrentStep('category');
      setBreadcrumb(['Escolha a Categoria']);
    }
  };

  return (
    <Card className="w-full">
      {/* Header com navegação */}
      <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentStep !== 'category' && (
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
        {/* Step 1: Escolha da Categoria (Sacola de Papel, Sacola de Plástico, etc.) */}
        {currentStep === 'category' && (
          <div className="space-y-4">
            {loadingProducts ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Carregando categorias...</p>
              </div>
            ) : productsError ? (
              <div className="text-center py-12">
                <p className="text-destructive mb-4">Erro ao carregar categorias</p>
                <p className="text-sm text-muted-foreground">{String(productsError)}</p>
              </div>
            ) : mainCategories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhuma categoria encontrada</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Verifique as categorias no WooCommerce
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

        {/* Step 2: Escolha da Linha (Linha Premium, Boca Vazada, etc.) */}
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
            ) : availableLines.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhuma linha encontrada</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Verifique as subcategorias no WooCommerce
                </p>
              </div>
            ) : (
              availableLines.map((line: Category) => (
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

        {/* Step 3: Lista de Produtos Agrupados por SKU (K-034, K-126, etc) */}
        {currentStep === 'product' && (
          <div className="grid grid-cols-2 gap-4">
            {loadingProducts ? (
              <div className="col-span-2 flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Carregando produtos...</p>
              </div>
            ) : productsError ? (
              <div className="col-span-2 text-center py-12">
                <p className="text-destructive mb-4">Erro ao carregar produtos</p>
                <p className="text-sm text-muted-foreground">{String(productsError)}</p>
              </div>
            ) : groupedProducts && groupedProducts.length > 0 ? (
              groupedProducts.map((grouped: GroupedProduct) => {
                const firstProduct = grouped.products[0];

                // Verificar se é sacola plástica (não tem SKU k-XXX)
                const isPlasticBag = !grouped.sku.toLowerCase().startsWith('k-');

                // Para sacolas plásticas: usar o nome do produto (medidas)
                // Para sacolas de papel: usar o SKU
                const displayName = isPlasticBag
                  ? firstProduct.name // Ex: "15x25/20x30 cm"
                  : grouped.sku;      // Ex: "k-034"

                return (
                  <Card
                    key={grouped.sku}
                    onClick={() => handleGroupedProductSelect(grouped)}
                    className="cursor-pointer hover:bg-accent transition-colors touch-manipulation"
                  >
                    <CardContent className="p-6 flex flex-col items-center justify-center min-h-[120px]">
                      <span className="text-2xl font-bold text-primary text-center">
                        {displayName}
                      </span>
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

        {/* Step 4: Variações agrupadas por tipo de papel (Cor/Quantidade) */}
        {currentStep === 'variation' && selectedGroupedProduct && (
          <VariationSelector
            groupedProduct={selectedGroupedProduct}
            variations={allGroupVariations || []}
            loading={loadingVariations}
            onSelect={handleVariationSelect}
            lineName={selectedLine?.name || selectedCategory?.name}
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
  onSelect: (variation: VariationWithProduct, quantity: number, finishing?: FinishingOptions, displayName?: string) => void;
  lineName?: string | null;
}

function VariationSelector({ groupedProduct, variations, loading, onSelect, lineName }: VariationSelectorProps) {
  const [pendingVariation, setPendingVariation] = useState<VariationWithProduct | null>(null);
  const [pendingModel, setPendingModel] = useState<string | undefined>(undefined);
  const [showFinishingModal, setShowFinishingModal] = useState(false);
  const [finishing, setFinishing] = useState<FinishingOptions>({
    hotStamp: false,
    ilhos: false,
    furoPresente: false,
    cordao: 'nenhum',
    corCordao: 'nenhum',
  });

  // Construir nome completo para exibição
  const buildDisplayName = (variation: VariationWithProduct, modelName?: string) => {
    // Se tem lineName e modelo, combinar os dois
    if (lineName && modelName) {
      return `${lineName} - ${modelName}`;
    }
    // Se só tem lineName, usar com o nome do produto
    if (lineName) {
      return `${lineName} - ${variation.parentProduct.name}`;
    }
    // Fallback: usar nome do produto pai
    return variation.parentProduct.name;
  };

  // Ao clicar em uma quantidade, adiciona direto ao pedido
  const handleQuantityClick = (variation: VariationWithProduct, modelName?: string) => {
    // Se já tiver acabamentos selecionados, usa eles
    const hasFinishing = finishing.hotStamp || finishing.ilhos || finishing.furoPresente || finishing.cordao !== 'nenhum';
    const displayName = buildDisplayName(variation, modelName);
    onSelect(variation, variation.quantity || 1000, hasFinishing ? finishing : undefined, displayName);
  };

  // Para adicionar acabamento antes de selecionar
  const handleFinishingClick = (variation: VariationWithProduct) => {
    setPendingVariation(variation);
    setShowFinishingModal(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // DETECÇÃO AUTOMÁTICA: Contar quantos tipos de atributos diferentes existem nas variações
  // Se 2 critérios → layout simplificado (como sacola plástica)
  // Se 3+ critérios → layout completo (como sacola de papel)
  const uniqueAttributeNames = (() => {
    const names = new Set<string>();
    variations.forEach((variation) => {
      variation.attributes?.forEach((attr) => {
        // Normalizar nomes para evitar duplicatas
        const normalizedName = attr.name.toLowerCase().trim();
        names.add(normalizedName);
      });
    });
    return Array.from(names);
  })();

  // Verificar se tem múltiplos paperTypes (indica produto com hierarquia tipo papel)
  const uniquePaperTypes = [...new Set(variations.map(v => v.paperType))];

  // Usar layout simplificado se:
  // - Tem exatamente 2 tipos de atributos (ex: MODELO + QUANTIDADE)
  // - OU tem apenas 1 paperType E 2 ou menos tipos de atributos
  const useSimplifiedLayout = uniqueAttributeNames.length <= 2 && uniquePaperTypes.length === 1;

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

    // Buscar atributo de quantidade (quantidade, metros, etc.)
    const quantityAttr = variation.attributes?.find(
      (attr) => {
        const nameLower = attr.name.toLowerCase();
        return nameLower === 'quantidade' ||
               nameLower === 'quantity' ||
               nameLower === 'qtd' ||
               nameLower === 'metros' ||
               nameLower === 'mts' ||
               nameLower.includes('metro');
      }
    );

    // Extrair valor numérico para ordenação e manter label original para exibição
    const quantityOption = quantityAttr?.option?.toString() || '';
    const quantityNumber = parseInt(quantityOption.replace(/\D/g, '') || '1000');
    const quantityLabel = quantityOption || quantityNumber.toString();

    return {
      color: colorAttr?.option || 'Padrão',
      quantity: quantityNumber,
      quantityLabel: quantityLabel, // Para exibição (ex: "50 mts")
    };
  };

  // Extrair MODELO e QUANTIDADE para layout simplificado (2 critérios)
  const extractModelAndQuantity = (variation: VariationWithProduct) => {
    // Buscar primeiro atributo que não seja quantidade (será o MODELO)
    const modelAttr = variation.attributes?.find(
      (attr) => {
        const nameLower = attr.name.toLowerCase();
        // Excluir atributos de quantidade
        const isQuantity = nameLower === 'quantidade' ||
                           nameLower === 'quantity' ||
                           nameLower === 'qtd' ||
                           nameLower === 'metros' ||
                           nameLower === 'mts' ||
                           nameLower.includes('metro');
        return !isQuantity;
      }
    );

    // Buscar atributo de quantidade
    const quantityAttr = variation.attributes?.find(
      (attr) => {
        const nameLower = attr.name.toLowerCase();
        return nameLower === 'quantidade' ||
               nameLower === 'quantity' ||
               nameLower === 'qtd' ||
               nameLower === 'metros' ||
               nameLower === 'mts' ||
               nameLower.includes('metro');
      }
    );

    const quantityOption = quantityAttr?.option?.toString() || '';
    const quantityNumber = parseInt(quantityOption.replace(/\D/g, '') || '1000');
    const quantityLabel = quantityOption || quantityNumber.toString();

    return {
      model: modelAttr?.option || 'Padrão',
      modelName: modelAttr?.name || 'Modelo',
      quantity: quantityNumber,
      quantityLabel: quantityLabel,
    };
  };

  // Para layout simplificado: agrupar por MODELO
  const groupedByModel = (() => {
    if (!useSimplifiedLayout) return {};

    return variations.reduce((acc: Record<string, (VariationWithProduct & { quantity: number; quantityLabel: string })[]>, variation) => {
      const { model, quantity, quantityLabel } = extractModelAndQuantity(variation);

      if (!acc[model]) {
        acc[model] = [];
      }
      acc[model].push({
        ...variation,
        quantity,
        quantityLabel,
      });

      return acc;
    }, {});
  })();

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
        <h3 className="text-lg font-semibold mb-2">{lineName || groupedProduct.sku}</h3>
        <p className="text-sm text-muted-foreground">Selecione o tipo e quantidade</p>
      </div>

      {/* LAYOUT SIMPLIFICADO: Para produtos com 2 critérios (MODELO + QUANTIDADE) */}
      {useSimplifiedLayout ? (
        <div className="space-y-4">
          {Object.keys(groupedByModel).map((model) => {
            const modelVariations = groupedByModel[model].sort((a, b) => (a.quantity || 0) - (b.quantity || 0));
            const count = modelVariations.length;
            // Se tem 2 ou menos, usa 2 colunas; se tem 3+, usa 3 colunas
            const gridCols = count <= 2 ? 'grid-cols-2' : 'grid-cols-3';

            return (
              <div key={model} className="border rounded-lg overflow-hidden">
                {/* Header do modelo */}
                <div className="bg-muted/50 px-4 py-3 border-b">
                  <h4 className="font-semibold text-base text-center">{model}</h4>
                </div>

                {/* Grid de quantidades e preços */}
                <div className="p-4">
                  <div className={`grid ${gridCols} gap-2`}>
                    {modelVariations.map((variation) => {
                      const price = parseFloat(variation.price) || 0;

                      return (
                        <Button
                          key={variation.id}
                          variant="outline"
                          onClick={() => handleQuantityClick(variation, model)}
                          className="h-20 flex flex-col items-center justify-center gap-1 text-center touch-manipulation hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          <span className="text-xl font-bold">{variation.quantityLabel || variation.quantity}</span>
                          <span className="text-xs">{formatCurrency(price)}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LAYOUT COMPLETO: Para produtos com 3+ critérios (como sacola de papel) */
        <div className="space-y-6">
          {paperTypes.map((paperType) => {
            const paperVariations = groupedByPaper[paperType];

            // Agrupar por cor dentro deste tipo de papel
            const byColor = paperVariations.reduce((acc: Record<string, (VariationWithProduct & { quantityLabel?: string })[]>, variation) => {
              const { color, quantity, quantityLabel } = extractColorAndQuantity(variation);

              if (!acc[color]) {
                acc[color] = [];
              }
              acc[color].push({
                ...variation,
                quantity,
                color,
                quantityLabel,
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

                      {/* Grid de quantidades e preços - ajusta colunas baseado na quantidade */}
                      {(() => {
                        const sortedVariations = byColor[color].sort((a, b) => (a.quantity || 0) - (b.quantity || 0));
                        const count = sortedVariations.length;
                        // Se tem 2 ou menos, usa 2 colunas; se tem 3+, usa 3 colunas
                        const gridCols = count <= 2 ? 'grid-cols-2' : 'grid-cols-3';

                        return (
                          <div className={`grid ${gridCols} gap-2`}>
                            {sortedVariations.map((variation) => {
                              const price = parseFloat(variation.price) || 0;

                              return (
                                <Button
                                  key={variation.id}
                                  variant="outline"
                                  onClick={() => handleQuantityClick(variation, paperType)}
                                  className="h-20 flex flex-col items-center justify-center gap-1 text-center touch-manipulation hover:bg-primary hover:text-primary-foreground transition-colors"
                                >
                                  <span className="text-xl font-bold">{variation.quantityLabel || variation.quantity}</span>
                                  <span className="text-xs">{formatCurrency(price)}</span>
                                </Button>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Botão para configurar acabamentos (opcional, antes de selecionar) - apenas para sacola de PAPEL (SKU começa com k-) */}
      {groupedProduct.sku.toLowerCase().startsWith('k-') && (
        <div className="pt-4 border-t">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowFinishingModal(true)}
            className="w-full h-12 text-sm font-medium touch-manipulation"
          >
            {finishing.hotStamp || finishing.ilhos || finishing.furoPresente || finishing.cordao !== 'nenhum'
              ? '✓ Acabamentos configurados (clique na quantidade para adicionar)'
              : '⚙️ Configurar acabamentos antes de adicionar'}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Clique em uma quantidade acima para adicionar ao pedido
          </p>
        </div>
      )}

      {/* Modal de Acabamentos */}
      <FinishingModal
        open={showFinishingModal}
        onOpenChange={setShowFinishingModal}
        onConfirm={(newFinishing) => {
          setFinishing(newFinishing);
          // Se tinha uma variação pendente, adiciona ao pedido com o acabamento
          if (pendingVariation) {
            const displayName = buildDisplayName(pendingVariation, pendingModel);
            onSelect(pendingVariation, pendingVariation.quantity || 1000, newFinishing, displayName);
            setPendingVariation(null);
            setPendingModel(undefined);
          }
        }}
        initialFinishing={finishing}
        quantity={pendingVariation?.quantity || 1000}
      />
    </div>
  );
}
