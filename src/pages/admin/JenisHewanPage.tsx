import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, PawPrint, Trash2, Edit } from "lucide-react";
import { jenisHewanApi } from "@/lib/api";
import { toast } from "sonner";

const JenisHewanPage = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJenis, setEditingJenis] = useState<any>(null);
  const [formData, setFormData] = useState({
    nama_jenis_hewan: "",
    deskripsi_jenis_hewan: "",
  });

  const { data: jenisList, isLoading } = useQuery({
    queryKey: ["jenis-hewan"],
    queryFn: () => jenisHewanApi.getAll(token!),
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingJenis) {
        return jenisHewanApi.update(editingJenis.jenis_hewan_id, data, token!);
      }
      return jenisHewanApi.create(data, token!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jenis-hewan"] });
      toast.success(editingJenis ? "Jenis hewan berhasil diupdate" : "Jenis hewan berhasil ditambahkan");
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menyimpan jenis hewan");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => jenisHewanApi.delete(id, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jenis-hewan"] });
      toast.success("Jenis hewan berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus jenis hewan");
    },
  });

  const handleOpenDialog = (jenis?: any) => {
    if (jenis) {
      setEditingJenis(jenis);
      setFormData({
        nama_jenis_hewan: jenis.nama_jenis_hewan,
        deskripsi_jenis_hewan: jenis.deskripsi_jenis_hewan || "",
      });
    } else {
      setEditingJenis(null);
      setFormData({
        nama_jenis_hewan: "",
        deskripsi_jenis_hewan: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingJenis(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_jenis_hewan) {
      toast.error("Nama jenis hewan wajib diisi!");
      return;
    }
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Kelola Jenis Hewan">
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
    <DashboardLayout title="Kelola Jenis Hewan" showBackButton={true}>
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <PawPrint className="h-5 w-5" />
              Daftar Jenis Hewan
            </CardTitle>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Jenis Hewan
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell>Nama Jenis Hewan</TableCell>
                  <TableCell>Deskripsi</TableCell>
                  <TableCell>Jumlah Hewan</TableCell>
                  <TableCell>Aksi</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jenisList?.map((jenis: any) => (
                  <TableRow key={jenis.jenis_hewan_id}>
                    <TableCell>{jenis.nama_jenis_hewan}</TableCell>
                    <TableCell>{jenis.deskripsi_jenis_hewan || "-"}</TableCell>
                    <TableCell>{jenis.jumlah_hewan ?? "-"}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mr-2"
                        onClick={() => handleOpenDialog(jenis)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (window.confirm(`Hapus jenis hewan "${jenis.nama_jenis_hewan}"?`)) {
                            deleteMutation.mutate(jenis.jenis_hewan_id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingJenis ? "Edit Jenis Hewan" : "Tambah Jenis Hewan Baru"}
              </DialogTitle>
              <DialogDescription>
                {editingJenis
                  ? "Update informasi jenis hewan"
                  : "Masukkan informasi jenis hewan baru"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <Input
                  id="nama_jenis_hewan"
                  placeholder="Nama jenis hewan (misal: Kucing, Anjing)"
                  value={formData.nama_jenis_hewan}
                  onChange={(e) =>
                    setFormData({ ...formData, nama_jenis_hewan: e.target.value })
                  }
                  required
                />
                <Input
                  id="deskripsi_jenis_hewan"
                  placeholder="Deskripsi (opsional)"
                  value={formData.deskripsi_jenis_hewan}
                  onChange={(e) =>
                    setFormData({ ...formData, deskripsi_jenis_hewan: e.target.value })
                  }
                />
              </div>
              <DialogFooter className="mt-6">
                <Button type="submit" className="w-full" disabled={saveMutation.isLoading}>
                  {saveMutation.isLoading
                    ? "Memproses..."
                    : editingJenis
                    ? "Update Jenis Hewan"
                    : "Tambah Jenis Hewan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default JenisHewanPage;