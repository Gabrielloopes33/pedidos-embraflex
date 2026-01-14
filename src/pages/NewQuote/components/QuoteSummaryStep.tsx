// QuoteSummaryStep - Step 3: Resumo e geração de link de assinatura
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Button } from '@/componentes/ui/button';
import { Badge } from '@/componentes/ui/badge';
import { Textarea } from '@/componentes/ui/textarea';
import { Label } from '@/componentes/ui/label';
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
import { ChevronLeft, Link2, Copy, Check, FileDown, Save, Loader2 } from 'lucide-react';
import { QuoteProduct } from '@/lib/quotes';
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
  onSuccess: () => void;
}

export function QuoteSummaryStep({
  customerData,
  products,
  notes,
  onUpdateNotes,
  onSuccess,
}: QuoteSummaryStepProps) {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [signatureLink, setSignatureLink] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

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

  const handleSaveDraft = async () => {
    await createQuoteMutation.mutateAsync({
      customerName: customerData.name || customerData.customerName || '',
      customerEmail: customerData.email || customerData.customerEmail,
      customerPhone: customerData.phone || customerData.customerPhone,
      products,
      notes,
    });
  };

  const handleGenerateLink = async () => {
    try {
      // Se configurado para criar no WooCommerce, criar/atualizar cliente primeiro
      if (customerData.createInWooCommerce && customerData.name && customerData.email && customerData.phone) {
        toast({
          title: 'Criando cliente...',
          description: 'Cadastrando cliente no WooCommerce.',
        });
        
        try {
          await createOrUpdateCustomer({
            name: customerData.name,
            email: customerData.email,
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
            title: 'Aviso',
            description: 'Não foi possível cadastrar no WooCommerce, mas a cotação será criada.',
            variant: 'destructive',
          });
        }
      }
      
      // Create the quote (usando nome unificado)
      const quote = await createQuoteMutation.mutateAsync({
        customerName: customerData.name || customerData.customerName || '',
        customerEmail: customerData.email || customerData.customerEmail,
        customerPhone: customerData.phone || customerData.customerPhone,
        products,
        notes,
      });

      // Then generate signature link
      await generateLinkMutation.mutateAsync(quote.id);
    } catch (error) {
      console.error('Error generating link:', error);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(signatureLink);
    setCopied(true);
    toast({
      title: 'Link copiado!',
      description: 'Link de assinatura copiado para a área de transferência.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCloseModal = () => {
    setShowLinkModal(false);
    onSuccess();
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
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {product.width && product.height && (
                            <Badge variant="outline" className="text-xs">
                              {product.width} x {product.height} cm
                            </Badge>
                          )}
                          {product.finishing.hotStamp && (
                            <Badge variant="outline" className="text-xs">
                              Hot Stamp
                            </Badge>
                          )}
                          {product.finishing.eyelets && (
                            <Badge variant="outline" className="text-xs">
                              Ilhós
                            </Badge>
                          )}
                          {product.finishing.cord && (
                            <Badge variant="outline" className="text-xs">
                              Cordão
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{product.quantity}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(product.price)}
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
              <p className="text-sm font-mono">{signatureLink}</p>
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
