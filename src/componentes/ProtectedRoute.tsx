import { Navigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const ProtectedRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      console.log('🔐 ProtectedRoute: Verificando autenticação...');
      const token = localStorage.getItem('authToken');
      const expirationTime = localStorage.getItem('tokenExpiration');
      
      console.log('🔑 Token:', token ? 'presente' : 'ausente');
      console.log('⏰ Expiration:', expirationTime);

      // Se não houver token, redireciona para login
      if (!token) {
        console.log('❌ Sem token, redirecionando para login');
        setIsAuthenticated(false);
        return;
      }

      // Verificar se o token expirou
      if (expirationTime) {
        const now = new Date().getTime();
        const expiration = parseInt(expirationTime, 10);

        console.log('⏱️ Verificando expiração:', {
          now: new Date(now).toISOString(),
          expiration: new Date(expiration).toISOString(),
          expired: now >= expiration
        });

        if (now >= expiration) {
          // Token expirado
          console.log('⏰ Token expirado, limpando e redirecionando');
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          localStorage.removeItem('tokenExpiration');
          toast.error('Sua sessão expirou. Por favor, faça login novamente.');
          setIsAuthenticated(false);
          return;
        }
      }

      console.log('✅ Autenticado com sucesso');
      setIsAuthenticated(true);
    };

    checkAuth();

    // Verificar expiração a cada minuto
    const interval = setInterval(checkAuth, 60000);

    return () => clearInterval(interval);
  }, []);

  // Mostrar loading enquanto verifica autenticação
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, redireciona para login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Se autenticado, renderiza a rota filha
  return <Outlet />;
};

export default ProtectedRoute;
