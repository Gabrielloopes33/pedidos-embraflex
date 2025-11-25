import { useState } from 'react';
import type { OrderFormData, ProductItem, CustomerData, OrderDetails } from '../types';

export type WizardStep = 1 | 2 | 3;

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
  tipoImpressao: "",
  coresImpressao: "",
  finishing: {
    hotStamp: false,
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
};

export function useOrderWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [formData, setFormData] = useState<OrderFormData>({
    customer: INITIAL_CUSTOMER,
    products: [{ ...INITIAL_PRODUCT }],
    orderDetails: INITIAL_ORDER_DETAILS,
  });

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
      return formData.customer.customerId !== null && 
             formData.customer.firstName && 
             formData.customer.lastName;
    }
    if (currentStep === 2) {
      return formData.products.length > 0 && 
             formData.products.every(p => p.productName && p.quantity > 0);
    }
    return true;
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
  };
}
