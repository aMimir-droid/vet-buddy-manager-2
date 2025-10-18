import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { kunjunganApi, kunjunganObatApi, obatApi } from "@/lib/api";
import { toast } from "sonner";
import { Pill, Search, Eye, Calendar, Plus, Trash2, Edit } from "lucide-react";

const KunjunganObatPage = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [selectedKunjungan, setSelectedKunjungan] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingObat, setEditingObat] = useState<any>(null);
  const [formData, setFormData] = useState({
    obat_id: "",
    dosis: "",
    frekuensi: "",
  });

  // Query kunjungan list
  const { data: kunjungans, isLoading } = useQuery({
    queryKey: ["kunjungans"],
    queryFn: () => kunjunganApi.getAll(token!),
  });

  // Query obat list untuk kunjungan terpilih
  const { data: kunjunganObats, isLoading: isLoadingObat } = useQuery({
    queryKey: ["kunjungan-obats", selectedKunjungan?.kunjungan_id],
    queryFn: () => kunjunganObatApi.getByKunjungan(selectedKunjungan.kunjungan_id, token!),
    enabled: !!selectedKunjungan,
  });

  // Query all obat untuk dropdown
  const { data: obats } = useQuery({
    queryKey: ["obats"],
    queryFn: () => obatApi.getAll(token!),
  });

  // Mutation save obat
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingObat) {
        return kunjunganObatApi.update(
          selectedKunjungan.kunjungan_id,
          editingObat.obat_id,
          data,
          token!
        );
      }
      return kunjunganObatApi.create(
        { ...data, kunjungan_id: selectedKunjungan.kunjungan_id },
        token!
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["kunjungan-obats", selectedKunjungan.kunjungan_id],
      });
      toast.success(editingObat ? "Obat berhasil diupdate" : "Obat berhasil ditambahkan");
      handleCloseFormDialog();
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menyimpan obat");
    },
  });

  // Mutation delete obat
  const deleteMutation = useMutation({
    mutationFn: (obatId: number) =>
      kunjunganObatApi.delete(selectedKunjungan.kunjungan_id, obatId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["kunjungan-obats", selectedKunjungan.kunjungan_id],
      });
      toast.success("Obat berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus obat");
    },
  });

  const handleViewObat = (kunjungan: any) => {
    setSelectedKunjungan(kunjungan);
    setIsDialogOpen(true);
  };

  const handleOpenFormDialog = (obat?: any) => {
    if (obat) {
      setEditingObat(obat);
      setFormData({
        obat_id: obat.obat_id.toString(),
        dosis: obat.dosis || "",
        frekuensi: obat.frekuensi || "",
      });
    } else {
      setEditingObat(null);
      setFormData({ obat_id: "", dosis: "", frekuensi: "" });
    }
    setIsFormDialogOpen(true);
  };

  const handleCloseFormDialog = () => {
    setIsFormDialogOpen(false);
    setEditingObat(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.obat_id) {
      toast.error("Pilih obat terlebih dahulu");
      return;
    }
    saveMutation.mutate(formData);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getMonthYear = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredKunjungans = kunjungans?.filter((k: any) => {
    const matchSearch =
      k.nama_hewan?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.nama_dokter?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchMonth =
      filterMonth === "all" || getMonthYear(k.tanggal_kunjungan) === filterMonth;

    return matchSearch && matchMonth;
  });

  const uniqueMonths = Array.from(
    new Set(kunjungans?.map((k: any) => getMonthYear(k.tanggal_kunjungan)) || [])
  )
    .sort()
    .reverse();

  if (isLoading) {
    return (
      <DashboardLayout title="Kelola Obat Kunjungan">
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
    <DashboardLayout title="Kelola Obat Kunjungan" showBackButton={true}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Daftar Kunjungan
            </CardTitle>
            <CardDescription>
              Kelola obat-obatan untuk setiap kunjungan pasien
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari hewan atau dokter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter Bulan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Bulan</SelectItem>
                  {uniqueMonths.map((month) => (
                    <SelectItem key={month} value={month}>
                      {new Date(month + "-01").toLocaleDateString("id-ID", {
                        month: "long",
                        year: "numeric",
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* List */}
            {filteredKunjungans && filteredKunjungans.length > 0 ? (
              <div className="grid gap-4">
                {filteredKunjungans.map((kunjungan: any) => (
                  <Card
                    key={kunjungan.kunjungan_id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                            <Pill className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{kunjungan.nama_hewan}</h3>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(kunjungan.tanggal_kunjungan)} • Dr.{" "}
                              {kunjungan.nama_dokter}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              ID Kunjungan: #{kunjungan.kunjungan_id}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button onClick={() => handleViewObat(kunjungan)} variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        Kelola Obat
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Pill className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Tidak ada data kunjungan</p>
                <p className="text-sm mt-2">
                  {searchQuery || filterMonth !== "all"
                    ? "Coba ubah filter pencarian"
                    : "Belum ada kunjungan terdaftar"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog List Obat */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Kelola Obat Kunjungan
              </DialogTitle>
              <DialogDescription>
                Kunjungan #{selectedKunjungan?.kunjungan_id} -{" "}
                {formatDate(selectedKunjungan?.tanggal_kunjungan || "")}
              </DialogDescription>
            </DialogHeader>

            {selectedKunjungan && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Pill className="h-5 w-5" />
                      Obat-obatan
                    </CardTitle>
                    <CardDescription>
                      Daftar obat untuk: {selectedKunjungan.nama_hewan}
                    </CardDescription>
                  </div>
                  <Button onClick={() => handleOpenFormDialog()} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah
                  </Button>
                </CardHeader>
                <CardContent>
                  {isLoadingObat ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : kunjunganObats && kunjunganObats.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama Obat</TableHead>
                          <TableHead>Dosis</TableHead>
                          <TableHead>Frekuensi</TableHead>
                          <TableHead>Harga</TableHead>
                          <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {kunjunganObats.map((ko: any) => (
                          <TableRow key={ko.obat_id}>
                            <TableCell className="font-medium">{ko.nama_obat}</TableCell>
                            <TableCell>{ko.dosis || "-"}</TableCell>
                            <TableCell>{ko.frekuensi || "-"}</TableCell>
                            <TableCell>{formatCurrency(ko.harga_obat)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenFormDialog(ko)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm(`Hapus ${ko.nama_obat}?`)) {
                                      deleteMutation.mutate(ko.obat_id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Pill className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Belum ada obat</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog Form Tambah/Edit Obat */}
        <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingObat ? "Edit Obat" : "Tambah Obat"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label>Obat *</Label>
                  <Select
                    value={formData.obat_id}
                    onValueChange={(value) => setFormData({ ...formData, obat_id: value })}
                    disabled={!!editingObat}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih obat..." />
                    </SelectTrigger>
                    <SelectContent>
                      {obats?.map((obat: any) => (
                        <SelectItem key={obat.obat_id} value={obat.obat_id.toString()}>
                          {obat.nama_obat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Dosis</Label>
                  <Input
                    placeholder="500mg, 1 tablet"
                    value={formData.dosis}
                    onChange={(e) => setFormData({ ...formData, dosis: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Frekuensi</Label>
                  <Input
                    placeholder="2x sehari"
                    value={formData.frekuensi}
                    onChange={(e) => setFormData({ ...formData, frekuensi: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={handleCloseFormDialog}>
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

export default KunjunganObatPage;