import { useState } from "react";

export type CategoryId = "comida" | "transporte" | "ocio" | "vivienda" | "educacion" | "otros";

export const CATEGORY_COLORS: Record<CategoryId, string> = {
  comida: "#38bdf8",
  transporte: "#818cf8",
  ocio: "#c084fc",
  vivienda: "#f472b6",
  educacion: "#fbbf24",
  otros: "#9ca3af",
};

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  comida: "Comida",
  transporte: "Transporte",
  ocio: "Ocio",
  vivienda: "Vivienda",
  educacion: "Educación",
  otros: "Otros",
};

export interface Expense {
  id: string;
  name: string;
  amount: number;
  paid: boolean;
  isRecurring: boolean;
  categoryId: CategoryId;
}

const DEFAULT_RECURRING: Omit<Expense, "id" | "paid">[] = [
  { name: "Diezmo", amount: 190, isRecurring: true, categoryId: "otros" },
  { name: "Alquiler", amount: 750, isRecurring: true, categoryId: "vivienda" },
  { name: "Master", amount: 189, isRecurring: true, categoryId: "educacion" },
  { name: "Suegrita Iris", amount: 70, isRecurring: true, categoryId: "otros" },
  { name: "Internet", amount: 20, isRecurring: true, categoryId: "vivienda" },
  { name: "Cuenta Google", amount: 5, isRecurring: true, categoryId: "ocio" },
  { name: "Comida (En efectivo)", amount: 240, isRecurring: true, categoryId: "comida" },
  { name: "Luz", amount: 50, isRecurring: true, categoryId: "vivienda" },
  { name: "Cuota coche", amount: 228.15, isRecurring: true, categoryId: "transporte" },
  { name: "Gasolina coche", amount: 70, isRecurring: true, categoryId: "transporte" },
];

export const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

type MonthData = {
  income: number;
  expenses: Expense[];
};

type YearData = Record<number, MonthData>;

const STORAGE_KEY = "expenses-2026-v5";
const DEFAULT_INCOME = 1955.15;

function createId() {
  return Math.random().toString(36).slice(2, 10);
}

function getDefaultMonthData(): MonthData {
  return {
    income: DEFAULT_INCOME,
    expenses: DEFAULT_RECURRING.map((e) => ({
      ...e,
      id: createId(),
      paid: false,
    })),
  };
}

function getInitialData(): YearData {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);

  // Build a fresh year with all 12 months pre-filled
  const data: YearData = {};
  for (let m = 0; m < 12; m++) {
    data[m] = getDefaultMonthData();
  }
  return data;
}

export function useExpenseData() {
  const [yearData, setYearData] = useState<YearData>(getInitialData);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return now.getFullYear() === 2026 ? now.getMonth() : 0;
  });

  const save = (data: YearData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setYearData(data);
  };

  // If the month hasn't been initialised yet, seed it with defaults
  const monthData = yearData[selectedMonth] ?? getDefaultMonthData();

  const totalExpenses = monthData.expenses.reduce((s, e) => s + e.amount, 0);
  const totalPaid = monthData.expenses.filter((e) => e.paid).reduce((s, e) => s + e.amount, 0);
  const totalPending = totalExpenses - totalPaid;
  const freeAmount = monthData.income - totalExpenses;

  const expensesByCategory = Object.keys(CATEGORY_LABELS).map((catKey) => {
    const id = catKey as CategoryId;
    const catExpenses = monthData.expenses.filter((e) => e.categoryId === id);
    const total = catExpenses.reduce((s, e) => s + e.amount, 0);
    return {
      id,
      label: CATEGORY_LABELS[id],
      color: CATEGORY_COLORS[id],
      total,
      percentage: totalExpenses > 0 ? Math.round((total / totalExpenses) * 100) : 0,
    };
  }).filter((c) => c.total > 0).sort((a, b) => b.total - a.total);

  const togglePaid = (id: string) => {
    const newData = { ...yearData };
    newData[selectedMonth] = {
      ...monthData,
      expenses: monthData.expenses.map((e) =>
        e.id === id ? { ...e, paid: !e.paid } : e
      ),
    };
    save(newData);
  };

  const addExpense = (name: string, amount: number, categoryId: CategoryId = "otros") => {
    const newData = { ...yearData };
    newData[selectedMonth] = {
      ...monthData,
      expenses: [
        ...monthData.expenses,
        { id: createId(), name, amount, paid: false, isRecurring: false, categoryId },
      ],
    };
    save(newData);
  };

  const removeExpense = (id: string) => {
    const newData = { ...yearData };
    newData[selectedMonth] = {
      ...monthData,
      expenses: monthData.expenses.filter((e) => e.id !== id),
    };
    save(newData);
  };

  const setIncome = (income: number) => {
    const newData = { ...yearData };
    newData[selectedMonth] = { ...monthData, income };
    save(newData);
  };

  const updateExpense = (id: string, name: string, amount: number) => {
    const newData = { ...yearData };
    newData[selectedMonth] = {
      ...monthData,
      expenses: monthData.expenses.map((e) =>
        e.id === id ? { ...e, name, amount } : e
      ),
    };
    save(newData);
  };

  return {
    selectedMonth,
    setSelectedMonth,
    monthData,
    monthName: MONTHS[selectedMonth],
    totalExpenses,
    totalPaid,
    totalPending,
    freeAmount,
    expensesByCategory,
    togglePaid,
    addExpense,
    removeExpense,
    updateExpense,
    setIncome,
    MONTHS,
  };
}
