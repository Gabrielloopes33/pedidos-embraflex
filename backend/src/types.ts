export interface ProductionProduct {
  id: string;
  productId: number;
  productName: string;
  quantity: number;
  codigo: string;
  material: string;
  discriminacaoProduto: string;
  largura: string;
  altura: string;
  lateral: string;
  cores: string;
  laminadoBrilho: boolean;
  laminadoFosco: boolean;
  vernizIE: boolean;
  autoMatizada: boolean;
  furosPresente: 'sim' | 'nao' | '';
  refile: string;
  cordaoBranco: boolean;
  cordaoPreto: boolean;
  cordaoBege: boolean;
  cordao: string;
  gorgurinho35cm: boolean;
  gorgurao35cm: boolean;
  sFrancisco35cm: boolean;
  ilhos: boolean;
  hotStampSacola: boolean;
  hotStampEtiqueta: boolean;
  outros: string;
  observacoes: string;
  unitPrice: number;
}

export interface ProductionOrder {
  id: string;
  customerName: string;
  products: ProductionProduct[];
  status: 'Pendente' | 'Em Produção' | 'Controle de Qualidade' | 'Finalizado';
  priority: 'Normal' | 'Urgente';
  notes?: string;
  createdAt: string;
  history: { event: string; timestamp: string; user: string }[];
  comments: { text: string; timestamp:string; user: string }[];
  userId?: string; // Adicionado para associar a um usuário
  vendedorId?: string; // ID do vendedor que criou o pedido
  vendedorName?: string; // Nome do vendedor que criou o pedido
}
