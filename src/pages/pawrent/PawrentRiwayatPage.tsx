import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { kunjunganApi, hewanApi, layananApi, kunjunganObatApi } from "@/lib/api";
import { Calendar, Search, X, Eye, Clock, Stethoscope, FileText, AlertCircle, PawPrint, CreditCard, Activity, Pill } from "lucide-react";

const PawrentRiwayatPage = () => {
  const { token, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterHewan, setFilterHewan] = useState<string>("all");
  const [selectedKunjungan, setSelectedKunjungan] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [layananKunjungan, setLayananKunjungan] = useState<any[]>([]);
  const [obatKunjungan, setObatKunjungan] = useState<any[]>([]);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Get all kunjungans
  const { data: kunjungans, isLoading: isLoadingKunjungan } = useQuery({
    queryKey: ["kunjungans"],
    queryFn: () => kunjunganApi.getAll(token!),
  });

  // Get all hewans
  const { data: hewans } = useQuery({
    queryKey: ["hewans"],
    queryFn: () => hewanApi.getAll(token!),
  });

  // Filter hewans by current pawrent
  const myHewans = hewans?.filter((h: any) => h.pawrent_id === user?.pawrent_id) || [];
  const myHewanIds = myHewans.map((h: any) => h.hewan_id);

  // Filter kunjungans by pawrent's hewans
  const myKunjungans = kunjungans?.filter((k: any) => myHewanIds.includes(k.hewan_id)) || [];

  const handleViewDetail = async (kunjungan: any) => {
    setSelectedKunjungan(kunjungan);
    setIsDetailDialogOpen(true);
    setIsLoadingDetail(true);
    try {
      // Fetch layanan dan obat untuk kunjungan ini
      const [layananRes, obatRes] = await Promise.all([
        layananApi.getByKunjungan(kunjungan.kunjungan_id, token!),
        kunjunganObatApi.getByKunjungan(kunjungan.kunjungan_id, token!)
      ]);
      setLayananKunjungan(layananRes || []);
      setObatKunjungan(obatRes || []);
    } catch (error) {
      console.error('Error fetching layanan/obat:', error);
      setLayananKunjungan([]);
      setObatKunjungan([]);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return "-";
    return timeString.substring(0, 5); // HH:MM
  };

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount) || numAmount === null || numAmount === undefined) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(numAmount);
  };

  const getMetodePembayaranBadge = (metode: string) => {
    const badges: Record<string, { variant: any; label: string }> = {
      'Cash': { variant: 'default', label: '💵 Cash' },
      'Transfer': { variant: 'secondary', label: '🏦 Transfer' },
      'E-Wallet': { variant: 'outline', label: '📱 E-Wallet' }
    };
    const badge = badges[metode] || badges['Cash'];
    return <Badge variant={badge.variant}>{badge.label}</Badge>;
  };

  const getMonthFromDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  };

  // Filter logic
  const filteredKunjungans = myKunjungans.filter((k: any) => {
    const matchSearch = 
      k.nama_hewan?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.nama_dokter?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.catatan?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchMonth = filterMonth === "all" || getMonthFromDate(k.tanggal_kunjungan) === filterMonth;
    const matchHewan = filterHewan === "all" || k.hewan_id.toString() === filterHewan;

    return matchSearch && matchMonth && matchHewan;
  });

  // Sort by date descending
  const sortedKunjungans = [...filteredKunjungans].sort((a, b) => {
    const dateA = new Date(a.tanggal_kunjungan + ' ' + a.waktu_kunjungan);
    const dateB = new Date(b.tanggal_kunjungan + ' ' + b.waktu_kunjungan);
    return dateB.getTime() - dateA.getTime();
  });

  // Calculate statistics - Perbaiki perhitungan total biaya berdasarkan layanan + obat
  const totalKunjungan = myKunjungans.length;
  const bulanIni = myKunjungans.filter((k: any) => {
    const today = new Date();
    const kunjunganDate = new Date(k.tanggal_kunjungan);
    return kunjunganDate.getMonth() === today.getMonth() && 
           kunjunganDate.getFullYear() === today.getFullYear();
  }).length;

  // Hitung total biaya dari layanan dan obat per kunjungan
  const totalBiaya = myKunjungans.reduce((sum: number, k: any) => {
    // Jika total_biaya sudah ada di data, gunakan itu
    if (k.total_biaya) {
      const biaya = typeof k.total_biaya === 'string' ? parseFloat(k.total_biaya) : k.total_biaya;
      return sum + (isNaN(biaya) ? 0 : biaya);
    }
    // Jika tidak, hitung manual (meskipun seharusnya sudah ada)
    return sum;
  }, 0);

  // Get unique months for filter
  const uniqueMonths = Array.from(new Set(
    myKunjungans
      .map((k: any) => getMonthFromDate(k.tanggal_kunjungan))
      .filter(Boolean)
  )).sort().reverse();

  if (isLoadingKunjungan) {
    return (
      <DashboardLayout title="Riwayat Kunjungan">
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
    <DashboardLayout title="Riwayat Kunjungan" showBackButton={true} backTo="/pawrent/dashboard">
      <div className="space-y-6">
        {/* Info Card */}
        <Card className="bg-gradient-to-r from-secondary/10 to-secondary/5 border-secondary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-secondary" />
              Riwayat Kunjungan Hewan
            </CardTitle>
            <CardDescription>
              Lihat riwayat kunjungan dan perawatan hewan kesayangan Anda
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Kunjungan</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalKunjungan}</div>
              <p className="text-xs text-muted-foreground">
                Semua kunjungan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bulan Ini</CardTitle>
              <Clock className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">{bulanIni}</div>
              <p className="text-xs text-muted-foreground">
                Kunjungan bulan ini
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Biaya</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalBiaya)}
              </div>
              <p className="text-xs text-muted-foreground">
                Semua kunjungan
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Daftar Kunjungan ({sortedKunjungans.length})
                </CardTitle>
                <CardDescription>Riwayat kunjungan dan perawatan hewan</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="md:col-span-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari hewan, dokter, catatan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filter Hewan */}
              <div>
                <Select value={filterHewan} onValueChange={setFilterHewan}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Hewan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Hewan</SelectItem>
                    {myHewans.map((hewan: any) => (
                      <SelectItem key={hewan.hewan_id} value={hewan.hewan_id.toString()}>
                        {hewan.nama_hewan}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filter Month */}
              <div>
                <Select value={filterMonth} onValueChange={setFilterMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Bulan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Bulan</SelectItem>
                    {uniqueMonths.map((month) => (
                      <SelectItem key={month} value={month}>
                        {new Date(month + '-01').toLocaleDateString('id-ID', { 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Clear Filters */}
            {(searchQuery || filterMonth !== "all" || filterHewan !== "all") && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Filter aktif</Badge>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterMonth("all");
                    setFilterHewan("all");
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Hapus Filter
                </Button>
              </div>
            )}

            {/* Table */}
            {sortedKunjungans.length > 0 ? (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">No</TableHead>
                      <TableHead>Tanggal & Waktu</TableHead>
                      <TableHead>Hewan</TableHead>
                      <TableHead>Dokter</TableHead>
                      <TableHead>Catatan</TableHead>
                      <TableHead>Pembayaran</TableHead>
                      <TableHead className="text-right">Total Biaya</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedKunjungans.map((kunjungan: any, index: number) => (
                      <TableRow key={kunjungan.kunjungan_id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-start gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="font-medium">{formatDate(kunjungan.tanggal_kunjungan)}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(kunjungan.waktu_kunjungan)}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <PawPrint className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{kunjungan.nama_hewan}</p>
                              <p className="text-xs text-muted-foreground">{kunjungan.nama_jenis_hewan}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Stethoscope className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{kunjungan.nama_dokter}</p>
                              {kunjungan.nama_spesialisasi && (
                                <p className="text-xs text-muted-foreground">{kunjungan.nama_spesialisasi}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm max-w-[200px] truncate" title={kunjungan.catatan}>
                            {kunjungan.catatan || (
                              <span className="text-muted-foreground italic">Tidak ada catatan</span>
                            )}
                          </p>
                        </TableCell>
                        <TableCell>
                          {getMetodePembayaranBadge(kunjungan.metode_pembayaran)}
                        </TableCell>
                        <TableCell className="text-right">
                          <p className="font-semibold text-green-600">
                            {formatCurrency(kunjungan.total_biaya)}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(kunjungan)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Detail
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">
                  {searchQuery || filterMonth !== "all" || filterHewan !== "all"
                    ? "Tidak ada hasil yang sesuai"
                    : "Belum ada riwayat kunjungan"}
                </p>
                {(searchQuery || filterMonth !== "all" || filterHewan !== "all") && (
                  <p className="text-sm mt-2">Coba ubah filter pencarian</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Detail Kunjungan #{selectedKunjungan?.kunjungan_id}
              </DialogTitle>
              <DialogDescription>
                Informasi lengkap tentang kunjungan, layanan, dan resep obat
              </DialogDescription>
            </DialogHeader>
            
            {selectedKunjungan && (
              <div className="space-y-6">
                {/* Waktu Kunjungan */}
                <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                  <div>
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Tanggal Kunjungan
                    </Label>
                    <p className="font-semibold mt-1">{formatDate(selectedKunjungan.tanggal_kunjungan)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Waktu Kunjungan
                    </Label>
                    <p className="font-semibold mt-1">{formatTime(selectedKunjungan.waktu_kunjungan)}</p>
                  </div>
                </div>

                {/* Hewan & Dokter */}
                <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                  <div>
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <PawPrint className="h-4 w-4" />
                      Hewan
                    </Label>
                    <p className="font-semibold mt-1">{selectedKunjungan.nama_hewan}</p>
                    <p className="text-sm text-muted-foreground">{selectedKunjungan.nama_jenis_hewan}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />
                      Dokter
                    </Label>
                    <p className="font-semibold mt-1">{selectedKunjungan.nama_dokter}</p>
                    {selectedKunjungan.nama_spesialisasi && (
                      <p className="text-sm text-muted-foreground">{selectedKunjungan.nama_spesialisasi}</p>
                    )}
                  </div>
                </div>

                {/* Catatan */}
                <div className="space-y-4 pb-4 border-b">
                  <div>
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Catatan Kunjungan
                    </Label>
                    <p className="mt-1 p-3 bg-muted rounded-md whitespace-pre-wrap">
                      {selectedKunjungan.catatan || (
                        <span className="text-muted-foreground italic">Tidak ada catatan</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Layanan */}
                <div className="pb-4 border-b">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-lg font-semibold flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      Layanan ({layananKunjungan.length})
                    </Label>
                    {layananKunjungan.length > 0 && (
                      <Badge variant="secondary">
                        Total: {formatCurrency(layananKunjungan.reduce((sum, l) => sum + ((l.harga_saat_itu || 0) * (l.qty || 1)), 0))}
                      </Badge>
                    )}
                  </div>
                  {isLoadingDetail ? (
                    <div className="text-center py-4">
                      <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                      <p className="mt-2 text-sm text-muted-foreground">Memuat layanan...</p>
                    </div>
                  ) : layananKunjungan.length > 0 ? (
                    <div className="space-y-2">
                      {layananKunjungan.map((layanan: any) => (
                        <Card key={layanan.kunjungan_layanan_id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{layanan.nama_layanan}</p>
                              <p className="text-sm text-muted-foreground">
                                Qty: {layanan.qty || 1} - Harga: {formatCurrency(layanan.harga_saat_itu || 0)}
                              </p>
                              {layanan.deskripsi_layanan && (
                                <p className="text-xs text-muted-foreground mt-1">{layanan.deskripsi_layanan}</p>
                              )}
                            </div>
                            <p className="font-semibold text-green-600">
                              {formatCurrency((layanan.harga_saat_itu || 0) * (layanan.qty || 1))}
                            </p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Tidak ada layanan tercatat</p>
                    </div>
                  )}
                </div>

                {/* Obat */}
                <div className="pb-4 border-b">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-lg font-semibold flex items-center gap-2">
                      <Pill className="h-5 w-5 text-green-600" />
                      Resep Obat ({obatKunjungan.length})
                    </Label>
                    {obatKunjungan.length > 0 && (
                      <Badge variant="secondary">
                        Total: {formatCurrency(obatKunjungan.reduce((sum, o) => sum + ((o.harga_saat_itu || 0) * (o.qty || 0)), 0))}
                      </Badge>
                    )}
                  </div>
                  {isLoadingDetail ? (
                    <div className="text-center py-4">
                      <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                      <p className="mt-2 text-sm text-muted-foreground">Memuat obat...</p>
                    </div>
                  ) : obatKunjungan.length > 0 ? (
                    <div className="space-y-2">
                      {obatKunjungan.map((obat: any) => (
                        <Card key={obat.kunjungan_obat_id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{obat.nama_obat}</p>
                              <p className="text-sm text-muted-foreground">
                                Qty: {obat.qty} - Dosis: {obat.dosis || "-"} - Frekuensi: {obat.frekuensi || "-"} - Harga: {formatCurrency(obat.harga_saat_itu || 0)}
                              </p>
                              {obat.kegunaan && (
                                <p className="text-xs text-muted-foreground mt-1">{obat.kegunaan}</p>
                              )}
                            </div>
                            <p className="font-semibold text-green-600">
                              {formatCurrency((obat.harga_saat_itu || 0) * (obat.qty || 0))}
                            </p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Pill className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Tidak ada resep obat</p>
                    </div>
                  )}
                </div>

                {/* Pembayaran */}
                <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                  <div>
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Metode Pembayaran
                    </Label>
                    <div className="mt-1">
                      {getMetodePembayaranBadge(selectedKunjungan.metode_pembayaran)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Total Biaya</Label>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      {formatCurrency(selectedKunjungan.total_biaya)}
                    </p>
                  </div>
                </div>

                {/* Kunjungan Sebelumnya */}
                {selectedKunjungan.kunjungan_sebelumnya && (
                  <div className="pb-4 border-b">
                    <Label className="text-muted-foreground">Kunjungan Sebelumnya</Label>
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
                      <p className="text-sm">
                        <strong>ID Kunjungan:</strong> #{selectedKunjungan.kunjungan_sebelumnya}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default PawrentRiwayatPage;