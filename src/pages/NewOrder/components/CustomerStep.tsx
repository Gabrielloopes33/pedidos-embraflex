import { useState } from "react";
import { Button } from "@/componentes/ui/button";
import { Input } from "@/componentes/ui/input";
import { Label } from "@/componentes/ui/label";
import { Search, UserPlus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getCustomers } from "@/lib/customers";
import type { WooCommerceCustomer } from "@/lib/types";
import type { CustomerData } from "../types";
import { toast } from "sonner";
import { CustomerFormDialog } from "@/componentes/CustomerFormDialog";

interface CustomerStepProps {
  customer: CustomerData;
  onUpdate: (data: Partial<CustomerData>) => void;
}

export function CustomerStep({ customer, onUpdate }: CustomerStepProps) {
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);

  const { data: customers } = useQuery({
    queryKey: ['customers-search', customerSearchTerm],
    queryFn: () => getCustomers({
      search: customerSearchTerm || undefined,
      per_page: 50,
    }),
    enabled: customerSearchTerm.length > 2,
  });

  const selectCustomer = (wooCustomer: WooCommerceCustomer) => {
    onUpdate({
      customerId: wooCustomer.id,
      firstName: wooCustomer.first_name,
      lastName: wooCustomer.last_name,
      email: wooCustomer.email,
      phone: wooCustomer.billing?.phone || "",
      address: wooCustomer.billing?.address_1 || "",
      city: wooCustomer.billing?.city || "",
      state: wooCustomer.billing?.state || "",
      postcode: wooCustomer.billing?.postcode || "",
    });

    setCustomerSearchTerm("");
    toast.success(`Cliente ${wooCustomer.first_name} ${wooCustomer.last_name} selecionado`);
  };

  const clearCustomerSelection = () => {
    onUpdate({
      customerId: null,
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      postcode: "",
    });
  };

  const handleCustomerCreated = () => {
    toast.success("Cliente criado com sucesso!");
  };

  const customerDisplayName = customer.customerId 
    ? `${customer.firstName} ${customer.lastName}`
    : "";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Informações do Cliente</h3>
        <p className="text-sm text-muted-foreground">
          Selecione um cliente existente ou crie um novo
        </p>
      </div>

      {/* Buscar Cliente Existente */}
      <div className="space-y-2">
        <Label>Buscar Cliente Existente</Label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Digite o nome do cliente..."
              value={customer.customerId ? customerDisplayName : customerSearchTerm}
              onChange={(e) => {
                if (!customer.customerId) {
                  setCustomerSearchTerm(e.target.value);
                }
              }}
              className="pl-10"
              disabled={!!customer.customerId}
            />
            {customerSearchTerm.length > 2 && !customer.customerId && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto z-50">
                {customers && customers.length > 0 ? (
                  customers.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 hover:bg-accent cursor-pointer border-b last:border-b-0 transition-colors"
                      onClick={() => selectCustomer(c)}
                    >
                      <div className="font-medium">
                        {c.first_name} {c.last_name}
                      </div>
                      {c.email && (
                        <div className="text-sm text-muted-foreground">{c.email}</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-muted-foreground">
                    Nenhum cliente encontrado
                  </div>
                )}
              </div>
            )}
          </div>
          {customer.customerId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearCustomerSelection}
            >
              Limpar
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsCustomerDialogOpen(true)}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Novo
          </Button>
        </div>
      </div>

      {customer.customerId && (
        <div className="border rounded-md p-4 bg-muted/30 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Cliente Selecionado</h4>
            <span className="text-xs text-muted-foreground">ID: {customer.customerId}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Nome:</span>
              <p className="font-medium">{customer.firstName} {customer.lastName}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Email:</span>
              <p className="font-medium">{customer.email}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Telefone:</span>
              <p className="font-medium">{customer.phone}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Cidade:</span>
              <p className="font-medium">{customer.city}, {customer.state}</p>
            </div>
          </div>
        </div>
      )}

      <CustomerFormDialog
        open={isCustomerDialogOpen}
        onOpenChange={setIsCustomerDialogOpen}
        onSuccess={handleCustomerCreated}
      />
    </div>
  );
}
