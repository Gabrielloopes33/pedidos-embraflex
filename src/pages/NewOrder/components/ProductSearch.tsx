import { useState } from "react";
import { Button } from "@/componentes/ui/button";
import { Input } from "@/componentes/ui/input";
import { Label } from "@/componentes/ui/label";
import { Search, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getProducts as getProductsFromWC, getProductById as getProductByIdFromWC } from "@/lib/woocommerce";
import { getCachedProducts, getCachedProductById } from "@/lib/supabase";
import type { WooCommerceProduct, CachedProduct } from "@/lib/types";
import type { ProductItem } from "../types";
import type { ProductLine } from "./ProductsStep";
import { toast } from "sonner";

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
});

interface ProductSearchProps {
  item: ProductItem;
  onSelect: (product: WooCommerceProduct) => void;
  onClear: () => void;
  selectedLine?: ProductLine;
}

export function ProductSearch({ item, onSelect, onClear, selectedLine }: ProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Função para filtrar produtos por linha baseado em categorias
  const filterProductsByLine = (products: WooCommerceProduct[]): WooCommerceProduct[] => {
    if (!selectedLine) return products;

    return products.filter(product => {
      const categoryNames = product.categories.map(cat => cat.name.toLowerCase());
      const categoryString = categoryNames.join(' ');
      
      switch (selectedLine) {
        case 'premium':
          return categoryString.includes('premium') || categoryString.includes('prêmium');
        case 'comercial':
          return categoryString.includes('comercial');
        case 'economica':
          return categoryString.includes('econômica') || categoryString.includes('economica');
        default:
          return true;
      }
    });
  };

  const { data: productsRaw, isLoading: isLoadingProducts, error: productsError } = useQuery({
    queryKey: ['products-search', searchTerm],
    queryFn: async () => {
      // Tentar buscar do cache primeiro
      if (searchTerm && searchTerm.length > 2) {
        try {
          const cached = await getCachedProducts({
            search: searchTerm,
            limit: 50,
          });
          if (cached.length > 0) {
            return cached.map(convertCachedProduct);
          }
        } catch (cacheError) {
          console.warn('⚠️ Failed to fetch from cache:', cacheError);
        }
      }
      // Fallback para WooCommerce
      return getProductsFromWC({
        search: searchTerm || undefined,
        per_page: 50,
      });
    },
    enabled: searchTerm.length > 2,
  });

  // Aplicar filtro de linha aos produtos
  const products = productsRaw ? filterProductsByLine(productsRaw) : [];

  const handleSelect = async (product: WooCommerceProduct) => {
    try {
      // Tentar buscar do cache primeiro
      let fullProduct = product;
      try {
        const cached = await getCachedProductById(product.id);
        if (cached) {
          fullProduct = convertCachedProduct(cached);
        } else {
          fullProduct = await getProductByIdFromWC(product.id);
        }
      } catch (cacheError) {
        console.warn('⚠️ Failed to fetch from cache, using WC:', cacheError);
        fullProduct = await getProductByIdFromWC(product.id);
      }
      onSelect(fullProduct);
      setSearchTerm("");
    } catch (error) {
      console.error('Erro ao buscar dados completos do produto:', error);
      toast.error('Erro ao carregar dados do produto.');
    }
  };

  return (
    <div className="space-y-2">
      <Label>Produto (WooCommerce)</Label>
      {selectedLine && (
        <div className="mb-2">
          <span className={`text-xs px-2 py-1 rounded-md font-medium ${
            selectedLine === 'premium' ? 'bg-amber-100 text-amber-700' :
            selectedLine === 'comercial' ? 'bg-blue-100 text-blue-700' :
            'bg-green-100 text-green-700'
          }`}>
            Filtrando: LINHA {selectedLine.toUpperCase()}
          </span>
        </div>
      )}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Digite pelo menos 3 caracteres para buscar..."
            value={item.productId > 0 ? item.productName : searchTerm}
            onChange={(e) => {
              if (item.productId === 0) {
                setSearchTerm(e.target.value);
              }
            }}
            className="pl-10"
            disabled={item.productId > 0}
          />
          {searchTerm.length > 2 && item.productId === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto z-50">
              {isLoadingProducts ? (
                <div className="p-3 text-center text-muted-foreground">
                  Buscando produtos...
                </div>
              ) : productsError ? (
                <div className="p-3 text-center text-destructive">
                  Erro ao buscar produtos
                </div>
              ) : products && products.length > 0 ? (
                products.map((product) => (
                  <div
                    key={product.id}
                    className="p-3 hover:bg-accent cursor-pointer border-b last:border-b-0 transition-colors"
                    onClick={() => handleSelect(product)}
                  >
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      R$ {parseFloat(product.price || '0').toFixed(2).replace('.', ',')}
                    </div>
                    {product.sku && (
                      <div className="text-xs text-muted-foreground">
                        SKU: {product.sku}
                      </div>
                    )}
                  </div>
                ))
              ) : searchTerm.length > 2 ? (
                <div className="p-3 text-center text-muted-foreground">
                  Nenhum produto encontrado
                </div>
              ) : null}
            </div>
          )}
        </div>
        {item.productId > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClear}
          >
            Limpar
          </Button>
        )}
      </div>

      {/* Produto Selecionado */}
      {item.productName && (
        <div className="border rounded-md p-3 bg-muted/50 mt-2">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            <span className="font-medium">{item.productName}</span>
            {item.productId > 0 && (
              <span className="text-xs text-muted-foreground ml-auto">
                ID: {item.productId}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
