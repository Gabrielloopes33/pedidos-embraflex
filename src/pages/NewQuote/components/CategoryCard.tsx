// CategoryCard - Card de categoria para navegação
import { ChevronRight } from 'lucide-react';
import { Card } from '@/componentes/ui/card';

interface CategoryCardProps {
  name: string;
  imageUrl?: string;
  onClick: () => void;
}

export function CategoryCard({ name, imageUrl, onClick }: CategoryCardProps) {
  return (
    <Card
      className="p-6 cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {imageUrl && (
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              <img
                src={imageUrl}
                alt={name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold">{name}</h3>
          </div>
        </div>
        <ChevronRight className="w-6 h-6 text-muted-foreground" />
      </div>
    </Card>
  );
}
