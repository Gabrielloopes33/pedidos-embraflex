import { Label } from "@/componentes/ui/label";
import { Checkbox } from "@/componentes/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/componentes/ui/radio-group";
import type { ProductItem } from "../types";
import { FINISHING_PRICES } from "../types";

interface ProductFinishingProps {
  item: ProductItem;
  onUpdate: <K extends keyof ProductItem>(field: K, value: ProductItem[K]) => void;
}

export function ProductFinishing({ item, onUpdate }: ProductFinishingProps) {
  const acessorios = [
    { key: 'hotStamp' as const, label: 'Hot Stamp', price: FINISHING_PRICES.hotStamp },
    { key: 'ilhos' as const, label: 'Ilhós', price: FINISHING_PRICES.ilhos },
    { key: 'furoPresente' as const, label: 'Furo de Presente', price: FINISHING_PRICES.furoPresente },
  ];

  const cordoes = [
    { value: 'padrão', label: 'Padrão', price: FINISHING_PRICES.cordaoPadrao },
    { value: 'colorido', label: 'Colorido', price: FINISHING_PRICES.cordaoColorido },
    { value: 'gorgurinho', label: 'Gorgurinho', price: FINISHING_PRICES.gorgurinho },
    { value: 'gorgurão', label: 'Gorgurão', price: FINISHING_PRICES.gorgurao },
    { value: 'são francisco', label: 'São Francisco', price: FINISHING_PRICES.saoFrancisco },
  ];

  const coresCordao = [
    { value: 'preto', label: 'Preto', price: FINISHING_PRICES.corCordaoPreto },
    { value: 'branco', label: 'Branco', price: FINISHING_PRICES.corCordaoBranco },
    { value: 'bege', label: 'Bege', price: FINISHING_PRICES.corCordaoBege },
  ];

  // Verificar se a quantidade é menor que 1000 para desabilitar Hot Stamp
  const isHotStampDisabled = item.quantity < 1000;

  return (
    <div className="space-y-6">
      <Label className="text-base font-semibold">Acabamentos</Label>
      
      {/* Acessórios */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-muted-foreground">Acessórios</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-muted/30 rounded-md">
          {acessorios.map((option) => {
            const isDisabled = option.key === 'hotStamp' && isHotStampDisabled;
            
            return (
              <div key={option.key} className="flex items-center space-x-2">
                <Checkbox
                  id={`${item.productId}-${option.key}`}
                  checked={item.finishing?.[option.key] || false}
                  disabled={isDisabled}
                  onCheckedChange={(checked) => {
                    onUpdate('finishing', {
                      ...item.finishing,
                      [option.key]: checked === true,
                    });
                  }}
                />
                <label
                  htmlFor={`${item.productId}-${option.key}`}
                  className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1 ${
                    isDisabled ? 'opacity-50' : ''
                  }`}
                >
                  {option.label}
                  {option.price > 0 && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (R$ {option.price.toFixed(2).replace('.', ',')})
                    </span>
                  )}
                  {isDisabled && (
                    <span className="text-xs text-destructive ml-2">
                      (Disponível apenas para qtd ≥ 1000)
                    </span>
                  )}
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cordão */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-muted-foreground">
          Cordão <span className="text-xs">(selecione apenas 1)</span>
        </Label>
        <RadioGroup
          value={item.finishing?.cordao || ''}
          onValueChange={(value) => {
            onUpdate('finishing', {
              ...item.finishing,
              cordao: value as any,
              // Limpar cor do cordão se não for padrão
              corCordao: value === 'padrão' ? item.finishing.corCordao : '',
            });
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-muted/30 rounded-md">
            {cordoes.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem 
                  value={option.value} 
                  id={`${item.productId}-cordao-${option.value}`}
                />
                <label
                  htmlFor={`${item.productId}-cordao-${option.value}`}
                  className="text-sm font-medium leading-none cursor-pointer flex-1"
                >
                  {option.label}
                  {option.price > 0 && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (R$ {option.price.toFixed(2).replace('.', ',')})
                    </span>
                  )}
                </label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>

      {/* Cor do Cordão (apenas se Padrão selecionado) */}
      {item.finishing?.cordao === 'padrão' && (
        <div className="space-y-3">
          <Label className="text-sm font-medium text-muted-foreground">
            Cor do Cordão <span className="text-xs">(selecione apenas 1)</span>
          </Label>
          <RadioGroup
            value={item.finishing?.corCordao || ''}
            onValueChange={(value) => {
              onUpdate('finishing', {
                ...item.finishing,
                corCordao: value as any,
              });
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-muted/30 rounded-md">
              {coresCordao.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value={option.value} 
                    id={`${item.productId}-cor-${option.value}`}
                  />
                  <label
                    htmlFor={`${item.productId}-cor-${option.value}`}
                    className="text-sm font-medium leading-none cursor-pointer flex-1"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>
      )}
    </div>
  );
}
