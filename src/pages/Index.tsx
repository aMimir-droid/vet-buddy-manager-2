import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Heart, Shield, Clock, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-vet.jpg";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/60"></div>
        </div>
        
        <div className="container relative z-10 px-4 py-20 mx-auto text-center">
          <h1 className="mb-6 text-5xl font-bold text-primary-foreground md:text-6xl">
            Klinik Hewan Sahabat Satwa
          </h1>
          <p className="mb-8 text-xl text-primary-foreground/90 max-w-2xl mx-auto">
            Layanan kesehatan terbaik untuk hewan kesayangan Anda dengan dokter berpengalaman dan fasilitas modern
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate('/login')}
              className="shadow-strong"
            >
              Masuk <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="bg-primary-foreground/10 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
            >
              Pelajari Lebih Lanjut
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Mengapa Memilih Kami?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Kami berkomitmen memberikan perawatan terbaik untuk hewan kesayangan Anda
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Heart,
                title: "Perawatan Penuh Kasih",
                description: "Setiap hewan diperlakukan dengan cinta dan perhatian khusus"
              },
              {
                icon: Shield,
                title: "Dokter Berpengalaman",
                description: "Tim dokter hewan profesional dengan spesialisasi lengkap"
              },
              {
                icon: Clock,
                title: "Layanan 24/7",
                description: "Siap melayani kapan saja hewan Anda membutuhkan"
              },
              {
                icon: Users,
                title: "Sistem Terintegrasi",
                description: "Rekam medis digital yang aman dan mudah diakses"
              }
            ].map((feature, idx) => (
              <Card key={idx} className="p-6 hover:shadow-medium transition-shadow">
                <feature.icon className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Layanan Kami
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Berbagai layanan kesehatan hewan yang komprehensif
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Pemeriksaan Rutin",
                description: "Check-up kesehatan berkala untuk menjaga kondisi optimal hewan Anda",
                color: "bg-primary"
              },
              {
                title: "Vaksinasi",
                description: "Program vaksinasi lengkap untuk melindungi hewan dari berbagai penyakit",
                color: "bg-secondary"
              },
              {
                title: "Perawatan Gigi",
                description: "Pembersihan dan perawatan gigi profesional untuk kesehatan mulut",
                color: "bg-accent"
              },
              {
                title: "Operasi",
                description: "Fasilitas operasi modern dengan peralatan medis terkini",
                color: "bg-primary"
              },
              {
                title: "Grooming",
                description: "Layanan perawatan dan kecantikan untuk hewan kesayangan",
                color: "bg-secondary"
              },
              {
                title: "Rawat Inap",
                description: "Fasilitas rawat inap yang nyaman dengan pengawasan 24 jam",
                color: "bg-accent"
              }
            ].map((service, idx) => (
              <Card key={idx} className="overflow-hidden hover:shadow-medium transition-shadow">
                <div className={`h-2 ${service.color}`}></div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
                  <p className="text-muted-foreground">{service.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-4xl font-bold text-primary-foreground mb-6">
            Siap Memberikan yang Terbaik untuk Hewan Anda?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Login sekarang untuk mengakses sistem manajemen klinik kami
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => navigate('/login')}
            className="shadow-strong"
          >
            Masuk ke Sistem
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-8">
        <div className="container px-4 mx-auto text-center text-muted-foreground">
          <p>&copy; 2025 Klinik Hewan Sahabat Satwa. Semua hak dilindungi.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
