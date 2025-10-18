import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { layananApi } from "@/lib/api";
import { useState } from "react";
import { Stethoscope, Search, X, Activity, Eye } from "lucide-react";

const LayananPage = () => {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLayanan, setSelectedLayanan] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const { data: layanans, isLoading } = useQuery({
    queryKey: ["layanans"],
    queryFn: () => layananApi.getAll(token!),
  });

  const handleViewDetail = (layanan: any) => {
    setSelectedLayanan(layanan);
    setIsDetailDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredLayanans = layanans?.filter((l: any) => 
    l.nama_layanan?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.kode_layanan?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.deskripsi_layanan?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <DashboardLayout title="Data Layanan">
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
    <DashboardLayout title="Data Layanan" showBackButton={true} backTo="/vet/dashboard">
      <div className="space-y-6">
        {/* Info Card */}
        <Card className="bg-gradient-to-r from-indigo-500/10 to-indigo-500/5 border-indigo-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-indigo-500" />
              Data Layanan & Prosedur Medis
            </CardTitle>
            <CardDescription>
              Daftar layanan medis yang tersedia untuk referensi (Read-Only)
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Katalog Layanan ({filteredLayanans?.length || 0})
                </CardTitle>
                <CardDescription>Lihat informasi layanan, prosedur, dan biaya</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari kode atau nama layanan..."
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
            {filteredLayanans && filteredLayanans.length > 0 ? (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Kode</TableHead>
                      <TableHead>Nama Layanan</TableHead>
                      <TableHead className="hidden md:table-cell">Deskripsi</TableHead>
                      <TableHead className="text-right">Biaya</TableHead>
                      <TableHead className="text-center w-[100px]">Total Penggunaan</TableHead>
                      <TableHead className="text-center w-[100px]">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLayanans.map((layanan: any, index: number) => (
                      <TableRow key={layanan.kode_layanan || index}>
                        <TableCell className="font-mono font-medium text-primary">
                          {layanan.kode_layanan}
                        </TableCell>
                        <TableCell className="font-medium">
                          {layanan.nama_layanan}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {layanan.deskripsi_layanan || '-'}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(layanan.biaya_layanan || 0)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">
                            {layanan.total_penggunaan || 0}x
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleViewDetail(layanan)}
                            title="Lihat detail"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">
                  {searchQuery ? "Tidak ada hasil pencarian" : "Belum ada data layanan"}
                </p>
                {searchQuery && (
                  <p className="text-sm mt-2">Coba kata kunci lain</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Detail Layanan
              </DialogTitle>
              <DialogDescription>
                Informasi lengkap tentang layanan medis
              </DialogDescription>
            </DialogHeader>
            
            {selectedLayanan && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Kode Layanan</Label>
                    <div className="mt-2">
                      <Badge variant="outline" className="font-mono text-base px-3 py-1">
                        {selectedLayanan.kode_layanan}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-muted-foreground">Total Penggunaan</Label>
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-base px-3 py-1">
                        {selectedLayanan.total_penggunaan || 0} kunjungan
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Nama Layanan</Label>
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <p className="font-semibold text-lg">{selectedLayanan.nama_layanan}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Biaya Layanan</Label>
                  <div className="mt-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-800">
                    <p className="font-bold text-2xl text-green-700 dark:text-green-400">
                      {formatCurrency(selectedLayanan.biaya_layanan || 0)}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <Label className="text-muted-foreground">Deskripsi Layanan</Label>
                  <div className="mt-2 p-4 bg-muted rounded-md">
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedLayanan.deskripsi_layanan || 'Tidak ada deskripsi tersedia'}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-md border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200 flex items-start gap-2">
                    <Activity className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Catatan:</strong> Informasi ini hanya untuk referensi. 
                      Untuk update data layanan, hubungi administrator sistem.
                    </span>
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default LayananPage;