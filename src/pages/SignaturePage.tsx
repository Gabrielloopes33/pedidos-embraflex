// SignaturePage - Página pública para assinatura de cotações
import { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/componentes/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Checkbox } from '@/componentes/ui/checkbox';
import { Label } from '@/componentes/ui/label';
import { Textarea } from '@/componentes/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/componentes/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/componentes/ui/table';
import { Badge } from '@/componentes/ui/badge';
import { Separator } from '@/componentes/ui/separator';
import { CheckCircle2, XCircle, Clock, Loader2, AlertCircle, Shield } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface PublicQuoteData {
  quoteNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCompany?: string;
  customerCpf?: string;
  customerCnpj?: string;
  customerCep?: string;
  customerAddress?: string;
  customerNumber?: string;
  customerComplement?: string;
  customerNeighborhood?: string;
  customerCity?: string;
  customerState?: string;
  products: Array<{
    name: string;
    sku: string;
    quantity: number;
    price: number;
    subtotal: number;
    width?: number;
    height?: number;
    color?: string;
    attributes?: Record<string, string>;
    discriminacaoProduto?: string;
    larguraCm?: number;
    alturaCm?: number;
    comprimentoCm?: number;
    tipoImpressao?: string;
    modelo?: string; // Modelo do produto
    paperType?: string; // Tipo de papel
    lamination?: string; // Laminação
    finishing?: {
      hotStamp?: boolean;
      hotStampCor?: string;
      hotStampCorManual?: string;
      eyelets?: boolean;
      ilhosCorManual?: string;
      furoPresente?: boolean;
      cord?: boolean;
      cordao?: string;
      corCordao?: string;
      cordaoCorManual?: string;
    };
  }>;
  totalPrice: number;
  expiresAt: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  condicoesPagamento?: string | object;
  createdByName?: string;
}

