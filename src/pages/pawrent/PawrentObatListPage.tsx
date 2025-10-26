import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Pill, Search, X, Heart, Stethoscope, Syringe } from "lucide-react";

const fetchObats = async (token: string) => {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/obat/public/list`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Gagal mengambil data obat");
  return res.json();
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

const PawrentObatListPage = () => {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: obats, isLoading } = useQuery({
    queryKey: ["obat-list-pawrent"],
    queryFn: () => fetchObats(token!),
    enabled: !!token
  });

  // Filter berdasarkan nama obat
  const filteredObats = obats?.filter((o: any) =>
    (o.nama_obat || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Icon randomizer for variety
  const getRandomIcon = () => {
    const icons = [Pill, Heart, Stethoscope, Syringe];
    return icons[Math.floor(Math.random() * icons.length)];
  };

  return (
    <DashboardLayout title="Daftar Obat" showBackButton={true} backTo="/pawrent/dashboard">
      <div className="space-y-6">
        {/* Info Card */}
        <Card className="bg-gradient-to-r from-green-100 to-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-green-600" />
              Data Obat Klinik
            </CardTitle>
            <CardDescription>
              Temukan informasi lengkap semua obat yang tersedia di klinik kami
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Content */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-green-50">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-3 text-gray-800">
                  <Pill className="h-6 w-6 text-green-500" />
                  Daftar Obat ({filteredObats?.length || 0})
                </CardTitle>
                <CardDescription className="text-base text-gray-600 mt-1">
                  Jelajahi koleksi obat kami
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Enhanced Search Bar */}
            <div className="flex items-center gap-4 bg-white p-3 rounded-lg shadow-md border">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Cari nama obat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 py-2 text-base border-0 bg-transparent focus:ring-2 focus:ring-green-300"
                />
              </div>
              {searchQuery && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setSearchQuery("")}
                  className="h-10 w-10 hover:bg-green-100"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>

            {/* Obat List */}
            {filteredObats && filteredObats.length > 0 ? (
              <div className="space-y-4">
                {filteredObats.map((obat: any, index: number) => {
                  const IconComponent = getRandomIcon();
                  return (
                    <Card key={obat.obat_id} className="group hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border-0 bg-gradient-to-br from-white to-green-50 shadow-md">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                            <IconComponent className="h-6 w-6 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg font-bold text-gray-800 group-hover:text-green-700 transition-colors">
                              {index + 1}. {obat.nama_obat}
                            </CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-1">Kegunaan:</p>
                          <p className="text-gray-700 text-sm leading-relaxed">{obat.kegunaan}</p>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                          <span className="text-base font-bold text-gray-800">Harga:</span>
                          <Badge variant="outline" className="text-sm px-3 py-1 bg-green-100 text-green-800 border-green-300 font-bold">
                            {formatCurrency(obat.harga_obat)}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="p-4 bg-gray-100 rounded-full inline-block mb-4">
                  <Pill className="h-12 w-12 text-gray-400" />
                </div>
                <p className="text-xl font-bold text-gray-600 mb-2">
                  {searchQuery ? "Tidak ada hasil pencarian" : "Belum ada data obat"}
                </p>
                {searchQuery && (
                  <p className="text-base text-gray-500 mt-2">Coba kata kunci lain untuk menemukan obat yang Anda cari</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PawrentObatListPage;