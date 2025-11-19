import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/componentes/ui/dialog";
import { Button } from "@/componentes/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { Badge } from "@/componentes/ui/badge";
import { Separator } from "@/componentes/ui/separator";
import { FileText, Download, Send, ArrowRight, CheckCircle, Clock } from "lucide-react";
import { downloadOrderPDF, type OrderData } from "@/lib/pdf-generator";
import { toast } from "sonner";

interface ProductItem {
  id: string;
  productId: number;
  productName: string;
  quantity: number;
  codigo: string;
  material: string;
  discriminacaoProduto: string;
  largura: string;
  altura: string;
  lateral: string;
  cores: string;
  laminadoBrilho: boolean;
  laminadoFosco: boolean;
  vernizIE: boolean;
  autoMatizada: boolean;
  furosPresente: 'sim' | 'nao' | '';
  refile: string;
  cordaoBranco: boolean;
  cordaoPreto: boolean;
  cordaoBege: boolean;
  cordao: string;
  gorgurinho35cm: boolean;
  gorgurao35cm: boolean;
  sFrancisco35cm: boolean;
  ilhos: boolean;
  hotStampSacola: boolean;
  hotStampEtiqueta: boolean;
  outros: string;
  observacoes: string;
  unitPrice: number;
}

interface OrderApprovalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderData: OrderData;
  onConfirm: () => Promise<void>;
  loading: boolean;
}

