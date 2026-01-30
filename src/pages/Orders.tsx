import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/componentes/ui/card";
import { Button } from "@/componentes/ui/button";
import { Input } from "@/componentes/ui/input";
import { Badge } from "@/componentes/ui/badge";
import { Plus, Search, Loader2, User, FileText, Package, Filter } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/componentes/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/componentes/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { isAdmin } from "@/lib/auth";
import { listQuotes, QuoteWithViews } from "@/lib/quotes";

const quoteStatusConfig = {
  "draft": { label: "Rascunho", color: "bg-gray-500" },
  "sent": { label: "Pendente Assinatura", color: "bg-yellow-500" },
  "approved": { label: "Assinado", color: "bg-green-500" },
  "rejected": { label: "Recusado", color: "bg-red-500" },
  "converted": { label: "Convertido", color: "bg-blue-500" },
};

const Orders = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [quoteStatusFilter, setQuoteStatusFilter] = useState("all");
  const [quotes, setQuotes] = useState<QuoteWithViews[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(true);
  const [quotesError, setQuotesError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "quotes");

  // Update tab when URL parameter changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'quotes' || tab === 'orders') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        console.log('🔄 Buscando cotações...');
        const data = await listQuotes();
        console.log('✅ Cotações recebidas:', data);
        setQuotes(data);
        setQuotesError(null);
      } catch (error: any) {
        console.error('❌ Erro ao carregar cotações:', error);
        setQuotesError(error?.response?.data?.message || error?.message || 'Erro ao carregar cotações');
      } finally {
        setQuotesLoading(false);
      }
    };
    fetchQuotes();
  }, []);

  const filteredApprovedQuotes = quotes.filter(quote => {
    const matchesSearch = quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && quote.status === 'approved';
  });

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = quoteStatusFilter === "all" || quote.status === quoteStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cotações e Pedidos</h1>
          <p className="text-muted-foreground mt-1">Gerencie cotações e pedidos assinados</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => navigate("/cotacoes/nova")}
            className="gap-2 shadow-primary"
            size="lg"
          >
            <Plus className="w-5 h-5" />
            Nova Cotação
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="quotes" className="gap-2">
            <FileText className="w-4 h-4" />
            Cotações ({quotes.length})
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <Package className="w-4 h-4" />
            Pedidos ({filteredApprovedQuotes.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab de Pedidos (Agora mostra cotações aprovadas) */}
        <TabsContent value="orders" className="space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    placeholder="Buscar por número ou cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {quotesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : quotesError ? (
                <div className="text-center py-12">
                  <p className="text-destructive font-semibold">Erro ao carregar pedidos</p>
                  <p className="text-sm text-muted-foreground mt-2">{quotesError}</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => window.location.reload()}
                  >
                    Tentar novamente
                  </Button>
                </div>
              ) : filteredApprovedQuotes.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Nenhuma cotação aprovada encontrada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredApprovedQuotes.map((quote) => (
                    <div
                      key={quote.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-accent/50 hover:bg-accent transition-all cursor-pointer border border-transparent hover:border-primary/20"
                      onClick={() => navigate(`/quotes/${quote.id}`)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold text-foreground text-xl">{quote.customerName}</p>
                          <Badge className="bg-green-500">
                            Assinado
                          </Badge>
                          {isAdmin() && quote.createdByName && (
                            <Badge variant="outline" className="gap-1">
                              <User className="w-3 h-3" />
                              {quote.createdByName}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground opacity-70">Cotação: {quote.quoteNumber}</p>
                        <p className="text-xs text-muted-foreground mt-1">{quote.products.length} produto(s)</p>
                        <p className="text-sm text-primary font-semibold mt-1">
                          Total: R$ {quote.totalPrice.toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{format(new Date(quote.createdAt), "dd/MM/yyyy", { locale: ptBR })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Cotações */}
        <TabsContent value="quotes" className="space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    placeholder="Buscar por número ou cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={quoteStatusFilter} onValueChange={setQuoteStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="sent">Pendente Assinatura</SelectItem>
                    <SelectItem value="approved">Assinado</SelectItem>
                    <SelectItem value="rejected">Recusado</SelectItem>
                    <SelectItem value="converted">Convertido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {quotesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : quotesError ? (
                <div className="text-center py-12">
                  <p className="text-destructive font-semibold">Erro ao carregar cotações</p>
                  <p className="text-sm text-muted-foreground mt-2">{quotesError}</p>
                  <Button 
                    variant="outline" 
                    className="mt-4" 
                    onClick={() => window.location.reload()}
                  >
                    Tentar novamente
                  </Button>
                </div>
              ) : filteredQuotes.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Nenhuma cotação encontrada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredQuotes.map((quote) => (
                    <div
                      key={quote.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-accent/50 hover:bg-accent transition-all cursor-pointer border border-transparent hover:border-primary/20"
                      onClick={() => navigate(`/quotes/${quote.id}`)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold text-foreground text-xl">{quote.customerName}</p>
                          <Badge className={quoteStatusConfig[quote.status as keyof typeof quoteStatusConfig].color}>
                            {quoteStatusConfig[quote.status as keyof typeof quoteStatusConfig].label}
                          </Badge>
                          {quote.viewCount > 0 && (
                            <Badge variant="outline" className="gap-1">
                              {quote.viewCount} visualizaç{quote.viewCount === 1 ? 'ão' : 'ões'}
                            </Badge>
                          )}
                          {isAdmin() && quote.createdByName && (
                            <Badge variant="outline" className="gap-1">
                              <User className="w-3 h-3" />
                              {quote.createdByName}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground opacity-70">Cotação: {quote.quoteNumber}</p>
                        <p className="text-xs text-muted-foreground mt-1">{quote.products.length} produto(s)</p>
                        <p className="text-sm text-primary font-semibold mt-1">
                          Total: R$ {quote.totalPrice.toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{format(new Date(quote.createdAt), "dd/MM/yyyy", { locale: ptBR })}</p>
                        {quote.expiresAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Expira: {format(new Date(quote.expiresAt), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Orders;
