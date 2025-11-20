// ========================================================
// UI COMPONENTS & PROVIDERS
// ========================================================
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ========================================================
// ROUTING & NAVIGATION
// ========================================================
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// ========================================================
// CONTEXT & AUTHENTICATION
// ========================================================
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// ========================================================
// PUBLIC PAGES
// ========================================================
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

// ========================================================
// GENERAL PAGES
// ========================================================
import Dashboard from "./pages/Dashboard";

// ========================================================
// ADMIN PAGES
// ========================================================
import AdminDashboard from "./pages/admin/AdminDashboard";
import UsersPage from "./pages/admin/UsersPage";
import DokterPage from "./pages/admin/DokterPage";
import PawrentPage from "./pages/admin/PawrentPage";
import HewanPage from "./pages/admin/HewanPage";
import KunjunganPage from "./pages/admin/KunjunganPage";
import KunjunganObatPage from "./pages/admin/KunjunganObatPage";
import ObatPage from "./pages/admin/ObatPage";
import KlinikPage from "./pages/admin/KlinikPage";
import LayananPage from "./pages/admin/LayananPage";
import JenisHewanPage from "./pages/admin/JenisHewanPage";
import AdminPencarianPage from "./pages/admin/AdminPencarianPage";
import AdminBooking from "@/pages/admin/Booking";
import ShiftDokterAdmin from "./pages/admin/ShiftDokterAdmin";
import AdminKlinikDashboard from "@/pages/admin-klinik/AdminKlinikDashboard";
import AdminKlinikKlinikPage from "@/pages/admin-klinik/AdminKlinikKlinikPage";
import AdminKlinikKunjunganPage from "@/pages/admin-klinik/AdminKlinikKunjunganPage";
import AdminKlinikBookingPage from "@/pages/admin-klinik/AdminKlinikBookingPage";
import AdminKlinikObatPage from "@/pages/admin-klinik/AdminKlinikObatPage"; // Tambahkan import
import AdminKlinikDokterPage from "./pages/admin-klinik/AdminKlinikDokterPage";
import AdminKlinikLayananPage from "./pages/admin-klinik/AdminKlinikLayananPage"; // Tambahkan import ini
import AdminKlinikHewanPage from "./pages/admin-klinik/AdminKlinikHewanPage"; // Tambahkan import untuk AdminKlinikHewanPage
import AdminKlinikShiftDokterPage from "./pages/admin-klinik/AdminKlinikShiftDokterPage"; // Tambahkan import untuk AdminKlinikShiftDokterPage
import AdminAuditLogPage from "./pages/admin/AdminAuditLogPage";
import AdminKlinikAuditLogPage from "./pages/admin-klinik/AdminKlinikAuditLogPage";

// ========================================================
// VET/DOKTER PAGES
// ========================================================
import VetDashboard from "./pages/vet/VetDashboard";
import VetKunjunganPage from "./pages/vet/KunjunganPage";
import VetHewanPage from "./pages/vet/HewanPage";
import VetObatPage from "./pages/vet/ObatPage";
import VetKunjunganObatPage from "./pages/vet/KunjunganObatPage";
import VetLayananPage from "./pages/vet/LayananPage";
import VetKlinikPage from "./pages/vet/VetKlinikPage";
import VetJenisHewanPage from "./pages/vet/VetJenisHewanPage";
import VetProfilPage from "./pages/vet/VetProfilPage";
import VetBooking from "@/pages/vet/Booking";
import VetShiftPage from "./pages/vet/VetShiftPage"; // Tambahkan import

// ========================================================
// PAWRENT PAGES
// ========================================================
import PawrentDashboard from "./pages/pawrent/PawrentDashboard";
import PawrentHewanPage from "./pages/pawrent/PawrentHewanPage";
import PawrentRiwayatPage from "./pages/pawrent/PawrentRiwayatPage";
import PawrentRekamMedisPage from "./pages/pawrent/PawrentRekamMedisPage";
import PawrentProfilPage from "./pages/pawrent/PawrentProfilPage";
import PawrentDokterListPage from "./pages/pawrent/PawrentDokterListPage";
import PawrentObatListPage from "./pages/pawrent/PawrentObatListPage";
import PawrentJenisHewanPage from "./pages/pawrent/PawrentJenisHewanPage";
import PawrentKlinikPage from "./pages/pawrent/PawrentKlinikPage";
import PawrentLayananPage from "./pages/pawrent/PawrentLayananPage";
import PawrentBooking from "@/pages/pawrent/Booking";
import PawrentShiftPage from "./pages/pawrent/PawrentShiftPage"; // Tambahkan import

