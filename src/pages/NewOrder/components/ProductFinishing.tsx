import { Label } from "@/componentes/ui/label";
import { Checkbox } from "@/componentes/ui/checkbox";
import type { ProductItem } from "../types";
import { FINISHING_PRICES } from "../types";

interface ProductFinishingProps {
  item: ProductItem;
  onUpdate: <K extends keyof ProductItem>(field: K, value: ProductItem[K]) => void;
}

export function ProductFinishing({ item, onUpdate }: ProductFinishingProps) {
  const finishingOptions = [
    { key: 'cordaoColorido' as const, label: 'Cordão Colorido', price: FINISHING_PRICES.cordaoColorido },
    { key: 'gorgurinho' as const, label: 'Gorgurinho', price: FINISHING_PRICES.gorgurinho },
    { key: 'gorgurao' as const, label: 'Gorgurão', price: FINISHING_PRICES.gorgurao },
    { key: 'ilhos' as const, label: 'Ilhós', price: FINISHING_PRICES.ilhos },
    { key: 'hotStamp' as const, label: 'Hot Stamp', price: FINISHING_PRICES.hotStamp },
  ];

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Acabamentos</Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-md">
        {finishingOptions.map((option) => (
          <div key={option.key} className="flex items-center space-x-2">
            <Checkbox
              id={`${item.productId}-${option.key}`}
              checked={item.finishing?.[option.key] || false}
              onCheckedChange={(checked) => {
                onUpdate('finishing', {
                  ...item.finishing,
                  [option.key]: checked === true,
                });
              }}
            />
            <label
              htmlFor={`${item.productId}-${option.key}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
            >
              {option.label}
              <span className="text-xs text-muted-foreground ml-2">
                (R$ {option.price.toFixed(2).replace('.', ',')}/un)
              </span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
