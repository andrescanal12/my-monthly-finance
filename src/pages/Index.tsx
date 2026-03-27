import { useEffect, useRef } from "react";
import { useExpenseData } from "@/hooks/useExpenseData";
import MonthSelector from "@/components/MonthSelector";
import SummaryCards from "@/components/SummaryCards";
import ProgressRing from "@/components/ProgressRing";
import ExpenseList from "@/components/ExpenseList";
import AddExpenseForm from "@/components/AddExpenseForm";
import IncomeEditor from "@/components/IncomeEditor";
import { Wallet } from "lucide-react";

const VIDEO_URL = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260308_114720_3dabeb9e-2c39-4907-b747-bc3544e2d5b7.mp4";

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
      if (t < 0.5) video.style.opacity = String(t / 0.5);
      else if (t > d - 0.5) video.style.opacity = String((d - t) / 0.5);
      else video.style.opacity = "1";
      raf = requestAnimationFrame(fade);
    };
    raf = requestAnimationFrame(fade);

    const onEnded = () => {
      video.style.opacity = "0";
      setTimeout(() => { video.currentTime = 0; video.play(); }, 100);
    };
    video.addEventListener("ended", onEnded);
    return () => { cancelAnimationFrame(raf); video.removeEventListener("ended", onEnded); };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Video */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover"
        style={{ opacity: 0 }}
      >
        <source src={VIDEO_URL} type="video/mp4" />
      </video>

      {/* Overlay gradients */}
      <div className="fixed inset-0 bg-gradient-to-b from-background via-background/70 to-background pointer-events-none" />
      <div className="fixed inset-0 bg-background/50 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 min-h-screen pb-8">
        {/* Header */}
        <div className="px-5 pt-12 pb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center backdrop-blur-md">
              <Wallet size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Mis Gastos 2026</h1>
              <p className="text-xs text-muted-foreground">Gestión mensual de gastos</p>
            </div>
          </div>

          <MonthSelector months={MONTHS} selected={selectedMonth} onSelect={setSelectedMonth} />
        </div>

        <div className="px-5 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <ProgressRing paid={totalPaid} total={totalExpenses} />
            <div className="flex flex-col items-end gap-1">
              <IncomeEditor income={monthData.income} onSetIncome={setIncome} />
            </div>
          </div>

          <SummaryCards
            income={monthData.income}
            totalExpenses={totalExpenses}
            totalPending={totalPending}
            freeAmount={freeAmount}
          />

          <AddExpenseForm onAdd={addExpense} />

          <ExpenseList
            expenses={monthData.expenses}
            onTogglePaid={togglePaid}
            onRemove={removeExpense}
          />
        </div>
      </div>
    </div>
  );
}
