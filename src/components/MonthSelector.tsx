import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MonthSelectorProps {
  months: string[];
  selected: number;
  onSelect: (month: number) => void;
}

export default function MonthSelector({ months, selected, onSelect }: MonthSelectorProps) {
  return (
    <div className="flex items-center justify-between">
      <button
        onClick={() => onSelect(Math.max(0, selected - 1))}
        disabled={selected === 0}
        className="w-10 h-10 rounded-full liquid-glass flex items-center justify-center text-foreground disabled:opacity-20 transition-all duration-300 hover:bg-foreground/[0.06]"
      >
        <ChevronLeft size={18} />
      </button>
      <AnimatePresence mode="wait">
        <motion.div
          key={selected}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col items-center"
        >
          <span className="text-2xl font-semibold tracking-[-1px] text-foreground">
            {months[selected]}
          </span>
          <span className="text-xs text-muted-foreground font-medium tracking-[2px]">2026</span>
        </motion.div>
      </AnimatePresence>
      <button
        onClick={() => onSelect(Math.min(11, selected + 1))}
        disabled={selected === 11}
        className="w-10 h-10 rounded-full liquid-glass flex items-center justify-center text-foreground disabled:opacity-20 transition-all duration-300 hover:bg-foreground/[0.06]"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
