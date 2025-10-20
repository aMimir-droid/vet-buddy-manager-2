import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PawPrint, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useState } from "react";

const fetchJenisHewan = async (token: string) => {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/jenis-hewan/vet/list`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Gagal mengambil data jenis hewan");
  return res.json();
};

const VetJenisHewanPage = () => {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: jenisList, isLoading } = useQuery({
    queryKey: ["jenis-hewan-vet"],
    queryFn: () => fetchJenisHewan(token!),
    enabled: !!token
  });

  const filteredJenis = jenisList?.filter((j: any) =>
    j.nama_jenis_hewan.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout title="Jenis Hewan" showBackButton={true} backTo="/vet/dashboard">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PawPrint className="h-5 w-5" />
            Daftar Jenis Hewan
          </CardTitle>
          <CardDescription>
            Lihat daftar jenis hewan peliharaan yang tersedia di klinik
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama jenis hewan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Nama Jenis Hewan</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Jumlah Hewan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJenis?.length > 0 ? (
                  filteredJenis.map((jenis: any, idx: number) => (
                    <TableRow key={jenis.jenis_hewan_id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell className="font-semibold">{jenis.nama_jenis_hewan}</TableCell>
                      <TableCell>{jenis.deskripsi_jenis_hewan || "-"}</TableCell>
                      <TableCell>{jenis.jumlah_hewan || 0}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Tidak ada data jenis hewan
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default VetJenisHewanPage;