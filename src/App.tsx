import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import VetDashboard from "./pages/vet/VetDashboard";
import VetKunjunganPage from "./pages/vet/KunjunganPage";
import VetHewanPage from "./pages/vet/HewanPage";
import VetObatPage from "./pages/vet/ObatPage";
import VetKunjunganObatPage from "./pages/vet/KunjunganObatPage";
import PawrentDashboard from "./pages/pawrent/PawrentDashboard";
import NotFound from "./pages/NotFound";
import UsersPage from "./pages/admin/UsersPage";
import DokterPage from "./pages/admin/DokterPage";
import PawrentPage from "./pages/admin/PawrentPage";
import HewanPage from "./pages/admin/HewanPage";
import ObatPage from "./pages/admin/ObatPage";
import KlinikPage from "./pages/admin/KlinikPage";
import AuditLogPage from "./pages/admin/AuditLogPage";
import LayananPage from "./pages/admin/LayananPage";
import KunjunganPage from "./pages/admin/KunjunganPage";
import KunjunganObatPage from "./pages/admin/KunjunganObatPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin Routes */}
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute allowedRoles={[1]}>
                  <Routes>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="users" element={<UsersPage />} />
                    <Route path="dokter" element={<DokterPage />} />
                    <Route path="pawrent" element={<PawrentPage />} />
                    <Route path="hewan" element={<HewanPage />} />
                    <Route path="kunjungan" element={<KunjunganPage />} />
                    <Route path="kunjungan-obat" element={<KunjunganObatPage />} />
                    <Route path="obat" element={<ObatPage />} />
                    <Route path="klinik" element={<KlinikPage />} />
                    <Route path="layanan" element={<LayananPage />} />
                    <Route path="auditlog" element={<AuditLogPage />} />
                    <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                  </Routes>
                </ProtectedRoute>
              } 
            />
            
            {/* Vet Routes */}
            <Route 
              path="/vet/*" 
              element={
                <ProtectedRoute allowedRoles={[2]}>
                  <Routes>
                    <Route path="dashboard" element={<VetDashboard />} />
                    <Route path="kunjungan" element={<VetKunjunganPage />} />
                    <Route path="hewan" element={<VetHewanPage />} />
                    <Route path="obat" element={<VetObatPage />} />
                    <Route path="kunjungan-obat" element={<VetKunjunganObatPage />} />
                    <Route path="*" element={<Navigate to="/vet/dashboard" replace />} />
                  </Routes>
                </ProtectedRoute>
              } 
            />
            
            {/* Pawrent Routes */}
            <Route 
              path="/pawrent/*" 
              element={
                <ProtectedRoute allowedRoles={[3]}>
                  <Routes>
                    <Route path="dashboard" element={<PawrentDashboard />} />
                    <Route path="*" element={<Navigate to="/pawrent/dashboard" replace />} />
                  </Routes>
                </ProtectedRoute>
              } 
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
