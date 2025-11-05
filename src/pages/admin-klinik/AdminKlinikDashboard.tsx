import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  PawPrint, 
  UserCog, 
  Pill, 
  Activity, 
  Building2, 
  Shield,
  Syringe,
  Clock
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminKlinikDashboard = () => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    console.log("Navigating to:", path);
    navigate(path);
  };

  const menuItems = [
    {
      title: "Kelola Kunjungan Klinik",
      description: "Manajemen kunjungan di klinik ini",
      icon: Calendar,
      path: "/admin-klinik/kunjungan",
      color: "bg-green-500"
    },
    {
      title: "Booking Klinik",
      description: "Kelola booking di klinik ini",
      icon: Calendar,
      path: "/admin-klinik/booking",
      color: "bg-cyan-500"
    },
    {
      title: "Hewan di Klinik",
      description: "Data hewan yang berkunjung ke klinik ini",
      icon: PawPrint,
      path: "/admin-klinik/hewan",
      color: "bg-blue-500"
    },
    {
      title: "Dokter Klinik",
      description: "Dokter yang bekerja di klinik ini",
      icon: UserCog,
      path: "/admin-klinik/dokter",
      color: "bg-cyan-500"
    },
    {
      title: "Stok Obat Klinik",
      description: "Kelola stok obat di klinik ini",
      icon: Pill,
      path: "/admin-klinik/obat",
      color: "bg-pink-500"
    },
    {
      title: "Layanan Klinik",
      description: "Layanan yang tersedia di klinik ini",
      icon: Activity,
      path: "/admin-klinik/layanan",
      color: "bg-indigo-500"
    },
    {
      title: "Info Klinik",
      description: "Detail klinik ini",
      icon: Building2,
      path: "/admin-klinik/info",
      color: "bg-yellow-500"
    },
    {
      title: "Shift Dokter Klinik",
      description: "Kelola shift dokter di klinik ini",
      icon: Clock,
      path: "/admin-klinik/shift-dokter",
      color: "bg-purple-500"
    },
    {
      title: "Audit Log Klinik",
      description: "Riwayat aktivitas di klinik ini",
      icon: Shield,
      path: "/admin-klinik/auditlog",
      color: "bg-purple-500"
    }
  ];

  return (
    <DashboardLayout title="Admin Klinik Dashboard">
      <div className="space-y-6">
        <Card className="bg-gradient-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="text-2xl">Selamat Datang, Admin Klinik!</CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Kelola data khusus klinik Anda
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

export default AdminKlinikDashboard;