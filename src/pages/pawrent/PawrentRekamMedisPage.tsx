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
import { kunjunganApi, hewanApi, kunjunganObatApi } from "@/lib/api";
import { FileText, Search, X, Eye, Calendar, Pill, PawPrint, AlertCircle } from "lucide-react";

const PawrentRekamMedisPage = () => {
  const { token, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterHewan, setFilterHewan] = useState<string>("all");
  const [selectedKunjungan, setSelectedKunjungan] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [obatDetails, setObatDetails] = useState<any[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [kunjunganDenganObat, setKunjunganDenganObat] = useState(0);
  const [totalJenisObat, setTotalJenisObat] = useState(0);

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

  // Add totalKunjungan definition
  const totalKunjungan = myKunjungans.length;

  const getMonthFromDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  // Add uniqueMonths for filter
  const uniqueMonths = Array.from(new Set(
    myKunjungans
      .map((k: any) => getMonthFromDate(k.tanggal_kunjungan))
      .filter(Boolean)
  )).sort().reverse();

  const handleViewDetail = async (kunjungan: any) => {
    setSelectedKunjungan(kunjungan);
    setIsLoadingDetails(true);
    setIsDetailDialogOpen(true);

    try {
      const obats = await kunjunganObatApi.getByKunjungan(kunjungan.kunjungan_id, token!);
      setObatDetails(obats || []);
    } catch (error) {
      console.error('Error fetching obat details:', error);
      setObatDetails([]);
    } finally {
      setIsLoadingDetails(false);
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
    return timeString.substring(0, 5);
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

  // Add useEffect to calculate statistics based on obat data
  useEffect(() => {
    if (myKunjungans.length > 0 && token) {
      const fetchObatStatistics = async () => {
        try {
          // Fetch obat for all kunjungans
          const promises = myKunjungans.map(k => 
            kunjunganObatApi.getByKunjungan(k.kunjungan_id, token!)
          );
          const results = await Promise.all(promises);
          
          // Count kunjungans with obat
          const kunjungansWithObat = results.filter(obats => obats && obats.length > 0).length;
          setKunjunganDenganObat(kunjungansWithObat);
          
          // Count unique obat types
          const allObats = results.flat();
          const uniqueObatIds = new Set(allObats.map(o => o.obat_id));
          setTotalJenisObat(uniqueObatIds.size);
        } catch (error) {
          console.error('Error fetching obat statistics:', error);
          setKunjunganDenganObat(0);
          setTotalJenisObat(0);
        }
      };
      
      fetchObatStatistics();
    } else {
      setKunjunganDenganObat(0);
      setTotalJenisObat(0);
    }
  }, [myKunjungans, token]);

  if (isLoadingKunjungan) {
    return (
      <DashboardLayout title="Rekam Medis">
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
    <DashboardLayout title="Rekam Medis" showBackButton={true} backTo="/pawrent/dashboard">
      <div className="space-y-6">
        {/* Info Card */}
        <Card className="bg-gradient-to-r from-accent/10 to-accent/5 border-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" />
              Rekam Medis & Resep Obat
            </CardTitle>
            <CardDescription>
              Detail resep obat dari setiap kunjungan medis hewan kesayangan Anda
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rekam Medis</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalKunjungan}</div>
              <p className="text-xs text-muted-foreground">
                Catatan medis terdaftar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kunjungan dengan Obat</CardTitle>
              <Pill className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">{kunjunganDenganObat}</div>
              <p className="text-xs text-muted-foreground">
                Kunjungan dengan resep obat
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jenis Obat</CardTitle>
              <Pill className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{totalJenisObat}</div>
              <p className="text-xs text-muted-foreground">
                Jenis obat berbeda
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
                  <FileText className="h-5 w-5" />
                  Daftar Rekam Medis ({sortedKunjungans.length})
                </CardTitle>
                <CardDescription>Klik untuk melihat detail resep obat</CardDescription>
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
                    placeholder="Cari hewan, dokter..."
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
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Hewan</TableHead>
                      <TableHead>Dokter</TableHead>
                      <TableHead>Catatan Medis</TableHead>
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
                              <p className="text-xs text-muted-foreground">
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
                          <div>
                            <p className="font-medium">{kunjungan.nama_dokter}</p>
                            {kunjungan.nama_spesialisasi && (
                              <p className="text-xs text-muted-foreground">{kunjungan.nama_spesialisasi}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm max-w-[300px] truncate" title={kunjungan.catatan}>
                            {kunjungan.catatan || (
                              <span className="text-muted-foreground italic">Tidak ada catatan</span>
                            )}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(kunjungan)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Lihat Resep
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">
                  {searchQuery || filterMonth !== "all" || filterHewan !== "all"
                    ? "Tidak ada hasil yang sesuai"
                    : "Belum ada rekam medis"}
                </p>
                {(searchQuery || filterMonth !== "all" || filterHewan !== "all") && (
                  <p className="text-sm mt-2">Coba ubah filter pencarian</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog - Resep Obat */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Resep Obat Kunjungan #{selectedKunjungan?.kunjungan_id}
              </DialogTitle>
              <DialogDescription>
                Detail resep obat untuk {selectedKunjungan?.nama_hewan}
              </DialogDescription>
            </DialogHeader>
            
            {selectedKunjungan && (
              <div className="space-y-6">
                {/* Info Kunjungan */}
                <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                  <div>
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Tanggal Kunjungan
                    </Label>
                    <p className="font-semibold mt-1">
                      {formatDate(selectedKunjungan.tanggal_kunjungan)} - {formatTime(selectedKunjungan.waktu_kunjungan)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <PawPrint className="h-4 w-4" />
                      Hewan
                    </Label>
                    <p className="font-semibold mt-1">{selectedKunjungan.nama_hewan}</p>
                    <p className="text-sm text-muted-foreground">{selectedKunjungan.nama_jenis_hewan}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Dokter</Label>
                    <p className="font-semibold mt-1">{selectedKunjungan.nama_dokter}</p>
                    {selectedKunjungan.nama_spesialisasi && (
                      <p className="text-sm text-muted-foreground">{selectedKunjungan.nama_spesialisasi}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">ID Kunjungan</Label>
                    <p className="font-mono text-sm mt-1">#{selectedKunjungan.kunjungan_id}</p>
                  </div>
                </div>

                {/* Catatan Medis */}
                {selectedKunjungan.catatan && (
                  <div className="pb-4 border-b">
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Catatan Medis
                    </Label>
                    <div className="mt-2 p-4 bg-muted rounded-md">
                      <p className="text-sm whitespace-pre-wrap">{selectedKunjungan.catatan}</p>
                    </div>
                  </div>
                )}

                {/* Daftar Obat */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-lg font-semibold flex items-center gap-2">
                      <Pill className="h-5 w-5 text-primary" />
                      Resep Obat ({obatDetails.length})
                    </Label>
                    {obatDetails.length > 0 && (
                      <Badge variant="secondary">
                        Total: {formatCurrency(obatDetails.reduce((sum, o) => sum + ((o.harga_saat_itu || 0) * (o.qty || 0)), 0))}
                      </Badge>
                    )}
                  </div>

                  {isLoadingDetails ? (
                    <div className="text-center py-4">
                      <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                      <p className="mt-2 text-sm text-muted-foreground">Memuat resep obat...</p>
                    </div>
                  ) : obatDetails.length > 0 ? (
                    <div className="space-y-4">
                      {obatDetails.map((obat: any, index: number) => (
                        <Card key={index} className="overflow-hidden">
                          <div className="bg-primary/5 px-4 py-2 border-b">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Pill className="h-4 w-4 text-primary" />
                                <span className="font-semibold">{obat.nama_obat}</span>
                              </div>
                              <Badge variant="outline">#{obat.obat_id}</Badge>
                            </div>
                          </div>
                          <CardContent className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <Label className="text-xs text-muted-foreground">Dosis</Label>
                                <p className="font-medium mt-1">{obat.dosis || "-"}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Frekuensi</Label>
                                <p className="font-medium mt-1">{obat.frekuensi || "-"}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Qty & Harga</Label>
                                <p className="font-medium mt-1">Qty: {obat.qty}</p>
                                <p className="font-semibold text-green-600 mt-1">
                                  {formatCurrency(obat.harga_saat_itu || 0)} x {obat.qty} = {formatCurrency((obat.harga_saat_itu || 0) * (obat.qty || 0))}
                                </p>
                              </div>
                            </div>
                            {obat.kegunaan && (
                              <div className="mt-3 pt-3 border-t">
                                <Label className="text-xs text-muted-foreground">Kegunaan</Label>
                                <p className="text-sm mt-1 text-muted-foreground">{obat.kegunaan}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}

                      {/* Total Summary Obat */}
                      <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-md border border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Total Biaya Obat</span>
                          <span className="text-xl font-bold text-green-600">
                            {formatCurrency(
                              obatDetails.reduce((sum, obat) => sum + ((obat.harga_saat_itu || 0) * (obat.qty || 0)), 0)
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Tidak Ada Resep Obat</p>
                      <p className="text-sm mt-2">
                        Tidak ada obat yang diresepkan untuk kunjungan ini
                      </p>
                    </div>
                  )}
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-md border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>ℹ️ Informasi Penting:</strong>
                  </p>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1 list-disc list-inside">
                    <li>Ikuti dosis dan frekuensi pemberian obat sesuai resep dokter</li>
                    <li>Jangan menghentikan pengobatan tanpa konsultasi dengan dokter</li>
                    <li>Simpan obat di tempat yang kering dan sejuk</li>
                    <li>Hubungi dokter jika ada efek samping atau reaksi alergi</li>
                  </ul>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default PawrentRekamMedisPage;