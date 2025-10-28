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
import { stokObatKlinikApi } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Pill, Wallet, Package, History } from "lucide-react";

// Komponen MutasiForm yang dioptimasi - terima props untuk isolasi state
const MutasiForm = memo(({ 
  mutasiForm, 
  onMutasiFormChange,
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
    const qty = parseInt(mutasiForm.qty);
    if (qty <= 0 || isNaN(qty)) {
      toast.error('Qty harus lebih dari 0');
      return;
    }
    // Validasi stok untuk Keluar
    if (mutasiForm.tipe_mutasi === 'Keluar') {
      if (!currentStok) {
        toast.error('Stok untuk obat ini belum ada');
        return;
      }
      if (qty > currentStok.jumlah_stok) {
        toast.error(`Stok tidak cukup. Stok saat ini: ${currentStok.jumlah_stok}, Qty diminta: ${qty}`);
        return;
      }
    }
    onSubmit({
      obat_id: selectedObat.obat_id,
      tipe_mutasi: mutasiForm.tipe_mutasi,
      qty,
      sumber_mutasi: mutasiForm.sumber_mutasi,
      keterangan: mutasiForm.keterangan,
    });
  };

  return (
    <div className="space-y-2">
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
          Stok saat ini: {currentStok.jumlah_stok}
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
    prevProps.currentStok === nextProps.currentStok &&
    prevProps.isSubmitting === nextProps.isSubmitting
  );
});

const AdminKlinikObatPage = () => {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const klinikId = user?.klinik_id; // Ambil klinik_id dari user (Admin Klinik)
  const [isStokDialogOpen, setIsStokDialogOpen] = useState(false);
  const [isFullHistoryDialogOpen, setIsFullHistoryDialogOpen] = useState(false);
  const [selectedObatForStok, setSelectedObatForStok] = useState<any>(null);
  const [mutasiForm, setMutasiForm] = useState({
    tipe_mutasi: 'Masuk',
    qty: '',
    sumber_mutasi: 'Pembelian',
    keterangan: '',
  });

  // Query untuk obat dengan stok di klinik ini
  const { data: obatsWithStok, isLoading: isLoadingObats } = useQuery({
    queryKey: ["all-obats-stok-klinik", klinikId],
    queryFn: () => stokObatKlinikApi.getAllObatWithStokByKlinik(klinikId!, token!),
    enabled: !!klinikId && !!token,
  });

  // Query untuk mutasi di klinik ini
  const { data: mutasiObats, isLoading: isLoadingMutasi } = useQuery({
    queryKey: ["mutasi-klinik", klinikId, selectedObatForStok?.obat_id],
    queryFn: () => selectedObatForStok ? stokObatKlinikApi.getMutasiByKlinik(klinikId!, token!) : Promise.resolve([]),
    enabled: !!klinikId && !!selectedObatForStok,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Filter mutasi berdasarkan obat yang dipilih
  const filteredMutasi = useMemo(() => {
    if (!mutasiObats || !selectedObatForStok) return [];
    return mutasiObats.filter((m: any) => m.obat_id === selectedObatForStok.obat_id);
  }, [mutasiObats, selectedObatForStok]);

  const addMutasiMutation = useMutation({
    mutationFn: async (data: any) => {
      return stokObatKlinikApi.addMutasiByKlinik(klinikId!, data, token!);
    },
    onSuccess: () => {
      // Invalidate dan refetch query obat dengan stok
      queryClient.invalidateQueries({ queryKey: ["all-obats-stok-klinik", klinikId] });
      queryClient.refetchQueries({ queryKey: ["all-obats-stok-klinik", klinikId] });  // Tambahkan refetch manual untuk memastikan
      
      // Invalidate dan refetch query mutasi
      queryClient.invalidateQueries({ queryKey: ["mutasi-klinik", klinikId, selectedObatForStok?.obat_id] });
      queryClient.refetchQueries({ queryKey: ["mutasi-klinik", klinikId, selectedObatForStok?.obat_id] });  // Tambahkan refetch manual
      
      toast.success("Mutasi obat berhasil ditambahkan");
      setMutasiForm({ tipe_mutasi: 'Masuk', qty: '', sumber_mutasi: 'Pembelian', keterangan: '' });
      handleCloseStokDialog();
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menambah mutasi");
    },
  });

  const handleOpenStokDialog = (obat: any) => {
    setSelectedObatForStok(obat);
    setIsStokDialogOpen(true);
  };

  const handleCloseStokDialog = () => {
    setIsStokDialogOpen(false);
    setSelectedObatForStok(null);
    setMutasiForm({ tipe_mutasi: 'Masuk', qty: '', sumber_mutasi: 'Pembelian', keterangan: '' });
  };

  const handleOpenFullHistory = () => {
    setIsFullHistoryDialogOpen(true);
  };

  const handleCloseFullHistory = () => {
    setIsFullHistoryDialogOpen(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Handler untuk mutasi form change
  const handleMutasiFormChange = useCallback((newForm: any) => {
    setMutasiForm(newForm);
  }, []);

  // Handler untuk submit mutasi
  const handleMutasiSubmit = useCallback((data: any) => {
    addMutasiMutation.mutate(data);
  }, [addMutasiMutation]);

  if (isLoadingObats) {
    return (
      <DashboardLayout title="Kelola Obat Klinik">
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
    <DashboardLayout title="Kelola Obat Klinik" showBackButton={true}>
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Daftar Obat di Klinik Anda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">No</TableHead>
                  <TableHead>Nama Obat</TableHead>
                  <TableHead>Kegunaan</TableHead>
                  <TableHead>Harga Satuan</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {obatsWithStok?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Tidak ada obat tersedia
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
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          {obat.jumlah_stok || 0}  {/* Tampilkan 0 jika stok kosong */}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenStokDialog(obat)}
                        >
                          <Package className="h-4 w-4 mr-1" />
                          Manage Stok
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialog untuk Manage Stok */}
        <Dialog open={isStokDialogOpen} onOpenChange={setIsStokDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Manage Stok: {selectedObatForStok?.nama_obat}
              </DialogTitle>
              <DialogDescription>
                Lihat dan kelola stok obat ini di klinik Anda
              </DialogDescription>
            </DialogHeader>
            {selectedObatForStok && (
              <div className="space-y-4">
                <div>
                  <Label>Stok Saat Ini</Label>
                  <p className="text-lg font-semibold">{selectedObatForStok.jumlah_stok}</p>
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
                          <TableHead>Tipe</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Sumber</TableHead>
                          <TableHead>Keterangan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMutasi?.slice(0, 10).map((mutasi: any) => (
                          <TableRow key={mutasi.mutasi_id}>
                            <TableCell>{new Date(mutasi.tanggal_mutasi).toLocaleDateString()}</TableCell>
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
                    currentStok={selectedObatForStok}
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
                Semua riwayat mutasi obat ini di klinik Anda
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
                        <TableHead>Tipe</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Sumber</TableHead>
                        <TableHead>Keterangan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMutasi?.map((mutasi: any) => (
                        <TableRow key={mutasi.mutasi_id}>
                          <TableCell>{new Date(mutasi.tanggal_mutasi).toLocaleDateString()}</TableCell>
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

export default AdminKlinikObatPage;