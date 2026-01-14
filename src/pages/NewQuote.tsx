// NewQuote - Página principal do wizard de cotação
import { useQuoteWizard } from './NewQuote/hooks/useQuoteWizard';
import { QuickCustomerStep } from './NewQuote/components/QuickCustomerStep';
import { QuickProductsStep } from './NewQuote/components/QuickProductsStep';
import { QuoteSummaryStep } from './NewQuote/components/QuoteSummaryStep';
import { Card, CardContent } from '@/componentes/ui/card';
import { Button } from '@/componentes/ui/button';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NewQuote() {
  const navigate = useNavigate();
  const wizard = useQuoteWizard();

  const handleSuccess = () => {
    wizard.clearForm();
    navigate('/cotacoes');
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Conteúdo com scroll */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto py-6 px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Nova Cotação</h1>
            <p className="text-muted-foreground mt-2">
              Crie uma cotação rápida para enviar ao cliente
            </p>
          </div>

          {/* Progress Indicator */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                {/* Step 1 */}
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-colors ${
                      wizard.currentStep === 1
                        ? 'bg-primary text-primary-foreground'
                        : wizard.currentStep > 1
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    1
                  </div>
                  <div className="hidden sm:block">
                    <p className="font-medium text-sm">Cliente</p>
                    <p className="text-xs text-muted-foreground">Nome e contato</p>
                  </div>
                </div>

                {/* Divider */}
                <div className="flex-1 h-px bg-border mx-2" />

                {/* Step 2 */}
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-colors ${
                      wizard.currentStep === 2
                        ? 'bg-primary text-primary-foreground'
                        : wizard.currentStep > 2
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    2
                  </div>
                  <div className="hidden sm:block">
                    <p className="font-medium text-sm">Produtos</p>
                    <p className="text-xs text-muted-foreground">Itens e quantidades</p>
                  </div>
                </div>

                {/* Divider */}
                <div className="flex-1 h-px bg-border mx-2" />

                {/* Step 3 */}
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-colors ${
                      wizard.currentStep === 3
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    3
                  </div>
                  <div className="hidden sm:block">
                    <p className="font-medium text-sm">Resumo</p>
                    <p className="text-xs text-muted-foreground">Revisar e enviar</p>
                  </div>
                </div>
              </div>

              {/* Mobile Step Labels */}
              <div className="sm:hidden mt-4 text-center">
                <p className="text-sm font-medium">
                  {wizard.currentStep === 1 && 'Etapa 1: Informações do Cliente'}
                  {wizard.currentStep === 2 && 'Etapa 2: Seleção de Produtos'}
                  {wizard.currentStep === 3 && 'Etapa 3: Resumo e Envio'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Step Content */}
          <div className="animate-in fade-in-50 duration-300">
            {wizard.currentStep === 1 && (
              <QuickCustomerStep
                customerData={wizard.formData.customer}
                onUpdate={wizard.updateCustomer}
                isValid={wizard.isStep1Valid()}
              />
            )}

            {wizard.currentStep === 2 && (
              <QuickProductsStep
                products={wizard.formData.products}
                onAddProduct={wizard.addProduct}
                onUpdateProduct={wizard.updateProduct}
                onRemoveProduct={wizard.removeProduct}
                isValid={wizard.isStep2Valid()}
              />
            )}

            {wizard.currentStep === 3 && (
              <QuoteSummaryStep
                customerData={wizard.formData.customer}
                products={wizard.formData.products}
                notes={wizard.formData.notes}
                onUpdateNotes={wizard.updateNotes}
                onSuccess={handleSuccess}
              />
            )}
          </div>

          {/* Navigation Buttons (inline no conteúdo) */}
          <div className="mt-8 space-y-4">
            {wizard.currentStep < 3 && (
              <Button
                size="lg"
                onClick={wizard.nextStep}
                disabled={wizard.currentStep === 1 ? !wizard.isStep1Valid() : !wizard.isStep2Valid()}
                className="w-full h-14 text-lg font-semibold touch-manipulation"
              >
                {wizard.currentStep === 1 ? 'Próximo: Selecionar Produtos' : 'Próximo: Resumo'}
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            )}
            
            {wizard.currentStep > 1 && (
              <Button
                variant="outline"
                size="lg"
                onClick={wizard.prevStep}
                className="w-full h-12 touch-manipulation"
              >
                Voltar
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
