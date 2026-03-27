import { motion } from "framer-motion";
import { useExpenseData } from "@/hooks/useExpenseData";
import MonthSelector from "@/components/MonthSelector";
import SummaryCards from "@/components/SummaryCards";
import ProgressRing from "@/components/ProgressRing";
import ExpenseList from "@/components/ExpenseList";
import AddExpenseForm from "@/components/AddExpenseForm";
import IncomeEditor from "@/components/IncomeEditor";
import { Wallet } from "lucide-react";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { duration: 0.6, delay, ease: "easeOut" as const },
});

export default function Index() {
  const {
    selectedMonth, setSelectedMonth, monthData, MONTHS,
    totalExpenses, totalPaid, totalPending, freeAmount,
    togglePaid, addExpense, removeExpense, updateExpense, setIncome,
  } = useExpenseData();

  return (
    <div className="relative z-10 min-h-screen pb-12">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="px-5 pt-14 pb-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-2xl liquid-glass-strong flex items-center justify-center">
              <Wallet size={20} className="text-foreground/80" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground tracking-[-0.5px]">
                Mis <span className="font-serif-accent text-2xl">Gastos</span>
              </h1>
              <p className="text-[11px] text-muted-foreground uppercase tracking-[2px]">2026</p>
            </div>
          </div>

          <MonthSelector months={MONTHS} selected={selectedMonth} onSelect={setSelectedMonth} />
        </motion.div>

        {/* Divider */}
        <div className="mx-5 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent mb-6" />

        {/* Content */}
        <div className="px-5 flex flex-col gap-6">
          {/* Progress + Income */}
          <motion.div {...fadeUp(0.15)} className="flex items-center justify-between">
            <ProgressRing paid={totalPaid} total={totalExpenses} />
            <IncomeEditor income={monthData.income} onSetIncome={setIncome} />
          </motion.div>

          <motion.div {...fadeUp(0.25)}>
            <SummaryCards
              income={monthData.income}
              totalExpenses={totalExpenses}
              totalPending={totalPending}
              freeAmount={freeAmount}
            />
          </motion.div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />

          <motion.div {...fadeUp(0.35)}>
            <AddExpenseForm onAdd={addExpense} />
          </motion.div>

          <motion.div {...fadeUp(0.4)}>
            <ExpenseList
              expenses={monthData.expenses}
              onTogglePaid={togglePaid}
              onRemove={removeExpense}
              onUpdate={updateExpense}
            />
          </motion.div>
        </div>

        {/* Bottom spacer with footer */}
        <div className="mt-12 px-5">
          <div className="h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent mb-4" />
          <p className="text-center text-[10px] text-muted-foreground/40 uppercase tracking-[2px]">
            © 2026 Expense Tracker
          </p>
        </div>
      </div>
  );
}
