import { Toaster } from "@/componentes/ui/toaster";
import { Toaster as Sonner } from "@/componentes/ui/sonner";
import { TooltipProvider } from "@/componentes/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { DashboardLayout } from "./componentes/layouts/DashboardLayout";
import ProtectedRoute from "./componentes/ProtectedRoute"; // Importar o novo componente
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import NewOrder from "./pages/NewOrder";
import NewQuote from "./pages/NewQuote";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import ProductionPage from "./pages/Production";
import { warmupBackend } from "./lib/warmup";

// Aquecer o backend assim que o app carrega
warmupBackend();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Tentar apenas 1 vez se falhar
      staleTime: 30000, // 30 segundos - dados considerados frescos
      gcTime: 5 * 60 * 1000, // 5 minutos de cache
      refetchOnWindowFocus: false, // Não recarregar ao focar janela
      refetchOnMount: false, // Não recarregar ao montar se já tem cache
    },
  },
});

// Layout principal para as páginas protegidas
const AppLayout = () => (
  <DashboardLayout>
    <Outlet />
  </DashboardLayout>
);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Rota de login é pública */}
            <Route path="/login" element={<Login />} />

            {/* Rotas protegidas */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Navigate to="/cotacoes/nova" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/new" element={<NewOrder />} />
                <Route path="/cotacoes/nova" element={<NewQuote />} />
                <Route path="/production" element={<ProductionPage />} />
                <Route path="/products" element={<Products />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>

            {/* Rota para página não encontrada */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
