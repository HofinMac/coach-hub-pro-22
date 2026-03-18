import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import ClientLayout from "@/components/ClientLayout";
import RoleSwitcher from "@/components/RoleSwitcher";
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
import GymsPage from "@/pages/GymsPage";
import NotFound from "@/pages/NotFound";
import ClientDashboard from "@/pages/client/ClientDashboard";
import ClientTrainingPage from "@/pages/client/ClientTrainingPage";
import ClientCalendarPage from "@/pages/client/ClientCalendarPage";
import ClientProgressPage from "@/pages/client/ClientProgressPage";
import ClientMessagesPage from "@/pages/client/ClientMessagesPage";
import ClientPaymentsPage from "@/pages/client/ClientPaymentsPage";
import CoachOnboarding from "@/pages/onboarding/CoachOnboarding";
import ClientOnboarding from "@/pages/onboarding/ClientOnboarding";
import ClientGymsPage from "@/pages/client/ClientGymsPage";

const queryClient = new QueryClient();

function CoachShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppLayout>{children}</AppLayout>
      <RoleSwitcher />
    </>
  );
}

function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ClientLayout>{children}</ClientLayout>
      <RoleSwitcher />
    </>
  );
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

          {/* Onboarding */}
          <Route path="/onboarding/trener" element={<CoachOnboarding />} />
          <Route path="/onboarding/klient" element={<ClientOnboarding />} />

          {/* Coach pages */}
          <Route path="/dashboard" element={<CoachShell><CoachDashboard /></CoachShell>} />
          <Route path="/clients" element={<CoachShell><ClientsPage /></CoachShell>} />
          <Route path="/clients/:id" element={<CoachShell><ClientDetailPage /></CoachShell>} />
          <Route path="/training" element={<CoachShell><TrainingPage /></CoachShell>} />
          <Route path="/gyms" element={<CoachShell><GymsPage /></CoachShell>} />
          <Route path="/calendar" element={<CoachShell><CalendarPage /></CoachShell>} />
          <Route path="/messages" element={<CoachShell><MessagesPage /></CoachShell>} />
          <Route path="/payments" element={<CoachShell><PaymentsPage /></CoachShell>} />
          <Route path="/admin" element={<CoachShell><AdminPage /></CoachShell>} />
          <Route path="/settings" element={<CoachShell><div className="p-6"><h1 className="text-2xl font-semibold text-foreground">Nastavení</h1><p className="text-muted-foreground mt-2">Již brzy.</p></div></CoachShell>} />

          {/* Client pages */}
          <Route path="/klient" element={<ClientShell><ClientDashboard /></ClientShell>} />
          <Route path="/klient/treninky" element={<ClientShell><ClientTrainingPage /></ClientShell>} />
          <Route path="/klient/kalendar" element={<ClientShell><ClientCalendarPage /></ClientShell>} />
          <Route path="/klient/pokrok" element={<ClientShell><ClientProgressPage /></ClientShell>} />
          <Route path="/klient/zpravy" element={<ClientShell><ClientMessagesPage /></ClientShell>} />
          <Route path="/klient/platby" element={<ClientShell><ClientPaymentsPage /></ClientShell>} />
          <Route path="/klient/nastaveni" element={<ClientShell><div className="p-6"><h1 className="text-2xl font-semibold text-foreground">Nastavení</h1><p className="text-muted-foreground mt-2">Již brzy.</p></div></ClientShell>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
