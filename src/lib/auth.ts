import { User } from './types';

// Base de dados simulada de usuários
export const USERS: Record<string, { password: string; user: User }> = {
  'admin': {
    password: 'admin123',
    user: {
      id: 'user-admin',
      username: 'admin',
      name: 'Administrador',
      role: 'admin',
      email: 'admin@embraflex.com'
    }
  },
  'yan': {
    password: 'yan123',
    user: {
      id: 'user-yan',
      username: 'yan',
      name: 'Yan',
      role: 'vendedor',
      email: 'yan@embraflex.com'
    }
  },
  'luiz': {
    password: 'luiz123',
    user: {
      id: 'user-luiz',
      username: 'luiz',
      name: 'Luiz',
      role: 'vendedor',
      email: 'luiz@embraflex.com'
    }
  }
};

// Funções auxiliares
export const authenticateUser = (username: string, password: string): User | null => {
  const userCredentials = USERS[username.toLowerCase()];
  
  if (!userCredentials || userCredentials.password !== password) {
    return null;
  }
  
  return userCredentials.user;
};

export const getCurrentUser = (): User | null => {
  const userString = localStorage.getItem('user');
  if (!userString) return null;
  
  try {
    return JSON.parse(userString) as User;
  } catch {
    return null;
  }
};

export const isAdmin = (): boolean => {
  const user = getCurrentUser();
  console.log('🔐 isAdmin check:', { user, isAdmin: user?.role === 'admin' });
  return user?.role === 'admin';
};

export const isVendedor = (): boolean => {
  const user = getCurrentUser();
  return user?.role === 'vendedor';
};

export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  localStorage.removeItem('tokenExpiration');
  window.location.href = '/login';
};
