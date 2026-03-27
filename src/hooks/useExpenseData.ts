import { useState } from "react";

export interface Expense {
  id: string;
  name: string;
  amount: number;
  paid: boolean;
  isRecurring: boolean;
}

const DEFAULT_RECURRING: Omit<Expense, "id" | "paid">[] = [
  { name: "Alquiler", amount: 800, isRecurring: true },
  { name: "Electricidad", amount: 65, isRecurring: true },
  { name: "Agua", amount: 30, isRecurring: true },
  { name: "Internet", amount: 45, isRecurring: true },
  { name: "Gas", amount: 35, isRecurring: true },
  { name: "Seguro", amount: 120, isRecurring: true },
  { name: "Teléfono", amount: 25, isRecurring: true },
  { name: "Suscripciones", amount: 40, isRecurring: true },
  { name: "Supermercado", amount: 350, isRecurring: true },
  { name: "Transporte", amount: 60, isRecurring: true },
];

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

type MonthData = {
  income: number;
  expenses: Expense[];
};

type YearData = Record<number, MonthData>;

function createId() {
  return Math.random().toString(36).slice(2, 10);
}

function getInitialData(): YearData {
  const saved = localStorage.getItem("expenses-2026");
  if (saved) return JSON.parse(saved);
  
  const data: YearData = {};
  for (let m = 0; m < 12; m++) {
    data[m] = {
      income: 2500,
      expenses: DEFAULT_RECURRING.map((e) => ({
        ...e,
        id: createId(),
        paid: false,
      })),
    };
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
    localStorage.setItem("expenses-2026", JSON.stringify(data));
    setYearData(data);
  };

  const monthData = yearData[selectedMonth];
  const totalExpenses = monthData.expenses.reduce((s, e) => s + e.amount, 0);
  const totalPaid = monthData.expenses.filter((e) => e.paid).reduce((s, e) => s + e.amount, 0);
  const totalPending = totalExpenses - totalPaid;
  const freeAmount = monthData.income - totalExpenses;

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

  const addExpense = (name: string, amount: number) => {
    const newData = { ...yearData };
    newData[selectedMonth] = {
      ...monthData,
      expenses: [
        ...monthData.expenses,
        { id: createId(), name, amount, paid: false, isRecurring: false },
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

  return {
    selectedMonth,
    setSelectedMonth,
    monthData,
    monthName: MONTHS[selectedMonth],
    totalExpenses,
    totalPaid,
    totalPending,
    freeAmount,
    togglePaid,
    addExpense,
    removeExpense,
    setIncome,
    MONTHS,
  };
}
