import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { bookingApi } from "@/lib/api";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { format } from "date-fns";

const BookingVetPage = () => {
  const { token, user } = useAuth();
  const dokterId = user?.dokter_id;

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings", "vet", dokterId],
    queryFn: async () => {
      if (!dokterId) return [];
      return bookingApi.getByDokter(dokterId, token!);
    },
    enabled: !!token && !!dokterId,
  });

  const fmt = (d: string, t: string) => {
    try { return `${format(new Date(d), "dd MMM yyyy")} ${t}`; } catch { return `${d} ${t}`; }
  };

  return (
    <DashboardLayout title="Booking - Dokter" showBackButton backTo="/vet/dashboard">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Booking untuk Anda</CardTitle>
            <CardDescription>Daftar janji temu pasien</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <div>Loading...</div> : bookings.length ? (
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
            ) : <div className="text-center py-8 text-muted-foreground">Belum ada booking</div>}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default BookingVetPage;