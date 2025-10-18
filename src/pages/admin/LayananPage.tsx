import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { layananApi } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Stethoscope, Wallet, ClipboardList } from "lucide-react";

const LayananPage = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLayanan, setEditingLayanan] = useState<any>(null);
  const [formData, setFormData] = useState({
    kode_layanan: "",
    nama_layanan: "",
    deskripsi_layanan: "",
    biaya_layanan: "",
  });

  const { data: layanans, isLoading } = useQuery({
    queryKey: ["layanans"],
    queryFn: () => layananApi.getAll(token!),
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingLayanan) {
        return layananApi.update(editingLayanan.kode_layanan, data, token!);
      }
      return layananApi.create(data, token!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["layanans"] });
      toast.success(editingLayanan ? "Layanan berhasil diupdate" : "Layanan berhasil ditambahkan");
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menyimpan layanan");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (kode: string) => layananApi.delete(kode, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["layanans"] });
      toast.success("Layanan berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus layanan");
    },
  });

  const handleOpenDialog = (layanan?: any) => {
    if (layanan) {
      setEditingLayanan(layanan);
      setFormData({
        kode_layanan: layanan.kode_layanan,
        nama_layanan: layanan.nama_layanan,
        deskripsi_layanan: layanan.deskripsi_layanan || "",
        biaya_layanan: layanan.biaya_layanan?.toString() || "",
      });
    } else {
      setEditingLayanan(null);
      setFormData({
        kode_layanan: "",
        nama_layanan: "",
        deskripsi_layanan: "",
        biaya_layanan: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingLayanan(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Kelola Layanan">
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
    <DashboardLayout title="Kelola Layanan" showBackButton={true}>
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Daftar Layanan Medis
            </CardTitle>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Layanan
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Kode</TableHead>
                  <TableHead>Nama Layanan</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Biaya</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {layanans?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Belum ada data layanan
                    </TableCell>
                  </TableRow>
                ) : (
                  layanans?.map((layanan: any) => (
                    <TableRow key={layanan.kode_layanan}>
                      <TableCell className="font-medium">
                        <Badge variant="outline">{layanan.kode_layanan}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <ClipboardList className="h-4 w-4 text-primary" />
                          {layanan.nama_layanan}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="truncate" title={layanan.deskripsi_layanan}>
                          {layanan.deskripsi_layanan || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 font-semibold text-green-600">
                          <Wallet className="h-4 w-4" />
                          {formatCurrency(parseFloat(layanan.biaya_layanan || 0))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(layanan)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Hapus layanan "${layanan.nama_layanan}"?`)) {
                                deleteMutation.mutate(layanan.kode_layanan);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                {editingLayanan ? "Edit Layanan" : "Tambah Layanan Baru"}
              </DialogTitle>
              <DialogDescription>
                {editingLayanan
                  ? "Update informasi layanan medis"
                  : "Masukkan informasi layanan medis baru"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="kode_layanan">Kode Layanan *</Label>
                  <Input
                    id="kode_layanan"
                    placeholder="Contoh: CHK-001, VAC-001, SUR-001"
                    value={formData.kode_layanan}
                    onChange={(e) =>
                      setFormData({ ...formData, kode_layanan: e.target.value.toUpperCase() })
                    }
                    disabled={!!editingLayanan}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Kode unik untuk layanan (tidak dapat diubah setelah dibuat)
                  </p>
                </div>

                <div>
                  <Label htmlFor="nama_layanan">Nama Layanan *</Label>
                  <Input
                    id="nama_layanan"
                    placeholder="Contoh: Pemeriksaan Umum, Vaksinasi, Operasi"
                    value={formData.nama_layanan}
                    onChange={(e) =>
                      setFormData({ ...formData, nama_layanan: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="deskripsi_layanan">Deskripsi Layanan</Label>
                  <textarea
                    id="deskripsi_layanan"
                    className="w-full min-h-[100px] px-3 py-2 border rounded-md resize-none"
                    placeholder="Jelaskan detail layanan, prosedur, atau informasi tambahan..."
                    value={formData.deskripsi_layanan}
                    onChange={(e) =>
                      setFormData({ ...formData, deskripsi_layanan: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="biaya_layanan">Biaya Layanan (Rp) *</Label>
                  <div className="relative">
                    <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="biaya_layanan"
                      type="number"
                      step="0.01"
                      className="pl-10"
                      placeholder="0"
                      value={formData.biaya_layanan}
                      onChange={(e) =>
                        setFormData({ ...formData, biaya_layanan: e.target.value })
                      }
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Biaya standar untuk layanan ini
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

export default LayananPage;