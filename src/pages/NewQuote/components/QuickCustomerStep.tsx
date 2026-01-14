// QuickCustomerStep - Etapa 1: Nome rápido do cliente
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Label } from '@/componentes/ui/label';
import { Input } from '@/componentes/ui/input';
import { User } from 'lucide-react';

interface QuickCustomerStepProps {
  customerName: string;
  onUpdateName: (name: string) => void;
}

export function QuickCustomerStep({
  customerName,
  onUpdateName,
}: QuickCustomerStepProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle>Identificação do Cliente</CardTitle>
          </div>
          <CardDescription>
            Informe apenas o nome do cliente para iniciar a cotação
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="customerName" className="text-base font-medium">
              Nome do Cliente <span className="text-red-500">*</span>
            </Label>
            <Input
              id="customerName"
              type="text"
              placeholder="Digite o nome do cliente"
              value={customerName}
              onChange={(e) => onUpdateName(e.target.value)}
              className="h-14 text-lg px-4"
              required
              autoFocus
            />
            <p className="text-sm text-muted-foreground">
              Você poderá adicionar mais informações do cliente após selecionar os produtos
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
