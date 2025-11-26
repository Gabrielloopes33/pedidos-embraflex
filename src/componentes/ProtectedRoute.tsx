import { Navigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const ProtectedRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const expirationTime = localStorage.getItem('tokenExpiration');

      // Se não houver token, redireciona para login
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      // Verificar se o token expirou
      if (expirationTime) {
        const now = new Date().getTime();
        const expiration = parseInt(expirationTime, 10);

        if (now >= expiration) {
          // Token expirado
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          localStorage.removeItem('tokenExpiration');
          toast.error('Sua sessão expirou. Por favor, faça login novamente.');
          setIsAuthenticated(false);
          return;
        }
      }

      setIsAuthenticated(true);
    };

    checkAuth();

    // Verificar expiração a cada minuto
    const interval = setInterval(checkAuth, 60000);

    return () => clearInterval(interval);
  }, []);

  // Mostrar nada enquanto verifica autenticação
  if (isAuthenticated === null) {
    return null;
  }

  // Se não estiver autenticado, redireciona para login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Se autenticado, renderiza a rota filha
  return <Outlet />;
};

export default ProtectedRoute;
