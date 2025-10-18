import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Stethoscope, PawPrint, Calendar, Database, FileText, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: "Kelola Pengguna",
      description: "Manajemen user dan role access",
      icon: Users,
      path: "/admin/users",
      color: "bg-primary"
    },
    {
      title: "Kelola Dokter",
      description: "Data dokter dan spesialisasi",
      icon: Stethoscope,
      path: "/admin/dokter",
      color: "bg-secondary"
    },
    {
      title: "Kelola Pawrent",
      description: "Data pemilik hewan",
      icon: Users,
      path: "/admin/pawrent",
      color: "bg-accent"
    },
    {
      title: "Kelola Hewan",
      description: "Data hewan dan jenis hewan",
      icon: PawPrint,
      path: "/admin/hewan",
      color: "bg-primary"
    },
    {
      title: "Kelola Kunjungan",
      description: "Riwayat kunjungan dan layanan",
      icon: Calendar,
      path: "/admin/kunjungan",
      color: "bg-secondary"
    },
    {
      title: "Kelola Obat",
      description: "Master data obat",
      icon: Database,
      path: "/admin/obat",
      color: "bg-accent"
    },
    {
      title: "Kelola Klinik",
      description: "Informasi klinik",
      icon: FileText,
      path: "/admin/klinik",
      color: "bg-primary"
    },
    {
      title: "Audit Log",
      description: "Riwayat aktivitas sistem",
      icon: Activity,
      path: "/admin/auditlog",
      color: "bg-secondary"
    }
  ];

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="space-y-6">
        <Card className="bg-gradient-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="text-2xl">Selamat Datang, Admin!</CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Kelola seluruh data dan sistem Klinik Hewan Sahabat Satwa
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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

export default AdminDashboard;
