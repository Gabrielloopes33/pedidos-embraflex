import { NewProductionOrder, ProductionOrder } from './types';

const API_BASE_URL = 'http://localhost:3001/api'; // URL do seu backend

export const getProductionOrders = async (): Promise<ProductionOrder[]> => {
  const response = await fetch(`${API_BASE_URL}/orders`);
  if (!response.ok) {
    throw new Error('Failed to fetch production orders');
  }
  return response.json();
};

export const createProductionOrder = async (order: NewProductionOrder): Promise<ProductionOrder> => {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(order),
  });
  if (!response.ok) {
    throw new Error('Failed to create production order');
  }
  return response.json();
};

export const updateProductionOrderStatus = async (
  id: string,
  status: ProductionOrder['status']
): Promise<ProductionOrder> => {
  const response = await fetch(`${API_BASE_URL}/orders/${id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    throw new Error('Failed to update production order status');
  }
  return response.json();
};

export const addProductionOrderComment = async (
  id: string,
  text: string,
  user: string
): Promise<ProductionOrder> => {
  const response = await fetch(`${API_BASE_URL}/orders/${id}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, user }),
  });
  if (!response.ok) {
    throw new Error('Failed to add comment to production order');
  }
  return response.json();
};
