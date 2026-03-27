import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// ── FAMILY ID ─────────────────────────────────────────────
// Shared identifier for all household data. No login needed.
const FAMILY_ID = "canal-family";
const YEAR = 2026;

// ── TYPES ─────────────────────────────────────────────────
export type CategoryId = "comida" | "transporte" | "ocio" | "vivienda" | "educacion" | "otros";

export const CATEGORY_COLORS: Record<CategoryId, string> = {
  comida:     "#38bdf8",
  transporte: "#818cf8",
  ocio:       "#c084fc",
  vivienda:   "#f472b6",
  educacion:  "#fbbf24",
  otros:      "#9ca3af",
};

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  comida:     "Comida",
  transporte: "Transporte",
  ocio:       "Ocio",
  vivienda:   "Vivienda",
  educacion:  "Educación",
  otros:      "Otros",
};

export interface Expense {
  id: string;
  name: string;
  amount: number;
  paid: boolean;
  isRecurring: boolean;
  categoryId: CategoryId;
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
      }));
    },
  });

  // ── Invalidate helpers ───────────────────────────────
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["expenses", selectedMonth] });
    queryClient.invalidateQueries({ queryKey: ["income",   selectedMonth] });
  };

  // ── Mutations ────────────────────────────────────────
  const addExpenseMut = useMutation({
    mutationFn: async (vars: { name: string; amount: number; categoryId: CategoryId }) => {
      const { error } = await supabase.from("expenses").insert([{
        family_id:    FAMILY_ID,
        name:         vars.name,
        amount:       vars.amount,
        category_id:  vars.categoryId,
        month_index:  selectedMonth,
        year:         YEAR,
        paid:         false,
        is_recurring: false,
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
    mutationFn: async (vars: { id: string; name: string; amount: number }) => {
      const { error } = await supabase
        .from("expenses")
        .update({ name: vars.name, amount: vars.amount })
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

  // ── Derived values ────────────────────────────────────
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalPaid     = expenses.filter((e) => e.paid).reduce((s, e) => s + e.amount, 0);
  const totalPending  = totalExpenses - totalPaid;
  const freeAmount    = income - totalExpenses;

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
    togglePaid:    (id: string) => {
      const e = expenses.find((x) => x.id === id);
      if (e) togglePaidMut.mutate({ id, paid: e.paid });
    },
    addExpense:    (name: string, amount: number, categoryId: CategoryId = "otros") =>
      addExpenseMut.mutate({ name, amount, categoryId }),
    removeExpense: (id: string) => removeExpenseMut.mutate(id),
    updateExpense: (id: string, name: string, amount: number) =>
      updateExpenseMut.mutate({ id, name, amount }),
    setIncome:     (amount: number) => setIncomeMut.mutate(amount),
    MONTHS,
  };
}