export default function SignaturePage() {
  const { token } = useParams<{ token: string }>();
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch quote data
  const { data: quote, isLoading, error } = useQuery({
    queryKey: ['signature-quote', token],
    queryFn: async () => {
      const response = await apiClient.get(`/signature/${token}`);
      const data = response.data as PublicQuoteData;
      
      // Parse products if they come as string
      if (data.products && typeof data.products === 'string') {
        try {
          data.products = JSON.parse(data.products);
        } catch (e) {
          console.error('Failed to parse products:', e);
          data.products = [];
        }
      }
      
      console.log('📋 Quote data:', data);
      return data;
    },
    retry: false,
  });

  // Register view when page loads
  useEffect(() => {
    if (token) {
      // Registrar visualização
      apiClient.post(`/signature/${token}/view`, {
        geolocation: null, // Could implement geolocation if needed
      }).catch((err) => {
        console.error('Failed to register view:', err);
      });
    }
  }, [token]);

  // Confirm/sign quote
  const confirmMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(`/signature/${token}/confirm`, {
        geolocation: null,
      });
      return response.data;
    },
    onSuccess: (data) => {
      setSuccess(true);
      setSuccessMessage(data.message);
    },
  });

  // Reject quote
  const rejectMutation = useMutation({
    mutationFn: async (reason: string) => {
      const response = await apiClient.post(`/signature/${token}/reject`, {
        reason: reason || null,
      });
      return response.data;
    },
    onSuccess: (data) => {
      setShowRejectModal(false);
      setSuccess(true);
      setSuccessMessage(data.message);
    },
  });

  const handleConfirm = () => {
    if (!agreedToTerms) return;
    confirmMutation.mutate();
  };

  const handleReject = () => {
    rejectMutation.mutate(rejectReason);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'long',
    }).format(new Date(dateString));
  };

  // No token - invalid
  if (!token) {
    return <Navigate to="/404" replace />;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-12 pb-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-lg text-muted-foreground">Carregando cotação...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error states
  if (error) {
    const errorResponse = (error as Error & { response?: { data?: { code?: string; message?: string } } }).response?.data;
    const errorCode = errorResponse?.code;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-destructive/10 to-background p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <div className="flex items-center gap-3 text-destructive">
              {errorCode === 'EXPIRED' ? (
                <Clock className="w-8 h-8" />
              ) : (
                <AlertCircle className="w-8 h-8" />
              )}
              <div>
                <CardTitle className="text-2xl">
                  {errorCode === 'EXPIRED' ? 'Link Expirado' : 'Link Inválido'}
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  {errorResponse?.message || 'Este link de assinatura não é válido ou não existe mais.'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {errorCode === 'EXPIRED'
                ? 'Este link de assinatura expirou. Entre em contato com o vendedor para receber um novo link.'
                : 'Por favor, entre em contato com o vendedor para obter um novo link de assinatura.'}
            </p>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">📞 Precisa de ajuda?</p>
              <p className="text-sm text-muted-foreground">
                Entre em contato conosco pelo WhatsApp ou email para renovar sua cotação.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500/10 to-background p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-12 h-12" />
              <div>
                <CardTitle className="text-2xl">Sucesso!</CardTitle>
                <CardDescription className="text-base mt-2">
                  {successMessage}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm font-medium mb-1">Cotação: {quote?.quoteNumber}</p>
                <p className="text-sm text-muted-foreground">
                  Nossa equipe entrará em contato em breve para dar continuidade ao pedido.
                </p>
              </div>
              
              <Separator />
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Obrigado por escolher a Embraflex!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already signed or rejected
  if (quote && (quote.status === 'approved' || quote.status === 'rejected')) {
    const isApproved = quote.status === 'approved';
    
    return (
      <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${isApproved ? 'from-green-500/10' : 'from-yellow-500/10'} to-background p-4`}>
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <div className={`flex items-center gap-3 ${isApproved ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
              {isApproved ? (
                <CheckCircle2 className="w-8 h-8" />
              ) : (
                <XCircle className="w-8 h-8" />
              )}
              <div>
                <CardTitle className="text-2xl">
                  {isApproved ? 'Cotação Já Assinada' : 'Cotação Recusada'}
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  {isApproved
                    ? 'Esta cotação já foi assinada anteriormente.'
                    : 'Esta cotação foi recusada.'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`p-4 ${isApproved ? 'bg-green-500/10 border-green-500/20' : 'bg-yellow-500/10 border-yellow-500/20'} border rounded-lg`}>
              <p className="text-sm font-medium">Cotação: {quote.quoteNumber}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {isApproved
                  ? 'Nossa equipe já está processando seu pedido.'
                  : 'Caso tenha mudado de ideia, entre em contato com o vendedor.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main quote view
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Embraflex</h1>
          <p className="text-muted-foreground">Cotação Digital</p>
        </div>

        {/* Quote Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">Cotação {quote?.quoteNumber}</CardTitle>
                <CardDescription className="text-lg mt-2">
                  {quote?.customerName}
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-base px-4 py-2">
                <Clock className="w-4 h-4 mr-2" />
                Válido até {quote && formatDate(quote.expiresAt)}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Customer Details Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl text-primary">Dados do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quote?.customerEmail && (
                <div>
                  <span className="text-sm text-muted-foreground">E-mail:</span>
                  <p className="font-medium">{quote.customerEmail}</p>
                </div>
              )}
              {quote?.customerPhone && (
                <div>
                  <span className="text-sm text-muted-foreground">Telefone:</span>
                  <p className="font-medium">{quote.customerPhone}</p>
                </div>
              )}
              {quote?.customerCompany && (
                <div>
                  <span className="text-sm text-muted-foreground">Empresa:</span>
                  <p className="font-medium">{quote.customerCompany}</p>
                </div>
              )}
              {(quote?.customerCpf || quote?.customerCnpj) && (
                <div>
                  <span className="text-sm text-muted-foreground">Documento:</span>
                  <p className="font-medium">
                    {quote.customerCpf || quote.customerCnpj}
                  </p>
                </div>
              )}
            </div>

            {/* Address */}
            {(quote?.customerAddress || quote?.customerCep) && (
              <>
                <Separator />
                <div>
                  <span className="text-sm text-muted-foreground">Endereço:</span>
                  <p className="font-medium">
                    {quote.customerAddress}
                    {quote.customerNumber && `, ${quote.customerNumber}`}
                    {quote.customerComplement && ` - ${quote.customerComplement}`}
                  </p>
                  {(quote.customerNeighborhood || quote.customerCity || quote.customerState) && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {quote.customerNeighborhood && `${quote.customerNeighborhood} - `}
                      {quote.customerCity && quote.customerState 
                        ? `${quote.customerCity}/${quote.customerState}` 
                        : quote.customerCity || quote.customerState}
                    </p>
                  )}
                  {quote.customerCep && (
                    <p className="text-sm text-muted-foreground">
                      CEP: {quote.customerCep}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Vendedor */}
            {quote?.createdByName && (
              <>
                <Separator />
                <div className="bg-muted/50 rounded-lg p-3">
                  <span className="text-sm text-muted-foreground">Vendedor Responsável:</span>
                  <p className="font-semibold text-primary">{quote.createdByName}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Products - Detailed Cards */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Detalhes do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
               {Array.isArray(quote?.products) && quote.products.map((product, index) => {
               const hasFinishing = product.finishing && (
                 product.finishing.hotStamp ||
                 product.finishing.eyelets ||
                 product.finishing.furoPresente ||
                 (product.finishing.cord || (product.finishing.cordao && product.finishing.cordao !== 'nenhum'))
               );

               const hasDimensions = product.width || product.height || product.larguraCm || product.alturaCm || product.comprimentoCm;

               return (
                 <div key={index} className="border rounded-lg p-4 space-y-3 bg-card">
                   {/* Product Name & SKU */}
                   <div className="flex items-start justify-between gap-4">
                     <div className="flex-1">
                       <h3 className="font-semibold text-base">{product.name}</h3>
                       <p className="text-sm text-muted-foreground font-medium">SKU: {product.sku}</p>
                     </div>
                     <Badge variant="secondary" className="text-sm px-3 py-1 flex-shrink-0 bg-primary text-primary-foreground">
                       {product.quantity} un
                     </Badge>
                   </div>

                  {/* Discriminação/Descrição do produto */}
                  {product.discriminacaoProduto && (
                    <p className="text-sm text-muted-foreground">
                      {product.discriminacaoProduto}
                    </p>
                  )}

                  {/* Color */}
                  {product.color && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Cor: </span>
                      <span className="font-medium">{product.color}</span>
                    </div>
                  )}

                  {/* Attributes */}
                  {product.attributes && Object.keys(product.attributes).length > 0 && (
                    <div className="text-sm">
                      {Object.entries(product.attributes).map(([key, value]) => (
                        <span key={key} className="mr-3">
                          <span className="text-muted-foreground">{key}: </span>
                          <span className="font-medium">{value}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Modelo, Papel, Laminação */}
                  {(product.modelo || product.paperType || product.lamination) && (
                    <div className="bg-muted/50 rounded-md p-2 space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Especificações do Produto:</p>
                      <div className="flex flex-wrap gap-2">
                        {product.modelo && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Modelo: {product.modelo}
                          </span>
                        )}
                        {product.paperType && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            Papel: {product.paperType}
                          </span>
                        )}
                        {product.lamination && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Laminação: {product.lamination}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dimensions */}
                  {hasDimensions && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Dimensões: </span>
                      <span className="font-medium">
                        {(product.width || product.larguraCm || '-')}cm x {(product.height || product.alturaCm || '-')}cm
                        {product.comprimentoCm ? ` x ${product.comprimentoCm}cm` : ''}
                      </span>
                    </div>
                  )}

                  {/* Tipo de Impressão */}
                  {product.tipoImpressao && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Impressão: </span>
                      <span className="font-medium">{product.tipoImpressao}</span>
                    </div>
                  )}

                   {/* Acabamentos - Detailed Section */}
                   {hasFinishing && (
                     <div className="bg-primary/5 border border-primary/20 rounded-md p-3 space-y-2">
                       <p className="text-sm font-semibold text-primary flex items-center gap-2">
                         <span className="w-2 h-2 rounded-full bg-primary"></span>
                         Acabamentos:
                       </p>
                       <div className="flex flex-wrap gap-2">
                         {product.finishing!.hotStamp && (
                           <Badge variant="outline" className="text-xs py-1 bg-purple-100 border-purple-300 text-purple-800 font-medium">
                             🔥 Hot Stamp
                             {product.finishing!.hotStampCor && product.finishing!.hotStampCor !== 'nenhum'
                               ? `: ${product.finishing!.hotStampCor}`
                               : ''}
                             {product.finishing!.hotStampCor === 'colorido' && product.finishing!.hotStampCorManual
                               ? ` (${product.finishing!.hotStampCorManual})`
                               : ''}
                           </Badge>
                         )}
                         {product.finishing!.eyelets && (
                           <Badge variant="outline" className="text-xs py-1 bg-blue-100 border-blue-300 text-blue-800 font-medium">
                             ⭕ Ilhós
                             {product.finishing!.ilhosCorManual
                               ? ` (${product.finishing!.ilhosCorManual})`
                               : ''}
                           </Badge>
                         )}
                         {product.finishing!.furoPresente && (
                           <Badge variant="outline" className="text-xs py-1 bg-pink-100 border-pink-300 text-pink-800 font-medium">
                             🎁 Furo de Presente
                           </Badge>
                         )}
                         {(product.finishing!.cord || (product.finishing!.cordao && product.finishing!.cordao !== 'nenhum')) && (
                           <Badge variant="outline" className="text-xs py-1 bg-amber-100 border-amber-300 text-amber-800 font-medium">
                             🧵 Cordão
                             {product.finishing!.cordao && product.finishing!.cordao !== 'nenhum'
                               ? `: ${product.finishing!.cordao}`
                               : ''}
                             {product.finishing!.corCordao && product.finishing!.corCordao !== 'nenhum'
                               ? ` - ${product.finishing!.corCordao}`
                               : ''}
                             {product.finishing!.corCordao === 'colorido' && product.finishing!.cordaoCorManual
                               ? ` (${product.finishing!.cordaoCorManual})`
                               : ''}
                           </Badge>
                         )}
                       </div>
                     </div>
                   )}

                   {/* Price Row */}
                   <div className="flex items-baseline justify-between pt-2 border-t bg-muted/30 px-3 py-2 -mx-3 rounded">
                     <span className="text-sm text-muted-foreground">
                       {formatCurrency(product.price)} x {product.quantity} un
                     </span>
                     <span className="text-lg font-semibold text-primary">
                       {formatCurrency(product.subtotal)}
                     </span>
                   </div>
                </div>
              );
            })}

            <Separator className="my-4" />

            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total da Cotação:</span>
              <span className="text-3xl font-bold text-primary">
                {quote && formatCurrency(quote.totalPrice)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Display */}
        {quote?.condicoesPagamento && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl text-primary">Forma de Pagamento</CardTitle>
              <CardDescription>
                Conforme combinado com o vendedor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                let paymentData;
                try {
                  paymentData = typeof quote.condicoesPagamento === 'string'
                    ? JSON.parse(quote.condicoesPagamento)
                    : quote.condicoesPagamento;
                } catch (e) {
                  console.error('Failed to parse payment method:', e);
                  paymentData = null;
                }

                if (!paymentData) return null;

                switch (paymentData.type) {
                  case 'pix':
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                          <span className="text-2xl">📱</span>
                          <div>
                            <p className="font-semibold text-lg">Pagamento via Pix</p>
                            {paymentData.pix?.key && (
                              <p className="text-sm text-muted-foreground">
                                Chave: <span className="font-mono bg-muted px-2 py-1 rounded">{paymentData.pix.key}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );

                  case 'credit_card':
                    return (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                          <span className="text-2xl">💳</span>
                          <div>
                            <p className="font-semibold text-lg">Cartão de Crédito</p>
                            {paymentData.cards?.[0]?.brand && (
                              <p className="text-sm text-muted-foreground">
                                Bandeira: <span className="font-medium">{paymentData.cards[0].brand.toUpperCase()}</span>
                              </p>
                            )}
                            {paymentData.cards?.[0]?.installmentCount && paymentData.cards[0].installmentCount > 1 && (
                              <p className="text-sm text-muted-foreground">
                                Parcelamento: <span className="font-medium">{paymentData.cards[0].installmentCount}x</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );

                  case 'debit_card':
                    return (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                          <span className="text-2xl">💳</span>
                          <div>
                            <p className="font-semibold text-lg">Cartão de Débito</p>
                            {paymentData.cards?.[0]?.brand && (
                              <p className="text-sm text-muted-foreground">
                                Bandeira: <span className="font-medium">{paymentData.cards[0].brand.toUpperCase()}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );

                  case 'cash':
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                          <span className="text-2xl">💵</span>
                          <div>
                            <p className="font-semibold text-lg">Dinheiro à Vista</p>
                            {paymentData.cash?.amount && (
                              <p className="text-sm text-muted-foreground">
                                Valor: <span className="font-medium">{formatCurrency(paymentData.cash.amount)}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );

                  case 'boleto':
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                          <span className="text-2xl">📄</span>
                          <div>
                            <p className="font-semibold text-lg">Pagamento via Boleto</p>
                            {paymentData.boleto?.dueDate && (
                              <p className="text-sm text-muted-foreground">
                                Vencimento: <span className="font-medium">{formatDate(paymentData.boleto.dueDate)}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        {paymentData.boleto?.instructions && (
                          <div className="mt-4 p-3 bg-muted rounded-lg">
                            <p className="text-sm font-medium">Instruções:</p>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {paymentData.boleto.instructions}
                            </p>
                          </div>
                        )}
                      </div>
                    );

                  case 'combined':
                    return (
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg mb-3">Pagamento Combinado</h3>

                        {paymentData.combined?.method1 && (
                          <div className="space-y-2 p-3 bg-muted rounded-lg">
                            <p className="font-medium text-base">
                              {paymentData.combined.method1.type === 'pix' && '📱 Pix'}
                              {paymentData.combined.method1.type === 'credit_card' && '💳 Cartão de Crédito'}
                              {paymentData.combined.method1.type === 'debit_card' && '💳 Cartão de Débito'}
                              {paymentData.combined.method1.type === 'cash' && '💵 Dinheiro'}
                              {paymentData.combined.method1.type === 'boleto' && '📄 Boleto'}
                            </p>
                            {paymentData.combined.method1.card?.brand && (
                              <p className="text-sm text-muted-foreground">
                                Bandeira: {paymentData.combined.method1.card.brand.toUpperCase()}
                              </p>
                            )}
                            {paymentData.combined.method1.card?.installmentCount && paymentData.combined.method1.card.installmentCount > 1 && (
                              <p className="text-sm text-muted-foreground">
                                {paymentData.combined.method1.card.installmentCount}x
                              </p>
                            )}
                            {paymentData.combined.method1.amount && (
                              <p className="text-sm text-muted-foreground">
                                Valor: {formatCurrency(paymentData.combined.method1.amount)}
                              </p>
                            )}
                          </div>
                        )}

                        {paymentData.combined?.method2 && (
                          <div className="space-y-2 p-3 bg-muted rounded-lg">
                            <p className="font-medium text-base">
                              {paymentData.combined.method2.type === 'pix' && '📱 Pix'}
                              {paymentData.combined.method2.type === 'credit_card' && '💳 Cartão de Crédito'}
                              {paymentData.combined.method2.type === 'debit_card' && '💳 Cartão de Débito'}
                              {paymentData.combined.method2.type === 'cash' && '💵 Dinheiro'}
                              {paymentData.combined.method2.type === 'boleto' && '📄 Boleto'}
                            </p>
                            {paymentData.combined.method2.card?.brand && (
                              <p className="text-sm text-muted-foreground">
                                Bandeira: {paymentData.combined.method2.card.brand.toUpperCase()}
                              </p>
                            )}
                            {paymentData.combined.method2.card?.installmentCount && paymentData.combined.method2.card.installmentCount > 1 && (
                              <p className="text-sm text-muted-foreground">
                                {paymentData.combined.method2.card.installmentCount}x
                              </p>
                            )}
                            {paymentData.combined.method2.amount && (
                              <p className="text-sm text-muted-foreground">
                                Valor: {formatCurrency(paymentData.combined.method2.amount)}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );

                  default:
                    return null;
                }
              })()}

              {(() => {
                try {
                  const paymentData = typeof quote.condicoesPagamento === 'string'
                    ? JSON.parse(quote.condicoesPagamento)
                    : quote.condicoesPagamento;
                  return paymentData?.notes;
                } catch (e) {
                  return null;
                }
              })() && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Observações:</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {(() => {
                      try {
                        const paymentData = typeof quote.condicoesPagamento === 'string'
                          ? JSON.parse(quote.condicoesPagamento)
                          : quote.condicoesPagamento;
                        return paymentData?.notes;
                      } catch (e) {
                        return '';
                      }
                    })()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Terms and Conditions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl text-primary">Condições Gerais de Venda</CardTitle>
            <CardDescription>
              Leia atentamente antes de aceitar esta cotação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ol className="space-y-3 list-decimal list-inside">
              <li className="text-muted-foreground leading-relaxed">
                O CLIENTE deverá proceder com a análise minuciosa do layout, conferindo dados como endereço, proporção dos elementos gráficos, tamanhos e redes sociais.
              </li>
              <li className="text-muted-foreground leading-relaxed">
                NÃO SERÁ ACEITA a devolução de mercadoria devido à natureza personalizada e industrializada do produto. A responsabilidade pela análise e validação do layout e informações fornecidas é integralmente do CLIENTE, cujo consentimento caracteriza autorização para a fabricação.
              </li>
              <li className="text-muted-foreground leading-relaxed">
                A impressão poderá apresentar variações de cor de até 20% na tonalidade final.
              </li>
              <li className="text-muted-foreground leading-relaxed">
                Em relação às sacolas plásticas, as dimensões e espessuras poderão variar até 5% em conformidade com as tolerâncias industriais.
              </li>
              <li className="text-muted-foreground leading-relaxed">
                Alterações no material solicitado, após a autorização para produção, implicarão em novo pedido, sendo o CLIENTE responsável pelo pagamento de ambos os pedidos, considerando a modificação posterior.
              </li>
              <li className="text-muted-foreground leading-relaxed">
                A quantidade das mercadorias poderá apresentar variação (maior ou menor), porém o CLIENTE pagará pelo quantitativo exato entregue.
              </li>
              <li className="text-muted-foreground leading-relaxed">
                A EMPRESA se compromete a produzir as mercadorias conforme as especificações do pedido, com pleno conhecimento do CLIENTE.
              </li>
              <li className="text-muted-foreground leading-relaxed">
                Todas as criações e artes desenvolvidas pela EMPRESA são de propriedade exclusiva, sendo vedada sua utilização sem autorização prévia, conforme a legislação de direitos autorais e propriedade intelectual.
              </li>
              <li className="text-muted-foreground leading-relaxed">
                Ao assinar o presente contrato, o CLIENTE declara ciência e concordância integral com as condições comerciais estabelecidas.
              </li>
              <li className="text-muted-foreground leading-relaxed">
                O pagamento deverá ser realizado no ato do pedido, conforme as condições acordadas. O CLIENTE será responsável por eventuais custos decorrentes de inadimplemento, incluindo taxas judiciais, conforme a legislação vigente. A primeira compra será efetuada à Vista.
              </li>
              <li className="text-muted-foreground leading-relaxed">
                <strong>Pagamento no Cartão:</strong> Parcelamento em até 5x sem juros. Pagamentos à vista no cartão têm <strong>5% de desconto</strong> sobre o valor total.
              </li>
              <li className="text-muted-foreground leading-relaxed">
                A EMPRESA reserva-se o direito de cancelar o pedido caso sejam identificadas restrições de crédito no cadastro do CLIENTE, desde a data da venda até a entrega.
              </li>
              <li className="text-muted-foreground leading-relaxed">
                O Pedido será cancelado caso o CLIENTE não forneça o retorno sobre a aprovação do layout dentro de 30 dias corridos após o envio.
              </li>
              <li className="text-muted-foreground leading-relaxed">
                A EMPRESA se reserva o direito de imprimir sua logomarca nas embalagens e materiais impressos, de forma discreta, para fins de identificação.
              </li>
              <li className="text-muted-foreground leading-relaxed">
                Em caso de inadimplência quanto à forma de pagamento acordada, a EMPRESA poderá registrar o CLIENTE nos cadastros de inadimplentes (SPC, SERASA) ou protestar o título.
              </li>
              <li className="text-muted-foreground leading-relaxed">
                Caso o pagamento não seja realizado no ato do pedido ou da entrega, a venda será automaticamente considerada à vista, sendo enviado um BOLETO com vencimento em 7 dias.
              </li>
            </ol>

            <Separator className="my-6" />

            <div className="space-y-2">
              <h4 className="font-semibold text-base">Tolerância Quantitativa na Produção</h4>
              <p className="text-muted-foreground leading-relaxed">
                As partes acordam que será admitida variação quantitativa na entrega dos produtos em razão das particularidades do processo produtivo: para pedidos iguais ou superiores a 1.000 (mil) unidades, tolerância de até 10% (dez por cento) para mais ou para menos; para pedidos inferiores a 1.000 (mil) unidades, tolerância de 25% (vinte e cinco por cento) a 30% (trinta por cento) para mais ou para menos. O valor total será ajustado proporcionalmente à quantidade efetivamente entregue, aplicando-se o preço unitário estabelecido no Fechamento Financeiro.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Terms Agreement */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                className="mt-1"
              />
              <Label htmlFor="terms" className="cursor-pointer leading-relaxed">
                <span className="font-medium">Li e concordo com todas as Condições Gerais de Venda</span>
                <p className="text-sm text-muted-foreground mt-1">
                  Ao assinar esta cotação, confirmo que li e compreendi todos os termos acima, incluindo as condições de produção, pagamento e entrega, e autorizo a Embraflex a processar este pedido conforme especificado.
                </p>
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button
            size="lg"
            variant="outline"
            onClick={() => setShowRejectModal(true)}
            disabled={confirmMutation.isPending || rejectMutation.isPending}
            className="h-16 text-base"
          >
            <XCircle className="w-5 h-5 mr-2" />
            Recusar Esta Cotação
          </Button>

          <Button
            size="lg"
            onClick={handleConfirm}
            disabled={!agreedToTerms || confirmMutation.isPending || rejectMutation.isPending}
            className="h-16 text-base font-semibold bg-green-600 hover:bg-green-700"
          >
            {confirmMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5 mr-2" />
                Concordo e Assino Este Pedido
              </>
            )}
          </Button>
        </div>

        {/* Security Info */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" />
            Sua assinatura é registrada de forma segura e tem validade jurídica
          </p>
        </div>
      </div>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recusar Cotação</DialogTitle>
            <DialogDescription>
              Lamentamos que esta cotação não atendeu às suas expectativas.
              Você poderia nos contar o motivo? (Opcional)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Digite o motivo da recusa (opcional)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectModal(false)}
              disabled={rejectMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                'Confirmar Recusa'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
