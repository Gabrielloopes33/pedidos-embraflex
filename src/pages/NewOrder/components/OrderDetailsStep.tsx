import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/componentes/ui/card";
import { Label } from "@/componentes/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/componentes/ui/select";
import { Textarea } from "@/componentes/ui/textarea";
import { Input } from "@/componentes/ui/input";
import type { OrderDetails } from "../types";

interface OrderDetailsStepProps {
  orderDetails: OrderDetails;
  onUpdate: (data: Partial<OrderDetails>) => void;
}

export function OrderDetailsStep({ orderDetails, onUpdate }: OrderDetailsStepProps) {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Detalhes da Ordem de Produção</CardTitle>
        <CardDescription>Informações adicionais para a produção</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="priority">Prioridade</Label>
            <Select 
              value={orderDetails.priority} 
              onValueChange={(value: 'Normal' | 'Urgente') => onUpdate({ priority: value })}
            >
              <SelectTrigger id="priority">
                <SelectValue placeholder="Selecione a prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Normal">Normal</SelectItem>
                <SelectItem value="Urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="vendedorNome">Nome do Vendedor</Label>
            <Input
              id="vendedorNome"
              value={orderDetails.vendedorNome}
              onChange={(e) => onUpdate({ vendedorNome: e.target.value })}
              placeholder="Digite o nome do vendedor"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vendedorTelefone">Telefone do Vendedor</Label>
            <Input
              id="vendedorTelefone"
              value={orderDetails.vendedorTelefone}
              onChange={(e) => onUpdate({ vendedorTelefone: e.target.value })}
              placeholder="(00) 00000-0000"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="condicoesPagamento">Condições de Pagamento</Label>
          <Textarea
            id="condicoesPagamento"
            value={orderDetails.condicoesPagamento}
            onChange={(e) => onUpdate({ condicoesPagamento: e.target.value })}
            placeholder="Ex: 30% entrada + 70% em 30 dias, À vista com desconto, etc."
            rows={3}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="generalNotes">Observações Gerais para Produção</Label>
          <Textarea
            id="generalNotes"
            value={orderDetails.notes}
            onChange={(e) => onUpdate({ notes: e.target.value })}
            placeholder="Adicione quaisquer observações importantes para a equipe de produção..."
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  );
}
