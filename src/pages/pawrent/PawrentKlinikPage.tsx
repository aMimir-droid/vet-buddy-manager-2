import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Building2, Search, MapPin, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const fetchKliniks = async (token: string) => {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/klinik/public/list`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Gagal mengambil data klinik");
  return res.json();
};

const PawrentKlinikPage = () => {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: kliniks, isLoading } = useQuery({
    queryKey: ["klinik-pawrent"],
    queryFn: () => fetchKliniks(token!),
    enabled: !!token
  });

  const filteredKliniks = kliniks?.filter((k: any) =>
    k.nama_klinik?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout title="Klinik" showBackButton={true} backTo="/pawrent/dashboard">
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
                {filteredKliniks.map((klinik: any, idx: number) => (
                  <Card key={klinik.klinik_id} className="hover:shadow-lg transition-shadow">
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
    </DashboardLayout>
  );
};

export default PawrentKlinikPage;