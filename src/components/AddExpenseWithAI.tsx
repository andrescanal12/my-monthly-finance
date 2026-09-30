import { useState, useEffect, useRef } from "react";
import { Sparkles, Mic, MicOff, Send, X, Loader2, ClipboardPaste, Check, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CategoryId, CATEGORY_COLORS, CATEGORY_LABELS } from "@/hooks/useExpenseData";
import { classifyExpenseWithAI, AIClassifiedExpense } from "@/lib/ai";
import { toast } from "sonner";

interface AddExpenseWithAIProps {
  onAdd: (name: string, amount: number, categoryId: CategoryId, dueDay?: number) => void;
}

export default function AddExpenseWithAI({ onAdd }: AddExpenseWithAIProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [preview, setPreview] = useState<AIClassifiedExpense | null>(null);
  const recognitionRef = useRef<any>(null);

  // Inicializar SpeechRecognition si está disponible
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "es-ES";

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setText(transcript);
        setIsListening(false);
        // Auto-analizar tras dictar por voz para máxima comodidad
        handleClassify(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error("El dictado por voz no es compatible con este navegador. Puedes escribir o pegar el texto.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setText("");
      setPreview(null);
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast.info("🎙️ Escuchando... Di algo como: 'Veinticinco euros en Mercadona'");
      } catch (err) {
        setIsListening(false);
      }
    }
  };

  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        setText(clipText);
        toast.success("Texto pegado");
      }
    } catch {
      toast.info("Pega el texto directamente en el cuadro");
    }
  };

  const handleClassify = async (inputText?: string) => {
    const textToProcess = (inputText || text).trim();
    if (!textToProcess) {
      toast.error("Escribe o dicta algún gasto primero");
      return;
    }

    setIsLoading(true);
    try {
      const result = await classifyExpenseWithAI(textToProcess);
      if (result.amount <= 0) {
        setPreview(result);
        toast.warning("Detectamos el comercio pero no el importe. Por favor añade el precio.");
      } else {
        // Añadir directamente
        onAdd(result.name, result.amount, result.categoryId);
        toast.success(`✨ Añadido: ${result.name} (${result.amount.toFixed(2)} €) en ${CATEGORY_LABELS[result.categoryId]}`);
        setText("");
        setPreview(null);
        setIsOpen(false);
      }
    } catch (error: any) {
      toast.error(error.message || "No pudimos analizar el gasto con la IA");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPreview = () => {
    if (!preview || preview.amount <= 0) return;
    onAdd(preview.name, preview.amount, preview.categoryId);
    toast.success(`✨ Añadido: ${preview.name} (${preview.amount.toFixed(2)} €)`);
    setText("");
    setPreview(null);
    setIsOpen(false);
  };

  return (
    <div className="w-full">
      {/* Botón trigger principal */}
      {!isOpen && (
        <motion.button
          whileTap={{ scale: 0.98 }}
          whileHover={{ scale: 1.01 }}
          onClick={() => setIsOpen(true)}
          className="w-full relative overflow-hidden group rounded-2xl p-[1px] bg-gradient-to-r from-sky-500/40 via-purple-500/40 to-pink-500/40 shadow-lg shadow-purple-500/5 transition-all duration-300"
        >
          <div className="w-full bg-background/80 backdrop-blur-xl rounded-[15px] p-3.5 flex items-center justify-between text-sm font-medium transition-colors group-hover:bg-background/60">
            <div className="flex items-center gap-2.5 text-foreground/90">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-400/20 via-purple-400/20 to-pink-400/20 flex items-center justify-center text-purple-400 border border-purple-500/20">
                <Sparkles size={16} className="animate-pulse" />
              </div>
              <div className="text-left">
                <span className="font-semibold block text-xs tracking-wide">Añadir con Inteligencia Artificial</span>
                <span className="text-[10px] text-muted-foreground">Dicta con voz, escribe o pega cualquier cobro</span>
              </div>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-foreground/[0.06] text-[11px] font-semibold text-foreground/70 flex items-center gap-1">
              <Mic size={12} className="text-sky-400" />
              <span>Voz / Texto</span>
            </div>
          </div>
        </motion.button>
      )}

      {/* Modal / Panel expandido */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="liquid-glass-strong border border-purple-500/30 rounded-2xl p-5 flex flex-col gap-4 shadow-2xl relative overflow-hidden"
          >
            {/* Cabecera */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                  <Sparkles size={15} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Asistente IA de Gastos</h3>
                  <p className="text-[10px] text-muted-foreground">Escribe o dicta libremente</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setPreview(null);
                  if (isListening && recognitionRef.current) {
                    recognitionRef.current.stop();
                  }
                }}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <X size={16} />
              </button>
            </div>

            {/* Input y botones de acción rápida */}
            <div className="relative flex flex-col gap-2">
              <div className="relative">
                <textarea
                  rows={2}
                  placeholder="Ej: '35€ de gasolina en Repsol' o 'Cena 18.50€ en pizzería'..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleClassify();
                    }
                  }}
                  className="w-full bg-foreground/[0.04] border border-foreground/[0.08] focus:border-purple-500/50 rounded-xl p-3 pr-20 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none resize-none transition-all"
                />

                <div className="absolute right-2 bottom-2.5 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePaste}
                    title="Pegar texto copiado"
                    className="p-1.5 rounded-lg bg-foreground/[0.05] hover:bg-foreground/[0.1] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ClipboardPaste size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={toggleListening}
                    title="Dictar por voz"
                    className={`p-1.5 rounded-lg transition-all ${
                      isListening
                        ? "bg-red-500 text-white animate-pulse shadow-md shadow-red-500/40"
                        : "bg-sky-500/20 text-sky-400 hover:bg-sky-500/30"
                    }`}
                  >
                    {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                  </button>
                </div>
              </div>

              {/* Ejemplos rápidos en pastillas */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {[
                  "Gasolina 40€ Repsol",
                  "Mercadona 32.50€",
                  "Cena 19€",
                  "Luz 75€"
                ].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => {
                      setText(sug);
                      handleClassify(sug);
                    }}
                    className="text-[10px] px-2.5 py-1 rounded-full bg-foreground/[0.03] hover:bg-foreground/[0.08] text-muted-foreground/80 hover:text-foreground border border-foreground/[0.05] transition-colors"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview si faltó el importe o para confirmar */}
            {preview && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 rounded-xl bg-foreground/[0.04] border border-purple-500/20 flex flex-col gap-2.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground/90">{preview.name}</span>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-background"
                    style={{ backgroundColor: CATEGORY_COLORS[preview.categoryId] }}
                  >
                    {CATEGORY_LABELS[preview.categoryId]}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">Importe:</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={preview.amount || ""}
                    onChange={(e) => setPreview({ ...preview, amount: parseFloat(e.target.value) || 0 })}
                    className="bg-background/60 rounded-lg px-2 py-1 text-sm font-semibold w-24 text-foreground outline-none border border-foreground/10"
                  />
                  <span className="text-xs text-muted-foreground">€</span>
                  <button
                    type="button"
                    onClick={handleConfirmPreview}
                    disabled={!preview.amount || preview.amount <= 0}
                    className="ml-auto px-3 py-1 rounded-lg bg-foreground text-background text-xs font-semibold hover:bg-foreground/90 disabled:opacity-40 transition-all flex items-center gap-1"
                  >
                    <Check size={12} />
                    Guardar
                  </button>
                </div>
              </motion.div>
            )}

            {/* Botón de análisis */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              disabled={isLoading || !text.trim()}
              onClick={() => handleClassify()}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-purple-500 to-pink-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-purple-500/20 hover:opacity-95 disabled:opacity-40 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Analizando con IA...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Procesar y Guardar</span>
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
