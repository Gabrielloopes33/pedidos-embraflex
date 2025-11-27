import { Label } from "@/componentes/ui/label";
import { Input } from "@/componentes/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/componentes/ui/select";
import type { ProductItem } from "../types";

interface ProductBasicInfoProps {
  item: ProductItem;
  onUpdate: <K extends keyof ProductItem>(field: K, value: ProductItem[K]) => void;
  availableQuantities?: number[]; // Quantidades disponíveis vindas do produto
  availableImpressionTypes?: string[]; // Tipos de impressão vindos do produto
  availableColors?: string[]; // Cores disponíveis vindas do produto
}

export function ProductBasicInfo({ item, onUpdate, availableQuantities, availableImpressionTypes, availableColors }: ProductBasicInfoProps) {
  const hasAvailableQuantities = availableQuantities && availableQuantities.length > 0;
  
  // Se o produto tiver tipos de impressão específicos, usar eles
  const impressionTypes = availableImpressionTypes && availableImpressionTypes.length > 0 
    ? availableImpressionTypes 
    : ['Digital', 'Serigrafia', 'Offset'];

  // Cores padrão caso não venham do produto
  const defaultColors = [
    '1x0 (1 cor frente)',
    '1x1 (1 cor frente e verso)',
    '2x0 (2 cores frente)',
    '2x2 (2 cores frente e verso)',
    '4x0 (4 cores frente)',
    '4x4 (4 cores frente e verso)',
  ];

  // Usar cores do produto se disponíveis, senão usar padrão
  const colors = availableColors && availableColors.length > 0 
    ? availableColors 
    : defaultColors;

  // Mostrar campo de cores se:
  // 1. Houver cores disponíveis no produto (independente do tipo de impressão)
  // 2. OU se o tipo for serigrafia
  const shouldShowColors = (availableColors && availableColors.length > 0) || 
                          item.tipoImpressao?.toLowerCase() === 'serigrafia';

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
          <Label>Tipo de Impressão</Label>
          <Select
            value={item.tipoImpressao}
            onValueChange={(value) => onUpdate('tipoImpressao', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {impressionTypes.map((type) => (
                <SelectItem key={type} value={type.toLowerCase()}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

      {/* Mostrar cores de impressão se disponível no produto ou se for serigrafia */}
      {shouldShowColors && (
        <div className="space-y-2">
          <Label>
            Cores de Impressão
            {availableColors && availableColors.length > 0 && (
              <span className="ml-2 text-xs text-muted-foreground">(do produto)</span>
            )}
          </Label>
          <Select
            value={item.coresImpressao}
            onValueChange={(value) => onUpdate('coresImpressao', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione as cores" />
            </SelectTrigger>
            <SelectContent>
              {colors.map((color) => (
                <SelectItem key={color} value={color}>
                  {color}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </>
  );
}
