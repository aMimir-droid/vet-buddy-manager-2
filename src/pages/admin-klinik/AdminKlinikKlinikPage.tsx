import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { klinikApi } from "@/lib/api";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Phone, Pencil, Save, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const AdminKlinikKlinikPage = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nama_klinik: "",
    alamat_klinik: "",
    telepon_klinik: "",
  });

  // Fetch the admin klinik's assigned clinic
  const { data: klinik, isLoading } = useQuery({
    queryKey: ["klinik-admin-klinik"],
    queryFn: async () => {
      const result = await klinikApi.getByAdminKlinik(token!);
      return result[0] || null; // Assuming it returns an array with one item
    },
    enabled: !!token,
  });

  // Mutation for updating the clinic
  const updateMutation = useMutation({
    mutationFn: (data: any) => klinikApi.update(klinik.klinik_id, data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["klinik-admin-klinik"] });
      toast.success("Klinik berhasil diupdate");
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal mengupdate klinik");
    },
  });

  const handleEdit = () => {
    if (klinik) {
      setFormData({
        nama_klinik: klinik.nama_klinik,
        alamat_klinik: klinik.alamat_klinik || "",
        telepon_klinik: klinik.telepon_klinik || "",
      });
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (!formData.nama_klinik || !formData.alamat_klinik) {
      toast.error("Nama klinik dan alamat wajib diisi");
      return;
    }
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Info Klinik">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-2 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!klinik) {
    return (
      <DashboardLayout title="Info Klinik">
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Klinik tidak ditemukan</p>
            <p className="text-sm text-muted-foreground mt-2">
              Anda belum ditugaskan ke klinik mana pun.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Info Klinik" showBackButton backTo="/admin-klinik/dashboard">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Detail Klinik
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div>
                  <Label htmlFor="nama_klinik">Nama Klinik *</Label>
                  <Input
                    id="nama_klinik"
                    value={formData.nama_klinik}
                    onChange={(e) => setFormData({ ...formData, nama_klinik: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="alamat_klinik">Alamat Klinik *</Label>
                  <Input
                    id="alamat_klinik"
                    value={formData.alamat_klinik}
                    onChange={(e) => setFormData({ ...formData, alamat_klinik: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="telepon_klinik">Telepon Klinik</Label>
                  <Input
                    id="telepon_klinik"
                    value={formData.telepon_klinik}
                    onChange={(e) => setFormData({ ...formData, telepon_klinik: e.target.value })}
                    placeholder="Opsional"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSave} disabled={updateMutation.isPending}>
                    <Save className="h-4 w-4 mr-1" />
                    {updateMutation.isPending ? "Menyimpan..." : "Simpan"}
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-1" />
                    Batal
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-2">
                  <Building2 className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{klinik.nama_klinik}</p>
                    <p className="text-sm text-muted-foreground">Nama Klinik</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div>
                    <p>{klinik.alamat_klinik || "Alamat belum diisi"}</p>
                    <p className="text-sm text-muted-foreground">Alamat</p>
                  </div>
                </div>
                {klinik.telepon_klinik && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p>{klinik.telepon_klinik}</p>
                      <p className="text-sm text-muted-foreground">Telepon</p>
                    </div>
                  </div>
                )}
                <div className="pt-4">
                  <Button onClick={handleEdit}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit Klinik
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminKlinikKlinikPage;