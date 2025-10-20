import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DashboardLayout } from "@/components/DashboardLayout";
import { UserCog, Phone, Stethoscope, Building2 } from "lucide-react";

const fetchDokters = async (token: string) => {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/dokter/public/list`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Gagal mengambil data dokter");
  return res.json();
};

const PawrentDokterListPage = () => {
  const { token } = useAuth();
  const { data: dokters, isLoading } = useQuery({
    queryKey: ["dokter-list-pawrent"],
    queryFn: () => fetchDokters(token!),
    enabled: !!token
  });

  return (
    <DashboardLayout title="Daftar Dokter" showBackButton={true} backTo="/pawrent/dashboard">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Daftar Dokter Klinik
          </CardTitle>
          <CardDescription>
            Lihat informasi dokter, kontak, dan spesialisasi
          </CardDescription>
        </CardHeader>
      </Card>
      <Card>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dokters?.map((d: any) => (
                <Card key={d.dokter_id} className="border shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCog className="h-5 w-5" />
                      {d.title_dokter} {d.nama_dokter}
                    </CardTitle>
                    <CardDescription>
                      <Stethoscope className="inline h-4 w-4 mr-1" />
                      {d.nama_spesialisasi || "-"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm mb-2">
                      <Phone className="inline h-4 w-4 mr-1" />
                      {d.telepon_dokter || "-"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <Building2 className="inline h-4 w-4 mr-1" />
                      {d.nama_klinik || "-"}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default PawrentDokterListPage;