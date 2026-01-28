import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/componentes/ui/button";
import { Input } from "@/componentes/ui/input";
import { Label } from "@/componentes/ui/label";
import { Card, CardContent, CardDescription, CardHeader } from "@/componentes/ui/card";
import { toast } from "sonner";
import { Package, RefreshCw } from "lucide-react";
import { login, triggerSync } from "@/lib/api"; // Importar a função de login e sync da API

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { accessToken, user } = await login({ username, password });

      // Armazenar o token e os dados do usuário
      localStorage.setItem('authToken', accessToken);
      localStorage.setItem('user', JSON.stringify(user));

      // Armazenar timestamp de expiração (12 horas a partir de agora)
      const expirationTime = new Date().getTime() + (12 * 60 * 60 * 1000);
      localStorage.setItem('tokenExpiration', expirationTime.toString());

      toast.success("Login realizado com sucesso!");

      // Disparar sync completo em background para atualizar cache de produtos
      // Usando forceFullSync para garantir que todos os produtos tenham o campo 'type'
      triggerSync({ syncType: 'products', forceFullSync: true })
        .then((result) => {
          console.log('✅ Sync completo iniciado:', result);
          toast.info('Sincronização de produtos iniciada em background.');
        })
        .catch((error) => {
          console.warn('⚠️ Falha ao iniciar sync:', error);
          // Não mostrar erro ao usuário, pois o sync é opcional
        });

      // Forçar um recarregamento da página para que a lógica de rotas em app.tsx seja reavaliada
      window.location.href = '/cotacoes/nova';

    } catch (error) {
      console.error("Erro de login:", error);
      toast.error("Falha no login. Verifique suas credenciais.");
    } finally {
      setLoading(false);
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
                className="h-11"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
