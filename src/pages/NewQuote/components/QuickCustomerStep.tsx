// QuickCustomerStep - Step 1: Informações rápidas do cliente
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Label } from '@/componentes/ui/label';
import { Input } from '@/componentes/ui/input';
import { Button } from '@/componentes/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { QuoteCustomerData } from '../hooks/useQuoteWizard';

interface QuickCustomerStepProps {
  customerData: QuoteCustomerData;
  onUpdate: (data: Partial<QuoteCustomerData>) => void;
  isValid: boolean;
}

export function QuickCustomerStep({
  customerData,
  onUpdate,
  isValid,
}: QuickCustomerStepProps) {
  const [showOptional, setShowOptional] = useState(false);

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Informações do Cliente</CardTitle>
          <CardDescription>Comece informando apenas o nome do cliente</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            {/* Nome do Cliente - Campo obrigatório */}
            <div className="space-y-2">
              <Label htmlFor="customerName" className="text-base font-medium">
                Nome do Cliente <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customerName"
                type="text"
                placeholder="Digite o nome do cliente"
                value={customerData.customerName}
                onChange={(e) => onUpdate({ customerName: e.target.value })}
                className="h-14 text-lg px-4"
                required
                autoFocus
              />
            </div>

            {/* Campos opcionais expandíveis */}
            <div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowOptional(!showOptional)}
                className="mb-4 text-sm text-muted-foreground hover:text-foreground h-12 touch-manipulation"
              >
                {showOptional ? (
                  <>
                    <ChevronUp className="mr-2 h-4 w-4" />
                    Ocultar campos opcionais
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" />
                    Adicionar email e telefone (opcional)
                  </>
                )}
              </Button>

              {showOptional && (
                <div className="space-y-4 animate-in fade-in-50 slide-in-from-top-2">
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="customerEmail" className="text-sm">
                      Email
                    </Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      placeholder="email@exemplo.com"
                      value={customerData.customerEmail || ''}
                      onChange={(e) => onUpdate({ customerEmail: e.target.value })}
                      className="h-12 text-base px-4"
                    />
                  </div>

                  {/* Telefone */}
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone" className="text-sm">
                      Telefone
                    </Label>
                    <Input
                      id="customerPhone"
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={customerData.customerPhone || ''}
                      onChange={(e) => onUpdate({ customerPhone: e.target.value })}
                      className="h-12 text-base px-4"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dica mobile-friendly */}
      <div className="mt-4 text-center text-sm text-muted-foreground">
        <p>💡 Você pode adicionar mais detalhes do cliente depois, na conversão do pedido</p>
      </div>
    </div>
  );
}
