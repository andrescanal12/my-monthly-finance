import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Trash2, RotateCcw, Pencil, X, AlertTriangle, CalendarClock, Search, CreditCard, Filter } from "lucide-react";
import { Expense, CategoryId, CATEGORY_COLORS, CATEGORY_LABELS } from "@/hooks/useExpenseData";

interface ExpenseListProps {
  expenses: Expense[];
  onTogglePaid: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, name: string, amount: number, dueDay?: number | null) => void;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}

/** Devuelve el estado del vencimiento respecto al día actual del mes */
function getDueDayStatus(dueDay: number): "urgent" | "soon" | "ok" {
  const today = new Date().getDate();
  const diff = dueDay - today;
  if (diff < 0 || diff === 0) return "urgent";
  if (diff <= 3) return "soon";
  return "ok";
}

function DueDayBadge({ dueDay, paid }: { dueDay: number; paid: boolean }) {
  if (paid) {
    return (
      <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground/40 bg-foreground/[0.04] rounded-full px-2 py-0.5">
        <CalendarClock size={9} />
        Día {dueDay}
      </span>
    );
  }

  const status = getDueDayStatus(dueDay);
  const styles = {
    urgent: "text-red-400 bg-red-500/10",
    soon:   "text-amber-400 bg-amber-500/10",
    ok:     "text-emerald-400 bg-emerald-500/10",
  };
  const labels = {
    urgent: `Venció el día ${dueDay}`,
    soon:   `Vence el día ${dueDay}`,
    ok:     `Día ${dueDay}`,
  };

  return (
    <span className={`flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5 ${styles[status]}`}>
      <CalendarClock size={9} />
      {labels[status]}
    </span>
  );
}

const CATEGORIES = Object.keys(CATEGORY_LABELS) as CategoryId[];

