import { useExpenseData } from "@/hooks/useExpenseData";
import MonthSelector from "@/components/MonthSelector";
import SummaryCards from "@/components/SummaryCards";
import ProgressRing from "@/components/ProgressRing";
import ExpenseList from "@/components/ExpenseList";
import AddExpenseForm from "@/components/AddExpenseForm";
import IncomeEditor from "@/components/IncomeEditor";
import { Wallet } from "lucide-react";

export default function Index() {
  const {
    selectedMonth, setSelectedMonth, monthData, MONTHS,
    totalExpenses, totalPaid, totalPending, freeAmount,
    togglePaid, addExpense, removeExpense, setIncome,
  } = useExpenseData();

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Wallet size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Mis Gastos 2026</h1>
            <p className="text-xs text-muted-foreground">Gestión mensual de gastos</p>
          </div>
        </div>

        <MonthSelector months={MONTHS} selected={selectedMonth} onSelect={setSelectedMonth} />
      </div>

      {/* Content */}
      <div className="px-5 flex flex-col gap-5">
        {/* Progress + Income */}
        <div className="flex items-center justify-between">
          <ProgressRing paid={totalPaid} total={totalExpenses} />
          <div className="flex flex-col items-end gap-1">
            <IncomeEditor income={monthData.income} onSetIncome={setIncome} />
          </div>
        </div>

        <SummaryCards
          income={monthData.income}
          totalExpenses={totalExpenses}
          totalPending={totalPending}
          freeAmount={freeAmount}
        />

        <AddExpenseForm onAdd={addExpense} />

        <ExpenseList
          expenses={monthData.expenses}
          onTogglePaid={togglePaid}
          onRemove={removeExpense}
        />
      </div>
    </div>
  );
}
