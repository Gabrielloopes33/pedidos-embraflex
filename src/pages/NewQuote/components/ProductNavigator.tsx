// ProductNavigator - Navegação hierárquica de produtos (Categoria → Subcategoria → Produto → Variações)
// v2.2 - Etapa de seleção de tipo de papel para Sacolas de Papel
console.log('🚀 ProductNavigator v2.2 carregado - com etapa de seleção de tipo de papel');

import { useState, useEffect } from 'react';
import { Button } from '@/componentes/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card';
import { ChevronLeft, Loader2, X } from 'lucide-react';
import { getProducts as getProductsFromWC, getProductVariations } from '@/lib/woocommerce';
import { getCachedProducts } from '@/lib/supabase';
import type { WooCommerceProduct, CachedProduct } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { FinishingModal, FinishingOptions } from './FinishingModal';

// Converter CachedProduct para WooCommerceProduct
const convertCachedProduct = (cached: CachedProduct): WooCommerceProduct => ({
  id: cached.id,
  name: cached.name,
  slug: cached.name.toLowerCase().replace(/\s+/g, '-'),
  permalink: '',
  type: cached.type || 'simple', // Usar o type do cache (simple, variable, grouped, external)
  status: 'publish',
  description: cached.description || '',
  short_description: cached.short_description || '',
  sku: cached.sku || '',
  price: cached.price?.toString() || '0',
  regular_price: cached.regular_price?.toString() || '0',
  sale_price: '',
  on_sale: false,
  stock_status: cached.stock_status || 'instock',
  stock_quantity: cached.stock_quantity,
  categories: cached.categories || [],
  images: cached.images || [],
  attributes: cached.attributes || [],
  dimensions: { length: '', width: '', height: '' },
  meta_data: cached.meta_data || [],
});

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
  paperType?: string; // Tipo de papel selecionado (ex: "Kraft", "Duplex")
}

type NavigationStep = 'line' | 'category' | 'subcategory' | 'product' | 'paperType' | 'variation';

// Interface para produtos agrupados por SKU
interface GroupedProduct {
  sku: string;
  products: WooCommerceProduct[];
  paperTypes: string[]; // Laminado, Verniz, Klabin, etc.
  model?: string; // opcional: usado para grupos criados por Modelo (ex: sacolas plásticas)
}

// Interface para variação com informação do produto pai
interface VariationWithProduct extends WooCommerceProductVariation {
  parentProduct: WooCommerceProduct;
  paperType: string;
  paperAttribute?: string | null;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  parent: number;
  count: number;
}

const normalizePaperValue = (value?: string | null) => {
  if (value === undefined || value === null) return null;
  const normalized = value.toString().trim();
  return normalized.length > 0 ? normalized : null;
};

const isPaperAttributeName = (name?: string) => {
  if (!name) return false;
  return name.toLowerCase().includes('papel');
};

const inferPaperTypeFromName = (name?: string) => {
  if (!name) return 'Padrão';
  const lowerName = name.toLowerCase();
  let paperType = 'Padrão';

  if (lowerName.includes('laminado')) {
    paperType = 'Laminado';
  } else if (lowerName.includes('verniz')) {
    paperType = 'Verniz';
  }

  if (lowerName.includes('klabin')) {
    paperType = `Klabin - ${paperType}`;
  }

  return paperType;
};

const extractPaperAttributeValue = (
  product: WooCommerceProduct,
  variation?: WooCommerceProductVariation
) => {
  const variationAttributes = variation?.attributes || [];

  // Debug: mostrar todos os atributos da variação
  console.log(`🔍 extractPaperAttributeValue - Variação ${variation?.id}:`, {
    variationAttributeNames: variationAttributes.map(a => a.name),
  });

  for (const attr of variationAttributes) {
    const isPaper = isPaperAttributeName(attr.name);
    console.log(`   Atributo "${attr.name}" = "${attr.option}" -> isPaper: ${isPaper}`);

    if (isPaper) {
      const normalized = normalizePaperValue(attr.option);
      console.log(`   ✅ ENCONTRADO! Valor normalizado: "${normalized}"`);
      if (normalized) {
        return normalized;
      }
    }
  }

  const productAttributes = product.attributes || [];
  for (const attr of productAttributes) {
    if (isPaperAttributeName(attr.name)) {
      if (Array.isArray(attr.options) && attr.options.length > 0) {
        const normalized = normalizePaperValue(attr.options[0]);
        if (normalized) {
          return normalized;
        }
      }
    }
  }

  return null;
};

// Função auxiliar para extrair tipos únicos de papel das variações
const getUniquePaperTypes = (variations: VariationWithProduct[]): string[] => {
  if (!variations || variations.length === 0) return [];
  const paperTypes = variations.map((v) => v.paperAttribute || v.paperType).filter(Boolean);
  return [...new Set(paperTypes)];
};

