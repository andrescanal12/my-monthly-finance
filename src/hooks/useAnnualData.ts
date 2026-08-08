import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Expense, CategoryId, MONTHS } from "./useExpenseData";

const FAMILY_ID = "canal-family";
const YEAR = 2026;

export interface MonthlySummary {
  monthIndex: number;
  monthName: string;
  income: number;
  totalExpenses: number;
  freeAmount: number;
  expenses: Expense[];
}

export function useAnnualData() {
  // Fetch all income for the year
  const { data: annualIncome = [], isLoading: loadingIncome } = useQuery({
    queryKey: ["annual-income", YEAR],
    queryFn: async () => {
      const q = query(
        collection(db, "month_income"),
        where("family_id", "==", FAMILY_ID),
        where("year", "==", YEAR)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data());
    },
  });

  // Fetch all expenses for the year
  const { data: annualExpenses = [], isLoading: loadingExpenses } = useQuery({
    queryKey: ["annual-expenses", YEAR],
    queryFn: async () => {
      const q = query(
        collection(db, "expenses"),
        where("family_id", "==", FAMILY_ID),
        where("year", "==", YEAR)
      );
      const snapshot = await getDocs(q);
      
      const docs = snapshot.docs.map((doc) => {
        const e = doc.data();
        return {
          id:          doc.id,
          name:        e.name,
          amount:      Number(e.amount),
          paid:        e.paid,
          isRecurring: e.is_recurring,
          categoryId:  e.category_id as CategoryId,
          monthIndex:  e.month_index,
          createdAt:   e.created_at
        };
      });
      return docs.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    },
  });

  const isLoading = loadingIncome || loadingExpenses;

  // Process data into monthly summaries
  const monthlyData: MonthlySummary[] = MONTHS.map((monthName, index) => {
    // Find income for this month, default to 1955.15 if not found in db
    const monthIncomeRec = annualIncome.find(inc => inc.month_index === index);
    const income = monthIncomeRec ? Number(monthIncomeRec.amount) : 1955.15;

    // Filter expenses for this month
    const expensesForMonth = annualExpenses.filter(exp => exp.monthIndex === index);
    const totalExpenses = expensesForMonth.reduce((sum, exp) => sum + exp.amount, 0);

    return {
      monthIndex: index,
      monthName,
      income,
      totalExpenses,
      freeAmount: income - totalExpenses,
      expenses: expensesForMonth as Expense[]
    };
  });

  // Optional: calculating year totals
  const totalYearIncome = monthlyData.reduce((sum, m) => sum + m.income, 0);
  const totalYearExpenses = monthlyData.reduce((sum, m) => sum + m.totalExpenses, 0);
  const totalYearFree = totalYearIncome - totalYearExpenses;

  return {
    isLoading,
    monthlyData,
    totalYearIncome,
    totalYearExpenses,
    totalYearFree
  };
}
