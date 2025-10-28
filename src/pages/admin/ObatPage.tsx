import { useState, useMemo, useCallback, memo } from "react";
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
import { obatApi, stokObatApi, klinikApi } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Pill, Wallet, Package, History } from "lucide-react";

// Komponen MutasiForm yang dioptimasi - terima props untuk isolasi state
const MutasiForm = memo(({ 
  mutasiForm, 
  onMutasiFormChange,
  kliniks, 
  isLoadingKliniks,
  currentStok,
  selectedObat,
  onSubmit,
  isSubmitting
}: any) => {
  const sumberOptions = mutasiForm.tipe_mutasi === 'Masuk' 
    ? ['Pembelian', 'Penyesuaian'] 
    : ['Pemakaian'];

  const handleTipeMutasiChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tipe = e.target.value;
    onMutasiFormChange({
      ...mutasiForm,
      tipe_mutasi: tipe,
      sumber_mutasi: tipe === 'Masuk' ? 'Pembelian' : 'Pemakaian',
    });
  };

  const handleSubmitClick = () => {
    if (!mutasiForm.klinik_id) {
      toast.error('Pilih klinik terlebih dahulu');
      return;
    }
    const qty = parseInt(mutasiForm.qty);
    if (qty <= 0 || isNaN(qty)) {
      toast.error('Qty harus lebih dari 0');
      return;
    }
    // Validasi stok untuk Keluar
    if (mutasiForm.tipe_mutasi === 'Keluar') {
      if (!currentStok) {
        toast.error('Stok untuk obat di klinik ini belum ada');
        return;
      }
      if (qty > currentStok.jumlah_stok) {
        toast.error(`Stok tidak cukup. Stok saat ini: ${currentStok.jumlah_stok}, Qty diminta: ${qty}`);
        return;
      }
    }
    onSubmit({
      obat_id: selectedObat.obat_id,
      klinik_id: parseInt(mutasiForm.klinik_id),
      tipe_mutasi: mutasiForm.tipe_mutasi,
      qty,
      sumber_mutasi: mutasiForm.sumber_mutasi,
      keterangan: mutasiForm.keterangan,
    });
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm">Klinik</label>
      {isLoadingKliniks ? (
        <p className="text-sm text-muted-foreground">Memuat klinik...</p>
      ) : (
        <select
          value={mutasiForm.klinik_id}
          onChange={(e) => onMutasiFormChange({ ...mutasiForm, klinik_id: e.target.value })}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">-- Pilih Klinik --</option>
          {kliniks?.map((k: any) => (
            <option key={k.klinik_id} value={String(k.klinik_id)}>
              {k.nama_klinik ?? `Klinik ${k.klinik_id}`}
            </option>
          ))}
        </select>
      )}

      <select
        value={mutasiForm.tipe_mutasi}
        onChange={handleTipeMutasiChange}
        className="w-full border rounded px-3 py-2"
      >
        <option value="Masuk">Masuk</option>
        <option value="Keluar">Keluar</option>
      </select>

      <Input
        placeholder="Qty"
        type="number"
        value={mutasiForm.qty}
        onChange={(e) => onMutasiFormChange({ ...mutasiForm, qty: e.target.value })}
      />

      {mutasiForm.tipe_mutasi === 'Keluar' && currentStok && (
        <p className="text-sm text-muted-foreground">
          Stok saat ini di klinik ini: {currentStok.jumlah_stok}
        </p>
      )}

      <select
        value={mutasiForm.sumber_mutasi}
        onChange={(e) => onMutasiFormChange({ ...mutasiForm, sumber_mutasi: e.target.value })}
        className="w-full border rounded px-3 py-2"
      >
        {sumberOptions.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <Input
        placeholder="Keterangan"
        value={mutasiForm.keterangan}
        onChange={(e) => onMutasiFormChange({ ...mutasiForm, keterangan: e.target.value })}
      />

      <Button
        onClick={handleSubmitClick}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Menambahkan...' : 'Tambah Mutasi'}
      </Button>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison untuk mencegah re-render yang tidak perlu
  return (
    JSON.stringify(prevProps.mutasiForm) === JSON.stringify(nextProps.mutasiForm) &&
    prevProps.kliniks === nextProps.kliniks &&
    prevProps.currentStok === nextProps.currentStok &&
    prevProps.isSubmitting === nextProps.isSubmitting
  );
});

const ObatPage = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isStokDialogOpen, setIsStokDialogOpen] = useState(false);
  const [isStokDetailDialogOpen, setIsStokDetailDialogOpen] = useState(false);
  const [isFullHistoryDialogOpen, setIsFullHistoryDialogOpen] = useState(false);
  const [selectedObatForStok, setSelectedObatForStok] = useState<any>(null);
  const [selectedObatForDetail, setSelectedObatForDetail] = useState<any>(null);
  const [editingObat, setEditingObat] = useState<any>(null);
  const [formData, setFormData] = useState({
    nama_obat: "",
    kegunaan: "",
    harga_obat: "",
  });
  const [mutasiForm, setMutasiForm] = useState({
    klinik_id: '',
    tipe_mutasi: 'Masuk',
    qty: '',
    sumber_mutasi: 'Pembelian',
    keterangan: '',
  });

  // Query untuk obat master
  const { data: obats, isLoading: isLoadingObats } = useQuery({
    queryKey: ["obats"],
    queryFn: () => obatApi.getAll(token!),
  });

  // Query untuk stok obat
  const { data: stokObats, isLoading: isLoadingStok } = useQuery({
    queryKey: ["stok-obats"],
    queryFn: () => stokObatApi.getAll(token!),
  });

  // Gabungkan data obat dengan stok menggunakan useMemo
  const obatsWithStok = useMemo(() => {
    if (!obats || !stokObats) return obats || [];
    return obats.map((obat: any) => {
      const stok = stokObats.find((s: any) => s.obat_id === obat.obat_id);
      return {
        ...obat,
        jumlah_stok: stok ? stok.jumlah_stok : null,
        nama_klinik: stok ? stok.nama_klinik : null,
      };
    });
  }, [obats, stokObats]);

  // Query untuk mutasi obat - FIXED: Tambahkan refetch options
  const { data: mutasiObats, isLoading: isLoadingMutasi } = useQuery({
    queryKey: ["mutasi-obats", selectedObatForStok?.obat_id],
    queryFn: () => selectedObatForStok ? stokObatApi.getMutasiByObatId(selectedObatForStok.obat_id, token!) : Promise.resolve([]),
    enabled: !!selectedObatForStok,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Gunakan useMemo untuk cari stok dari data stokObats yang sudah ada
  const currentStok = useMemo(() => {
    if (!selectedObatForStok || !mutasiForm.klinik_id || !stokObats) return null;
    return stokObats.find((s: any) => s.obat_id === selectedObatForStok.obat_id && s.klinik_id === parseInt(mutasiForm.klinik_id)) || null;
  }, [selectedObatForStok, mutasiForm.klinik_id, stokObats]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        harga_obat: parseFloat(String(data.harga_obat)) || 0
      };
      if (editingObat) {
        return obatApi.update(editingObat.obat_id, payload, token!);
      }
      return obatApi.create(payload, token!);
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
      queryClient.invalidateQueries({ queryKey: ["stok-obats"] });
      toast.success("Obat berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus obat");
    },
  });

  const addMutasiMutation = useMutation({
    mutationFn: async (data: any) => {
      return stokObatApi.addMutasi(data, token!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stok-obats"] });
      queryClient.invalidateQueries({ queryKey: ["mutasi-obats"] });
      toast.success("Mutasi obat berhasil ditambahkan");
      setMutasiForm({ klinik_id: '', tipe_mutasi: 'Masuk', qty: '', sumber_mutasi: 'Pembelian', keterangan: '' });
      handleCloseStokDialog();  // Tambahkan ini untuk menutup dialog otomatis
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menambah mutasi");
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

  const handleOpenStokDialog = (obat: any) => {
    setSelectedObatForStok(obat);
    setIsStokDialogOpen(true);
  };

  const handleCloseStokDialog = () => {
    setIsStokDialogOpen(false);
    setSelectedObatForStok(null);
    setMutasiForm({ klinik_id: '', tipe_mutasi: 'Masuk', qty: '', sumber_mutasi: 'Pembelian', keterangan: '' });
  };

  const handleOpenStokDetail = (obat: any) => {
    setSelectedObatForDetail(obat);
    setIsStokDetailDialogOpen(true);
  };

  const handleCloseStokDetail = () => {
    setIsStokDetailDialogOpen(false);
    setSelectedObatForDetail(null);
  };

  const handleOpenFullHistory = () => {
    setIsFullHistoryDialogOpen(true);
  };

  const handleCloseFullHistory = () => {
    setIsFullHistoryDialogOpen(false);
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

  // Query untuk daftar klinik
  const { data: kliniks, isLoading: isLoadingKliniks } = useQuery({
    queryKey: ["kliniks"],
    queryFn: () => klinikApi.getAll(token!),
    enabled: !!token && (isStokDialogOpen || isStokDetailDialogOpen),
    staleTime: 5 * 60 * 1000,
  });

  // Handler untuk mutasi form change - gunakan useCallback untuk stabilitas
  const handleMutasiFormChange = useCallback((newForm: any) => {
    setMutasiForm(newForm);
  }, []);

  // Handler untuk submit mutasi
  const handleMutasiSubmit = useCallback((data: any) => {
    addMutasiMutation.mutate(data);
  }, [addMutasiMutation]);

  if (isLoadingObats || isLoadingStok) {
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
                  <TableHead>Stok Tersedia</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {obatsWithStok?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Belum ada data obat
                    </TableCell>
                  </TableRow>
                ) : (
                  obatsWithStok?.map((obat: any, index: number) => (
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
                          {formatCurrency(parseFloat(String(obat.harga_obat || 0)))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenStokDetail(obat)}
                        >
                          <Package className="h-4 w-4 mr-1" />
                          Lihat Stok
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenStokDialog(obat)}
                          >
                            <Package className="h-4 w-4 mr-1" />
                            Manage Stok
                          </Button>
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

        {/* Dialog untuk Tambah/Edit Obat */}
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

        {/* Dialog untuk Detail Stok */}
        <Dialog open={isStokDetailDialogOpen} onOpenChange={setIsStokDetailDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Detail Stok: {selectedObatForDetail?.nama_obat}
              </DialogTitle>
              <DialogDescription>
                Stok obat di berbagai klinik
              </DialogDescription>
            </DialogHeader>
            {selectedObatForDetail && (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Klinik</TableHead>
                      <TableHead>Jumlah Stok</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kliniks?.map((klinik: any) => {
                      const stok = stokObats?.find((s: any) => s.obat_id === selectedObatForDetail.obat_id && s.klinik_id === klinik.klinik_id);
                      return (
                        <TableRow key={klinik.klinik_id}>
                          <TableCell>{klinik.nama_klinik}</TableCell>
                          <TableCell>{stok ? stok.jumlah_stok : 0}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseStokDetail}>
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog untuk Manage Stok */}
        <Dialog open={isStokDialogOpen} onOpenChange={setIsStokDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Manage Stok: {selectedObatForStok?.nama_obat}
              </DialogTitle>
              <DialogDescription>
                Lihat dan kelola stok obat ini
              </DialogDescription>
            </DialogHeader>
            {selectedObatForStok && (
              <div className="space-y-4">
                <div>
                  <Label>Stok Tersedia Saat Ini</Label>
                  <p className="text-lg font-semibold">
                    {selectedObatForStok.jumlah_stok !== null ? selectedObatForStok.jumlah_stok : "Belum diinisialisasi"}
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label>Riwayat Mutasi (10 Terbaru)</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenFullHistory}
                    >
                      <History className="h-4 w-4 mr-1" />
                      Lihat Semua
                    </Button>
                  </div>
                  {isLoadingMutasi ? (
                    <p>Loading...</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Klinik</TableHead>
                          <TableHead>Tipe</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Sumber</TableHead>
                          <TableHead>Keterangan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mutasiObats?.slice(0, 10).map((mutasi: any) => (
                          <TableRow key={mutasi.mutasi_id}>
                            <TableCell>{new Date(mutasi.tanggal_mutasi).toLocaleDateString()}</TableCell>
                            <TableCell>{kliniks?.find(k => k.klinik_id === mutasi.klinik_id)?.nama_klinik || 'Unknown'}</TableCell>
                            <TableCell>{mutasi.tipe_mutasi}</TableCell>
                            <TableCell>{mutasi.qty}</TableCell>
                            <TableCell>{mutasi.sumber_mutasi}</TableCell>
                            <TableCell>{mutasi.keterangan}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
                <div>
                  <Label>Tambah Mutasi Obat</Label>
                  <MutasiForm 
                    mutasiForm={mutasiForm}
                    onMutasiFormChange={handleMutasiFormChange}
                    kliniks={kliniks}
                    isLoadingKliniks={isLoadingKliniks}
                    currentStok={currentStok}
                    selectedObat={selectedObatForStok}
                    onSubmit={handleMutasiSubmit}
                    isSubmitting={addMutasiMutation.isPending}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={handleCloseStokDialog}>
                    Tutup
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog untuk Full History Mutasi */}
        <Dialog open={isFullHistoryDialogOpen} onOpenChange={setIsFullHistoryDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Riwayat Mutasi Lengkap: {selectedObatForStok?.nama_obat}
              </DialogTitle>
              <DialogDescription>
                Semua riwayat mutasi obat ini
              </DialogDescription>
            </DialogHeader>
            {selectedObatForStok && (
              <div className="space-y-4">
                {isLoadingMutasi ? (
                  <p>Loading...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Klinik</TableHead>
                        <TableHead>Tipe</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Sumber</TableHead>
                        <TableHead>Keterangan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mutasiObats?.map((mutasi: any) => (
                        <TableRow key={mutasi.mutasi_id}>
                          <TableCell>{new Date(mutasi.tanggal_mutasi).toLocaleDateString()}</TableCell>
                          <TableCell>{kliniks?.find(k => k.klinik_id === mutasi.klinik_id)?.nama_klinik || 'Unknown'}</TableCell>
                          <TableCell>{mutasi.tipe_mutasi}</TableCell>
                          <TableCell>{mutasi.qty}</TableCell>
                          <TableCell>{mutasi.sumber_mutasi}</TableCell>
                          <TableCell>{mutasi.keterangan}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseFullHistory}>
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ObatPage;