import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { Button } from "@/componentes/ui/button";
import { ShoppingCart, Package, Users, TrendingUp, Plus, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getProductionOrders } from "@/lib/api";
import { ProductionOrder } from "@/lib/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/componentes/ui/badge";

const statusColors = {
  "Em Produção": "bg-warning/10 text-warning",
  "Pendente": "bg-primary/10 text-primary",
  "Controle de Qualidade": "bg-success/10 text-success",
  "Finalizado": "bg-muted/10 text-muted-foreground",
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        console.log('🔄 Dashboard: Buscando pedidos...');
        const data = await getProductionOrders();
        console.log('✅ Dashboard: Pedidos recebidos:', data);
        setOrders(data);
        setError(null);
      } catch (error: any) {
        console.error('❌ Dashboard: Erro ao carregar pedidos:', error);
        setError(error?.response?.data?.message || error?.message || 'Erro ao carregar pedidos');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Calcular estatísticas dos pedidos reais
  const totalOrders = orders.length;
  const totalProducts = orders.reduce((sum, order) => 
    sum + order.products.reduce((pSum, p) => pSum + p.quantity, 0), 0
  );
  const uniqueCustomers = new Set(orders.map(o => o.customerName)).size;
  
  // Pegar os 4 pedidos mais recentes
  const recentOrders = orders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const statsCards = [
    {
      title: "Pedidos Ativos",
      value: totalOrders.toString(),
      change: "+12%",
      icon: ShoppingCart,
      trend: "up",
    },
    {
      title: "Produtos em Produção",
      value: totalProducts.toLocaleString('pt-BR'),
      change: "+23%",
      icon: Package,
      trend: "up",
    },
    {
      title: "Clientes Ativos",
      value: uniqueCustomers.toString(),
      change: "+5%",
      icon: Users,
      trend: "up",
    },
    {
      title: "Pedidos Urgentes",
      value: orders.filter(o => o.priority === 'Urgente').length.toString(),
      change: "+18%",
      icon: TrendingUp,
      trend: "up",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão geral dos seus pedidos e atividades</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-primary-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              <p className="text-sm text-success mt-1">
                {stat.change} vs mês anterior
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Pedidos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum pedido encontrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => navigate(`/production`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="text-xl font-semibold text-foreground">{order.customerName}</p>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[order.status as keyof typeof statusColors]}`}>
                        {order.status}
                      </span>
                      {order.priority === 'Urgente' && (
                        <Badge variant="destructive" className="text-xs">Urgente</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground opacity-70 mt-1">ID: {order.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{format(new Date(order.createdAt), "dd/MM/yyyy", { locale: ptBR })}</p>
                    <p className="text-xs text-muted-foreground">{order.products.length} produto(s)</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button variant="outline" className="w-full mt-4" onClick={() => navigate("/orders")}>
            Ver Todos os Pedidos
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
