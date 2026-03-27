import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAnnualData, MonthlySummary } from "@/hooks/useAnnualData";
import { CalendarDays, ChevronDown, Loader2 } from "lucide-react";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/hooks/useExpenseData";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: "easeOut" as const },
});

export default function Annual() {
  const { isLoading, monthlyData, totalYearIncome, totalYearExpenses, totalYearFree } = useAnnualData();
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-muted-foreground/40" />
      </div>
    );
  }

  return (
    <div className="relative z-10 min-h-screen pb-24">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="px-5 pt-14 pb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl liquid-glass-strong flex items-center justify-center">
            <CalendarDays size={20} className="text-foreground/80" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-[-0.5px]">
              Resumen <span className="font-serif-accent text-2xl">Anual</span>
            </h1>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[2px]">2026</p>
          </div>
        </div>

        {/* Year Summary */}
        <div className="grid grid-cols-2 gap-3 mb-2">
          <div className="liquid-glass p-4 rounded-3xl flex flex-col items-center justify-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-[1px] mb-1">Ingreso Anual</p>
            <p className="font-medium text-foreground">{totalYearIncome.toLocaleString('es-ES')}€</p>
          </div>
          <div className="liquid-glass p-4 rounded-3xl flex flex-col items-center justify-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-[1px] mb-1">Gasto Anual</p>
            <p className="font-medium text-destructive">{totalYearExpenses.toLocaleString('es-ES')}€</p>
          </div>
        </div>
      </motion.div>

      {/* Divider */}
      <div className="mx-5 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent mb-6" />

      {/* Monthly List */}
      <div className="px-5 flex flex-col gap-4">
        {monthlyData.map((month, idx) => {
          const isExpanded = expandedMonth === month.monthIndex;
          const usagePercent = month.income > 0 ? (month.totalExpenses / month.income) * 100 : 0;
          const isOverBudget = usagePercent > 100;

          return (
            <motion.div key={month.monthIndex} {...fadeUp(0.1 + idx * 0.05)} className="liquid-glass rounded-[2rem] overflow-hidden">
              <button
                onClick={() => setExpandedMonth(isExpanded ? null : month.monthIndex)}
                className="w-full flex flex-col p-5 text-left transition-colors hover:bg-white/5 active:bg-white/10"
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <h3 className="font-medium text-foreground">{month.monthName}</h3>
                  <ChevronDown
                    size={18}
                    className={`text-muted-foreground transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                  />
                </div>
                
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-muted-foreground">Gastado:</span>
                  <span className={`font-medium ${isOverBudget ? 'text-destructive' : 'text-foreground'}`}>
                    {month.totalExpenses.toLocaleString('es-ES')}€
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-foreground/5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${isOverBudget ? 'bg-destructive' : 'bg-foreground'}`}
                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                  />
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-2 border-t border-foreground/5">
                      {month.expenses.length === 0 ? (
                        <p className="text-center text-xs text-muted-foreground py-4">No hay gastos este mes</p>
                      ) : (
                        <div className="flex flex-col gap-3 mt-2">
                          {month.expenses.map((expense) => (
                            <div key={expense.id} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-2 h-2 rounded-full" 
                                  style={{ backgroundColor: CATEGORY_COLORS[expense.categoryId] || CATEGORY_COLORS.otros }} 
                                />
                                <span className="text-foreground/80">{expense.name}</span>
                              </div>
                              <span className="font-medium text-foreground">
                                {expense.amount.toLocaleString('es-ES')}€
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
