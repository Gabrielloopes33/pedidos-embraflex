import { Card, CardContent } from "@/componentes/ui/card";
import { Badge } from "@/componentes/ui/badge";
import { Button } from "@/componentes/ui/button";
import { Input } from "@/componentes/ui/input";
import { Package, Search, Loader2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getProducts, getCategories, type WooCommerceProduct } from "@/lib/woocommerce";
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

interface Category {
  id: number;
  name: string;
  slug: string;
  count?: number;
}

const ProductCarousel = ({ 
  products, 
  onProductClick 
}: { 
  products: WooCommerceProduct[];
  onProductClick: (product: WooCommerceProduct) => void;
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
  onClick 
}: { 
  product: WooCommerceProduct;
  onClick: () => void;
}) => {
  const price = calculatePriceByQuantity(product, 1);
  const priceTiers = getPriceTiers(product);

  const getStockStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    const variantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'instock': 'default',
      'outofstock': 'destructive',
      'onbackorder': 'secondary',
    };
    return variantMap[status] || 'outline';
  };

  const getStockStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'instock': 'Em estoque',
      'outofstock': 'Fora de estoque',
      'onbackorder': 'Sob encomenda',
    };
    return statusMap[status] || status;
  };

  return (
    <Card 
      className="flex-shrink-0 shadow-md hover:shadow-xl transition-all cursor-pointer hover:scale-105 duration-200"
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
        <h3 className="font-semibold text-sm line-clamp-2 mb-2 min-h-[2.5rem]">
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
          {/* Badges de Categoria e Estoque */}
          <div className="flex flex-wrap gap-1">
            {product.categories && product.categories.length > 0 && (
              product.categories.map((cat) => (
                <Badge key={cat.id} variant="outline" className="text-xs font-semibold">
                  {cat.name}
                </Badge>
              ))
            )}
            <Badge variant={getStockStatusVariant(product.stock_status)} className="text-xs">
              {getStockStatusText(product.stock_status)}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const CategorySection = ({ 
  category, 
  onProductClick 
}: { 
  category: Category;
  onProductClick: (product: WooCommerceProduct) => void;
}) => {
  const { data: products, isLoading } = useQuery({
    queryKey: ['products-by-category', category.id],
    queryFn: () => getProducts({
      category: category.id.toString(),
      per_page: 20,
      orderby: 'popularity',
      order: 'desc'
    }),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">{category.name}</h2>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-3">
        <h2 className="text-2xl font-bold text-foreground">{category.name}</h2>
        <span className="text-sm text-muted-foreground">
          {products.length} {products.length === 1 ? 'produto' : 'produtos'}
        </span>
      </div>
      <ProductCarousel products={products} onProductClick={onProductClick} />
    </div>
  );
};

const Products = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<WooCommerceProduct | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | null>(null);

  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories(),
  });

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['products-search', searchTerm],
    queryFn: () => getProducts({
      search: searchTerm,
      per_page: 20,
    }),
    enabled: searchTerm.length > 0,
  });

  const handleProductClick = (product: WooCommerceProduct) => {
    setSelectedProduct(product);
    setSelectedQuantity(1);
    setIsDetailsOpen(true);
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

  if (categoriesError) {
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

      {/* Filtros de Categoria */}
      {categories && categories.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Filtrar por categoria:</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategoryFilter === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategoryFilter(null)}
            >
              Todas as categorias
            </Button>
            {categories.map((cat: Category) => (
              <Button
                key={cat.id}
                variant={selectedCategoryFilter === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategoryFilter(cat.id)}
              >
                {cat.name}
                {cat.count && cat.count > 0 && (
                  <span className="ml-1.5 text-xs opacity-70">({cat.count})</span>
                )}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Resultados da Busca */}
      {searchTerm && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Resultados da Busca</h2>
          {searchLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : searchResults && searchResults.length > 0 ? (
            <ProductCarousel products={searchResults} onProductClick={handleProductClick} />
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
      {categoriesLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : categories && categories.length > 0 ? (
        <div className="space-y-12">
          {categories
            .filter((cat: Category) => {
              // Filtrar por categoria selecionada se houver
              if (selectedCategoryFilter !== null) {
                return cat.id === selectedCategoryFilter;
              }
              return cat.count && cat.count > 0;
            })
            .map((category: Category) => (
              <CategorySection 
                key={category.id} 
                category={category}
                onProductClick={handleProductClick}
              />
            ))}
        </div>
      ) : (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <Package className="w-12 h-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold text-foreground">Nenhuma categoria encontrada</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Nenhuma categoria cadastrada ainda.
              </p>
            </div>
          </div>
        </Card>
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
                      {selectedProduct.images.slice(1, 5).map((image, index) => (
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
                      {selectedProduct.categories.map((category) => (
                        <Badge key={category.id} variant="outline">
                          {category.name}
                        </Badge>
                      ))}
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
                          onChange={(e) => setSelectedQuantity(Math.max(1, parseInt(e.target.value) || 1))}
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
                            {tiers.map((tier, index) => (
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

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default Products;
