import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface MonthSelectorProps {
  months: string[];
  selected: number;
  onSelect: (month: number) => void;
}

export default function MonthSelector({ months, selected, onSelect }: MonthSelectorProps) {
  return (
    <div className="flex items-center justify-between px-1">
      <button
        onClick={() => onSelect(Math.max(0, selected - 1))}
        disabled={selected === 0}
        className="p-2 rounded-lg bg-secondary text-foreground disabled:opacity-30 transition-opacity"
      >
        <ChevronLeft size={20} />
      </button>
      <motion.h2
        key={selected}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl font-bold text-foreground"
      >
        {months[selected]} 2026
      </motion.h2>
      <button
        onClick={() => onSelect(Math.min(11, selected + 1))}
        disabled={selected === 11}
        className="p-2 rounded-lg bg-secondary text-foreground disabled:opacity-30 transition-opacity"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
