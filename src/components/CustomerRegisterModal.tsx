
"use client";

import { useState } from "react";
import { User, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCustomer } from "@/context/CustomerContext";
import { PHONE_COUNTRIES } from "@/data/phone-countries";
import type { CustomerFormData } from "@/types/customer";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

const INITIAL: CustomerFormData = {
  full_name: "",
  phone_country_code: "+55",
  phone_number: "",
};

export function CustomerRegisterModal({ open, onClose }: Props) {
  const { saveCustomer, loading } = useCustomer();
  const [form, setForm] = useState<CustomerFormData>(INITIAL);

  const set = (field: keyof CustomerFormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) { toast.error("Nome é obrigatório"); return; }
    if (!form.phone_number.trim()) { toast.error("Celular é obrigatório"); return; }
    const { error } = await saveCustomer(form);
    if (error) { toast.error(`Erro ao salvar: ${error}`); return; }
    toast.success("Cadastro realizado com sucesso!");
    setForm(INITIAL);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" /> Seus Dados
          </DialogTitle>
          <DialogDescription>
            Informe seu nome e celular para continuar com a compra.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Nome completo *</Label>
            <Input
              id="full_name"
              placeholder="Seu nome completo"
              value={form.full_name}
              onChange={(e) => set("full_name", e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" /> Celular *
            </Label>
            <div className="flex gap-2">
              <Select
                value={form.phone_country_code}
                onValueChange={(v) => set("phone_country_code", v)}
              >
                <SelectTrigger className="w-40 shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PHONE_COUNTRIES.map((c) => (
                    <SelectItem key={`${c.code}-${c.name}`} value={c.code}>
                      {c.flag} {c.code} — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Número do celular"
                value={form.phone_number}
                onChange={(e) => set("phone_number", e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Salvando..." : "Confirmar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
