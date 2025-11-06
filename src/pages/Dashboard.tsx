import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { Button } from "@/componentes/ui/button";
import { ShoppingCart, Package, Users, TrendingUp, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const statsCards = [
  {
    title: "Pedidos do Mês",
    value: "142",
    change: "+12%",
    icon: ShoppingCart,
    trend: "up",
  },
  {
    title: "Produtos Vendidos",
    value: "8,234",
    change: "+23%",
    icon: Package,
    trend: "up",
  },
  {
    title: "Clientes Ativos",
    value: "89",
    change: "+5%",
    icon: Users,
    trend: "up",
  },
  {
    title: "Faturamento",
    value: "R$ 124.5k",
    change: "+18%",
    icon: TrendingUp,
    trend: "up",
  },
];

const recentOrders = [
  { id: "PED-2024-001", customer: "Empresa ABC Ltda", status: "Em Produção", value: "R$ 3,450.00", date: "01/11/2025" },
  { id: "PED-2024-002", customer: "Indústria XYZ S.A.", status: "Aguardando Aprovação", value: "R$ 8,920.00", date: "02/11/2025" },
  { id: "PED-2024-003", customer: "Comércio 123", status: "Pronto", value: "R$ 1,250.00", date: "03/11/2025" },
  { id: "PED-2024-004", customer: "Distribuidora Novo Mundo", status: "Em Produção", value: "R$ 5,670.00", date: "04/11/2025" },
];

const statusColors = {
  "Em Produção": "bg-warning/10 text-warning",
  "Aguardando Aprovação": "bg-primary/10 text-primary",
  "Pronto": "bg-success/10 text-success",
};

const Dashboard = () => {
  const navigate = useNavigate();

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
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors cursor-pointer"
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-foreground">{order.id}</p>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[order.status as keyof typeof statusColors]}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{order.customer}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">{order.value}</p>
                  <p className="text-sm text-muted-foreground">{order.date}</p>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4" onClick={() => navigate("/orders")}>
            Ver Todos os Pedidos
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
