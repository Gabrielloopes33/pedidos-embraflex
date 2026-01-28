import { Card, CardContent } from "@/componentes/ui/card";
import { Badge } from "@/componentes/ui/badge";
import { Button } from "@/componentes/ui/button";
import { Input } from "@/componentes/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/componentes/ui/alert";
import { Package, Search, Loader2, AlertCircle, ChevronLeft, ChevronRight, ShoppingCart, Database, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getProducts as getProductsFromWC } from "@/lib/woocommerce";
import { getCachedProducts, getCacheStats } from "@/lib/supabase";
import type { WooCommerceProduct, CachedProduct } from "@/lib/types";
import { calculatePriceByQuantity, formatPrice, getPriceTiers } from "@/lib/pricing";
import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/componentes/ui/dialog";
import { Label } from "@/componentes/ui/label";
import { ProductFormModal } from "@/pages/NewOrder/components/ProductFormModal";
import type { ProductItem } from "@/pages/NewOrder/types";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface ProductLine {
  name: string;
  products: WooCommerceProduct[];
}

const PRODUCT_LINE_FILTERS = [
  { label: "Linha Premium", value: "linha premium" },
  { label: "Linha Comercial", value: "linha comercial" },
  { label: "Linha Econômica", value: "linha economica" },
] as const;

const normalizeLineName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

// Converter CachedProduct para WooCommerceProduct
const convertCachedProduct = (cached: CachedProduct): WooCommerceProduct => ({
  id: cached.id,
  name: cached.name,
  slug: cached.name.toLowerCase().replace(/\s+/g, '-'),
  permalink: '',
  type: 'simple',
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
  variations: cached.variations || [],
  precos_por_quantidade: cached.precos_por_quantidade,
});

