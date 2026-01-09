import { useState, useEffect } from "react";
import { Card, CardContent } from "@/componentes/ui/card";
import { Button } from "@/componentes/ui/button";
import { ArrowLeft, ArrowRight, Save } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useOrderWizard } from "./NewOrder/hooks/useOrderWizard";
import { WizardProgress } from "./NewOrder/components/WizardProgress";
import { CustomerStep } from "./NewOrder/components/CustomerStep";
import { ProductsStep } from "./NewOrder/components/ProductsStep";
import { OrderDetailsStep } from "./NewOrder/components/OrderDetailsStep";
import { OrderSuccessModal } from "@/componentes/OrderSuccessModal";
import { OrderSignatureModal, SignatureData } from "@/componentes/OrderSignatureModal";
import { createProductionOrderV2, createWooCommerceOrder } from "@/lib/api";
import { downloadOrderPDF } from "@/lib/pdf-generator";
import type { NewProductionOrder, ProductionOrder } from "@/lib/types";
import type { ProductItem } from "./NewOrder/types";

const STEPS = [
  { id: 1, title: "Cliente", description: "Informações do cliente" },
  { id: 2, title: "Produtos", description: "Produtos do pedido" },
  { id: 3, title: "Detalhes", description: "Detalhes finais" },
];

