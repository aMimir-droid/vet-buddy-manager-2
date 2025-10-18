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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { pawrentApi, dokterApi } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Users } from "lucide-react";

const PawrentPage = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPawrent, setEditingPawrent] = useState<any>(null);
  const [formData, setFormData] = useState({
    nama_depan_pawrent: "",
    nama_belakang_pawrent: "",
    alamat_pawrent: "",
    kota_pawrent: "",
    kode_pos_pawrent: "",
    nomor_hp: "",
    dokter_id: "",
  });

  const { data: pawrents, isLoading } = useQuery({
    queryKey: ["pawrents"],
    queryFn: () => pawrentApi.getAll(token!),
  });

  const { data: dokters } = useQuery({
    queryKey: ["dokters"],
    queryFn: () => dokterApi.getAll(token!),
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingPawrent) {
        return pawrentApi.update(editingPawrent.pawrent_id, data, token!);
      }
      return pawrentApi.create(data, token!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pawrents"] });
      toast.success(editingPawrent ? "Pawrent berhasil diupdate" : "Pawrent berhasil ditambahkan");
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menyimpan pawrent");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (pawrentId: number) => pawrentApi.delete(pawrentId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pawrents"] });
      toast.success("Pawrent berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus pawrent");
    },
  });

  const handleOpenDialog = (pawrent?: any) => {
    if (pawrent) {
      setEditingPawrent(pawrent);
      setFormData({
        nama_depan_pawrent: pawrent.nama_depan_pawrent,
        nama_belakang_pawrent: pawrent.nama_belakang_pawrent,
        alamat_pawrent: pawrent.alamat_pawrent || "",
        kota_pawrent: pawrent.kota_pawrent || "",
        kode_pos_pawrent: pawrent.kode_pos_pawrent || "",
        nomor_hp: pawrent.nomor_hp,
        dokter_id: pawrent.dokter_id?.toString() || "",
      });
    } else {
      setEditingPawrent(null);
      setFormData({
        nama_depan_pawrent: "",
        nama_belakang_pawrent: "",
        alamat_pawrent: "",
        kota_pawrent: "",
        kode_pos_pawrent: "",
        nomor_hp: "",
        dokter_id: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPawrent(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Kelola Pawrent">
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
    <DashboardLayout title="Kelola Pawrent" showBackButton={true}>
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Daftar Pemilik Hewan (Pawrent)
            </CardTitle>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Pawrent
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Lengkap</TableHead>
                  <TableHead>Nomor HP</TableHead>
                  <TableHead>Kota</TableHead>
                  <TableHead>Dokter</TableHead>
                  <TableHead>Jumlah Hewan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pawrents?.map((pawrent: any) => (
                  <TableRow key={pawrent.pawrent_id}>
                    <TableCell className="font-medium">
                      {pawrent.nama_lengkap}
                    </TableCell>
                    <TableCell>{pawrent.nomor_hp}</TableCell>
                    <TableCell>{pawrent.kota_pawrent || "-"}</TableCell>
                    <TableCell>{pawrent.nama_dokter || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {pawrent.jumlah_hewan || 0} hewan
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(pawrent)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm("Yakin ingin menghapus pawrent ini?")) {
                              deleteMutation.mutate(pawrent.pawrent_id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPawrent ? "Edit Pawrent" : "Tambah Pawrent Baru"}
              </DialogTitle>
              <DialogDescription>
                {editingPawrent
                  ? "Update informasi pemilik hewan"
                  : "Masukkan informasi pemilik hewan baru"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nama_depan_pawrent">Nama Depan</Label>
                  <Input
                    id="nama_depan_pawrent"
                    value={formData.nama_depan_pawrent}
                    onChange={(e) =>
                      setFormData({ ...formData, nama_depan_pawrent: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="nama_belakang_pawrent">Nama Belakang</Label>
                  <Input
                    id="nama_belakang_pawrent"
                    value={formData.nama_belakang_pawrent}
                    onChange={(e) =>
                      setFormData({ ...formData, nama_belakang_pawrent: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="nomor_hp">Nomor HP</Label>
                  <Input
                    id="nomor_hp"
                    placeholder="08xxxxxxxxxx"
                    value={formData.nomor_hp}
                    onChange={(e) =>
                      setFormData({ ...formData, nomor_hp: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dokter_id">Dokter yang Menangani</Label>
                  <Select
                    value={formData.dokter_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, dokter_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih dokter" />
                    </SelectTrigger>
                    <SelectContent>
                      {dokters?.map((dokter: any) => (
                        <SelectItem
                          key={dokter.dokter_id}
                          value={dokter.dokter_id.toString()}
                        >
                          {dokter.title_dokter} {dokter.nama_dokter}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="alamat_pawrent">Alamat Lengkap</Label>
                  <textarea
                    id="alamat_pawrent"
                    className="w-full min-h-[80px] px-3 py-2 border rounded-md"
                    value={formData.alamat_pawrent}
                    onChange={(e) =>
                      setFormData({ ...formData, alamat_pawrent: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="kota_pawrent">Kota</Label>
                  <Input
                    id="kota_pawrent"
                    value={formData.kota_pawrent}
                    onChange={(e) =>
                      setFormData({ ...formData, kota_pawrent: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="kode_pos_pawrent">Kode Pos</Label>
                  <Input
                    id="kode_pos_pawrent"
                    placeholder="12345"
                    maxLength={10}
                    value={formData.kode_pos_pawrent}
                    onChange={(e) =>
                      setFormData({ ...formData, kode_pos_pawrent: e.target.value })
                    }
                  />
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

export default PawrentPage;