// Cores para cada categoria
const getCategoryColor = (categoryName: string): { bg: string; text: string; badge: string; border: string } => {
  const lowerName = categoryName.toLowerCase();
  
  // Mapeamento de cores baseado na imagem de referência (UI/UX)
  
  // Linha Econômica: cores claras e amigáveis
  if (lowerName.includes('econômica') || lowerName.includes('economica')) {
    return { 
      bg: 'bg-amber-50/80 dark:bg-amber-950/30', 
      text: 'text-amber-900 dark:text-amber-100',
      badge: 'bg-amber-200 text-amber-900 hover:bg-amber-300',
      border: 'border-amber-200 dark:border-amber-800'
    };
  }

  // Linha Premium: tons escuros/metálicos (sofisticada, exclusiva)
  if (lowerName.includes('premium')) {
    return { 
      bg: 'bg-slate-100 dark:bg-slate-900', 
      text: 'text-slate-900 dark:text-slate-100',
      badge: 'bg-slate-800 text-white hover:bg-slate-700',
      border: 'border-slate-300 dark:border-slate-700'
    };
  }

  // Linha Comercial: tons neutros e profissionais
  if (lowerName.includes('comercial')) {
    return { 
      bg: 'bg-blue-50/80 dark:bg-blue-950/30', 
      text: 'text-blue-900 dark:text-blue-100',
      badge: 'bg-blue-600 text-white hover:bg-blue-700',
      border: 'border-blue-200 dark:border-blue-800'
    };
  }
  
  // Manter compatibilidade com mapeamento antigo por quantidade (fallback)
  if (lowerName.includes('100 unidades') || lowerName === '100 unidades') {
    return { 
      bg: 'bg-blue-50 dark:bg-blue-950', 
      text: 'text-blue-900 dark:text-blue-100',
      badge: 'bg-blue-500 text-white',
      border: 'border-blue-200 dark:border-blue-800'
    };
  }
  if (lowerName.includes('1000 unidades') || lowerName === '1000 unidades') {
    return { 
      bg: 'bg-purple-50 dark:bg-purple-950', 
      text: 'text-purple-900 dark:text-purple-100',
      badge: 'bg-purple-500 text-white',
      border: 'border-purple-200 dark:border-purple-800'
    };
  }
  if (lowerName.includes('150 unidades') || lowerName === '150 unidades') {
    return { 
      bg: 'bg-green-50 dark:bg-green-950', 
      text: 'text-green-900 dark:text-green-100',
      badge: 'bg-green-500 text-white',
      border: 'border-green-200 dark:border-green-800'
    };
  }
  if (lowerName.includes('1500 unidades') || lowerName === '1500 unidades') {
    return { 
      bg: 'bg-orange-50 dark:bg-orange-950', 
      text: 'text-orange-900 dark:text-orange-100',
      badge: 'bg-orange-500 text-white',
      border: 'border-orange-200 dark:border-orange-800'
    };
  }
  if (lowerName.includes('300 unidades') || lowerName === '300 unidades') {
    return { 
      bg: 'bg-pink-50 dark:bg-pink-950', 
      text: 'text-pink-900 dark:text-pink-100',
      badge: 'bg-pink-500 text-white',
      border: 'border-pink-200 dark:border-pink-800'
    };
  }
  if (lowerName.includes('3000 unidades') || lowerName === '3000 unidades') {
    return { 
      bg: 'bg-indigo-50 dark:bg-indigo-950', 
      text: 'text-indigo-900 dark:text-indigo-100',
      badge: 'bg-indigo-500 text-white',
      border: 'border-indigo-200 dark:border-indigo-800'
    };
  }
  if (lowerName.includes('50 unidades') || lowerName === '50 unidades') {
    return { 
      bg: 'bg-teal-50 dark:bg-teal-950', 
      text: 'text-teal-900 dark:text-teal-100',
      badge: 'bg-teal-500 text-white',
      border: 'border-teal-200 dark:border-teal-800'
    };
  }
  if (lowerName.includes('500 unidades') || lowerName === '500 unidades') {
    return { 
      bg: 'bg-amber-50 dark:bg-amber-950', 
      text: 'text-amber-900 dark:text-amber-100',
      badge: 'bg-amber-500 text-white',
      border: 'border-amber-200 dark:border-amber-800'
    };
  }
  
  // Default para categorias não mapeadas
  return { 
    bg: 'bg-gray-50 dark:bg-gray-950', 
    text: 'text-gray-900 dark:text-gray-100',
    badge: 'bg-gray-500 text-white',
    border: 'border-gray-200 dark:border-gray-800'
  };
};

const ProductCarousel = ({ 
  products, 
  onProductClick,
  categoryColor
}: { 
  products: WooCommerceProduct[];
  onProductClick: (product: WooCommerceProduct) => void;
  categoryColor: ReturnType<typeof getCategoryColor>;
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
      const newScrollLeft = direction === 'left' 
        ? scrollContainerRef.current.scrollLeft - scrollAmount
        : scrollContainerRef.current.scrollLeft + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
      
      setTimeout(checkScrollButtons, 300);
    }
  };

  return (
    <div className="relative group">
      {canScrollLeft && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity h-full rounded-none hover:bg-background/90"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="w-8 h-8" />
        </Button>
      )}
      
      <div 
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
        onScroll={checkScrollButtons}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {products.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            onClick={() => onProductClick(product)}
            categoryColor={categoryColor}
          />
        ))}
      </div>

      {canScrollRight && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity h-full rounded-none hover:bg-background/90"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="w-8 h-8" />
        </Button>
      )}
    </div>
  );
};

