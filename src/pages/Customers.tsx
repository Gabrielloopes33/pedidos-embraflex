import { useState } from "react";
import { Card, CardContent } from "@/componentes/ui/card";
import { Avatar, AvatarFallback } from "@/componentes/ui/avatar";
import { Button } from "@/componentes/ui/button";
import { Input } from "@/componentes/ui/input";
import { Building2, Plus, Search, Mail, Phone, Loader2, AlertCircle, MapPin, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getCustomers } from "@/lib/customers";
import type { WooCommerceCustomer } from "@/lib/types";
import { CustomerFormDialog } from "@/componentes/CustomerFormDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/componentes/ui/dialog";
import { Label } from "@/componentes/ui/label";

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<WooCommerceCustomer | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const perPage = 20;

  const { data: customers, isLoading, error, refetch } = useQuery({
    queryKey: ['customers', page, searchTerm],
    queryFn: () => getCustomers({
      page,
      per_page: perPage,
      search: searchTerm || undefined,
      orderby: 'registered_date',
      order: 'desc',
    }),
    retry: 1,
  });

  const handleCustomerCreated = () => {
    refetch();
  };

  const handleCustomerClick = (customer: WooCommerceCustomer) => {
    setSelectedCustomer(customer);
    setIsDetailsOpen(true);
  };

  if (error) {
    // Verificar se é erro de autenticação
    const errorMessage = (error as any)?.message || '';
    const isAuthError = errorMessage.includes('autenticado') || errorMessage.includes('sessão expirou');
    const status = (error as any)?.response?.status;
    
    console.error('❌ [Customers Page] Erro detectado:', { errorMessage, status, isAuthError });
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground mt-1">Gerencie seus clientes</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {isAuthError ? 'Erro de Autenticação' : 'Erro ao carregar clientes'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {isAuthError 
                  ? errorMessage
                  : 'Não foi possível conectar à API do WooCommerce.'}
              </p>
              {status === 401 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Código de erro: 401 (Não autorizado)
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {isAuthError ? (
                <Button onClick={() => window.location.href = '/login'}>
                  Fazer Login
                </Button>
              ) : (
                <Button onClick={() => refetch()}>Tentar Novamente</Button>
              )}
            </div>
          </div>
        </Card>
        <CustomerFormDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSuccess={handleCustomerCreated}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus clientes</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Button onClick={() => refetch()} variant="outline">Atualizar</Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : customers && customers.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {customers.map((customer) => {
              const displayName = customer.billing?.company ||
                `${customer.first_name} ${customer.last_name}`.trim() ||
                customer.email;
              const initials = displayName.substring(0, 2).toUpperCase();

              return (
                <Card
                  key={customer.id}
                  className="shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleCustomerClick(customer)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-12 h-12 bg-primary/10">
                        <AvatarFallback className="text-primary font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-foreground truncate">
                          {displayName}
                        </h3>
                        {customer.billing?.company && (
                          <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                            <Building2 className="w-3 h-3" />
                            <span className="truncate">{customer.billing.company}</span>
                          </div>
                        )}
                        <div className="flex flex-col gap-1 mt-2 text-sm text-muted-foreground">
                          {customer.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              <span className="truncate">{customer.email}</span>
                            </div>
                          )}
                          {customer.billing?.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              <span>{customer.billing.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-center gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <span className="flex items-center px-4 text-sm text-muted-foreground">
              Página {page}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage(p => p + 1)}
              disabled={!customers || customers.length < perPage}
            >
              Próxima
            </Button>
          </div>
        </>
      ) : (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <Building2 className="w-12 h-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold text-foreground">Nenhum cliente encontrado</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchTerm ? 'Tente buscar com outros termos.' : 'Cadastre seu primeiro cliente.'}
              </p>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Cliente
            </Button>
          </div>
        </Card>
      )}

      <CustomerFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={handleCustomerCreated}
      />

      {/* Modal de Detalhes do Cliente */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Detalhes do Cliente</DialogTitle>
            <DialogDescription>
              Informações completas do cliente
            </DialogDescription>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-6 mt-4">
              {/* Informações Principais */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16 bg-primary/10">
                    <AvatarFallback className="text-primary font-semibold text-xl">
                      {(selectedCustomer.billing?.company ||
                        `${selectedCustomer.first_name} ${selectedCustomer.last_name}`.trim() ||
                        selectedCustomer.email).substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">
                      {selectedCustomer.billing?.company ||
                        `${selectedCustomer.first_name} ${selectedCustomer.last_name}`.trim() ||
                        selectedCustomer.email}
                    </h3>
                    {selectedCustomer.email && (
                      <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Dados da Empresa */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Dados da Empresa
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Nome Fantasia</Label>
                    <p className="text-sm font-medium">
                      {selectedCustomer.meta_data?.find(m => m.key === 'nome_fantasia')?.value ||
                        selectedCustomer.billing?.company || '-'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Razão Social</Label>
                    <p className="text-sm font-medium">
                      {selectedCustomer.meta_data?.find(m => m.key === 'razao_social')?.value || '-'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">CPF/CNPJ</Label>
                    <p className="text-sm font-medium">
                      {selectedCustomer.meta_data?.find(m => m.key === 'cpf_cnpj')?.value || '-'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Telefone</Label>
                    <p className="text-sm font-medium">
                      {selectedCustomer.billing?.phone || '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Endereço de Cobrança */}
              {selectedCustomer.billing && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Endereço de Cobrança
                  </h4>
                  <div className="space-y-2 text-sm">
                    {selectedCustomer.billing.address_1 && (
                      <p>{selectedCustomer.billing.address_1}</p>
                    )}
                    {selectedCustomer.billing.address_2 && (
                      <p>{selectedCustomer.billing.address_2}</p>
                    )}
                    <p>
                      {[
                        selectedCustomer.billing.city,
                        selectedCustomer.billing.state,
                        selectedCustomer.billing.postcode
                      ].filter(Boolean).join(', ')}
                    </p>
                    {selectedCustomer.billing.country && (
                      <p className="font-medium">{selectedCustomer.billing.country}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Endereço de Entrega */}
              {selectedCustomer.shipping && (selectedCustomer.shipping.address_1 || selectedCustomer.shipping.city) && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Endereço de Entrega
                  </h4>
                  <div className="space-y-2 text-sm">
                    {selectedCustomer.shipping.address_1 && (
                      <p>{selectedCustomer.shipping.address_1}</p>
                    )}
                    {selectedCustomer.shipping.address_2 && (
                      <p>{selectedCustomer.shipping.address_2}</p>
                    )}
                    <p>
                      {[
                        selectedCustomer.shipping.city,
                        selectedCustomer.shipping.state,
                        selectedCustomer.shipping.postcode
                      ].filter(Boolean).join(', ')}
                    </p>
                    {selectedCustomer.shipping.country && (
                      <p className="font-medium">{selectedCustomer.shipping.country}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Informações Adicionais */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Informações Adicionais
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Nome</Label>
                    <p className="text-sm font-medium">
                      {`${selectedCustomer.first_name} ${selectedCustomer.last_name}`.trim() || '-'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Nome de Usuário</Label>
                    <p className="text-sm font-medium">
                      {selectedCustomer.username || '-'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">ID do Cliente</Label>
                    <p className="text-sm font-medium">
                      #{selectedCustomer.id}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Customers;
