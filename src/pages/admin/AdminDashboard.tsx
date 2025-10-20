import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  UserCog, 
  PawPrint, 
  Calendar, 
  Building2, 
  Pill, 
  Activity, 
  Shield,
  Syringe
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    console.log("Navigating to:", path);
    navigate(path);
  };

  const menuItems = [
    {
      title: "Kelola Kunjungan",
      description: "Manajemen data kunjungan pasien",
      icon: Calendar,
      path: "/admin/kunjungan",
      color: "bg-green-500"
    },
    {
      title: "Kunjungan Obat",
      description: "Kelola obat untuk setiap kunjungan",
      icon: Syringe,
      path: "/admin/kunjungan-obat",
      color: "bg-purple-500"
    },
    {
      title: "Kelola Hewan",
      description: "Data hewan pasien",
      icon: PawPrint,
      path: "/admin/hewan",
      color: "bg-blue-500"
    },
    {
      title: "Kelola Pawrent",
      description: "Data pemilik hewan",
      icon: Users,
      path: "/admin/pawrent",
      color: "bg-orange-500"
    },
    {
      title: "Kelola Dokter",
      description: "Manajemen data dokter hewan",
      icon: UserCog,
      path: "/admin/dokter",
      color: "bg-cyan-500"
    },
    {
      title: "Kelola Obat",
      description: "Data obat dan harga",
      icon: Pill,
      path: "/admin/obat",
      color: "bg-pink-500"
    },
    {
      title: "Kelola Layanan",
      description: "Data layanan klinik",
      icon: Activity,
      path: "/admin/layanan",
      color: "bg-indigo-500"
    },
    {
      title: "Kelola Klinik",
      description: "Informasi klinik",
      icon: Building2,
      path: "/admin/klinik",
      color: "bg-yellow-500"
    },
    {
      title: "Kelola Users",
      description: "Manajemen pengguna sistem",
      icon: Shield,
      path: "/admin/users",
      color: "bg-red-500"
    },
    {
      title: "Audit Log",
      description: "Riwayat perubahan data & aktivitas",
      icon: Shield,
      path: "/admin/auditlog",
      color: "bg-gray-500"
    },
    {
      title: "Kelola Jenis Hewan",
      description: "Manajemen jenis hewan peliharaan",
      icon: PawPrint,
      path: "/admin/jenis-hewan",
      color: "bg-teal-500"
    }
  ];

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="space-y-6">
        <Card className="bg-gradient-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="text-2xl">Selamat Datang, Admin!</CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Kelola semua data sistem Klinik Sahabat Satwa
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {menuItems.map((item, idx) => (
            <Card 
              key={idx} 
              className="hover:shadow-medium transition-all cursor-pointer group"
              onClick={() => handleNavigate(item.path)}
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${item.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <item.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNavigate(item.path);
                  }}
                >
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

export default AdminDashboard;
