import { useState, useEffect } from 'react';
import type { OrderFormData, ProductItem, CustomerData, OrderDetails } from '../types';

export type WizardStep = 1 | 2 | 3;

const STORAGE_KEY = 'embraflex_order_draft';

const INITIAL_PRODUCT: ProductItem = {
  productId: 0,
  productName: "",
  quantity: 1,
  unitPrice: 0,
  total: 0,
  codigo: "",
  discriminacaoProduto: "",
  larguraCm: 0,
  alturaCm: 0,
  comprimentoCm: 0,
  tipoImpressao: "",
  finishing: {
    hotStamp: false,
    hotStampCor: '',
    ilhos: false,
    furoPresente: false,
    cordao: '',
    corCordao: '',
  },
};

const INITIAL_CUSTOMER: CustomerData = {
  customerId: null,
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  postcode: "",
};

const INITIAL_ORDER_DETAILS: OrderDetails = {
  priority: 'Normal',
  notes: '',
  vendedorNome: '',
  vendedorTelefone: '',
  condicoesPagamento: '',
};

const INITIAL_FORM_DATA: OrderFormData = {
  customer: INITIAL_CUSTOMER,
  products: [],
  orderDetails: INITIAL_ORDER_DETAILS,
};

// Função para carregar dados do localStorage
const loadFromStorage = (): { formData: OrderFormData; currentStep: WizardStep } | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log('📦 Pedido em andamento recuperado do localStorage:', parsed);
      return parsed;
    }
  } catch (error) {
    console.error('Erro ao carregar pedido do localStorage:', error);
  }
  return null;
};

// Função para salvar dados no localStorage
const saveToStorage = (formData: OrderFormData, currentStep: WizardStep) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ formData, currentStep }));
    console.log('💾 Pedido salvo no localStorage');
  } catch (error) {
    console.error('Erro ao salvar pedido no localStorage:', error);
  }
};

// Função para limpar dados do localStorage
export const clearOrderDraft = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('🗑️ Rascunho do pedido removido do localStorage');
  } catch (error) {
    console.error('Erro ao limpar pedido do localStorage:', error);
  }
};

export function useOrderWizard() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [formData, setFormData] = useState<OrderFormData>(INITIAL_FORM_DATA);

  // Carregar do localStorage ao montar
  useEffect(() => {
    const stored = loadFromStorage();
    if (stored) {
      setFormData(stored.formData);
      setCurrentStep(stored.currentStep);
    }
    setIsInitialized(true);
  }, []);

  // Salvar no localStorage com debounce (500ms) para evitar saves excessivos
  useEffect(() => {
    if (!isInitialized) return;
    
    const timeoutId = setTimeout(() => {
      saveToStorage(formData, currentStep);
    }, 500); // Aguarda 500ms sem mudanças antes de salvar

    return () => clearTimeout(timeoutId);
  }, [formData, currentStep, isInitialized]);

  const updateCustomer = (data: Partial<CustomerData>) => {
    setFormData(prev => ({
      ...prev,
      customer: { ...prev.customer, ...data }
    }));
  };

  const updateProducts = (products: ProductItem[]) => {
    setFormData(prev => ({ ...prev, products }));
  };

  const updateOrderDetails = (data: Partial<OrderDetails>) => {
    setFormData(prev => ({
      ...prev,
      orderDetails: { ...prev.orderDetails, ...data }
    }));
  };

  const addProduct = () => {
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, { ...INITIAL_PRODUCT }]
    }));
  };

  const removeProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  };

  const updateProduct = (index: number, updatedProduct: ProductItem) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.map((p, i) =>
        i === index ? updatedProduct : p
      )
    }));
  };

  const goToNext = () => {
    if (currentStep < 3) {
      setCurrentStep((currentStep + 1) as WizardStep);
    }
  };

  const goToPrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as WizardStep);
    }
  };

  const goToStep = (step: WizardStep) => {
    setCurrentStep(step);
  };

  const canGoNext = () => {
    if (currentStep === 1) {
      // Debug: mostrar estado do cliente
      console.log('🔍 Validação Step 1:', {
        customerId: formData.customer.customerId,
        firstName: formData.customer.firstName,
        lastName: formData.customer.lastName,
        email: formData.customer.email,
      });
      
      // Validação mais flexível - apenas customerId e firstName são obrigatórios
      // lastName e email são opcionais
      const canProceed = formData.customer.customerId !== null && 
                        formData.customer.firstName && 
                        formData.customer.firstName.trim() !== '';
      
      console.log('✅ Pode avançar?', canProceed);
      return canProceed;
    }
    if (currentStep === 2) {
      return formData.products.length > 0 && 
             formData.products.every(p => p.productName && p.quantity > 0);
    }
    return true;
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setCurrentStep(1);
    clearOrderDraft();
  };

  return {
    currentStep,
    formData,
    updateCustomer,
    updateProducts,
    updateOrderDetails,
    addProduct,
    removeProduct,
    updateProduct,
    goToNext,
    goToPrevious,
    goToStep,
    canGoNext,
    setCurrentStep,
    resetForm,
  };
}
