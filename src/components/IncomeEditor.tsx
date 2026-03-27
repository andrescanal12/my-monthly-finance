import { useState } from "react";
import { Pencil, Check } from "lucide-react";
import { motion } from "framer-motion";

interface IncomeEditorProps {
  income: number;
  onSetIncome: (income: number) => void;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}

export default function IncomeEditor({ income, onSetIncome }: IncomeEditorProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(income));

  const handleSave = () => {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed >= 0) onSetIncome(parsed);
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
          className="bg-foreground/[0.05] rounded-xl px-3 py-2 text-sm text-foreground w-28 outline-none focus:ring-1 focus:ring-foreground/20"
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleSave}
          className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center"
        >
          <Check size={14} />
        </motion.button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <span className="text-2xl font-semibold tracking-[-1px] text-foreground">{formatCurrency(income)}</span>
      <button
        onClick={() => { setValue(String(income)); setEditing(true); }}
        className="flex items-center gap-1.5 text-muted-foreground text-[11px] hover:text-foreground transition-colors uppercase tracking-[1px]"
      >
        <Pencil size={10} />
        Editar
      </button>
    </div>
  );
}
