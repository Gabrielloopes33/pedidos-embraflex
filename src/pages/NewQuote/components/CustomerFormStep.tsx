// CustomerFormStep - Formulário completo de cadastro do cliente
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Checkbox } from '@/componentes/ui/checkbox';
import { Separator } from '@/componentes/ui/separator';
import { Button } from '@/componentes/ui/button';
import { User, MapPin, FileText, AlertCircle, Search, Loader2 } from 'lucide-react';
import { QuoteCustomerData } from '../hooks/useQuoteWizard';
import { getCustomers } from '@/lib/customers';
import type { WooCommerceCustomer } from '@/lib/types';

interface CustomerFormStepProps {
  customerData: QuoteCustomerData;
  onUpdateCustomer: (data: QuoteCustomerData) => void;
  isValid: boolean;
}

export function CustomerFormStep({
  customerData,
  onUpdateCustomer,
  isValid,
}: CustomerFormStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);

  // Buscar clientes do WooCommerce
  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['wc-customers', searchTerm],
    queryFn: () => getCustomers({ search: searchTerm, per_page: 10 }),
    enabled: showCustomerSearch && searchTerm.length >= 3,
  });

  const handleSelectCustomer = (customer: WooCommerceCustomer) => {
    const updatedData = {
      ...customerData,
      name: `${customer.first_name} ${customer.last_name}`.trim(),
      email: customer.email,
      phone: customer.billing?.phone || '',
      company: customer.billing?.company || '',
      cep: customer.billing?.postcode || '',
      address: customer.billing?.address_1 || '',
      number: '',
      complement: customer.billing?.address_2 || '',
      neighborhood: '',
      city: customer.billing?.city || '',
      state: customer.billing?.state || '',
      cpf: customer.meta_data?.find((m: any) => m.key === 'cpf')?.value || '',
      cnpj: customer.meta_data?.find((m: any) => m.key === 'cnpj')?.value || '',
    };
    console.log('🔍 Cliente selecionado:', updatedData);
    onUpdateCustomer(updatedData);
    setShowCustomerSearch(false);
    setSearchTerm('');
  };

  const handleChange = (field: keyof QuoteCustomerData, value: string | boolean) => {
    onUpdateCustomer({
      ...customerData,
      [field]: value,
    });
    
    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateCPF = (cpf: string): boolean => {
    // Remove caracteres não numéricos
    const cleaned = cpf.replace(/\D/g, '');
    
    if (cleaned.length !== 11) return false;
    
    // Valida se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cleaned)) return false;
    
    // Validação dos dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleaned.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cleaned.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleaned.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cleaned.charAt(10))) return false;
    
    return true;
  };

  const validateCNPJ = (cnpj: string): boolean => {
    // Remove caracteres não numéricos
    const cleaned = cnpj.replace(/\D/g, '');
    
    if (cleaned.length !== 14) return false;
    
    // Valida se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cleaned)) return false;
    
    // Validação dos dígitos verificadores
    let sum = 0;
    let pos = 5;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleaned.charAt(i)) * pos;
      pos = pos === 2 ? 9 : pos - 1;
    }
    let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (digit !== parseInt(cleaned.charAt(12))) return false;
    
    sum = 0;
    pos = 6;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleaned.charAt(i)) * pos;
      pos = pos === 2 ? 9 : pos - 1;
    }
    digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (digit !== parseInt(cleaned.charAt(13))) return false;
    
    return true;
  };

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 11;
  };

  const handleBlur = (field: keyof QuoteCustomerData) => {
    const value = customerData[field] as string;
    
    if (!value && field !== 'cpf' && field !== 'cnpj') {
      setErrors(prev => ({ ...prev, [field]: 'Campo obrigatório' }));
      return;
    }
    
    switch (field) {
      case 'email':
        if (value && !validateEmail(value)) {
          setErrors(prev => ({ ...prev, email: 'Email inválido' }));
        }
        break;
      case 'phone':
        if (value && !validatePhone(value)) {
          setErrors(prev => ({ ...prev, phone: 'Telefone inválido (mín. 10 dígitos)' }));
        }
        break;
      case 'cpf':
        if (value && !validateCPF(value)) {
          setErrors(prev => ({ ...prev, cpf: 'CPF inválido' }));
        }
        break;
      case 'cnpj':
        if (value && !validateCNPJ(value)) {
          setErrors(prev => ({ ...prev, cnpj: 'CNPJ inválido' }));
        }
        break;
      case 'cep':
        if (value && value.replace(/\D/g, '').length !== 8) {
          setErrors(prev => ({ ...prev, cep: 'CEP inválido (8 dígitos)' }));
        }
        break;
    }
  };

  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const formatCNPJ = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  };

  const formatPhone = (value: string) => {
    if (!value) return '';
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 0) return '';
    
    // Permite digitação progressiva
    if (cleaned.length <= 2) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return cleaned.replace(/(\d{2})(\d+)/, '($1) $2');
    } else if (cleaned.length <= 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d+)/, '($1) $2-$3');
    } else {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
  };

  const formatCEP = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Dados do Cliente
          </CardTitle>
          <CardDescription>
            Preencha os dados completos do cliente para criar a cotação
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Buscar Cliente Existente */}
          {!showCustomerSearch ? (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCustomerSearch(true)}
                className="w-full"
              >
                <Search className="mr-2 h-4 w-4" />
                Buscar Cliente Existente no WooCommerce
              </Button>
            </div>
          ) : (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Digite nome ou email para buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCustomerSearch(false);
                    setSearchTerm('');
                  }}
                >
                  Cancelar
                </Button>
              </div>

              {/* Resultados da busca */}
              {isLoadingCustomers && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {customers && customers.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {customers.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => handleSelectCustomer(customer)}
                      className="w-full text-left p-3 rounded-md border hover:bg-background hover:border-primary transition-colors"
                    >
                      <p className="font-medium">{customer.first_name} {customer.last_name}</p>
                      <p className="text-sm text-muted-foreground">{customer.email}</p>
                      {customer.billing?.phone && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {customer.billing.phone}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {searchTerm.length >= 3 && !isLoadingCustomers && customers?.length === 0 && (
                <p className="text-sm text-muted-foreground text-center p-4">
                  Nenhum cliente encontrado. Preencha o formulário abaixo para criar um novo.
                </p>
              )}

              {searchTerm.length > 0 && searchTerm.length < 3 && (
                <p className="text-xs text-muted-foreground text-center p-2">
                  Digite pelo menos 3 caracteres para buscar
                </p>
              )}
            </div>
          )}

          <Separator />

          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Informações Básicas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nome Completo / Razão Social *
                </Label>
                <Input
                  id="name"
                  value={customerData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  placeholder="Nome do cliente"
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={customerData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  placeholder="email@exemplo.com"
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  Telefone / WhatsApp *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={customerData.phone || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleChange('phone', formatPhone(value));
                  }}
                  onBlur={() => handleBlur('phone')}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  className={errors.phone ? 'border-destructive' : ''}
                />
                {errors.phone && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.phone}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">
                  Empresa (Opcional)
                </Label>
                <Input
                  id="company"
                  value={customerData.company || ''}
                  onChange={(e) => handleChange('company', e.target.value)}
                  placeholder="Nome da empresa"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Documentos */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Documentos (Opcional)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={customerData.cpf || ''}
                  onChange={(e) => handleChange('cpf', formatCPF(e.target.value))}
                  onBlur={() => handleBlur('cpf')}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className={errors.cpf ? 'border-destructive' : ''}
                />
                {errors.cpf && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.cpf}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={customerData.cnpj || ''}
                  onChange={(e) => handleChange('cnpj', formatCNPJ(e.target.value))}
                  onBlur={() => handleBlur('cnpj')}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  className={errors.cnpj ? 'border-destructive' : ''}
                />
                {errors.cnpj && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.cnpj}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Endereço */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Endereço (Opcional)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={customerData.cep || ''}
                  onChange={(e) => handleChange('cep', formatCEP(e.target.value))}
                  onBlur={() => handleBlur('cep')}
                  placeholder="00000-000"
                  maxLength={9}
                  className={errors.cep ? 'border-destructive' : ''}
                />
                {errors.cep && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.cep}
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={customerData.address || ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Rua, Avenida, etc"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  value={customerData.number || ''}
                  onChange={(e) => handleChange('number', e.target.value)}
                  placeholder="Nº"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  value={customerData.complement || ''}
                  onChange={(e) => handleChange('complement', e.target.value)}
                  placeholder="Apto, Sala, etc"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={customerData.neighborhood || ''}
                  onChange={(e) => handleChange('neighborhood', e.target.value)}
                  placeholder="Bairro"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={customerData.city || ''}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="Cidade"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={customerData.state || ''}
                  onChange={(e) => handleChange('state', e.target.value.toUpperCase())}
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Checkbox para WooCommerce */}
          <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
            <Checkbox
              id="createInWooCommerce"
              checked={customerData.createInWooCommerce ?? true}
              onCheckedChange={(checked) => handleChange('createInWooCommerce', checked as boolean)}
            />
            <div className="space-y-1">
              <Label
                htmlFor="createInWooCommerce"
                className="cursor-pointer font-medium"
              >
                Cadastrar cliente no WooCommerce
              </Label>
              <p className="text-xs text-muted-foreground">
                Ao marcar esta opção, o cliente será automaticamente cadastrado ou atualizado no WooCommerce
                com todos os dados fornecidos acima.
              </p>
            </div>
          </div>

          {/* Avisos */}
          {Object.keys(errors).length > 0 && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Por favor, corrija os erros acima antes de continuar
              </p>
            </div>
          )}

          {!isValid && Object.keys(errors).length === 0 && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm text-yellow-700 dark:text-yellow-400 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Preencha os campos obrigatórios: Nome, Email e Telefone
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
