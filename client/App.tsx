import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SiteManagement from "./pages/SiteManagement";
import CameraManagement from "./pages/CameraManagement";
import NVRRecordings from "./pages/NVRRecordings";
import AlertsManagement from "./pages/AlertsManagement";
import SystemHealth from "./pages/SystemHealth";
import SiteMonitoring from "./pages/SiteMonitoring";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/PasswordReset";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/site-management" element={<SiteManagement />} />
          <Route path="/camera-management" element={<CameraManagement />} />
          <Route path="/nvr-recordings" element={<NVRRecordings />} />
          <Route path="/alerts" element={<AlertsManagement />} />
          <Route path="/system-health" element={<SystemHealth />} />
          <Route path="/site-monitoring" element={<SiteMonitoring />} />
          <Route path="/settings" element={<Settings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </ThemeProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