export function ProductNavigator({ onAddProduct, onClose }: ProductNavigatorProps) {
  const [currentStep, setCurrentStep] = useState<NavigationStep>('category');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null); // Sacola de Papel, Caixa, etc.
  const [selectedLine, setSelectedLine] = useState<Category | null>(null); // Linha Premium, Boca Vazada
  const [selectedPlasticProduct, setSelectedPlasticProduct] = useState<WooCommerceProduct | null>(null); // Para sacolas plásticas: Boca Vazada, Alça Fita, etc.
  const [selectedGroupedProduct, setSelectedGroupedProduct] = useState<GroupedProduct | null>(null);
  const [selectedPaperType, setSelectedPaperType] = useState<string | null>(null); // Tipo de papel selecionado
  const [breadcrumb, setBreadcrumb] = useState<string[]>(['Escolha a Categoria']);

  // Buscar TODOS os produtos
  const { data: allProducts, isLoading: loadingProducts, error: productsError } = useQuery({
    queryKey: ['all-products-navigator'],
    queryFn: async () => {
      console.log('🔍 Buscando todos os produtos...');
      // Tentar buscar do cache primeiro
      try {
        const cached = await getCachedProducts({ limit: 1000 });
        if (cached.length > 0) {
          console.log('✅ Produtos carregados do cache:', cached.length);
          return cached.map(convertCachedProduct);
        }
      } catch (cacheError) {
        console.warn('⚠️ Falha ao buscar do cache:', cacheError);
      }
      // Fallback para WooCommerce
      const result = await getProductsFromWC({ per_page: 100, orderby: 'menu_order', order: 'asc' });
      console.log('✅ Produtos recebidos do WooCommerce:', result?.length || 0);
      // Log detalhado das categorias de cada produto
      result?.forEach((p: WooCommerceProduct) => {
        console.log(`📦 ${p.name} -> Categorias:`, p.categories?.map(c => c.name));
      });
      return result;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
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
          // Subcategorias de sacolas plásticas (tipos de sacola)
          catName.includes('boca vazada') ||
          catName.includes('alça fita') ||
          catName.includes('alça camiseta') ||
          catName.includes('ala fita') ||  // variação sem acento
          catName.includes('ala camiseta') ||
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

  // Lista de produtos com atributo "Modelo" para a categoria selecionada
  // Usado para categorias como Sacolas Plásticas, Acessórios (Tags), etc.
  const productsWithModels = (() => {
    if (!allProducts || allProducts.length === 0 || !selectedCategory) return [];

    // Filtrar produtos da categoria que têm atributo "Modelo"
    const categoryProducts = allProducts.filter((product: WooCommerceProduct) => {
      // Verificar se pertence à categoria
      const belongsToCategory = product.categories?.some(cat => cat.id === selectedCategory.id);
      if (!belongsToCategory) return false;

      // Verificar se tem atributo "Modelo" com múltiplas opções
      const modelAttr = product.attributes?.find((a) => {
        const n = (a.name || '').toLowerCase().trim();
        return n.includes('modelo') || n.includes('model') || n.includes('tamanho') || n.includes('medida');
      });
      return modelAttr && Array.isArray(modelAttr.options) && modelAttr.options.length > 1;
    });

    console.log('📦 Produtos com modelos encontrados:', categoryProducts.map(p => p.name));
    return categoryProducts;
  })();

  // Filtrar produtos da linha selecionada (ou categoria, se não houver linha) e agrupar por SKU
  const groupedProducts: GroupedProduct[] = (() => {
    if (!allProducts) return [];

    // CASO ESPECIAL: Sacola plástica selecionada - mostrar apenas os modelos desse produto
    if (selectedPlasticProduct) {
      const product = selectedPlasticProduct;
      const modelAttr = product.attributes?.find((a) => {
        const n = (a.name || '').toLowerCase().trim();
        return n.includes('modelo') || n.includes('model') || n.includes('tamanho') || n.includes('medida');
      });

      if (modelAttr && Array.isArray(modelAttr.options) && modelAttr.options.length > 0) {
        // Criar um grupo para cada modelo/tamanho
        return modelAttr.options.map((opt) => ({
          sku: `${product.sku || product.id}-${opt}`,
          products: [product],
          paperTypes: ['Padrão'],
          model: opt,
        }));
      }

      // Sem atributo modelo - retornar produto único
      return [{
        sku: product.sku || `#${product.id}`,
        products: [product],
        paperTypes: ['Padrão'],
      }];
    }

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
      const paperType = inferPaperTypeFromName(product.name);

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

    // SPECIAL CASE: Sacolas plásticas - queremos separar por MODELO (atributo)
    // Isso funciona para qualquer tipo: Boca Vazada, Alça Camiseta, Alça Fita, etc.
    const isPlasticCategory = (selectedCategory?.name || '').toLowerCase().includes('plástic') ||
                              (selectedCategory?.name || '').toLowerCase().includes('plastico');

    // Verificar se algum produto tem atributo "Modelo" (indica que deve ser separado por tamanho)
    const hasModelAttribute = lineProducts.some((p) => {
      return p.attributes?.some((a) => {
        const n = (a.name || '').toLowerCase().trim();
        return n.includes('modelo') || n.includes('model') || n.includes('tamanho') || n.includes('medida');
      });
    });

    if (isPlasticCategory && hasModelAttribute) {
      // Construir grupos por model (cada opção do atributo Modelo vira um grupo separado)
      const modelGroups: GroupedProduct[] = [];

      lineProducts.forEach((product) => {
        // Verificar se este produto tem atributo "Modelo" (deve ser separado por tamanho)
        const productModelAttr = product.attributes?.find((a) => {
          const n = (a.name || '').toLowerCase().trim();
          return n.includes('modelo') || n.includes('model') || n.includes('tamanho') || n.includes('medida');
        });

        // Se não tem atributo Modelo, adicionar ao agrupamento normal por SKU
        if (!productModelAttr || !Array.isArray(productModelAttr.options) || productModelAttr.options.length === 0) {
          let sku = product.sku;
          if (!sku) {
            const nameMatch = product.name.match(/^([kK]-\d+)/);
            sku = nameMatch ? nameMatch[1] : `#${product.id}`;
          }
          const normalizedSku = sku.toLowerCase();
          const existing = grouped.get(normalizedSku);
          if (existing) {
            existing.products.push(product);
          } else {
            grouped.set(normalizedSku, {
              sku: sku,
              products: [product],
              paperTypes: ['Padrão']
            });
          }
          return; // pular para próximo produto
        }

        // Extrair SKU e paperType para este produto (tem atributo Modelo)
        let productSku = product.sku;
        if (!productSku) {
          const nameMatch = product.name.match(/^([kK]-\d+)/);
          productSku = nameMatch ? nameMatch[1] : `#${product.id}`;
        }

        const productPaperType = inferPaperTypeFromName(product.name);

        // Usar o atributo modelo já encontrado (productModelAttr) para criar os grupos
        productModelAttr.options.forEach((opt) => {
          modelGroups.push({
            sku: `${productSku}-${opt}`,
            products: [product],
            paperTypes: [productPaperType],
            model: opt,
          });
        });
      });

      // Se encontramos grupos por modelo, retornar eles (senão, retornar agrupamento por SKU)
      if (modelGroups.length > 0) {
        return modelGroups;
      }

    }

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

        return variations.map((variation: WooCommerceProductVariation) => {
          const paperAttribute = extractPaperAttributeValue(product, variation);
          const fallbackPaperType = inferPaperTypeFromName(product.name);

          // Debug: log detalhado da extração do atributo papel
          console.log(`📄 Variação ${variation.id} do produto ${product.id}:`, {
            variationAttributes: variation.attributes,
            extractedPaperAttribute: paperAttribute,
            fallbackPaperType,
          });

          return {
            ...variation,
            parentProduct: product,
            paperAttribute,
            paperType: paperAttribute || fallbackPaperType,
          } as VariationWithProduct;
        });
      });

      const results = await Promise.all(variationsPromises);
      return results.flat() as VariationWithProduct[];
    },
    enabled: !!selectedGroupedProduct,
    staleTime: 2 * 60 * 1000,
  });

  // Decidir se mostra step de papel ou vai direto para variações
  useEffect(() => {
    // Early return se já estamos no step de papel para evitar loop
    if (currentStep === 'paperType') return;
    
    if (allGroupVariations && selectedGroupedProduct && currentStep === 'variation') {
      // Verificar se é categoria Sacola de Papel
      const isPaperBagCategory = selectedCategory?.name.toLowerCase().includes('sacola') && 
                                 selectedCategory?.name.toLowerCase().includes('papel');
      
      if (!isPaperBagCategory) {
        // Não é sacola de papel, não mostrar step
        return;
      }

      const paperTypes = getUniquePaperTypes(allGroupVariations);
      
      // Se tem múltiplos tipos de papel E não selecionou ainda, mostrar step de papel
      if (paperTypes.length > 1 && selectedPaperType === null) {
        setCurrentStep('paperType');
        setBreadcrumb([
          'Escolha a Categoria',
          selectedCategory?.name,
          selectedPlasticProduct?.name || selectedLine?.name,
          selectedGroupedProduct.model || selectedGroupedProduct.sku,
          'Escolha o Tipo de Papel'
        ].filter(Boolean) as string[]);
      }
      // Se tem apenas 1 tipo ou já selecionou, auto-selecionar
      else if (paperTypes.length === 1 && selectedPaperType === null) {
        setSelectedPaperType(paperTypes[0]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allGroupVariations, selectedGroupedProduct, selectedCategory, selectedPlasticProduct, selectedLine, selectedPaperType]);

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

    // Buscar produtos desta categoria
    const categoryProducts = allProducts?.filter((product: WooCommerceProduct) =>
      product.categories?.some(cat => cat.id === category.id)
    ) || [];

    // Verificar se os produtos têm atributo "Modelo" com múltiplas opções
    // Se tiverem, precisamos mostrar primeiro a lista de produtos, depois os modelos
    const hasProductsWithModels = categoryProducts.some((product: WooCommerceProduct) => {
      const modelAttr = product.attributes?.find((a) => {
        const n = (a.name || '').toLowerCase().trim();
        return n.includes('modelo') || n.includes('model') || n.includes('tamanho') || n.includes('medida');
      });
      return modelAttr && Array.isArray(modelAttr.options) && modelAttr.options.length > 1;
    });

    if (hasProductsWithModels) {
      // Categoria com produtos que têm modelos - mostrar lista de produtos primeiro
      setBreadcrumb(['Escolha a Categoria', category.name, 'Escolha o Produto']);
      setCurrentStep('subcategory');
      return;
    }

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

  // Para sacolas plásticas: selecionar o tipo (Boca Vazada, Alça Fita, etc.)
  const handlePlasticProductSelect = (product: WooCommerceProduct) => {
    setSelectedPlasticProduct(product);
    setBreadcrumb(['Escolha a Categoria', selectedCategory?.name || '', product.name, 'Escolha o Tamanho']);
    setCurrentStep('product');
  };

  const handleLineSelect = (line: Category) => {
    setSelectedLine(line);
    setBreadcrumb(['Escolha a Categoria', selectedCategory?.name || '', line.name, 'Produtos']);
    setCurrentStep('product');
  };

  const handleGroupedProductSelect = (grouped: GroupedProduct) => {
    setSelectedGroupedProduct(grouped);
    setSelectedPaperType(null); // Reset papel selecionado

    // Ir para variações (será ajustado pelo useEffect se precisar mostrar step de papel)
    // Filtrar valores vazios para quando não há linha
    setBreadcrumb([
      'Escolha a Categoria',
      selectedCategory?.name,
      selectedPlasticProduct?.name || selectedLine?.name,
      grouped.model || grouped.sku,
    ].filter(Boolean) as string[]);
    setCurrentStep('variation');
  };

  const handlePaperTypeSelect = (paperType: string) => {
    setSelectedPaperType(paperType);
    
    // Atualizar breadcrumb
    setBreadcrumb([
      'Escolha a Categoria',
      selectedCategory?.name,
      selectedPlasticProduct?.name || selectedLine?.name,
      selectedGroupedProduct?.model || selectedGroupedProduct?.sku,
      `Papel: ${paperType}`,
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
      paperType: selectedPaperType || undefined, // Tipo de papel selecionado
    });
    onClose();
  };

  const handleBack = () => {
    if (currentStep === 'variation') {
      // Verificar se veio de paperType
      if (selectedPaperType !== null) {
        // Voltar para seleção de papel
        setSelectedPaperType(null);
        setCurrentStep('paperType');
        setBreadcrumb([
          'Escolha a Categoria',
          selectedCategory?.name || '',
          selectedPlasticProduct?.name || selectedLine?.name || '',
          selectedGroupedProduct?.model || selectedGroupedProduct?.sku || '',
          'Escolha o Tipo de Papel'
        ].filter(Boolean));
        return;
      }
      
      // Senão, voltar para product
      setSelectedGroupedProduct(null);
      setCurrentStep('product');
      setBreadcrumb(['Escolha a Categoria', selectedCategory?.name || '', selectedPlasticProduct?.name || selectedLine?.name || '', 'Escolha o Tamanho'].filter(Boolean));
    } else if (currentStep === 'paperType') {
      // Voltar de seleção de papel para seleção de produto
      setSelectedGroupedProduct(null);
      setSelectedPaperType(null);
      setCurrentStep('product');
      setBreadcrumb([
        'Escolha a Categoria',
        selectedCategory?.name || '',
        selectedPlasticProduct?.name || selectedLine?.name || '',
        'Produtos'
      ].filter(Boolean));
    } else if (currentStep === 'product') {
      // Se veio de sacola plástica, voltar para seleção de tipo
      if (selectedPlasticProduct) {
        setSelectedPlasticProduct(null);
        setCurrentStep('subcategory');
        setBreadcrumb(['Escolha a Categoria', selectedCategory?.name || '', 'Escolha o Tipo']);
      } else if (!selectedLine) {
        // Se não tinha linha (pulou direto da categoria), voltar para categoria
        setSelectedCategory(null);
        setCurrentStep('category');
        setBreadcrumb(['Escolha a Categoria']);
      } else {
        setSelectedLine(null);
        setCurrentStep('line');
        setBreadcrumb(['Escolha a Categoria', selectedCategory?.name || '', 'Escolha a Linha']);
      }
    } else if (currentStep === 'subcategory') {
      // Voltar de seleção de tipo de sacola plástica para categorias
      setSelectedCategory(null);
      setCurrentStep('category');
      setBreadcrumb(['Escolha a Categoria']);
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

        {/* Step 2b: Escolha do Tipo de Sacola Plástica (Boca Vazada, Alça Fita, Alça Camiseta, etc.) */}
        {currentStep === 'subcategory' && (
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
            ) : productsWithModels.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhum tipo encontrado</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Verifique os produtos no WooCommerce
                </p>
              </div>
            ) : (
              productsWithModels.map((product: WooCommerceProduct) => (
                <Card
                  key={product.id}
                  onClick={() => handlePlasticProductSelect(product)}
                  className="cursor-pointer hover:bg-accent transition-colors touch-manipulation"
                >
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-center">{product.name}</h3>
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

                // Para produtos com modelo específico (ex: Boca Vazada separada por modelo)
                // Mostrar o modelo como nome principal
                let displayName: string;
                if (grouped.model) {
                  // Se tem modelo, mostrar apenas o modelo (ex: "25x35cm")
                  displayName = grouped.model;
                } else if (isPlasticBag) {
                  // Para sacolas plásticas sem modelo: usar o nome do produto
                  displayName = firstProduct.name;
                } else {
                  // Para sacolas de papel: usar o SKU
                  displayName = grouped.sku;
                }

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

        {/* Step 3.5: Escolha do Tipo de Papel (apenas para Sacolas de Papel com atributo PAPEL) */}
        {currentStep === 'paperType' && selectedGroupedProduct && (
          <PaperTypeSelector
            groupedProduct={selectedGroupedProduct}
            variations={allGroupVariations || []}
            loading={loadingVariations}
            onSelect={handlePaperTypeSelect}
          />
        )}

        {/* Step 4: Variações agrupadas por tipo de papel (Cor/Quantidade) */}
        {currentStep === 'variation' && selectedGroupedProduct && (
          <VariationSelector
            groupedProduct={selectedGroupedProduct}
            variations={
              selectedPaperType
                ? (allGroupVariations || []).filter(v => v.paperAttribute === selectedPaperType)
                : (allGroupVariations || [])
            }
            loading={loadingVariations}
            onSelect={handleVariationSelect}
            lineName={selectedLine?.name || selectedCategory?.name}
            paperType={selectedPaperType}
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
  paperType?: string | null;
}

// Componente para seleção de tipo de papel
interface PaperTypeSelectorProps {
  groupedProduct: GroupedProduct;
  variations: VariationWithProduct[];
  loading: boolean;
  onSelect: (paperType: string) => void;
}

function PaperTypeSelector({ groupedProduct, variations, loading, onSelect }: PaperTypeSelectorProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Carregando tipos de papel...</p>
      </div>
    );
  }

  // Extrair tipos de papel únicos
  const paperTypes = [...new Set(
    variations
      .map((v) => v.paperAttribute)
      .filter((pt): pt is string => pt !== null && pt !== undefined && pt.trim().length > 0)
  )];

  if (paperTypes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhum tipo de papel disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Escolha o Tipo de Papel</h3>
        <p className="text-sm text-muted-foreground">
          Produto: {groupedProduct.model || groupedProduct.sku}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {paperTypes.map((paperType) => (
          <Card
            key={paperType}
            onClick={() => onSelect(paperType)}
            className="cursor-pointer hover:bg-accent transition-colors touch-manipulation"
          >
            <CardContent className="p-6 flex items-center justify-center min-h-[100px]">
              <h4 className="text-xl font-semibold text-center">{paperType}</h4>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function VariationSelector({ groupedProduct, variations, loading, onSelect, lineName, paperType }: VariationSelectorProps) {
  // Filtrar variações pelo modelo definido no grupo (se houver)
  const filteredVariations = groupedProduct.model
    ? variations.filter((v) => {
        // Procurar atributo de modelo na variação
        const varModelAttr = v.attributes?.find((a) => {
          const n = (a.name || '').toLowerCase();
          return n.includes('modelo') || n.includes('model');
        });

        const varModel = varModelAttr?.option;
        // Comparação case-insensitive e com trim
        const targetModel = (groupedProduct.model || '').toLowerCase().trim();
        if (varModel) {
          const match = (varModel || '').toLowerCase().trim() === targetModel;
          return match;
        }

        // Se variação não tem atributo modelo direto, verificar se o modelo do grupo
        // está presente nas opções do produto pai (produto variável)
        const prodModelAttr = v.parentProduct?.attributes?.find((a) => {
          const n = (a.name || '').toLowerCase();
          return n.includes('modelo') || n.includes('model');
        });

        if (prodModelAttr && Array.isArray((prodModelAttr as any).options)) {
          // comparar com as opções disponíveis (case-insensitive)
          const options = (prodModelAttr as any).options.map((o: string) => (o || '').toLowerCase().trim());
          return options.includes(targetModel);
        }

        return false;
      })
    : variations;

  // Debug: log das variações filtradas
  console.log('🔍 VariationSelector - Modelo do grupo:', groupedProduct.model);
  console.log('   Total variações:', variations.length);
  console.log('   Variações filtradas:', filteredVariations.length);
  if (filteredVariations.length === 0 && groupedProduct.model) {
    console.log('   ⚠️ NENHUMA variação encontrada! Atributos da primeira variação:',
      variations[0]?.attributes?.map(a => ({ name: a.name, option: a.option })));
  }

  // Usar filteredVariations no lugar de variations nas lógicas abaixo
  const isPaperBagGroup = groupedProduct.sku.toLowerCase().startsWith('k-');

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
    filteredVariations.forEach((variation) => {
      variation.attributes?.forEach((attr) => {
        // Normalizar nomes para evitar duplicatas
        const normalizedName = (attr.name || '').toLowerCase().trim();
        names.add(normalizedName);
      });
    });
    return Array.from(names);
  })();

  // Verificar se tem múltiplos paperTypes (indica produto com hierarquia tipo papel)
  const uniquePaperTypes = [...new Set(filteredVariations.map((v) => v.paperAttribute || v.paperType))];

  // Determinar qual layout usar baseado no número de critérios:
  // - 2 critérios → layout simplificado (MODELO + QUANTIDADE)
  // - 3 critérios com modelo filtrado → layout COR → QUANTIDADE (como TAGS)
  // - 4 critérios → layout completo (ESPESSURA + COR + QUANTIDADE, modelo já filtrado)
  const numCriteria = uniqueAttributeNames.length;
  const useSimplifiedLayout = numCriteria <= 2 && uniquePaperTypes.length === 1 && !groupedProduct.model;

  // Verificar se tem espessura nas variações
  const hasThickness = filteredVariations.some((v) => {
    return v.attributes?.some((attr) => {
      const nameLower = (attr.name || '').toLowerCase();
      return nameLower.includes('espessura') || nameLower.includes('thickness') || nameLower.includes('gramatura');
    });
  });

  // Layout de 3 critérios: COR → QUANTIDADE (quando tem modelo filtrado mas NÃO tem espessura)
  const useThreeCriteriaLayout = groupedProduct.model && !hasThickness;

  // Layout de 4 critérios: ESPESSURA → COR → QUANTIDADE (quando tem modelo filtrado E tem espessura)
  const useFourCriteriaLayout = groupedProduct.model && hasThickness;

  // Agrupar variações: primeiro por tipo de papel, depois por cor
  const groupedByPaper = filteredVariations.reduce((acc: Record<string, VariationWithProduct[]>, variation) => {
    const paperType = variation.paperAttribute || variation.paperType || 'Papel Padrão';

    if (!acc[paperType]) {
      acc[paperType] = [];
    }
    acc[paperType].push(variation);

    return acc;
  }, {});
  const hasPaperAttribute = filteredVariations.some((variation) => !!variation.paperAttribute);

  // Debug: log dos atributos de papel encontrados
  console.log('📄 VariationSelector - hasPaperAttribute:', hasPaperAttribute);
  if (hasPaperAttribute) {
    const paperValues = filteredVariations.map((v) => v.paperAttribute).filter(Boolean);
    console.log('   Valores de papel encontrados:', [...new Set(paperValues)]);
  }

  const groupedByPaperAttribute = (() => {
    if (!hasPaperAttribute) return {} as Record<string, VariationWithProduct[]>;

    return filteredVariations.reduce((acc: Record<string, VariationWithProduct[]>, variation) => {
      const paperAttr = variation.paperAttribute || 'Papel Padrão';

      if (!acc[paperAttr]) {
        acc[paperAttr] = [];
      }

      acc[paperAttr].push(variation);
      return acc;
    }, {} as Record<string, VariationWithProduct[]>);
  })();

  // Para cada tipo de papel, agrupar por cor
  const paperTypes = hasPaperAttribute
    ? Object.keys(groupedByPaperAttribute)
    : Object.keys(groupedByPaper);

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

  const renderColorSections = (variationsList: VariationWithProduct[], paperLabel: string) => {
    if (!variationsList || variationsList.length === 0) {
      return (
        <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          Nenhuma variação disponível
        </div>
      );
    }

    const byColor = variationsList.reduce((acc: Record<string, (VariationWithProduct & { quantity?: number; quantityLabel?: string })[]>, variation) => {
      const { color, quantity, quantityLabel } = extractColorAndQuantity(variation);

      if (!acc[color]) {
        acc[color] = [];
      }
      acc[color].push({
        ...variation,
        quantity,
        quantityLabel,
      });

      return acc;
    }, {});

    const colors = Object.keys(byColor);

    return (
      <div className="space-y-4">
        {colors.map((color) => {
          const sortedVariations = byColor[color].sort((a, b) => (a.quantity || 0) - (b.quantity || 0));
          const count = sortedVariations.length;
          const gridCols = count <= 2 ? 'grid-cols-2' : 'grid-cols-3';

          return (
            <div
              key={`${paperLabel}-${color}`}
              className={`rounded-lg p-3 ${getColorBackground(color)}`}
            >
              <h5 className={`text-sm text-center mb-2 ${getColorTitle(color)}`}>
                {color.toUpperCase()}
              </h5>

              <div className={`grid ${gridCols} gap-2`}>
                {sortedVariations.map((variation) => {
                  const price = parseFloat(variation.price) || 0;

                  return (
                    <Button
                      key={variation.id}
                      variant="outline"
                      onClick={() => handleQuantityClick(variation, paperLabel)}
                      className="h-20 flex flex-col items-center justify-center gap-1 text-center touch-manipulation hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <span className="text-xl font-bold">{variation.quantityLabel || variation.quantity}</span>
                      <span className="text-xs">{formatCurrency(price)}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Extrair cor e quantidade de uma variação
  const extractColorAndQuantity = (variation: VariationWithProduct) => {
    const colorAttr = variation.attributes?.find(
      (attr) => {
        const nameLower = attr.name.toLowerCase();
        return nameLower === 'cor' ||
               nameLower === 'color' ||
               nameLower === 'impressões' ||
               nameLower === 'impressoes' ||
               nameLower.includes('cor de impressão') ||
               nameLower.includes('cor de impressao') ||
               nameLower.includes('tipo de impressão') ||
               nameLower.includes('tipo de impressao') ||
               nameLower.includes('impressão') ||
               nameLower.includes('impressao') ||
               nameLower.includes('impress');
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
    const quantityAttrAny = quantityAttr as any;
    const quantityOption = quantityAttrAny?.option?.toString() || '';
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
    // Primeiro tentar encontrar explicitamente um atributo chamado "modelo" (ou variações)
    const modelAttr = variation.attributes?.find((attr) => {
      const nameLower = (attr.name || '').toLowerCase();
      return nameLower.includes('modelo') || nameLower.includes('model');
    })
    // Se não existir no nível da variação, tentar buscar no produto pai (caso o atributo esteja definido lá)
    || variation.parentProduct?.attributes?.find((attr) => {
      const nameLower = (attr.name || '').toLowerCase();
      return nameLower.includes('modelo') || nameLower.includes('model');
    })
    // Fallback: usar o primeiro atributo que não seja quantidade
    || variation.attributes?.find((attr) => {
      const nameLower = (attr.name || '').toLowerCase();
      const isQuantity = nameLower === 'quantidade' ||
                         nameLower === 'quantity' ||
                         nameLower === 'qtd' ||
                         nameLower === 'metros' ||
                         nameLower === 'mts' ||
                         nameLower.includes('metro');
      return !isQuantity;
    });

    // Buscar atributo de quantidade
    // Buscar atributo de quantidade preferencialmente nas variações
    const quantityAttr = variation.attributes?.find((attr) => {
      const nameLower = (attr.name || '').toLowerCase();
      return nameLower === 'quantidade' ||
             nameLower === 'quantity' ||
             nameLower === 'qtd' ||
             nameLower === 'metros' ||
             nameLower === 'mts' ||
             nameLower.includes('metro');
    }) || variation.parentProduct?.attributes?.find((attr) => {
      const nameLower = (attr.name || '').toLowerCase();
      return nameLower === 'quantidade' ||
             nameLower === 'quantity' ||
             nameLower === 'qtd' ||
             nameLower === 'metros' ||
             nameLower === 'mts' ||
             nameLower.includes('metro');
    });

    const quantityAttrAny = quantityAttr as any;
    const quantityOption = quantityAttrAny?.option?.toString() || '';
    const quantityNumber = parseInt(quantityOption.replace(/\D/g, '') || '1000');
    const quantityLabel = quantityOption || quantityNumber.toString();

    // modelAttr pode vir do product.attributes (com campo options) ou de variation.attributes (com option)
    const modelOption = (modelAttr as any)?.option || // variação
                        // se veio do product.attributes, pegar a primeira opção disponível
                        ((modelAttr as any)?.options && (modelAttr as any).options[0]) ||
                        'Padrão';

    return {
      model: modelOption,
      modelName: (modelAttr as any)?.name || 'Modelo',
      quantity: quantityNumber,
      quantityLabel: quantityLabel,
    };
  };

  // Extrair ESPESSURA, COR e QUANTIDADE para layout de 4 critérios
  const extractFourCriteria = (variation: VariationWithProduct) => {
    // Buscar ESPESSURA
    const thicknessAttr = variation.attributes?.find((attr) => {
      const nameLower = (attr.name || '').toLowerCase();
      return nameLower.includes('espessura') || nameLower.includes('thickness') || nameLower.includes('gramatura');
    });

    // Buscar COR DE IMPRESSÃO / IMPRESSÕES
    const colorAttr = variation.attributes?.find((attr) => {
      const nameLower = (attr.name || '').toLowerCase();
      return nameLower === 'cor' ||
             nameLower === 'color' ||
             nameLower === 'impressões' ||
             nameLower === 'impressoes' ||
             nameLower.includes('cor de impressão') ||
             nameLower.includes('cor de impressao') ||
             nameLower.includes('tipo de impressão') ||
             nameLower.includes('tipo de impressao') ||
             nameLower.includes('impressão') ||
             nameLower.includes('impressao') ||
             nameLower.includes('impress');
    });

    // Buscar QUANTIDADE
    const quantityAttr = variation.attributes?.find((attr) => {
      const nameLower = (attr.name || '').toLowerCase();
      return nameLower === 'quantidade' ||
             nameLower === 'quantity' ||
             nameLower === 'qtd' ||
             nameLower === 'metros' ||
             nameLower === 'mts' ||
             nameLower.includes('metro');
    });

    const quantityOption = quantityAttr?.option?.toString() || '';
    const quantityNumber = parseInt(quantityOption.replace(/\D/g, '') || '1000');
    const quantityLabel = quantityOption || quantityNumber.toString();

    return {
      thickness: thicknessAttr?.option || 'Padrão',
      color: colorAttr?.option || 'Padrão',
      quantity: quantityNumber,
      quantityLabel: quantityLabel,
    };
  };

  // Para layout de 4 critérios: agrupar por ESPESSURA → COR → QUANTIDADE
  const groupedByThickness = (() => {
    if (!useFourCriteriaLayout) return {};

    return filteredVariations.reduce((acc: Record<string, Record<string, (VariationWithProduct & { quantity: number; quantityLabel: string; color: string })[]>>, variation) => {
      const { thickness, color, quantity, quantityLabel } = extractFourCriteria(variation);

      if (!acc[thickness]) {
        acc[thickness] = {};
      }
      if (!acc[thickness][color]) {
        acc[thickness][color] = [];
      }
      acc[thickness][color].push({
        ...variation,
        quantity,
        quantityLabel,
        color,
      });

      return acc;
    }, {});
  })();

  // Para layout de 3 critérios (modelo já filtrado, sem espessura): agrupar por COR → QUANTIDADE
  const groupedByColor = (() => {
    if (!useThreeCriteriaLayout) return {};

    return filteredVariations.reduce((acc: Record<string, (VariationWithProduct & { quantity: number; quantityLabel: string; color: string })[]>, variation) => {
      const { color, quantity, quantityLabel } = extractFourCriteria(variation); // Reutiliza a função

      if (!acc[color]) {
        acc[color] = [];
      }
      acc[color].push({
        ...variation,
        quantity,
        quantityLabel,
        color,
      });

      return acc;
    }, {});
  })();

  // Para layout simplificado: agrupar por MODELO
  const groupedByModel = (() => {
    if (!useSimplifiedLayout) return {};

    return filteredVariations.reduce((acc: Record<string, (VariationWithProduct & { quantity: number; quantityLabel: string })[]>, variation) => {
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
        {paperType && (
          <p className="text-sm font-medium text-primary mb-1">Papel: {paperType}</p>
        )}
        <p className="text-sm text-muted-foreground">Selecione o tipo e quantidade</p>
      </div>

      {/* LAYOUT DE 4 CRITÉRIOS: ESPESSURA → COR → QUANTIDADE (modelo já filtrado) */}
      {useFourCriteriaLayout ? (
        <div className="space-y-6">
          {Object.keys(groupedByThickness).map((thickness) => {
            const colorGroups = groupedByThickness[thickness];
            const colors = Object.keys(colorGroups);

            return (
              <div key={thickness} className="border rounded-lg overflow-hidden">
                {/* Header da espessura */}
                <div className="bg-primary/10 px-4 py-3 border-b">
                  <h4 className="font-semibold text-base text-center">Espessura: {thickness}</h4>
                </div>

                {/* Cores e quantidades */}
                <div className="p-4 space-y-4">
                  {colors.map((color) => {
                    const colorVariations = colorGroups[color].sort((a, b) => (a.quantity || 0) - (b.quantity || 0));
                    const count = colorVariations.length;
                    const gridCols = count <= 2 ? 'grid-cols-2' : 'grid-cols-3';

                    return (
                      <div
                        key={`${thickness}-${color}`}
                        className={`rounded-lg p-3 ${getColorBackground(color)}`}
                      >
                        {/* Título da cor */}
                        <h5 className={`text-sm text-center mb-2 ${getColorTitle(color)}`}>
                          {color.toUpperCase()}
                        </h5>

                        {/* Grid de quantidades e preços */}
                        <div className={`grid ${gridCols} gap-2`}>
                          {colorVariations.map((variation) => {
                            const price = parseFloat(variation.price) || 0;
                            // Construir nome para exibição: Modelo - Espessura
                            const displayModel = `${groupedProduct.model} - ${thickness}`;

                            return (
                              <Button
                                key={variation.id}
                                variant="outline"
                                onClick={() => handleQuantityClick(variation, displayModel)}
                                className="h-20 flex flex-col items-center justify-center gap-1 text-center touch-manipulation hover:bg-primary hover:text-primary-foreground transition-colors"
                              >
                                <span className="text-xl font-bold">{variation.quantityLabel || variation.quantity}</span>
                                <span className="text-xs">{formatCurrency(price)}</span>
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : useThreeCriteriaLayout ? (
        /* LAYOUT DE 3 CRITÉRIOS: COR DE IMPRESSÃO → QUANTIDADE (modelo já filtrado, sem espessura) */
        /* Usado para produtos como TAGS que têm: Modelo + Cor de Impressão (4x1, 4x4) + Quantidade */
        <div className="space-y-4">
          {Object.keys(groupedByColor).map((color) => {
            const colorVariations = groupedByColor[color].sort((a, b) => (a.quantity || 0) - (b.quantity || 0));
            const count = colorVariations.length;
            const gridCols = count <= 2 ? 'grid-cols-2' : 'grid-cols-3';

            return (
              <div
                key={color}
                className={`border rounded-lg overflow-hidden ${getColorBackground(color)}`}
              >
                {/* Header da cor de impressão */}
                <div className="bg-primary/10 px-4 py-3 border-b">
                  <h4 className={`font-semibold text-base text-center ${getColorTitle(color)}`}>
                    {color.toUpperCase()}
                  </h4>
                </div>

                {/* Grid de quantidades e preços */}
                <div className="p-4">
                  <div className={`grid ${gridCols} gap-2`}>
                    {colorVariations.map((variation) => {
                      const price = parseFloat(variation.price) || 0;
                      // Nome para exibição: Modelo - Cor
                      const displayModel = `${groupedProduct.model} - ${color}`;

                      return (
                        <Button
                          key={variation.id}
                          variant="outline"
                          onClick={() => handleQuantityClick(variation, displayModel)}
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
      ) : useSimplifiedLayout ? (
        /* LAYOUT SIMPLIFICADO: Para produtos com 2 critérios (MODELO + QUANTIDADE) */
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
      ) : hasPaperAttribute ? (
        /* LAYOUT COM ATRIBUTO PAPEL: Agrupa por valor do atributo PAPEL → COR → QUANTIDADE */
        /* Usado para sacolas de papel que têm variações com atributo PAPEL (ex: Kraft, Offset, etc.) */
        <div className="space-y-6">
          {Object.keys(groupedByPaperAttribute).map((paperAttrValue) => {
            const paperVariations = groupedByPaperAttribute[paperAttrValue] || [];

            return (
              <div key={paperAttrValue} className="border rounded-lg overflow-hidden">
                {/* Header do tipo de papel (atributo) */}
                <div className="bg-amber-100 dark:bg-amber-900/30 px-4 py-3 border-b">
                  <h4 className="font-semibold text-base text-amber-800 dark:text-amber-200">
                    📄 Papel: {paperAttrValue}
                  </h4>
                </div>

                <div className="p-4 space-y-4">
                  {renderColorSections(paperVariations, paperAttrValue)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LAYOUT COMPLETO: Para produtos com 3+ critérios (como sacola de papel sem atributo PAPEL) */
        <div className="space-y-6">
          {paperTypes.map((paperType) => {
            const baseVariations = groupedByPaper[paperType] || [];

            return (
              <div key={paperType} className="border rounded-lg overflow-hidden">
                {/* Header do tipo de papel (inferido do nome) */}
                <div className="bg-muted/50 px-4 py-3 border-b">
                  <h4 className="font-semibold text-base">{paperType}</h4>
                </div>

                <div className="p-4 space-y-4">
                  {renderColorSections(baseVariations, paperType)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Botão para configurar acabamentos (opcional, antes de selecionar) - apenas para sacola de PAPEL (SKU começa com k-) */}
      {isPaperBagGroup && (
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
        }}
        initialFinishing={finishing}
        quantity={filteredVariations[0]?.quantity || 1000}
      />
    </div>
  );
}
