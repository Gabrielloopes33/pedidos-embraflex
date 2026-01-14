// FinishingModal - Modal para seleção de acabamentos com preços
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/componentes/ui/dialog';
import { Button } from '@/componentes/ui/button';
import { Checkbox } from '@/componentes/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/componentes/ui/radio-group';
import { Label } from '@/componentes/ui/label';
import { Separator } from '@/componentes/ui/separator';

export interface FinishingOptions {
  // Acessórios (checkboxes - múltipla escolha)
  hotStamp: boolean;
  ilhos: boolean;
  furoPresente: boolean;
  
  // Cordão (radio - escolha única)
  cordao: 'nenhum' | 'padrao' | 'gorgurao' | 'saoFrancisco' | 'colorido' | 'gorgurinho';
  
  // Cor do Cordão (radio - escolha única)
  corCordao: 'nenhum' | 'preto' | 'branco' | 'colorido';
}

interface FinishingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (finishing: FinishingOptions, totalFinishingCost: number) => void;
  initialFinishing?: FinishingOptions;
  quantity: number; // Para calcular o custo total
}

// Preços dos acabamentos (por unidade)
const FINISHING_PRICES = {
  acessorios: {
    hotStamp: 0,
    ilhos: 0.35,
    furoPresente: 0,
  },
  cordao: {
    nenhum: 0,
    padrao: 0, // Grátis
    gorgurao: 0,
    saoFrancisco: 0,
    colorido: 0.10,
    gorgurinho: 0,
  },
  corCordao: {
    nenhum: 0,
    preto: 0.50,
    branco: 0.50,
    colorido: 0.55,
  },
};

