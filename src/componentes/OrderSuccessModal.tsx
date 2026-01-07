import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/componentes/ui/dialog";
import { Button } from "@/componentes/ui/button";
import { CheckCircle2, Download, Eye, FileSignature } from "lucide-react";
import type { ProductionOrder } from "@/lib/types";

interface OrderSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: ProductionOrder | null;
  onGeneratePDF?: () => void;
  onViewOrder?: () => void;
  onRequestSignature?: () => void;
}

export function OrderSuccessModal({ 
  open, 
  onOpenChange, 
  order,
  onGeneratePDF,
  onViewOrder,
  onRequestSignature
}: OrderSuccessModalProps) {
  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <DialogTitle className="text-xl">Pedido Criado com Sucesso!</DialogTitle>
              <DialogDescription>
                Pedido #{order.id.slice(0, 8)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Cliente</p>
              <p className="font-medium">{order.customerName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className="font-medium">{order.status}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Prioridade</p>
              <p className="font-medium">{order.priority}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Produtos</p>
              <p className="font-medium">{order.products.length} item(s)</p>
            </div>
          </div>

          {order.notes && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm text-muted-foreground mb-1">Observações:</p>
              <p className="text-sm">{order.notes}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Fechar
          </Button>
          
          {onViewOrder && (
            <Button 
              type="button" 
              variant="outline"
              onClick={() => {
                onViewOrder();
                onOpenChange(false);
              }}
              className="w-full sm:w-auto"
            >
              <Eye className="w-4 h-4 mr-2" />
              Ver Pedido
            </Button>
          )}

          {onGeneratePDF && (
            <Button 
              type="button"
              onClick={() => {
                console.log('Botão Gerar PDF clicado');
                onGeneratePDF();
                console.log('Após chamar onGeneratePDF');
              }}
              className="w-full sm:w-auto"
            >
              <Download className="w-4 h-4 mr-2" />
              Gerar PDF
            </Button>
          )}

          {onRequestSignature && (
            <Button 
              type="button"
              variant="default"
              onClick={() => {
                onRequestSignature();
              }}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
            >
              <FileSignature className="w-4 h-4 mr-2" />
              Solicitar Assinatura
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
