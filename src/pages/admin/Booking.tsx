import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { bookingApi } from "@/lib/api";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { format } from "date-fns";

const BookingAdminPage = () => {
  const { token } = useAuth();
  const [dokterId, setDokterId] = useState<string>("");
  const { data: bookings = [], refetch, isFetching } = useQuery({
    queryKey: ["bookings", "admin", dokterId],
    queryFn: async () => {
      if (!dokterId) return [];
      return bookingApi.getByDokter(Number(dokterId), token!);
    },
    enabled: false
  });

  const handleFetch = () => {
    if (dokterId) refetch();
  };

  const fmt = (d: string, t: string) => {
    try { return `${format(new Date(d), "dd MMM yyyy")} ${t}`; } catch { return `${d} ${t}`; }
  };

  return (
    <DashboardLayout title="Booking - Admin" showBackButton backTo="/admin/dashboard">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Booking (Admin)</CardTitle>
            <CardDescription>Filter berdasarkan dokter_id</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input placeholder="Masukkan dokter_id" value={dokterId} onChange={(e) => setDokterId(e.target.value)} />
              <Button onClick={handleFetch} disabled={!dokterId || isFetching}>{isFetching ? "Memuat..." : "Tampilkan"}</Button>
            </div>

            {bookings.length ? (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>Tanggal & Waktu</TableHead>
                      <TableHead>Pawrent</TableHead>
                      <TableHead>Pengunjung</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((b: any, i: number) => (
                      <TableRow key={b.booking_id || i}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell>{fmt(b.tanggal_booking, b.waktu_booking)}</TableCell>
                        <TableCell>{b.nama_pawrent || "-"}</TableCell>
                        <TableCell>{b.nama_pengunjung || "-"}</TableCell>
                        <TableCell>{b.status || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : <div className="text-muted-foreground">Tidak ada data. Masukkan dokter_id lalu klik Tampilkan.</div>}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default BookingAdminPage;