import { useState } from "react";
import { Pencil, Check } from "lucide-react";

interface IncomeEditorProps {
  income: number;
  onSetIncome: (income: number) => void;
}

export default function IncomeEditor({ income, onSetIncome }: IncomeEditorProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(income));

  const handleSave = () => {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed >= 0) {
      onSetIncome(parsed);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          autoFocus
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          className="bg-secondary rounded-lg px-3 py-1.5 text-sm text-foreground w-28 outline-none focus:ring-1 focus:ring-primary"
        />
        <button onClick={handleSave} className="p-1.5 rounded-lg bg-success text-success-foreground">
          <Check size={14} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => { setValue(String(income)); setEditing(true); }}
      className="flex items-center gap-1.5 text-muted-foreground text-xs hover:text-foreground transition-colors"
    >
      <Pencil size={12} />
      Editar ingresos
    </button>
  );
}
