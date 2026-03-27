import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useExpenseData } from "@/hooks/useExpenseData";
import MonthSelector from "@/components/MonthSelector";
import SummaryCards from "@/components/SummaryCards";
import ProgressRing from "@/components/ProgressRing";
import ExpenseList from "@/components/ExpenseList";
import AddExpenseForm from "@/components/AddExpenseForm";
import IncomeEditor from "@/components/IncomeEditor";
import { Wallet } from "lucide-react";

const VIDEO_URL = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260308_114720_3dabeb9e-2c39-4907-b747-bc3544e2d5b7.mp4";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { duration: 0.6, delay, ease: "easeOut" as const },
});

export default function Index() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const {
    selectedMonth, setSelectedMonth, monthData, MONTHS,
    totalExpenses, totalPaid, totalPending, freeAmount,
    togglePaid, addExpense, removeExpense, setIncome,
  } = useExpenseData();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let raf: number;
    const fade = () => {
      if (!video.duration) { raf = requestAnimationFrame(fade); return; }
      const t = video.currentTime;
      const d = video.duration;
      if (t < 0.8) video.style.opacity = String(Math.min(t / 0.8, 0.35));
      else if (t > d - 0.8) video.style.opacity = String(Math.max(((d - t) / 0.8) * 0.35, 0));
      else video.style.opacity = "0.35";
      raf = requestAnimationFrame(fade);
    };
    raf = requestAnimationFrame(fade);
    const onEnded = () => {
      video.style.opacity = "0";
      setTimeout(() => { video.currentTime = 0; video.play(); }, 150);
    };
    video.addEventListener("ended", onEnded);
    return () => { cancelAnimationFrame(raf); video.removeEventListener("ended", onEnded); };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background Video */}
      <video
        ref={videoRef}
        autoPlay muted playsInline
        className="fixed inset-0 w-full h-full object-cover pointer-events-none"
        style={{ opacity: 0 }}
      >
        <source src={VIDEO_URL} type="video/mp4" />
      </video>

      {/* Overlays */}
      <div className="fixed inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />
      <div className="fixed inset-0 bg-background/60 pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen pb-12">
        {/* Header */}
        <motion.div {...fadeUp(0)} className="px-5 pt-14 pb-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-2xl liquid-glass-strong flex items-center justify-center">
              <Wallet size={20} className="text-foreground/80" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground tracking-[-0.5px]">
                Mis <span className="font-serif-accent text-2xl">Gastos</span>
              </h1>
              <p className="text-[11px] text-muted-foreground uppercase tracking-[2px]">2026</p>
            </div>
          </div>

          <MonthSelector months={MONTHS} selected={selectedMonth} onSelect={setSelectedMonth} />
        </motion.div>

        {/* Divider */}
        <div className="mx-5 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent mb-6" />

        {/* Content */}
        <div className="px-5 flex flex-col gap-6">
          {/* Progress + Income */}
          <motion.div {...fadeUp(0.15)} className="flex items-center justify-between">
            <ProgressRing paid={totalPaid} total={totalExpenses} />
            <IncomeEditor income={monthData.income} onSetIncome={setIncome} />
          </motion.div>

          <motion.div {...fadeUp(0.25)}>
            <SummaryCards
              income={monthData.income}
              totalExpenses={totalExpenses}
              totalPending={totalPending}
              freeAmount={freeAmount}
            />
          </motion.div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />

          <motion.div {...fadeUp(0.35)}>
            <AddExpenseForm onAdd={addExpense} />
          </motion.div>

          <motion.div {...fadeUp(0.4)}>
            <ExpenseList
              expenses={monthData.expenses}
              onTogglePaid={togglePaid}
              onRemove={removeExpense}
            />
          </motion.div>
        </div>

        {/* Bottom spacer with footer */}
        <div className="mt-12 px-5">
          <div className="h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent mb-4" />
          <p className="text-center text-[10px] text-muted-foreground/40 uppercase tracking-[2px]">
            © 2026 Expense Tracker
          </p>
        </div>
      </div>
    </div>
  );
}
