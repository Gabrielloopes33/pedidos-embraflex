// useQuoteWizard - Hook para gerenciar estado do wizard de cotação
import { useState, useEffect, useCallback } from 'react';
import { QuoteProduct } from '@/lib/quotes';

export interface QuoteCustomerData {
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface QuoteFormData {
  customer: QuoteCustomerData;
  products: QuoteProduct[];
  notes?: string;
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
        customerName: '',
        customerEmail: '',
        customerPhone: '',
      },
      products: [],
      notes: '',
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
    setCurrentStep((prev) => Math.min(prev + 1, 3));
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

  // Reset/clear
  const clearForm = useCallback(() => {
    const emptyForm: QuoteFormData = {
      customer: {
        customerName: '',
        customerEmail: '',
        customerPhone: '',
      },
      products: [],
      notes: '',
    };
    setFormData(emptyForm);
    setCurrentStep(1);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Validation
  const isStep1Valid = useCallback(() => {
    return formData.customer.customerName.trim().length > 0;
  }, [formData.customer.customerName]);

  const isStep2Valid = useCallback(() => {
    return formData.products.length > 0;
  }, [formData.products]);

  // Calculate total
  const calculateTotal = useCallback(() => {
    return formData.products.reduce((sum, product) => sum + product.subtotal, 0);
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

    // Utility
    clearForm,
    isStep1Valid,
    isStep2Valid,
    calculateTotal,
  };
}
