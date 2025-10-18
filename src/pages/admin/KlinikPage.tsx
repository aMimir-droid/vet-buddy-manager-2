import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { klinikApi } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Building2, MapPin, Phone } from "lucide-react";

const KlinikPage = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingKlinik, setEditingKlinik] = useState<any>(null);
  const [formData, setFormData] = useState({
    nama_klinik: "",
    alamat_klinik: "",
    telepon_klinik: "",
  });

  // ✅ FIX: Add type assertion
  const { data: kliniks, isLoading } = useQuery<any[]>({
    queryKey: ["kliniks"],
    queryFn: async () => {
      const result = await klinikApi.getAll(token!);
      return result as any[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingKlinik) {
        return klinikApi.update(editingKlinik.klinik_id, data, token!);
      }
      return klinikApi.create(data, token!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kliniks"] });
      toast.success(editingKlinik ? "Klinik berhasil diupdate" : "Klinik berhasil ditambahkan");
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menyimpan klinik");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (klinikId: number) => klinikApi.delete(klinikId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kliniks"] });
      toast.success("Klinik berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus klinik");
    },
  });

  const handleOpenDialog = (klinik?: any) => {
    if (klinik) {
      setEditingKlinik(klinik);
      setFormData({
        nama_klinik: klinik.nama_klinik,
        alamat_klinik: klinik.alamat_klinik || "",
        telepon_klinik: klinik.telepon_klinik || "",
      });
    } else {
      setEditingKlinik(null);
      setFormData({
        nama_klinik: "",
        alamat_klinik: "",
        telepon_klinik: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingKlinik(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Kelola Klinik">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-2 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Kelola Klinik" showBackButton={true}>
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Daftar Klinik Hewan
            </CardTitle>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Klinik
            </Button>
          </CardHeader>
          <CardContent>
            {/* ✅ FIX: Add proper null/undefined checks */}
            {kliniks && kliniks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {kliniks.map((klinik: any) => (
                  <Card key={klinik.klinik_id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span className="truncate">{klinik.nama_klinik}</span>
                        <Badge variant="secondary" className="ml-2 flex-shrink-0">
                          {klinik.jumlah_dokter || 0} dokter
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {klinik.alamat_klinik || "Alamat belum diisi"}
                        </span>
                      </div>
                      {klinik.telepon_klinik && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{klinik.telepon_klinik}</span>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleOpenDialog(klinik)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Yakin ingin menghapus klinik "${klinik.nama_klinik}"?`)) {
                              deleteMutation.mutate(klinik.klinik_id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Belum ada klinik terdaftar</p>
                <p className="text-sm mb-4">Mulai dengan menambahkan klinik pertama Anda</p>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Klinik Pertama
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {editingKlinik ? "Edit Klinik" : "Tambah Klinik Baru"}
              </DialogTitle>
              <DialogDescription>
                {editingKlinik
                  ? "Update informasi klinik"
                  : "Masukkan informasi klinik baru"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
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
              </div>
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Menyimpan..." : "Simpan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default KlinikPage;