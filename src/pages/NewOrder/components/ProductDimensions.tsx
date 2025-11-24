import { Label } from "@/componentes/ui/label";
import { Input } from "@/componentes/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/componentes/ui/select";
import type { ProductItem } from "../types";

interface ProductDimensionsProps {
  item: ProductItem;
  onUpdate: <K extends keyof ProductItem>(field: K, value: ProductItem[K]) => void;
}

export function ProductDimensions({ item, onUpdate }: ProductDimensionsProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Largura (cm)</Label>
          <Input
            type="number"
            step="0.1"
            value={item.larguraCm}
            onChange={(e) => onUpdate('larguraCm', parseFloat(e.target.value) || 0)}
            placeholder="0.0"
          />
        </div>
        <div className="space-y-2">
          <Label>Altura (cm)</Label>
          <Input
            type="number"
            step="0.1"
            value={item.alturaCm}
            onChange={(e) => onUpdate('alturaCm', parseFloat(e.target.value) || 0)}
            placeholder="0.0"
          />
        </div>
        <div className="space-y-2">
          <Label>Tipo de Impressão</Label>
          <Select
            value={item.tipoImpressao}
            onValueChange={(value) => onUpdate('tipoImpressao', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="digital">Digital</SelectItem>
              <SelectItem value="serigrafia">Serigrafia</SelectItem>
              <SelectItem value="offset">Offset</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Cores de Impressão</Label>
        <Select
          value={item.coresImpressao}
          onValueChange={(value) => onUpdate('coresImpressao', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione as cores" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1x0">1x0 (1 cor frente)</SelectItem>
            <SelectItem value="1x1">1x1 (1 cor frente e verso)</SelectItem>
            <SelectItem value="2x0">2x0 (2 cores frente)</SelectItem>
            <SelectItem value="2x2">2x2 (2 cores frente e verso)</SelectItem>
            <SelectItem value="4x0">4x0 (4 cores frente)</SelectItem>
            <SelectItem value="4x4">4x4 (4 cores frente e verso)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
