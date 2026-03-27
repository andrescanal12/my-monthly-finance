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
            className="liquid-glass-strong rounded-2xl p-5 flex flex-col gap-4 mb-3 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground tracking-[-0.3px]">
                Nuevo <span className="font-serif-accent text-base">gasto</span>
              </span>
              <button type="button" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={16} />
              </button>
            </div>
            <input
              placeholder="Nombre del gasto"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-foreground/[0.05] rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-foreground/20 transition-all"
            />
            <input
              type="number"
              placeholder="Cantidad (€)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              min="0"
              className="bg-foreground/[0.05] rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-foreground/20 transition-all"
            />
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              className="bg-foreground text-background rounded-xl py-3 text-sm font-semibold hover:bg-foreground/90 transition-colors"
            >
              Añadir gasto
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>
      {!open && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.01 }}
          onClick={() => setOpen(true)}
          className="w-full liquid-glass rounded-2xl p-4 flex items-center justify-center gap-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors duration-300"
        >
          <Plus size={16} />
          Añadir gasto extra
        </motion.button>
      )}
    </div>
  );
}
