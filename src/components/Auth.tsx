import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Wallet, LogIn, Mail } from "lucide-react";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;
      toast.success("¡Enlace de acceso enviado! Revisa tu email.");
    } catch (err: any) {
      toast.error(err.message || "Algo salió mal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <Card className="liquid-glass border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-xl bg-white/5">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          
          <CardHeader className="text-center pt-10">
            <div className="w-16 h-16 rounded-2xl liquid-glass-strong mx-auto mb-6 flex items-center justify-center">
              <Wallet size={32} className="text-foreground/80" />
            </div>
            <CardTitle className="text-3xl font-semibold tracking-tight">
                Mis <span className="font-serif-accent text-3xl">Gastos</span>
            </CardTitle>
            <CardDescription className="text-muted-foreground/60 uppercase tracking-widest text-[10px] mt-2">
              Gestión Financiera Premium
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleMagicLink} className="space-y-6 pt-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
                  <Input
                    type="email"
                    placeholder="Email corporativo o personal"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 pl-10 focus:ring-purple-500/50"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 transition-all font-medium h-11"
                disabled={loading}
              >
                {loading ? "Enviando..." : "Acceder con Magic Link"}
                <LogIn className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4 text-center pb-8 pt-2">
            <p className="text-[11px] text-muted-foreground/40 leading-relaxed px-4">
              Cada sesión es única y segura. No necesitas contraseña, simplemente haz clic en el enlace que te enviaremos.
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
