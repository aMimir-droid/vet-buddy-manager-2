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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { kunjunganApi, hewanApi, dokterApi } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Calendar, FileText, Clock, Wallet, Info, History, Link2, Eye, ArrowRight } from "lucide-react";

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

  const { data: kunjungans, isLoading } = useQuery({
    queryKey: ["kunjungans"],
    queryFn: () => kunjunganApi.getAll(token!),
  });

  const { data: hewans } = useQuery({
    queryKey: ["hewans"],
    queryFn: () => hewanApi.getAll(token!),
  });

  const { data: dokters } = useQuery({
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

  const handleHewanChange = async (hewanId: string) => {
    setSelectedHewan(hewanId);
    setFormData({ ...formData, hewan_id: hewanId, kunjungan_sebelumnya: "" });
    setSelectedPreviousVisit(null);
    
    // Fetch history for this hewan
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/kunjungan/hewan/${hewanId}/history`, {
        headers:
         {
          'Authorization': `Bearer ${token}`
        }
      });
      const history = await response.json();
      setHewanHistory(history);
    } catch (error) {
      console.error('Error fetching history:', error);
      setHewanHistory([]);
    }
  };

  const handlePreviousVisitChange = (visitId: string) => {
    setFormData({ ...formData, kunjungan_sebelumnya: visitId });
    
    if (visitId) {
      const visit = hewanHistory.find(v => v.kunjungan_id.toString() === visitId);
      setSelectedPreviousVisit(visit);
    } else {
      setSelectedPreviousVisit(null);
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
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingKunjungan(null);
    setHewanHistory([]);
    setSelectedPreviousVisit(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
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
                  <TableHead>Tanggal & Waktu</TableHead>
                  <TableHead>Hewan</TableHead>
                  <TableHead>Pemilik</TableHead>
                  <TableHead>Dokter</TableHead>
                  <TableHead>Catatan</TableHead>
                  <TableHead>Total Biaya</TableHead>
                  <TableHead>Metode Bayar</TableHead>
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
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {kunjungan.waktu_kunjungan}
                        </span>
                        {kunjungan.kunjungan_sebelumnya && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge 
                                  variant="outline" 
                                  className="w-fit text-xs gap-1 cursor-pointer hover:bg-accent"
                                  onClick={() => handleViewPreviousVisit(kunjungan.kunjungan_sebelumnya)}
                                >
                                  <Link2 className="h-3 w-3" />
                                  Kunjungan Sebelumnya
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Klik untuk melihat kunjungan sebelumnya:</p>
                                <p className="font-semibold">
                                  {kunjungan.tanggal_kunjungan_sebelumnya 
                                    ? new Date(kunjungan.tanggal_kunjungan_sebelumnya).toLocaleDateString("id-ID")
                                    : "-"}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {kunjungan.nama_hewan || "-"}
                      <span className="block text-xs text-muted-foreground">
                        {kunjungan.nama_jenis_hewan}
                      </span>
                    </TableCell>
                    <TableCell>
                      {kunjungan.nama_pawrent || "-"}
                      {kunjungan.telepon_pawrent && (
                        <span className="block text-xs text-muted-foreground">
                          {kunjungan.telepon_pawrent}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{kunjungan.nama_dokter || "-"}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={kunjungan.catatan}>
                        {kunjungan.catatan || "-"}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {kunjungan.total_biaya 
                        ? formatCurrency(parseInt(kunjungan.total_biaya))
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {getMetodeBadge(kunjungan.metode_pembayaran)}
                    </TableCell>
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
                <div>
                  <Label htmlFor="hewan_id">Hewan</Label>
                  <Select
                    value={formData.hewan_id}
                    onValueChange={handleHewanChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih hewan" />
                    </SelectTrigger>
                    <SelectContent>
                      {hewans?.map((hewan: any) => (
                        <SelectItem
                          key={hewan.hewan_id}
                          value={hewan.hewan_id.toString()}
                        >
                          {hewan.nama_hewan} ({hewan.nama_jenis_hewan}) - {hewan.nama_pawrent}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dokter_id">Dokter</Label>
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
                <div>
                  <Label htmlFor="tanggal_kunjungan">Tanggal Kunjungan</Label>
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
                  <Label htmlFor="waktu_kunjungan">Waktu Kunjungan</Label>
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
                
                {/* History Kunjungan Sebelumnya dengan Info Lengkap */}
                {hewanHistory.length > 0 && (
                  <div className="col-span-2">
                    <Label htmlFor="kunjungan_sebelumnya" className="flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Hubungkan dengan Kunjungan Sebelumnya (Opsional)
                    </Label>
                    <Select
                      value={formData.kunjungan_sebelumnya}
                      onValueChange={handlePreviousVisitChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kunjungan sebelumnya (jika ada)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">
                          <span className="text-muted-foreground">Tidak ada kunjungan sebelumnya</span>
                        </SelectItem>
                        {hewanHistory.map((visit: any) => (
                          <SelectItem
                            key={visit.kunjungan_id}
                            value={visit.kunjungan_id.toString()}
                          >
                            <div className="flex flex-col py-1">
                              <span className="font-medium">
                                {new Date(visit.tanggal_kunjungan).toLocaleDateString('id-ID', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {visit.waktu_kunjungan} • {visit.nama_dokter} • {formatCurrency(visit.total_biaya)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {/* Detail Info Kunjungan Sebelumnya yang Dipilih */}
                    {selectedPreviousVisit && (
                      <Alert className="mt-3 bg-blue-50 border-blue-200">
                        <Info className="h-4 w-4 text-blue-600" />
                        <AlertDescription>
                          <div className="space-y-2 text-sm">
                            <div className="font-semibold text-blue-900 flex items-center justify-between">
                              <span>Informasi Kunjungan Sebelumnya:</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={() => handleViewPreviousVisit(selectedPreviousVisit.kunjungan_id)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Lihat Detail
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-muted-foreground">Tanggal:</span>
                                <p className="font-medium">
                                  {new Date(selectedPreviousVisit.tanggal_kunjungan).toLocaleDateString('id-ID')}
                                  <span className="text-xs text-muted-foreground ml-2">
                                    ({calculateDaysSince(selectedPreviousVisit.tanggal_kunjungan)})
                                  </span>
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Waktu:</span>
                                <p className="font-medium">{selectedPreviousVisit.waktu_kunjungan}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Dokter:</span>
                                <p className="font-medium">{selectedPreviousVisit.nama_dokter}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Biaya:</span>
                                <p className="font-medium">{formatCurrency(selectedPreviousVisit.total_biaya)}</p>
                              </div>
                            </div>
                            {selectedPreviousVisit.catatan && (
                              <div>
                                <span className="text-muted-foreground">Catatan Sebelumnya:</span>
                                <p className="mt-1 p-2 bg-white rounded border border-blue-100 text-xs">
                                  {selectedPreviousVisit.catatan}
                                </p>
                              </div>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                <div className="col-span-2">
                  <Label htmlFor="catatan">Catatan / Keluhan</Label>
                  <textarea
                    id="catatan"
                    className="w-full min-h-[120px] px-3 py-2 border rounded-md"
                    placeholder="Masukkan keluhan hewan, gejala, atau catatan penting lainnya..."
                    value={formData.catatan}
                    onChange={(e) =>
                      setFormData({ ...formData, catatan: e.target.value })
                    }
                  />
                </div>
                
                <div>
                  <Label htmlFor="total_biaya">Total Biaya (Rp)</Label>
                  <div className="relative">
                    <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="total_biaya"
                      type="number"
                      className="pl-10"
                      placeholder="0"
                      value={formData.total_biaya}
                      onChange={(e) =>
                        setFormData({ ...formData, total_biaya: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="metode_pembayaran">Metode Pembayaran</Label>
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
                      <SelectItem value="E-Wallet">📱 E-Wallet (GoPay, OVO, dll)</SelectItem>
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
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Tanggal Kunjungan</Label>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(viewingKunjungan.tanggal_kunjungan).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Waktu</Label>
                    <p className="font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {viewingKunjungan.waktu_kunjungan}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Hewan</Label>
                    <p className="font-medium">
                      {viewingKunjungan.nama_hewan}
                      <span className="text-sm text-muted-foreground ml-2">
                        ({viewingKunjungan.nama_jenis_hewan})
                      </span>
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Pemilik</Label>
                    <p className="font-medium">{viewingKunjungan.nama_pawrent}</p>
                    {viewingKunjungan.telepon_pawrent && (
                      <p className="text-sm text-muted-foreground">{viewingKunjungan.telepon_pawrent}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Dokter</Label>
                    <p className="font-medium">{viewingKunjungan.nama_dokter}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Metode Pembayaran</Label>
                    <div>{getMetodeBadge(viewingKunjungan.metode_pembayaran)}</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Total Biaya</Label>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(parseInt(viewingKunjungan.total_biaya))}
                  </p>
                </div>

                {viewingKunjungan.catatan && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Catatan / Keluhan</Label>
                    <div className="p-4 bg-muted rounded-md">
                      <p className="whitespace-pre-wrap">{viewingKunjungan.catatan}</p>
                    </div>
                  </div>
                )}

                {viewingKunjungan.kunjungan_sebelumnya && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="flex items-center justify-between">
                      <span className="text-sm">
                        Kunjungan ini terhubung dengan kunjungan tanggal{' '}
                        <strong>
                          {viewingKunjungan.tanggal_kunjungan_sebelumnya 
                            ? new Date(viewingKunjungan.tanggal_kunjungan_sebelumnya).toLocaleDateString("id-ID")
                            : "-"}
                        </strong>
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsDetailDialogOpen(false);
                          handleViewPreviousVisit(viewingKunjungan.kunjungan_sebelumnya);
                        }}
                      >
                        <ArrowRight className="h-4 w-4 mr-1" />
                        Lihat
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDetailDialogOpen(false)}
              >
                Tutup
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setIsDetailDialogOpen(false);
                  handleOpenDialog(viewingKunjungan);
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit Kunjungan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default KunjunganPage;