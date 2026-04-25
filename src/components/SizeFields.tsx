
"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SizeEntry { size_label: string; size_unit: string }
interface SizeFieldsProps {
  sizes: SizeEntry[];
  onChange: (sizes: SizeEntry[]) => void;
}

export function SizeFields({ sizes, onChange }: SizeFieldsProps) {
  const add = () => onChange([...sizes, { size_label: "", size_unit: "cm" }]);
  const remove = (i: number) => onChange(sizes.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof SizeEntry, value: string) =>
    onChange(sizes.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Tamanhos</Label>
        <Button type="button" variant="outline" size="sm" onClick={add} className="h-7 gap-1 text-xs">
          <Plus className="h-3 w-3" /> Adicionar
        </Button>
      </div>
      {sizes.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            placeholder="Tamanho (ex: 10, M, G)"
            value={s.size_label}
            onChange={(e) => update(i, "size_label", e.target.value)}
            className="flex-1 h-8 text-sm"
          />
          <Input
            placeholder="Unidade (ex: cm)"
            value={s.size_unit}
            onChange={(e) => update(i, "size_unit", e.target.value)}
            className="w-24 h-8 text-sm"
          />
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => remove(i)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}
