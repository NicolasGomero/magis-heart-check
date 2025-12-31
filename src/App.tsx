import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import HomePage from "@/pages/HomePage";
import SinsPage from "@/pages/SinsPage";
import MetricsPage from "@/pages/MetricsPage";
import SettingsPage from "@/pages/SettingsPage";
import SinEditPage from "@/pages/SinEditPage";
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
          {/* Main layout with bottom nav */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/sins" element={<SinsPage />} />
            <Route path="/metrics" element={<MetricsPage />} />
          </Route>
          
          {/* Internal pages without bottom nav */}
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
