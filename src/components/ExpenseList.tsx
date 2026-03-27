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
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
        Gastos del mes
      </h3>
      <AnimatePresence mode="popLayout">
        {expenses.map((expense) => (
          <motion.div
            key={expense.id}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={`liquid-glass rounded-xl p-4 flex items-center justify-between transition-all ${
              expense.paid ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button
                onClick={() => onTogglePaid(expense.id)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  expense.paid
                    ? "bg-success text-success-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {expense.paid ? <Check size={16} /> : <div className="w-3 h-3 rounded-sm border border-muted-foreground/50" />}
              </button>
              <div className="flex flex-col min-w-0">
                <span className={`text-sm font-medium truncate ${expense.paid ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  {expense.name}
                </span>
                {expense.isRecurring && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <RotateCcw size={8} /> Recurrente
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-sm font-semibold ${expense.paid ? "text-muted-foreground" : "text-foreground"}`}>
                {formatCurrency(expense.amount)}
              </span>
              {!expense.isRecurring && (
                <button
                  onClick={() => onRemove(expense.id)}
                  className="p-1.5 rounded-lg text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
