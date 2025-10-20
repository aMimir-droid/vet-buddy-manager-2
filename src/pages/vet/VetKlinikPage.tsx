import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Building2, Search, MapPin, Phone, UserCog } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useState } from "react";
import { klinikApi } from "@/lib/api";

const fetchKliniks = async (token: string) => {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/klinik/vet/list`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Gagal mengambil data klinik");
  return res.json();
};

const VetKlinikPage = () => {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKlinik, setSelectedKlinik] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: kliniks, isLoading } = useQuery({
    queryKey: ["klinik-vet"],
    queryFn: () => fetchKliniks(token!),
    enabled: !!token
  });

  // Fetch dokter untuk selected klinik
  const { data: dokters, isLoading: isLoadingDokters } = useQuery({
    queryKey: ["dokters-by-klinik", selectedKlinik?.klinik_id],
    queryFn: () => klinikApi.getDoktersByKlinik(selectedKlinik.klinik_id, token!),
    enabled: !!selectedKlinik,
  });

  // Fetch stats (total dokter & kunjungan) untuk selected klinik
  const { data: klinikStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["klinik-stats", selectedKlinik?.klinik_id],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/klinik/${selectedKlinik.klinik_id}/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Gagal mengambil statistik klinik");
      return res.json();
    },
    enabled: !!selectedKlinik,
  });

  const filteredKliniks = kliniks?.filter((k: any) =>
    k.nama_klinik?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout title="Klinik" showBackButton={true} backTo="/vet/dashboard">
      <div className="space-y-6">
        {/* Info Card */}
        <Card className="bg-gradient-to-r from-yellow-100 to-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-yellow-600" />
              Daftar Klinik Hewan
            </CardTitle>
            <CardDescription>
              Informasi lengkap semua klinik yang tersedia di sistem
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Search & Title */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Daftar Klinik ({filteredKliniks?.length || 0})
                </CardTitle>
                <CardDescription>Lihat detail informasi klinik</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama klinik..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Klinik List */}
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : filteredKliniks && filteredKliniks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredKliniks.map((klinik: any) => (
                  <Card
                    key={klinik.klinik_id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedKlinik(klinik);
                      setIsDialogOpen(true);
                    }}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span className="truncate">{klinik.nama_klinik}</span>
                        <Badge variant="secondary" className="ml-2 flex-shrink-0">
                          {klinik.jumlah_dokter || 0} dokter
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {klinik.alamat_klinik || "Alamat belum diisi"}
                        </span>
                      </div>
                      {klinik.telepon_klinik && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{klinik.telepon_klinik}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">
                  {searchQuery ? "Tidak ada hasil pencarian" : "Belum ada data klinik"}
                </p>
                {searchQuery && (
                  <p className="text-sm mt-2">Coba kata kunci lain</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog Klinik Detail */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Detail Klinik: {selectedKlinik?.nama_klinik}
            </DialogTitle>
            <DialogDescription>
              {selectedKlinik?.alamat_klinik}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <b>Telepon:</b> {selectedKlinik?.telepon_klinik || "-"}
            </div>
            <div>
              <b>Total Pengunjung:</b>{" "}
              {isLoadingStats
                ? "Loading..."
                : klinikStats?.total_kunjungan ?? 0}
            </div>
            <div>
              <b>Daftar Dokter:</b>
              {isLoadingDokters ? (
                <div>Loading...</div>
              ) : dokters && dokters.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {dokters.map((d: any) => (
                    <li key={d.dokter_id} className="flex items-center gap-2">
                      <UserCog className="h-4 w-4" />
                      <span>
                        {d.title_dokter} {d.nama_dokter}
                        {d.spesialisasi && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({d.spesialisasi})
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-muted-foreground">Belum ada dokter di klinik ini</div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default VetKlinikPage;