export default function ExpenseList({ expenses, onTogglePaid, onRemove, onUpdate }: ExpenseListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDueDay, setEditDueDay] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | "all">("all");

  const startEditing = (expense: Expense) => {
    setEditingId(expense.id);
    setEditName(expense.name);
    setEditAmount(String(expense.amount));
    setEditDueDay(expense.dueDay ? String(expense.dueDay) : "");
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const handleUpdate = (id: string) => {
    const parsed = parseFloat(editAmount);
    if (editName.trim() && !isNaN(parsed) && parsed >= 0) {
      const parsedDay = editDueDay ? parseInt(editDueDay, 10) : null;
      onUpdate(id, editName.trim(), parsed, parsedDay);
    }
    setEditingId(null);
  };

  // Filtrado reactivo en tiempo real estilo Wallet by BudgetBakers
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchesCategory = selectedCategory === "all" || e.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchQuery, selectedCategory]);

  const filteredTotal = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  return (
    <div className="flex flex-col gap-3">
      {/* Cabecera y buscador estilo Wallet */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-xs font-semibold text-foreground tracking-wide flex items-center gap-1.5">
              <span>Transacciones & Movimientos</span>
            </h3>
            <span className="text-[10px] text-muted-foreground">
              {filteredExpenses.length} movimientos ({formatCurrency(filteredTotal)})
            </span>
          </div>
          <span className="text-[11px] font-bold text-muted-foreground bg-foreground/[0.04] px-2.5 py-1 rounded-full border border-foreground/[0.06]">
            {expenses.filter((e) => e.paid).length}/{expenses.length} pagados
          </span>
        </div>

        {/* Buscador interactivo */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Buscar por comercio (Mercadona, Repsol, Lidl...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-foreground/[0.04] border border-foreground/[0.08] focus:border-foreground/20 rounded-xl py-2.5 pl-9 pr-8 text-xs text-foreground placeholder:text-muted-foreground/40 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Chips de filtro por categoría */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1 rounded-full text-[10px] font-semibold transition-all whitespace-nowrap ${
              selectedCategory === "all"
                ? "bg-foreground text-background shadow-sm"
                : "bg-foreground/[0.04] text-muted-foreground hover:bg-foreground/[0.08]"
            }`}
          >
            Todos ({expenses.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = expenses.filter((e) => e.categoryId === cat).length;
            if (count === 0 && selectedCategory !== cat) return null;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(isSelected ? "all" : cat)}
                className={`px-3 py-1 rounded-full text-[10px] font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
                  isSelected
                    ? "text-background shadow-sm"
                    : "bg-foreground/[0.04] text-muted-foreground hover:bg-foreground/[0.08]"
                }`}
                style={isSelected ? { backgroundColor: CATEGORY_COLORS[cat] } : {}}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: isSelected ? "currentColor" : CATEGORY_COLORS[cat] }}
                />
                <span>{CATEGORY_LABELS[cat]}</span>
                <span className="opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de gastos */}
      <AnimatePresence mode="popLayout">
        {filteredExpenses.length === 0 ? (
          <div className="liquid-glass rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-2">
            <Filter size={20} className="text-muted-foreground/40" />
            <span className="text-xs text-muted-foreground">No hay gastos que coincidan con la búsqueda</span>
          </div>
        ) : (
          filteredExpenses.map((expense, i) => {
            const isEditing = editingId === expense.id;
            return (
              <motion.div
                key={expense.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10, scale: 0.95 }}
                transition={{ delay: i * 0.02, duration: 0.2 }}
                className={`liquid-glass rounded-2xl p-4 flex flex-col group transition-all duration-300 ${
                  expense.paid && !isEditing ? "opacity-60" : "hover:bg-foreground/[0.03]"
                } ${isEditing ? "ring-1 ring-foreground/20" : ""}`}
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
                          placeholder="Ej. Mercadona"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] text-muted-foreground uppercase tracking-[1px] ml-1 font-semibold">
                            Importe (€)
                          </label>
                          <input
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            step="0.01"
                            min="0"
                            className="liquid-glass-strong rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-foreground/30 transition-all placeholder:text-muted-foreground/30 w-full"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] text-muted-foreground uppercase tracking-[1px] ml-1 font-semibold">
                            Vence el día
                          </label>
                          <input
                            type="number"
                            value={editDueDay}
                            onChange={(e) => setEditDueDay(e.target.value)}
                            className="liquid-glass-strong rounded-xl px-3 py-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-foreground/30 transition-all placeholder:text-muted-foreground/30 text-center w-full"
                            placeholder="—"
                            min="1"
                            max="31"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleUpdate(expense.id)}
                          className="flex-1 h-[44px] rounded-xl bg-foreground text-background flex items-center justify-center gap-2 text-sm font-semibold hover:bg-foreground/90 transition-all shadow-lg"
                        >
                          <Check size={16} />
                          Guardar
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
                      className="flex flex-col gap-2"
                    >
                      {/* Fila principal */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Checkbox de pagado */}
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={() => onTogglePaid(expense.id)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
                              expense.paid
                                ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                                : "bg-foreground/[0.06] text-muted-foreground hover:bg-foreground/[0.12]"
                            }`}
                          >
                            {expense.paid ? (
                              <Check size={14} strokeWidth={3} />
                            ) : (
                              <div className="w-2.5 h-2.5 rounded-sm border border-muted-foreground/40" />
                            )}
                          </motion.button>

                          <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                onClick={() => startEditing(expense)}
                                className={`text-sm font-semibold truncate cursor-pointer hover:text-foreground/80 transition-all ${
                                  expense.paid ? "line-through text-muted-foreground" : "text-foreground"
                                }`}
                              >
                                {expense.name}
                              </span>
                              {/* Dot de categoría */}
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: CATEGORY_COLORS[expense.categoryId] || "#9ca3af" }}
                              />
                            </div>

                            {/* Insignias de método y tipo estilo Wallet by BudgetBakers */}
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-muted-foreground/70 font-medium">
                                {CATEGORY_LABELS[expense.categoryId]}
                              </span>
                              <span className="text-[10px] text-muted-foreground/40">•</span>
                              {expense.paid ? (
                                <span className="text-[10px] text-sky-400 font-semibold flex items-center gap-0.5">
                                  <CreditCard size={10} /> Tarjeta BBVA
                                </span>
                              ) : (
                                <span className="text-[10px] text-amber-400 font-semibold">⏳ Pendiente</span>
                              )}
                              {expense.isRecurring && (
                                <>
                                  <span className="text-[10px] text-muted-foreground/40">•</span>
                                  <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5">
                                    <RotateCcw size={8} /> Recurrente
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Importe y botones de editar/borrar */}
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <span
                            onClick={() => startEditing(expense)}
                            className={`text-sm font-bold tracking-tight cursor-pointer hover:text-foreground/80 transition-all ${
                              expense.paid ? "text-muted-foreground" : "text-foreground"
                            }`}
                          >
                            -{formatCurrency(expense.amount)}
                          </span>
                          <div className="flex items-center gap-0.5">
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() => startEditing(expense)}
                              className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-foreground/5 transition-all"
                            >
                              <Pencil size={13} />
                            </motion.button>
                            {confirmDeleteId === expense.id ? (
                              <motion.button
                                key="confirm"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                whileTap={{ scale: 0.85 }}
                                onClick={() => {
                                  onRemove(expense.id);
                                  setConfirmDeleteId(null);
                                }}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-destructive/20 text-destructive text-[11px] font-semibold transition-all"
                              >
                                <AlertTriangle size={11} />
                                Borrar
                              </motion.button>
                            ) : (
                              <motion.button
                                key="delete"
                                whileTap={{ scale: 0.85 }}
                                onClick={() => setConfirmDeleteId(expense.id)}
                                className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all"
                              >
                                <Trash2 size={13} />
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Badge de vencimiento si tiene día asignado */}
                      {expense.dueDay && (
                        <div className="ml-10">
                          <DueDayBadge dueDay={expense.dueDay} paid={expense.paid} />
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </AnimatePresence>
    </div>
  );
}
