import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Wifi, ShieldCheck, Sparkles, Settings2, Check, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface BankCardHeroProps {
  income: number;
  totalExpenses: number;
  freeAmount: number;
  monthName: string;
}

interface CardSettings {
  bankName: string;
  lastDigits: string;
  cardHolder: string;
  cardType: string;
  theme: "navy" | "black" | "emerald" | "purple";
}

const DEFAULT_SETTINGS: CardSettings = {
  bankName: "BBVA",
  lastDigits: "4821",
  cardHolder: "Andrés Canal",
  cardType: "Tarjeta Débito",
  theme: "navy",
};

const THEMES = {
  navy: "linear-gradient(135deg, #0b1528 0%, #102347 50%, #071124 100%)",
  black: "linear-gradient(135deg, #18181b 0%, #27272a 50%, #09090b 100%)",
  emerald: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #022c22 100%)",
  purple: "linear-gradient(135deg, #3b0764 0%, #581c87 50%, #2e1065 100%)",
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}

export default function BankCardHero({ income, totalExpenses, freeAmount, monthName }: BankCardHeroProps) {
  const isNegative = freeAmount < 0;
  const [hideBalance, setHideBalance] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [cardSettings, setCardSettings] = useState<CardSettings>(() => {
    try {
      const saved = localStorage.getItem("my_finance_card_settings");
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [formValues, setFormValues] = useState<CardSettings>(cardSettings);

  const handleSave = () => {
    setCardSettings(formValues);
    try {
      localStorage.setItem("my_finance_card_settings", JSON.stringify(formValues));
    } catch (e) {
      console.error(e);
    }
    setIsDialogOpen(false);
  };

  return (
    <div className="w-full">
      {/* Tarjeta estilo Wallet by BudgetBakers / Metal Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full relative overflow-hidden rounded-3xl p-6 text-white shadow-2xl border border-white/10 group"
        style={{
          background: THEMES[cardSettings.theme] || THEMES.navy,
        }}
      >
        {/* Glow de fondo decorativo */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Fila superior: Banco + Chip + Contactless + Configurar */}
        <div className="flex items-center justify-between mb-5 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="px-2.5 py-1 rounded-md bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-black tracking-widest text-white uppercase">
              {cardSettings.bankName || "BBVA"}
            </div>
            <span className="text-[10px] font-medium text-white/60 tracking-wider">WALLET SYNC</span>
          </div>

          <div className="flex items-center gap-2 text-white/70">
            <button
              onClick={() => setHideBalance(!hideBalance)}
              title={hideBalance ? "Mostrar saldos" : "Ocultar saldos"}
              className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white"
            >
              {hideBalance ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <button
                  title="Personalizar tarjeta"
                  className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                >
                  <Settings2 size={16} />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-zinc-950 border border-zinc-800 text-white">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold flex items-center gap-2">
                    💳 Configurar tu Tarjeta
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-3 text-sm">
                  <div>
                    <Label className="text-zinc-300">Nombre del Banco o Entidad</Label>
                    <Input
                      value={formValues.bankName}
                      onChange={(e) => setFormValues({ ...formValues, bankName: e.target.value })}
                      placeholder="BBVA, Santander, CaixaBank, Revolut..."
                      className="bg-zinc-900 border-zinc-700 text-white mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-zinc-300">Últimos 4 dígitos</Label>
                      <Input
                        value={formValues.lastDigits}
                        onChange={(e) => setFormValues({ ...formValues, lastDigits: e.target.value.slice(-4) })}
                        maxLength={4}
                        placeholder="4821"
                        className="bg-zinc-900 border-zinc-700 text-white font-mono mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-300">Tipo de tarjeta</Label>
                      <Input
                        value={formValues.cardType}
                        onChange={(e) => setFormValues({ ...formValues, cardType: e.target.value })}
                        placeholder="Débito, Crédito..."
                        className="bg-zinc-900 border-zinc-700 text-white mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-zinc-300">Nombre del Titular</Label>
                    <Input
                      value={formValues.cardHolder}
                      onChange={(e) => setFormValues({ ...formValues, cardHolder: e.target.value })}
                      placeholder="Tu nombre"
                      className="bg-zinc-900 border-zinc-700 text-white mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-zinc-300 mb-1.5 block">Estilo visual de la tarjeta</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {(["navy", "black", "emerald", "purple"] as const).map((th) => (
                        <button
                          key={th}
                          type="button"
                          onClick={() => setFormValues({ ...formValues, theme: th })}
                          className={`h-9 rounded-lg border flex items-center justify-center capitalize text-xs font-semibold transition-all ${
                            formValues.theme === th
                              ? "border-white ring-2 ring-blue-500/50"
                              : "border-zinc-700 opacity-60 hover:opacity-100"
                          }`}
                          style={{ background: THEMES[th] }}
                        >
                          {formValues.theme === th && <Check size={14} className="text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleSave}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold mt-2"
                  >
                    Guardar Tarjeta
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Wifi size={16} className="rotate-90" />
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
            {hideBalance ? "•••••• €" : formatCurrency(freeAmount)}
          </div>
        </div>

        {/* Fila inferior: Número enmascarado + Ingresos y Gastos */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-white/50 block font-semibold">Ingresos</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-0.5">
                <TrendingUp size={12} /> {hideBalance ? "••••" : formatCurrency(income)}
              </span>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div>
              <span className="text-[9px] uppercase tracking-wider text-white/50 block font-semibold">Gastos Totales</span>
              <span className="text-xs font-bold text-red-400 flex items-center gap-0.5">
                <TrendingDown size={12} /> {hideBalance ? "••••" : formatCurrency(totalExpenses)}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-mono tracking-[3px] text-white/80 font-bold block">
              •••• {cardSettings.lastDigits || "4821"}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-white/50">
              {cardSettings.cardType || "Débito"} {cardSettings.cardHolder ? `• ${cardSettings.cardHolder}` : ""}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
