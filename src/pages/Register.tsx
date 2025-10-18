import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { PawPrint, User, Mail, Lock, ArrowLeft, Stethoscope } from "lucide-react";
import { authApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const Register = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  // Base form data
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role_id: "",
  });

  // Pawrent-specific data
  const [pawrentData, setPawrentData] = useState({
    nama_depan_pawrent: "",
    nama_belakang_pawrent: "",
    alamat_pawrent: "",
    kota_pawrent: "",
    kode_pos_pawrent: "",
    nomor_hp: "",
    dokter_id: "",
  });

  // Dokter-specific data
  const [dokterData, setDokterData] = useState({
    title_dokter: "",
    nama_dokter: "",
    telepon_dokter: "",
    tanggal_mulai_kerja: "",
    spesialisasi_id: "none",
    klinik_id: "none",
  });

  // ========================================================
  // FETCH PUBLIC DATA (No Auth Required)
  // ========================================================
  
  // Get public dokters for pawrent selection
  const { data: dokters } = useQuery({
    queryKey: ["dokters-public"],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/public/dokters`);
      if (!response.ok) throw new Error('Failed to fetch dokters');
      return response.json();
    },
    enabled: formData.role_id === "3",
  });

  // Get public kliniks for dokter selection
  const { data: kliniks } = useQuery({
    queryKey: ["kliniks-public"],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/public/kliniks`);
      if (!response.ok) throw new Error('Failed to fetch kliniks');
      return response.json();
    },
    enabled: formData.role_id === "2",
  });

  // Get public spesialisasi for dokter selection
  const { data: spesialisasi } = useQuery({
    queryKey: ["spesialisasi-public"],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/public/spesialisasi`);
      if (!response.ok) throw new Error('Failed to fetch spesialisasi');
      return response.json();
    },
    enabled: formData.role_id === "2",
  });

  // Reset role-specific data when role changes
  useEffect(() => {
    if (formData.role_id === "2") {
      setPawrentData({
        nama_depan_pawrent: "",
        nama_belakang_pawrent: "",
        alamat_pawrent: "",
        kota_pawrent: "",
        kode_pos_pawrent: "",
        nomor_hp: "",
        dokter_id: "",
      });
    } else if (formData.role_id === "3") {
      setDokterData({
        title_dokter: "",
        nama_dokter: "",
        telepon_dokter: "",
        tanggal_mulai_kerja: "",
        spesialisasi_id: "none",
        klinik_id: "none",
      });
    }
  }, [formData.role_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate password match
      if (formData.password !== formData.confirmPassword) {
        toast.error("Password dan konfirmasi password tidak cocok");
        return;
      }

      // Validate password length
      if (formData.password.length < 6) {
        toast.error("Password minimal 6 karakter");
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error("Format email tidak valid");
        return;
      }

      // Prepare registration data
      const registrationData: any = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role_id: parseInt(formData.role_id),
      };

      // Add role-specific data
      if (formData.role_id === "3") {
        // Validate Pawrent required fields
        if (!pawrentData.nama_depan_pawrent || !pawrentData.nama_belakang_pawrent || 
            !pawrentData.nomor_hp || !pawrentData.dokter_id) {
          toast.error("Nama depan, nama belakang, nomor HP, dan dokter wajib diisi");
          return;
        }

        registrationData.pawrent_data = {
          ...pawrentData,
          dokter_id: parseInt(pawrentData.dokter_id),
        };
      } else if (formData.role_id === "2") {
        // Validate Dokter required fields
        if (!dokterData.title_dokter || !dokterData.nama_dokter) {
          toast.error("Title dokter dan nama dokter wajib diisi");
          return;
        }

        registrationData.dokter_data = {
          ...dokterData,
          spesialisasi_id: dokterData.spesialisasi_id === "none" ? null : parseInt(dokterData.spesialisasi_id),
          klinik_id: dokterData.klinik_id === "none" ? null : parseInt(dokterData.klinik_id),
        };
      }

      console.log("📤 Registration data:", registrationData);

      // Register using stored procedure
      const response: any = await authApi.register(registrationData);

      toast.success("Registrasi berhasil! Anda akan diarahkan ke dashboard...");

      // Auto-login after successful registration
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('auth_user', JSON.stringify(response.user));
      }

      // Redirect to dashboard
      setTimeout(() => {
        navigate("/dashboard");
        window.location.reload(); // Reload to update auth state
      }, 1500);

    } catch (error: any) {
      console.error("❌ Registration error:", error);
      toast.error(error.message || "Registrasi gagal");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4 py-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <PawPrint className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Daftar Akun Baru</h1>
          <p className="text-muted-foreground text-lg">
            Klinik Hewan Sahabat Satwa
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Pawrent Card */}
          <Card 
            className={cn(
              "cursor-pointer transition-all hover:shadow-lg border-2",
              formData.role_id === "3" 
                ? "border-orange-500 shadow-lg ring-2 ring-orange-500/20" 
                : "border-border hover:border-orange-300"
            )}
            onClick={() => setFormData({ ...formData, role_id: "3" })}
          >
            <CardContent className="pt-8 pb-8 text-center">
              <div className={cn(
                "mx-auto mb-4 w-20 h-20 rounded-full flex items-center justify-center transition-colors",
                formData.role_id === "3" 
                  ? "bg-orange-500" 
                  : "bg-orange-100"
              )}>
                <PawPrint className={cn(
                  "h-10 w-10",
                  formData.role_id === "3" ? "text-white" : "text-orange-600"
                )} />
              </div>
              <h3 className="text-2xl font-bold mb-2">Pawrent</h3>
              <p className="text-muted-foreground text-lg">Pemilik Hewan</p>
            </CardContent>
          </Card>

          {/* Dokter Card */}
          <Card 
            className={cn(
              "cursor-pointer transition-all hover:shadow-lg border-2",
              formData.role_id === "2" 
                ? "border-blue-500 shadow-lg ring-2 ring-blue-500/20" 
                : "border-border hover:border-blue-300"
            )}
            onClick={() => setFormData({ ...formData, role_id: "2" })}
          >
            <CardContent className="pt-8 pb-8 text-center">
              <div className={cn(
                "mx-auto mb-4 w-20 h-20 rounded-full flex items-center justify-center transition-colors",
                formData.role_id === "2" 
                  ? "bg-blue-500" 
                  : "bg-blue-100"
              )}>
                <Stethoscope className={cn(
                  "h-10 w-10",
                  formData.role_id === "2" ? "text-white" : "text-blue-600"
                )} />
              </div>
              <h3 className="text-2xl font-bold mb-2">Dokter Hewan</h3>
              <p className="text-muted-foreground text-lg">Veterinarian</p>
            </CardContent>
          </Card>
        </div>

        {/* Registration Form */}
        {formData.role_id && (
          <Card className="shadow-strong animate-in fade-in-50 duration-300">
            <CardHeader>
              <CardTitle className="text-2xl">
                {formData.role_id === "3" ? "Formulir Pendaftaran Pawrent" : "Formulir Pendaftaran Dokter"}
              </CardTitle>
              <CardDescription>
                {formData.role_id === "3" 
                  ? "Lengkapi data diri Anda sebagai pemilik hewan" 
                  : "Lengkapi data profesi Anda sebagai dokter hewan"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Base Form Fields */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Informasi Akun</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="username"
                          type="text"
                          placeholder="Masukkan username"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="email@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="Minimal 6 karakter"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Konfirmasi Password *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Ulangi password"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dynamic Form: Pawrent Data */}
                {formData.role_id === "3" && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">Data Pemilik Hewan</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nama_depan_pawrent">Nama Depan *</Label>
                        <Input
                          id="nama_depan_pawrent"
                          value={pawrentData.nama_depan_pawrent}
                          onChange={(e) => setPawrentData({ ...pawrentData, nama_depan_pawrent: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nama_belakang_pawrent">Nama Belakang *</Label>
                        <Input
                          id="nama_belakang_pawrent"
                          value={pawrentData.nama_belakang_pawrent}
                          onChange={(e) => setPawrentData({ ...pawrentData, nama_belakang_pawrent: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="alamat_pawrent">Alamat</Label>
                        <Input
                          id="alamat_pawrent"
                          value={pawrentData.alamat_pawrent}
                          onChange={(e) => setPawrentData({ ...pawrentData, alamat_pawrent: e.target.value })}
                          placeholder="Alamat lengkap"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="kota_pawrent">Kota</Label>
                        <Input
                          id="kota_pawrent"
                          value={pawrentData.kota_pawrent}
                          onChange={(e) => setPawrentData({ ...pawrentData, kota_pawrent: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="kode_pos_pawrent">Kode Pos</Label>
                        <Input
                          id="kode_pos_pawrent"
                          value={pawrentData.kode_pos_pawrent}
                          onChange={(e) => setPawrentData({ ...pawrentData, kode_pos_pawrent: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nomor_hp">Nomor HP *</Label>
                        <Input
                          id="nomor_hp"
                          type="tel"
                          value={pawrentData.nomor_hp}
                          onChange={(e) => setPawrentData({ ...pawrentData, nomor_hp: e.target.value })}
                          placeholder="08xxxxxxxxxx"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dokter_id">Dokter yang Menangani *</Label>
                        <Select 
                          value={pawrentData.dokter_id} 
                          onValueChange={(value) => setPawrentData({ ...pawrentData, dokter_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih dokter" />
                          </SelectTrigger>
                          <SelectContent>
                            {dokters?.map((dokter: any) => (
                              <SelectItem key={dokter.dokter_id} value={dokter.dokter_id.toString()}>
                                {dokter.display_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Dynamic Form: Dokter Data */}
                {formData.role_id === "2" && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">Data Dokter Hewan</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title_dokter">Title Dokter *</Label>
                        <Input
                          id="title_dokter"
                          value={dokterData.title_dokter}
                          onChange={(e) => setDokterData({ ...dokterData, title_dokter: e.target.value })}
                          placeholder="drh., drh. Sp.KH"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nama_dokter">Nama Dokter *</Label>
                        <Input
                          id="nama_dokter"
                          value={dokterData.nama_dokter}
                          onChange={(e) => setDokterData({ ...dokterData, nama_dokter: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="telepon_dokter">Nomor Telepon</Label>
                        <Input
                          id="telepon_dokter"
                          type="tel"
                          value={dokterData.telepon_dokter}
                          onChange={(e) => setDokterData({ ...dokterData, telepon_dokter: e.target.value })}
                          placeholder="08xxxxxxxxxx"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tanggal_mulai_kerja">Tanggal Mulai Kerja</Label>
                        <Input
                          id="tanggal_mulai_kerja"
                          type="date"
                          value={dokterData.tanggal_mulai_kerja}
                          onChange={(e) => setDokterData({ ...dokterData, tanggal_mulai_kerja: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="spesialisasi_id">Spesialisasi</Label>
                        <Select 
                          value={dokterData.spesialisasi_id} 
                          onValueChange={(value) => setDokterData({ ...dokterData, spesialisasi_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih spesialisasi" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Tidak ada</SelectItem>
                            {spesialisasi?.map((spec: any) => (
                              <SelectItem key={spec.spesialisasi_id} value={spec.spesialisasi_id.toString()}>
                                {spec.nama_spesialisasi}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="klinik_id">Klinik</Label>
                        <Select 
                          value={dokterData.klinik_id} 
                          onValueChange={(value) => setDokterData({ ...dokterData, klinik_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih klinik" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Tidak ada</SelectItem>
                            {kliniks?.map((klinik: any) => (
                              <SelectItem key={klinik.klinik_id} value={klinik.klinik_id.toString()}>
                                {klinik.nama_klinik}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? "Memproses..." : "Daftar Sekarang"}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <p className="text-muted-foreground">
                  Sudah punya akun?{" "}
                  <Link to="/login" className="text-primary hover:underline font-medium">
                    Login di sini
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Beranda
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;