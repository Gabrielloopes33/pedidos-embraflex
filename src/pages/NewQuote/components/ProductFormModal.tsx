// ProductFormModal - Modal para adicionar/editar produtos na cotação
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/componentes/ui/dialog';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Checkbox } from '@/componentes/ui/checkbox';
import { QuoteProduct } from '@/lib/quotes';
import { ProductSearch } from './ProductSearch';
import { WooCommerceProduct } from '@/lib/woocommerce';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: QuoteProduct) => void;
  initialProduct?: QuoteProduct;
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSave,
  initialProduct,
}: ProductFormModalProps) {
  const [selectedProduct, setSelectedProduct] = useState<WooCommerceProduct | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [hotStamp, setHotStamp] = useState(false);
  const [eyelets, setEyelets] = useState(false);
  const [cord, setCord] = useState(false);
  const [price, setPrice] = useState(0);

  // Initialize form with initial product if editing
  useEffect(() => {
    if (initialProduct && isOpen) {
      // When editing, set the form with existing data
      setQuantity(initialProduct.quantity);
      setWidth(initialProduct.width?.toString() || '');
      setHeight(initialProduct.height?.toString() || '');
      setHotStamp(initialProduct.finishing.hotStamp);
      setEyelets(initialProduct.finishing.eyelets);
      setCord(initialProduct.finishing.cord);
      setPrice(initialProduct.price);

      // Mock selected product from initial data
      setSelectedProduct({
        id: parseInt(initialProduct.id),
        name: initialProduct.name,
        sku: initialProduct.sku,
        price: initialProduct.price.toString(),
        images: initialProduct.imageUrl ? [{ src: initialProduct.imageUrl }] : [],
      } as WooCommerceProduct);
    } else if (!isOpen) {
      // Reset form when closing
      resetForm();
    }
  }, [isOpen, initialProduct]);

  const resetForm = () => {
    setSelectedProduct(null);
    setQuantity(1);
    setWidth('');
    setHeight('');
    setHotStamp(false);
    setEyelets(false);
    setCord(false);
    setPrice(0);
  };

  const handleProductSelect = (product: WooCommerceProduct) => {
    setSelectedProduct(product);
    setPrice(parseFloat(product.price));
  };

  const calculateSubtotal = () => {
    return price * quantity;
  };

  const handleSave = () => {
    if (!selectedProduct) return;

    const product: QuoteProduct = {
      id: selectedProduct.id.toString(),
      name: selectedProduct.name,
      sku: selectedProduct.sku,
      price,
      quantity,
      width: width ? parseFloat(width) : undefined,
      height: height ? parseFloat(height) : undefined,
      finishing: {
        hotStamp,
        eyelets,
        cord,
      },
      subtotal: calculateSubtotal(),
      imageUrl: selectedProduct.images?.[0]?.src,
    };

    onSave(product);
    resetForm();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const isValid = selectedProduct && quantity > 0 && price > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialProduct ? 'Editar Produto' : 'Adicionar Produto'}
          </DialogTitle>
          <DialogDescription>
            Configure o produto com quantidade e acabamentos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Product Search */}
          {!initialProduct && (
            <div className="space-y-2">
              <Label>Buscar Produto *</Label>
              <ProductSearch
                onSelect={handleProductSelect}
                placeholder="Digite o nome ou SKU do produto..."
              />
              {selectedProduct && (
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <p className="font-medium">{selectedProduct.name}</p>
                  <p className="text-sm text-muted-foreground">
                    SKU: {selectedProduct.sku} • Preço base: {formatCurrency(price)}
                  </p>
                </div>
              )}
            </div>
          )}

          {selectedProduct && (
            <>
              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="h-12 text-lg"
                />
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="width">Largura (cm)</Label>
                  <Input
                    id="width"
                    type="number"
                    step="0.1"
                    placeholder="Opcional"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Altura (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.1"
                    placeholder="Opcional"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>

              {/* Finishing Options */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Acabamentos</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="hotStamp"
                      checked={hotStamp}
                      onCheckedChange={(checked) => setHotStamp(checked as boolean)}
                    />
                    <Label
                      htmlFor="hotStamp"
                      className="text-base font-normal cursor-pointer"
                    >
                      Hot Stamp
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="eyelets"
                      checked={eyelets}
                      onCheckedChange={(checked) => setEyelets(checked as boolean)}
                    />
                    <Label
                      htmlFor="eyelets"
                      className="text-base font-normal cursor-pointer"
                    >
                      Ilhós
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="cord"
                      checked={cord}
                      onCheckedChange={(checked) => setCord(checked as boolean)}
                    />
                    <Label
                      htmlFor="cord"
                      className="text-base font-normal cursor-pointer"
                    >
                      Cordão
                    </Label>
                  </div>
                </div>
              </div>

              {/* Price Preview */}
              <div className="pt-4 border-t">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Preço unitário:</span>
                    <span>{formatCurrency(price)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Quantidade:</span>
                    <span>{quantity}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(calculateSubtotal())}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            {initialProduct ? 'Salvar Alterações' : 'Adicionar Produto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
