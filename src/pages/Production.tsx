import React, { useState, useEffect } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/componentes/ui/card';
import { Button } from '@/componentes/ui/button';
import { Badge } from '@/componentes/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/componentes/ui/dialog';
import { Textarea } from '@/componentes/ui/textarea';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { ScrollArea } from '@/componentes/ui/scroll-area';
import { toast } from 'sonner';
import { User, Package, Edit } from 'lucide-react';
import {
  getProductionOrders,
  updateProductionOrderStatus,
  addProductionOrderComment,
} from '@/lib/api';
import { downloadOrderPDF } from '@/lib/pdf-generator';
import { ProductionOrder } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { OrderEditModal } from '@/componentes/OrderEditModal';
import { isAdmin } from '@/lib/auth';

type ColumnId = ProductionOrder['status'];

interface Column {
  id: ColumnId;
  title: string;
  color: string;
}

const columns: Column[] = [
  { id: 'Pendente', title: 'Pendente', color: 'bg-gray-500' },
  { id: 'Em Produção', title: 'Em Produção', color: 'bg-blue-500' },
  { id: 'Controle de Qualidade', title: 'Controle de Qualidade', color: 'bg-yellow-500' },
  { id: 'Finalizado', title: 'Finalizado', color: 'bg-green-500' },
];

