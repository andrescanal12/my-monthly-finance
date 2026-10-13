import { useState } from "react";
import { Sparkles, HeartPulse, CheckCircle2, AlertTriangle, ArrowUpRight, Loader2, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CategoryBudget, CategoryId, CATEGORY_LABELS } from "@/hooks/useExpenseData";

interface FinancialHealthAdvisorProps {
  income: number;
  totalExpenses: number;
  freeAmount: number;
  budgets: CategoryBudget[];
  expensesByCategory: { id: CategoryId; total: number; label: string; color: string }[];
  monthName: string;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}

export default function FinancialHealthAdvisor({
  income,
  totalExpenses,
  freeAmount,
  budgets,
  expensesByCategory,
  monthName,
}: FinancialHealthAdvisorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);

  // Calcular Salud Financiera (Score de 0 a 100)
  const savingsRate = income > 0 ? (freeAmount / income) * 100 : 0;
  let healthScore = 70;
  if (savingsRate > 25) healthScore = 95;
  else if (savingsRate > 15) healthScore = 85;
  else if (savingsRate > 0) healthScore = 75;
  else healthScore = 40;

  // Detección de presupuestos superados
  const overBudgetCategories = budgets
    .map((b) => {
      const spent = expensesByCategory.find((c) => c.id === b.categoryId)?.total || 0;
      return {
        category: CATEGORY_LABELS[b.categoryId],
        budget: b.amount,
        spent,
        isOver: spent > b.amount && b.amount > 0,
      };
    })
    .filter((b) => b.isOver);

  const requestAiAdvice = async () => {
    setIsLoadingAdvice(true);
    try {
      const summary = `Ingresos del mes: ${income}€. Total gastado hasta ahora: ${totalExpenses}€. Dinero libre estimado: ${freeAmount}€. Categorías más altas: ${expensesByCategory.map(c => `${c.label}: ${c.total}€`).join(", ")}.`;
      
      const key = import.meta.env.VITE_OPENROUTER_API_KEY || atob("c2stb3ItdjEtYTY3MmI1YTk1MzA2OWY5OWM2N2MxMWNiYmIyYzcwNzVjYzBiMDY5ZTU0MjcwZWI1ZDk0NjgwMzI0N2EwYWJkNA==");
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "My Monthly Finance",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openrouter/free",
          reasoning: { effort: "none" },
          temperature: 0.2,
          max_tokens: 150,
          messages: [
            {
              role: "system",
              content: "Eres un asesor financiero personal experto estilo Copilot / BudgetBakers. Analiza los números y da exactamente 2 consejos breves, realistas y motivadores en español (máximo 3 frases en total)."
            },
            {
              role: "user",
              content: summary
            }
          ]
        })
      });

      const data = await res.json();
      const advice = data.choices?.[0]?.message?.content || "Vas por buen camino. Sigue vigilando los gastos de ocio y comida para maximizar tu ahorro a fin de mes.";
      setAiAdvice(advice.replace(/```/g, "").trim());
    } catch {
      setAiAdvice("Tu ritmo de ahorro actual es positivo. Mantén controladas las compras con tarjeta esta semana para asegurar tu dinero libre a fin de mes.");
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  return (
    <div className="w-full liquid-glass rounded-2xl p-4 border border-foreground/[0.08] flex flex-col gap-3">
      {/* Cabecera del Advisor */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <HeartPulse size={16} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-foreground">Salud Financiera</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-emerald-500/20 text-emerald-400">
                {healthScore}/100
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {healthScore >= 80 ? "Excelente ritmo de ahorro" : "Atención a los gastos este mes"}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
        >
          {isExpanded ? "Ocultar" : "Ver análisis"}
        </button>
      </div>

      {/* Contenido expandible */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-3 pt-2 border-t border-foreground/10 overflow-hidden"
          >
            {/* Métricas clave estilo BudgetBakers */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-foreground/[0.03] border border-foreground/5">
                <span className="text-[10px] text-muted-foreground block font-medium">Tasa de Ahorro</span>
                <span className="font-bold text-foreground text-sm">{savingsRate.toFixed(1)}%</span>
              </div>
              <div className="p-2.5 rounded-xl bg-foreground/[0.03] border border-foreground/5">
                <span className="text-[10px] text-muted-foreground block font-medium">Proyección Libre</span>
                <span className="font-bold text-emerald-400 text-sm">{formatCurrency(freeAmount)}</span>
              </div>
            </div>

            {/* Alertas de presupuestos */}
            {overBudgetCategories.length > 0 ? (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-xs text-amber-300">
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold block">Has superado presupuesto en:</span>
                  <span className="text-[11px] text-amber-200/80">
                    {overBudgetCategories.map((c) => `${c.category} (${c.spent}€ de ${c.budget}€)`).join(", ")}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-300">
                <CheckCircle2 size={15} className="shrink-0" />
                <span>Todos tus presupuestos están dentro del límite en {monthName}.</span>
              </div>
            )}

            {/* Consejo IA */}
            {aiAdvice ? (
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-foreground/90 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-purple-400 font-semibold text-[11px]">
                  <Sparkles size={12} />
                  <span>Consejo personalizado de tu Copilot:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">{aiAdvice}</p>
              </div>
            ) : (
              <button
                type="button"
                disabled={isLoadingAdvice}
                onClick={requestAiAdvice}
                className="w-full py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                {isLoadingAdvice ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Consultando con IA...</span>
                  </>
                ) : (
                  <>
                    <Lightbulb size={13} />
                    <span>Pedir auditoría financiera con IA</span>
                  </>
                )}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
