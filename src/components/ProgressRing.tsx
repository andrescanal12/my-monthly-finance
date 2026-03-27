import { motion } from "framer-motion";

interface ProgressRingProps {
  paid: number;
  total: number;
}

export default function ProgressRing({ paid, total }: ProgressRingProps) {
  const pct = total > 0 ? Math.min((paid / total) * 100, 100) : 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
          <motion.circle
            cx="60" cy="60" r={radius} fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{Math.round(pct)}%</span>
          <span className="text-[10px] text-muted-foreground">pagado</span>
        </div>
      </div>
    </div>
  );
}
