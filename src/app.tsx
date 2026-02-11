import { Toaster } from "@/componentes/ui/toaster";
import { Toaster as Sonner } from "@/componentes/ui/sonner";
import { TooltipProvider } from "@/componentes/ui/tooltip";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { DashboardLayout } from "./componentes/layouts/DashboardLayout";
import ProtectedRoute from "./componentes/ProtectedRoute"; // Importar o novo componente
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import NewOrder from "./pages/NewOrder";
import NewQuote from "./pages/NewQuote";
import QuoteDetails from "./pages/QuoteDetails";
import SignaturePage from "./pages/SignaturePage";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import ProductionPage from "./pages/Production";
import UserManagement from "./pages/UserManagement";
import { warmupBackendWithRetry } from "./lib/warmup";

// Aquecer o backend em background com retries (não bloqueia o carregamento)
warmupBackendWithRetry(3).then((result) => {
  if (result.success) {
    console.log('✅ Backend aquecido com sucesso no startup!');
  } else {
    console.warn('⚠️ Warmup no startup falhou, mas login tentará aquecer quando necessário');
  }
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Tentar apenas 1 vez se falhar
      staleTime: 5 * 60 * 1000, // 5 minutos - dados considerados frescos (aumentado!)
      gcTime: 30 * 60 * 1000, // 30 minutos de cache (aumentado!)
      refetchOnWindowFocus: false, // Não recarregar ao focar janela
      refetchOnMount: false, // Não recarregar ao montar se já tem cache
    },
  },
});

// Persistir cache no localStorage para carregamento instantâneo
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'embraflex-cache',
  // Serializar apenas queries de produtos e cache-stats (não sync-status)
  serialize: (data) => {
    // Filtrar para persistir apenas dados de produtos
    const filtered = {
      ...data,
      clientState: {
        ...data.clientState,
        queries: data.clientState.queries.filter((q: any) =>
          q.queryKey[0] === 'cached-products' ||
          q.queryKey[0] === 'cache-stats'
        ),
      },
    };
    return JSON.stringify(filtered);
  },
  deserialize: (data) => JSON.parse(data),
});

// Layout principal para as páginas protegidas
const AppLayout = () => (
  <DashboardLayout>
    <Outlet />
  </DashboardLayout>
);

const App = () => {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 24 * 60 * 60 * 1000, // Cache válido por 24 horas
        buster: 'v1', // Incrementar para invalidar cache antigo
      }}
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Rota de login é pública */}
            <Route path="/login" element={<Login />} />

            {/* Rota de assinatura é pública */}
            <Route path="/assinar/:token" element={<SignaturePage />} />

            {/* Rotas protegidas */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Navigate to="/cotacoes/nova" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/new" element={<NewOrder />} />
                <Route path="/cotacoes/nova" element={<NewQuote />} />
                <Route path="/quotes/:id" element={<QuoteDetails />} />
                <Route path="/production" element={<ProductionPage />} />
                <Route path="/products" element={<Products />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>

            {/* Rota de gestão de usuários (admin only) */}
            <Route element={<ProtectedRoute requireAdmin={true} />}>
              <Route element={<AppLayout />}>
                <Route path="/users" element={<UserManagement />} />
              </Route>
            </Route>

            {/* Rota para página não encontrada */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </PersistQueryClientProvider>
  );
};

export default App;
