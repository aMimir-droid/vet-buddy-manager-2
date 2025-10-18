import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { kunjunganApi, kunjunganObatApi, obatApi, dokterApi } from "@/lib/api";
import { toast } from "sonner";
import { Pill, Search, X, Plus, Edit, Trash2, Eye, Calendar, User, Syringe, Info } from "lucide-react";

const KunjunganObatPage = () => {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [selectedKunjungan, setSelectedKunjungan] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingObat, setEditingObat] = useState<any>(null);
  const [currentDokterId, setCurrentDokterId] = useState<number | null>(null);
  const [currentDokterName, setCurrentDokterName] = useState<string>("");
  const [isIdentifyingDokter, setIsIdentifyingDokter] = useState(true);
  const [formData, setFormData] = useState({
    obat_id: "",
    dosis: "",
    frekuensi: "",
  });

  // Query kunjungan list
  const { data: kunjungans, isLoading: isLoadingKunjungan } = useQuery({
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

  // Query dokters untuk identifikasi dokter
  const { data: dokters, isLoading: isLoadingDokter } = useQuery({
    queryKey: ["dokters"],
    queryFn: () => dokterApi.getAll(token!),
  });

  // Get current dokter_id - SAME LOGIC as VetKunjunganPage
  useEffect(() => {
    let dokterId: number | null = null;
    let dokterName: string = "";

    // Priority 1: Check from user context
    if (user?.dokter_id) {
      dokterId = user.dokter_id;
      console.log("✅ [VET KUNJUNGAN OBAT] Found dokter_id from user context:", dokterId);
    }
    
    // Priority 2: Check from localStorage
    if (!dokterId) {
      const storedUser = localStorage.getItem('auth_user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser.dokter_id) {
            dokterId = parsedUser.dokter_id;
            console.log("✅ [VET KUNJUNGAN OBAT] Found dokter_id from localStorage:", dokterId);
          }
        } catch (error) {
          console.error("❌ [VET KUNJUNGAN OBAT] Error parsing stored user:", error);
        }
      }
    }

    // Priority 3: Match dengan dokters list by user_id
    if (!dokterId && user?.user_id && dokters && dokters.length > 0) {
      const matchedDokter = dokters.find((d: any) => d.user_id === user.user_id);
      if (matchedDokter) {
        dokterId = matchedDokter.dokter_id;
        console.log("✅ [VET KUNJUNGAN OBAT] Found dokter_id from dokters list by user_id:", dokterId);
      }
    }

    // Priority 4: Match dengan dokters list by username/email
    if (!dokterId && user?.username && dokters && dokters.length > 0) {
      const matchedDokter = dokters.find((d: any) => 
        d.nama_dokter.toLowerCase().includes(user.username.toLowerCase()) ||
        (user.email && d.email?.toLowerCase() === user.email.toLowerCase())
      );
      if (matchedDokter) {
        dokterId = matchedDokter.dokter_id;
        console.log("✅ [VET KUNJUNGAN OBAT] Found dokter_id from dokters list by username/email:", dokterId);
      }
    }

    if (dokterId) {
      setCurrentDokterId(dokterId);
      const dokter = dokters?.find((d: any) => d.dokter_id === dokterId);
      if (dokter) {
        dokterName = `${dokter.title_dokter || ''} ${dokter.nama_dokter}`.trim();
        setCurrentDokterName(dokterName);
        console.log("✅ [VET KUNJUNGAN OBAT] Dokter identified:", dokterName);
      }
    } else {
      console.warn("⚠️ [VET KUNJUNGAN OBAT] Could not identify dokter_id");
    }

    setIsIdentifyingDokter(false);
  }, [user, dokters]);

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

  const handleDelete = (obatId: number, namaObat: string) => {
    if (window.confirm(`Hapus obat "${namaObat}" dari kunjungan ini?`)) {
      deleteMutation.mutate(obatId);
    }
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

  // FILTER: Only show kunjungan for current dokter
  const myKunjungans = currentDokterId 
    ? (kunjungans?.filter((k: any) => k.dokter_id === currentDokterId) || [])
    : [];

  const filteredKunjungans = myKunjungans.filter((k: any) => {
    const matchSearch =
      k.nama_hewan?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.nama_pawrent?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchMonth =
      filterMonth === "all" || getMonthYear(k.tanggal_kunjungan) === filterMonth;

    return matchSearch && matchMonth;
  });

  const uniqueMonths = Array.from(
    new Set(myKunjungans?.map((k: any) => getMonthYear(k.tanggal_kunjungan)) || [])
  )
    .sort()
    .reverse();

  const isLoading = isLoadingKunjungan || isLoadingDokter || isIdentifyingDokter;

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
    <DashboardLayout title="Kelola Obat Kunjungan" showBackButton={true} backTo="/vet/dashboard">
      <div className="space-y-6">
        {/* Info Card */}
        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-100">
              <Syringe className="h-5 w-5" />
              Manajemen Obat Kunjungan - {currentDokterName || "Dokter"}
            </CardTitle>
            <CardDescription className="text-purple-700 dark:text-purple-300">
              Kelola resep dan obat untuk kunjungan pasien Anda. 
              Menampilkan {filteredKunjungans.length} dari {myKunjungans.length} kunjungan Anda.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Daftar Kunjungan ({filteredKunjungans.length})
            </CardTitle>
            <CardDescription>
              Pilih kunjungan untuk mengelola resep obat. Hanya menampilkan kunjungan Anda.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama hewan atau pemilik..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="w-full md:w-48">
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="all">Semua Bulan</option>
                  {uniqueMonths.map((month) => {
                    const date = new Date(month + "-01");
                    return (
                      <option key={month} value={month}>
                        {date.toLocaleDateString("id-ID", {
                          month: "long",
                          year: "numeric",
                        })}
                      </option>
                    );
                  })}
                </select>
              </div>
              {(searchQuery || filterMonth !== "all") && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterMonth("all");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Table */}
            {filteredKunjungans && filteredKunjungans.length > 0 ? (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Hewan</TableHead>
                      <TableHead>Pemilik</TableHead>
                      <TableHead>Catatan</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredKunjungans.map((kunjungan: any) => (
                      <TableRow key={kunjungan.kunjungan_id}>
                        <TableCell className="font-mono text-sm">
                          #{kunjungan.kunjungan_id}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{formatDate(kunjungan.tanggal_kunjungan)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {kunjungan.nama_hewan}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {kunjungan.nama_pawrent}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate text-muted-foreground text-sm">
                            {kunjungan.catatan || "-"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewObat(kunjungan)}
                          >
                            <Pill className="h-4 w-4 mr-2" />
                            Kelola Obat
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Pill className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">
                  {searchQuery || filterMonth !== "all"
                    ? "Tidak ada hasil pencarian"
                    : "Belum ada kunjungan"}
                </p>
                <p className="text-sm">
                  {searchQuery || filterMonth !== "all"
                    ? "Coba ubah filter pencarian"
                    : "Kunjungan Anda akan muncul di sini"}
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
                <Syringe className="h-5 w-5" />
                Kelola Obat - Kunjungan #{selectedKunjungan?.kunjungan_id}
              </DialogTitle>
              <DialogDescription>
                Pasien: <strong>{selectedKunjungan?.nama_hewan}</strong> | 
                Pemilik: <strong>{selectedKunjungan?.nama_pawrent}</strong> | 
                Tanggal: <strong>{selectedKunjungan && formatDate(selectedKunjungan.tanggal_kunjungan)}</strong>
              </DialogDescription>
            </DialogHeader>

            {selectedKunjungan && (
              <div className="space-y-4">
                {/* Info Banner */}
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-md border border-blue-200 dark:border-blue-800">
                  <div className="flex gap-2">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Informasi Kunjungan
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        {selectedKunjungan.catatan || "Tidak ada catatan khusus untuk kunjungan ini"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Add Button */}
                <div className="flex justify-end">
                  <Button onClick={() => handleOpenFormDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Obat
                  </Button>
                </div>

                {/* Obat List */}
                {isLoadingObat ? (
                  <div className="text-center py-8">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                    <p className="mt-2 text-muted-foreground">Memuat data obat...</p>
                  </div>
                ) : kunjunganObats && kunjunganObats.length > 0 ? (
                  <div className="rounded-md border">
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
                        {kunjunganObats.map((obat: any) => (
                          <TableRow key={obat.obat_id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{obat.nama_obat}</p>
                                {obat.kegunaan && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {obat.kegunaan}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{obat.dosis}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{obat.frekuensi}</Badge>
                            </TableCell>
                            <TableCell className="font-medium text-green-600">
                              {formatCurrency(obat.harga_obat)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenFormDialog(obat)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(obat.obat_id, obat.nama_obat)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground border rounded-md">
                    <Pill className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Belum ada obat</p>
                    <p className="text-sm mb-4">
                      Tambahkan resep obat untuk kunjungan ini
                    </p>
                    <Button onClick={() => handleOpenFormDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Obat Pertama
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog Form Tambah/Edit Obat */}
        <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                {editingObat ? "Edit Obat" : "Tambah Obat"}
              </DialogTitle>
              <DialogDescription>
                {editingObat
                  ? "Update dosis dan frekuensi obat"
                  : "Pilih obat dan atur dosis serta frekuensi"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="obat_id">Pilih Obat *</Label>
                  <select
                    id="obat_id"
                    value={formData.obat_id}
                    onChange={(e) =>
                      setFormData({ ...formData, obat_id: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    required
                    disabled={!!editingObat}
                  >
                    <option value="">-- Pilih Obat --</option>
                    {obats?.map((obat: any) => (
                      <option key={obat.obat_id} value={obat.obat_id}>
                        {obat.nama_obat} - {formatCurrency(obat.harga_obat)}
                      </option>
                    ))}
                  </select>
                  {editingObat && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Obat tidak dapat diubah saat edit
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="dosis">Dosis *</Label>
                  <Input
                    id="dosis"
                    placeholder="Contoh: 2 tablet, 5ml, 1 kapsul"
                    value={formData.dosis}
                    onChange={(e) =>
                      setFormData({ ...formData, dosis: e.target.value })
                    }
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Atur jumlah dan satuan dosis obat
                  </p>
                </div>

                <div>
                  <Label htmlFor="frekuensi">Frekuensi *</Label>
                  <Input
                    id="frekuensi"
                    placeholder="Contoh: 3x sehari, 2x sehari setelah makan"
                    value={formData.frekuensi}
                    onChange={(e) =>
                      setFormData({ ...formData, frekuensi: e.target.value })
                    }
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Atur jadwal dan waktu pemberian obat
                  </p>
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseFormDialog}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Menyimpan..." : editingObat ? "Update" : "Tambah"}
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