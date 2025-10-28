import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { layananApi } from "@/lib/api";
import { Stethoscope, Wallet, ClipboardList } from "lucide-react";

const AdminKlinikLayananPage = () => {
  const { token } = useAuth();

  const { data: layanans, isLoading } = useQuery({
    queryKey: ["layanans"],
    queryFn: () => layananApi.getAll(token!),
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Layanan Klinik">
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
    <DashboardLayout title="Layanan Klinik" showBackButton={true}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Daftar Layanan Medis
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Data layanan diambil dari sistem umum. Halaman ini hanya untuk melihat data.
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Kode</TableHead>
                  <TableHead>Nama Layanan</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Biaya</TableHead>
                  <TableHead>Penggunaan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {layanans?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Belum ada data layanan
                    </TableCell>
                  </TableRow>
                ) : (
                  layanans?.map((layanan: any) => (
                    <TableRow key={layanan.kode_layanan}>
                      <TableCell className="font-medium">
                        <Badge variant="outline">{layanan.kode_layanan}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <ClipboardList className="h-4 w-4 text-primary" />
                          {layanan.nama_layanan}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="truncate" title={layanan.deskripsi_layanan}>
                          {layanan.deskripsi_layanan || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 font-semibold text-green-600">
                          <Wallet className="h-4 w-4" />
                          {formatCurrency(parseFloat(layanan.biaya_layanan || 0))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {layanan.total_penggunaan || 0} kali
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminKlinikLayananPage;