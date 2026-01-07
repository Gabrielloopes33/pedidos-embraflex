import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/componentes/ui/dialog";
import { Button } from "@/componentes/ui/button";
import { Input } from "@/componentes/ui/input";
import { Label } from "@/componentes/ui/label";
import { Checkbox } from "@/componentes/ui/checkbox";
import { Card, CardContent } from "@/componentes/ui/card";
import { Alert, AlertDescription } from "@/componentes/ui/alert";
import { FileCheck, CheckCircle2, Smartphone, Mail } from "lucide-react";
import { toast } from "sonner";

interface OrderSignatureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignatureComplete: (signatureData: SignatureData) => void;
  orderData: any;
}

export interface SignatureData {
  customerName: string;
  customerEmail: string;
  customerCpfCnpj: string;
  termsAccepted: boolean;
  signatureDate: string;
  ipAddress?: string;
  signatureMethod: 'email' | 'sms';
}

export function OrderSignatureModal({
  open,
  onOpenChange,
  onSignatureComplete,
  orderData,
}: OrderSignatureModalProps) {
  const [step, setStep] = useState<'info' | 'signature' | 'complete'>('info');
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerCpfCnpj: '',
    customerPhone: '',
    termsAccepted: false,
  });
  const [loading, setLoading] = useState(false);
  const [signatureMethod, setSignatureMethod] = useState<'email' | 'sms'>('email');

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.customerName.trim()) {
      toast.error("Nome do cliente é obrigatório");
      return false;
    }
    if (!formData.customerEmail.trim() && signatureMethod === 'email') {
      toast.error("E-mail é obrigatório para este método");
      return false;
    }
    if (!formData.customerPhone.trim() && signatureMethod === 'sms') {
      toast.error("Telefone é obrigatório para este método");
      return false;
    }
    if (!formData.customerCpfCnpj.trim()) {
      toast.error("CPF/CNPJ é obrigatório");
      return false;
    }
    if (!formData.termsAccepted) {
      toast.error("É necessário aceitar os termos");
      return false;
    }
    return true;
  };

  const handleSendSignature = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Simular envio de link de assinatura
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success(`Link de assinatura enviado por ${signatureMethod === 'email' ? 'e-mail' : 'SMS'}!`);
      setStep('signature');
    } catch (error) {
      toast.error("Erro ao enviar link de assinatura");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSignature = async () => {
    setLoading(true);
    try {
      // Simular confirmação de assinatura
      await new Promise(resolve => setTimeout(resolve, 1500));

      const signatureData: SignatureData = {
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerCpfCnpj: formData.customerCpfCnpj,
        termsAccepted: formData.termsAccepted,
        signatureDate: new Date().toISOString(),
        signatureMethod,
      };

      onSignatureComplete(signatureData);
      setStep('complete');
      toast.success("Assinatura confirmada com sucesso!");
      
      // Fechar modal após 2 segundos
      setTimeout(() => {
        onOpenChange(false);
        // Reset
        setStep('info');
        setFormData({
          customerName: '',
          customerEmail: '',
          customerCpfCnpj: '',
          customerPhone: '',
          termsAccepted: false,
        });
      }, 2000);
    } catch (error) {
      toast.error("Erro ao confirmar assinatura");
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 'info':
        return (
          <div className="space-y-6">
            <Alert>
              <FileCheck className="h-4 w-4" />
              <AlertDescription>
                O cliente receberá um link seguro para assinar digitalmente este pedido.
                A assinatura digital tem validade jurídica de acordo com a MP 2.200-2/2001.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <Label htmlFor="customerName">Nome Completo do Cliente *</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  placeholder="Nome completo"
                />
              </div>

              <div>
                <Label htmlFor="customerCpfCnpj">CPF/CNPJ *</Label>
                <Input
                  id="customerCpfCnpj"
                  value={formData.customerCpfCnpj}
                  onChange={(e) => handleInputChange('customerCpfCnpj', e.target.value)}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                />
              </div>

              <div className="space-y-2">
                <Label>Método de Assinatura *</Label>
                <div className="flex gap-4">
                  <Card
                    className={`flex-1 cursor-pointer transition-all ${
                      signatureMethod === 'email' ? 'border-primary ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSignatureMethod('email')}
                  >
                    <CardContent className="pt-6 text-center">
                      <Mail className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <p className="font-medium">E-mail</p>
                    </CardContent>
                  </Card>
                  <Card
                    className={`flex-1 cursor-pointer transition-all ${
                      signatureMethod === 'sms' ? 'border-primary ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSignatureMethod('sms')}
                  >
                    <CardContent className="pt-6 text-center">
                      <Smartphone className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <p className="font-medium">SMS</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {signatureMethod === 'email' && (
                <div>
                  <Label htmlFor="customerEmail">E-mail do Cliente *</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                    placeholder="cliente@exemplo.com"
                  />
                </div>
              )}

              {signatureMethod === 'sms' && (
                <div>
                  <Label htmlFor="customerPhone">Telefone do Cliente *</Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              )}

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.termsAccepted}
                  onCheckedChange={(checked) => handleInputChange('termsAccepted', checked as boolean)}
                />
                <label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Aceito os termos e condições da proposta comercial e autorizo
                  o envio de link de assinatura digital
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSendSignature} disabled={loading}>
                {loading ? "Enviando..." : "Enviar Link de Assinatura"}
              </Button>
            </div>
          </div>
        );

      case 'signature':
        return (
          <div className="space-y-6">
            <Alert>
              <Smartphone className="h-4 w-4" />
              <AlertDescription>
                Link enviado para {signatureMethod === 'email' ? formData.customerEmail : formData.customerPhone}.
                Aguardando assinatura do cliente...
              </AlertDescription>
            </Alert>

            <Card className="border-dashed">
              <CardContent className="pt-6 text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <FileCheck className="w-8 h-8 text-primary animate-pulse" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Aguardando Assinatura</h3>
                  <p className="text-sm text-muted-foreground">
                    O cliente deve acessar o link e confirmar a assinatura digital.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setStep('info')}>
                Voltar
              </Button>
              <Button onClick={handleConfirmSignature} disabled={loading}>
                {loading ? "Confirmando..." : "Confirmar Assinatura (Demo)"}
              </Button>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Assinatura Confirmada!</h3>
              <p className="text-muted-foreground">
                O pedido foi assinado digitalmente e agora pode seguir para produção.
              </p>
            </div>
            <Alert>
              <AlertDescription className="text-left">
                <strong>Dados da Assinatura:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>Cliente: {formData.customerName}</li>
                  <li>CPF/CNPJ: {formData.customerCpfCnpj}</li>
                  <li>Data: {new Date().toLocaleString('pt-BR')}</li>
                  <li>Método: {signatureMethod === 'email' ? 'E-mail' : 'SMS'}</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'info' && 'Assinatura Digital do Pedido'}
            {step === 'signature' && 'Aguardando Assinatura'}
            {step === 'complete' && 'Assinatura Concluída'}
          </DialogTitle>
          <DialogDescription>
            {step === 'info' && 'Configure e envie o link de assinatura digital para o cliente'}
            {step === 'signature' && 'O cliente receberá um link seguro para assinar'}
            {step === 'complete' && 'Pedido assinado com validade jurídica'}
          </DialogDescription>
        </DialogHeader>
        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
}
