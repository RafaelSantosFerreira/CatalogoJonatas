
"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface VolumeEntry { volume_value: string; volume_unit: string }
interface VolumeFieldsProps {
  volumes: VolumeEntry[];
  onChange: (volumes: VolumeEntry[]) => void;
}

const UNITS = ["ml", "L", "cm³", "m³", "kg", "g", "mm", "cm", "m"];

export function VolumeFields({ volumes, onChange }: VolumeFieldsProps) {
  const add = () => onChange([...volumes, { volume_value: "", volume_unit: "ml" }]);
  const remove = (i: number) => onChange(volumes.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof VolumeEntry, value: string) =>
    onChange(volumes.map((v, idx) => (idx === i ? { ...v, [field]: value } : v)));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Volume / Capacidade</Label>
        <Button type="button" variant="outline" size="sm" onClick={add} className="h-7 gap-1 text-xs">
          <Plus className="h-3 w-3" /> Adicionar
        </Button>
      </div>
      {volumes.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Valor (ex: 500)"
            value={v.volume_value}
            onChange={(e) => update(i, "volume_value", e.target.value)}
            className="flex-1 h-8 text-sm"
          />
          <Select value={v.volume_unit} onValueChange={(val) => update(i, "volume_unit", val)}>
            <SelectTrigger className="w-20 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNITS.map((u) => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => remove(i)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}
