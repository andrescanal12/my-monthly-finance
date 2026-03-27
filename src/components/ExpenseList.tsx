import { motion, AnimatePresence } from "framer-motion";
import { Check, Trash2, RotateCcw } from "lucide-react";
import type { Expense } from "@/hooks/useExpenseData";

interface ExpenseListProps {
  expenses: Expense[];
  onTogglePaid: (id: string) => void;
  onRemove: (id: string) => void;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}

export default function ExpenseList({ expenses, onTogglePaid, onRemove }: ExpenseListProps) {
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
        {expenses.map((expense, i) => (
          <motion.div
            key={expense.id}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ delay: i * 0.02, duration: 0.3 }}
            className={`liquid-glass rounded-2xl p-4 flex items-center justify-between group transition-all duration-300 ${
              expense.paid ? "opacity-40" : "hover:bg-foreground/[0.03]"
            }`}
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
              <div className="flex flex-col min-w-0">
                <span className={`text-sm font-medium truncate transition-all duration-300 ${
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
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-sm font-semibold tracking-[-0.3px] ${
                expense.paid ? "text-muted-foreground" : "text-foreground"
              }`}>
                {formatCurrency(expense.amount)}
              </span>
              {!expense.isRecurring && (
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => onRemove(expense.id)}
                  className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all duration-300 opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={13} />
                </motion.button>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
