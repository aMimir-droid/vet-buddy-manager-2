import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PawPrint, Calendar, FileText, User, Pill, Building2, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UserCog } from "lucide-react";
import klinikRoutes from './routes/klinik';
import layananRoutes from './routes/layanan';

const PawrentDashboard = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: "Hewan Saya",
      description: "Lihat data hewan kesayangan",
      icon: PawPrint,
      path: "/pawrent/hewan",
      color: "bg-primary"
    },
    {
      title: "Riwayat Kunjungan",
      description: "Riwayat medis dan perawatan",
      icon: Calendar,
      path: "/pawrent/riwayat",
      color: "bg-secondary"
    },
    {
      title: "Rekam Medis",
      description: "Detail diagnosis dan resep",
      icon: FileText,
      path: "/pawrent/rekam-medis",
      color: "bg-accent"
    },
        {
      title: "Klinik",
      description: "Lihat daftar klinik hewan",
      icon: Building2,
      path: "/pawrent/klinik",
      color: "bg-yellow-500"
    },
        {
      title: "Layanan Klinik",
      description: "Lihat daftar layanan yang tersedia",
      icon: Activity,
      path: "/pawrent/layanan",
      color: "bg-indigo-500"
    },
    {
      title: "Daftar Dokter",
      description: "Lihat dokter, kontak, dan spesialisasi",
      icon: UserCog,
      path: "/pawrent/dokter-list",
      color: "bg-cyan-500"
    },
    {
      title: "Daftar Obat",
      description: "Lihat obat, kegunaan, dan harga",
      icon: Pill,
      path: "/pawrent/obat-list",
      color: "bg-pink-500"
    },
        {
      title: "Jenis Hewan",
      description: "Lihat daftar jenis hewan peliharaan",
      icon: PawPrint,
      path: "/pawrent/jenis-hewan",
      color: "bg-teal-500"
    },
    {
      title: "Profil Saya",
      description: "Update data pribadi",
      icon: User,
      path: "/pawrent/profil", 
      color: "bg-primary"
    }

  ];

  return (
    <DashboardLayout title="Pawrent Dashboard">
      <div className="space-y-6">
        <Card className="bg-gradient-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="text-2xl">Selamat Datang!</CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Pantau kesehatan hewan kesayangan Anda
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {menuItems.map((item, idx) => (
            <Card 
              key={idx} 
              className="hover:shadow-medium transition-all cursor-pointer group"
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

export default PawrentDashboard;
