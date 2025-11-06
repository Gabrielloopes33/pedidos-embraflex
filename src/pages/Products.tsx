import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { Badge } from "@/componentes/ui/badge";
import { Button } from "@/componentes/ui/button";
import { Input } from "@/componentes/ui/input";
import { Package, Search, Loader2, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getProducts, type WooCommerceProduct } from "@/lib/woocommerce";
import { useState } from "react";

const Products = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 12;

  const { data: products, isLoading, error, refetch } = useQuery({
    queryKey: ['products', page, searchTerm],
    queryFn: () => getProducts({
      page,
      per_page: perPage,
      search: searchTerm || undefined,
      orderby: 'date',
      order: 'desc',
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
        <Button onClick={() => refetch()}>Atualizar</Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : products && products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product: WooCommerceProduct) => (
              <Card key={product.id} className="shadow-md hover:shadow-lg transition-shadow cursor-pointer">
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
    </div>
  );
};

export default Products;
