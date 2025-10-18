import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { PawPrint, Stethoscope, Heart, Calendar, UserPlus } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="mx-auto mb-6 w-24 h-24 bg-primary rounded-full flex items-center justify-center">
            <PawPrint className="h-12 w-12 text-primary-foreground" />
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Vet Buddy Manager
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Sistem Manajemen Klinik Hewan Sahabat Satwa
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate("/login")}
              className="gap-2"
            >
              <UserPlus className="h-5 w-5" />
              Login
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/register")}
              className="gap-2"
            >
              <UserPlus className="h-5 w-5" />
              Daftar Sekarang
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Stethoscope className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Manajemen Kunjungan</CardTitle>
              <CardDescription>
                Kelola jadwal kunjungan dan rekam medis hewan dengan mudah
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Perawatan Hewan</CardTitle>
              <CardDescription>
                Sistem lengkap untuk tracking kesehatan dan perawatan hewan peliharaan
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Jadwal Dokter</CardTitle>
              <CardDescription>
                Atur jadwal dokter dan appointment dengan sistem yang efisien
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Info Section */}
        <div className="mt-16 text-center max-w-3xl mx-auto">
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <h3 className="text-2xl font-semibold mb-4">
                Bergabunglah dengan Vet Buddy Manager
              </h3>
              <p className="text-muted-foreground mb-6">
                Platform terpadu untuk manajemen klinik hewan yang memudahkan 
                dokter, staff, dan pemilik hewan dalam mengelola perawatan kesehatan hewan peliharaan.
              </p>
              <div className="flex gap-4 justify-center">
                <Button 
                  variant="default"
                  size="lg"
                  onClick={() => navigate("/register")}
                >
                  Daftar Sebagai Pawrent
                </Button>
                <Button 
                  variant="outline"
                  size="lg"
                  onClick={() => navigate("/register")}
                >
                  Daftar Sebagai Dokter
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>© 2025 Vet Buddy Manager - Klinik Hewan Sahabat Satwa</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
