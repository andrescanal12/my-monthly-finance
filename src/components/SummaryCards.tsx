import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Wallet, CreditCard } from "lucide-react";

interface SummaryCardsProps {
  income: number;
  totalExpenses: number;
  totalPending: number;
  freeAmount: number;
}

const cards = [
  { key: "income", label: "Ingresos", icon: TrendingUp, colorClass: "text-success" },
  { key: "expenses", label: "Total gastos", icon: CreditCard, colorClass: "text-destructive" },
  { key: "pending", label: "Pendiente", icon: TrendingDown, colorClass: "text-warning" },
  { key: "free", label: "Dinero libre", icon: Wallet, colorClass: "text-success" },
] as const;

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}

export default function SummaryCards({ income, totalExpenses, totalPending, freeAmount }: SummaryCardsProps) {
  const values: Record<string, number> = {
    income,
    expenses: totalExpenses,
    pending: totalPending,
    free: freeAmount,
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card, i) => {
        const Icon = card.icon;
        const value = values[card.key];
        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="liquid-glass rounded-xl p-4 flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg bg-secondary ${card.colorClass}`}>
                <Icon size={16} />
              </div>
              <span className="text-muted-foreground text-xs font-medium">{card.label}</span>
            </div>
            <span className={`text-lg font-bold ${card.key === "free" ? (value >= 0 ? "text-success" : "text-destructive") : "text-foreground"}`}>
              {formatCurrency(value)}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
