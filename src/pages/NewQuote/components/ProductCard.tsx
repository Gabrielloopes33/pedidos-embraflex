// ProductCard - Card de produto individual
import { ChevronRight } from 'lucide-react';
import { Card } from '@/componentes/ui/card';
import { Badge } from '@/componentes/ui/badge';

interface ProductCardProps {
  name: string;
  sku: string;
  imageUrl?: string;
  price?: number;
  onClick: () => void;
  category?: string;
}

export function ProductCard({ name, sku, imageUrl, price, onClick, category }: ProductCardProps) {
  return (
    <Card
      className="p-4 cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary"
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          {imageUrl ? (
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              <img
                src={imageUrl}
                alt={name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-primary">
                {sku?.substring(0, 2).toUpperCase() || 'PR'}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{name}</h3>
            <p className="text-sm text-muted-foreground">{sku}</p>
            {category && (
              <Badge variant="outline" className="mt-1 text-xs">
                {category}
              </Badge>
            )}
            {price && (
              <p className="text-sm font-medium text-primary mt-1">
                A partir de R$ {price.toFixed(2)}
              </p>
            )}
          </div>
        </div>

        <ChevronRight className="w-6 h-6 text-muted-foreground flex-shrink-0" />
      </div>
    </Card>
  );
}
