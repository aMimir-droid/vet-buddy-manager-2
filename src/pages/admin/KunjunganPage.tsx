import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Plus, Pencil, Trash2, FileText, Eye, Clock, AlertCircle, Info } from "lucide-react";
import { kunjunganApi, hewanApi, dokterApi } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";

const KunjunganPage = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [editingKunjungan, setEditingKunjungan] = useState<any>(null);
  const [viewingKunjungan, setViewingKunjungan] = useState<any>(null);
  const [selectedHewan, setSelectedHewan] = useState<string>("");
  const [hewanHistory, setHewanHistory] = useState<any[]>([]);
  const [selectedPreviousVisit, setSelectedPreviousVisit] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    hewan_id: "",
    dokter_id: "",
    tanggal_kunjungan: "",
    waktu_kunjungan: "",
    catatan: "",
    total_biaya: "",
    metode_pembayaran: "Cash",
    kunjungan_sebelumnya: "",
  });

  const { data: kunjungans, isLoading } = useQuery<any[]>({
    queryKey: ["kunjungans"],
    queryFn: () => kunjunganApi.getAll(token!),
  });

  const { data: hewans } = useQuery<any[]>({
    queryKey: ["hewans"],
    queryFn: () => hewanApi.getAll(token!),
  });

  const { data: dokters } = useQuery<any[]>({
    queryKey: ["dokters"],
    queryFn: () => dokterApi.getAll(token!),
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingKunjungan) {
        return kunjunganApi.update(editingKunjungan.kunjungan_id, data, token!);
      }
      return kunjunganApi.create(data, token!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kunjungans"] });
      toast.success(editingKunjungan ? "Kunjungan berhasil diupdate" : "Kunjungan berhasil ditambahkan");
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menyimpan kunjungan");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (kunjunganId: number) => kunjunganApi.delete(kunjunganId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kunjungans"] });
      toast.success("Kunjungan berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus kunjungan");
    },
  });

  const handlePreviousVisitChange = (visitId: string) => {
    // Convert "none" to empty string for backend
    const actualValue = visitId === "none" ? "" : visitId;
    setFormData({ ...formData, kunjungan_sebelumnya: actualValue });
    
    if (visitId && visitId !== "none") {
      const visit = hewanHistory.find(v => v.kunjungan_id.toString() === visitId);
      setSelectedPreviousVisit(visit);
    } else {
      setSelectedPreviousVisit(null);
    }
  };

  const handleHewanChange = async (hewanId: string) => {
    setSelectedHewan(hewanId);
    setFormData({ ...formData, hewan_id: hewanId, kunjungan_sebelumnya: "" });
    setSelectedPreviousVisit(null);
    
    if (!hewanId) {
      setHewanHistory([]);
      return;
    }
    
    // Fetch history for this hewan
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/kunjungan/hewan/${hewanId}/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const history = await response.json();
        setHewanHistory(history);
        
        // Show info if there's history
        if (history.length > 0 && !editingKunjungan) {
          toast.info(`Ditemukan ${history.length} riwayat kunjungan sebelumnya`);
        }
      } else {
        setHewanHistory([]);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      setHewanHistory([]);
      toast.error('Gagal mengambil riwayat kunjungan');
    }
  };

  const handleViewPreviousVisit = (kunjunganId: number) => {
    const kunjungan = kunjungans?.find((k: any) => k.kunjungan_id === kunjunganId);
    if (kunjungan) {
      setViewingKunjungan(kunjungan);
      setIsDetailDialogOpen(true);
    }
  };

  const handleOpenDialog = (kunjungan?: any) => {
    if (kunjungan) {
      setEditingKunjungan(kunjungan);
      setFormData({
        hewan_id: kunjungan.hewan_id?.toString() || "",
        dokter_id: kunjungan.dokter_id?.toString() || "",
        tanggal_kunjungan: kunjungan.tanggal_kunjungan?.split('T')[0] || "",
        waktu_kunjungan: kunjungan.waktu_kunjungan || "",
        catatan: kunjungan.catatan || "",
        total_biaya: kunjungan.total_biaya?.toString() || "",
        metode_pembayaran: kunjungan.metode_pembayaran || "Cash",
        kunjungan_sebelumnya: kunjungan.kunjungan_sebelumnya?.toString() || "",
      });
      if (kunjungan.hewan_id) {
        handleHewanChange(kunjungan.hewan_id.toString());
      }
    } else {
      setEditingKunjungan(null);
      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toTimeString().slice(0, 5);
      setFormData({
        hewan_id: "",
        dokter_id: "",
        tanggal_kunjungan: today,
        waktu_kunjungan: now,
        catatan: "",
        total_biaya: "",
        metode_pembayaran: "Cash",
        kunjungan_sebelumnya: "",
      });
      setHewanHistory([]);
      setSelectedPreviousVisit(null);
      setSelectedHewan("");
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingKunjungan(null);
    setHewanHistory([]);
    setSelectedPreviousVisit(null);
    setSelectedHewan("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi: Jika ada history tapi tidak dipilih
    if (hewanHistory.length > 0 && !formData.kunjungan_sebelumnya && !editingKunjungan) {
      toast.error("Silakan pilih kunjungan sebelumnya atau pilih 'Tidak Ada'");
      return;
    }
    
    // Clean up data before sending
    const submitData = {
      ...formData,
      kunjungan_sebelumnya: formData.kunjungan_sebelumnya || null,
    };
    
    saveMutation.mutate(submitData);
  };

  const getMetodeBadge = (metode: string) => {
    const badges: any = {
      'Cash': <Badge variant="default">💵 Cash</Badge>,
      'Transfer': <Badge variant="secondary">🏦 Transfer</Badge>,
      'E-Wallet': <Badge variant="outline">📱 E-Wallet</Badge>,
    };
    return badges[metode] || <Badge>{metode}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateDaysSince = (date: string) => {
    const visitDate = new Date(date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - visitDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Hari ini";
    if (diffDays === 1) return "Kemarin";
    if (diffDays < 7) return `${diffDays} hari yang lalu`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu yang lalu`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} bulan yang lalu`;
    return `${Math.floor(diffDays / 365)} tahun yang lalu`;
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Kelola Kunjungan">
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
    <DashboardLayout title="Kelola Kunjungan" showBackButton={true}>
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Daftar Kunjungan
            </CardTitle>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Kunjungan
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Hewan</TableHead>
                  <TableHead>Pemilik</TableHead>
                  <TableHead>Dokter</TableHead>
                  <TableHead>Catatan</TableHead>
                  <TableHead>Total Biaya</TableHead>
                  <TableHead>Pembayaran</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kunjungans?.map((kunjungan: any) => (
                  <TableRow key={kunjungan.kunjungan_id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">
                          {new Date(kunjungan.tanggal_kunjungan).toLocaleDateString("id-ID")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {kunjungan.waktu_kunjungan}
                        </span>
                        {kunjungan.kunjungan_sebelumnya && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs gap-1 mt-1 hover:bg-primary/10"
                            onClick={() => handleViewPreviousVisit(kunjungan.kunjungan_sebelumnya)}
                          >
                            <Eye className="h-3 w-3" />
                            Lihat Kunjungan Sebelumnya
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{kunjungan.nama_hewan}</span>
                        <span className="text-xs text-muted-foreground">{kunjungan.nama_jenis_hewan}</span>
                      </div>
                    </TableCell>
                    <TableCell>{kunjungan.nama_pawrent}</TableCell>
                    <TableCell>{kunjungan.nama_dokter}</TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        {kunjungan.catatan ? (
                          <div className="flex flex-col gap-1">
                            <p className="text-sm line-clamp-2 text-muted-foreground">
                              {kunjungan.catatan}
                            </p>
                            {kunjungan.catatan.length > 100 && (
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-xs"
                                onClick={() => {
                                  setViewingKunjungan(kunjungan);
                                  setIsDetailDialogOpen(true);
                                }}
                              >
                                Lihat selengkapnya
                              </Button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Tidak ada catatan
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {formatCurrency(parseFloat(kunjungan.total_biaya || 0))}
                    </TableCell>
                    <TableCell>{getMetodeBadge(kunjungan.metode_pembayaran)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(kunjungan)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm("Yakin ingin menghapus kunjungan ini?")) {
                              deleteMutation.mutate(kunjungan.kunjungan_id);
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

        {/* Dialog Form Add/Edit */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {editingKunjungan ? "Edit Kunjungan" : "Tambah Kunjungan Baru"}
              </DialogTitle>
              <DialogDescription>
                {editingKunjungan
                  ? "Update informasi kunjungan"
                  : "Masukkan informasi kunjungan baru"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="hewan_id">Hewan *</Label>
                  <Select
                    value={formData.hewan_id}
                    onValueChange={handleHewanChange}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih hewan" />
                    </SelectTrigger>
                    <SelectContent>
                      {hewans?.map((hewan: any) => (
                        <SelectItem key={hewan.hewan_id} value={hewan.hewan_id.toString()}>
                          {hewan.nama_hewan} - {hewan.nama_jenis_hewan} ({hewan.nama_pawrent})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Show history alert if available */}
                {hewanHistory.length > 0 && !editingKunjungan && (
                  <div className="col-span-2">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Riwayat Kunjungan Ditemukan:</strong> Hewan ini memiliki {hewanHistory.length} kunjungan sebelumnya.
                        Silakan pilih kunjungan sebelumnya yang relevan di bawah.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* Previous Visit Selection */}
                {selectedHewan && (
                  <div className="col-span-2">
                    <Label htmlFor="kunjungan_sebelumnya">
                      Kunjungan Sebelumnya {hewanHistory.length > 0 && <span className="text-red-500">*</span>}
                    </Label>
                    <Select
                      value={formData.kunjungan_sebelumnya}
                      onValueChange={handlePreviousVisitChange}
                      required={hewanHistory.length > 0 && !editingKunjungan}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          hewanHistory.length > 0 
                            ? "Pilih kunjungan sebelumnya" 
                            : "Tidak ada riwayat kunjungan"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          {hewanHistory.length > 0 ? "Tidak Ada / Kunjungan Pertama" : "Tidak ada riwayat"}
                        </SelectItem>
                        {hewanHistory.map((visit: any) => (
                          <SelectItem key={visit.kunjungan_id} value={visit.kunjungan_id.toString()}>
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              {new Date(visit.tanggal_kunjungan).toLocaleDateString("id-ID")} - 
                              {visit.nama_dokter} - 
                              {formatCurrency(parseFloat(visit.total_biaya || 0))}
                              <span className="text-xs text-muted-foreground ml-2">
                                ({calculateDaysSince(visit.tanggal_kunjungan)})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Show selected previous visit details */}
                {selectedPreviousVisit && (
                  <div className="col-span-2">
                    <Card className="bg-muted/50">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">Detail Kunjungan Sebelumnya</CardTitle>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewPreviousVisit(selectedPreviousVisit.kunjungan_id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Lihat Detail
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="text-sm space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-muted-foreground">Tanggal:</span>
                            <span className="ml-2 font-medium">
                              {new Date(selectedPreviousVisit.tanggal_kunjungan).toLocaleDateString("id-ID")}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Dokter:</span>
                            <span className="ml-2 font-medium">{selectedPreviousVisit.nama_dokter}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Biaya:</span>
                            <span className="ml-2 font-medium text-green-600">
                              {formatCurrency(parseFloat(selectedPreviousVisit.total_biaya || 0))}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Pembayaran:</span>
                            <span className="ml-2">{getMetodeBadge(selectedPreviousVisit.metode_pembayaran)}</span>
                          </div>
                        </div>
                        {selectedPreviousVisit.catatan && (
                          <div>
                            <span className="text-muted-foreground">Catatan:</span>
                            <p className="mt-1 text-xs italic">{selectedPreviousVisit.catatan}</p>
                          </div>
                        )}
                        {selectedPreviousVisit.obat_resep && (
                          <div>
                            <span className="text-muted-foreground">Obat:</span>
                            <p className="mt-1 text-xs">{selectedPreviousVisit.obat_resep}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                <div>
                  <Label htmlFor="dokter_id">Dokter *</Label>
                  <Select
                    value={formData.dokter_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, dokter_id: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih dokter" />
                    </SelectTrigger>
                    <SelectContent>
                      {dokters?.map((dokter: any) => (
                        <SelectItem key={dokter.dokter_id} value={dokter.dokter_id.toString()}>
                          {dokter.title_dokter} {dokter.nama_dokter} - {dokter.nama_spesialisasi || "Umum"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tanggal_kunjungan">Tanggal Kunjungan *</Label>
                  <Input
                    id="tanggal_kunjungan"
                    type="date"
                    value={formData.tanggal_kunjungan}
                    onChange={(e) =>
                      setFormData({ ...formData, tanggal_kunjungan: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="waktu_kunjungan">Waktu Kunjungan *</Label>
                  <Input
                    id="waktu_kunjungan"
                    type="time"
                    value={formData.waktu_kunjungan}
                    onChange={(e) =>
                      setFormData({ ...formData, waktu_kunjungan: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="total_biaya">Total Biaya (Rp) *</Label>
                  <Input
                    id="total_biaya"
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={formData.total_biaya}
                    onChange={(e) =>
                      setFormData({ ...formData, total_biaya: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="metode_pembayaran">Metode Pembayaran *</Label>
                  <Select
                    value={formData.metode_pembayaran}
                    onValueChange={(value) =>
                      setFormData({ ...formData, metode_pembayaran: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">💵 Cash</SelectItem>
                      <SelectItem value="Transfer">🏦 Transfer Bank</SelectItem>
                      <SelectItem value="E-Wallet">📱 E-Wallet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="catatan">Catatan / Diagnosa</Label>
                  <textarea
                    id="catatan"
                    className="w-full min-h-[100px] px-3 py-2 border rounded-md resize-none"
                    placeholder="Catatan dokter, diagnosa, atau informasi tambahan..."
                    value={formData.catatan}
                    onChange={(e) =>
                      setFormData({ ...formData, catatan: e.target.value })
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

        {/* Dialog Detail View Kunjungan Sebelumnya */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Detail Kunjungan Sebelumnya
              </DialogTitle>
            </DialogHeader>
            {viewingKunjungan && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Hewan</Label>
                    <p className="text-sm font-medium">{viewingKunjungan.nama_hewan}</p>
                  </div>
                  <div>
                    <Label>Pemilik</Label>
                    <p className="text-sm font-medium">{viewingKunjungan.nama_pawrent}</p>
                  </div>
                  <div>
                    <Label>Dokter</Label>
                    <p className="text-sm font-medium">{viewingKunjungan.nama_dokter}</p>
                  </div>
                  <div>
                    <Label>Tanggal & Waktu</Label>
                    <p className="text-sm font-medium">
                      {new Date(viewingKunjungan.tanggal_kunjungan).toLocaleDateString("id-ID")} - {viewingKunjungan.waktu_kunjungan}
                    </p>
                  </div>
                  <div>
                    <Label>Total Biaya</Label>
                    <p className="text-sm font-bold text-green-600">
                      {formatCurrency(parseFloat(viewingKunjungan.total_biaya || 0))}
                    </p>
                  </div>
                  <div>
                    <Label>Metode Pembayaran</Label>
                    <div className="mt-1">{getMetodeBadge(viewingKunjungan.metode_pembayaran)}</div>
                  </div>
                </div>
                {viewingKunjungan.catatan && (
                  <div>
                    <Label>Catatan</Label>
                    <p className="text-sm mt-1 p-3 bg-muted rounded-md">{viewingKunjungan.catatan}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default KunjunganPage;