export default function NewOrder() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<ProductionOrder | null>(null);
  const [savedOrderDetails, setSavedOrderDetails] = useState<any>(null);

  const {
    currentStep,
    formData,
    updateCustomer,
    updateProducts,
    updateOrderDetails,
    goToNext,
    goToPrevious,
    canGoNext,
    goToStep,
    resetForm,
  } = useOrderWizard();

  // Verificar se há um produto pré-preenchido vindo da página de Produtos
  useEffect(() => {
    const state = location.state as { prefilledProduct?: ProductItem } | null;
    if (state?.prefilledProduct) {
      // Adicionar o produto pré-preenchido
      updateProducts([state.prefilledProduct]);
      // Ir para o step de produtos
      goToStep(2);
      // Limpar o state para evitar adicionar novamente
      window.history.replaceState({}, document.title);
      toast.success("Produto adicionado! Complete as informações do pedido.");
    }
  }, [location.state]);

  const handleSubmit = async () => {
    // Validações finais
    if (!formData.customer.customerId) {
      toast.error("Selecione um cliente");
      goToStep(1);
      return;
    }

    if (formData.products.length === 0) {
      toast.error("Adicione pelo menos um produto");
      goToStep(2);
      return;
    }

    // Verificar se todos os produtos têm quantidade válida
    const invalidProducts = formData.products.filter(p => p.quantity <= 0 || !p.productName);
    if (invalidProducts.length > 0) {
      toast.error("Todos os produtos devem ter quantidade válida e nome preenchido");
      goToStep(2);
      return;
    }

    await handleApprovalConfirm();
  };

  const handleApprovalConfirm = async () => {
    setLoading(true);
    try {
      // Montar nome completo do cliente (pode ter só firstName)
      const customerFullName = formData.customer.lastName 
        ? `${formData.customer.firstName} ${formData.customer.lastName}`
        : formData.customer.firstName;
      
      // 1. Criar pedido no WooCommerce
      const wooCommerceOrderData = {
        customerName: customerFullName,
        customerEmail: formData.customer.email,
        products: formData.products.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        billing: {
          firstName: formData.customer.firstName,
          lastName: formData.customer.lastName || '',
          email: formData.customer.email,
          phone: formData.customer.phone,
          address: formData.customer.address,
          city: formData.customer.city,
          state: formData.customer.state,
          postcode: formData.customer.postcode,
        },
      };

      await createWooCommerceOrder(wooCommerceOrderData);

      // 2. Criar ordem de produção
      const productionOrder: NewProductionOrder = {
        customerName: customerFullName,
        products: formData.products.map(item => ({
          id: crypto.randomUUID(),
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          codigo: item.codigo,
          material: '',
          discriminacaoProduto: item.discriminacaoProduto,
          largura: item.larguraCm.toString(),
          altura: item.alturaCm.toString(),
          lateral: '',
          laminadoBrilho: false,
          laminadoFosco: false,
          vernizIE: false,
          autoMatizada: false,
          furosPresente: item.finishing.furoPresente ? 'sim' : 'nao',
          refile: '',
          // Mapear cordões
          cordaoBranco: item.finishing.cordao === 'padrão' && item.finishing.corCordao === 'branco',
          cordaoPreto: item.finishing.cordao === 'padrão' && item.finishing.corCordao === 'preto',
          cordaoBege: item.finishing.cordao === 'padrão' && item.finishing.corCordao === 'bege',
          cordao: item.finishing.cordao === 'colorido' ? 'Colorido' : '',
          gorgurinho35cm: item.finishing.cordao === 'gorgurinho',
          gorgurao35cm: item.finishing.cordao === 'gorgurão',
          sFrancisco35cm: item.finishing.cordao === 'são francisco',
          ilhos: item.finishing.ilhos,
          hotStampSacola: item.finishing.hotStamp,
          hotStampEtiqueta: false,
          outros: '',
          observacoes: '',
          unitPrice: item.unitPrice,
        })),
        priority: formData.orderDetails.priority,
        notes: formData.orderDetails.notes,
      };

      console.log('🚀 Iniciando criação de pedido V2...');
      await createProductionOrderV2(productionOrder);

      // Criar objeto de ordem completo para exibir no modal
      const completeOrder: ProductionOrder = {
        id: crypto.randomUUID(),
        customerName: customerFullName,
        products: productionOrder.products,
        priority: productionOrder.priority,
        notes: productionOrder.notes,
        status: 'Pendente',
        createdAt: new Date().toISOString(),
        history: [],
        comments: [],
      };

      setCreatedOrder(completeOrder);
      
      // Salvar detalhes do pedido antes de limpar
      setSavedOrderDetails({
        vendedorNome: formData.orderDetails.vendedorNome,
        vendedorTelefone: formData.orderDetails.vendedorTelefone,
        condicoesPagamento: formData.orderDetails.condicoesPagamento,
      });
      
      setSuccessModalOpen(true);
      
      // Limpar o rascunho do pedido após sucesso
      resetForm();
      
      toast.success("Pedido criado com sucesso!");
    } catch (error) {
      console.error("Erro ao criar pedido:", error);
      toast.error("Erro ao criar pedido. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = () => {
    try {
      console.log('Gerando PDF...', createdOrder);
      console.log('Detalhes salvos:', savedOrderDetails);
      if (createdOrder) {
        // Obter informações do usuário logado (vendedor)
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const vendedorName = user?.username || 'Não informado';
        
        // Converter ProductionOrder para OrderData
        const orderPDF: any = {
          nomeFantasia: createdOrder.customerName,
          razaoSocial: createdOrder.customerName,
          cpfCnpj: '',
          representante: '',
          vendedor: vendedorName, // Adicionar vendedor do sistema
          vendedorNome: savedOrderDetails?.vendedorNome || '',
          vendedorTelefone: savedOrderDetails?.vendedorTelefone || '',
          condicoesPagamento: savedOrderDetails?.condicoesPagamento || '',
          produtos: createdOrder.products,
          total: createdOrder.products.reduce((sum, p) => sum + (p.unitPrice * p.quantity), 0)
        };
        console.log('Dados do PDF:', orderPDF);
        downloadOrderPDF(orderPDF);
        console.log('PDF gerado com sucesso!');
      } else {
        console.error('Nenhum pedido criado para gerar PDF');
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    }
  };

  const handleViewOrder = () => {
    navigate("/orders");
  };

  const handleRequestSignature = () => {
    setSuccessModalOpen(false);
    setSignatureModalOpen(true);
  };

  const handleSignatureComplete = (signatureData: SignatureData) => {
    console.log('Assinatura completa:', signatureData);
    toast.success("Pedido assinado! Seguindo para produção.");
    // Aqui você pode atualizar o status do pedido, enviar para o backend, etc.
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <CustomerStep
            customer={formData.customer}
            onUpdate={updateCustomer}
          />
        );
      case 2:
        return (
          <ProductsStep
            products={formData.products}
            onUpdateProducts={updateProducts}
          />
        );
      case 3:
        return (
          <OrderDetailsStep
            orderDetails={formData.orderDetails}
            onUpdate={updateOrderDetails}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/orders")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Pedidos
        </Button>
        <h1 className="text-3xl font-bold">Novo Pedido</h1>
        <p className="text-muted-foreground mt-2">
          Preencha as informações do pedido em etapas
        </p>
      </div>

      {/* Wizard Progress */}
      <WizardProgress
        steps={STEPS}
        currentStep={currentStep}
        onStepClick={goToStep}
      />

      {/* Step Content */}
      <Card className="mt-8">
        <CardContent className="pt-6">
          {renderStep()}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={goToPrevious}
          disabled={currentStep === 1 || loading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>

        {currentStep < STEPS.length ? (
          <Button
            onClick={goToNext}
            disabled={!canGoNext() || loading}
          >
            Próximo
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={loading || !canGoNext()}
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Salvando..." : "Finalizar Pedido"}
          </Button>
        )}
      </div>

      {/* Success Modal */}
      <OrderSuccessModal
        open={successModalOpen}
        onOpenChange={setSuccessModalOpen}
        order={createdOrder}
        onGeneratePDF={handleGeneratePDF}
        onViewOrder={handleViewOrder}
        onRequestSignature={handleRequestSignature}
      />

      {/* Signature Modal */}
      <OrderSignatureModal
        open={signatureModalOpen}
        onOpenChange={setSignatureModalOpen}
        onSignatureComplete={handleSignatureComplete}
        orderData={createdOrder}
      />
    </div>
  );
}
