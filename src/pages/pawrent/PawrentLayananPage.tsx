import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Activity, Search, Stethoscope } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const fetchLayanans = async (token: string) => {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/layanan/public/list`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Gagal mengambil data layanan");
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

const PawrentLayananPage = () => {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: layanans, isLoading } = useQuery({
    queryKey: ["layanan-pawrent"],
    queryFn: () => fetchLayanans(token!),
    enabled: !!token
  });

  const filteredLayanans = layanans?.filter((l: any) =>
    l.nama_layanan?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.kode_layanan?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.deskripsi_layanan?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout title="Layanan Klinik" showBackButton={true} backTo="/pawrent/dashboard">
      <div className="space-y-6">
        {/* Info Card */}
        <Card className="bg-gradient-to-r from-indigo-500/10 to-indigo-500/5 border-indigo-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-indigo-500" />
              Daftar Layanan Klinik
            </CardTitle>
            <CardDescription>
              Informasi layanan medis dan prosedur yang tersedia di klinik
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Search & Title */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Daftar Layanan ({filteredLayanans?.length || 0})
                </CardTitle>
                <CardDescription>Lihat detail layanan dan biaya</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama layanan, kode, atau deskripsi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Layanan List */}
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : filteredLayanans && filteredLayanans.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLayanans.map((layanan: any, idx: number) => (
                  <Card key={layanan.kode_layanan} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="h-5 w-5 text-indigo-500" />
                        {layanan.nama_layanan}
                      </CardTitle>
                      <CardDescription>
                        <span className="font-mono text-xs text-muted-foreground">
                          Kode: {layanan.kode_layanan}
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        {layanan.deskripsi_layanan || "-"}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          Biaya: {formatCurrency(layanan.biaya_layanan)}
                        </Badge>
                        <Badge variant="secondary">
                          {layanan.total_penggunaan || 0} penggunaan
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
      </div>
    </DashboardLayout>
  );
};

export default PawrentLayananPage;