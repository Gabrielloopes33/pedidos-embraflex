import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { Button } from "@/componentes/ui/button";
import { Input } from "@/componentes/ui/input";
import { Badge } from "@/componentes/ui/badge";
import { Plus, Search, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/componentes/ui/select";

const mockOrders = [
  { id: "PED-2024-001", customer: "Empresa ABC Ltda", status: "production", value: "R$ 3,450.00", date: "01/11/2025", items: 150 },
  { id: "PED-2024-007", customer: "Indústria XYZ S.A.", status: "pending", value: "R$ 8,920.00", date: "02/11/2025", items: 500 },
  { id: "PED-2024-003", customer: "Comércio 123", status: "ready", value: "R$ 1,250.00", date: "03/11/2025", items: 75 },
  { id: "PED-2024-004", customer: "Distribuidora Novo Mundo", status: "production", value: "R$ 5,670.00", date: "04/11/2025", items: 300 },
  { id: "PED-2024-005", customer: "Atacado Premium", status: "delivered", value: "R$ 12,340.00", date: "28/10/2025", items: 850 },
  { id: "PED-2024-006", customer: "Varejo Express", status: "cancelled", value: "R$ 2,100.00", date: "30/10/2025", items: 120 },
];

const statusConfig = {
  pending: { label: "Aguardando", color: "bg-primary" },
  production: { label: "Em Produção", color: "bg-warning" },
  ready: { label: "Pronto", color: "bg-success" },
  delivered: { label: "Entregue", color: "bg-muted" },
  cancelled: { label: "Cancelado", color: "bg-destructive" },
};

const Orders = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredOrders = mockOrders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pedidos</h1>
          <p className="text-muted-foreground mt-1">Gerencie todos os seus pedidos</p>
        </div>
        <Button
          onClick={() => navigate("/orders/new")}
          className="gap-2 shadow-primary"
          size="lg"
        >
          <Plus className="w-5 h-5" />
          Novo Pedido
        </Button>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Buscar por número ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pending">Aguardando</SelectItem>
                <SelectItem value="production">Em Produção</SelectItem>
                <SelectItem value="ready">Pronto</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 rounded-lg bg-accent/50 hover:bg-accent transition-all cursor-pointer border border-transparent hover:border-primary/20"
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-semibold text-foreground text-lg">{order.id}</p>
                    <Badge className={statusConfig[order.status as keyof typeof statusConfig].color}>
                      {statusConfig[order.status as keyof typeof statusConfig].label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{order.customer}</p>
                  <p className="text-xs text-muted-foreground mt-1">{order.items} itens</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground text-lg">{order.value}</p>
                  <p className="text-sm text-muted-foreground">{order.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Orders;
