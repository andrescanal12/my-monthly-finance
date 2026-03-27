import { motion } from "framer-motion";

interface ProgressRingProps {
  paid: number;
  total: number;
}

export default function ProgressRing({ paid, total }: ProgressRingProps) {
  const pct = total > 0 ? Math.min((paid / total) * 100, 100) : 0;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative w-36 h-36 flex items-center justify-center neon-ring">
      {/* Glow behind */}
      <div className="absolute inset-2 rounded-full bg-foreground/[0.02] blur-xl" />
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="5" opacity="0.3" />
        <motion.circle
          cx="60" cy="60" r={radius} fill="none"
          stroke="hsl(var(--foreground))"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          key={pct}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-3xl font-semibold tracking-[-1px] text-foreground"
        >
          {Math.round(pct)}%
        </motion.span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-[2px] mt-0.5">pagado</span>
      </div>
    </div>
  );
}
