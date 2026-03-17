// QuoteSummaryStep - Step 3: Resumo e geração de link de assinatura
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Button } from '@/componentes/ui/button';
import { Badge } from '@/componentes/ui/badge';
import { Textarea } from '@/componentes/ui/textarea';
import { Label } from '@/componentes/ui/label';
import { Input } from '@/componentes/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/componentes/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/componentes/ui/dialog';
import { Link2, Copy, Check, Save, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { QuoteProduct, QuotePayment, PaymentMethodType } from '@/lib/quotes';
import { QuoteCustomerData } from '../hooks/useQuoteWizard';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { createQuote, generateSignatureLink } from '@/lib/quotes';
import { createOrUpdateCustomer } from '@/lib/customers';

interface QuoteSummaryStepProps {
  customerData: QuoteCustomerData;
  products: QuoteProduct[];
  notes?: string;
  onUpdateNotes: (notes: string) => void;
  paymentMethod?: QuotePayment;
  onUpdatePaymentMethod: (paymentMethod: QuotePayment) => void;
  onSuccess: () => void;
}

export function QuoteSummaryStep({
  customerData,
  products,
  notes,
  onUpdateNotes,
  paymentMethod,
  onUpdatePaymentMethod,
  onSuccess,
}: QuoteSummaryStepProps) {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [signatureLink, setSignatureLink] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Create quote mutation
  const createQuoteMutation = useMutation({
    mutationFn: createQuote,
    onSuccess: (data) => {
      toast({
        title: 'Cotação criada!',
        description: `Cotação ${data.quoteNumber} criada com sucesso.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar cotação',
        description: error.message || 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  // Generate link mutation
  const generateLinkMutation = useMutation({
    mutationFn: (quoteId: string) => generateSignatureLink(quoteId),
    onSuccess: (data) => {
      setSignatureLink(data.signatureLink);
      setExpiresAt(data.expiresAt);
      setShowLinkModal(true);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao gerar link',
        description: error.message || 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const calculateTotal = () => {
    return products.reduce((sum, p) => sum + p.subtotal, 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'long',
      }).format(new Date(dateString));
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return dateString;
    }
  };

  const validateEmail = (email: string): boolean => {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSaveDraft = async () => {
    await createQuoteMutation.mutateAsync({
      customerName: customerData.name || customerData.customerName || '',
      customerEmail: customerData.email || customerData.customerEmail,
      customerPhone: customerData.phone || customerData.customerPhone,
      customerCompany: customerData.company,
      customerCpf: customerData.cpf,
      customerCnpj: customerData.cnpj,
      customerCep: customerData.cep,
      customerAddress: customerData.address,
      customerNumber: customerData.number,
      customerComplement: customerData.complement,
      customerNeighborhood: customerData.neighborhood,
      customerCity: customerData.city,
      customerState: customerData.state,
      products,
      notes,
    });
  };

  const handleGenerateLink = async () => {
    try {
      const emailToUse = customerData.email || customerData.customerEmail;
      
      // Validar email antes de criar cliente no WooCommerce
      if (customerData.createInWooCommerce && customerData.name && emailToUse && customerData.phone) {
        if (!validateEmail(emailToUse)) {
          toast({
            title: 'Email inválido',
            description: 'Por favor, verifique o endereço de email do cliente.',
            variant: 'destructive',
          });
          return;
        }

        toast({
          title: 'Criando cliente...',
          description: 'Cadastrando cliente no WooCommerce.',
        });

        try {
          await createOrUpdateCustomer({
            name: customerData.name,
            email: emailToUse,
            phone: customerData.phone,
            company: customerData.company,
            cpf: customerData.cpf,
            cnpj: customerData.cnpj,
            cep: customerData.cep,
            address: customerData.address,
            number: customerData.number,
            complement: customerData.complement,
            neighborhood: customerData.neighborhood,
            city: customerData.city,
            state: customerData.state,
          });

          toast({
            title: 'Cliente cadastrado!',
            description: 'Cliente criado/atualizado no WooCommerce com sucesso.',
          });
        } catch (error: any) {
          console.error('Erro ao criar cliente no WooCommerce:', error);
          toast({
            title: 'Erro ao cadastrar cliente',
            description: 'Não foi possível cadastrar no WooCommerce, mas a cotação será criada.',
            variant: 'destructive',
          });
        }
      }

      // Create the quote (usando nome unificado)
      const quote = await createQuoteMutation.mutateAsync({
        customerName: customerData.name || customerData.customerName || '',
        customerEmail: emailToUse,
        customerPhone: customerData.phone || customerData.customerPhone,
        customerCompany: customerData.company,
        customerCpf: customerData.cpf,
        customerCnpj: customerData.cnpj,
        customerCep: customerData.cep,
        customerAddress: customerData.address,
        customerNumber: customerData.number,
        customerComplement: customerData.complement,
        customerNeighborhood: customerData.neighborhood,
        customerCity: customerData.city,
        customerState: customerData.state,
        products,
        notes,
        paymentMethod,
      });

      // Then generate signature link
      await generateLinkMutation.mutateAsync(quote.id);
    } catch (error) {
      console.error('Error generating link:', error);
    }
  };

  const handleCloseModal = () => {
    setShowLinkModal(false);
    onSuccess();
    navigate('/orders?tab=quotes');
  };

  const handleCopyLink = () => {
    const productionUrl = 'https://embraflex1.netlify.app';
    const token = signatureLink.includes('/') 
      ? signatureLink.split('/').pop() 
      : signatureLink;
    const fullLink = `${productionUrl}/assinar/${token}`;
    navigator.clipboard.writeText(fullLink);
    setCopied(true);
    toast({
      title: 'Link copiado!',
      description: 'Link de assinatura copiado para a área de transferência.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const isLoading = createQuoteMutation.isPending || generateLinkMutation.isPending;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Customer Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Nome:</span>
              <p className="font-medium">{customerData.name || customerData.customerName}</p>
            </div>
            {(customerData.email || customerData.customerEmail) && (
              <div>
                <span className="text-sm text-muted-foreground">Email:</span>
                <p>{customerData.email || customerData.customerEmail}</p>
              </div>
            )}
            {(customerData.phone || customerData.customerPhone) && (
              <div>
                <span className="text-sm text-muted-foreground">Telefone:</span>
                <p>{customerData.phone || customerData.customerPhone}</p>
              </div>
            )}
            {customerData.company && (
              <div>
                <span className="text-sm text-muted-foreground">Empresa:</span>
                <p>{customerData.company}</p>
              </div>
            )}
            {customerData.cpf && (
              <div>
                <span className="text-sm text-muted-foreground">CPF:</span>
                <p>{customerData.cpf}</p>
              </div>
            )}
            {customerData.cnpj && (
              <div>
                <span className="text-sm text-muted-foreground">CNPJ:</span>
                <p>{customerData.cnpj}</p>
              </div>
            )}
            {customerData.address && (
              <div className="md:col-span-2">
                <span className="text-sm text-muted-foreground">Endereço:</span>
                <p>
                  {customerData.address}
                  {customerData.number && `, ${customerData.number}`}
                  {customerData.complement && ` - ${customerData.complement}`}
                  {customerData.neighborhood && ` - ${customerData.neighborhood}`}
                  {customerData.city && customerData.state && ` - ${customerData.city}/${customerData.state}`}
                  {customerData.cep && ` - CEP: ${customerData.cep}`}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-center">Qtd</TableHead>
                  <TableHead className="text-right">Preço Unit.</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
               <TableBody>
                 {products.map((product, index) => (
                   <TableRow key={index}>
                     <TableCell>
                       <div className="space-y-3">
                         {/* Título consolidado: SKU - Nome do Produto */}
                         <div>
                           <p className="font-medium text-base">
                             {product.sku} - {product.name}
                           </p>
                         </div>
                         
                         {/* Atributos do Produto (filtrados para remover duplicações) */}
                         {product.attributes && Object.keys(product.attributes).length > 0 && (
                           <div className="flex flex-wrap gap-1">
                             {Object.entries(product.attributes)
                               .filter(([key]) => {
                                 // Filtrar chaves que já estão no título ou são redundantes
                                 const lowerKey = key.toLowerCase();
                                 return !['papel', 'tipo de papel', 'paper'].includes(lowerKey);
                               })
                               .map(([key, value]) => (
                                 <Badge key={key} variant="outline" className="text-xs bg-gray-50">
                                   {key}: {value}
                                 </Badge>
                               ))}
                           </div>
                         )}
                         
                         {/* Cor do Produto (somente se não estiver no nome) */}
                         {product.color && !product.name.toLowerCase().includes(product.color.toLowerCase()) && (
                           <div className="flex items-center gap-2">
                             <span className="text-xs text-muted-foreground">Cor:</span>
                             <Badge variant="outline" className="text-xs bg-pink-50 border-pink-200 text-pink-800">
                               {product.color}
                             </Badge>
                           </div>
                         )}
                         
                         {/* Dimensões */}
                         {(product.width || product.height) && (
                           <div className="text-sm">
                             <span className="text-muted-foreground">Dimensões: </span>
                             <span className="font-medium">
                               {product.width || '-'}cm x {product.height || '-'}cm
                             </span>
                           </div>
                         )}
                         
                         {/* Acabamentos Detalhados */}
                         {product.finishing && (
                           <div className="bg-primary/5 border border-primary/20 rounded-md p-3 space-y-2">
                             <p className="text-xs font-semibold text-primary">Acabamentos:</p>
                             <div className="flex flex-wrap gap-2">
                               {product.finishing.laminationType && product.finishing.laminationType !== 'nenhum' && product.finishing.laminationType !== '' && (
                                 <Badge variant="outline" className="text-xs bg-purple-50 border-purple-300 text-purple-700 py-1">
                                   ✨ Laminação: {product.finishing.laminationType === 'fosco' ? 'Fosco' : 'Brilho'}
                                 </Badge>
                               )}
                               {product.finishing.hotStamp && (
                                 <Badge variant="outline" className="text-xs bg-purple-50 border-purple-300 text-purple-700 py-1">
                                   🔥 Hot Stamp
                                   {product.finishing.hotStampCor && product.finishing.hotStampCor !== 'nenhum' 
                                     ? `: ${product.finishing.hotStampCor}` 
                                     : ''}
                                   {product.finishing.hotStampCor === 'colorido' && product.finishing.hotStampCorManual
                                     ? ` (${product.finishing.hotStampCorManual})`
                                     : ''}
                                 </Badge>
                               )}
                               {product.finishing.eyelets && (
                                 <Badge variant="outline" className="text-xs bg-blue-50 border-blue-300 text-blue-700 py-1">
                                   ⭕ Ilhós
                                   {product.finishing.ilhosCorManual
                                     ? ` (${product.finishing.ilhosCorManual})`
                                     : ''}
                                 </Badge>
                               )}
                               {product.finishing.furoPresente && (
                                 <Badge variant="outline" className="text-xs bg-pink-50 border-pink-300 text-pink-700 py-1">
                                   🎁 Furo de Presente
                                 </Badge>
                               )}
                               {(product.finishing.cord || (product.finishing.cordao && product.finishing.cordao !== 'nenhum')) && (
                                 <Badge variant="outline" className="text-xs bg-amber-50 border-amber-300 text-amber-700 py-1">
                                   🧵 Cordão
                                   {product.finishing.cordao && product.finishing.cordao !== 'nenhum'
                                     ? `: ${product.finishing.cordao}`
                                     : ''}
                                   {product.finishing.corCordao && product.finishing.corCordao !== 'nenhum'
                                     ? ` - ${product.finishing.corCordao}`
                                     : ''}
                                   {product.finishing.corCordao === 'colorido' && product.finishing.cordaoCorManual
                                     ? ` (${product.finishing.cordaoCorManual})`
                                     : ''}
                                 </Badge>
                               )}
                             </div>
                           </div>
                         )}
                       </div>
                     </TableCell>
                     <TableCell className="text-center">{product.quantity}</TableCell>
                     <TableCell className="text-right">
                       {formatCurrency(product.subtotal / product.quantity)}
                     </TableCell>
                     <TableCell className="text-right font-medium">
                       {formatCurrency(product.subtotal)}
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
            </Table>
          </div>

          {/* Total */}
          <div className="mt-4 pt-4 border-t flex justify-between items-center">
            <span className="text-lg font-semibold">Total da Cotação:</span>
            <span className="text-2xl font-bold">{formatCurrency(calculateTotal())}</span>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Observações</CardTitle>
          <CardDescription>Adicione notas ou instruções especiais (opcional)</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Ex: Cliente solicitou entrega expressa..."
            value={notes || ''}
            onChange={(e) => onUpdateNotes(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Forma de Pagamento</CardTitle>
          <CardDescription>Selecione a forma de pagamento do cliente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tipo de Pagamento - Seleção Principal */}
          <div className="space-y-3">
            <Label>Tipo de Pagamento</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Button
                variant={paymentMethod?.type === 'pix' ? 'default' : 'outline'}
                onClick={() => onUpdatePaymentMethod({ type: 'pix', totalAmount: calculateTotal() })}
                className="h-14 text-base"
              >
                Pix
              </Button>
              <Button
                variant={paymentMethod?.type === 'credit_card' ? 'default' : 'outline'}
                onClick={() => onUpdatePaymentMethod({ type: 'credit_card', totalAmount: calculateTotal() })}
                className="h-14 text-base"
              >
                Cartão de Crédito
              </Button>
              <Button
                variant={paymentMethod?.type === 'debit_card' ? 'default' : 'outline'}
                onClick={() => onUpdatePaymentMethod({ type: 'debit_card', totalAmount: calculateTotal() })}
                className="h-14 text-base"
              >
                Cartão de Débito
              </Button>
              <Button
                variant={paymentMethod?.type === 'cash' ? 'default' : 'outline'}
                onClick={() => onUpdatePaymentMethod({ type: 'cash', totalAmount: calculateTotal() })}
                className="h-14 text-base"
              >
                Dinheiro à Vista
              </Button>
              <Button
                variant={paymentMethod?.type === 'boleto' ? 'default' : 'outline'}
                onClick={() => onUpdatePaymentMethod({ type: 'boleto', boleto: {}, totalAmount: calculateTotal() })}
                className="h-14 text-base"
              >
                Boleto
              </Button>
              <Button
                variant={paymentMethod?.type === 'combined' ? 'default' : 'outline'}
                onClick={() => onUpdatePaymentMethod({ type: 'combined', combined: { method1: { type: 'pix' as PaymentMethodType }, method2: undefined }, totalAmount: calculateTotal() })}
                className="h-14 text-base"
              >
                Combinação
              </Button>
            </div>
          </div>

          {/* Detalhes baseados no tipo selecionado */}
          {paymentMethod?.type === 'pix' && (
            <div className="space-y-2 p-4 bg-muted rounded-lg">
              <Label htmlFor="pix-key">Chave Pix</Label>
              <Input
                id="pix-key"
                placeholder="CPF, Email, Telefone ou Chave Aleatória"
                value={paymentMethod.pix?.key || ''}
                onChange={(e) => onUpdatePaymentMethod({ ...paymentMethod, pix: { key: e.target.value }, totalAmount: calculateTotal() })}
              />
            </div>
          )}

          {(paymentMethod?.type === 'credit_card' || paymentMethod?.type === 'debit_card') && (
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <div className="space-y-2">
                <Label>Bandeira do Cartão</Label>
                <div className="grid grid-cols-3 gap-2">
                      {['visa', 'mastercard', 'elo'].map((brand) => (
                        <Button
                          key={brand}
                          variant={paymentMethod.cards?.[0]?.brand === brand ? 'default' : 'outline'}
                          onClick={() => onUpdatePaymentMethod({
                            ...paymentMethod,
                            cards: [{ type: paymentMethod.type === 'credit_card' ? 'credit' : 'debit', brand: brand as 'visa' | 'mastercard' | 'elo' }],
                            totalAmount: calculateTotal(),
                          })}
                          className="h-12"
                        >
                          {brand.toUpperCase()}
                        </Button>
                      ))}
                </div>
              </div>

              {paymentMethod?.type === 'credit_card' && (
                <div className="space-y-2">
                  <Label>Parcelamento</Label>
                  <select
                    className="w-full p-2 border rounded-md bg-background"
                    value={paymentMethod.cards?.[0]?.installmentCount?.toString() || '1'}
                    onChange={(e) => onUpdatePaymentMethod({
                      ...paymentMethod,
                      cards: [{ ...paymentMethod.cards?.[0], installmentCount: parseInt(e.target.value) }],
                      totalAmount: calculateTotal(),
                    })}
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((installments) => (
                      <option key={installments} value={installments.toString()}>
                        {installments}x
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {paymentMethod?.type === 'cash' && (
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <Label htmlFor="cash-amount">Valor à Vista</Label>
              <Input
                id="cash-amount"
                type="number"
                placeholder={formatCurrency(calculateTotal())}
                value={paymentMethod.cash?.amount?.toString() || ''}
                onChange={(e) => onUpdatePaymentMethod({
                  ...paymentMethod,
                  cash: { amount: parseFloat(e.target.value) || undefined },
                  totalAmount: parseFloat(e.target.value) || calculateTotal(),
                })}
                className="text-lg font-semibold h-14"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Deixe em branco para usar o valor total da cotação ({formatCurrency(calculateTotal())})
              </p>
            </div>
          )}

          {paymentMethod?.type === 'boleto' && (
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="boleto-due-date">Data de Vencimento (Opcional)</Label>
                <Input
                  id="boleto-due-date"
                  type="date"
                  placeholder="DD/MM/AAAA"
                  value={paymentMethod.boleto?.dueDate || ''}
                  onChange={(e) => onUpdatePaymentMethod({
                    ...paymentMethod,
                    boleto: { ...paymentMethod.boleto, dueDate: e.target.value },
                    totalAmount: calculateTotal(),
                  })}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="boleto-instructions">Instruções (Opcional)</Label>
                <Textarea
                  id="boleto-instructions"
                  placeholder="Ex: Pagável em qualquer banco até a data de vencimento..."
                  value={paymentMethod.boleto?.instructions || ''}
                  onChange={(e) => onUpdatePaymentMethod({
                    ...paymentMethod,
                    boleto: { ...paymentMethod.boleto, instructions: e.target.value },
                    totalAmount: calculateTotal(),
                  })}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          )}

          {paymentMethod?.type === 'combined' && (
            <div className="space-y-6 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold text-lg mb-4">Pagamento Combinado</h3>

              {/* Método 1 */}
              <div className="space-y-3 border-b pb-4">
                <h4 className="font-medium">1ª Forma</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['pix', 'credit_card', 'debit_card', 'cash', 'boleto'].map((type) => (
                    <Button
                      key={type}
                      variant={paymentMethod.combined?.method1?.type === type ? 'default' : 'outline'}
                      onClick={() => {
                        onUpdatePaymentMethod({
                          ...paymentMethod,
                          combined: {
                            method1: { type: type as PaymentMethodType },
                            method2: paymentMethod.combined?.method2 || {},
                          },
                          totalAmount: calculateTotal(),
                        });
                      }}
                      className="h-12"
                    >
                      {type === 'pix' && 'Pix'}
                      {type === 'credit_card' && 'Crédito'}
                      {type === 'debit_card' && 'Débito'}
                      {type === 'cash' && 'Dinheiro'}
                      {type === 'boleto' && 'Boleto'}
                    </Button>
                  ))}
                </div>

                {/* Detalhes do método 1 */}
                {paymentMethod.combined?.method1?.type === 'credit_card' && (
                  <div className="space-y-2 mt-2">
                    <Label>Bandeira</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {['visa', 'mastercard', 'elo'].map((brand) => (
                        <Button key={brand} variant={paymentMethod.combined?.method1?.card?.brand === brand ? 'default' : 'outline'}
                      onClick={() => onUpdatePaymentMethod({
                        ...paymentMethod,
                        combined: {
                          method1: { ...paymentMethod.combined?.method1, card: { brand: brand as 'visa' | 'mastercard' | 'elo', type: 'credit' } },
                          method2: paymentMethod.combined?.method2 || undefined,
                        },
                        totalAmount: calculateTotal(),
                      })}
                      className="h-12">{brand.toUpperCase()}</Button>
                      ))}
                    </div>
                    <Label>Parcelas</Label>
                    <select
                      className="w-full p-2 border rounded-md bg-background"
                      value={paymentMethod.combined?.method1?.card?.installmentCount?.toString() || '1'}
                      onChange={(e) => onUpdatePaymentMethod({
                        ...paymentMethod,
                        combined: {
                          method1: { ...paymentMethod.combined?.method1, card: { ...paymentMethod.combined?.method1?.card, installmentCount: parseInt(e.target.value) } },
                          method2: paymentMethod.combined?.method2 || {},
                        },
                        totalAmount: calculateTotal(),
                      })}
                    >
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((installments) => (
                        <option key={installments} value={installments.toString()}>
                          {installments}x
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {paymentMethod.combined?.method1?.type === 'cash' && (
                  <div className="space-y-2 mt-2">
                    <Label htmlFor="cash-amount-1">Valor em Dinheiro</Label>
                    <Input id="cash-amount-1" type="number" placeholder="R$ 0,00" value={paymentMethod.combined?.method1?.amount?.toString() || ''}
                      onChange={(e) => onUpdatePaymentMethod({
                        ...paymentMethod,
                        combined: {
                          method1: { ...paymentMethod.combined?.method1, amount: parseFloat(e.target.value) || undefined },
                          method2: paymentMethod.combined?.method2 || {},
                        },
                        totalAmount: calculateTotal(),
                      })}
                      className="h-12" />
                  </div>
                )}

                {paymentMethod.combined?.method1?.type === 'boleto' && (
                  <div className="space-y-2 mt-2">
                    <Label htmlFor="boleto-due-date-1">Data de Vencimento (Opcional)</Label>
                    <Input id="boleto-due-date-1" type="date" placeholder="DD/MM/AAAA"
                      value={paymentMethod.combined?.method1?.boleto?.dueDate || ''}
                      onChange={(e) => onUpdatePaymentMethod({
                        ...paymentMethod,
                        combined: {
                          method1: { ...paymentMethod.combined?.method1, boleto: { ...paymentMethod.combined?.method1?.boleto, dueDate: e.target.value } },
                          method2: paymentMethod.combined?.method2 || {},
                        },
                        totalAmount: calculateTotal(),
                      })}
                      className="h-12" />
                  </div>
                )}
              </div>

              {/* Método 2 */}
              <div className="space-y-3 pt-4">
                <h4 className="font-medium">2ª Forma (Opcional)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['pix', 'credit_card', 'debit_card', 'cash', 'boleto'].map((type) => (
                    <Button
                      key={type}
                      variant={paymentMethod.combined?.method2?.type === type ? 'default' : 'outline'}
                      onClick={() => {
                        onUpdatePaymentMethod({
                          ...paymentMethod,
                          combined: {
                            method1: paymentMethod.combined?.method1 || {},
                            method2: { type: type as PaymentMethodType },
                          },
                          totalAmount: calculateTotal(),
                        });
                      }}
                      className="h-12"
                    >
                      {type === 'pix' && 'Pix'}
                      {type === 'credit_card' && 'Crédito'}
                      {type === 'debit_card' && 'Débito'}
                      {type === 'cash' && 'Dinheiro'}
                      {type === 'boleto' && 'Boleto'}
                    </Button>
                  ))}
                </div>

                {/* Detalhes do método 2 */}
                {paymentMethod.combined?.method2?.type === 'credit_card' && (
                  <div className="space-y-2 mt-2">
                    <Label>Bandeira</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {['visa', 'mastercard', 'elo'].map((brand) => (
                        <Button key={brand} variant={paymentMethod.combined?.method2?.card?.brand === brand ? 'default' : 'outline'}
                          onClick={() => onUpdatePaymentMethod({
                            ...paymentMethod,
                            combined: {
                              method1: paymentMethod.combined?.method1 || {},
                              method2: { ...paymentMethod.combined?.method2, card: { brand: brand as const, type: 'credit' as const } },
                            },
                            totalAmount: calculateTotal(),
                          })}
                          className="h-12">{brand.toUpperCase()}</Button>
                      ))}
                    </div>
                    <Label>Parcelas</Label>
                    <select
                      className="w-full p-2 border rounded-md bg-background"
                      value={paymentMethod.combined?.method2?.card?.installmentCount?.toString() || '1'}
                      onChange={(e) => onUpdatePaymentMethod({
                        ...paymentMethod,
                        combined: {
                          method1: paymentMethod.combined?.method1 || {},
                          method2: { ...paymentMethod.combined?.method2, card: { ...paymentMethod.combined?.method2?.card, installmentCount: parseInt(e.target.value) } },
                        },
                        totalAmount: calculateTotal(),
                      })}
                    >
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((installments) => (
                        <option key={installments} value={installments.toString()}>
                          {installments}x
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {paymentMethod.combined?.method2?.type === 'cash' && (
                  <div className="space-y-2 mt-2">
                    <Label htmlFor="cash-amount-2">Valor em Dinheiro</Label>
                    <Input id="cash-amount-2" type="number" placeholder="R$ 0,00" value={paymentMethod.combined?.method2?.amount?.toString() || ''}
                      onChange={(e) => onUpdatePaymentMethod({
                        ...paymentMethod,
                        combined: {
                          method1: paymentMethod.combined?.method1 || {},
                          method2: { ...paymentMethod.combined?.method2, amount: parseFloat(e.target.value) || undefined },
                        },
                        totalAmount: calculateTotal(),
                      })}
                      className="h-12" />
                  </div>
                )}

                {paymentMethod.combined?.method2?.type === 'boleto' && (
                  <div className="space-y-2 mt-2">
                    <Label htmlFor="boleto-due-date-2">Data de Vencimento (Opcional)</Label>
                    <Input id="boleto-due-date-2" type="date" placeholder="DD/MM/AAAA"
                      value={paymentMethod.combined?.method2?.boleto?.dueDate || ''}
                      onChange={(e) => onUpdatePaymentMethod({
                        ...paymentMethod,
                        combined: {
                          method1: paymentMethod.combined?.method1 || {},
                          method2: { ...paymentMethod.combined?.method2, boleto: { ...paymentMethod.combined?.method2?.boleto, dueDate: e.target.value } },
                        },
                        totalAmount: calculateTotal(),
                      })}
                      className="h-12" />
                  </div>
                )}
              </div>

              {/* Observações de pagamento */}
              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="payment-notes">Observações do Pagamento</Label>
                <Textarea
                  id="payment-notes"
                  placeholder="Ex: Cliente prefere pagar com cartão Visa..."
                  value={paymentMethod?.notes || ''}
                  onChange={(e) => onUpdatePaymentMethod({
                    ...paymentMethod,
                    notes: e.target.value,
                  })}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validity Info */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Válido até:</span>
            <span className="font-medium">
              {formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())}
            </span>
            <Badge variant="outline">7 dias</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          variant="outline"
          size="lg"
          onClick={handleSaveDraft}
          disabled={isLoading}
          className="w-full h-14 text-base touch-manipulation"
        >
          {createQuoteMutation.isPending ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Save className="mr-2 h-5 w-5" />
          )}
          Salvar Rascunho
        </Button>

        <Button
          size="lg"
          onClick={handleGenerateLink}
          disabled={isLoading}
          className="w-full h-16 text-lg font-semibold touch-manipulation"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Gerando Link...
            </>
          ) : (
            <>
              <Link2 className="mr-2 h-5 w-5" />
              Gerar Link de Assinatura
            </>
          )}
        </Button>
      </div>

      {/* Link Modal */}
      <Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Link de Assinatura Gerado!</DialogTitle>
            <DialogDescription>
              Compartilhe este link com o cliente para assinatura da cotação
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Link Display */}
            <div className="p-4 bg-muted rounded-lg break-all">
              <p className="text-sm font-mono">
                https://embraflex1.netlify.app/assinar/{signatureLink.split('/').pop()}
              </p>
            </div>

            {/* Copy Button */}
            <Button
              onClick={handleCopyLink}
              size="lg"
              className="w-full"
              variant={copied ? 'secondary' : 'default'}
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  Link Copiado!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-5 w-5" />
                  Copiar Link
                </>
              )}
            </Button>

            {/* Instructions */}
            <div className="space-y-2 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
              <p className="font-medium text-sm">📱 Como enviar ao cliente:</p>
              <ol className="text-sm space-y-1 ml-4 list-decimal">
                <li>Copie o link acima</li>
                <li>Abra o WhatsApp do cliente</li>
                <li>Cole e envie o link</li>
                <li>Cliente clica, revisa e assina</li>
              </ol>
            </div>

            {/* Expiry Warning */}
            {expiresAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>⏰ Este link expira em:</span>
                <span className="font-medium text-foreground">{formatDate(expiresAt)}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button onClick={handleCloseModal} className="flex-1">
              Fechar e Ver Cotações
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
