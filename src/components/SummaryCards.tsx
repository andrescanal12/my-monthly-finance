import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Wallet, CreditCard } from "lucide-react";

interface SummaryCardsProps {
  income: number;
  totalExpenses: number;
  totalPending: number;
  freeAmount: number;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.5, delay, ease: "easeOut" as const },
});

const cards = [
  { key: "income", label: "Ingresos", icon: TrendingUp, accent: false },
  { key: "expenses", label: "Total gastos", icon: CreditCard, accent: false },
  { key: "pending", label: "Pendiente", icon: TrendingDown, accent: false },
  { key: "free", label: "Dinero libre", icon: Wallet, accent: true },
] as const;

export default function SummaryCards({ income, totalExpenses, totalPending, freeAmount }: SummaryCardsProps) {
  const values: Record<string, number> = { income, expenses: totalExpenses, pending: totalPending, free: freeAmount };

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card, i) => {
        const Icon = card.icon;
        const value = values[card.key];
        const isNegative = card.key === "free" && value < 0;
        return (
          <motion.div
            key={card.key}
            {...fadeUp(i * 0.1)}
            className="liquid-glass rounded-2xl p-5 flex flex-col gap-3 group hover:bg-foreground/[0.03] transition-colors duration-500"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-foreground/[0.06] flex items-center justify-center">
                <Icon size={15} className="text-foreground/60" />
              </div>
              <span className="text-muted-foreground text-[11px] font-medium uppercase tracking-[1px]">{card.label}</span>
            </div>
            <span className={`text-xl font-semibold tracking-[-0.5px] ${
              isNegative ? "text-destructive" : "text-foreground"
            }`}>
              {formatCurrency(value)}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
