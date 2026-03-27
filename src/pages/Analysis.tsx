import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronDown, Utensils, Car, Film, Home, MoreHorizontal, GraduationCap, BarChart3, PiggyBank, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useExpenseData, CategoryId } from "@/hooks/useExpenseData";

const CATEGORY_ICONS: Record<CategoryId, any> = {
  comida: Utensils,
  transporte: Car,
  ocio: Film,
  vivienda: Home,
  educacion: GraduationCap,
  otros: MoreHorizontal,
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}

export default function Analysis() {
  const { totalExpenses, totalPaid, freeAmount, expensesByCategory, monthData } = useExpenseData();
  const highestCategory = expensesByCategory[0] || { label: "N/A", total: 0 };
  const avgExpense = monthData.expenses.length > 0 ? totalExpenses / monthData.expenses.length : 0;
  const [expandedCat, setExpandedCat] = useState<CategoryId | null>(null);

  const toggleCat = (id: CategoryId) =>
    setExpandedCat((prev) => (prev === id ? null : id));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="min-h-screen pb-24 px-5 pt-8 max-w-md mx-auto relative z-10"
    >
      {/* Header */}
      <div className="flex items-center mb-8 relative">
        <Link to="/" className="w-10 h-10 liquid-glass-strong rounded-full flex items-center justify-center text-foreground hover:bg-foreground/10 transition-colors absolute left-0 shadow-lg">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-xl font-semibold text-foreground flex-1 text-center tracking-tight">
          Análisis de Gastos
        </h1>
      </div>

      {/* Donut Chart */}
      <div className="h-64 w-full relative mb-12 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={expensesByCategory}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={105}
              paddingAngle={4}
              dataKey="total"
              stroke="none"
              cornerRadius={8}
            >
              {expensesByCategory.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none drop-shadow-md">
          <span className="text-[13px] font-medium text-foreground/80 tracking-wide uppercase mb-0.5">Gastos por</span>
          <span className="text-[17px] font-bold text-foreground tracking-tight">Categoría</span>
        </div>
        <div className="text-center mt-5 text-[15px] font-bold text-foreground/90 tracking-wide">
          Total: {formatCurrency(monthData.income)}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="liquid-glass-strong rounded-[24px] p-5 flex flex-col gap-3 relative overflow-hidden group">
          <div className="flex items-center gap-2 text-muted-foreground relative z-10">
            <div className="w-7 h-7 rounded-lg bg-foreground/5 flex items-center justify-center">
              <Utensils size={14} />
            </div>
            <span className="text-[10px] uppercase tracking-wider font-semibold opacity-80 leading-tight">Categoría<br/>más alta</span>
          </div>
          <div className="flex flex-col relative z-10 mt-1">
            <span className="text-xs text-muted-foreground/80 font-medium mb-0.5">{highestCategory.label}</span>
            <span className="text-xl font-bold tracking-tight text-foreground">{formatCurrency(highestCategory.total)}</span>
          </div>
        </div>

        <div className="liquid-glass-strong rounded-[24px] p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-7 h-7 rounded-lg bg-foreground/5 flex items-center justify-center">
              <BarChart3 size={14} />
            </div>
            <span className="text-[10px] uppercase tracking-wider font-semibold opacity-80 leading-tight">Gasto<br/>Promedio</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground mt-1">{formatCurrency(avgExpense)}</span>
        </div>

        <div className="liquid-glass-strong rounded-[24px] p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-7 h-7 rounded-lg bg-foreground/5 flex items-center justify-center">
              <PiggyBank size={14} />
            </div>
            <span className="text-[10px] uppercase tracking-wider font-semibold opacity-80 leading-tight">Ahorro<br/>Mensual</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground mt-1">{formatCurrency(freeAmount)}</span>
        </div>

        <div className="liquid-glass-strong rounded-[24px] p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-7 h-7 rounded-lg bg-foreground/5 flex items-center justify-center">
              <Wallet size={14} />
            </div>
            <span className="text-[10px] uppercase tracking-wider font-semibold opacity-80 leading-tight">Presupuesto<br/>Restante</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground mt-1">{formatCurrency(monthData.income - totalPaid)}</span>
        </div>
      </div>

      {/* Category breakdown — expandable */}
      <div className="liquid-glass-strong rounded-[28px] p-2 mt-8 flex flex-col gap-0.5">
        {expensesByCategory.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.id] || MoreHorizontal;
          const isOpen = expandedCat === cat.id;
          const catExpenses = monthData.expenses.filter((e) => e.categoryId === cat.id);

          return (
            <div key={cat.id} className="rounded-3xl overflow-hidden">
              {/* Row header — clickable */}
              <button
                onClick={() => toggleCat(cat.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-foreground/[0.04] transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-11 h-11 rounded-2xl bg-foreground/5 flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                    style={{ color: cat.color }}
                  >
                    <Icon size={20} />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-foreground text-[15px] tracking-wide block">{cat.label}</span>
                    <span className="text-[11px] text-muted-foreground/50">{catExpenses.length} gasto{catExpenses.length !== 1 ? "s" : ""}</span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1.5 ml-4">
                  <span className="font-bold text-foreground text-[14px] tracking-tight">
                    {formatCurrency(cat.total)}{" "}
                    <span className="text-muted-foreground/50 font-medium text-xs">- {cat.percentage}%</span>
                  </span>
                  <div className="w-20 h-1.5 rounded-full bg-foreground/10 overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${cat.percentage}%` }}
                      transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                      className="h-full rounded-full absolute left-0 top-0"
                      style={{ backgroundColor: cat.color }}
                    />
                  </div>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="text-muted-foreground/40 mt-0.5"
                  >
                    <ChevronDown size={14} />
                  </motion.div>
                </div>
              </button>

              {/* Expanded expenses list */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="detail"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="mx-4 mb-3 rounded-2xl overflow-hidden" style={{ backgroundColor: `${cat.color}10` }}>
                      {catExpenses.map((exp, i) => (
                        <div
                          key={exp.id}
                          className={`flex items-center justify-between px-4 py-3 ${
                            i < catExpenses.length - 1 ? "border-b border-foreground/5" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className={`text-sm font-medium ${exp.paid ? "line-through text-muted-foreground/50" : "text-foreground"}`}>
                              {exp.name}
                            </span>
                          </div>
                          <span className={`text-sm font-semibold tracking-tight ${exp.paid ? "text-muted-foreground/40" : "text-foreground"}`}>
                            {formatCurrency(exp.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
