import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Database, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function DataMigration() {
  const { user } = useAuth();
  const [hasLocalData, setHasLocalData] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrated, setMigrated] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const local = localStorage.getItem("expenses-2026-v4");
    if (local) setHasLocalData(true);
  }, []);

  const migrate = async () => {
    if (!user) return;
    setIsMigrating(true);
    
    try {
      const local = localStorage.getItem("expenses-2026-v4");
      if (!local) return;
      
      const data = JSON.parse(local);
      const months = Object.keys(data);
      
      for (const m of months) {
        const monthIndex = parseInt(m);
        const { income, expenses } = data[monthIndex];
        
        // Upsert income
        await supabase.from("month_income").upsert({
          user_id: user.id,
          month_index: monthIndex,
          year: 2026,
          amount: income
        }, { onConflict: "user_id, month_index, year" });
        
        // Insert expenses (mapping recurring/paid)
        if (expenses.length > 0) {
          const formattedExpenses = expenses.map((e: any) => ({
            user_id: user.id,
            name: e.name,
            amount: e.amount,
            paid: e.paid,
            is_recurring: e.isRecurring,
            category_id: e.categoryId,
            month_index: monthIndex,
            year: 2026
          }));
          
          await supabase.from("expenses").insert(formattedExpenses);
        }
      }
      
      setMigrated(true);
      toast.success("¡Datos migrados correctamente!");
      queryClient.invalidateQueries();
      
      // Optionally clear localStorage or rename key to avoid double migration
      localStorage.setItem("expenses-2026-v4-migrated", local);
      localStorage.removeItem("expenses-2026-v4");
      setHasLocalData(false);
      
    } catch (err: any) {
      toast.error("Error al migrar: " + err.message);
    } finally {
      setIsMigrating(false);
    }
  };

  if (!hasLocalData || migrated) return null;

  return (
    <Card className="liquid-glass border-blue-500/20 mb-6 overflow-hidden">
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Database size={20} />
          </div>
          <div>
            <h4 className="text-sm font-semibold">Migrar datos locales</h4>
            <p className="text-[11px] text-muted-foreground">Hemos detectado datos antiguos en este navegador.</p>
          </div>
        </div>
        <Button 
          size="sm" 
          onClick={migrate} 
          disabled={isMigrating}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isMigrating ? "Migrando..." : "Importar"}
          <ArrowRight size={14} className="ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
