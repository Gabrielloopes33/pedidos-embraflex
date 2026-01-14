// ProductSearch - Autocomplete search for WooCommerce products
import { useState, useEffect, useRef } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/componentes/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover';
import { Button } from '@/componentes/ui/button';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { searchProducts, WooCommerceProduct } from '@/lib/woocommerce';
import { useQuery } from '@tanstack/react-query';

interface ProductSearchProps {
  onSelect: (product: WooCommerceProduct) => void;
  placeholder?: string;
  value?: string;
}

export function ProductSearch({ onSelect, placeholder = 'Buscar produto...', value }: ProductSearchProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedValue, setSelectedValue] = useState(value || '');

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', debouncedSearch],
    queryFn: () => searchProducts(debouncedSearch),
    enabled: debouncedSearch.length > 0,
    staleTime: 1000 * 60, // 1 minute
  });

  const handleSelect = (product: WooCommerceProduct) => {
    setSelectedValue(product.name);
    setOpen(false);
    onSelect(product);
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(parseFloat(price));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-12 text-base"
        >
          {selectedValue || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={search}
            onValueChange={setSearch}
            className="h-12"
          />
          <CommandList>
            {isLoading && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Buscando produtos...
                </span>
              </div>
            )}

            {!isLoading && search && products.length === 0 && (
              <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
            )}

            {!isLoading && products.length > 0 && (
              <CommandGroup>
                {products.map((product) => (
                  <CommandItem
                    key={product.id}
                    value={product.name}
                    onSelect={() => handleSelect(product)}
                    className="flex items-start gap-3 p-3 cursor-pointer"
                  >
                    {/* Product Image */}
                    {product.images?.[0]?.src && (
                      <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden bg-muted">
                        <img
                          src={product.images[0].src}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm leading-tight mb-1">
                        {product.name}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>SKU: {product.sku}</span>
                        <span>•</span>
                        <span className="font-medium text-foreground">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                    </div>

                    {/* Selected Check */}
                    <Check
                      className={cn(
                        'h-4 w-4 flex-shrink-0',
                        selectedValue === product.name ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {!search && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Digite para buscar produtos...
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
