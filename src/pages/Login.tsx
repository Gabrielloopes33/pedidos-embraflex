import { useState } from "react";
import { Button } from "@/componentes/ui/button";
import { Input } from "@/componentes/ui/input";
import { Label } from "@/componentes/ui/label";
import { Card, CardContent, CardDescription, CardHeader } from "@/componentes/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { login } from "@/lib/api";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import { isBackendHealthy, warmupBackendWithRetry } from "@/lib/warmup";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [warming, setWarming] = useState(false);
  const [warmingAttempt, setWarmingAttempt] = useState(0);

  // Hook para gerenciar sync com polling automático
  const { startSync } = useSyncStatus();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Primeiro, verificar se o backend está saudável
      console.log('🔍 Verificando saúde do backend antes do login...');
      const isHealthy = await isBackendHealthy();

      if (!isHealthy) {
        console.log('⚠️ Backend não está saudável, iniciando warmup...');
        toast.loading("Aquecendo servidor...", { id: "warmup-toast" });
        setWarming(true);

        // Executar warmup com retries e informar progresso
        const warmupResult = await warmupBackendWithRetry(3, (attempt, maxRetries) => {
          setWarmingAttempt(attempt);
          console.log(`🔄 Warmup tentativa ${attempt}/${maxRetries}`);
        });

        toast.dismiss("warmup-toast");

        if (!warmupResult.success) {
          toast.error("Servidor demorou muito para responder. Tente novamente em instantes.");
          setWarming(false);
          setLoading(false);
          return;
        }

        toast.success("Servidor pronto!");
        setWarming(false);
      }

      // Backend está saudável, prosseguir com login
      console.log('✅ Backend saudável, prosseguindo com login...');
      const { accessToken, user } = await login({ username, password });

      // Armazenar o token e os dados do usuário
      localStorage.setItem('authToken', accessToken);
      localStorage.setItem('user', JSON.stringify(user));

      // Armazenar timestamp de expiração (12 horas a partir de agora)
      const expirationTime = new Date().getTime() + (12 * 60 * 60 * 1000);
      localStorage.setItem('tokenExpiration', expirationTime.toString());

      toast.success("Login realizado com sucesso!");

      // Disparar sync via hook (polling automático será gerenciado pelo hook)
      // Usando forceFullSync para garantir que todos os produtos tenham o campo 'type'
      startSync(true).catch((error) => {
        console.warn('⚠️ Falha ao iniciar sync:', error);
        // Não mostrar erro ao usuário, pois o sync é opcional
      });

      // Forçar um recarregamento da página para que a lógica de rotas em app.tsx seja reavaliada
      window.location.href = '/cotacoes/nova';

    } catch (error: any) {
      console.error("Erro de login:", error);
      
      if (error.message?.includes('timeout') || error.code === 'ECONNABORTED') {
        toast.error("Servidor demorou para responder. Tente novamente.");
      } else {
        toast.error("Falha no login. Verifique suas credenciais.");
      }
    } finally {
      setLoading(false);
      setWarming(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex flex-col items-center gap-3">
            <img 
              src="/Logo-Embraflex-002.png" 
              alt="Embraflex Logo" 
              className="h-20 w-auto object-contain"
            />
          </div>
          <div>
            <CardDescription className="text-base">
              Sistema de Pedidos Digital
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                type="text"
                placeholder="ex: admin ou vendedor1"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading || warming}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading || warming}
                className="h-11"
              />
            </div>
            
            {warming && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>
                  Aquecendo servidor... (tentativa {warmingAttempt}/3)
                </span>
              </div>
            )}
            
            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold"
              disabled={loading || warming}
            >
              {warming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Aquecendo servidor...
                </>
              ) : loading ? (
                "Entrando..."
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
