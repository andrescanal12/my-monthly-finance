import { useState } from "react";
import { Plus, X, Utensils, Car, Film, Home, GraduationCap, MoreHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CategoryId, CATEGORY_COLORS, CATEGORY_LABELS } from "@/hooks/useExpenseData";

const CATEGORY_ICONS: Record<CategoryId, any> = {
  comida: Utensils,
  transporte: Car,
  ocio: Film,
  vivienda: Home,
  educacion: GraduationCap,
  otros: MoreHorizontal,
};

const CATEGORIES = Object.keys(CATEGORY_LABELS) as CategoryId[];

interface AddExpenseFormProps {
  onAdd: (name: string, amount: number, categoryId: CategoryId) => void;
}

export default function AddExpenseForm({ onAdd }: AddExpenseFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CategoryId>("otros");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount) return;
    onAdd(name.trim(), parseFloat(amount), category);
    setName("");
    setAmount("");
    setCategory("otros");
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

            {/* Category chips */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-muted-foreground uppercase tracking-[1px] ml-1 font-semibold">
                Categoría
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = CATEGORY_ICONS[cat];
                  const isActive = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                        isActive
                          ? "text-background scale-105 shadow-md"
                          : "bg-foreground/[0.05] text-muted-foreground hover:bg-foreground/[0.1]"
                      }`}
                      style={isActive ? { backgroundColor: CATEGORY_COLORS[cat] } : {}}
                    >
                      <Icon size={11} />
                      {CATEGORY_LABELS[cat]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-muted-foreground uppercase tracking-[1px] ml-1 font-semibold">
                Nombre del Gasto
              </label>
              <input
                placeholder="Ej. Cena con amigos"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-foreground/[0.05] rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:ring-1 focus:ring-foreground/30 transition-all"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-muted-foreground uppercase tracking-[1px] ml-1 font-semibold">
                Importe (€)
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min="0"
                className="bg-foreground/[0.05] rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:ring-1 focus:ring-foreground/30 transition-all"
              />
            </div>
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
