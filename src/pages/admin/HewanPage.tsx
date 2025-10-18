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
import { hewanApi, pawrentApi } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, PawPrint, HeartPulse, Skull } from "lucide-react";

const HewanPage = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHewan, setEditingHewan] = useState<any>(null);
  const [formData, setFormData] = useState({
    nama_hewan: "",
    jenis_hewan_id: "",
    tanggal_lahir: "",
    jenis_kelamin: "Jantan",
    status_hidup: "Hidup",
    pawrent_id: "",
  });

  const { data: hewans, isLoading } = useQuery<any[]>({
    queryKey: ["hewans"],
    queryFn: async () => {
      const result = await hewanApi.getAll(token!);
      return result as any[];
    },
  });

  const { data: pawrents } = useQuery<any[]>({
    queryKey: ["pawrents"],
    queryFn: async () => {
      const result = await pawrentApi.getAll(token!);
      return result as any[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingHewan) {
        return hewanApi.update(editingHewan.hewan_id, data, token!);
      }
      return hewanApi.create(data, token!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hewans"] });
      toast.success(editingHewan ? "Hewan berhasil diupdate" : "Hewan berhasil ditambahkan");
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menyimpan hewan");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (hewanId: number) => hewanApi.delete(hewanId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hewans"] });
      toast.success("Hewan berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus hewan");
    },
  });

  const handleOpenDialog = (hewan?: any) => {
    if (hewan) {
      setEditingHewan(hewan);
      setFormData({
        nama_hewan: hewan.nama_hewan,
        jenis_hewan_id: hewan.jenis_hewan_id?.toString() || "",
        tanggal_lahir: hewan.tanggal_lahir?.split('T')[0] || "",
        jenis_kelamin: hewan.jenis_kelamin || "Jantan",
        status_hidup: hewan.status_hidup || "Hidup",
        pawrent_id: hewan.pawrent_id?.toString() || "",
      });
    } else {
      setEditingHewan(null);
      setFormData({
        nama_hewan: "",
        jenis_hewan_id: "",
        tanggal_lahir: "",
        jenis_kelamin: "Jantan",
        status_hidup: "Hidup",
        pawrent_id: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingHewan(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ VALIDASI: Pastikan pawrent_id dipilih
    if (!formData.pawrent_id) {
      toast.error("Pawrent wajib dipilih!");
      return;
    }
    
    // ✅ VALIDASI: Pastikan jenis_hewan_id dipilih
    if (!formData.jenis_hewan_id) {
      toast.error("Jenis hewan wajib dipilih!");
      return;
    }
    
    console.log("📤 [SUBMIT HEWAN] Form data:", formData);
    saveMutation.mutate(formData);
  };

  const getJenisKelaminBadge = (jk: string) => {
    return jk === "Jantan" ? (
      <Badge variant="default">♂ Jantan</Badge>
    ) : (
      <Badge variant="secondary">♀ Betina</Badge>
    );
  };

  const getStatusHidupBadge = (status: string) => {
    return status === "Hidup" ? (
      <Badge variant="default" className="gap-1">
        <HeartPulse className="h-3 w-3" /> Hidup
      </Badge>
    ) : (
      <Badge variant="destructive" className="gap-1">
        <Skull className="h-3 w-3" /> Mati
      </Badge>
    );
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return "-";
    const today = new Date();
    const birth = new Date(birthDate);
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    if (years > 0) {
      return `${years} tahun ${months} bulan`;
    } else {
      return `${months} bulan`;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Kelola Hewan">
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
    <DashboardLayout title="Kelola Hewan" showBackButton={true}>
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <PawPrint className="h-5 w-5" />
              Daftar Hewan
            </CardTitle>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Hewan
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Hewan</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Jenis Kelamin</TableHead>
                  <TableHead>Umur</TableHead>
                  <TableHead>Pemilik</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hewans?.map((hewan: any) => (
                  <TableRow key={hewan.hewan_id}>
                    <TableCell className="font-medium">
                      {hewan.nama_hewan}
                    </TableCell>
                    <TableCell>{hewan.nama_jenis_hewan || "-"}</TableCell>
                    <TableCell>
                      {getJenisKelaminBadge(hewan.jenis_kelamin)}
                    </TableCell>
                    <TableCell>
                      {calculateAge(hewan.tanggal_lahir)}
                    </TableCell>
                    <TableCell>{hewan.nama_pawrent || "-"}</TableCell>
                    <TableCell>
                      {getStatusHidupBadge(hewan.status_hidup)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(hewan)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm("Yakin ingin menghapus hewan ini?")) {
                              deleteMutation.mutate(hewan.hewan_id);
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
                {editingHewan ? "Edit Hewan" : "Tambah Hewan Baru"}
              </DialogTitle>
              <DialogDescription>
                {editingHewan
                  ? "Update informasi hewan"
                  : "Masukkan informasi hewan baru"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nama_hewan">Nama Hewan</Label>
                  <Input
                    id="nama_hewan"
                    value={formData.nama_hewan}
                    onChange={(e) =>
                      setFormData({ ...formData, nama_hewan: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="pawrent_id">Pemilik</Label>
                  <Select
                    value={formData.pawrent_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, pawrent_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih pemilik" />
                    </SelectTrigger>
                    <SelectContent>
                      {pawrents?.map((pawrent: any) => (
                        <SelectItem
                          key={pawrent.pawrent_id}
                          value={pawrent.pawrent_id.toString()}
                        >
                          {pawrent.nama_lengkap}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="jenis_hewan_id">Jenis Hewan</Label>
                  <Select
                    value={formData.jenis_hewan_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, jenis_hewan_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Anjing</SelectItem>
                      <SelectItem value="2">Kucing</SelectItem>
                      <SelectItem value="3">Burung</SelectItem>
                      <SelectItem value="4">Hamster</SelectItem>
                      <SelectItem value="5">Kelinci</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tanggal_lahir">Tanggal Lahir</Label>
                  <Input
                    id="tanggal_lahir"
                    type="date"
                    value={formData.tanggal_lahir}
                    onChange={(e) =>
                      setFormData({ ...formData, tanggal_lahir: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="jenis_kelamin">Jenis Kelamin</Label>
                  <Select
                    value={formData.jenis_kelamin}
                    onValueChange={(value) =>
                      setFormData({ ...formData, jenis_kelamin: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Jantan">Jantan</SelectItem>
                      <SelectItem value="Betina">Betina</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status_hidup">Status Hidup</Label>
                  <Select
                    value={formData.status_hidup}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status_hidup: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hidup">Hidup</SelectItem>
                      <SelectItem value="Mati">Mati</SelectItem>
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

export default HewanPage;