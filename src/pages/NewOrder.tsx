import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/componentes/ui/card";
import { Button } from "@/componentes/ui/button";
import { Input } from "@/componentes/ui/input";
import { Label } from "@/componentes/ui/label";
import { Textarea } from "@/componentes/ui/textarea";
import { ArrowLeft, Save, Plus, Trash2, Search, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { getProducts, type WooCommerceProduct } from "@/lib/woocommerce";
import { getCustomers, type WooCommerceCustomer } from "@/lib/customers";
import { CustomerFormDialog } from "@/componentes/CustomerFormDialog";
import { createProductionOrder } from "@/lib/api"; // Importar a nova API
import { NewProductionOrder } from "@/lib/types"; // Importar o novo tipo
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/componentes/ui/select"; // Importar Select

interface ProductItem {
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
  // Acabamento
  laminadoBrilho: boolean;
  laminadoFosco: boolean;
  vernizIE: boolean;
  autoMatizada: boolean;
  // Furos
  furosPresente: 'sim' | 'nao' | '';
  refile: string;
  // Acabamentos Especiais
  cordaoBranco: boolean;
  cordaoPreto: boolean;
  cordaoBege: boolean;
  cordao: string; // campo livre para outros cordões
  gorgurinho35cm: boolean;
  gorgurao35cm: boolean;
  sFrancisco35cm: boolean;
  ilhos: boolean;
  hotStampSacola: boolean;
  hotStampEtiqueta: boolean;
  outros: string; // campo livre para outros acabamentos
  observacoes: string;
  unitPrice: number;
}

const NewOrder = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<ProductItem[]>([{
    id: crypto.randomUUID(),
    productId: 0,
    productName: "",
    quantity: 1,
    codigo: "",
    material: "",
    discriminacaoProduto: "",
    largura: "",
    altura: "",
    lateral: "",
    cores: "",
    laminadoBrilho: false,
    laminadoFosco: false,
    vernizIE: false,
    autoMatizada: false,
    furosPresente: '',
    refile: "",
    cordaoBranco: false,
    cordaoPreto: false,
    cordaoBege: false,
    cordao: "",
    gorgurinho35cm: false,
    gorgurao35cm: false,
    sFrancisco35cm: false,
    ilhos: false,
    hotStampSacola: false,
    hotStampEtiqueta: false,
    outros: "",
    observacoes: "",
    unitPrice: 0,
  }]);

  // Cliente
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [representante, setRepresentante] = useState("");

  // Novos estados para a Ordem de Produção
  const [priority, setPriority] = useState<'Normal' | 'Urgente'>('Normal');
  const [generalNotes, setGeneralNotes] = useState<string>('');

  // Buscar produtos do WooCommerce
  const { data: products, isLoading: isLoadingProducts, error: productsError } = useQuery({
    queryKey: ['products-search', searchTerm],
    queryFn: () => getProducts({
      search: searchTerm || undefined,
      per_page: 50,
    }),
    enabled: searchTerm.length > 2,
  });

  // Debug: log produtos encontrados
  console.log('Search term:', searchTerm, 'Products found:', products?.length || 0);

  // Buscar clientes do WooCommerce
  const { data: customers } = useQuery({
    queryKey: ['customers-search', customerSearchTerm],
    queryFn: () => getCustomers({
      search: customerSearchTerm || undefined,
      per_page: 50,
    }),
    enabled: customerSearchTerm.length > 2,
  });

  const addProduct = () => {
    setSelectedProducts([...selectedProducts, {
      id: crypto.randomUUID(),
      productId: 0,
      productName: "",
      quantity: 1,
      codigo: "",
      material: "",
      discriminacaoProduto: "",
      largura: "",
      altura: "",
      lateral: "",
      cores: "",
      laminadoBrilho: false,
      laminadoFosco: false,
      vernizIE: false,
      autoMatizada: false,
      furosPresente: '',
      refile: "",
      cordaoBranco: false,
      cordaoPreto: false,
      cordaoBege: false,
      cordao: "",
      gorgurinho35cm: false,
      gorgurao35cm: false,
      sFrancisco35cm: false,
      ilhos: false,
      hotStampSacola: false,
      hotStampEtiqueta: false,
      outros: "",
      observacoes: "",
      unitPrice: 0,
    }]);
  };

  const removeProduct = (id: string) => {
    if (selectedProducts.length > 1) {
      setSelectedProducts(selectedProducts.filter(p => p.id !== id));
    }
  };

  const updateProduct = (id: string, field: keyof ProductItem, value: ProductItem[keyof ProductItem]) => {
    setSelectedProducts(selectedProducts.map(p =>
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const selectWooProduct = (itemId: string, product: WooCommerceProduct) => {
    console.log('Selecionando produto:', product.name, 'para item:', itemId);
    
    updateProduct(itemId, 'productId', product.id);
    updateProduct(itemId, 'productName', product.name);
    updateProduct(itemId, 'unitPrice', parseFloat(product.price || '0'));
    
    // Preencher código com SKU se disponível
    if (product.sku) {
      updateProduct(itemId, 'codigo', product.sku);
    }
    
    // Preencher discriminação com descrição curta
    if (product.short_description) {
      const cleanDescription = product.short_description.replace(/<[^>]*>/g, ''); // Remove HTML tags
      updateProduct(itemId, 'discriminacaoProduto', cleanDescription);
    }
    
    // Preencher dimensões se disponíveis
    if (product.dimensions) {
      if (product.dimensions.width) {
        updateProduct(itemId, 'largura', product.dimensions.width);
      }
      if (product.dimensions.height) {
        updateProduct(itemId, 'altura', product.dimensions.height);
      }
      if (product.dimensions.length) {
        updateProduct(itemId, 'lateral', product.dimensions.length);
      }
    }
    
    // Buscar informações nos meta_data
    if (product.meta_data) {
      const materialMeta = product.meta_data.find(meta => 
        meta.key.toLowerCase().includes('material') || 
        meta.key === '_material'
      );
      if (materialMeta) {
        updateProduct(itemId, 'material', materialMeta.value);
      }
      
      const coresMeta = product.meta_data.find(meta => 
        meta.key.toLowerCase().includes('cores') || 
        meta.key === '_cores' ||
        meta.key.toLowerCase().includes('color')
      );
      if (coresMeta) {
        updateProduct(itemId, 'cores', coresMeta.value);
      }
    }
    
    // Buscar informações nos atributos
    if (product.attributes) {
      product.attributes.forEach(attr => {
        const attrName = attr.name.toLowerCase();
        if (attrName.includes('material')) {
          updateProduct(itemId, 'material', attr.options.join(', '));
        }
        if (attrName.includes('cor') || attrName.includes('color')) {
          updateProduct(itemId, 'cores', attr.options.join(', '));
        }
      });
    }
    
    setSearchTerm("");
    toast.success(`Produto "${product.name}" adicionado ao pedido`);
  };

  const selectCustomer = (customer: WooCommerceCustomer) => {
    setSelectedCustomerId(customer.id);
    
    // Preencher campos com dados do cliente
    const nomeFantasiaValue = customer.meta_data?.find(m => m.key === 'nome_fantasia')?.value || 
                               customer.billing?.company || 
                               `${customer.first_name} ${customer.last_name}`.trim();
    const razaoSocialValue = customer.meta_data?.find(m => m.key === 'razao_social')?.value || 
                              customer.billing?.company || '';
    const cpfCnpjValue = customer.meta_data?.find(m => m.key === 'cpf_cnpj')?.value || '';
    
    setNomeFantasia(nomeFantasiaValue);
    setRazaoSocial(razaoSocialValue);
    setCpfCnpj(cpfCnpjValue);
    setCustomerSearchTerm("");
    
    toast.success(`Cliente ${nomeFantasiaValue} selecionado`);
  };

  const clearCustomerSelection = () => {
    setSelectedCustomerId(null);
    setNomeFantasia("");
    setRazaoSocial("");
    setCpfCnpj("");
    setRepresentante("");
  };

  const handleCustomerCreated = () => {
    toast.success("Cliente criado com sucesso!");
  };

  const calculateTotal = () => {
    return selectedProducts.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validação básica
    if (!nomeFantasia || !razaoSocial) {
      toast.error("Preencha os dados do cliente");
      setLoading(false);
      return;
    }

    const hasInvalidProducts = selectedProducts.some(p => !p.productName || p.quantity <= 0);
    if (hasInvalidProducts) {
      toast.error("Preencha todos os produtos corretamente");
      setLoading(false);
      return;
    }

    try {
      const orderProducts = selectedProducts.map(p => ({
        name: p.productName,
        quantity: p.quantity,
        // Incluir outros detalhes do produto que sejam relevantes para a produção
        // Ex: codigo, material, discriminacaoProduto, largura, altura, lateral, cores,
        // laminadoBrilho, laminadoFosco, vernizIE, autoMatizada, furosPresente, refile,
        // cordaoBranco, cordaoPreto, cordaoBege, cordao, gorgurinho35cm, gorgurao35cm,
        // sFrancisco35cm, ilhos, hotStampSacola, hotStampEtiqueta, outros, observacoes, unitPrice
      }));

      const newProductionOrder: NewProductionOrder = {
        customerName: nomeFantasia, // Usando nome fantasia como nome do cliente
        products: orderProducts,
        priority: priority,
        notes: generalNotes,
      };

      await createProductionOrder(newProductionOrder);
      toast.success("Ordem de produção criada com sucesso!");
      navigate("/orders"); // Redirecionar para a lista de ordens ou para o dashboard
    } catch (error) {
      console.error("Erro ao criar ordem de produção:", error);
      toast.error("Erro ao criar ordem de produção. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Removendo funções e componentes relacionados ao modal de aprovação
  // const handleSendOrder = () => { ... };
  // const handleConfirmSend = () => { ... };
  // const getOrderData = () => ({ ... });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/orders")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nova Ordem de Produção</h1>
          <p className="text-muted-foreground mt-1">Crie uma nova ordem de produção para a fábrica</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações do Cliente */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Informações do Cliente</CardTitle>
                <CardDescription>Dados do cliente conforme pedido Embraflex</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCustomerDialogOpen(true)}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Criar Cliente
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Buscar Cliente Existente */}
            <div className="space-y-2">
              <Label>Buscar Cliente Existente</Label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Digite o nome do cliente..."
                    value={selectedCustomerId ? nomeFantasia : customerSearchTerm}
                    onChange={(e) => {
                      if (!selectedCustomerId) {
                        setCustomerSearchTerm(e.target.value);
                      }
                    }}
                    className="pl-10"
                    disabled={!!selectedCustomerId}
                  />
                  {customerSearchTerm && customers && customers.length > 0 && !selectedCustomerId && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto z-10">
                      {customers.map((customer) => {
                        const displayName = customer.billing?.company || 
                                           `${customer.first_name} ${customer.last_name}`.trim() ||
                                           customer.email;
                        return (
                          <div
                            key={customer.id}
                            className="p-3 hover:bg-accent cursor-pointer border-b last:border-b-0"
                            onClick={() => selectCustomer(customer)}
                          >
                            <div className="font-medium">{displayName}</div>
                            <div className="text-sm text-muted-foreground">
                              {customer.email}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {selectedCustomerId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearCustomerSelection}
                  >
                    Limpar
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Digite pelo menos 3 caracteres para buscar um cliente cadastrado
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
                <Input 
                  id="nomeFantasia" 
                  value={nomeFantasia}
                  onChange={(e) => setNomeFantasia(e.target.value)}
                  placeholder="Nome fantasia do cliente" 
                  required
                  disabled={!!selectedCustomerId}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="razaoSocial">Razão Social</Label>
                <Input 
                  id="razaoSocial" 
                  value={razaoSocial}
                  onChange={(e) => setRazaoSocial(e.target.value)}
                  placeholder="Razão social do cliente" 
                  required
                  disabled={!!selectedCustomerId}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
                <Input 
                  id="cpfCnpj" 
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(e.target.value)}
                  placeholder="CPF ou CNPJ"
                  disabled={!!selectedCustomerId}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="representante">Representante/Vendedor</Label>
                <Input 
                  id="representante" 
                  value={representante}
                  onChange={(e) => setRepresentante(e.target.value)}
                  placeholder="Nome do representante" 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações da Ordem de Produção */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Detalhes da Ordem de Produção</CardTitle>
            <CardDescription>Informações adicionais para a produção</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={priority} onValueChange={(value: 'Normal' | 'Urgente') => setPriority(value)}>
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="generalNotes">Observações Gerais para Produção</Label>
              <Textarea
                id="generalNotes"
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                placeholder="Adicione quaisquer observações importantes para a equipe de produção..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Produtos */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Produtos do Pedido</CardTitle>
                <CardDescription>Adicione um ou mais produtos ao pedido</CardDescription>
              </div>
              <Button type="button" onClick={addProduct} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Produto
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedProducts.map((item, index) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-4 relative">
                {selectedProducts.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost" 
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => removeProduct(item.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
                
                <h4 className="font-semibold text-lg">Produto {index + 1}</h4>

                {/* Busca de Produto */}
                <div className="space-y-2">
                  <Label>Produto (WooCommerce)</Label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Digite pelo menos 3 caracteres para buscar..."
                        value={item.productId > 0 ? item.productName : searchTerm}
                        onChange={(e) => {
                          if (item.productId === 0) {
                            setSearchTerm(e.target.value);
                          }
                        }}
                        className="pl-10"
                        disabled={item.productId > 0}
                      />
                      {searchTerm.length > 2 && item.productId === 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto z-50">
                          {isLoadingProducts ? (
                            <div className="p-3 text-center text-muted-foreground">
                              Buscando produtos...
                            </div>
                          ) : productsError ? (
                            <div className="p-3 text-center text-destructive">
                              Erro ao buscar produtos
                            </div>
                          ) : products && products.length > 0 ? (
                            products.map((product) => (
                              <div
                                key={product.id}
                                className="p-3 hover:bg-accent cursor-pointer border-b last:border-b-0 transition-colors"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  selectWooProduct(item.id, product);
                                }}
                              >
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  R$ {parseFloat(product.price || '0').toFixed(2).replace('.', ',')}
                                </div>
                                {product.sku && (
                                  <div className="text-xs text-muted-foreground">
                                    SKU: {product.sku}
                                  </div>
                                )}
                              </div>
                            ))
                          ) : searchTerm.length > 2 ? (
                            <div className="p-3 text-center text-muted-foreground">
                              Nenhum produto encontrado
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                    {item.productId > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          updateProduct(item.id, 'productId', 0);
                          updateProduct(item.id, 'productName', '');
                          updateProduct(item.id, 'unitPrice', 0);
                          updateProduct(item.id, 'codigo', '');
                          updateProduct(item.id, 'material', '');
                          updateProduct(item.id, 'discriminacaoProduto', '');
                          updateProduct(item.id, 'largura', '');
                          updateProduct(item.id, 'altura', '');
                          updateProduct(item.id, 'lateral', '');
                          updateProduct(item.id, 'cores', '');
                          setSearchTerm('');
                        }}
                      >
                        Limpar
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateProduct(item.id, 'quantity', parseInt(e.target.value))}
                      min="1"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Código</Label>
                    <Input
                      value={item.codigo}
                      onChange={(e) => updateProduct(item.id, 'codigo', e.target.value)}
                      placeholder="Código do produto"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Material</Label>
                    <Input
                      value={item.material}
                      onChange={(e) => updateProduct(item.id, 'material', e.target.value)}
                      placeholder="Material"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Discriminação do Produto</Label>
                    <Input
                      value={item.discriminacaoProduto}
                      onChange={(e) => updateProduct(item.id, 'discriminacaoProduto', e.target.value)}
                      placeholder="Discriminação"
                    />
                  </div>
                </div>

                {/* Acabamentos e Furos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Acabamentos</Label>
                    <div className="border rounded-md p-3">
                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={item.laminadoBrilho}
                            onChange={(e) => updateProduct(item.id, 'laminadoBrilho', e.target.checked)}
                            className="rounded"
                          />
                          Brilho
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={item.laminadoFosco}
                            onChange={(e) => updateProduct(item.id, 'laminadoFosco', e.target.checked)}
                            className="rounded"
                          />
                          Fosco
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={item.vernizIE}
                            onChange={(e) => updateProduct(item.id, 'vernizIE', e.target.checked)}
                            className="rounded"
                          />
                          I.E.
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={item.autoMatizada}
                            onChange={(e) => updateProduct(item.id, 'autoMatizada', e.target.checked)}
                            className="rounded"
                          />
                          Auto-Matizada
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Furos (P/Presente)</Label>
                    <div className="border rounded-md p-3">
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="radio"
                            name={`furos-${item.id}`}
                            value="sim"
                            checked={item.furosPresente === 'sim'}
                            onChange={() => {
                              updateProduct(item.id, 'furosPresente', 'sim');
                            }}
                            className="w-4 h-4"
                          />
                          Sim
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="radio"
                            name={`furos-${item.id}`}
                            value="nao"
                            checked={item.furosPresente === 'nao'}
                            onChange={() => {
                              updateProduct(item.id, 'furosPresente', 'nao');
                            }}
                            className="w-4 h-4"
                          />
                          Não
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dimensões */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Largura</Label>
                    <Input
                      value={item.largura}
                      onChange={(e) => updateProduct(item.id, 'largura', e.target.value)}
                      placeholder="Largura"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Altura</Label>
                    <Input
                      value={item.altura}
                      onChange={(e) => updateProduct(item.id, 'altura', e.target.value)}
                      placeholder="Altura"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Lateral (N° Páginas)</Label>
                    <Input
                      value={item.lateral}
                      onChange={(e) => updateProduct(item.id, 'lateral', e.target.value)}
                      placeholder="N° Páginas"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cores (Quantidade)</Label>
                    <Input
                      value={item.cores}
                      onChange={(e) => updateProduct(item.id, 'cores', e.target.value)}
                      placeholder="Qtd. Cores"
                    />
                  </div>
                </div>

                {/* Valor e Refile */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valor Unitário</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateProduct(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      placeholder="R$ 0,00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Refile</Label>
                    <Input
                      value={item.refile}
                      onChange={(e) => updateProduct(item.id, 'refile', e.target.value)}
                      placeholder="Especificação do refile"
                    />
                  </div>
                </div>

                {/* Acabamentos Especiais */}
                <div className="border-t pt-4 mt-4">
                  <h5 className="font-semibold text-md mb-3">Acabamentos Especiais</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Coluna 1 - Cordões */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={item.cordaoBranco}
                          onChange={(e) => updateProduct(item.id, 'cordaoBranco', e.target.checked)}
                          className="rounded"
                        />
                        Cordão Branco
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={item.cordaoPreto}
                          onChange={(e) => updateProduct(item.id, 'cordaoPreto', e.target.checked)}
                          className="rounded"
                        />
                        Cordão Preto
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={item.cordaoBege}
                          onChange={(e) => updateProduct(item.id, 'cordaoBege', e.target.checked)}
                          className="rounded"
                        />
                        Cordão Bege
                      </label>
                      <div className="space-y-1">
                        <Label className="text-xs">Cordão (outro)</Label>
                        <Input
                          value={item.cordao}
                          onChange={(e) => updateProduct(item.id, 'cordao', e.target.value)}
                          placeholder="Especificar"
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>

                    {/* Coluna 2 - Gorgurão e outros */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={item.gorgurinho35cm}
                          onChange={(e) => updateProduct(item.id, 'gorgurinho35cm', e.target.checked)}
                          className="rounded"
                        />
                        Gorgurinho 35cm
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={item.gorgurao35cm}
                          onChange={(e) => updateProduct(item.id, 'gorgurao35cm', e.target.checked)}
                          className="rounded"
                        />
                        Gorgurão 35cm
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={item.sFrancisco35cm}
                          onChange={(e) => updateProduct(item.id, 'sFrancisco35cm', e.target.checked)}
                          className="rounded"
                        />
                        S. Francisco 35cm
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={item.ilhos}
                          onChange={(e) => updateProduct(item.id, 'ilhos', e.target.checked)}
                          className="rounded"
                        />
                        Ilhós
                      </label>
                    </div>

                    {/* Coluna 3 - Hot Stamp e Outros */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={item.hotStampSacola}
                          onChange={(e) => updateProduct(item.id, 'hotStampSacola', e.target.checked)}
                          className="rounded"
                        />
                        Hot Stamp (Sacola)
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={item.hotStampEtiqueta}
                          onChange={(e) => updateProduct(item.id, 'hotStampEtiqueta', e.target.checked)}
                          className="rounded"
                        />
                        Hot Stamp (Etiqueta)
                      </label>
                      <div className="space-y-1">
                        <Label className="text-xs">Outros</Label>
                        <Input
                          value={item.outros}
                          onChange={(e) => updateProduct(item.id, 'outros', e.target.value)}
                          placeholder="Especificar outros"
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Observações */}
                <div className="space-y-2">
                  <Label>Observações do Produto</Label>
                  <Textarea
                    value={item.observacoes}
                    onChange={(e) => updateProduct(item.id, 'observacoes', e.target.value)}
                    placeholder="Observações específicas deste produto..."
                    rows={3}
                  />
                </div>

                <div className="bg-muted p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Subtotal deste produto:</span>
                    <span className="text-lg font-bold text-primary">
                      R$ {(item.quantity * item.unitPrice).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Total Geral */}
        <Card className="shadow-md bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <span className="text-xl font-semibold">Total Geral do Pedido:</span>
              <span className="text-3xl font-bold text-primary">
                R$ {calculateTotal().toFixed(2).replace('.', ',')}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate("/orders")}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            Criar Ordem de Produção
          </Button>
        </div>
      </form>

      <CustomerFormDialog 
        open={isCustomerDialogOpen} 
        onOpenChange={setIsCustomerDialogOpen}
        onSuccess={handleCustomerCreated}
      />
    </div>
  );
};

export default NewOrder;
