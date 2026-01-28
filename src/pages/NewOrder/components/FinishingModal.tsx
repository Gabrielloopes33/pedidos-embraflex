import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/componentes/ui/dialog";
import { Button } from "@/componentes/ui/button";
import { ProductFinishing } from "./ProductFinishing";
import type { ProductItem } from "../types";
import { useState, useEffect } from "react";

interface FinishingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductItem;
  onSave: (finishing: ProductItem['finishing']) => void;
}

export function FinishingModal({ open, onOpenChange, product, onSave }: FinishingModalProps) {
  const [currentFinishing, setCurrentFinishing] = useState<ProductItem['finishing']>(product.finishing);

  // Sincronizar quando o produto muda
  useEffect(() => {
    setCurrentFinishing(product.finishing);
  }, [product.finishing]);

  const handleUpdate = <K extends keyof ProductItem>(field: K, value: ProductItem[K]) => {
    if (field === 'finishing') {
      setCurrentFinishing(value as ProductItem['finishing']);
    }
  };

  const handleConfirm = () => {
    onSave(currentFinishing);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configurar Acabamentos</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <ProductFinishing item={{ ...product, finishing: currentFinishing }} onUpdate={handleUpdate} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            Confirmar Acabamentos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}