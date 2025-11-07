import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { Badge } from "@/componentes/ui/badge";
import { Button } from "@/componentes/ui/button";
import { Input } from "@/componentes/ui/input";
import { Package, Search, Loader2, AlertCircle, Tag, Boxes, Filter, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getProducts, getCategories, type WooCommerceProduct } from "@/lib/woocommerce";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/componentes/ui/dialog";
import { Label } from "@/componentes/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/componentes/ui/select";

const Products = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<WooCommerceProduct | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filtros
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [stockStatus, setStockStatus] = useState<string>("");
  const [orderBy, setOrderBy] = useState<string>("date");
  const [order, setOrder] = useState<string>("desc");
  
  const perPage = 12;

  // Buscar categorias
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories(),
  });

  const { data: products, isLoading, error, refetch } = useQuery({
    queryKey: ['products', page, searchTerm, selectedCategory, stockStatus, orderBy, order],
    queryFn: () => getProducts({
      page,
      per_page: perPage,
      search: searchTerm || undefined,
      category: selectedCategory || undefined,
      stock_status: stockStatus as 'instock' | 'outofstock' | 'onbackorder' || undefined,
      orderby: orderBy as 'date' | 'title' | 'price',
      order: order as 'asc' | 'desc',
    }),
    retry: 1,
  });

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

  const formatPrice = (price: string) => {
    if (!price || price === '0' || price === '') return 'Preço não disponível';
    return `R$ ${parseFloat(price).toFixed(2).replace('.', ',')}`;
  };

  const handleProductClick = (product: WooCommerceProduct) => {
    setSelectedProduct(product);
    setIsDetailsOpen(true);
  };

  const clearFilters = () => {
    setSelectedCategory("");
    setStockStatus("");
    setOrderBy("date");
    setOrder("desc");
    setSearchTerm("");
    setPage(1);
  };

  const hasActiveFilters = selectedCategory || stockStatus || searchTerm;

  if (error) {
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
            <Button onClick={() => refetch()}>Tentar Novamente</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Produtos</h1>
        <p className="text-muted-foreground mt-1">Catálogo completo de produtos</p>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
          <Button 
            variant={showFilters ? "default" : "outline"} 
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button onClick={() => refetch()} variant="outline">Atualizar</Button>
        </div>

        {/* Painel de Filtros */}
        {showFilters && (
          <Card className="p-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Filtros em desenvolvimento...</p>
              
              {/* Categoria - Temporariamente simplificado */}
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input 
                  placeholder="Digite para filtrar categorias"
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              {/* Status do Estoque - Temporariamente simplificado */}
              <div className="space-y-2">
                <Label>Status do Estoque</Label>
                <div className="flex gap-2">
                  <Button
                    variant={stockStatus === "" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setStockStatus("");
                      setPage(1);
                    }}
                  >
                    Todos
                  </Button>
                  <Button
                    variant={stockStatus === "instock" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setStockStatus("instock");
                      setPage(1);
                    }}
                  >
                    Em estoque
                  </Button>
                  <Button
                    variant={stockStatus === "outofstock" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setStockStatus("outofstock");
                      setPage(1);
                    }}
                  >
                    Fora de estoque
                  </Button>
                </div>
              </div>

              {/* Ordenar Por */}
              <div className="space-y-2">
                <Label>Ordenar Por</Label>
                <div className="flex gap-2">
                  <Button
                    variant={orderBy === "date" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setOrderBy("date");
                      setPage(1);
                    }}
                  >
                    Data
                  </Button>
                  <Button
                    variant={orderBy === "title" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setOrderBy("title");
                      setPage(1);
                    }}
                  >
                    Nome
                  </Button>
                  <Button
                    variant={orderBy === "price" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setOrderBy("price");
                      setPage(1);
                    }}
                  >
                    Preço
                  </Button>
                </div>
              </div>

              {/* Ordem */}
              <div className="space-y-2">
                <Label>Ordem</Label>
                <div className="flex gap-2">
                  <Button
                    variant={order === "asc" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setOrder("asc");
                      setPage(1);
                    }}
                  >
                    Crescente
                  </Button>
                  <Button
                    variant={order === "desc" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setOrder("desc");
                      setPage(1);
                    }}
                  >
                    Decrescente
                  </Button>
                </div>
              </div>
            </div>

            {/* Botão Limpar Filtros */}
            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Limpar Filtros
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : products && products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product: WooCommerceProduct) => (
              <Card 
                key={product.id} 
                className="shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleProductClick(product)}
              >
                <CardHeader>
                  <div className="w-full h-32 bg-gradient-card rounded-lg flex items-center justify-center mb-4 overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0].src}
                        alt={product.images[0].alt || product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-12 h-12 text-primary" />
                    )}
                  </div>
                  <CardTitle className="flex flex-col gap-2">
                    <span className="line-clamp-2">{product.name}</span>
                    <div className="flex gap-2 flex-wrap">
                      {product.categories.map((category) => (
                        <Badge key={category.id} variant="outline" className="text-xs">
                          {category.name}
                        </Badge>
                      ))}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(product.price)}
                    </span>
                    <Badge variant={getStockStatusVariant(product.stock_status)}>
                      {getStockStatusText(product.stock_status)}
                    </Badge>
                  </div>
                  {product.stock_quantity !== null && product.stock_status === 'instock' && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Quantidade: {product.stock_quantity}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-center gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <span className="flex items-center px-4 text-sm text-muted-foreground">
              Página {page}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage(p => p + 1)}
              disabled={!products || products.length < perPage}
            >
              Próxima
            </Button>
          </div>
        </>
      ) : (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <Package className="w-12 h-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold text-foreground">Nenhum produto encontrado</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchTerm ? 'Tente buscar com outros termos.' : 'Nenhum produto cadastrado ainda.'}
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

                {/* Preços */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    Preços
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Preço Regular</Label>
                      <p className="text-lg font-bold text-foreground">
                        {formatPrice(selectedProduct.regular_price)}
                      </p>
                    </div>
                    {selectedProduct.sale_price && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Preço Promocional</Label>
                        <p className="text-lg font-bold text-primary">
                          {formatPrice(selectedProduct.sale_price)}
                        </p>
                      </div>
                    )}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <Badge variant={getStockStatusVariant(selectedProduct.stock_status)}>
                        {getStockStatusText(selectedProduct.stock_status)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Estoque */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Boxes className="w-5 h-5" />
                    Estoque
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Quantidade em Estoque</Label>
                      <p className="text-sm font-medium">
                        {selectedProduct.stock_quantity !== null 
                          ? `${selectedProduct.stock_quantity} unidades`
                          : 'Não gerenciado'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">SKU</Label>
                      <p className="text-sm font-medium">
                        {selectedProduct.sku || 'Não definido'}
                      </p>
                    </div>
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

                {/* Descrição Curta */}
                {selectedProduct.short_description && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-lg mb-3">Resumo</h4>
                    <div 
                      className="text-sm text-muted-foreground prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: selectedProduct.short_description }}
                    />
                  </div>
                )}

                {/* Informações Adicionais */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-lg mb-3">Informações Adicionais</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">ID do Produto</Label>
                      <p className="text-sm font-medium">#{selectedProduct.id}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Tipo</Label>
                      <p className="text-sm font-medium">{selectedProduct.type || 'Simples'}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Em Promoção</Label>
                      <p className="text-sm font-medium">{selectedProduct.on_sale ? 'Sim' : 'Não'}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Link</Label>
                      <a 
                        href={selectedProduct.permalink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Ver na loja
                      </a>
                    </div>
                  </div>
                </div>
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
    </div>
  );
};

export default Products;
