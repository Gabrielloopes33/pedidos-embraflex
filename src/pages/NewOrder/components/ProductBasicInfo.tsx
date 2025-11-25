import { Label } from "@/componentes/ui/label";
import { Input } from "@/componentes/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/componentes/ui/select";
import type { ProductItem } from "../types";

interface ProductBasicInfoProps {
  item: ProductItem;
  onUpdate: <K extends keyof ProductItem>(field: K, value: ProductItem[K]) => void;
  availableQuantities?: number[]; // Quantidades disponíveis vindas do produto
}

export function ProductBasicInfo({ item, onUpdate, availableQuantities }: ProductBasicInfoProps) {
  const hasAvailableQuantities = availableQuantities && availableQuantities.length > 0;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Quantidade *</Label>
          {hasAvailableQuantities ? (
            <Select
              value={item.quantity.toString()}
              onValueChange={(value) => onUpdate('quantity', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a quantidade" />
              </SelectTrigger>
              <SelectContent>
                {availableQuantities.map((qty) => (
                  <SelectItem key={qty} value={qty.toString()}>
                    {qty} un
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              type="number"
              value={item.quantity}
              onChange={(e) => onUpdate('quantity', parseInt(e.target.value))}
              min="1"
              required
            />
          )}
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
