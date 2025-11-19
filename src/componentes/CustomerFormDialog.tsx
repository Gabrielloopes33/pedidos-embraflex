import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/componentes/ui/dialog";
import { Button } from "@/componentes/ui/button";
import { Input } from "@/componentes/ui/input";
import { Label } from "@/componentes/ui/label";
import { Loader2 } from "lucide-react";
import { createCustomer } from "@/lib/customers";
import type { CustomerCreateData, WooCommerceCustomer } from "@/lib/types";
import { toast } from "sonner";

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (customer: WooCommerceCustomer) => void;
}

export function CustomerFormDialog({ open, onOpenChange, onSuccess }: CustomerFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nomeFantasia: "",
    razaoSocial: "",
    email: "",
    phone: "",
    cpfCnpj: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nomeFantasia || !formData.razaoSocial || !formData.email) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setLoading(true);

    try {
      const customerData: CustomerCreateData = {
        email: formData.email,
        first_name: formData.nomeFantasia,
        last_name: "",
        username: formData.email.split('@')[0],
        billing: {
          first_name: formData.nomeFantasia,
          last_name: "",
          company: formData.razaoSocial,
          email: formData.email,
          phone: formData.phone,
          country: "BR",
        },
        meta_data: [
          { key: "_billing_cpf_cnpj", value: formData.cpfCnpj },
          { key: "_nome_fantasia", value: formData.nomeFantasia },
          { key: "_razao_social", value: formData.razaoSocial },
        ],
      };

      const newCustomer = await createCustomer(customerData);

      toast.success("Cliente criado com sucesso!");

      if (onSuccess) {
        onSuccess(newCustomer);
      }

      // Limpar formulário
      setFormData({
        nomeFantasia: "",
        razaoSocial: "",
        email: "",
        phone: "",
        cpfCnpj: "",
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao criar cliente:", error);

      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          toast.error(`Erro: ${axiosError.response.data.message}`);
        } else {
          toast.error("Erro ao criar cliente. Verifique os dados e tente novamente.");
        }
      } else {
        toast.error("Erro ao criar cliente. Verifique os dados e tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Novo Cliente</DialogTitle>
          <DialogDescription>
            Cadastre um novo cliente no sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nomeFantasia">Nome Fantasia *</Label>
            <Input
              id="nomeFantasia"
              value={formData.nomeFantasia}
              onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })}
              placeholder="Nome fantasia do cliente"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="razaoSocial">Razão Social *</Label>
            <Input
              id="razaoSocial"
              value={formData.razaoSocial}
              onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
              placeholder="Razão social completa"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@empresa.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
            <Input
              id="cpfCnpj"
              value={formData.cpfCnpj}
              onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
              placeholder="00.000.000/0000-00"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? "Criando..." : "Criar Cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
