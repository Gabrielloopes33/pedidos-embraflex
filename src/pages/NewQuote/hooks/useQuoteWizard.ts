// useQuoteWizard - Hook para gerenciar estado do wizard de cotação
import { useState, useEffect, useCallback } from 'react';
import { QuoteProduct, QuotePayment } from '@/lib/quotes';

export interface QuoteCustomerData {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  cpf?: string;
  cnpj?: string;
  cep?: string;
  address?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  createInWooCommerce?: boolean;
  // Manter compatibilidade com código legado
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface QuoteFormData {
  customer: QuoteCustomerData;
  products: QuoteProduct[];
  notes?: string;
  paymentMethod?: QuotePayment;
}

const STORAGE_KEY = 'embraflex_quote_draft';
const DEBOUNCE_MS = 500;

export function useQuoteWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<QuoteFormData>(() => {
    // Try to load from localStorage on init
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored quote draft:', e);
      }
    }

    return {
      customer: {
        name: '',
        email: '',
        phone: '',
        createInWooCommerce: true,
      },
      products: [],
      notes: '',
      paymentMethod: undefined,
    };
  });

  // Debounced save to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      } catch (e) {
        console.error('Failed to save quote draft:', e);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [formData]);

  // Navigation
  const goToStep = useCallback((step: number) => {
    setCurrentStep(step);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  // Customer data
  const updateCustomer = useCallback((customer: Partial<QuoteCustomerData>) => {
    setFormData((prev) => ({
      ...prev,
      customer: { ...prev.customer, ...customer },
    }));
  }, []);

  // Products
  const addProduct = useCallback((product: QuoteProduct) => {
    setFormData((prev) => ({
      ...prev,
      products: [...prev.products, product],
    }));
  }, []);

  const updateProduct = useCallback((index: number, product: QuoteProduct) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.map((p, i) => (i === index ? product : p)),
    }));
  }, []);

  const removeProduct = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index),
    }));
  }, []);

  // Notes
  const updateNotes = useCallback((notes: string) => {
    setFormData((prev) => ({
      ...prev,
      notes,
    }));
  }, []);

  // Payment method
  const updatePaymentMethod = useCallback((paymentMethod: QuotePayment) => {
    setFormData((prev) => ({
      ...prev,
      paymentMethod,
    }));
  }, []);

  // Reset/clear
  const clearForm = useCallback(() => {
    const emptyForm: QuoteFormData = {
      customer: {
        name: '',
        email: '',
        phone: '',
        createInWooCommerce: true,
      },
      products: [],
      notes: '',
      paymentMethod: undefined,
    };
    setFormData(emptyForm);
    setCurrentStep(1);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Validation
  const isStep1Valid = useCallback(() => {
    const { name, customerName } = formData.customer;
    // Step 1 só precisa do nome
    return (name || customerName) && (name || customerName)!.trim().length > 0;
  }, [formData.customer]);

  const isStep2Valid = useCallback(() => {
    return formData.products.length > 0;
  }, [formData.products]);

  const isStep3Valid = useCallback(() => {
    const { name, email, phone, customerName } = formData.customer;
    // Step 3 precisa de nome, email e telefone completos
    const finalName = name || customerName || '';
    const finalEmail = email || '';
    const finalPhone = phone || '';
    
    const isValid = (
      finalName.trim().length > 0 &&
      finalEmail.trim().length > 0 &&
      finalPhone.trim().length > 0
    );
    
    console.log('🔍 isStep3Valid:', {
      finalName: finalName.trim(),
      finalEmail: finalEmail.trim(),
      finalPhone: finalPhone.trim(),
      isValid
    });
    
    return isValid;
  }, [formData.customer]);

  // Calculate total
  const calculateTotal = useCallback(() => {
    return formData.products.reduce((sum, product) => {
      // Usar preço com acabamentos se disponível, senão preço base
      const unitPrice = product.unitPriceWithFinishing || (product.subtotal / product.quantity);
      // Considerar desconto se existir
      const discountAmount = product.discountPercent
        ? unitPrice * product.quantity * (product.discountPercent / 100)
        : 0;
      return sum + (unitPrice * product.quantity) - discountAmount;
    }, 0);
  }, [formData.products]);

  return {
    // State
    currentStep,
    formData,

    // Navigation
    goToStep,
    nextStep,
    prevStep,

    // Customer
    updateCustomer,

    // Products
    addProduct,
    updateProduct,
    removeProduct,

    // Notes
    updateNotes,

    // Payment method
    updatePaymentMethod,

    // Utility
    clearForm,
    isStep1Valid,
    isStep2Valid,
    isStep3Valid,
    calculateTotal,
  };
}
