import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Wifi, ShieldCheck, Sparkles } from "lucide-react";

interface BankCardHeroProps {
  income: number;
  totalExpenses: number;
  freeAmount: number;
  monthName: string;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}

export default function BankCardHero({ income, totalExpenses, freeAmount, monthName }: BankCardHeroProps) {
  const isNegative = freeAmount < 0;

  return (
    <div className="w-full">
      {/* Tarjeta estilo Wallet by BudgetBakers / BBVA Metal Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full relative overflow-hidden rounded-3xl p-6 text-white shadow-2xl border border-white/10"
        style={{
          background: "linear-gradient(135deg, #0b1528 0%, #102347 50%, #071124 100%)",
        }}
      >
        {/* Glow de fondo decorativo */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Fila superior: Banco + Chip + Contactless */}
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="px-2.5 py-1 rounded-md bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-black tracking-widest text-white">
              BBVA
            </div>
            <span className="text-[11px] font-medium text-white/60 tracking-wider">WALLET SYNC</span>
          </div>
          <div className="flex items-center gap-2 text-white/70">
            <Wifi size={18} className="rotate-90" />
            <ShieldCheck size={16} className="text-emerald-400" />
          </div>
        </div>

        {/* Chip EMV dorado realista */}
        <div className="w-11 h-8 rounded-md bg-gradient-to-tr from-amber-300 via-yellow-200 to-amber-400 border border-amber-400/50 mb-5 shadow-inner relative overflow-hidden flex items-center justify-center">
          <div className="w-full h-[1px] bg-amber-600/40 absolute top-2.5" />
          <div className="w-full h-[1px] bg-amber-600/40 absolute bottom-2.5" />
          <div className="h-full w-[1px] bg-amber-600/40 absolute left-3.5" />
          <div className="h-full w-[1px] bg-amber-600/40 absolute right-3.5" />
        </div>

        {/* Saldo Libre / Balance Principal */}
        <div className="mb-6 relative z-10">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium uppercase tracking-[1.5px] text-white/60">
              Dinero Libre ({monthName})
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-semibold">
              <Sparkles size={10} /> En tiempo real
            </span>
          </div>
          <div className={`text-3xl font-extrabold tracking-tight ${isNegative ? "text-red-400" : "text-white"}`}>
            {formatCurrency(freeAmount)}
          </div>
        </div>

        {/* Fila inferior: Número enmascarado + Ingresos y Gastos */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-white/50 block font-semibold">Ingresos</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-0.5">
                <TrendingUp size={12} /> {formatCurrency(income)}
              </span>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div>
              <span className="text-[9px] uppercase tracking-wider text-white/50 block font-semibold">Gastos Totales</span>
              <span className="text-xs font-bold text-red-400 flex items-center gap-0.5">
                <TrendingDown size={12} /> {formatCurrency(totalExpenses)}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-mono tracking-[3px] text-white/70 font-semibold block">•••• 4289</span>
            <span className="text-[9px] uppercase tracking-wider text-white/40">Tarjeta Débito</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
