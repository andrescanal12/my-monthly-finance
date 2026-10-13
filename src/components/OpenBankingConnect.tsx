import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  ExternalLink,
  KeyRound,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  CreditCard,
  ChevronRight,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const API_BASE = "https://my-monthly-finance-xi.vercel.app/api/bank";

const SPANISH_BANKS = [
  { id: "BBVA_BBVAESMMXXX", name: "BBVA España", logo: "BBVA" },
  { id: "SANTANDER_BSCHESMMXXX", name: "Banco Santander", logo: "SAN" },
  { id: "CAIXABANK_CAIXESBBXXX", name: "CaixaBank", logo: "CAIXA" },
  { id: "REVOLUT_REVOGB2LXXX", name: "Revolut", logo: "REV" },
  { id: "ING_INGDESMMXXX", name: "ING Direct", logo: "ING" },
  { id: "SABADELL_BSABESBBXXX", name: "Banco Sabadell", logo: "SAB" },
];

export default function OpenBankingConnect() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Guardar credenciales de GoCardless en localStorage
  const [secretId, setSecretId] = useState(() => localStorage.getItem("gocardless_secret_id") || "");
  const [secretKey, setSecretKey] = useState(() => localStorage.getItem("gocardless_secret_key") || "");
  const [selectedBank, setSelectedBank] = useState(SPANISH_BANKS[0].id);

  // Estado de la conexión
  const [requisitionId, setRequisitionId] = useState(() => localStorage.getItem("bank_requisition_id") || "");
  const [isConnected, setIsConnected] = useState(false);
  const [lastSyncDate, setLastSyncDate] = useState(() => localStorage.getItem("bank_last_sync") || "");

  // Verificar si venimos del callback de autorización bancaria
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("bank_connected") || requisitionId) {
      checkConnectionStatus();
    }
  }, [requisitionId]);

  const checkConnectionStatus = async () => {
    const currentReqId = requisitionId || localStorage.getItem("bank_requisition_id");
    const currentId = secretId || localStorage.getItem("gocardless_secret_id");
    const currentKey = secretKey || localStorage.getItem("gocardless_secret_key");

    if (!currentReqId || !currentId || !currentKey) return;

    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "check-status",
          secretId: currentId,
          secretKey: currentKey,
          requisitionId: currentReqId,
        }),
      });

      const data = await res.json();
      if (data.success && data.status === "LN") {
        setIsConnected(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveCredentials = () => {
    if (!secretId || !secretKey) {
      toast.error("Introduce tu Secret ID y Secret Key de GoCardless");
      return;
    }
    localStorage.setItem("gocardless_secret_id", secretId);
    localStorage.setItem("gocardless_secret_key", secretKey);
    toast.success("Credenciales guardadas");
  };

  const handleConnectBank = async () => {
    if (!secretId || !secretKey) {
      toast.error("Guarda primero tus credenciales de GoCardless");
      return;
    }

    setLoading(true);
    try {
      handleSaveCredentials();

      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "connect-bank",
          secretId,
          secretKey,
          institutionId: selectedBank,
          redirectUrl: window.location.origin + "/?bank_connected=true",
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "No se pudo iniciar la conexión");
      }

      localStorage.setItem("bank_requisition_id", data.requisitionId);
      setRequisitionId(data.requisitionId);

      toast.info("Redirigiendo a la pasarela oficial de tu banco...");
      // Redirigir al banco oficial
      window.location.href = data.authUrl;
    } catch (err: any) {
      toast.error(err.message || "Error al conectar con el banco");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncTransactions = async () => {
    const currentReqId = requisitionId || localStorage.getItem("bank_requisition_id");
    if (!currentReqId) {
      toast.error("Conecta primero tu cuenta bancaria");
      return;
    }

    setSyncing(true);
    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sync-transactions",
          secretId,
          secretKey,
          requisitionId: currentReqId,
          autoSaveToFirestore: true,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || data.error || "Error al sincronizar");
      }

      const now = new Date().toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
      setLastSyncDate(now);
      localStorage.setItem("bank_last_sync", now);

      toast.success(data.message || `Sincronizados ${data.count} movimientos`);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      toast.error(err.message || "Error al sincronizar con el banco");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="w-full">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between p-4 rounded-2xl liquid-glass border border-white/10 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Building2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">Sincronización Bancaria Automática</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  PSD2 Real
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {isConnected ? (
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 size={12} /> Conectado con BBVA • Última sinc: {lastSyncDate || "Pendiente"}
                  </span>
                ) : (
                  "Conecta BBVA para añadir compras de tarjeta automáticamente"
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isConnected ? (
              <Button
                size="sm"
                onClick={handleSyncTransactions}
                disabled={syncing}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs gap-1.5 shadow-md"
              >
                <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
                {syncing ? "Sincronizando..." : "Sincronizar"}
              </Button>
            ) : null}

            <DialogTrigger asChild>
              <Button
                size="sm"
                variant={isConnected ? "outline" : "default"}
                className={
                  isConnected
                    ? "border-white/10 text-xs font-medium"
                    : "bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs gap-1 shadow-md"
                }
              >
                {isConnected ? "Ajustes Banco" : "Conectar BBVA"}
                <ChevronRight size={14} />
              </Button>
            </DialogTrigger>
          </div>
        </div>

        <DialogContent className="max-w-lg bg-zinc-950 border border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Building2 className="text-blue-400" size={20} /> Conexión Bancaria Oficial (Open Banking)
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            {/* Explicación amigable */}
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200/90 leading-relaxed flex items-start gap-2.5">
              <ShieldCheck className="text-blue-400 shrink-0 mt-0.5" size={18} />
              <div>
                <strong>¿Cómo funciona?</strong> Al igual que <em>Wallet by BudgetBakers</em> o <em>Fintonic</em>, usamos la API legal europea <strong>PSD2 Open Banking</strong> a través de <strong>GoCardless (Nordigen)</strong>. Tu banco te pide autorización oficial y envía los movimientos de tu tarjeta directamente a tu app sin depender de notificaciones del móvil.
              </div>
            </div>

            {/* Paso 1: Claves GoCardless */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <Label className="text-zinc-200 font-semibold flex items-center gap-1.5">
                  <KeyRound size={15} className="text-blue-400" /> Claves de GoCardless Bank Data (100% Gratis)
                </Label>
                <a
                  href="https://bankaccountdata.gocardless.com/overview/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 underline underline-offset-2"
                >
                  Conseguir Claves Gratis <ExternalLink size={12} />
                </a>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                <div>
                  <Label className="text-[11px] text-zinc-400">Secret ID</Label>
                  <Input
                    value={secretId}
                    onChange={(e) => setSecretId(e.target.value)}
                    placeholder="ej: 3c5e8b42-7a89-4e61-..."
                    className="bg-zinc-900 border-zinc-800 font-mono text-xs text-white"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-zinc-400">Secret Key</Label>
                  <Input
                    type="password"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    placeholder="••••••••••••••••••••••••••••••••"
                    className="bg-zinc-900 border-zinc-800 font-mono text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* Paso 2: Seleccionar Banco */}
            <div className="space-y-2 pt-2">
              <Label className="text-zinc-200 font-semibold flex items-center gap-1.5">
                <CreditCard size={15} className="text-blue-400" /> Selecciona tu Banco
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {SPANISH_BANKS.map((bank) => (
                  <button
                    key={bank.id}
                    type="button"
                    onClick={() => setSelectedBank(bank.id)}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      selectedBank === bank.id
                        ? "border-blue-500 bg-blue-500/15 text-white ring-1 ring-blue-500"
                        : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <span className="text-xs font-semibold">{bank.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                      {bank.logo}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Botones de acción */}
            <div className="pt-3 space-y-2">
              <Button
                onClick={handleConnectBank}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold gap-2 py-5 shadow-lg shadow-blue-600/20"
              >
                {loading ? <RefreshCw className="animate-spin" size={16} /> : <ExternalLink size={16} />}
                Autorizar y Vincular con {SPANISH_BANKS.find((b) => b.id === selectedBank)?.name}
              </Button>

              {requisitionId && (
                <Button
                  onClick={handleSyncTransactions}
                  disabled={syncing}
                  variant="outline"
                  className="w-full border-zinc-800 hover:bg-zinc-900 text-zinc-200 text-xs gap-2"
                >
                  <RefreshCw className={syncing ? "animate-spin" : ""} size={14} />
                  Sincronizar Movimientos y Tarjeta Ahora
                </Button>
              )}
            </div>

            <p className="text-[11px] text-zinc-500 text-center">
              Cumple con la Directiva Europea PSD2. Tus credenciales bancarias se ingresan exclusivamente en la web oficial de tu banco.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
