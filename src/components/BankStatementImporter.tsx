import { useState, useRef } from "react";
import { UploadCloud, FileSpreadsheet, Check, X, Loader2, Sparkles, AlertCircle, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CategoryId, CATEGORY_COLORS, CATEGORY_LABELS } from "@/hooks/useExpenseData";
import { classifyExpenseWithAI } from "@/lib/ai";
import { toast } from "sonner";

interface BankStatementImporterProps {
  onAddExpense: (name: string, amount: number, categoryId: CategoryId, dueDay?: number) => void;
  monthName: string;
}

interface ParsedTransaction {
  id: string;
  originalText: string;
  name: string;
  amount: number;
  categoryId: CategoryId;
  selected: boolean;
}

export default function BankStatementImporter({ onAddExpense, monthName }: BankStatementImporterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rawText, setRawText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analizar archivo subido (CSV, TXT, Excel export)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawText(content);
        parseContent(content);
      }
    };
    reader.readAsText(file);
  };

  // Parser inteligente para líneas de extractos bancarios de BBVA y bancos españoles
  const parseContent = async (textToParse: string) => {
    const lines = textToParse
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 5 && !l.toLowerCase().includes("saldo") && !l.toLowerCase().includes("fecha;concepto"));

    if (lines.length === 0) {
      toast.error("No se detectaron movimientos en el texto");
      return;
    }

    setIsLoading(true);
    toast.info(`Analizando ${lines.length} movimientos bancarios...`);

    const parsedResults: ParsedTransaction[] = [];

    // Procesamos hasta 30 líneas por lote para no saturar
    const linesToProcess = lines.slice(0, 30);

    for (let i = 0; i < linesToProcess.length; i++) {
      const line = linesToProcess[i];
      try {
        // Intentar clasificar con nuestra IA optimizada
        const result = await classifyExpenseWithAI(line);
        if (result.amount > 0) {
          parsedResults.push({
            id: `tx-${Date.now()}-${i}`,
            originalText: line,
            name: result.name,
            amount: result.amount,
            categoryId: result.categoryId,
            selected: true,
          });
        }
      } catch (err) {
        // Si falla alguna línea, saltar
      }
    }

    setIsLoading(false);
    if (parsedResults.length > 0) {
      setTransactions(parsedResults);
      toast.success(`Se detectaron ${parsedResults.length} gastos válidos`);
    } else {
      toast.error("No se pudieron extraer importes válidos. Prueba pegando el texto directamente.");
    }
  };

  const handleImportSelected = () => {
    const selectedTxs = transactions.filter((t) => t.selected);
    if (selectedTxs.length === 0) {
      toast.error("Selecciona al menos un gasto para importar");
      return;
    }

    selectedTxs.forEach((tx) => {
      onAddExpense(tx.name, tx.amount, tx.categoryId);
    });

    toast.success(`🎉 Se importaron ${selectedTxs.length} gastos correctamente a ${monthName}`);
    setTransactions([]);
    setRawText("");
    setIsOpen(false);
  };

  return (
    <div className="w-full">
      {/* Botón trigger estilo Wallet by BudgetBakers */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        whileHover={{ scale: 1.01 }}
        onClick={() => setIsOpen(true)}
        className="w-full liquid-glass rounded-2xl p-4 flex items-center justify-between group hover:border-blue-500/30 transition-all duration-300"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-colors">
            <FileSpreadsheet size={18} />
          </div>
          <div className="text-left">
            <span className="text-xs font-semibold text-foreground block">Importar Extracto de Banco (BBVA)</span>
            <span className="text-[10px] text-muted-foreground">Sube tu Excel/CSV o pega tus movimientos</span>
          </div>
        </div>
        <div className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
          <span>Importar</span>
          <ArrowRight size={12} />
        </div>
      </motion.button>

      {/* Modal interactivo */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg liquid-glass-strong border border-blue-500/30 rounded-3xl p-6 shadow-2xl max-h-[85vh] flex flex-col gap-4 overflow-hidden"
            >
              {/* Cabecera */}
              <div className="flex items-center justify-between pb-3 border-b border-foreground/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <FileSpreadsheet size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Sincronizar Extracto Bancario</h3>
                    <p className="text-[10px] text-muted-foreground">Compatible con BBVA, Santander, CaixaBank, etc.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Si no hay transacciones analizadas aún, mostrar opciones de subida */}
              {transactions.length === 0 ? (
                <div className="flex flex-col gap-4 py-2 overflow-y-auto">
                  {/* Zona Drag & Drop / Subir archivo */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-blue-500/30 hover:border-blue-500/60 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-blue-500/[0.02] hover:bg-blue-500/[0.05]"
                  >
                    <UploadCloud size={32} className="text-blue-400 mb-2" />
                    <span className="text-xs font-semibold text-foreground block">
                      Haz clic para subir archivo de movimientos
                    </span>
                    <span className="text-[10px] text-muted-foreground">Archivos CSV, TXT o Excel exportados de BBVA</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.txt,.xlsx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-px bg-foreground/10 flex-1" />
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">o pega el texto</span>
                    <div className="h-px bg-foreground/10 flex-1" />
                  </div>

                  {/* Cuadro de texto */}
                  <div className="flex flex-col gap-2">
                    <textarea
                      rows={4}
                      placeholder={`Pega aquí los movimientos copiados de tu banco. Ejemplo:\n25/09/2026 PAGO CON TARJETA EN MERCADONA -32,50 EUR\n26/09/2026 ESTACION SERVICIO REPSOL -45,00 EUR`}
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      className="w-full bg-foreground/[0.04] border border-foreground/[0.08] focus:border-blue-500/50 rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground/40 outline-none resize-none font-mono"
                    />
                    <button
                      type="button"
                      disabled={isLoading || !rawText.trim()}
                      onClick={() => parseContent(rawText)}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/20 disabled:opacity-40 transition-all"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Analizando transacciones con IA...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} />
                          <span>Procesar Movimientos</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* Vista de Confirmación y Tabla de transacciones detectadas */
                <div className="flex flex-col gap-3 overflow-hidden flex-1">
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>Transacciones detectadas ({transactions.length})</span>
                    <button
                      type="button"
                      onClick={() =>
                        setTransactions(
                          transactions.map((t) => ({ ...t, selected: !transactions.every((x) => x.selected) }))
                        )
                      }
                      className="text-blue-400 hover:underline text-[11px]"
                    >
                      {transactions.every((t) => t.selected) ? "Desmarcar todos" : "Marcar todos"}
                    </button>
                  </div>

                  {/* Lista de transacciones scrollable */}
                  <div className="overflow-y-auto max-h-[40vh] flex flex-col gap-2 pr-1">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                          tx.selected
                            ? "bg-foreground/[0.04] border-blue-500/30"
                            : "bg-transparent border-foreground/5 opacity-50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={tx.selected}
                            onChange={(e) =>
                              setTransactions(
                                transactions.map((t) => (t.id === tx.id ? { ...t, selected: e.target.checked } : t))
                              )
                            }
                            className="rounded accent-blue-500"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-foreground truncate">{tx.name}</span>
                            <span
                              className="text-[9px] font-bold uppercase tracking-wider w-fit px-1.5 py-0.2 rounded"
                              style={{ color: CATEGORY_COLORS[tx.categoryId] }}
                            >
                              {CATEGORY_LABELS[tx.categoryId]}
                            </span>
                          </div>
                        </div>

                        <span className="text-xs font-bold text-foreground whitespace-nowrap">
                          -{tx.amount.toFixed(2)} €
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Botones de acción final */}
                  <div className="flex items-center gap-2 pt-2 border-t border-foreground/10">
                    <button
                      type="button"
                      onClick={() => setTransactions([])}
                      className="px-3 py-2 rounded-xl border border-foreground/10 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Volver
                    </button>
                    <button
                      type="button"
                      onClick={handleImportSelected}
                      className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/20 transition-all"
                    >
                      <Check size={14} />
                      Importar {transactions.filter((t) => t.selected).length} a {monthName}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