export const OrderApprovalModal = ({
  open,
  onOpenChange,
  orderData,
  onConfirm,
  loading
}: OrderApprovalModalProps) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      downloadOrderPDF(orderData);
      toast.success("PDF baixado com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleConfirmSend = async () => {
    await onConfirm();
  };

  const calculateTotal = () => {
    if (!orderData?.produtos || !Array.isArray(orderData.produtos)) {
      return 0;
    }
    return orderData.produtos.reduce((sum: number, item: ProductItem) => {
      const quantity = item?.quantity || 0;
      const price = item?.unitPrice || 0;
      return sum + (quantity * price);
    }, 0);
  };

  const getAcabamentos = (produto: ProductItem) => {
    const acabamentos = [];
    if (produto.laminadoBrilho) acabamentos.push('Laminado Brilho');
    if (produto.laminadoFosco) acabamentos.push('Laminado Fosco');
    if (produto.vernizIE) acabamentos.push('Verniz I.E.');
    if (produto.autoMatizada) acabamentos.push('Auto-Matizada');
    return acabamentos;
  };

  const getAcabamentosEspeciais = (produto: ProductItem) => {
    const especiais = [];
    if (produto.cordaoBranco) especiais.push('Cordão Branco');
    if (produto.cordaoPreto) especiais.push('Cordão Preto');
    if (produto.cordaoBege) especiais.push('Cordão Bege');
    if (produto.cordao) especiais.push(`Cordão: ${produto.cordao}`);
    if (produto.gorgurinho35cm) especiais.push('Gorgurinho 35cm');
    if (produto.gorgurao35cm) especiais.push('Gorgurão 35cm');
    if (produto.sFrancisco35cm) especiais.push('S. Francisco 35cm');
    if (produto.ilhos) especiais.push('Ilhós');
    if (produto.hotStampSacola) especiais.push('Hot Stamp (Sacola)');
    if (produto.hotStampEtiqueta) especiais.push('Hot Stamp (Etiqueta)');
    if (produto.outros) especiais.push(`Outros: ${produto.outros}`);
    return especiais;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Aprovação do Pedido
          </DialogTitle>
          <DialogDescription>
            Revise os dados do pedido e gere o PDF para enviar ao cliente para aprovação
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Fluxo de Aprovação */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Processo de Aprovação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm">1. Pedido Criado</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <span className="text-sm">2. Aguardando Aprovação</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">3. Aprovado pelo Cliente</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <div className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">4. Enviado para Produção</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumo do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dados do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium">Nome Fantasia:</span>
                  <p className="text-sm text-muted-foreground">{orderData.nomeFantasia}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Razão Social:</span>
                  <p className="text-sm text-muted-foreground">{orderData.razaoSocial}</p>
                </div>
                {orderData.cpfCnpj && (
                  <div>
                    <span className="text-sm font-medium">CPF/CNPJ:</span>
                    <p className="text-sm text-muted-foreground">{orderData.cpfCnpj}</p>
                  </div>
                )}
                {orderData.representante && (
                  <div>
                    <span className="text-sm font-medium">Representante:</span>
                    <p className="text-sm text-muted-foreground">{orderData.representante}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resumo dos Produtos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Produtos do Pedido ({orderData?.produtos?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {orderData?.produtos?.map((produto: ProductItem, index: number) => (
                <div key={produto.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{index + 1}. {produto.productName}</h4>
                      {produto.codigo && (
                        <p className="text-sm text-muted-foreground">Código: {produto.codigo}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">R$ {(produto.quantity * produto.unitPrice).toFixed(2).replace('.', ',')}</p>
                      <p className="text-sm text-muted-foreground">
                        {produto.quantity}x R$ {produto.unitPrice.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>

                  {(produto.material || produto.discriminacaoProduto) && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {produto.material && (
                        <div>
                          <span className="font-medium">Material:</span> {produto.material}
                        </div>
                      )}
                      {produto.discriminacaoProduto && (
                        <div>
                          <span className="font-medium">Discriminação:</span> {produto.discriminacaoProduto}
                        </div>
                      )}
                    </div>
                  )}

                  {(produto.largura || produto.altura || produto.lateral || produto.cores) && (
                    <div className="grid grid-cols-4 gap-2 text-sm">
                      {produto.largura && <div><span className="font-medium">Largura:</span> {produto.largura}</div>}
                      {produto.altura && <div><span className="font-medium">Altura:</span> {produto.altura}</div>}
                      {produto.lateral && <div><span className="font-medium">Lateral:</span> {produto.lateral}</div>}
                      {produto.cores && <div><span className="font-medium">Cores:</span> {produto.cores}</div>}
                    </div>
                  )}

                  {getAcabamentos(produto).length > 0 && (
                    <div>
                      <span className="text-sm font-medium">Acabamentos:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {getAcabamentos(produto).map((acabamento) => (
                          <Badge key={acabamento} variant="secondary" className="text-xs">
                            {acabamento}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {produto.furosPresente && (
                    <div className="text-sm">
                      <span className="font-medium">Furos p/ Presente:</span> {produto.furosPresente === 'sim' ? 'Sim' : 'Não'}
                    </div>
                  )}

                  {produto.refile && (
                    <div className="text-sm">
                      <span className="font-medium">Refile:</span> {produto.refile}
                    </div>
                  )}

                  {getAcabamentosEspeciais(produto).length > 0 && (
                    <div>
                      <span className="text-sm font-medium">Acabamentos Especiais:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {getAcabamentosEspeciais(produto).map((especial) => (
                          <Badge key={especial} variant="outline" className="text-xs">
                            {especial}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {produto.observacoes && (
                    <div className="text-sm">
                      <span className="font-medium">Observações:</span>
                      <p className="text-muted-foreground mt-1">{produto.observacoes}</p>
                    </div>
                  )}
                </div>
              )) || <p className="text-muted-foreground">Nenhum produto encontrado</p>}
            </CardContent>
          </Card>

          {/* Total */}
          <Card className="bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <span className="text-xl font-semibold">Total Geral:</span>
                <span className="text-3xl font-bold text-primary">
                  R$ {calculateTotal().toFixed(2).replace('.', ',')}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Próximos Passos
          </h4>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Baixe o PDF com a proposta detalhada</li>
            <li>Envie o PDF para o cliente por e-mail ou WhatsApp</li>
            <li>Aguarde a aprovação do cliente</li>
            <li>Após aprovação, confirme o envio do pedido para produção</li>
          </ol>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Voltar para Edição
          </Button>
          <Button
            variant="secondary"
            onClick={handleDownloadPDF}
            disabled={isDownloading}
          >
            <Download className="w-4 h-4 mr-2" />
            {isDownloading ? "Gerando..." : "Baixar PDF"}
          </Button>
          <Button
            onClick={handleConfirmSend}
            disabled={loading}
          >
            <Send className="w-4 h-4 mr-2" />
            {loading ? "Enviando..." : "Confirmar Envio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};