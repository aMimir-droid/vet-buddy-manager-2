import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { obatApi, stokObatApi, klinikApi } from "@/lib/api";
import { Pill, Search, Eye, Package, X } from "lucide-react";

const ObatPage = () => {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedObat, setSelectedObat] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isStokDetailDialogOpen, setIsStokDetailDialogOpen] = useState(false);
  const [selectedObatForStok, setSelectedObatForStok] = useState<any>(null);

  const { data: obats, isLoading: isLoadingObats } = useQuery({
    queryKey: ["obats"],
    queryFn: () => obatApi.getAll(token!),
  });

  const { data: stokObats, isLoading: isLoadingStok } = useQuery({
    queryKey: ["stok-obats"],
    queryFn: () => stokObatApi.getAll(token!),
  });

  const { data: kliniks, isLoading: isLoadingKliniks } = useQuery({
    queryKey: ["kliniks"],
    queryFn: () => klinikApi.getAll(token!),
  });

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

  const handleViewDetail = (obat: any) => {
    setSelectedObat(obat);
    setIsDetailDialogOpen(true);
  };

  const handleOpenStokDetail = (obat: any) => {
    setSelectedObatForStok(obat);
    setIsStokDetailDialogOpen(true);
  };

  const handleCloseStokDetail = () => {
    setIsStokDetailDialogOpen(false);
    setSelectedObatForStok(null);
  };

  const formatCurrency = (amount: number | string) => {
    const num = Number(amount) || 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const filteredObats = obatsWithStok?.filter((o: any) => 
    (o.nama_obat || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.kegunaan || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoadingObats || isLoadingStok) {
    return (
      <DashboardLayout title="Data Obat">
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
    <DashboardLayout title="Data Obat" showBackButton={true} backTo="/vet/dashboard">
      <div className="space-y-6">
        {/* Info Card */}
        <Card className="bg-gradient-to-r from-secondary/10 to-secondary/5 border-secondary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-secondary" />
              Data Obat & Farmasi
            </CardTitle>
            <CardDescription>
              Daftar obat yang tersedia untuk referensi resep medis (Read-Only)
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Katalog Obat ({filteredObats?.length || 0})
                </CardTitle>
                <CardDescription>Lihat informasi obat, kegunaan, harga, dan stok</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama obat atau kegunaan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchQuery && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Table */}
            {filteredObats && filteredObats.length > 0 ? (
              <div className="rounded-md border overflow-x-auto">
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
                    {filteredObats.map((obat: any, index: number) => (
                      <TableRow key={obat.obat_id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell className="font-semibold">{obat.nama_obat}</TableCell>
                        <TableCell>
                          <div className="max-w-[300px]">
                            {obat.kegunaan ? (
                              <p className="text-sm truncate" title={obat.kegunaan}>
                                {obat.kegunaan}
                              </p>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-green-600">
                          {formatCurrency(obat.harga_obat)}
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(obat)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
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
                <Pill className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">
                  {searchQuery ? "Tidak ada hasil pencarian" : "Belum ada data obat"}
                </p>
                {searchQuery && (
                  <p className="text-sm mt-2">Coba kata kunci lain</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog untuk Detail Obat */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Detail Obat
              </DialogTitle>
              <DialogDescription>
                Informasi lengkap tentang obat
              </DialogDescription>
            </DialogHeader>
            
            {selectedObat && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-muted-foreground">Nama Obat</Label>
                    <p className="font-semibold text-lg mt-1">{selectedObat.nama_obat}</p>
                  </div>
                  
                  <div>
                    <Label className="text-muted-foreground">Harga Satuan</Label>
                    <p className="font-bold text-xl text-green-600 mt-1">
                      {formatCurrency(selectedObat.harga_obat)}
                    </p>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">ID Obat</Label>
                    <p className="font-mono text-sm mt-1">#{selectedObat.obat_id}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <Label className="text-muted-foreground">Kegunaan / Indikasi</Label>
                  <div className="mt-2 p-4 bg-muted rounded-md">
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedObat.kegunaan || 'Tidak ada informasi kegunaan'}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-md border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>ℹ️ Catatan:</strong> Pastikan memberikan dosis sesuai berat badan hewan dan kondisi medis. 
                    Konsultasikan dengan apoteker atau supervisor jika ada keraguan.
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog untuk Detail Stok */}
        <Dialog open={isStokDetailDialogOpen} onOpenChange={setIsStokDetailDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Detail Stok: {selectedObatForStok?.nama_obat}
              </DialogTitle>
              <DialogDescription>
                Stok obat di berbagai klinik
              </DialogDescription>
            </DialogHeader>
            {selectedObatForStok && (
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
                      const stok = stokObats?.find((s: any) => s.obat_id === selectedObatForStok.obat_id && s.klinik_id === klinik.klinik_id);
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
      </div>
    </DashboardLayout>
  );
};

export default ObatPage;