import { User, UserManagement, UserStats, UserCreateData, UserUpdateData } from './types';
import { getUsers, getUserStats, createUser, updateUser, deleteUser, getUserAuditLogs } from './supabase';
import { apiClient } from './api';

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

// ==================== USER MANAGEMENT FUNCTIONS (ADMIN ONLY) ====================

/**
 * Lista todos os usuários (admin only)
 */
export async function fetchUsers(filters?: { role?: 'admin' | 'vendedor'; isActive?: boolean }): Promise<UserManagement[]> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Não autenticado');
  }

  const response = await apiClient.get('/users', {
    params: filters,
  });

  return response.data;
}

/**
 * Obtém estatísticas dos usuários (admin only)
 */
export async function fetchUserStats(): Promise<UserStats> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Não autenticado');
  }

  const response = await apiClient.get('/users/stats');
  return response.data;
}

/**
 * Busca um usuário por ID (admin only)
 */
export async function fetchUserById(id: string): Promise<UserManagement> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Não autenticado');
  }

  const response = await apiClient.get(`/users/${id}`);
  return response.data;
}

/**
 * Cria um novo usuário (admin only)
 */
export async function createUserAdmin(userData: UserCreateData): Promise<UserManagement> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Não autenticado');
  }

  const response = await apiClient.post('/users', userData);
  return response.data;
}

/**
 * Atualiza um usuário (admin only)
 */
export async function updateUserAdmin(id: string, userData: UserUpdateData): Promise<UserManagement> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Não autenticado');
  }

  const response = await apiClient.put(`/users/${id}`, userData);
  return response.data;
}

/**
 * Deleta um usuário (admin only)
 */
export async function deleteUserAdmin(id: string): Promise<void> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Não autenticado');
  }

  await apiClient.delete(`/users/${id}`);
}

/**
 * Busca logs de auditoria de um usuário (admin only)
 */
export async function fetchUserAuditLogs(userId: string): Promise<any[]> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Não autenticado');
  }

  const response = await apiClient.get(`/users/${userId}/audit-logs`);
  return response.data;
}

/**
 * Altera senha de um usuário (admin only)
 */
export async function changeUserPassword(id: string, newPassword: string): Promise<void> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Não autenticado');
  }

  await apiClient.post(`/users/${id}/change-password`, { newPassword });
}
