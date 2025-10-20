import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { Pill, Search, Eye, X } from "lucide-react";

const fetchObats = async (token: string) => {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/obat/public/list`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Gagal mengambil data obat");
  return res.json();
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const PawrentObatListPage = () => {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedObat, setSelectedObat] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const { data: obats, isLoading } = useQuery({
    queryKey: ["obat-list-pawrent"],
    queryFn: () => fetchObats(token!),
    enabled: !!token
  });

  const handleViewDetail = (obat: any) => {
    setSelectedObat(obat);
    setIsDetailDialogOpen(true);
  };

  // Filter berdasarkan nama obat
  const filteredObats = obats?.filter((o: any) =>
    o.nama_obat.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout title="Daftar Obat" showBackButton={true} backTo="/pawrent/dashboard">
      <div className="space-y-6">
        {/* Info Card */}
        <Card className="bg-gradient-to-r from-pink-100 to-pink-50 border-pink-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-pink-500" />
              Data Obat Klinik
            </CardTitle>
            <CardDescription>
              Informasi lengkap semua obat yang tersedia di klinik (Read-Only)
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
                  Daftar Obat ({filteredObats?.length || 0})
                </CardTitle>
                <CardDescription>Lihat detail informasi obat</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama obat..."
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
                      <TableHead>Harga</TableHead>
                      <TableHead>Total Penggunaan</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredObats.map((obat: any, index: number) => (
                      <TableRow key={obat.obat_id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell className="font-semibold">{obat.nama_obat}</TableCell>
                        <TableCell>{obat.kegunaan}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{formatCurrency(obat.harga_obat)}</Badge>
                        </TableCell>
                        <TableCell>
                          {obat.total_penggunaan || 0} kali
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

        {/* Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Detail Obat
              </DialogTitle>
              <DialogDescription>
                Informasi lengkap data obat
              </DialogDescription>
            </DialogHeader>
            
            {selectedObat && (
              <div className="space-y-4">
                <div>
                  <span className="text-muted-foreground">Nama Obat</span>
                  <p className="font-semibold text-lg">{selectedObat.nama_obat}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Kegunaan</span>
                  <p className="font-medium">{selectedObat.kegunaan}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Harga</span>
                  <p className="font-medium">{formatCurrency(selectedObat.harga_obat)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Penggunaan</span>
                  <p className="font-medium">{selectedObat.total_penggunaan || 0} kali</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default PawrentObatListPage;