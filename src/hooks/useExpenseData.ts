import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, onSnapshot, addDoc, deleteDoc, updateDoc, doc, setDoc, orderBy } from "firebase/firestore";
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
      const q = query(
        collection(db, "month_income"),
        where("family_id", "==", FAMILY_ID),
        where("month_index", "==", selectedMonth),
        where("year", "==", YEAR)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs[0].data().amount;
      }
      return 1955.15;
    },
  });

  // ── Fetch expenses ────────────────────────────────────
  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ["expenses", selectedMonth],
    queryFn: async () => {
      const q = query(
        collection(db, "expenses"),
        where("family_id", "==", FAMILY_ID),
        where("month_index", "==", selectedMonth),
        where("year", "==", YEAR)
      );
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id:          doc.id,
          name:        data.name,
          amount:      Number(data.amount),
          paid:        data.paid,
          isRecurring: data.is_recurring,
          categoryId:  data.category_id as CategoryId,
          dueDay:      data.due_day ?? undefined,
          createdAt:   data.created_at,
        };
      });
      // Sort in JavaScript to avoid composite index requirement
      return docs.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    },
  });

  // ── Fetch budgets ─────────────────────────────────────
  const { data: budgets = [] } = useQuery<CategoryBudget[]>({
    queryKey: ["budgets"],
    queryFn: async () => {
      const q = query(
        collection(db, "category_budgets"),
        where("family_id", "==", FAMILY_ID)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          categoryId: data.category_id as CategoryId,
          amount: Number(data.amount),
        };
      });
    },
  });

  // ── Realtime Subscription ───────────────────────────────
  useEffect(() => {
    // Listen to expenses
    const expensesQ = query(collection(db, "expenses"), where("family_id", "==", FAMILY_ID));
    const unsubExpenses = onSnapshot(expensesQ, () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", selectedMonth] });
    });

    // Listen to income
    const incomeQ = query(collection(db, "month_income"), where("family_id", "==", FAMILY_ID));
    const unsubIncome = onSnapshot(incomeQ, () => {
      queryClient.invalidateQueries({ queryKey: ["income", selectedMonth] });
    });

    // Listen to budgets
    const budgetsQ = query(collection(db, "category_budgets"), where("family_id", "==", FAMILY_ID));
    const unsubBudgets = onSnapshot(budgetsQ, () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    });

    return () => {
      unsubExpenses();
      unsubIncome();
      unsubBudgets();
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
      await addDoc(collection(db, "expenses"), {
        family_id:    FAMILY_ID,
        name:         vars.name,
        amount:       vars.amount,
        category_id:  vars.categoryId,
        month_index:  selectedMonth,
        year:         YEAR,
        paid:         false,
        is_recurring: false,
        due_day:      vars.dueDay ?? null,
        created_at:   new Date().toISOString(),
      });
    },
    onSuccess: () => { invalidate(); toast.success("Gasto añadido"); },
    onError:   (e: any) => toast.error(e.message),
  });

  const removeExpenseMut = useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, "expenses", id));
    },
    onSuccess: () => { invalidate(); toast.success("Gasto eliminado"); },
    onError:   (e: any) => toast.error(e.message),
  });

  const togglePaidMut = useMutation({
    mutationFn: async (vars: { id: string; paid: boolean }) => {
      await updateDoc(doc(db, "expenses", vars.id), {
        paid: !vars.paid
      });
    },
    onSuccess: () => invalidate(),
    onError:   (e: any) => toast.error(e.message),
  });

  const updateExpenseMut = useMutation({
    mutationFn: async (vars: { id: string; name: string; amount: number; dueDay?: number | null }) => {
      await updateDoc(doc(db, "expenses", vars.id), {
        name: vars.name, 
        amount: vars.amount, 
        due_day: vars.dueDay ?? null
      });
    },
    onSuccess: () => { invalidate(); toast.success("Gasto actualizado"); },
    onError:   (e: any) => toast.error(e.message),
  });

  const setIncomeMut = useMutation({
    mutationFn: async (amount: number) => {
      // Find the document first
      const q = query(
        collection(db, "month_income"),
        where("family_id", "==", FAMILY_ID),
        where("month_index", "==", selectedMonth),
        where("year", "==", YEAR)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        // Update existing
        await updateDoc(doc(db, "month_income", snapshot.docs[0].id), { amount });
      } else {
        // Create new
        const newDocRef = doc(collection(db, "month_income"));
        await setDoc(newDocRef, {
          family_id: FAMILY_ID,
          month_index: selectedMonth,
          year: YEAR,
          amount
        });
      }
    },
    onSuccess: () => { invalidate(); toast.success("Ingresos actualizados"); },
    onError:   (e: any) => toast.error(e.message),
  });

  const setBudgetMut = useMutation({
    mutationFn: async (vars: { categoryId: CategoryId; amount: number }) => {
      const q = query(
        collection(db, "category_budgets"),
        where("family_id", "==", FAMILY_ID),
        where("category_id", "==", vars.categoryId)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        await updateDoc(doc(db, "category_budgets", snapshot.docs[0].id), { amount: vars.amount });
      } else {
        const newDocRef = doc(collection(db, "category_budgets"));
        await setDoc(newDocRef, {
          family_id: FAMILY_ID,
          category_id: vars.categoryId,
          amount: vars.amount
        });
      }
    },
    onSuccess: () => { invalidate(); toast.success("Presupuesto actualizado"); },
    onError:   (e: any) => toast.error(e.message),
  });

  // ── Derived values ────────────────────────────────────
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalPaid     = expenses.filter((e) => e.paid).reduce((s, e) => s + e.amount, 0);
  const totalPending  = totalExpenses - totalPaid;

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
