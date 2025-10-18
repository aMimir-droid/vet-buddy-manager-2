import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { pawrentApi, hewanApi, kunjunganApi } from "@/lib/api";
import { toast } from "sonner";
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Stethoscope,
  PawPrint,
  Activity,
  TrendingUp,
  Calendar,
  AlertCircle,
  HeartPulse,
  Info,
  Edit,
  Save,
  X
} from "lucide-react";

const PawrentProfilPage = () => {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nama_depan_pawrent: "",
    nama_belakang_pawrent: "",
    alamat_pawrent: "",
    kota_pawrent: "",
    kode_pos_pawrent: "",
    nomor_hp: "",
  });

  // Get pawrent data
  const { data: pawrents, isLoading: isLoadingPawrent } = useQuery({
    queryKey: ["pawrents"],
    queryFn: () => pawrentApi.getAll(token!),
  });

  // Get hewans data
  const { data: hewans, isLoading: isLoadingHewan } = useQuery({
    queryKey: ["hewans"],
    queryFn: () => hewanApi.getAll(token!),
  });

  // Get kunjungans data
  const { data: kunjungans, isLoading: isLoadingKunjungan } = useQuery({
    queryKey: ["kunjungans"],
    queryFn: () => kunjunganApi.getAll(token!),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => pawrentApi.updateSelf(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pawrents"] });
      toast.success("Profil berhasil diupdate");
      setIsEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal update profil");
    },
  });

  // Filter data by current pawrent
  const currentPawrent = Array.isArray(pawrents) ? pawrents.find((p: any) => p.pawrent_id === user?.pawrent_id) : undefined;
  const myHewans = (Array.isArray(hewans) ? hewans : []).filter((h: any) => h.pawrent_id === user?.pawrent_id);
  const myHewanIds = myHewans.map((h: any) => h.hewan_id);
  const myKunjungans = (Array.isArray(kunjungans) ? kunjungans : []).filter((k: any) => myHewanIds.includes(k.hewan_id));

  const handleOpenEditDialog = () => {
    if (currentPawrent) {
      setFormData({
        nama_depan_pawrent: currentPawrent.nama_depan_pawrent || "",
        nama_belakang_pawrent: currentPawrent.nama_belakang_pawrent || "",
        alamat_pawrent: currentPawrent.alamat_pawrent || "",
        kota_pawrent: currentPawrent.kota_pawrent || "",
        kode_pos_pawrent: currentPawrent.kode_pos_pawrent || "",
        nomor_hp: currentPawrent.nomor_hp || "",
      });
      setIsEditDialogOpen(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount) || numAmount === null || numAmount === undefined) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(numAmount);
  };

  // Calculate statistics
  const totalHewan = myHewans.length;
  const hewanHidup = myHewans.filter((h: any) => h.status_hidup === "Hidup").length;
  const totalKunjungan = myKunjungans.length;
  const totalBiaya = myKunjungans.reduce((sum: number, k: any) => {
    const biaya = typeof k.total_biaya === 'string' ? parseFloat(k.total_biaya) : k.total_biaya;
    return sum + (isNaN(biaya) ? 0 : biaya);
  }, 0);

  const lastVisit = myKunjungans.length > 0 
    ? myKunjungans.sort((a, b) => {
        const dateA = new Date(a.tanggal_kunjungan);
        const dateB = new Date(b.tanggal_kunjungan);
        return dateB.getTime() - dateA.getTime();
      })[0]
    : null;

  const memberSince = currentPawrent?.created_at 
    ? formatDate(currentPawrent.created_at)
    : lastVisit 
      ? formatDate(lastVisit.tanggal_kunjungan) 
      : "Baru bergabung";

  if (isLoadingPawrent || isLoadingHewan || isLoadingKunjungan) {
    return (
      <DashboardLayout title="Profil Saya">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-2 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!currentPawrent) {
    return (
      <DashboardLayout title="Profil Saya" showBackButton={true} backTo="/pawrent/dashboard">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Data Tidak Ditemukan
            </CardTitle>
            <CardDescription>
              Tidak dapat menemukan data profil Anda. Silakan hubungi administrator.
            </CardDescription>
          </CardHeader>
        </Card>
      </DashboardLayout>
    );
  }

  const fullName = `${currentPawrent.nama_depan_pawrent || ''} ${currentPawrent.nama_belakang_pawrent || ''}`.trim();

  return (
    <DashboardLayout title="Profil Saya" showBackButton={true} backTo="/pawrent/dashboard">
      <div className="space-y-6">
        {/* Profile Header */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
                  <User className="h-10 w-10 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{fullName}</h2>
                  <p className="text-muted-foreground flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4" />
                    {user?.email || 'Email tidak tersedia'}
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    Member sejak {memberSince}
                  </Badge>
                </div>
              </div>
              <Button onClick={handleOpenEditDialog} className="gap-2">
                <Edit className="h-4 w-4" />
                Edit Profil
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hewan</CardTitle>
              <PawPrint className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalHewan}</div>
              <p className="text-xs text-muted-foreground">
                {hewanHidup} hewan hidup
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Kunjungan</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">{totalKunjungan}</div>
              <p className="text-xs text-muted-foreground">
                Riwayat kunjungan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Biaya</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{formatCurrency(totalBiaya)}</div>
              <p className="text-xs text-muted-foreground">
                Keseluruhan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kunjungan Terakhir</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {lastVisit ? formatDate(lastVisit.tanggal_kunjungan) : 'Belum ada'}
              </div>
              <p className="text-xs text-muted-foreground">
                {lastVisit ? lastVisit.nama_hewan : '-'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Profile Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informasi Pribadi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Nama Lengkap</Label>
                <p className="text-lg font-medium mt-1">{fullName}</p>
              </div>

              <Separator />

              <div>
                <Label className="text-muted-foreground">Nomor Telepon</Label>
                <p className="text-lg font-medium mt-1 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  {currentPawrent.nomor_hp || 'Tidak ada'}
                </p>
              </div>

              <Separator />

              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="text-lg font-medium mt-1 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  {user?.email || 'Tidak ada'}
                </p>
              </div>

              <Separator />

              <div>
                <Label className="text-muted-foreground">Alamat</Label>
                <p className="text-lg font-medium mt-1 flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary mt-1" />
                  <span>
                    {currentPawrent.alamat_pawrent 
                      ? `${currentPawrent.alamat_pawrent}${currentPawrent.kota_pawrent ? ', ' + currentPawrent.kota_pawrent : ''}${currentPawrent.kode_pos_pawrent ? ' ' + currentPawrent.kode_pos_pawrent : ''}`
                      : 'Alamat belum diisi'}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Medical Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Informasi Medis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Dokter Hewan</Label>
                <p className="text-lg font-medium mt-1 flex items-center gap-2">
                  <HeartPulse className="h-4 w-4 text-primary" />
                  {currentPawrent.nama_dokter || 'Belum ada dokter tetap'}
                </p>
              </div>

              <Separator />

              <div>
                <Label className="text-muted-foreground">Jumlah Hewan Terdaftar</Label>
                <p className="text-lg font-medium mt-1">
                  {totalHewan} hewan ({hewanHidup} hidup)
                </p>
              </div>

              <Separator />

              <div>
                <Label className="text-muted-foreground">Total Kunjungan</Label>
                <p className="text-lg font-medium mt-1">
                  {totalKunjungan} kunjungan
                </p>
              </div>

              <Separator />

              <div>
                <Label className="text-muted-foreground">Total Pengeluaran</Label>
                <p className="text-lg font-medium mt-1 text-accent">
                  {formatCurrency(totalBiaya)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        {lastVisit && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Kunjungan Terakhir
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{lastVisit.nama_hewan}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(lastVisit.tanggal_kunjungan)} • {lastVisit.nama_dokter}
                  </p>
                </div>
                <Badge variant="secondary">
                  {formatCurrency(lastVisit.total_biaya)}
                </Badge>
              </div>
              {lastVisit.catatan && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-muted-foreground">Catatan</Label>
                    <p className="text-sm mt-1">{lastVisit.catatan}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Info Box */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Update Profil Anda
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Klik tombol "Edit Profil" untuk memperbarui informasi pribadi Anda seperti 
                  nama, nomor telepon, dan alamat. Data hewan Anda dapat diubah di menu "Hewan Saya".
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Profil Saya
            </DialogTitle>
            <DialogDescription>
              Perbarui informasi pribadi Anda
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nama_depan_pawrent">
                    Nama Depan <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nama_depan_pawrent"
                    value={formData.nama_depan_pawrent}
                    onChange={(e) => setFormData({ ...formData, nama_depan_pawrent: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="nama_belakang_pawrent">
                    Nama Belakang <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nama_belakang_pawrent"
                    value={formData.nama_belakang_pawrent}
                    onChange={(e) => setFormData({ ...formData, nama_belakang_pawrent: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="nomor_hp">
                  Nomor HP <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nomor_hp"
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  value={formData.nomor_hp}
                  onChange={(e) => setFormData({ ...formData, nomor_hp: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="alamat_pawrent">Alamat</Label>
                <textarea
                  id="alamat_pawrent"
                  className="w-full min-h-[80px] px-3 py-2 border rounded-md resize-none"
                  placeholder="Jl. Contoh No. 123"
                  value={formData.alamat_pawrent}
                  onChange={(e) => setFormData({ ...formData, alamat_pawrent: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="kota_pawrent">Kota</Label>
                  <Input
                    id="kota_pawrent"
                    placeholder="Jakarta"
                    value={formData.kota_pawrent}
                    onChange={(e) => setFormData({ ...formData, kota_pawrent: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="kode_pos_pawrent">Kode Pos</Label>
                  <Input
                    id="kode_pos_pawrent"
                    placeholder="12345"
                    value={formData.kode_pos_pawrent}
                    onChange={(e) => setFormData({ ...formData, kode_pos_pawrent: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
              >
                <X className="h-4 w-4 mr-2" />
                Batal
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default PawrentProfilPage;