const ProductCard = ({ 
  product, 
  onClick,
  categoryColor
}: { 
  product: WooCommerceProduct;
  onClick: () => void;
  categoryColor: ReturnType<typeof getCategoryColor>;
}) => {
  const price = calculatePriceByQuantity(product, 1);
  const priceTiers = getPriceTiers(product);

  return (
    <Card 
      className={`flex-shrink-0 shadow-md hover:shadow-xl transition-all cursor-pointer hover:scale-105 duration-200 border-2 ${categoryColor.border}`}
      onClick={onClick}
      style={{ width: 'calc(22.5% - 12px)', minWidth: '200px' }}
    >
      <div className="aspect-square bg-gradient-card rounded-t-lg overflow-hidden">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0].src}
            alt={product.images[0].alt || product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-16 h-16 text-primary" />
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-sm line-clamp-2 mb-3 min-h-[2.5rem]">
          {product.name}
        </h3>
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-primary">
              {formatPrice(price)}
            </span>
            {priceTiers && priceTiers.length > 0 && (
              <span className="text-xs text-muted-foreground">
                /un
              </span>
            )}
          </div>
          {priceTiers && priceTiers.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Preço variável por quantidade
            </p>
          )}
          {/* Apenas Badges de Categoria - SEM badge de estoque */}
          <div className="flex flex-wrap gap-1">
            {product.categories && product.categories.length > 0 && (
              product.categories.map((cat: { id: number; name: string; slug: string }) => (
                <Badge 
                  key={cat.id} 
                  className={`text-xs font-semibold ${categoryColor.badge}`}
                >
                  {cat.name}
                </Badge>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Interface para agrupar produtos por linha
interface ProductLine {
  name: string;
  products: WooCommerceProduct[];
}

// Componente para renderizar uma linha de produtos (Premium, Comercial ou Econômica)
const ProductLineSection = ({ 
  line, 
  onProductClick
}: { 
  line: ProductLine;
  onProductClick: (product: WooCommerceProduct) => void;
}) => {
  const colors = getCategoryColor(line.name);
  
  return (
    <div className={`rounded-xl p-6 ${colors.bg} ${colors.border} border-2`}>
      <div className="flex items-baseline gap-3 mb-4">
        <h2 className={`text-2xl font-bold ${colors.text}`}>{line.name}</h2>
        <span className={`text-sm ${colors.text} opacity-70`}>
          {line.products.length} {line.products.length === 1 ? 'produto' : 'produtos'}
        </span>
      </div>
      <ProductCarousel 
        products={line.products} 
        onProductClick={onProductClick}
        categoryColor={colors}
      />
    </div>
  );
};

const Products = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<WooCommerceProduct | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedLineFilter, setSelectedLineFilter] = useState<string | null>(null);
  const [isAddToOrderOpen, setIsAddToOrderOpen] = useState(false);
  const [productToAdd, setProductToAdd] = useState<ProductItem | null>(null);

  // Buscar estatísticas do cache
  const { data: cacheStats } = useQuery({
    queryKey: ['cache-stats'],
    queryFn: getCacheStats,
    retry: 1,
    staleTime: 60000, // 1 minuto de cache
  });

  // Buscar produtos do cache primeiro
  const { data: cachedProducts, isLoading: cacheLoading, error: cacheError } = useQuery({
    queryKey: ['cached-products'],
    queryFn: () => getCachedProducts({ limit: 1000 }),
    retry: 1,
    staleTime: 120000, // 2 minutos de cache
  });

  // Fallback para WooCommerce se cache estiver vazio ou com erro
  const { data: wcProducts, isLoading: wcLoading, error: wcError } = useQuery({
    queryKey: ['wc-products'],
    queryFn: () => getProductsFromWC({
      per_page: 100,
      orderby: 'menu_order',
      order: 'asc'
    }),
    enabled: !cachedProducts || cachedProducts.length === 0 || !!cacheError,
    retry: 0,
    staleTime: 120000, // 2 minutos de cache
  });

  // Determinar qual fonte usar
  const allProducts = (cachedProducts && cachedProducts.length > 0 && !cacheError)
    ? cachedProducts.map(convertCachedProduct)
    : wcProducts || [];

  const productsLoading = cacheLoading || wcLoading;
  const productsError = cacheError || wcError;

  // Busca de produtos (usa cache primeiro, fallback para WC)
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['products-search', searchTerm],
    queryFn: async () => {
      // Tentar buscar do cache primeiro
      if (cachedProducts && cachedProducts.length > 0) {
        const cached = await getCachedProducts({
          search: searchTerm,
          limit: 20,
        });
        if (cached.length > 0) {
          return cached.map(convertCachedProduct);
        }
      }
      // Fallback para WooCommerce
      return getProductsFromWC({
        search: searchTerm,
        per_page: 20,
      });
    },
    enabled: searchTerm.length > 0,
    retry: 0,
    staleTime: 60000, // 1 minuto de cache
  });

  // Agrupar TODOS os produtos por linha (Premium, Comercial, Econômica)
  const groupAllProductsByLine = (): ProductLine[] => {
    if (!allProducts || allProducts.length === 0) return [];
    
    const lineMap = new Map<string, WooCommerceProduct[]>();
    const processedProducts = new Set<number>();
    
    allProducts.forEach((product: WooCommerceProduct) => {
      // Evitar duplicação
      if (processedProducts.has(product.id)) return;
      
      if (product.categories && product.categories.length > 0) {
        // Procurar categoria de linha
        const lineCategory = product.categories.find((cat: { id: number; name: string; slug: string }) => {
          const catName = cat.name.toLowerCase();
          return catName.includes('linha') || 
                 catName.includes('premium') || 
                 catName.includes('comercial') || 
                 catName.includes('econômica') || 
                 catName.includes('economica');
        });
        
        if (lineCategory) {
          const existing = lineMap.get(lineCategory.name) || [];
          existing.push(product);
          lineMap.set(lineCategory.name, existing);
          processedProducts.add(product.id);
        }
      }
    });
    
    return Array.from(lineMap.entries()).map(([name, products]) => ({
      name,
      products
    }));
  };

  const productLines = groupAllProductsByLine();
  
  // Filtrar linhas se houver filtro selecionado
  const filteredLines = selectedLineFilter
    ? productLines.filter(line => normalizeLineName(line.name).includes(selectedLineFilter))
    : productLines;

  const handleProductClick = (product: WooCommerceProduct) => {
    setSelectedProduct(product);
    setSelectedQuantity(1);
    setIsDetailsOpen(true);
  };

  const handleAddToOrder = () => {
    if (!selectedProduct) return;
    
    // Criar item base para o modal
    const emptyProduct: ProductItem = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity: selectedQuantity,
      unitPrice: parseFloat(selectedProduct.price || '0'),
      total: 0,
      codigo: selectedProduct.sku || '',
      discriminacaoProduto: selectedProduct.name,
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
    
    setProductToAdd(emptyProduct);
    setIsDetailsOpen(false);
    setIsAddToOrderOpen(true);
  };

  const handleSaveProductToOrder = (product: ProductItem) => {
    // Navegar para novo pedido com o produto pré-preenchido
    navigate('/orders/new', { 
      state: { 
        prefilledProduct: product 
      } 
    });
  };

  const getStockStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'instock': 'Em estoque',
      'outofstock': 'Fora de estoque',
      'onbackorder': 'Sob encomenda',
    };
    return statusMap[status] || status;
  };

  const getStockStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    const variantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'instock': 'default',
      'outofstock': 'destructive',
      'onbackorder': 'secondary',
    };
    return variantMap[status] || 'outline';
  };

  if (productsError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Produtos</h1>
          <p className="text-muted-foreground mt-1">Catálogo completo de produtos</p>
        </div>
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <div>
              <h3 className="text-lg font-semibold text-foreground">Erro ao carregar produtos</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Não foi possível conectar à API do WooCommerce. Verifique as configurações.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Produtos</h1>
        <p className="text-muted-foreground mt-1">Explore nosso catálogo organizado por categorias</p>
      </div>

      {/* Cache Status Alert */}
      {cacheStats && (
        <Alert>
          <Database className="h-4 w-4" />
          <AlertTitle>Fonte de dados</AlertTitle>
          <AlertDescription>
            {cachedProducts && cachedProducts.length > 0 && !cacheError ? (
              <>
                Usando cache do Supabase ({cachedProducts.length} produtos).
                {cacheStats.products.lastSync && (
                  <span className="ml-2">
                    Última sincronização: {new Date(cacheStats.products.lastSync).toLocaleString('pt-BR')}
                  </span>
                )}
              </>
            ) : (
              <>
                Usando API do WooCommerce direta.
                {cacheStats.isEmpty && (
                  <span className="ml-2 text-amber-600">
                    Cache vazio - os dados serão sincronizados após o login.
                  </span>
                )}
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Barra de Busca */}
      <div className="relative max-w-2xl">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Buscar produtos..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filtros por linha */}
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Filtrar por linha:</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedLineFilter === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedLineFilter(null)}
          >
            Todas as linhas
          </Button>
          {PRODUCT_LINE_FILTERS.map((line) => {
            const colors = getCategoryColor(line.label);
            const isSelected = selectedLineFilter === line.value;

            return (
              <Button
                key={line.value}
                variant="outline"
                size="sm"
                onClick={() => setSelectedLineFilter(isSelected ? null : line.value)}
                className={`${colors.badge} ${isSelected ? 'ring-2 ring-offset-2 ring-primary' : 'opacity-70 hover:opacity-100'}`}
              >
                {line.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Resultados da Busca */}
      {searchTerm && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Resultados da Busca</h2>
          {searchLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : searchResults && searchResults.length > 0 ? (
            <div className="bg-muted/30 rounded-xl p-6">
              <ProductCarousel 
                products={searchResults} 
                onProductClick={handleProductClick}
                categoryColor={getCategoryColor('default')}
              />
            </div>
          ) : (
            <Card className="p-8">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <Package className="w-12 h-12 text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Nenhum produto encontrado</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tente buscar com outros termos.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Categorias com Carrosséis */}
      {productsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : productsError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar produtos</AlertTitle>
          <AlertDescription>
            Não foi possível carregar os produtos. Tente novamente mais tarde.
          </AlertDescription>
        </Alert>
      ) : filteredLines && filteredLines.length > 0 ? (
        <div className="space-y-12">
          {filteredLines.map((line) => (
            <ProductLineSection 
              key={line.name} 
              line={line}
              onProductClick={handleProductClick}
            />
          ))}
        </div>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Nenhum produto encontrado</AlertTitle>
          <AlertDescription>
            Não foram encontrados produtos nesta linha.
          </AlertDescription>
        </Alert>
      )}

      {/* Modal de Detalhes do Produto */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Detalhes do Produto</DialogTitle>
            <DialogDescription>
              Informações completas do produto
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-6 mt-4">
              {/* Imagens do Produto */}
              {selectedProduct.images && selectedProduct.images.length > 0 && (
                <div className="space-y-3">
                  <div className="w-full h-64 bg-gradient-card rounded-lg overflow-hidden">
                    <img
                      src={selectedProduct.images[0].src}
                      alt={selectedProduct.images[0].alt || selectedProduct.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {selectedProduct.images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {selectedProduct.images.slice(1, 5).map((image: { src: string; alt: string }, index: number) => (
                        <div key={index} className="w-full h-20 bg-muted rounded overflow-hidden">
                          <img
                            src={image.src}
                            alt={image.alt || `${selectedProduct.name} ${index + 2}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Informações Principais */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-foreground">
                    {selectedProduct.name}
                  </h3>
                  {selectedProduct.categories && selectedProduct.categories.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-2">
                      {selectedProduct.categories.map((category: { id: number; name: string }) => {
                        const colors = getCategoryColor(category.name);
                        return (
                          <Badge key={category.id} className={colors.badge}>
                            {category.name}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Calculadora de Preço por Quantidade */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-lg mb-3">Preço</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground mb-2">Quantidade</Label>
                        <Input
                          type="number"
                          min="1"
                          value={selectedQuantity}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground mb-2">Preço Unitário</Label>
                        <p className="text-2xl font-bold text-primary">
                          {formatPrice(calculatePriceByQuantity(selectedProduct, selectedQuantity))}
                        </p>
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground mb-2">Total</Label>
                        <p className="text-2xl font-bold text-foreground">
                          {formatPrice(calculatePriceByQuantity(selectedProduct, selectedQuantity) * selectedQuantity)}
                        </p>
                      </div>
                    </div>

                    {/* Tabela de Preços por Quantidade */}
                    {(() => {
                      const tiers = getPriceTiers(selectedProduct);
                      return tiers && tiers.length > 0 && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-sm font-semibold mb-2">Tabela de Preços:</p>
                          <div className="space-y-1">
                            {tiers.map((tier: { min: number; max: number | null; price: number }, index: number) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                  {tier.min} - {tier.max === null ? '∞' : tier.max} unidades:
                                </span>
                                <span className="font-semibold">{formatPrice(tier.price)}/un</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  
                  {/* Botão para abrir formulário completo */}
                  <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-3">
                      Para adicionar este produto ao pedido com todas as especificações (dimensões, acabamentos, etc.), clique no botão abaixo:
                    </p>
                    <Button onClick={handleAddToOrder} className="w-full gap-2" size="lg">
                      <ShoppingCart className="w-5 h-5" />
                      Adicionar ao Pedido com Especificações Completas
                    </Button>
                  </div>
                </div>

                {/* Estoque */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-lg mb-3">Estoque</h4>
                  <div className="flex items-center gap-4">
                    <Badge variant={getStockStatusVariant(selectedProduct.stock_status)}>
                      {getStockStatusText(selectedProduct.stock_status)}
                    </Badge>
                    {selectedProduct.stock_quantity !== null && selectedProduct.stock_status === 'instock' && (
                      <p className="text-sm text-muted-foreground">
                        {selectedProduct.stock_quantity} unidades disponíveis
                      </p>
                    )}
                  </div>
                </div>

                {/* Descrição */}
                {selectedProduct.description && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-lg mb-3">Descrição</h4>
                    <div 
                      className="text-sm text-muted-foreground prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: selectedProduct.description }}
                    />
                  </div>
                )}

                {/* Variações do Produto */}
                {selectedProduct.variations && selectedProduct.variations.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-lg mb-3">Variações Disponíveis</h4>
                    <div className="space-y-3">
                      {selectedProduct.variations.slice(0, 10).map((variation: any, index: number) => (
                        <div key={index} className="border rounded-lg p-3 bg-muted/30">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium text-sm">
                                Variação #{variation.id}
                              </div>
                              {variation.attributes && variation.attributes.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {variation.attributes.map((attr: any, attrIndex: number) => (
                                    <div key={attrIndex} className="text-xs text-muted-foreground">
                                      <span className="font-medium">{attr.name}:</span> {attr.option}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-primary">
                                {formatPrice(parseFloat(variation.price || variation.regular_price || '0'))}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {variation.stock_status === 'instock' ? 'Em estoque' : 'Indisponível'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {selectedProduct.variations.length > 10 && (
                        <p className="text-xs text-muted-foreground text-center">
                          E mais {selectedProduct.variations.length - 10} variações...
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Atributos do Produto */}
                {selectedProduct.attributes && selectedProduct.attributes.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-lg mb-3">Especificações Técnicas</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedProduct.attributes.map((attr, index) => (
                        <div key={index} className="text-sm">
                          <span className="text-muted-foreground font-medium">{attr.name}:</span>
                          <p className="mt-1">
                            {attr.options && attr.options.length > 0 
                              ? attr.options.join(', ') 
                              : 'N/A'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Adicionar ao Pedido */}
      {productToAdd && (
        <ProductFormModal
          open={isAddToOrderOpen}
          onOpenChange={setIsAddToOrderOpen}
          item={productToAdd}
          onSave={handleSaveProductToOrder}
        />
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default Products;
