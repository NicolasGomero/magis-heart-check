import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import HomePage from "@/pages/HomePage";
import ObrasPage from "@/pages/ObrasPage";
import PecadosPage from "@/pages/PecadosPage";
import BuenasObrasPage from "@/pages/BuenasObrasPage";
import MetricsPage from "@/pages/MetricsPage";
import SettingsPage from "@/pages/SettingsPage";
import SinEditPage from "@/pages/SinEditPage";
import BuenaObraEditPage from "@/pages/BuenaObraEditPage";
import ImportPage from "@/pages/ImportPage";
import BackupPage from "@/pages/BackupPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Redirect root to obras */}
          <Route path="/" element={<Navigate to="/obras" replace />} />
          
          {/* Main layout with bottom nav */}
          <Route element={<MainLayout />}>
            <Route path="/obras" element={<ObrasPage />} />
            <Route path="/avance" element={<MetricsPage />} />
          </Route>
          
          {/* Internal pages without bottom nav */}
          <Route path="/obras/pecados" element={<PecadosPage />} />
          <Route path="/obras/buenas" element={<BuenasObrasPage />} />
          <Route path="/obras/buenas/new" element={<BuenaObraEditPage />} />
          <Route path="/obras/buenas/:id" element={<BuenaObraEditPage />} />
          <Route path="/examen" element={<HomePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/import" element={<ImportPage />} />
          <Route path="/settings/backup" element={<BackupPage />} />
          <Route path="/sins/new" element={<SinEditPage />} />
          <Route path="/sins/:id" element={<SinEditPage />} />
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
