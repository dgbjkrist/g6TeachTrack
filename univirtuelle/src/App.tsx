import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import EnseignantsPage from "@/pages/EnseignantsPage";
import EnseignantFichePage from "@/pages/EnseignantFichePage";
import CoursPage from "@/pages/CoursPage";
import CoursDetailPage from "@/pages/CoursDetailPage";
import MesCoursPage from "@/pages/MesCoursPage";
import MesCoursDetailPage from "@/pages/MesCoursDetailPage";
import ActivitesPage from "@/pages/ActivitesPage";
import HeuresPage from "@/pages/HeuresPage";
import RapportsPage from "@/pages/RapportsPage";
import NotificationsPage from "@/pages/NotificationsPage";
import ParametresPage from "@/pages/ParametresPage";
import AnneesAcademiquesPage from "@/pages/AnneesAcademiquesPage";
import PaiementsPage from "@/pages/PaiementsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<AppLayout><DashboardPage /></AppLayout>} />
            <Route path="/enseignants" element={<AppLayout><EnseignantsPage /></AppLayout>} />
            <Route path="/enseignants/:id" element={<AppLayout><EnseignantFichePage /></AppLayout>} />
            <Route path="/cours" element={<AppLayout><CoursPage /></AppLayout>} />
            <Route path="/cours/:id" element={<AppLayout><CoursDetailPage /></AppLayout>} />
            <Route path="/mes-cours" element={<AppLayout><MesCoursPage /></AppLayout>} />
            <Route path="/mes-cours/:id" element={<AppLayout><MesCoursDetailPage /></AppLayout>} />
            <Route path="/activites" element={<AppLayout><ActivitesPage /></AppLayout>} />
            <Route path="/heures" element={<AppLayout><HeuresPage /></AppLayout>} />
            <Route path="/rapports" element={<AppLayout><RapportsPage /></AppLayout>} />
            <Route path="/notifications" element={<AppLayout><NotificationsPage /></AppLayout>} />
            <Route path="/parametres" element={<AppLayout><ParametresPage /></AppLayout>} />
            <Route path="/annees-academiques" element={<AppLayout><AnneesAcademiquesPage /></AppLayout>} />
            <Route path="/paiements" element={<AppLayout><PaiementsPage /></AppLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
