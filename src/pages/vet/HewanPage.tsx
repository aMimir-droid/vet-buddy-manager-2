import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { hewanApi } from "@/lib/api";
import { PawPrint, Search, Eye, X, HeartPulse, Skull } from "lucide-react";

const HewanPage = () => {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHewan, setSelectedHewan] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const { data: hewans, isLoading } = useQuery({
    queryKey: ["hewans"],
    queryFn: () => hewanApi.getAll(token!),
  });

  const handleViewDetail = (hewan: any) => {
    setSelectedHewan(hewan);
    setIsDetailDialogOpen(true);
  };

  const getJenisKelaminBadge = (jk: string) => {
    return jk === "Jantan" ? (
      <Badge variant="default" className="gap-1">♂ Jantan</Badge>
    ) : (
      <Badge variant="secondary" className="gap-1">♀ Betina</Badge>
    );
  };

  const getStatusHidupBadge = (status: string) => {
    return status === "Hidup" ? (
      <Badge variant="default" className="gap-1">
        <HeartPulse className="h-3 w-3" /> Hidup
      </Badge>
    ) : (
      <Badge variant="destructive" className="gap-1">
        <Skull className="h-3 w-3" /> Mati
      </Badge>
    );
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return "-";
    const today = new Date();
    const birth = new Date(birthDate);
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    if (years > 0) {
      return `${years} tahun ${months} bulan`;
    } else {
      return `${months} bulan`;
    }
  };

  const filteredHewans = hewans?.filter((h: any) => 
    h.nama_hewan?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.nama_jenis_hewan?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.nama_pawrent?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <DashboardLayout title="Data Hewan">
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
    <DashboardLayout title="Data Hewan" showBackButton={true} backTo="/vet/dashboard">
      <div className="space-y-6">
        {/* Info Card */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PawPrint className="h-5 w-5 text-primary" />
              Data Hewan Pasien
            </CardTitle>
            <CardDescription>
              Informasi lengkap semua hewan yang terdaftar di klinik (Read-Only)
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <PawPrint className="h-5 w-5" />
                  Daftar Hewan ({filteredHewans?.length || 0})
                </CardTitle>
                <CardDescription>Lihat detail informasi hewan pasien</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama hewan, jenis, atau pemilik..."
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
            {filteredHewans && filteredHewans.length > 0 ? (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">No</TableHead>
                      <TableHead>Nama Hewan</TableHead>
                      <TableHead>Jenis</TableHead>
                      <TableHead>Jenis Kelamin</TableHead>
                      <TableHead>Umur</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pemilik</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHewans.map((hewan: any, index: number) => (
                      <TableRow key={hewan.hewan_id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell className="font-semibold">{hewan.nama_hewan}</TableCell>
                        <TableCell>{hewan.nama_jenis_hewan}</TableCell>
                        <TableCell>{getJenisKelaminBadge(hewan.jenis_kelamin)}</TableCell>
                        <TableCell className="text-sm">
                          {calculateAge(hewan.tanggal_lahir)}
                        </TableCell>
                        <TableCell>{getStatusHidupBadge(hewan.status_hidup)}</TableCell>
                        <TableCell>{hewan.nama_pawrent}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(hewan)}
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
                <PawPrint className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">
                  {searchQuery ? "Tidak ada hasil pencarian" : "Belum ada data hewan"}
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
                <PawPrint className="h-5 w-5" />
                Detail Hewan
              </DialogTitle>
              <DialogDescription>
                Informasi lengkap data hewan
              </DialogDescription>
            </DialogHeader>
            
            {selectedHewan && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Nama Hewan</Label>
                    <p className="font-semibold text-lg">{selectedHewan.nama_hewan}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Jenis Hewan</Label>
                    <p className="font-medium">{selectedHewan.nama_jenis_hewan}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Jenis Kelamin</Label>
                    <div className="mt-1">{getJenisKelaminBadge(selectedHewan.jenis_kelamin)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status Hidup</Label>
                    <div className="mt-1">{getStatusHidupBadge(selectedHewan.status_hidup)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Tanggal Lahir</Label>
                    <p className="font-medium">
                      {selectedHewan.tanggal_lahir 
                        ? new Date(selectedHewan.tanggal_lahir).toLocaleDateString('id-ID')
                        : '-'
                      }
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Umur</Label>
                    <p className="font-medium">{calculateAge(selectedHewan.tanggal_lahir)}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <Label className="text-muted-foreground">Informasi Pemilik</Label>
                  <div className="mt-2 p-4 bg-muted rounded-md">
                    <p className="font-semibold">{selectedHewan.nama_pawrent}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      ID Pawrent: #{selectedHewan.pawrent_id}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default HewanPage;