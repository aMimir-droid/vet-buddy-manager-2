import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, Edit, Trash2, Stethoscope, Clock, FileText, Eye, ArrowRight, Info } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { kunjunganApi, hewanApi, dokterApi } from "@/lib/api";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const KunjunganPage = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isPreviousVisitDialogOpen, setIsPreviousVisitDialogOpen] = useState(false);
  const [editingKunjungan, setEditingKunjungan] = useState<any>(null);
  const [viewingKunjungan, setViewingKunjungan] = useState<any>(null);
  const [viewingPreviousVisit, setViewingPreviousVisit] = useState<any>(null);
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
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/kunjungan/hewan/${hewanId}/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const history = await response.json();
        setHewanHistory(history);
        
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
      setViewingPreviousVisit(kunjungan);
      setIsPreviousVisitDialogOpen(true);
    }
  };

  const handleViewPreviousVisitFromTable = (kunjunganId: number | null) => {
    if (!kunjunganId) return;
    const kunjungan = kunjungans?.find((k: any) => k.kunjungan_id === kunjunganId);
    if (kunjungan) {
      setViewingPreviousVisit(kunjungan);
      setIsPreviousVisitDialogOpen(true);
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
    
    if (hewanHistory.length > 0 && !formData.kunjungan_sebelumnya && !editingKunjungan) {
      toast.error("Silakan pilih kunjungan sebelumnya atau pilih 'Tidak Ada'");
      return;
    }
    
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
              Daftar Kunjungan Medis
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
                {kunjungans?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Belum ada data kunjungan
                    </TableCell>
                  </TableRow>
                ) : (
                  kunjungans?.map((kunjungan: any) => (
                    <TableRow key={kunjungan.kunjungan_id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {new Date(kunjungan.tanggal_kunjungan).toLocaleDateString('id-ID')}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {kunjungan.waktu_kunjungan}
                          </span>
                          {kunjungan.kunjungan_sebelumnya && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 mt-1 text-xs text-primary hover:text-primary"
                                    onClick={() => handleViewPreviousVisitFromTable(kunjungan.kunjungan_sebelumnya)}
                                  >
                                    <Info className="h-3 w-3 mr-1" />
                                    Kunjungan Sebelumnya
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Klik untuk melihat detail kunjungan sebelumnya</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{kunjungan.nama_hewan}</TableCell>
                      <TableCell>{kunjungan.nama_pawrent}</TableCell>
                      <TableCell>{kunjungan.nama_dokter}</TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate" title={kunjungan.catatan}>
                          {kunjungan.catatan || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatCurrency(kunjungan.total_biaya)}
                      </TableCell>
                      <TableCell>{getMetodeBadge(kunjungan.metode_pembayaran)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(kunjungan)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm("Yakin ingin menghapus kunjungan ini?")) {
                                deleteMutation.mutate(kunjungan.kunjungan_id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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

        {/* Dialog Form Add/Edit */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {editingKunjungan ? "Edit Kunjungan" : "Tambah Kunjungan Baru"}
              </DialogTitle>
              <DialogDescription>
                {editingKunjungan
                  ? "Update informasi kunjungan medis"
                  : "Masukkan informasi kunjungan medis baru"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hewan_id">Hewan *</Label>
                  <Select
                    value={formData.hewan_id}
                    onValueChange={handleHewanChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih hewan" />
                    </SelectTrigger>
                    <SelectContent>
                      {hewans?.map((hewan: any) => (
                        <SelectItem key={hewan.hewan_id} value={hewan.hewan_id.toString()}>
                          {hewan.nama_hewan} ({hewan.nama_pawrent})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dokter_id">Dokter *</Label>
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
                        <SelectItem key={dokter.dokter_id} value={dokter.dokter_id.toString()}>
                          {dokter.title_dokter} {dokter.nama_dokter}
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

                {hewanHistory.length > 0 && (
                  <div className="col-span-2">
                    <Label htmlFor="kunjungan_sebelumnya">
                      Kunjungan Sebelumnya *
                      <span className="text-xs text-muted-foreground ml-2">
                        (Ditemukan {hewanHistory.length} riwayat kunjungan)
                      </span>
                    </Label>
                    <Select
                      value={formData.kunjungan_sebelumnya || "none"}
                      onValueChange={handlePreviousVisitChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kunjungan sebelumnya" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Tidak Ada / Kunjungan Pertama</SelectItem>
                        {hewanHistory.map((visit: any) => (
                          <SelectItem 
                            key={visit.kunjungan_id} 
                            value={visit.kunjungan_id.toString()}
                          >
                            {new Date(visit.tanggal_kunjungan).toLocaleDateString('id-ID')} - {visit.nama_dokter} - {calculateDaysSince(visit.tanggal_kunjungan)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedPreviousVisit && (
                      <div className="mt-2 p-3 bg-muted rounded-md">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium">Detail Kunjungan Sebelumnya:</p>
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
                        <p className="text-xs text-muted-foreground">
                          <strong>Tanggal:</strong> {new Date(selectedPreviousVisit.tanggal_kunjungan).toLocaleDateString('id-ID')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <strong>Dokter:</strong> {selectedPreviousVisit.nama_dokter}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <strong>Catatan:</strong> {selectedPreviousVisit.catatan || '-'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="col-span-2">
                  <Label htmlFor="catatan">Catatan / Diagnosa</Label>
                  <textarea
                    id="catatan"
                    className="w-full min-h-[100px] px-3 py-2 border rounded-md resize-none"
                    placeholder="Catatan medis, diagnosa, atau keluhan..."
                    value={formData.catatan}
                    onChange={(e) =>
                      setFormData({ ...formData, catatan: e.target.value })
                    }
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
                      <SelectItem value="Transfer">🏦 Transfer</SelectItem>
                      <SelectItem value="E-Wallet">📱 E-Wallet</SelectItem>
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

        {/* Dialog Detail View Kunjungan Sebelumnya */}
        <Dialog open={isPreviousVisitDialogOpen} onOpenChange={setIsPreviousVisitDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Detail Kunjungan Sebelumnya
              </DialogTitle>
              <DialogDescription>
                Informasi lengkap kunjungan medis sebelumnya
              </DialogDescription>
            </DialogHeader>
            {viewingPreviousVisit && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Tanggal Kunjungan</Label>
                    <p className="font-medium">
                      {new Date(viewingPreviousVisit.tanggal_kunjungan).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Waktu</Label>
                    <p className="font-medium">{viewingPreviousVisit.waktu_kunjungan}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Hewan</Label>
                    <p className="font-medium">{viewingPreviousVisit.nama_hewan}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Pemilik</Label>
                    <p className="font-medium">{viewingPreviousVisit.nama_pawrent}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Dokter</Label>
                    <p className="font-medium">{viewingPreviousVisit.nama_dokter}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Total Biaya</Label>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(viewingPreviousVisit.total_biaya)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Metode Pembayaran</Label>
                    <div className="mt-1">{getMetodeBadge(viewingPreviousVisit.metode_pembayaran)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Waktu Kunjungan</Label>
                    <p className="text-sm text-muted-foreground">
                      {calculateDaysSince(viewingPreviousVisit.tanggal_kunjungan)}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Catatan / Diagnosa</Label>
                  <div className="mt-2 p-4 bg-muted rounded-md">
                    <p className="text-sm whitespace-pre-wrap">
                      {viewingPreviousVisit.catatan || 'Tidak ada catatan'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setIsPreviousVisitDialogOpen(false)}>
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