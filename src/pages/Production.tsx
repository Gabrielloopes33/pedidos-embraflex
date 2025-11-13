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
import {
  getProductionOrders,
  updateProductionOrderStatus,
  addProductionOrderComment,
} from '@/lib/api';
import { ProductionOrder } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedOrders = await getProductionOrders();
      setOrders(fetchedOrders);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Erro ao carregar ordens de produção.');
      toast.error('Erro ao carregar ordens de produção.');
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

  if (isLoading) {
    return <div className="p-6 text-center text-lg">Carregando ordens de produção...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-destructive text-lg">{error}</div>;
  }

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
              <div className="space-y-4">
                <p>
                  <strong>Cliente:</strong> {selectedOrder.customerName}
                </p>
                <p>
                  <strong>Prioridade:</strong>{' '}
                  <Badge variant={selectedOrder.priority === 'Urgente' ? 'destructive' : 'secondary'}>
                    {selectedOrder.priority}
                  </Badge>
                </p>
                <p>
                  <strong>Status:</strong>{' '}
                  <Badge>{selectedOrder.status}</Badge>
                </p>
                <p>
                  <strong>Criado em:</strong>{' '}
                  {format(new Date(selectedOrder.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </p>
                {selectedOrder.notes && (
                  <p>
                    <strong>Observações Gerais:</strong> {selectedOrder.notes}
                  </p>
                )}

                <h3 className="text-lg font-semibold mt-4">Produtos:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {selectedOrder.products.map((product, index) => (
                    <li key={index}>
                      {product.name} (Qtd: {product.quantity})
                    </li>
                  ))}
                </ul>

                <h3 className="text-lg font-semibold mt-4">Histórico:</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                  {selectedOrder.history.map((entry, index) => (
                    <li key={index}>
                      {format(new Date(entry.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })} -{' '}
                      {entry.event} por {entry.user}
                    </li>
                  ))}
                </ul>

                <h3 className="text-lg font-semibold mt-4">Comentários:</h3>
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
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductionPage;
