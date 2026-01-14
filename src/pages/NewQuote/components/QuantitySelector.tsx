// QuantitySelector - Seleção de quantidade com tier pricing
import { Card } from '@/componentes/ui/card';
import { Button } from '@/componentes/ui/button';
import { Check } from 'lucide-react';

interface PriceTier {
  quantity: number;
  price: number;
}

interface QuantitySelectorProps {
  tiers: PriceTier[];
  selectedTier?: PriceTier;
  onSelect: (tier: PriceTier) => void;
}

export function QuantitySelector({ tiers, selectedTier, onSelect }: QuantitySelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {tiers.map((tier) => {
        const isSelected = selectedTier?.quantity === tier.quantity;

        return (
          <Card
            key={tier.quantity}
            className={`p-6 cursor-pointer transition-all ${
              isSelected
                ? 'border-2 border-primary bg-primary/5'
                : 'border-2 border-border hover:border-primary hover:shadow-md'
            }`}
            onClick={() => onSelect(tier)}
          >
            <div className="text-center space-y-3">
              {isSelected && (
                <div className="flex justify-center">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-5 h-5 text-primary-foreground" />
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Quantidade</p>
                <p className="text-3xl font-bold">{tier.quantity}</p>
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">Preço unitário</p>
                <p className="text-2xl font-bold text-primary">
                  R$ {tier.price.toFixed(2)}
                </p>
              </div>

              <div className="pt-2">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-semibold">
                  R$ {(tier.quantity * tier.price).toFixed(2)}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
