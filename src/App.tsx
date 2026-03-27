import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Analysis from "./pages/Analysis.tsx";
import Annual from "./pages/Annual.tsx";
import NotFound from "./pages/NotFound.tsx";
import BottomNav from "./components/BottomNav.tsx";
import BackgroundVideo from "./components/BackgroundVideo.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="relative min-h-screen bg-background">
          <BackgroundVideo />
          <div className="relative z-10 pb-16">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/analisis" element={<Analysis />} />
              <Route path="/anual" element={<Annual />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <BottomNav />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
