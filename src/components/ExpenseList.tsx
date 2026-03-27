import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Trash2, RotateCcw, Pencil, X } from "lucide-react";
import type { Expense } from "@/hooks/useExpenseData";

interface ExpenseListProps {
  expenses: Expense[];
  onTogglePaid: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, name: string, amount: number) => void;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}

export default function ExpenseList({ expenses, onTogglePaid, onRemove, onUpdate }: ExpenseListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");

  const startEditing = (expense: Expense) => {
    setEditingId(expense.id);
    setEditName(expense.name);
    setEditAmount(String(expense.amount));
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const handleUpdate = (id: string) => {
    const parsed = parseFloat(editAmount);
    if (editName.trim() && !isNaN(parsed) && parsed >= 0) {
      onUpdate(id, editName.trim(), parsed);
    }
    setEditingId(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1 mb-1">
        <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-[2px]">
          Gastos del mes
        </h3>
        <span className="text-[11px] text-muted-foreground">
          {expenses.filter(e => e.paid).length}/{expenses.length}
        </span>
      </div>
      <AnimatePresence mode="popLayout">
        {expenses.map((expense, i) => {
          const isEditing = editingId === expense.id;
          return (
            <motion.div
              key={expense.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ delay: i * 0.02, duration: 0.3 }}
              className={`liquid-glass rounded-2xl p-4 flex flex-col group transition-all duration-300 ${
                expense.paid && !isEditing ? "opacity-40" : "hover:bg-foreground/[0.03]"
              } ${isEditing ? "ring-1 ring-foreground/10" : ""}`}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isEditing ? (
                  <motion.div
                    key="edit"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-4"
                  >
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] text-muted-foreground uppercase tracking-[1px] ml-1 font-semibold">
                        Nombre del Gasto
                      </label>
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="liquid-glass-strong rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-foreground/30 transition-all placeholder:text-muted-foreground/30"
                        placeholder="Ej. Alquiler"
                      />
                    </div>
                    <div className="flex gap-2 items-end">
                      <div className="flex flex-col gap-2 flex-1">
                        <label className="text-[10px] text-muted-foreground uppercase tracking-[1px] ml-1 font-semibold">
                          Importe (€)
                        </label>
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="liquid-glass-strong rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-foreground/30 transition-all placeholder:text-muted-foreground/30"
                          placeholder="0.00"
                          step="0.01"
                        />
                      </div>
                      <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleUpdate(expense.id)}
                        className="h-[44px] px-5 rounded-xl bg-foreground text-background flex items-center justify-center font-medium hover:bg-foreground/90 transition-all shadow-lg"
                      >
                        <Check size={18} />
                      </motion.button>
                      <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={cancelEditing}
                        className="h-[44px] px-5 rounded-xl bg-foreground/[0.08] text-foreground hover:bg-foreground/[0.15] flex items-center justify-center transition-all shadow-sm"
                      >
                        <X size={18} strokeWidth={2.5} />
                      </motion.button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => onTogglePaid(expense.id)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
                          expense.paid
                            ? "bg-foreground text-background"
                            : "bg-foreground/[0.06] text-muted-foreground hover:bg-foreground/[0.12]"
                        }`}
                      >
                        {expense.paid ? <Check size={13} strokeWidth={3} /> : <div className="w-2.5 h-2.5 rounded-sm border border-muted-foreground/40" />}
                      </motion.button>
                      
                      <div className="flex flex-col min-w-0 flex-1">
                        <span 
                          onClick={() => startEditing(expense)}
                          className={`text-sm font-medium truncate cursor-pointer hover:text-foreground/80 transition-all duration-300 ${
                          expense.paid ? "line-through text-muted-foreground" : "text-foreground"
                        }`}>
                          {expense.name}
                        </span>
                        {expense.isRecurring && (
                          <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1 mt-0.5">
                            <RotateCcw size={8} /> Recurrente
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <span 
                        onClick={() => startEditing(expense)}
                        className={`text-sm font-semibold tracking-[-0.3px] cursor-pointer hover:text-foreground/80 transition-all duration-300 ${
                        expense.paid ? "text-muted-foreground" : "text-foreground"
                      }`}>
                        {formatCurrency(expense.amount)}
                      </span>
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={() => startEditing(expense)}
                          className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-foreground/5 transition-all duration-300"
                        >
                          <Pencil size={13} />
                        </motion.button>
                        {!expense.isRecurring && (
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={() => onRemove(expense.id)}
                            className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all duration-300"
                          >
                            <Trash2 size={13} />
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
