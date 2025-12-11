import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/componentes/ui/dialog";
import { Button } from "@/componentes/ui/button";
import { Input } from "@/componentes/ui/input";
import { Label } from "@/componentes/ui/label";
import { Checkbox } from "@/componentes/ui/checkbox";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { createCustomer, getCustomers } from "@/lib/customers";
import type { CustomerCreateData, WooCommerceCustomer } from "@/lib/types";
import { toast } from "sonner";

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (customer: WooCommerceCustomer) => void;
}

export function CustomerFormDialog({ open, onOpenChange, onSuccess }: CustomerFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Dados básicos (Slide 1)
    nomeFantasia: "",
    razaoSocial: "",
    email: "",
    phone: "",
    cpfCnpj: "",
    // Endereço (Slide 2)
    address_1: "",
    address_2: "",
    city: "",
    state: "",
    postcode: "",
    country: "BR",
    // Entrega
    needsDelivery: false,
    deliveryAddress_1: "",
    deliveryAddress_2: "",
    deliveryCity: "",
    deliveryState: "",
    deliveryPostcode: "",
    deliveryCountry: "BR",
  });

  const handleNext = () => {
    // Validação do Step 1
    if (currentStep === 1) {
      if (!formData.nomeFantasia || !formData.razaoSocial || !formData.email) {
        toast.error("Preencha os campos obrigatórios");
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const resetForm = () => {
    setFormData({
      nomeFantasia: "",
      razaoSocial: "",
      email: "",
      phone: "",
      cpfCnpj: "",
      address_1: "",
      address_2: "",
      city: "",
      state: "",
      postcode: "",
      country: "BR",
      needsDelivery: false,
      deliveryAddress_1: "",
      deliveryAddress_2: "",
      deliveryCity: "",
      deliveryState: "",
      deliveryPostcode: "",
      deliveryCountry: "BR",
    });
    setCurrentStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nomeFantasia || !formData.razaoSocial || !formData.email) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setLoading(true);

    try {
      // Verificar se o cliente já existe pelo email
      const existingCustomers = await getCustomers({ search: formData.email });
      if (existingCustomers && existingCustomers.length > 0) {
        const existingCustomer = existingCustomers.find(c => c.email === formData.email);
        if (existingCustomer) {
          toast.info("Cliente já existe no sistema!");
          if (onSuccess) {
            onSuccess(existingCustomer);
          }
          onOpenChange(false);
          resetForm();
          return;
        }
      }

      // Gerar username único baseado no email e timestamp
      const timestamp = Date.now();
      const usernameBase = formData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      const username = `${usernameBase}_${timestamp}`;
      
      // Gerar senha aleatória para o WooCommerce (usuário pode resetar depois)
      const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);

      const customerData: CustomerCreateData = {
        email: formData.email,
        first_name: formData.nomeFantasia,
        last_name: "",
        username: username,
        password: randomPassword,
        billing: {
          first_name: formData.nomeFantasia,
          last_name: "",
          company: formData.razaoSocial,
          email: formData.email,
          phone: formData.phone || "",
          address_1: formData.address_1 || "",
          address_2: formData.address_2 || "",
          city: formData.city || "",
          state: formData.state || "",
          postcode: formData.postcode || "",
          country: formData.country || "BR",
        },
        shipping: formData.needsDelivery ? {
          first_name: formData.nomeFantasia,
          last_name: "",
          company: formData.razaoSocial,
          address_1: formData.deliveryAddress_1 || formData.address_1 || "",
          address_2: formData.deliveryAddress_2 || formData.address_2 || "",
          city: formData.deliveryCity || formData.city || "",
          state: formData.deliveryState || formData.state || "",
          postcode: formData.deliveryPostcode || formData.postcode || "",
          country: formData.deliveryCountry || formData.country || "BR",
        } : {
          first_name: formData.nomeFantasia,
          last_name: "",
          company: formData.razaoSocial,
          address_1: formData.address_1 || "",
          address_2: formData.address_2 || "",
          city: formData.city || "",
          state: formData.state || "",
          postcode: formData.postcode || "",
          country: formData.country || "BR",
        },
        meta_data: [
          { key: "_billing_cpf_cnpj", value: formData.cpfCnpj || "" },
          { key: "_nome_fantasia", value: formData.nomeFantasia },
          { key: "_razao_social", value: formData.razaoSocial },
          { key: "_needs_delivery", value: formData.needsDelivery ? "yes" : "no" },
        ],
      };

      const newCustomer = await createCustomer(customerData);

      toast.success("Cliente criado com sucesso!");

      if (onSuccess) {
        onSuccess(newCustomer);
      }

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao criar cliente:", error);

      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { 
          response?: { 
            data?: { 
              message?: string; 
              error?: any;
              details?: any;
            } 
          } 
        };
        
        // Tentar extrair a mensagem de erro mais detalhada possível
        const errorData = axiosError.response?.data;
        let errorMessage = errorData?.message || "Erro ao criar cliente.";
        
        // Se houver detalhes adicionais, mostrar também
        if (errorData?.details) {
          console.log('📋 Detalhes do erro:', errorData.details);
          
          // Se for um objeto de erro do WooCommerce
          if (errorData.details.message) {
            errorMessage = errorData.details.message;
          }
          
          // Se houver parâmetros inválidos
          if (errorData.details.data?.params) {
            const params = errorData.details.data.params;
            const paramErrors = Object.entries(params)
              .map(([key, value]) => `${key}: ${value}`)
              .join(', ');
            errorMessage += ` (${paramErrors})`;
          }
        }
        
        toast.error(errorMessage, {
          duration: 5000,
        });
      } else {
        toast.error("Erro ao criar cliente. Verifique os dados e tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Cliente - Passo {currentStep} de 2</DialogTitle>
          <DialogDescription>
            {currentStep === 1 
              ? "Informe os dados básicos do cliente" 
              : "Informe o endereço e dados de entrega"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* SLIDE 1 - Dados Básicos */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nomeFantasia">Nome Fantasia *</Label>
                <Input
                  id="nomeFantasia"
                  value={formData.nomeFantasia}
                  onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })}
                  placeholder="Nome fantasia do cliente"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="razaoSocial">Razão Social *</Label>
                <Input
                  id="razaoSocial"
                  value={formData.razaoSocial}
                  onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                  placeholder="Razão social completa"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@empresa.com"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
                  <Input
                    id="cpfCnpj"
                    value={formData.cpfCnpj}
                    onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 2 - Endereço e Entrega */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="border-b pb-3 mb-4">
                <h3 className="font-semibold text-sm">Endereço de Cobrança</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_1">Endereço</Label>
                <Input
                  id="address_1"
                  value={formData.address_1}
                  onChange={(e) => setFormData({ ...formData, address_1: e.target.value })}
                  placeholder="Rua, número"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_2">Complemento</Label>
                <Input
                  id="address_2"
                  value={formData.address_2}
                  onChange={(e) => setFormData({ ...formData, address_2: e.target.value })}
                  placeholder="Apartamento, sala, etc."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="São Paulo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="postcode">CEP</Label>
                <Input
                  id="postcode"
                  value={formData.postcode}
                  onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                  placeholder="00000-000"
                />
              </div>

              {/* Checkbox para habilitar endereço de entrega diferente */}
              <div className="flex items-center space-x-2 pt-4 border-t">
                <Checkbox
                  id="needsDelivery"
                  checked={formData.needsDelivery}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, needsDelivery: checked as boolean })
                  }
                />
                <Label
                  htmlFor="needsDelivery"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Endereço de entrega diferente do endereço de cobrança
                </Label>
              </div>

              {/* Campos de Endereço de Entrega (condicional) */}
              {formData.needsDelivery && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="border-b pb-3 mb-4">
                    <h3 className="font-semibold text-sm">Endereço de Entrega</h3>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deliveryAddress_1">Endereço</Label>
                    <Input
                      id="deliveryAddress_1"
                      value={formData.deliveryAddress_1}
                      onChange={(e) => setFormData({ ...formData, deliveryAddress_1: e.target.value })}
                      placeholder="Rua, número"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deliveryAddress_2">Complemento</Label>
                    <Input
                      id="deliveryAddress_2"
                      value={formData.deliveryAddress_2}
                      onChange={(e) => setFormData({ ...formData, deliveryAddress_2: e.target.value })}
                      placeholder="Apartamento, sala, etc."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="deliveryCity">Cidade</Label>
                      <Input
                        id="deliveryCity"
                        value={formData.deliveryCity}
                        onChange={(e) => setFormData({ ...formData, deliveryCity: e.target.value })}
                        placeholder="São Paulo"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="deliveryState">Estado</Label>
                      <Input
                        id="deliveryState"
                        value={formData.deliveryState}
                        onChange={(e) => setFormData({ ...formData, deliveryState: e.target.value })}
                        placeholder="SP"
                        maxLength={2}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deliveryPostcode">CEP</Label>
                    <Input
                      id="deliveryPostcode"
                      value={formData.deliveryPostcode}
                      onChange={(e) => setFormData({ ...formData, deliveryPostcode: e.target.value })}
                      placeholder="00000-000"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
            {currentStep === 1 ? (
              <>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    onOpenChange(false);
                    resetForm();
                  }}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button 
                  type="button" 
                  onClick={handleNext} 
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  Próximo
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </>
            ) : (
              <>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleBack}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {loading ? "Criando..." : "Criar Cliente"}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
