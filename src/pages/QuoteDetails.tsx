import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/componentes/ui/card";
import { Button } from "@/componentes/ui/button";
import { Input } from "@/componentes/ui/input";
import { Badge } from "@/componentes/ui/badge";
import { Separator } from "@/componentes/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/componentes/ui/table";
import { ArrowLeft, Loader2, Copy, CheckCircle2, ExternalLink, Eye } from "lucide-react";
import { getQuote, QuoteWithViews, generateSignatureLink, regenerateSignatureLink } from "@/lib/quotes";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

const quoteStatusConfig = {
  "draft": { label: "Rascunho", color: "bg-gray-500" },
  "sent": { label: "Pendente Assinatura", color: "bg-yellow-500" },
  "approved": { label: "Assinado", color: "bg-green-500" },
  "rejected": { label: "Recusado", color: "bg-red-500" },
  "converted": { label: "Convertido", color: "bg-blue-500" },
};

const formatProductDisplayName = (name: string, sku: string) => {
  if (!sku) return name;
  if (name.toLowerCase().startsWith(sku.toLowerCase())) {
    return name;
  }
  return `${sku} - ${name}`;
};

const QuoteDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<QuoteWithViews | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);

  console.log('🔍 QuoteDetails montado - ID:', id);

  useEffect(() => {
    const fetchQuote = async () => {
      if (!id) {
        console.error('❌ ID não encontrado na URL');
        setError('ID da cotação não encontrado');
        setLoading(false);
        return;
      }

      try {
        console.log('🔄 Iniciando busca da cotação - ID:', id);
        const data = await getQuote(id);
        console.log('✅ Cotação recebida - Tipo:', typeof data);
        console.log('📋 Campos da cotação:', Object.keys(data));
        console.log('🔍 Campos especiais:', {
          hasViewCount: 'viewCount' in data,
          hasLastViewedAt: 'lastViewedAt' in data,
          viewCount: (data as any).viewCount,
          lastViewedAt: (data as any).lastViewedAt
        });

        // Verificar e corrigir products se necessário
        let products = data.products;
        console.log('📦 Products original:', products, 'Tipo:', typeof products);

        if (typeof products === 'string') {
          console.log('🔄 Products é string JSON, fazendo parse...');
          try {
            products = JSON.parse(products);
            console.log('✅ Products parseado:', products);
          } catch (e) {
            console.error('❌ Erro ao fazer parse de products:', e);
            products = [];
          }
        } else if (!Array.isArray(products)) {
          console.warn('⚠️ Products não é array, convertendo...');
          console.log('📋 Tipo de products:', typeof products, 'Valor:', products);
          products = [];
        }

        // Converter para QuoteWithViews com fallbacks
        const quoteWithViews: QuoteWithViews = {
          ...data,
          products: products as any,
          viewCount: (data as any).viewCount ?? 0,
          lastViewedAt: (data as any).lastViewedAt ?? undefined
        };

        console.log('✅ QuoteWithViews pronto, definindo no estado');
        setQuote(quoteWithViews);
        setError(null);
      } catch (error: any) {
        console.error('❌ Erro ao carregar cotação:', error);
        console.error('📝 Detalhes do erro:', {
          message: error?.message,
          status: error?.response?.status,
          data: error?.response?.data
        });
        setError(error?.response?.data?.message || error?.message || 'Erro ao carregar cotação');
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, [id]);

  const handleGenerateLink = async () => {
    if (!id || !quote) return;

    try {
      setGeneratingLink(true);
      
      let response;
      // Se já existe link mas está expirado, regenera
      if (quote.signatureLink && quote.expiresAt && new Date(quote.expiresAt) < new Date()) {
        response = await regenerateSignatureLink(id);
        toast({
          title: "Link regenerado!",
          description: "O link de assinatura foi renovado por mais 7 dias.",
        });
      } else if (!quote.signatureLink) {
        // Se não existe link, gera um novo
        response = await generateSignatureLink(id);
        toast({
          title: "Link gerado!",
          description: "O link de assinatura foi criado com sucesso.",
        });
      }

      if (response) {
        // Atualiza o quote com o novo link
        setQuote({
          ...quote,
          signatureLink: response.signatureLink,
          expiresAt: response.expiresAt,
          status: 'sent'
        });
      }
    } catch (error: any) {
      console.error('❌ Erro ao gerar link:', error);
      toast({
        variant: "destructive",
        title: "Erro ao gerar link",
        description: error?.response?.data?.message || error?.message || 'Erro ao gerar link de assinatura',
      });
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleCopyLink = () => {
    if (quote?.signatureLink) {
      // Sempre usar o domínio de produção, não localhost
      const productionUrl = 'https://embraflex1.netlify.app';
      const token = quote.signatureLink.includes('/') 
        ? quote.signatureLink.split('/').pop() 
        : quote.signatureLink;
      const fullLink = `${productionUrl}/assinar/${token}`;
      navigator.clipboard.writeText(fullLink);
      setCopied(true);
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para a área de transferência.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenLink = () => {
    if (quote?.signatureLink) {
      const productionUrl = 'https://embraflex1.netlify.app';
      const token = quote.signatureLink.includes('/') 
        ? quote.signatureLink.split('/').pop() 
        : quote.signatureLink;
      window.open(`${productionUrl}/assinar/${token}`, '_blank');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="text-center py-12">
          <p className="text-destructive font-semibold">Erro ao carregar cotação</p>
          <p className="text-sm text-muted-foreground mt-2">{error || 'Cotação não encontrada'}</p>
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={() => navigate('/orders')}
          >
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const isLinkExpired = quote.expiresAt && new Date(quote.expiresAt) < new Date();

  console.log('🎯 Renderizando QuoteDetails:', {
    loading,
    error,
    hasQuote: !!quote,
    quoteId: quote?.id,
    quoteStatus: quote?.status
  });

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/orders')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Cotação {quote.quoteNumber}</h1>
            <p className="text-muted-foreground mt-1">{quote.customerName}</p>
          </div>
        </div>
        <Badge className={quoteStatusConfig[quote.status].color}>
          {quoteStatusConfig[quote.status].label}
        </Badge>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Cotação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Data de Criação</p>
              <p className="font-medium">{format(new Date(quote.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
            </div>
            {quote.expiresAt && (
              <div>
                <p className="text-sm text-muted-foreground">Validade</p>
                <p className="font-medium">{format(new Date(quote.expiresAt), "dd/MM/yyyy", { locale: ptBR })}</p>
              </div>
            )}
            {quote.customerEmail && (
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{quote.customerEmail}</p>
              </div>
            )}
            {quote.customerPhone && (
              <div>
                <p className="text-sm text-muted-foreground">Telefone</p>
                <p className="font-medium">{quote.customerPhone}</p>
              </div>
            )}
            {quote.createdByName && (
              <div>
                <p className="text-sm text-muted-foreground">Criado por</p>
                <p className="font-medium">{quote.createdByName}</p>
              </div>
            )}
            {(quote as QuoteWithViews).viewCount !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground">Visualizações</p>
                <p className="font-medium flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  {(quote as QuoteWithViews).viewCount}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Signature Link Card */}
      {(quote.status === 'draft' || quote.status === 'sent') && (
        <Card>
          <CardHeader>
            <CardTitle>Link de Assinatura</CardTitle>
            <CardDescription>
              {quote.signatureLink
                ? isLinkExpired
                  ? 'O link de assinatura expirou. Gere um novo link para enviar ao cliente.'
                  : 'Envie este link para o cliente assinar a cotação.'
                : 'Gere um link de assinatura para enviar ao cliente.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {quote.signatureLink && !isLinkExpired ? (
              <>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={`https://embraflex1.netlify.app/assinar/${quote.signatureLink.includes('/') ? quote.signatureLink.split('/').pop() : quote.signatureLink}`}
                    className="flex-1"
                  />
                  <Button onClick={handleCopyLink} variant="outline" size="icon">
                    {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button onClick={handleOpenLink} variant="outline" size="icon">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Link válido até {format(new Date(quote.expiresAt!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </>
            ) : (
              <Button
                onClick={handleGenerateLink}
                disabled={generatingLink}
                className="w-full"
              >
                {generatingLink && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {quote.signatureLink && isLinkExpired ? 'Regenerar Link' : 'Gerar Link de Assinatura'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Status Específicos */}
      {quote.status === 'approved' && quote.signedAt && (
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              <div>
                <p className="font-semibold">Cotação Assinada</p>
                <p className="text-sm text-muted-foreground">
                  Assinada em {format(new Date(quote.signedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {quote.status === 'rejected' && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="pt-6">
            <div>
              <p className="font-semibold text-red-500">Cotação Recusada</p>
              {quote.rejectionReason && (
                <p className="text-sm text-muted-foreground mt-2">
                  Motivo: {quote.rejectionReason}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos</CardTitle>
        </CardHeader>
        <CardContent>
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
              {quote.products.map((product, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{formatProductDisplayName(product.name, product.sku)}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{product.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(product.subtotal / product.quantity)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(product.subtotal)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Separator className="my-4" />

          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total:</span>
            <span className="text-3xl font-bold text-primary">
              {formatCurrency(quote.totalPrice)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {quote.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{quote.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuoteDetails;