const ProductionPage: React.FC = () => {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<ProductionOrder | null>(null);

  console.log('🚀 ProductionPage montado');

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedOrders = await getProductionOrders();
      setOrders(fetchedOrders);
    } catch (err: any) {
      console.error('Failed to fetch orders:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Erro ao carregar ordens de produção.';
      setError(errorMessage);
      toast.error('Erro ao carregar ordens de produção: ' + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const movedOrder = orders.find((order) => order.id === draggableId);
    if (!movedOrder) {
      return;
    }

    const oldStatus = movedOrder.status;
    const newStatus = destination.droppableId as ColumnId;

    // Optimistic update
    const updatedOrders = orders.map((order) =>
      order.id === draggableId ? { ...order, status: newStatus } : order
    );
    setOrders(updatedOrders);

    try {
      await updateProductionOrderStatus(draggableId, newStatus);
      toast.success(`Ordem #${movedOrder.customerName} movida para "${newStatus}"`);
      // Re-fetch to ensure data consistency, especially history/timestamps
      fetchOrders();
    } catch (err) {
      console.error('Failed to update order status:', err);
      toast.error('Erro ao atualizar status da ordem.');
      // Revert optimistic update if API call fails
      setOrders(orders.map((order) =>
        order.id === draggableId ? { ...order, status: oldStatus } : order
      ));
    }
  };

  const handleAddComment = async () => {
    if (!selectedOrder || !newComment.trim()) {
      return;
    }

    try {
      // User is hardcoded for now, ideally would come from auth context
      await addProductionOrderComment(selectedOrder.id, newComment, 'Usuário Logado');
      toast.success('Comentário adicionado!');
      setNewComment('');
      // Re-fetch orders to update the selected order's comments and history
      fetchOrders();
      // Find the updated order and set it as selected again
      const updatedOrder = orders.find(o => o.id === selectedOrder.id);
      if (updatedOrder) {
        setSelectedOrder(updatedOrder);
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
      toast.error('Erro ao adicionar comentário.');
    }
  };

  const getOrdersByStatus = (status: ColumnId) => {
    return orders.filter((order) => order.status === status);
  };

  const handleEditOrder = () => {
    if (selectedOrder) {
      setOrderToEdit(selectedOrder); // Guardar o pedido para edição
      setSelectedOrder(null); // Fechar o modal de detalhes
      setIsEditModalOpen(true); // Abrir o modal de edição
    }
  };

  const handleSaveEditedOrder = (updatedOrder: ProductionOrder) => {
    // Atualizar na lista local
    setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    setOrderToEdit(null);
    // Re-buscar para garantir consistência
    fetchOrders();
    toast.success('Pedido atualizado com sucesso!');
  };

  console.log('🔍 Production Page - Loading:', isLoading, 'Error:', error, 'Orders:', orders.length);

  if (isLoading) {
    console.log('⏳ Exibindo tela de carregamento');
    return <div className="p-6 text-center text-lg">Carregando ordens de produção...</div>;
  }

  if (error) {
    console.log('❌ Exibindo tela de erro:', error);
    return (
      <div className="p-6">
        <div className="text-center text-destructive text-lg mb-4">{error}</div>
        <div className="text-center">
          <Button onClick={fetchOrders}>Tentar Novamente</Button>
        </div>
      </div>
    );
  }

  console.log('✅ Renderizando painel de produção');

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Painel de Produção</h1>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((column) => (
            <Droppable droppableId={column.id} key={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`p-4 rounded-lg shadow-md min-h-[200px] ${column.color} ${
                    snapshot.isDraggingOver ? 'bg-opacity-75' : 'bg-opacity-50'
                  }`}
                >
                  <h2 className="text-xl font-semibold text-white mb-4">
                    {column.title} ({getOrdersByStatus(column.id).length})
                  </h2>
                  <ScrollArea className="h-full max-h-[calc(100vh-200px)] pr-2">
                    {getOrdersByStatus(column.id).map((order, index) => (
                      <Draggable key={order.id} draggableId={order.id} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`mb-3 cursor-grab ${
                              snapshot.isDragging ? 'ring-2 ring-primary' : ''
                            }`}
                            onClick={() => setSelectedOrder(order)}
                          >
                            <CardHeader className="p-3 pb-1">
                              <CardTitle className="text-md">
                                {order.customerName}
                              </CardTitle>
                              <CardDescription className="text-xs">
                                Criado em: {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                              </CardDescription>
                              {isAdmin() && order.vendedorName && (
                                <CardDescription className="text-xs flex items-center gap-1 mt-1">
                                  <User className="w-3 h-3" />
                                  Vendedor: {order.vendedorName}
                                </CardDescription>
                              )}
                            </CardHeader>
                            <CardContent className="p-3 pt-0">
                              <div className="flex justify-between items-center text-sm">
                                <Badge variant={order.priority === 'Urgente' ? 'destructive' : 'secondary'}>
                                  {order.priority}
                                </Badge>
                                <span className="text-muted-foreground">
                                  {order.products.length} produtos
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </ScrollArea>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Detalhes da Ordem de Produção</DialogTitle>
            <DialogDescription>
              Informações completas e histórico da ordem.
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <ScrollArea className="flex-grow pr-4">
              <div className="space-y-6">
                {/* Informações do Cliente */}
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informações do Cliente
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Cliente:</span>
                      <p className="font-medium">{selectedOrder.customerName}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Prioridade:</span>
                      <div className="mt-1">
                        <Badge 
                          variant={
                            selectedOrder.priority === 'Urgente' ? 'destructive' :
                            selectedOrder.priority === 'Alta' ? 'default' :
                            selectedOrder.priority === 'Média' ? 'secondary' : 'outline'
                          }
                        >
                          {selectedOrder.priority}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <div className="mt-1">
                        <Badge>{selectedOrder.status}</Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Data:</span>
                      <p className="font-medium">{format(new Date(selectedOrder.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                    </div>
                  </div>
                  {selectedOrder.notes && (
                    <div className="mt-3 pt-3 border-t">
                      <span className="text-sm text-muted-foreground">Observações Gerais:</span>
                      <p className="font-medium mt-1">{selectedOrder.notes}</p>
                    </div>
                  )}
                </div>

                {/* Produtos */}
                <div>
                  <h3 className="font-semibold mb-3 text-lg flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Produtos do Pedido ({selectedOrder.products.length})
                  </h3>
                  <div className="space-y-4">
                    {selectedOrder.products.map((product, index) => (
                      <div key={index} className="p-4 border rounded-lg bg-white shadow-sm">
                        <div className="space-y-3">
                          {/* Cabeçalho do Produto */}
                          <div className="flex justify-between items-start pb-3 border-b">
                            <div className="flex-1">
                              <p className="font-semibold text-lg">{product.name}</p>
                              {product.codigo && (
                                <p className="text-sm text-muted-foreground">Código: {product.codigo}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                Quantidade: <span className="text-lg font-bold">{product.quantity}</span>
                              </p>
                            </div>
                          </div>

                          {/* Informações Detalhadas */}
                          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                            {/* Material e Discriminação */}
                            {product.material && (
                              <div>
                                <span className="text-muted-foreground">Material:</span>
                                <p className="font-medium">{product.material}</p>
                              </div>
                            )}
                            
                            {product.discriminacaoProduto && (
                              <div className="col-span-2">
                                <span className="text-muted-foreground">Discriminação:</span>
                                <p className="font-medium">{product.discriminacaoProduto}</p>
                              </div>
                            )}

                            {/* Dimensões */}
                            {(product.largura || product.altura || product.lateral) && (
                              <div className="col-span-2">
                                <span className="text-muted-foreground">Dimensões:</span>
                                <div className="flex gap-4 mt-1">
                                  {product.largura && <p className="font-medium">Largura: {product.largura}</p>}
                                  {product.altura && <p className="font-medium">Altura: {product.altura}</p>}
                                  {product.lateral && <p className="font-medium">Lateral: {product.lateral}</p>}
                                </div>
                              </div>
                            )}

                            {/* Tipo de Impressão e Cores */}
                            {product.tipoImpressao && (
                              <div>
                                <span className="text-muted-foreground">Tipo de Impressão:</span>
                                <p className="font-medium capitalize">{product.tipoImpressao}</p>
                              </div>
                            )}

                            {product.tipoImpressao === 'serigrafia' && product.coresImpressao && (
                              <div>
                                <span className="text-muted-foreground">Cores de Impressão:</span>
                                <p className="font-medium">{product.coresImpressao}</p>
                              </div>
                            )}

                            {/* Acabamentos */}
                            {(product.laminadoBrilho || product.laminadoFosco || product.vernizIE || product.autoMatizada) && (
                              <div className="col-span-2">
                                <span className="text-muted-foreground">Acabamentos:</span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {product.laminadoBrilho && (
                                    <Badge variant="secondary">Laminado Brilho</Badge>
                                  )}
                                  {product.laminadoFosco && (
                                    <Badge variant="secondary">Laminado Fosco</Badge>
                                  )}
                                  {product.vernizIE && (
                                    <Badge variant="secondary">Verniz I.E.</Badge>
                                  )}
                                  {product.autoMatizada && (
                                    <Badge variant="secondary">Auto-Matizada</Badge>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Furos e Refile */}
                            {product.furosPresente && (
                              <div>
                                <span className="text-muted-foreground">Furos p/ Presente:</span>
                                <p className="font-medium">{product.furosPresente === 'sim' ? 'Sim' : 'Não'}</p>
                              </div>
                            )}

                            {product.refile && (
                              <div>
                                <span className="text-muted-foreground">Refile:</span>
                                <p className="font-medium">{product.refile}</p>
                              </div>
                            )}

                            {/* Cordão */}
                            {product.finishing?.cordao && product.finishing.cordao !== 'nenhum' && (
                              <div>
                                <span className="text-muted-foreground">Cordão:</span>
                                <p className="font-medium capitalize">{product.finishing.cordao}</p>
                                {product.finishing.corCordao && (
                                  <p className="text-sm">Cor: {product.finishing.corCordao}</p>
                                )}
                              </div>
                            )}

                            {/* Acessórios */}
                            {product.finishing?.acessorios && Object.values(product.finishing.acessorios).some(v => v) && (
                              <div className="col-span-2">
                                <span className="text-muted-foreground">Acessórios:</span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {product.finishing.acessorios.gorgurinho35cm && (
                                    <Badge variant="outline">Gorgurinho 35cm</Badge>
                                  )}
                                  {product.finishing.acessorios.gorgurao35cm && (
                                    <Badge variant="outline">Gorgurão 35cm</Badge>
                                  )}
                                  {product.finishing.acessorios.sFrancisco35cm && (
                                    <Badge variant="outline">S. Francisco 35cm</Badge>
                                  )}
                                  {product.finishing.acessorios.ilhos && (
                                    <Badge variant="outline">Ilhós</Badge>
                                  )}
                                  {product.finishing.acessorios.hotStampSacola && (
                                    <Badge variant="outline">Hot Stamp (Sacola)</Badge>
                                  )}
                                  {product.finishing.acessorios.hotStampEtiqueta && (
                                    <Badge variant="outline">Hot Stamp (Etiqueta)</Badge>
                                  )}
                                  {product.finishing.acessorios.outros && (
                                    <div className="w-full mt-1">
                                      <p className="text-sm">Outros: {product.finishing.acessorios.outros}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Observações */}
                            {product.observacoes && (
                              <div className="col-span-2 pt-2 border-t">
                                <span className="text-muted-foreground">Observações:</span>
                                <p className="font-medium mt-1">{product.observacoes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Histórico */}
                <div>
                  <h3 className="font-semibold mb-3 text-lg">Histórico:</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                    {selectedOrder.history.map((entry, index) => (
                      <li key={index}>
                        {format(new Date(entry.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })} -{' '}
                        {entry.event} por {entry.user}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Comentários */}
                <div>
                  <h3 className="font-semibold mb-3 text-lg">Comentários:</h3>
                  <div className="space-y-3">
                    {selectedOrder.comments.length === 0 ? (
                      <p className="text-muted-foreground text-sm">Nenhum comentário ainda.</p>
                    ) : (
                      selectedOrder.comments.map((comment, index) => (
                        <div key={index} className="border-b pb-2 last:border-b-0">
                          <p className="text-sm">{comment.text}</p>
                          <p className="text-xs text-muted-foreground">
                            Por {comment.user} em{' '}
                            {format(new Date(comment.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </p>
                        </div>
                      ))
                    )}
                    <div className="flex flex-col gap-2 pt-2">
                      <Label htmlFor="new-comment">Adicionar Comentário</Label>
                      <Textarea
                        id="new-comment"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Digite seu comentário aqui..."
                        rows={3}
                      />
                      <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                        Adicionar Comentário
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            {selectedOrder && selectedOrder.status === 'Pendente' && (
              <Button
                variant="default"
                onClick={handleEditOrder}
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar Pedido
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                if (selectedOrder) {
                  const orderData = {
                    nomeFantasia: selectedOrder.customerName,
                    razaoSocial: selectedOrder.customerName,
                    cpfCnpj: '',
                    representante: '',
                    produtos: selectedOrder.products.map(p => ({
                      ...p,
                      codigo: p.codigo || '',
                      material: p.material || '',
                      discriminacaoProduto: p.discriminacaoProduto || '',
                      largura: p.largura || '',
                      altura: p.altura || '',
                      lateral: p.lateral || '',
                      tipoImpressao: p.tipoImpressao || '',
                      coresImpressao: p.coresImpressao,
                      laminadoBrilho: p.laminadoBrilho || false,
                      laminadoFosco: p.laminadoFosco || false,
                      vernizIE: p.vernizIE || false,
                      autoMatizada: p.autoMatizada || false,
                      furosPresente: p.furosPresente || '',
                      refile: p.refile || '',
                      finishing: p.finishing || {
                        acessorios: {
                          gorgurinho35cm: false,
                          gorgurao35cm: false,
                          sFrancisco35cm: false,
                          ilhos: false,
                          hotStampSacola: false,
                          hotStampEtiqueta: false,
                          outros: ''
                        },
                        cordao: 'nenhum' as const,
                      },
                      observacoes: p.observacoes || '',
                      unitPrice: 0,
                      productId: 0,
                      productName: p.name,
                      id: p.id || '1'
                    })),
                    total: 0
                  };
                  downloadOrderPDF(orderData);
                  toast.success('PDF gerado com sucesso!');
                }
              }}
            >
              <Package className="mr-2 h-4 w-4" />
              Baixar PDF
            </Button>
            <Button onClick={() => setSelectedOrder(null)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Edição (apenas para pedidos Pendentes) */}
      {orderToEdit && (
        <OrderEditModal
          open={isEditModalOpen}
          onOpenChange={(open) => {
            setIsEditModalOpen(open);
            if (!open) setOrderToEdit(null);
          }}
          order={orderToEdit}
          onSave={handleSaveEditedOrder}
        />
      )}
    </div>
  );
};

export default ProductionPage;
