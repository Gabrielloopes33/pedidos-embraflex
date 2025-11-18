import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const token = localStorage.getItem('authToken');

  // Se não houver token, redireciona para a página de login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Se houver um token, renderiza a rota filha (a página que o usuário quer acessar)
  return <Outlet />;
};

export default ProtectedRoute;
