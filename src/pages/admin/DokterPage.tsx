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
import { dokterApi, klinikApi } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Stethoscope } from "lucide-react";

const DokterPage = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDokter, setEditingDokter] = useState<any>(null);
  const [formData, setFormData] = useState({
    title_dokter: "",
    nama_dokter: "",
    telepon_dokter: "",
    tanggal_mulai_kerja: "",
    spesialisasi_id: "",
    klinik_id: "",
  });

  const { data: dokters, isLoading } = useQuery({
    queryKey: ["dokters"],
    queryFn: () => dokterApi.getAll(token!),
  });

  const { data: kliniks } = useQuery({
    queryKey: ["kliniks"],
    queryFn: () => klinikApi.getAll(token!),
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingDokter) {
        return dokterApi.update(editingDokter.dokter_id, data, token!);
      }
      return dokterApi.create(data, token!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dokters"] });
      toast.success(editingDokter ? "Dokter berhasil diupdate" : "Dokter berhasil ditambahkan");
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menyimpan dokter");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (dokterId: number) => dokterApi.delete(dokterId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dokters"] });
      toast.success("Dokter berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus dokter");
    },
  });

  const handleOpenDialog = (dokter?: any) => {
    if (dokter) {
      setEditingDokter(dokter);
      setFormData({
        title_dokter: dokter.title_dokter || "",
        nama_dokter: dokter.nama_dokter,
        telepon_dokter: dokter.telepon_dokter,
        tanggal_mulai_kerja: dokter.tanggal_mulai_kerja?.split('T')[0] || "",
        spesialisasi_id: dokter.spesialisasi_id?.toString() || "",
        klinik_id: dokter.klinik_id?.toString() || "",
      });
    } else {
      setEditingDokter(null);
      setFormData({
        title_dokter: "",
        nama_dokter: "",
        telepon_dokter: "",
        tanggal_mulai_kerja: "",
        spesialisasi_id: "",
        klinik_id: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingDokter(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Kelola Dokter">
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
    <DashboardLayout title="Kelola Dokter" showBackButton={true}>
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Daftar Dokter Hewan
            </CardTitle>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Dokter
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Dokter</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead>Spesialisasi</TableHead>
                  <TableHead>Klinik</TableHead>
                  <TableHead>Mulai Kerja</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dokters?.map((dokter: any) => (
                  <TableRow key={dokter.dokter_id}>
                    <TableCell className="font-medium">
                      {dokter.title_dokter} {dokter.nama_dokter}
                    </TableCell>
                    <TableCell>{dokter.telepon_dokter}</TableCell>
                    <TableCell>
                      {dokter.nama_spesialisasi ? (
                        <Badge variant="secondary">{dokter.nama_spesialisasi}</Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{dokter.nama_klinik || "-"}</TableCell>
                    <TableCell>
                      {dokter.tanggal_mulai_kerja
                        ? new Date(dokter.tanggal_mulai_kerja).toLocaleDateString("id-ID")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(dokter)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm("Yakin ingin menghapus dokter ini?")) {
                              deleteMutation.mutate(dokter.dokter_id);
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingDokter ? "Edit Dokter" : "Tambah Dokter Baru"}
              </DialogTitle>
              <DialogDescription>
                {editingDokter
                  ? "Update informasi dokter"
                  : "Masukkan informasi dokter baru"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title_dokter">Gelar</Label>
                  <Input
                    id="title_dokter"
                    placeholder="drh."
                    value={formData.title_dokter}
                    onChange={(e) =>
                      setFormData({ ...formData, title_dokter: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="nama_dokter">Nama Dokter</Label>
                  <Input
                    id="nama_dokter"
                    value={formData.nama_dokter}
                    onChange={(e) =>
                      setFormData({ ...formData, nama_dokter: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="telepon_dokter">Telepon</Label>
                  <Input
                    id="telepon_dokter"
                    value={formData.telepon_dokter}
                    onChange={(e) =>
                      setFormData({ ...formData, telepon_dokter: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tanggal_mulai_kerja">Tanggal Mulai Kerja</Label>
                  <Input
                    id="tanggal_mulai_kerja"
                    type="date"
                    value={formData.tanggal_mulai_kerja}
                    onChange={(e) =>
                      setFormData({ ...formData, tanggal_mulai_kerja: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="spesialisasi_id">Spesialisasi</Label>
                  <Select
                    value={formData.spesialisasi_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, spesialisasi_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih spesialisasi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Bedah</SelectItem>
                      <SelectItem value="2">Penyakit Dalam</SelectItem>
                      <SelectItem value="3">Dermatologi</SelectItem>
                      <SelectItem value="4">Umum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="klinik_id">Klinik</Label>
                  <Select
                    value={formData.klinik_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, klinik_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih klinik" />
                    </SelectTrigger>
                    <SelectContent>
                      {kliniks?.map((klinik: any) => (
                        <SelectItem
                          key={klinik.klinik_id}
                          value={klinik.klinik_id.toString()}
                        >
                          {klinik.nama_klinik}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

export default DokterPage;