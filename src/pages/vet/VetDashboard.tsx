import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, PawPrint, Database, Syringe, Stethoscope, Building2, UserCog, Power } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dokterApi } from "@/lib/api";
import { toast } from "sonner";
import { useState } from "react";

const VetDashboard = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  const [isActive, setIsActive] = useState(user?.is_active ?? true); // Asumsikan user memiliki is_active

  const toggleActiveMutation = useMutation({
    mutationFn: async () => {
      return dokterApi.toggleActive(user.dokter_id, token);
    },
    onSuccess: (data) => {
      setIsActive(data.is_active);
      toast.success(`Status dokter ${data.is_active ? 'diaktifkan' : 'dinonaktifkan'}`);
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal mengubah status");
    },
  });

  const menuItems = [
    {
      title: "Kelola Kunjungan",
      description: "Input dan kelola kunjungan pasien",
      icon: Calendar,
      path: "/vet/kunjungan",
      color: "bg-green-500"
    },
    {
      title: "Booking Janji Temu",
      description: "Lihat dan kelola booking untuk Anda",
      icon: Calendar,
      path: "/vet/booking",
      color: "bg-cyan-500"
    },
    {
      title: "Kelola Obat Kunjungan",
      description: "Atur resep obat untuk setiap kunjungan",
      icon: Syringe,
      path: "/vet/kunjungan-obat",
      color: "bg-purple-500"
    },
    {
      title: "Data Hewan",
      description: "Lihat data hewan pasien",
      icon: PawPrint,
      path: "/vet/hewan",
      color: "bg-primary"
    },
    {
      title: "Data Obat",
      description: "Daftar obat dan resep",
      icon: Database,
      path: "/vet/obat",
      color: "bg-secondary"
    },
    {
      title: "Data Layanan",
      description: "Referensi layanan medis",
      icon: Stethoscope,
      path: "/vet/layanan",
      color: "bg-indigo-500"
    },
    {
      title: "Daftar Klinik",
      description: "Lihat semua klinik & klinik Anda",
      icon: Building2,
      path: "/vet/klinik",
      color: "bg-yellow-500"
    },
    {
      title: "Jenis Hewan",
      description: "Lihat daftar jenis hewan peliharaan",
      icon: PawPrint,
      path: "/vet/jenis-hewan",
      color: "bg-teal-500"
    },
    {
      title: "Profil Saya",
      description: "Update data pribadi dokter",
      icon: UserCog,
      path: "/vet/profil",
      color: "bg-primary"
    },
    {
      title: "Shift Saya",
      description: "Lihat jadwal shift kerja saya",
      icon: Calendar,
      path: "/vet/shift",
      color: "bg-orange-500"
    }
  ];

  return (
    <DashboardLayout title="Dokter Dashboard">
      <div className="space-y-6">
        <Card className="bg-gradient-primary text-primary-foreground">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Selamat Datang, Dokter!</CardTitle>
                <CardDescription className="text-primary-foreground/80">
                  Kelola kunjungan, resep obat, dan rekam medis pasien hewan
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm">Status: {isActive ? 'Aktif' : 'Non-Aktif'}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleActiveMutation.mutate()}
                  disabled={toggleActiveMutation.isPending}
                  className={`flex items-center gap-2 ${isActive ? 'text-green-600' : 'text-red-600'}`}
                >
                  <Power className="h-4 w-4" />
                  {isActive ? 'Nonaktifkan' : 'Aktifkan'}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {menuItems.map((item, idx) => (
            <Card 
              key={idx} 
              className={`hover:shadow-medium transition-all cursor-pointer group ${
                item.highlight ? 'ring-2 ring-green-500 ring-offset-2' : ''
              }`}
              onClick={() => navigate(item.path)}
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${item.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <item.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full">
                  Buka
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default VetDashboard;
