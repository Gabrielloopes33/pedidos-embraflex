export interface ProductionOrder {
  id: string;
  customerName: string;
  products: { name: string; quantity: number }[];
  status: 'Pendente' | 'Em Produção' | 'Controle de Qualidade' | 'Finalizado';
  priority: 'Normal' | 'Urgente';
  notes?: string;
  createdAt: string;
  history: { event: string; timestamp: string; user: string }[];
  comments: { text: string; timestamp:string; user: string }[];
}
