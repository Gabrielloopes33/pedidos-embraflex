import { Label } from "@/componentes/ui/label";
import { Input } from "@/componentes/ui/input";
import type { ProductItem } from "../types";

interface ProductBasicInfoProps {
  item: ProductItem;
  onUpdate: <K extends keyof ProductItem>(field: K, value: ProductItem[K]) => void;
}

export function ProductBasicInfo({ item, onUpdate }: ProductBasicInfoProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Quantidade *</Label>
          <Input
            type="number"
            value={item.quantity}
            onChange={(e) => onUpdate('quantity', parseInt(e.target.value))}
            min="1"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Valor Unitário (R$)</Label>
          <Input
            type="number"
            step="0.01"
            value={item.unitPrice}
            onChange={(e) => onUpdate('unitPrice', parseFloat(e.target.value) || 0)}
            placeholder="0,00"
            className="font-semibold"
          />
        </div>
        <div className="space-y-2">
          <Label>Código (SKU)</Label>
          <Input
            value={item.codigo}
            onChange={(e) => onUpdate('codigo', e.target.value)}
            placeholder="Código do produto"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Discriminação do Produto</Label>
        <Input
          value={item.discriminacaoProduto}
          onChange={(e) => onUpdate('discriminacaoProduto', e.target.value)}
          placeholder="Descrição do produto"
        />
      </div>
    </>
  );
}
