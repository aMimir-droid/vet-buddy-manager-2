import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { obatApi } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Pill, Wallet } from "lucide-react";

const ObatPage = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingObat, setEditingObat] = useState<any>(null);
  const [formData, setFormData] = useState({
    nama_obat: "",
    kegunaan: "",
    harga_obat: "",
  });

  const { data: obats, isLoading } = useQuery({
    queryKey: ["obats"],
    queryFn: () => obatApi.getAll(token!),
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingObat) {
        return obatApi.update(editingObat.obat_id, data, token!);
      }
      return obatApi.create(data, token!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obats"] });
      toast.success(editingObat ? "Obat berhasil diupdate" : "Obat berhasil ditambahkan");
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menyimpan obat");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (obatId: number) => obatApi.delete(obatId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obats"] });
      toast.success("Obat berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus obat");
    },
  });

  const handleOpenDialog = (obat?: any) => {
    if (obat) {
      setEditingObat(obat);
      setFormData({
        nama_obat: obat.nama_obat,
        kegunaan: obat.kegunaan || "",
        harga_obat: obat.harga_obat?.toString() || "",
      });
    } else {
      setEditingObat(null);
      setFormData({
        nama_obat: "",
        kegunaan: "",
        harga_obat: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingObat(null);
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
      <DashboardLayout title="Kelola Obat">
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
    <DashboardLayout title="Kelola Obat" showBackButton={true}>
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Daftar Obat
            </CardTitle>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Obat
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">No</TableHead>
                  <TableHead>Nama Obat</TableHead>
                  <TableHead>Kegunaan</TableHead>
                  <TableHead>Harga Satuan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {obats?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Belum ada data obat
                    </TableCell>
                  </TableRow>
                ) : (
                  obats?.map((obat: any, index: number) => (
                    <TableRow key={obat.obat_id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Pill className="h-4 w-4 text-primary" />
                          {obat.nama_obat}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="truncate" title={obat.kegunaan}>
                          {obat.kegunaan || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 font-semibold text-green-600">
                          <Wallet className="h-4 w-4" />
                          {formatCurrency(parseFloat(obat.harga_obat || 0))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(obat)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm("Yakin ingin menghapus obat ini?")) {
                                deleteMutation.mutate(obat.obat_id);
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
                <Pill className="h-5 w-5" />
                {editingObat ? "Edit Obat" : "Tambah Obat Baru"}
              </DialogTitle>
              <DialogDescription>
                {editingObat
                  ? "Update informasi obat"
                  : "Masukkan informasi obat baru"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nama_obat">Nama Obat *</Label>
                  <Input
                    id="nama_obat"
                    placeholder="Contoh: Amoxicillin 500mg"
                    value={formData.nama_obat}
                    onChange={(e) =>
                      setFormData({ ...formData, nama_obat: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="kegunaan">Kegunaan / Indikasi</Label>
                  <textarea
                    id="kegunaan"
                    className="w-full min-h-[100px] px-3 py-2 border rounded-md resize-none"
                    placeholder="Contoh: Antibiotik untuk infeksi bakteri, infeksi saluran pernapasan, infeksi kulit, dll."
                    value={formData.kegunaan}
                    onChange={(e) =>
                      setFormData({ ...formData, kegunaan: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Jelaskan kegunaan atau indikasi obat ini
                  </p>
                </div>

                <div>
                  <Label htmlFor="harga_obat">Harga Satuan (Rp) *</Label>
                  <div className="relative">
                    <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="harga_obat"
                      type="number"
                      step="0.01"
                      className="pl-10"
                      placeholder="0"
                      value={formData.harga_obat}
                      onChange={(e) =>
                        setFormData({ ...formData, harga_obat: e.target.value })
                      }
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Harga per satuan obat (tablet, botol, ampul, dll)
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

export default ObatPage;