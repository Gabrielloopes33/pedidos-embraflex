import { Label } from "@/componentes/ui/label";
import { Checkbox } from "@/componentes/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/componentes/ui/radio-group";
import { Input } from "@/componentes/ui/input";
import type { ProductItem } from "../types";
import { FINISHING_PRICES } from "../types";

// Verifica se o produto é do tipo que tem acabamentos (mesmo critério do botão de engrenagem)
function isProductWithFinishing(item: ProductItem): boolean {
  const name = item.productName?.toLowerCase() || '';
  const code = item.codigo?.toLowerCase() || '';
  
  return (
    code.startsWith('k-') ||
    (name.includes('sacola') && name.includes('papel')) ||
    name.includes('sacola de papel') ||
    name.includes('kraft') ||
    name.includes('linha premium') ||
    name.includes('linha comercial') ||
    name.includes('linha econômica') ||
    name.includes('linha economica')
  );
}

interface ProductFinishingProps {
  item: ProductItem;
  onUpdate: <K extends keyof ProductItem>(field: K, value: ProductItem[K]) => void;
}

export function ProductFinishing({ item, onUpdate }: ProductFinishingProps) {
  const acessorios = [
    { key: 'hotStamp' as const, label: 'Hot Stamp', showPrice: false }, // Preço depende da cor
    { key: 'ilhos' as const, label: 'Ilhós', price: FINISHING_PRICES.ilhos },
    { key: 'furoPresente' as const, label: 'Furo de Presente', price: FINISHING_PRICES.furoPresente },
  ];

  const cordoes = [
    { value: 'padrão', label: 'Padrão', price: 0, priceLabel: '(Grátis)' },
    { value: 'colorido', label: 'Colorido', price: FINISHING_PRICES.cordaoColorido },
    { value: 'gorgurinho', label: 'Gorgurinho', price: FINISHING_PRICES.cordaoEspecialPretoBranco, priceRange: `R$ ${FINISHING_PRICES.cordaoEspecialPretoBranco.toFixed(2).replace('.', ',')} - R$ ${FINISHING_PRICES.cordaoEspecialColorido.toFixed(2).replace('.', ',')}` },
    { value: 'gorgurão', label: 'Gorgurão', price: FINISHING_PRICES.cordaoEspecialPretoBranco, priceRange: `R$ ${FINISHING_PRICES.cordaoEspecialPretoBranco.toFixed(2).replace('.', ',')} - R$ ${FINISHING_PRICES.cordaoEspecialColorido.toFixed(2).replace('.', ',')}` },
    { value: 'são francisco', label: 'São Francisco', price: FINISHING_PRICES.cordaoEspecialPretoBranco, priceRange: `R$ ${FINISHING_PRICES.cordaoEspecialPretoBranco.toFixed(2).replace('.', ',')} - R$ ${FINISHING_PRICES.cordaoEspecialColorido.toFixed(2).replace('.', ',')}` },
  ];

  const coresCordao = [
    { value: 'preto', label: 'Preto' },
    { value: 'branco', label: 'Branco' },
    { value: 'colorido', label: 'Colorido' },
  ];

  const coresHotStamp = [
    { value: 'dourado', label: 'Dourado', price: FINISHING_PRICES.hotStampDouradoPrata },
    { value: 'prata', label: 'Prata', price: FINISHING_PRICES.hotStampDouradoPrata },
    { value: 'colorido', label: 'Colorido', price: FINISHING_PRICES.hotStampColorido },
  ];

  // Verificar se a quantidade é menor que 1000 para desabilitar Hot Stamp
  const isHotStampDisabled = item.quantity < 1000;

  return (
    <div className="space-y-6">
      <Label className="text-base font-semibold">Acabamentos</Label>
      
      {/* Tipo de Laminação - aparece para todos os produtos com acabamentos */}
      {isProductWithFinishing(item) && (
        <div className="space-y-3 p-4 bg-purple-50 border border-purple-200 rounded-md">
          <Label className="text-sm font-medium text-purple-900">
            Tipo de Laminação <span className="text-xs">(selecione apenas 1)</span>
          </Label>
          <RadioGroup
            value={item.laminationType || ''}
            onValueChange={(value) => {
              onUpdate('laminationType', value as 'fosco' | 'brilho');
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="fosco"
                  id={`${item.productId}-lamination-fosco`}
                />
                <label
                  htmlFor={`${item.productId}-lamination-fosco`}
                  className="text-sm font-medium leading-none cursor-pointer flex-1"
                >
                  Fosco
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="brilho"
                  id={`${item.productId}-lamination-brilho`}
                />
                <label
                  htmlFor={`${item.productId}-lamination-brilho`}
                  className="text-sm font-medium leading-none cursor-pointer flex-1"
                >
                  Brilho
                </label>
              </div>
            </div>
          </RadioGroup>
        </div>
      )}

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
                      // Se desmarcou hot stamp, limpar cor
                      ...(option.key === 'hotStamp' && !checked ? { hotStampCor: '', hotStampCorManual: '' } : {}),
                      // Se desmarcou ilhós, limpar cor manual
                      ...(option.key === 'ilhos' && !checked ? { ilhosCorManual: '' } : {}),
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
                  {option.showPrice !== false && option.price && option.price > 0 && (
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

        {/* Campo de cor manual para Ilhós */}
        {item.finishing?.ilhos && (
          <div className="mt-3 ml-6">
            <Label className="text-xs text-muted-foreground mb-1 block">Cor do Ilhós (opcional):</Label>
            <Input
              placeholder="Ex: Dourado, Prata, Preto... (padrão: prata)"
              value={item.finishing?.ilhosCorManual || ''}
              onChange={(e) => {
                onUpdate('finishing', {
                  ...item.finishing,
                  ilhosCorManual: e.target.value,
                });
              }}
              className="max-w-xs"
            />
          </div>
        )}
      </div>

      {/* Cor do Hot Stamp (apenas se Hot Stamp marcado) */}
      {item.finishing?.hotStamp && (
        <div className="space-y-3">
          <Label className="text-sm font-medium text-muted-foreground">
            Cor do Hot Stamp <span className="text-xs">(selecione apenas 1)</span>
          </Label>
          <RadioGroup
            value={item.finishing?.hotStampCor || ''}
            onValueChange={(value) => {
              onUpdate('finishing', {
                ...item.finishing,
                hotStampCor: value as any,
                // Limpar cor manual se não for colorido
                hotStampCorManual: value === 'colorido' ? item.finishing?.hotStampCorManual : '',
              });
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-muted/30 rounded-md">
              {coresHotStamp.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={option.value}
                    id={`${item.productId}-hotstamp-${option.value}`}
                  />
                  <label
                    htmlFor={`${item.productId}-hotstamp-${option.value}`}
                    className="text-sm font-medium leading-none cursor-pointer flex-1"
                  >
                    {option.label}
                    <span className="text-xs text-muted-foreground ml-2">
                      (R$ {option.price.toFixed(2).replace('.', ',')})
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </RadioGroup>
          {/* Campo de cor manual para Hot Stamp colorido */}
          {item.finishing?.hotStampCor === 'colorido' && (
            <div className="mt-3">
              <Label className="text-xs text-muted-foreground mb-1 block">Especifique a cor:</Label>
              <Input
                placeholder="Ex: Vermelho, Azul Royal, Rosa Pink..."
                value={item.finishing?.hotStampCorManual || ''}
                onChange={(e) => {
                  onUpdate('finishing', {
                    ...item.finishing,
                    hotStampCorManual: e.target.value,
                  });
                }}
                className="max-w-xs"
              />
            </div>
          )}
        </div>
      )}

      {/* Cordão */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-muted-foreground">
          Cordão <span className="text-xs">(selecione apenas 1)</span>
        </Label>
        <RadioGroup
          value={item.finishing?.cordao || ''}
          onValueChange={(value) => {
            const isCordaoEspecial = ['gorgurinho', 'gorgurão', 'são francisco'].includes(value);
            onUpdate('finishing', {
              ...item.finishing,
              cordao: value as any,
              // Limpar cor do cordão ao trocar tipo
              corCordao: '',
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
                  {option.priceLabel && (
                    <span className="text-xs text-muted-foreground ml-2">
                      {option.priceLabel}
                    </span>
                  )}
                  {option.priceRange && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({option.priceRange})
                    </span>
                  )}
                  {!option.priceLabel && !option.priceRange && option.price > 0 && (
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

      {/* Cor do Cordão - aparece para todos os cordões exceto "colorido" (que já é colorido) */}
      {item.finishing?.cordao && item.finishing?.cordao !== 'colorido' && (
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

      {/* CAMPO DE TEXTO: aparece quando Cor do Cordão é COLORIDO */}
      {console.log('DEBUG corCordao:', JSON.stringify(item.finishing?.corCordao)) || item.finishing?.corCordao?.toLowerCase?.() === 'colorido' && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <Label className="text-sm font-medium text-blue-900 mb-2 block">
            Especifique a cor do cordão:
          </Label>
          <Input
            placeholder="Ex: Vermelho, Azul Royal, Rosa Pink..."
            value={item.finishing?.cordaoCorManual || ''}
            onChange={(e) => {
              onUpdate('finishing', {
                ...item.finishing,
                cordaoCorManual: e.target.value,
              });
            }}
            className="max-w-sm bg-white"
          />
        </div>
      )}

      {/* Campo de cor manual para cordão tipo "colorido" (quando o próprio cordão é colorido) */}
      {item.finishing?.cordao === 'colorido' && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <Label className="text-sm font-medium text-blue-900 mb-2 block">
            Especifique a cor do cordão:
          </Label>
          <Input
            placeholder="Ex: Vermelho, Azul Royal, Rosa Pink..."
            value={item.finishing?.cordaoCorManual || ''}
            onChange={(e) => {
              onUpdate('finishing', {
                ...item.finishing,
                cordaoCorManual: e.target.value,
              });
            }}
            className="max-w-sm bg-white"
          />
        </div>
      )}
    </div>
  );
}