// ========================================================
// QUERY CLIENT CONFIGURATION
// ========================================================
const queryClient = new QueryClient();

// ========================================================
// APP COMPONENT
// ========================================================
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* ========================================================
                PUBLIC ROUTES
                ======================================================== */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* ========================================================
                DASHBOARD ROUTE (All Authenticated Users)
                ======================================================== */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* ========================================================
                ADMIN ROUTES (Role ID: 1)
                ======================================================== */}
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
                    <Route path="auditlog" element={<AdminAuditLogPage />} />
                    <Route path="jenis-hewan" element={<JenisHewanPage />} />
                    <Route path="shift-dokter" element={<ShiftDokterAdmin />} />
                    <Route path="pencarian" element={<AdminPencarianPage />} />
                    <Route path="booking" element={<AdminBooking />} />
                    <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                  </Routes>
                </ProtectedRoute>
              } 
            />
            
            {/* ========================================================
                VET/DOKTER ROUTES (Role ID: 2)
                ======================================================== */}
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
                    <Route path="layanan" element={<VetLayananPage />} />
                    <Route path="klinik" element={<VetKlinikPage />} />
                    <Route path="jenis-hewan" element={<VetJenisHewanPage />} />
                    <Route path="profil" element={<VetProfilPage />} />
                    <Route path="booking" element={<VetBooking />} />
                    <Route path="shift" element={<VetShiftPage />} /> {/* Tambahkan route */}
                    <Route path="*" element={<Navigate to="/vet/dashboard" replace />} />
                  </Routes>
                </ProtectedRoute>
              } 
            />
            
            {/* ========================================================
                PAWRENT ROUTES (Role ID: 3)
                ======================================================== */}
            <Route 
              path="/pawrent/*" 
              element={
                <ProtectedRoute allowedRoles={[3]}>
                  <Routes>
                    <Route path="dashboard" element={<PawrentDashboard />} />
                    <Route path="hewan" element={<PawrentHewanPage />} />
                    <Route path="riwayat" element={<PawrentRiwayatPage />} />
                    <Route path="rekam-medis" element={<PawrentRekamMedisPage />} />
                    <Route path="profil" element={<PawrentProfilPage />} />
                    <Route path="dokter-list" element={<PawrentDokterListPage />} />
                    <Route path="obat-list" element={<PawrentObatListPage />} />
                    <Route path="jenis-hewan" element={<PawrentJenisHewanPage />} />
                    <Route path="klinik" element={<PawrentKlinikPage />} />
                    <Route path="layanan" element={<PawrentLayananPage />} />
                    <Route path="booking" element={<PawrentBooking />} />
                    <Route path="shift" element={<PawrentShiftPage />} /> {/* Tambahkan route */}
                    <Route path="*" element={<Navigate to="/pawrent/dashboard" replace />} />
                  </Routes>
                </ProtectedRoute>
              } 
            />
            
            {/* ========================================================
                ADMIN KLINIK ROUTES (Role ID: 4)
                ======================================================== */}
            <Route 
              path="/admin-klinik/*" 
              element={
                <ProtectedRoute allowedRoles={[4]}>
                  <Routes>
                    <Route path="dashboard" element={<AdminKlinikDashboard />} />
                    <Route path="info" element={<AdminKlinikKlinikPage />} />
                    <Route path="kunjungan" element={<AdminKlinikKunjunganPage />} />
                    <Route path="booking" element={<AdminKlinikBookingPage />} />
                    <Route path="obat" element={<AdminKlinikObatPage />} />
                    <Route path="dokter" element={<AdminKlinikDokterPage />} />
                    <Route path="layanan" element={<AdminKlinikLayananPage />} /> {/* Tambahkan route ini */}
                    <Route path="hewan" element={<AdminKlinikHewanPage />} /> {/* Tambahkan route untuk hewan */}
                    <Route path="shift-dokter" element={<AdminKlinikShiftDokterPage />} /> {/* Tambahkan route untuk shift dokter */}
                    <Route path="auditlog" element={<AdminKlinikAuditLogPage />} />
                    <Route path="*" element={<Navigate to="/admin-klinik/dashboard" replace />} />
                  </Routes>
                </ProtectedRoute>
              } 
            />
            
            {/* ========================================================
                404 NOT FOUND ROUTE
                ======================================================== */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
