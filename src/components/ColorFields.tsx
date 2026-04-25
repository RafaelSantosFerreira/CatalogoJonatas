
"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ColorEntry { color_name: string; hex_code: string }
interface ColorFieldsProps {
  colors: ColorEntry[];
  onChange: (colors: ColorEntry[]) => void;
}

export function ColorFields({ colors, onChange }: ColorFieldsProps) {
  const add = () => onChange([...colors, { color_name: "", hex_code: "#e63946" }]);
  const remove = (i: number) => onChange(colors.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof ColorEntry, value: string) =>
    onChange(colors.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Cores</Label>
        <Button type="button" variant="outline" size="sm" onClick={add} className="h-7 gap-1 text-xs">
          <Plus className="h-3 w-3" /> Adicionar
        </Button>
      </div>
      {colors.map((c, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="color"
            value={c.hex_code || "#e63946"}
            onChange={(e) => update(i, "hex_code", e.target.value)}
            className="h-8 w-8 cursor-pointer rounded border p-0.5"
          />
          <Input
            placeholder="Nome da cor (ex: Vermelho)"
            value={c.color_name}
            onChange={(e) => update(i, "color_name", e.target.value)}
            className="flex-1 h-8 text-sm"
          />
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => remove(i)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}
