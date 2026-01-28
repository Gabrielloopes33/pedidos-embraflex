import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/componentes/ui/card";
import { Label } from "@/componentes/ui/label";
import { Input } from "@/componentes/ui/input";
import { Button } from "@/componentes/ui/button";
import { Switch } from "@/componentes/ui/switch";
import { RefreshCw, Database, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { triggerSync, getCacheStats, getSyncStatus } from "@/lib/api";

const Settings = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [cacheStats, setCacheStats] = useState<{
    products: { total: number; active: number; lastSync: string | null };
    customers: { total: number; active: number; lastSync: string | null };
  } | null>(null);
  const [lastSyncStatus, setLastSyncStatus] = useState<{
    status: string;
    items_processed: number;
    started_at: string;
  } | null>(null);

  // Carregar estatísticas ao montar
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [stats, syncStatus] = await Promise.all([
        getCacheStats(),
        getSyncStatus('products'),
      ]);
      setCacheStats(stats);
      if (syncStatus.lastSync) {
        setLastSyncStatus(syncStatus.lastSync);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleSync = async (forceFullSync: boolean = false) => {
    setIsSyncing(true);
    try {
      await triggerSync({ syncType: 'products', forceFullSync });
      toast.success('Sincronização iniciada em background!');

      // Aguardar um pouco e recarregar stats
      setTimeout(() => {
        loadStats();
        setIsSyncing(false);
      }, 3000);
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      toast.error('Erro ao iniciar sincronização');
      setIsSyncing(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Nunca';
    return new Date(dateStr).toLocaleString('pt-BR');
  };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie suas preferências</p>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>Informações da sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" placeholder="Seu nome" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="seu@email.com" />
          </div>
          <Button>Salvar Alterações</Button>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Notificações</CardTitle>
          <CardDescription>Configure como deseja receber notificações</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notificações por Email</p>
              <p className="text-sm text-muted-foreground">Receba atualizações por email</p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Alertas de Pedidos</p>
              <p className="text-sm text-muted-foreground">Notificações de mudança de status</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Sincronização WooCommerce
          </CardTitle>
          <CardDescription>Gerencie o cache de produtos e clientes do WooCommerce</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Estatísticas do Cache */}
          {cacheStats && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Produtos no Cache</p>
                <p className="text-2xl font-bold">{cacheStats.products.active}</p>
                <p className="text-xs text-muted-foreground">
                  Última sync: {formatDate(cacheStats.products.lastSync)}
                </p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Clientes no Cache</p>
                <p className="text-2xl font-bold">{cacheStats.customers.active}</p>
                <p className="text-xs text-muted-foreground">
                  Última sync: {formatDate(cacheStats.customers.lastSync)}
                </p>
              </div>
            </div>
          )}

          {/* Status do último sync */}
          {lastSyncStatus && (
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              {lastSyncStatus.status === 'completed' ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : lastSyncStatus.status === 'running' ? (
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {lastSyncStatus.status === 'completed' ? 'Sincronização concluída' :
                   lastSyncStatus.status === 'running' ? 'Sincronizando...' : 'Falha na sincronização'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {lastSyncStatus.items_processed} itens processados em {formatDate(lastSyncStatus.started_at)}
                </p>
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex gap-2">
            <Button
              onClick={() => handleSync(false)}
              disabled={isSyncing}
              variant="outline"
              className="flex-1"
            >
              {isSyncing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Sync Incremental
            </Button>
            <Button
              onClick={() => handleSync(true)}
              disabled={isSyncing}
              className="flex-1"
            >
              {isSyncing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Sync Completo
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            <strong>Sync Incremental:</strong> Atualiza apenas produtos modificados desde o último sync.
            <br />
            <strong>Sync Completo:</strong> Re-sincroniza todos os produtos. Use após mudanças estruturais.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
