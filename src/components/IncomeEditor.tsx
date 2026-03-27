import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

  const handleCancel = () => {
    setValue(String(income));
    setEditing(false);
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {editing ? (
        <motion.div
          key="edit"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-2"
        >
          <input
            autoFocus
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className="liquid-glass-strong rounded-xl px-4 py-2 text-sm font-semibold text-foreground w-28 outline-none focus:ring-1 focus:ring-foreground/30 transition-all text-right placeholder:text-muted-foreground/30"
          />
          <div className="flex gap-1.5">
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleSave}
              className="w-[38px] h-[38px] rounded-xl bg-foreground text-background flex items-center justify-center hover:bg-foreground/90 transition-all shadow-lg"
            >
              <Check size={16} strokeWidth={3} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleCancel}
              className="w-[38px] h-[38px] rounded-xl bg-foreground/[0.08] text-foreground flex items-center justify-center hover:bg-foreground/[0.15] transition-all"
            >
              <X size={16} strokeWidth={2.5} />
            </motion.button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="view"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-end gap-0.5"
        >
          <span className="text-2xl font-semibold tracking-[-1px] text-foreground leading-none">
            {formatCurrency(income)}
          </span>
          <button
            onClick={() => { setValue(String(income)); setEditing(true); }}
            className="flex items-center gap-1.5 text-muted-foreground text-[11px] hover:text-foreground transition-colors uppercase tracking-[1px] mt-1"
          >
            <Pencil size={10} />
            Editar
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
