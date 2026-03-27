import { useState } from "react";
import { Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AddExpenseFormProps {
  onAdd: (name: string, amount: number) => void;
}

export default function AddExpenseForm({ onAdd }: AddExpenseFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount) return;
    onAdd(name.trim(), parseFloat(amount));
    setName("");
    setAmount("");
    setOpen(false);
  };

  return (
    <div>
      <AnimatePresence>
        {open && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="liquid-glass rounded-xl p-4 flex flex-col gap-3 mb-3 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Nuevo gasto</span>
              <button type="button" onClick={() => setOpen(false)} className="text-muted-foreground">
                <X size={18} />
              </button>
            </div>
            <input
              placeholder="Nombre del gasto"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-secondary rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              type="number"
              placeholder="Cantidad (€)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              min="0"
              className="bg-secondary rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              className="bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Añadir gasto
            </button>
          </motion.form>
        )}
      </AnimatePresence>
      {!open && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setOpen(true)}
          className="w-full liquid-glass rounded-xl p-3 flex items-center justify-center gap-2 text-sm font-medium text-primary"
        >
          <Plus size={18} />
          Añadir gasto extra
        </motion.button>
      )}
    </div>
  );
}