export function FinishingModal({ 
  open, 
  onOpenChange, 
  onConfirm, 
  initialFinishing,
  quantity 
}: FinishingModalProps) {
  const [finishing, setFinishing] = useState<FinishingOptions>(
    initialFinishing || {
      hotStamp: false,
      ilhos: false,
      furoPresente: false,
      cordao: 'nenhum',
      corCordao: 'nenhum',
    }
  );

  // Atualizar estado quando initialFinishing mudar
  useEffect(() => {
    if (initialFinishing) {
      setFinishing(initialFinishing);
    }
  }, [initialFinishing]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const calculateFinishingCost = () => {
    let cost = 0;
    
    // Acessórios
    if (finishing.hotStamp) cost += FINISHING_PRICES.acessorios.hotStamp;
    if (finishing.ilhos) cost += FINISHING_PRICES.acessorios.ilhos;
    if (finishing.furoPresente) cost += FINISHING_PRICES.acessorios.furoPresente;
    
    // Cordão
    cost += FINISHING_PRICES.cordao[finishing.cordao];
    
    // Cor do Cordão (só se tiver cordão selecionado)
    if (finishing.cordao !== 'nenhum') {
      cost += FINISHING_PRICES.corCordao[finishing.corCordao];
    }
    
    return cost;
  };

  const unitaryCost = calculateFinishingCost();
  const totalCost = unitaryCost * quantity;

  const handleConfirm = () => {
    onConfirm(finishing, totalCost);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Acabamentos</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Acessórios */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Acessórios</Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hotStamp"
                  checked={finishing.hotStamp}
                  onCheckedChange={(checked) => 
                    setFinishing(prev => ({ ...prev, hotStamp: checked as boolean }))
                  }
                />
                <Label htmlFor="hotStamp" className="cursor-pointer font-normal">
                  Hot Stamp
                  {FINISHING_PRICES.acessorios.hotStamp > 0 && (
                    <span className="text-xs text-muted-foreground ml-1">
                      ({formatCurrency(FINISHING_PRICES.acessorios.hotStamp)})
                    </span>
                  )}
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ilhos"
                  checked={finishing.ilhos}
                  onCheckedChange={(checked) => 
                    setFinishing(prev => ({ ...prev, ilhos: checked as boolean }))
                  }
                />
                <Label htmlFor="ilhos" className="cursor-pointer font-normal">
                  Ilhós
                  {FINISHING_PRICES.acessorios.ilhos > 0 && (
                    <span className="text-xs text-muted-foreground ml-1">
                      ({formatCurrency(FINISHING_PRICES.acessorios.ilhos)})
                    </span>
                  )}
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="furoPresente"
                  checked={finishing.furoPresente}
                  onCheckedChange={(checked) => 
                    setFinishing(prev => ({ ...prev, furoPresente: checked as boolean }))
                  }
                />
                <Label htmlFor="furoPresente" className="cursor-pointer font-normal">
                  Furo de Presente
                  {FINISHING_PRICES.acessorios.furoPresente > 0 && (
                    <span className="text-xs text-muted-foreground ml-1">
                      ({formatCurrency(FINISHING_PRICES.acessorios.furoPresente)})
                    </span>
                  )}
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Cordão */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Cordão <span className="text-sm font-normal text-muted-foreground">(selecione apenas 1)</span>
            </Label>
            <RadioGroup
              value={finishing.cordao}
              onValueChange={(value) => {
                setFinishing(prev => ({ 
                  ...prev, 
                  cordao: value as FinishingOptions['cordao'],
                  // Se nenhum cordão, resetar cor
                  corCordao: value === 'nenhum' ? 'nenhum' : prev.corCordao
                }));
              }}
            >
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="padrao" id="cordao-padrao" />
                  <Label htmlFor="cordao-padrao" className="cursor-pointer font-normal">
                    Padrão
                    <span className="text-xs text-success ml-1">(Grátis)()</span>
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="gorgurao" id="cordao-gorgurao" />
                  <Label htmlFor="cordao-gorgurao" className="cursor-pointer font-normal">
                    Gorgurao
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="saoFrancisco" id="cordao-saofrancisco" />
                  <Label htmlFor="cordao-saofrancisco" className="cursor-pointer font-normal">
                    São Francisco
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="colorido" id="cordao-colorido" />
                  <Label htmlFor="cordao-colorido" className="cursor-pointer font-normal">
                    Colorido
                    {FINISHING_PRICES.cordao.colorido > 0 && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({formatCurrency(FINISHING_PRICES.cordao.colorido)})
                      </span>
                    )}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="gorgurinho" id="cordao-gorgurinho" />
                  <Label htmlFor="cordao-gorgurinho" className="cursor-pointer font-normal">
                    Gorgurinho
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Cor do Cordão */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Cor do Cordão <span className="text-sm font-normal text-muted-foreground">(selecione apenas 1)</span>
            </Label>
            <RadioGroup
              value={finishing.corCordao}
              onValueChange={(value) => 
                setFinishing(prev => ({ ...prev, corCordao: value as FinishingOptions['corCordao'] }))
              }
              disabled={finishing.cordao === 'nenhum'}
            >
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value="preto" 
                    id="cor-preto" 
                    disabled={finishing.cordao === 'nenhum'}
                  />
                  <Label 
                    htmlFor="cor-preto" 
                    className={`cursor-pointer font-normal ${finishing.cordao === 'nenhum' ? 'opacity-50' : ''}`}
                  >
                    Preto
                    {FINISHING_PRICES.corCordao.preto > 0 && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({formatCurrency(FINISHING_PRICES.corCordao.preto)})
                      </span>
                    )}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value="branco" 
                    id="cor-branco"
                    disabled={finishing.cordao === 'nenhum'}
                  />
                  <Label 
                    htmlFor="cor-branco" 
                    className={`cursor-pointer font-normal ${finishing.cordao === 'nenhum' ? 'opacity-50' : ''}`}
                  >
                    Branco
                    {FINISHING_PRICES.corCordao.branco > 0 && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({formatCurrency(FINISHING_PRICES.corCordao.branco)})
                      </span>
                    )}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value="colorido" 
                    id="cor-colorido"
                    disabled={finishing.cordao === 'nenhum'}
                  />
                  <Label 
                    htmlFor="cor-colorido" 
                    className={`cursor-pointer font-normal ${finishing.cordao === 'nenhum' ? 'opacity-50' : ''}`}
                  >
                    Colorido
                    {FINISHING_PRICES.corCordao.colorido > 0 && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({formatCurrency(FINISHING_PRICES.corCordao.colorido)})
                      </span>
                    )}
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Resumo de Custos */}
          <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Valor base unitário:</span>
              <span>-</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Acabamentos (unitário):</span>
              <span className="text-primary font-medium">+ {formatCurrency(unitaryCost)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Valor unitário final:</span>
              <span>-</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Quantidade:</span>
              <span className="font-medium">{quantity} un</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="font-semibold">Subtotal:</span>
              <span className="text-lg font-bold">-</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
          >
            Confirmar Acabamentos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
