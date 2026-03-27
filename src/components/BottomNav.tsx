import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, PieChart, CalendarDays } from "lucide-react";
import { motion } from "framer-motion";

export default function BottomNav() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", Icon: LayoutDashboard },
    { path: "/analisis", label: "Análisis", Icon: PieChart },
    { path: "/anual", label: "Anual", Icon: CalendarDays },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-foreground/5 pb-2 pt-2">
      <div className="flex items-center justify-around h-14 px-4 max-w-md mx-auto">
        {navItems.map(({ path, label, Icon }) => {
          const isActive = location.pathname === path;
          return (
            <Link key={path} to={path} className="relative flex flex-col items-center justify-center w-16 h-full gap-1.5 group">
              <Icon size={20} className={`transition-colors duration-300 ${isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground/70'}`} />
              <span className={`text-[10px] font-medium transition-colors duration-300 ${isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground/70'}`}>
                {label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute -top-2 w-8 h-1 bg-foreground rounded-b-full opacity-20"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
