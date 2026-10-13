import { motion } from "framer-motion";
import { useExpenseData } from "@/hooks/useExpenseData";
import MonthSelector from "@/components/MonthSelector";
import BankCardHero from "@/components/BankCardHero";
import FinancialHealthAdvisor from "@/components/FinancialHealthAdvisor";
import SummaryCards from "@/components/SummaryCards";
import ProgressRing from "@/components/ProgressRing";
import ExpenseList from "@/components/ExpenseList";
import AddExpenseForm from "@/components/AddExpenseForm";
import AddExpenseWithAI from "@/components/AddExpenseWithAI";
import BankStatementImporter from "@/components/BankStatementImporter";
import OpenBankingConnect from "@/components/OpenBankingConnect";
import IncomeEditor from "@/components/IncomeEditor";
import BudgetWidget from "@/components/BudgetWidget";
import { Wallet, Loader2 } from "lucide-react";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { duration: 0.5, delay, ease: "easeOut" as const },
});

export default function Index() {
  const {
    selectedMonth, setSelectedMonth, monthData, MONTHS, monthName,
    totalExpenses, totalPaid, totalPending, freeAmount,
    togglePaid, addExpense, removeExpense, updateExpense, setIncome,
    isLoading, expensesByCategory, budgets, setBudget
  } = useExpenseData();

  return (
    <div className="relative z-10 min-h-screen pb-16">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="px-5 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl liquid-glass-strong flex items-center justify-center border border-white/10 shadow-lg">
              <Wallet size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-1.5">
                Wallet <span className="text-primary text-xs px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">PRO</span>
              </h1>
              <p className="text-[11px] text-muted-foreground uppercase tracking-[1.5px] font-medium">Control de Gastos 2026</p>
            </div>
          </div>
        </div>

        {/* Selector de Mes */}
        <MonthSelector months={MONTHS} selected={selectedMonth} onSelect={setSelectedMonth} />
      </motion.div>

      {/* Contenido principal */}
      {isLoading ? (
        <div className="flex items-center justify-center pt-24">
          <Loader2 size={32} className="animate-spin text-primary/60" />
        </div>
      ) : (
        <div className="px-5 flex flex-col gap-5">
          {/* 1. Tarjeta Bancaria Insignia de Wallet by BudgetBakers */}
          <motion.div {...fadeUp(0.1)}>
            <BankCardHero
              income={monthData.income}
              totalExpenses={totalExpenses}
              freeAmount={freeAmount}
              monthName={monthName}
            />
          </motion.div>

          {/* 1.5. Conexión Bancaria Oficial PSD2 Open Banking */}
          <motion.div {...fadeUp(0.12)}>
            <OpenBankingConnect />
          </motion.div>

          {/* 2. Asesor de Salud Financiera con IA */}
          <motion.div {...fadeUp(0.15)}>
            <FinancialHealthAdvisor
              income={monthData.income}
              totalExpenses={totalExpenses}
              freeAmount={freeAmount}
              budgets={budgets}
              expensesByCategory={expensesByCategory}
              monthName={monthName}
            />
          </motion.div>

          {/* 3. Progreso de Pago + Editor de Ingresos */}
          <motion.div {...fadeUp(0.2)} className="flex items-center justify-between">
            <ProgressRing paid={totalPaid} total={totalExpenses} />
            <IncomeEditor income={monthData.income} onSetIncome={setIncome} />
          </motion.div>

          {/* 4. Tarjetas Resumen */}
          <motion.div {...fadeUp(0.25)}>
            <SummaryCards
              income={monthData.income}
              totalExpenses={totalExpenses}
              totalPending={totalPending}
              freeAmount={freeAmount}
            />
          </motion.div>

          {/* 5. Presupuestos por Categoría (Comida, Gasolina, etc.) */}
          <motion.div {...fadeUp(0.3)}>
            <BudgetWidget 
              budgets={budgets} 
              expensesByCategory={expensesByCategory} 
              onSetBudget={setBudget} 
            />
          </motion.div>

          {/* Separador sutil */}
          <div className="h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-1" />

          {/* 6. Barra de Acciones Inteligentes estilo Wallet */}
          <motion.div {...fadeUp(0.35)} className="flex flex-col gap-2.5">
            <AddExpenseWithAI onAdd={(name, amount, categoryId, dueDay) => addExpense(name, amount, categoryId, dueDay)} />
            <BankStatementImporter onAddExpense={(name, amount, categoryId, dueDay) => addExpense(name, amount, categoryId, dueDay)} monthName={monthName} />
            <AddExpenseForm onAdd={(name, amount, categoryId, dueDay) => addExpense(name, amount, categoryId, dueDay)} />
          </motion.div>

          {/* 7. Registro de Transacciones & Movimientos (con buscador y filtros) */}
          <motion.div {...fadeUp(0.4)}>
            <ExpenseList
              expenses={monthData.expenses}
              onTogglePaid={togglePaid}
              onRemove={removeExpense}
              onUpdate={updateExpense}
            />
          </motion.div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <div className="h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent mb-4" />
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-[2px]">
              Wallet Pro • Powered by Firebase & OpenRouter AI
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
