import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// ── FAMILY ID ─────────────────────────────────────────────
// Shared identifier for all household data. No login needed.
const FAMILY_ID = "canal-family";
const YEAR = 2026;

// ── TYPES ─────────────────────────────────────────────────
export type CategoryId = "comida" | "transporte" | "ocio" | "vivienda" | "educacion" | "otros" | "gasolina";

export const CATEGORY_COLORS: Record<CategoryId, string> = {
  comida:     "#38bdf8",
  transporte: "#818cf8",
  ocio:       "#c084fc",
  vivienda:   "#f472b6",
  educacion:  "#fbbf24",
  otros:      "#9ca3af",
  gasolina:   "#f97316",
};

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  comida:     "Comida",
  transporte: "Transporte",
  ocio:       "Ocio",
  vivienda:   "Vivienda",
  educacion:  "Educación",
  otros:      "Otros",
  gasolina:   "Gasolina",
};

export interface Expense {
  id: string;
  name: string;
  amount: number;
  paid: boolean;
  isRecurring: boolean;
  categoryId: CategoryId;
  dueDay?: number; // día del mes en que vence el pago (1-31)
}

export interface CategoryBudget {
  categoryId: CategoryId;
  amount: number;
}

export const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// ── HOOK ──────────────────────────────────────────────────
export function useExpenseData() {
  const queryClient = useQueryClient();

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return now.getFullYear() === YEAR ? now.getMonth() : 0;
  });

  // ── Fetch income ──────────────────────────────────────
  const { data: income = 1955.15 } = useQuery<number>({
    queryKey: ["income", selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("month_income")
        .select("amount")
        .eq("family_id", FAMILY_ID)
        .eq("month_index", selectedMonth)
        .eq("year", YEAR)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data?.amount ?? 1955.15;
    },
  });

  // ── Fetch expenses ────────────────────────────────────
  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ["expenses", selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("family_id", FAMILY_ID)
        .eq("month_index", selectedMonth)
        .eq("year", YEAR)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((e) => ({
        id:          e.id,
        name:        e.name,
        amount:      Number(e.amount),
        paid:        e.paid,
        isRecurring: e.is_recurring,
        categoryId:  e.category_id as CategoryId,
        dueDay:      e.due_day ?? undefined,
      }));
    },
  });

  // ── Fetch budgets ─────────────────────────────────────
  const { data: budgets = [] } = useQuery<CategoryBudget[]>({
    queryKey: ["budgets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("category_budgets")
        .select("category_id, amount")
        .eq("family_id", FAMILY_ID);
      if (error && error.code !== "PGRST116") throw error;
      return (data ?? []).map(b => ({
        categoryId: b.category_id as CategoryId,
        amount: Number(b.amount),
      }));
    },
  });

  // ── Realtime Subscription ───────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("shared-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["expenses", selectedMonth] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "month_income" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["income", selectedMonth] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "category_budgets" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["budgets"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedMonth, queryClient]);

  // ── Invalidate helpers ───────────────────────────────
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["expenses", selectedMonth] });
    queryClient.invalidateQueries({ queryKey: ["income",   selectedMonth] });
    queryClient.invalidateQueries({ queryKey: ["budgets"] });
  };

  // ── Mutations ────────────────────────────────────────
  const addExpenseMut = useMutation({
    mutationFn: async (vars: { name: string; amount: number; categoryId: CategoryId; dueDay?: number }) => {
      const { error } = await supabase.from("expenses").insert([{
        family_id:    FAMILY_ID,
        name:         vars.name,
        amount:       vars.amount,
        category_id:  vars.categoryId,
        month_index:  selectedMonth,
        year:         YEAR,
        paid:         false,
        is_recurring: false,
        due_day:      vars.dueDay ?? null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Gasto añadido"); },
    onError:   (e: any) => toast.error(e.message),
  });

  const removeExpenseMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Gasto eliminado"); },
    onError:   (e: any) => toast.error(e.message),
  });

  const togglePaidMut = useMutation({
    mutationFn: async (vars: { id: string; paid: boolean }) => {
      const { error } = await supabase
        .from("expenses")
        .update({ paid: !vars.paid })
        .eq("id", vars.id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
    onError:   (e: any) => toast.error(e.message),
  });

  const updateExpenseMut = useMutation({
    mutationFn: async (vars: { id: string; name: string; amount: number; dueDay?: number | null }) => {
      const { error } = await supabase
        .from("expenses")
        .update({ name: vars.name, amount: vars.amount, due_day: vars.dueDay ?? null })
        .eq("id", vars.id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Gasto actualizado"); },
    onError:   (e: any) => toast.error(e.message),
  });

  const setIncomeMut = useMutation({
    mutationFn: async (amount: number) => {
      const { error } = await supabase.from("month_income").upsert(
        { family_id: FAMILY_ID, month_index: selectedMonth, year: YEAR, amount },
        { onConflict: "family_id, month_index, year" }
      );
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Ingresos actualizados"); },
    onError:   (e: any) => toast.error(e.message),
  });

  const setBudgetMut = useMutation({
    mutationFn: async (vars: { categoryId: CategoryId; amount: number }) => {
      const { error } = await supabase.from("category_budgets").upsert(
        { family_id: FAMILY_ID, category_id: vars.categoryId, amount: vars.amount },
        { onConflict: "family_id, category_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Presupuesto actualizado"); },
    onError:   (e: any) => toast.error(e.message),
  });

  // ── Derived values ────────────────────────────────────
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalPaid     = expenses.filter((e) => e.paid).reduce((s, e) => s + e.amount, 0);
  const totalPending  = totalExpenses - totalPaid;

  // El dinero libre resta los gastos reales, pero para las categorías con presupuesto,
  // resta el presupuesto entero (o el gasto real si lo supera), ya que es dinero "reservado".
  const expectedTotalExpenses = (Object.keys(CATEGORY_LABELS) as CategoryId[]).reduce((sum, catId) => {
    const spent = expenses.filter((e) => e.categoryId === catId).reduce((s, e) => s + e.amount, 0);
    const budgetAmount = budgets.find(b => b.categoryId === catId)?.amount || 0;
    return sum + Math.max(spent, budgetAmount);
  }, 0);

  const freeAmount = income - expectedTotalExpenses;

  const expensesByCategory = (Object.keys(CATEGORY_LABELS) as CategoryId[])
    .map((id) => {
      const catExpenses = expenses.filter((e) => e.categoryId === id);
      const total = catExpenses.reduce((s, e) => s + e.amount, 0);
      return {
        id,
        label:      CATEGORY_LABELS[id],
        color:      CATEGORY_COLORS[id],
        total,
        percentage: totalExpenses > 0 ? Math.round((total / totalExpenses) * 100) : 0,
      };
    })
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  return {
    selectedMonth,
    setSelectedMonth,
    monthData: { income, expenses },
    monthName: MONTHS[selectedMonth],
    isLoading,
    totalExpenses,
    totalPaid,
    totalPending,
    freeAmount,
    expensesByCategory,
    budgets,
    togglePaid:    (id: string) => {
      const e = expenses.find((x) => x.id === id);
      if (e) togglePaidMut.mutate({ id, paid: e.paid });
    },
    addExpense:    (name: string, amount: number, categoryId: CategoryId = "otros", dueDay?: number) =>
      addExpenseMut.mutate({ name, amount, categoryId, dueDay }),
    removeExpense: (id: string) => removeExpenseMut.mutate(id),
    updateExpense: (id: string, name: string, amount: number, dueDay?: number | null) =>
      updateExpenseMut.mutate({ id, name, amount, dueDay }),
    setIncome:     (amount: number) => setIncomeMut.mutate(amount),
    setBudget:     (categoryId: CategoryId, amount: number) => setBudgetMut.mutate({ categoryId, amount }),
    MONTHS,
  };
}
