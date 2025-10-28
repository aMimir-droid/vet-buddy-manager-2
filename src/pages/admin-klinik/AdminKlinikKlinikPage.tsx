import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { klinikApi } from "@/lib/api";
import { toast } from "sonner";
import { Building2, MapPin, Phone, Save } from "lucide-react";

const AdminKlinikKlinikPage = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    nama_klinik: "",
    alamat_klinik: "",
    telepon_klinik: "",
  });

  // Fetch klinik data for the current admin-klinik
  const { data: klinik, isLoading, error } = useQuery({
    queryKey: ["klinik-admin-klinik"],
    queryFn: () => klinikApi.getByAdminKlinik(token!),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => klinikApi.update(klinik.klinik_id, data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["klinik-admin-klinik"] });
      toast.success("Data klinik berhasil diupdate");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal mengupdate data klinik");
    },
  });

  // Populate form when data is loaded
  useEffect(() => {
    if (klinik) {
      setFormData({
        nama_klinik: klinik.nama_klinik || "",
        alamat_klinik: klinik.alamat_klinik || "",
        telepon_klinik: klinik.telepon_klinik || "",
      });
    }
  }, [klinik]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!klinik) return;
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Info Klinik">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-2 text-muted-foreground">Loading data klinik...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !klinik) {
    return (
      <DashboardLayout title="Info Klinik">
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-lg font-medium mb-2 text-muted-foreground">
              Tidak ada klinik terkait
            </p>
            <p className="text-sm text-muted-foreground">
              Admin klinik ini belum dihubungkan dengan klinik mana pun. Hubungi administrator untuk pengaturan.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Info Klinik" showBackButton={true}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informasi Klinik
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Kelola informasi dasar klinik Anda. Perubahan akan langsung tersimpan.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="nama_klinik">
                  Nama Klinik <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nama_klinik"
                  placeholder="Contoh: Klinik Hewan Sahabat Satwa"
                  value={formData.nama_klinik}
                  onChange={(e) =>
                    setFormData({ ...formData, nama_klinik: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="alamat_klinik">
                  Alamat Lengkap <span className="text-red-500">*</span>
                </Label>
                <textarea
                  id="alamat_klinik"
                  className="w-full min-h-[100px] px-3 py-2 border rounded-md resize-none"
                  placeholder="Jl. Contoh No. 123, Kelurahan, Kecamatan, Kota"
                  value={formData.alamat_klinik}
                  onChange={(e) =>
                    setFormData({ ...formData, alamat_klinik: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="telepon_klinik">Nomor Telepon</Label>
                <Input
                  id="telepon_klinik"
                  type="tel"
                  placeholder="Contoh: 0211234567 atau 081234567890"
                  value={formData.telepon_klinik}
                  onChange={(e) =>
                    setFormData({ ...formData, telepon_klinik: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Format: 10-15 digit angka (opsional)
                </p>
              </div>
              <div className="flex gap-4">
                <Button type="submit" disabled={updateMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {updateMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminKlinikKlinikPage;