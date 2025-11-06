import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/componentes/ui/card";
import { Button } from "@/componentes/ui/button";
import { Input } from "@/componentes/ui/input";
import { Label } from "@/componentes/ui/label";
import { Textarea } from "@/componentes/ui/textarea";
import { ArrowLeft, Save, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/componentes/ui/select";

const NewOrder = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      toast.success("Pedido criado com sucesso!");
      navigate("/orders");
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/orders")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Novo Pedido</h1>
          <p className="text-muted-foreground mt-1">Crie um novo pedido para seu cliente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Informações do Cliente</CardTitle>
            <CardDescription>Dados básicos do cliente para o pedido</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Cliente</Label>
                <Input id="customer" placeholder="Nome ou CNPJ do cliente" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">Contato</Label>
                <Input id="contact" placeholder="Nome do contato" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="email@empresa.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" placeholder="(11) 99999-9999" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Detalhes do Produto</CardTitle>
            <CardDescription>Selecione o produto e especificações</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product">Produto</Label>
                <Select required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pasta-basica">Pasta Básica</SelectItem>
                    <SelectItem value="pasta-premium">Pasta Premium</SelectItem>
                    <SelectItem value="envelope-a4">Envelope A4</SelectItem>
                    <SelectItem value="bloco-personalizado">Bloco Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade</Label>
                <Input id="quantity" type="number" placeholder="1000" min="1" required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">Cor</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a cor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="azul">Azul</SelectItem>
                    <SelectItem value="verde">Verde</SelectItem>
                    <SelectItem value="vermelho">Vermelho</SelectItem>
                    <SelectItem value="preto">Preto</SelectItem>
                    <SelectItem value="personalizado">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="printing">Impressão</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de impressão" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="offset">Offset</SelectItem>
                    <SelectItem value="digital">Digital</SelectItem>
                    <SelectItem value="serigrafia">Serigrafia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="finishing">Acabamento</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de acabamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fosco">Fosco</SelectItem>
                    <SelectItem value="brilho">Brilho</SelectItem>
                    <SelectItem value="verniz">Verniz UV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="observations">Observações</Label>
              <Textarea
                id="observations"
                placeholder="Detalhes adicionais sobre o pedido..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Valores</CardTitle>
            <CardDescription>Informações de preço e pagamento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Preço Unitário</Label>
                <Input id="unitPrice" placeholder="R$ 0,00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount">Desconto (%)</Label>
                <Input id="discount" type="number" placeholder="0" min="0" max="100" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total">Total</Label>
                <Input id="total" placeholder="R$ 0,00" disabled className="bg-muted" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate("/orders")}>
            Cancelar
          </Button>
          <Button type="submit" variant="outline" disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            Salvar Rascunho
          </Button>
          <Button type="submit" disabled={loading}>
            <Send className="w-4 h-4 mr-2" />
            {loading ? "Criando..." : "Criar Pedido"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewOrder;
