import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import LandingPage from "@/pages/LandingPage";
import PricingPage from "@/pages/PricingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import CoachDashboard from "@/pages/CoachDashboard";
import ClientsPage from "@/pages/ClientsPage";
import ClientDetailPage from "@/pages/ClientDetailPage";
import TrainingPage from "@/pages/TrainingPage";
import CalendarPage from "@/pages/CalendarPage";
import MessagesPage from "@/pages/MessagesPage";
import PaymentsPage from "@/pages/PaymentsPage";
import AdminPage from "@/pages/AdminPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function AppShell({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* App pages with layout */}
          <Route path="/dashboard" element={<AppShell><CoachDashboard /></AppShell>} />
          <Route path="/clients" element={<AppShell><ClientsPage /></AppShell>} />
          <Route path="/clients/:id" element={<AppShell><ClientDetailPage /></AppShell>} />
          <Route path="/training" element={<AppShell><TrainingPage /></AppShell>} />
          <Route path="/calendar" element={<AppShell><CalendarPage /></AppShell>} />
          <Route path="/messages" element={<AppShell><MessagesPage /></AppShell>} />
          <Route path="/payments" element={<AppShell><PaymentsPage /></AppShell>} />
          <Route path="/admin" element={<AppShell><AdminPage /></AppShell>} />
          <Route path="/settings" element={<AppShell><div className="p-6"><h1 className="text-2xl font-semibold text-foreground">Settings</h1><p className="text-muted-foreground mt-2">Coming soon.</p></div></AppShell>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
