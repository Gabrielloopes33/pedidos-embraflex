import { Label } from "@/componentes/ui/label";
import { Input } from "@/componentes/ui/input";
import type { ProductItem } from "../types";

interface ProductDimensionsProps {
  item: ProductItem;
  onUpdate: <K extends keyof ProductItem>(field: K, value: ProductItem[K]) => void;
}

export function ProductDimensions({ item, onUpdate }: ProductDimensionsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Largura (cm)</Label>
        <Input
          type="number"
          step="0.1"
          value={item.larguraCm || ''}
          onChange={(e) => onUpdate('larguraCm', parseFloat(e.target.value) || 0)}
          placeholder="Ex: 15.0"
          disabled={item.larguraCm > 0}
          className={item.larguraCm > 0 ? 'bg-muted' : ''}
        />
      </div>
      <div className="space-y-2">
        <Label>Altura (cm)</Label>
        <Input
          type="number"
          step="0.1"
          value={item.alturaCm || ''}
          onChange={(e) => onUpdate('alturaCm', parseFloat(e.target.value) || 0)}
          placeholder="Ex: 20.0"
          disabled={item.alturaCm > 0}
          className={item.alturaCm > 0 ? 'bg-muted' : ''}
        />
      </div>
    </div>
  );
}
