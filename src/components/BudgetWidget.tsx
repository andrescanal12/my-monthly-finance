import { useState } from "react";
import { CategoryId, CATEGORY_LABELS, CATEGORY_COLORS, CategoryBudget } from "@/hooks/useExpenseData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Target, Pencil } from "lucide-react";

interface BudgetWidgetProps {
  budgets: CategoryBudget[];
  expensesByCategory: { id: CategoryId; total: number; label: string; color: string }[];
  onSetBudget: (categoryId: CategoryId, amount: number) => void;
}

export default function BudgetWidget({ budgets, expensesByCategory, onSetBudget }: BudgetWidgetProps) {
  const [editingCategory, setEditingCategory] = useState<CategoryId | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const categories = Object.keys(CATEGORY_LABELS) as CategoryId[];

  const handleSave = () => {
    if (editingCategory && editAmount) {
      onSetBudget(editingCategory, Number(editAmount));
      setIsDialogOpen(false);
    }
  };

  const openEdit = (catId: CategoryId, currentBudget: number) => {
    setEditingCategory(catId);
    setEditAmount(currentBudget ? currentBudget.toString() : "");
    setIsDialogOpen(true);
  };

  // Only show categories that have a budget set, or if none, show a placeholder
  const activeBudgets = budgets.filter(b => b.amount > 0);

  return (
    <Card className="border-border/50 bg-background/50 backdrop-blur-md shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Target size={16} className="text-primary" />
          Presupuestos
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs">
              <Pencil size={12} className="mr-2" />
              Editar
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Gestionar Presupuestos</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              {categories.map((catId) => {
                const currentBudget = budgets.find(b => b.categoryId === catId)?.amount || 0;
                return (
                  <div key={catId} className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium flex-1">{CATEGORY_LABELS[catId]}</span>
                    <Input
                      type="number"
                      placeholder="0"
                      className="w-24 text-right"
                      value={editingCategory === catId ? editAmount : (currentBudget || "")}
                      onFocus={() => {
                        setEditingCategory(catId);
                        setEditAmount(currentBudget ? currentBudget.toString() : "");
                      }}
                      onChange={(e) => {
                        setEditingCategory(catId);
                        setEditAmount(e.target.value);
                      }}
                      onBlur={() => {
                        if (editingCategory === catId && editAmount !== currentBudget.toString()) {
                          onSetBudget(catId, Number(editAmount));
                        }
                      }}
                    />
                    <span className="text-sm text-muted-foreground w-4">€</span>
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {activeBudgets.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            No has definido ningún límite mensual. Usa el botón "Editar" para empezar.
          </p>
        ) : (
          activeBudgets.map(budget => {
            const spent = expensesByCategory.find(e => e.id === budget.categoryId)?.total || 0;
            const percentage = Math.min(100, Math.round((spent / budget.amount) * 100));
            const color = CATEGORY_COLORS[budget.categoryId];
            
            // Determinar color de alerta
            let alertColor = "bg-primary";
            if (percentage >= 100) alertColor = "bg-destructive";
            else if (percentage >= 80) alertColor = "bg-orange-500";
            else alertColor = "bg-emerald-500";

            return (
              <div key={budget.categoryId} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    {CATEGORY_LABELS[budget.categoryId]}
                  </span>
                  <span className="text-muted-foreground">
                    <span className={percentage >= 100 ? "text-destructive font-bold" : "text-foreground"}>
                      {spent.toFixed(2)}€
                    </span>{" "}
                    / {budget.amount.toFixed(2)}€
                  </span>
                </div>
                <Progress 
                  value={percentage} 
                  className="h-2"
                  indicatorClassName={alertColor}
                />
                <p className="text-[10px] text-muted-foreground text-right mt-0.5">
                  {budget.amount - spent >= 0 
                    ? `Te quedan ${(budget.amount - spent).toFixed(2)}€` 
                    : `Te has pasado por ${(spent - budget.amount).toFixed(2)}€`}
                </p>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
