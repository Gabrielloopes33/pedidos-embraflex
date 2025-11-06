import { Card, CardContent } from "@/componentes/ui/card";
import { Avatar, AvatarFallback } from "@/componentes/ui/avatar";
import { Building2 } from "lucide-react";

const mockCustomers = [
  { id: 1, name: "Empresa ABC Ltda", orders: 24, total: "R$ 45,230.00" },
  { id: 2, name: "Indústria XYZ S.A.", orders: 18, total: "R$ 89,450.00" },
  { id: 3, name: "Comércio 123", orders: 32, total: "R$ 23,120.00" },
  { id: 4, name: "Distribuidora Novo Mundo", orders: 15, total: "R$ 67,890.00" },
];

const Customers = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
        <p className="text-muted-foreground mt-1">Gerencie seus clientes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mockCustomers.map((customer) => (
          <Card key={customer.id} className="shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="w-12 h-12 bg-primary/10">
                  <AvatarFallback>
                    <Building2 className="w-6 h-6 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-foreground">{customer.name}</h3>
                  <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                    <span>{customer.orders} pedidos</span>
                    <span className="font-semibold text-foreground">{customer.total}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Customers;
