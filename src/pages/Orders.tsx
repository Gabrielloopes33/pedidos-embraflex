import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { Button } from "@/componentes/ui/button";
import { Input } from "@/componentes/ui/input";
import { Badge } from "@/componentes/ui/badge";
import { Plus, Search, Filter, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/componentes/ui/select";
import { getProductionOrders } from "@/lib/api";
import { ProductionOrder } from "@/lib/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { OrderEditModal } from "@/componentes/OrderEditModal";

const statusConfig = {
  "Pendente": { label: "Aguardando", color: "bg-primary" },
  "Em Produção": { label: "Em Produção", color: "bg-warning" },
  "Controle de Qualidade": { label: "Pronto", color: "bg-success" },
  "Finalizado": { label: "Entregue", color: "bg-muted" },
};

const Orders = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        console.log('🔄 Buscando pedidos...');
        const data = await getProductionOrders();
        console.log('✅ Pedidos recebidos:', data);
        setOrders(data);
        setError(null);
      } catch (error: any) {
        console.error('❌ Erro ao carregar pedidos:', error);
        setError(error?.response?.data?.message || error?.message || 'Erro ao carregar pedidos');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOrderClick = (order: ProductionOrder) => {
    setSelectedOrder(order);
    setIsEditModalOpen(true);
  };

  const handleSaveOrder = (updatedOrder: ProductionOrder) => {
    // Atualizar a lista de pedidos
    setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    // TODO: Chamar API para salvar no backend
  };

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
                <SelectItem value="Pendente">Aguardando</SelectItem>
                <SelectItem value="Em Produção">Em Produção</SelectItem>
                <SelectItem value="Controle de Qualidade">Pronto</SelectItem>
                <SelectItem value="Finalizado">Entregue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive font-semibold">Erro ao carregar pedidos</p>
              <p className="text-sm text-muted-foreground mt-2">{error}</p>
              <Button 
                variant="outline" 
                className="mt-4" 
                onClick={() => window.location.reload()}
              >
                Tentar novamente
              </Button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum pedido encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-accent/50 hover:bg-accent transition-all cursor-pointer border border-transparent hover:border-primary/20"
                  onClick={() => handleOrderClick(order)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-semibold text-foreground text-xl">{order.customerName}</p>
                      <Badge className={statusConfig[order.status as keyof typeof statusConfig].color}>
                        {statusConfig[order.status as keyof typeof statusConfig].label}
                      </Badge>
                      {order.priority === 'Urgente' && (
                        <Badge variant="destructive">Urgente</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground opacity-70">ID: {order.id}</p>
                    <p className="text-xs text-muted-foreground mt-1">{order.products.length} produto(s)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{format(new Date(order.createdAt), "dd/MM/yyyy", { locale: ptBR })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Edição de Pedido */}
      <OrderEditModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        order={selectedOrder}
        onSave={handleSaveOrder}
      />
    </div>
  );
};

export default Orders;
