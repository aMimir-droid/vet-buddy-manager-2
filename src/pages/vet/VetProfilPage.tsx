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
import { dokterApi } from "@/lib/api";
import { toast } from "sonner";
import {
  UserCog,
  Phone,
  Mail,
  Stethoscope,
  Building2,
  Calendar,
  Edit,
  Save,
  X,
  Info,
} from "lucide-react";

const VetProfilPage = () => {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title_dokter: "",
    nama_dokter: "",
    telepon_dokter: "",
    tanggal_mulai_kerja: "",
    spesialisasi_id: "",
    klinik_id: "",
  });

  // Get dokter data
  const { data: dokter, isLoading } = useQuery({
    queryKey: ["dokter-profil", user?.dokter_id],
    queryFn: () => dokterApi.getById(user?.dokter_id, token!),
    enabled: !!user?.dokter_id && !!token,
  });

  // Get spesialisasi for dropdown
  const { data: spesialisasi } = useQuery({
    queryKey: ["spesialisasi"],
    queryFn: () => dokterApi.getSpesialisasi(token!),
    enabled: !!token,
  });

  // Get klinik for dropdown
  const { data: kliniks } = useQuery({
    queryKey: ["klinik-list"],
    queryFn: () => dokterApi.getKlinikList(token!),
    enabled: !!token,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => dokterApi.update(user?.dokter_id, data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dokter-profil", user?.dokter_id] });
      toast.success("Profil dokter berhasil diupdate");
      setIsEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal update profil dokter");
    },
  });

  const handleOpenEditDialog = () => {
    if (dokter) {
      setFormData({
        title_dokter: dokter.title_dokter || "",
        nama_dokter: dokter.nama_dokter || "",
        telepon_dokter: dokter.telepon_dokter || "",
        tanggal_mulai_kerja: dokter.tanggal_mulai_kerja?.split("T")[0] || "",
        spesialisasi_id: dokter.spesialisasi_id?.toString() || "",
        klinik_id: dokter.klinik_id?.toString() || "",
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

  if (isLoading) {
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

  if (!dokter) {
    return (
      <DashboardLayout title="Profil Saya" showBackButton={true} backTo="/vet/dashboard">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
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

  return (
    <DashboardLayout title="Profil Saya" showBackButton={true} backTo="/vet/dashboard">
      <div className="space-y-6">
        {/* Profile Header */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
                  <UserCog className="h-10 w-10 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {dokter.title_dokter} {dokter.nama_dokter}
                  </h2>
                  <p className="text-muted-foreground flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4" />
                    {user?.email || 'Email tidak tersedia'}
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    {dokter.nama_spesialisasi || "Dokter Umum"}
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

        {/* Main Profile Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                Informasi Pribadi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Nama Lengkap & Gelar</Label>
                <p className="text-lg font-medium mt-1">
                  {dokter.title_dokter} {dokter.nama_dokter}
                </p>
              </div>
              <Separator />
              <div>
                <Label className="text-muted-foreground">Nomor Telepon</Label>
                <p className="text-lg font-medium mt-1 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  {dokter.telepon_dokter || 'Tidak ada'}
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
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Informasi Profesi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Spesialisasi</Label>
                <p className="text-lg font-medium mt-1 flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-primary" />
                  {dokter.nama_spesialisasi || 'Dokter Umum'}
                </p>
              </div>
              <Separator />
              <div>
                <Label className="text-muted-foreground">Tanggal Mulai Kerja</Label>
                <p className="text-lg font-medium mt-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  {formatDate(dokter.tanggal_mulai_kerja)}
                </p>
              </div>
              <Separator />
              <div>
                <Label className="text-muted-foreground">Klinik</Label>
                <p className="text-lg font-medium mt-1 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  {dokter.nama_klinik || '-'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

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
                  Klik tombol "Edit Profil" untuk memperbarui informasi pribadi Anda seperti nama, gelar, nomor telepon, dan spesialisasi. Klinik tidak dapat diubah sendiri.
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
              Perbarui informasi penting Anda sebagai dokter
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title_dokter">
                    Gelar <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title_dokter"
                    value={formData.title_dokter}
                    onChange={(e) => setFormData({ ...formData, title_dokter: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="nama_dokter">
                    Nama Lengkap <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nama_dokter"
                    value={formData.nama_dokter}
                    onChange={(e) => setFormData({ ...formData, nama_dokter: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="telepon_dokter">
                  Nomor HP <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="telepon_dokter"
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  value={formData.telepon_dokter}
                  onChange={(e) => setFormData({ ...formData, telepon_dokter: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="tanggal_mulai_kerja">Tanggal Mulai Kerja</Label>
                <Input
                  id="tanggal_mulai_kerja"
                  type="date"
                  value={formData.tanggal_mulai_kerja}
                  onChange={(e) => setFormData({ ...formData, tanggal_mulai_kerja: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="spesialisasi_id">Spesialisasi</Label>
                <select
                  id="spesialisasi_id"
                  className="w-full border rounded px-2 py-1"
                  value={formData.spesialisasi_id}
                  onChange={(e) => setFormData({ ...formData, spesialisasi_id: e.target.value })}
                >
                  <option value="">Pilih Spesialisasi</option>
                  {spesialisasi?.map((s: any) => (
                    <option key={s.spesialisasi_id} value={s.spesialisasi_id}>
                      {s.nama_spesialisasi}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="klinik_id">Klinik</Label>
                <select
                  id="klinik_id"
                  className="w-full border rounded px-2 py-1"
                  value={formData.klinik_id}
                  onChange={(e) => setFormData({ ...formData, klinik_id: e.target.value })}
                  required
                >
                  <option value="">Pilih Klinik</option>
                  {kliniks?.map((k: any) => (
                    <option key={k.klinik_id} value={k.klinik_id}>
                      {k.nama_klinik}
                    </option>
                  ))}
                </select>
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

export default VetProfilPage;