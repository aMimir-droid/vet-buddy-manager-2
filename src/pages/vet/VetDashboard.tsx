import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, PawPrint, Pill, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

const VetDashboard = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: "Kunjungan Hari Ini",
      description: "Lihat jadwal kunjungan hari ini",
      icon: Calendar,
      path: "/vet/today",
      color: "bg-primary"
    },
    {
      title: "Input Kunjungan",
      description: "Tambah data kunjungan baru",
      icon: FileText,
      path: "/vet/kunjungan/new",
      color: "bg-secondary"
    },
    {
      title: "Data Hewan",
      description: "Lihat data pasien hewan",
      icon: PawPrint,
      path: "/vet/hewan",
      color: "bg-accent"
    },
    {
      title: "Resep Obat",
      description: "Kelola resep dan obat",
      icon: Pill,
      path: "/vet/obat",
      color: "bg-primary"
    }
  ];

  return (
    <DashboardLayout title="Dokter Dashboard">
      <div className="space-y-6">
        <Card className="bg-gradient-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="text-2xl">Selamat Datang, Dokter!</CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Kelola kunjungan dan data medis hewan
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

export default VetDashboard;
