import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
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
      const { data, error } = await supabase
        .from("month_income")
        .select("*")
        .eq("family_id", FAMILY_ID)
        .eq("year", YEAR);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch all expenses for the year
  const { data: annualExpenses = [], isLoading: loadingExpenses } = useQuery({
    queryKey: ["annual-expenses", YEAR],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("family_id", FAMILY_ID)
        .eq("year", YEAR)
        .order("created_at", { ascending: true });
      if (error) throw error;
      
      return (data || []).map((e) => ({
        id:          e.id,
        name:        e.name,
        amount:      Number(e.amount),
        paid:        e.paid,
        isRecurring: e.is_recurring,
        categoryId:  e.category_id as CategoryId,
        monthIndex:  e.month_index,
      }));
    },
  });

  const isLoading = loadingIncome || loadingExpenses;

  // Process data into monthly summaries
  const monthlyData: MonthlySummary[] = MONTHS.map((monthName, index) => {
    // Find income for this month, default to 1955.15 if not found in db (though we seeded it)
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
      expenses: expensesForMonth
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
