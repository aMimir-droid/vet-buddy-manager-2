import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingApi } from "@/lib/api";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

const statusColor = (status: string) => {
  switch ((status || '').toLowerCase()) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'booked': return 'bg-blue-100 text-blue-800';
    case 'done': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const BookingVetPage = () => {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const dokterId = user?.dokter_id;

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings", "vet", dokterId],
    queryFn: async () => {
      if (!dokterId) return [];
      return bookingApi.getByDokter(dokterId, token!);
    },
    enabled: !!token && !!dokterId,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      bookingApi.update(id, { status }, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", "vet", dokterId] });
      toast({ title: "Status berhasil diupdate" });
    },
    onError: () => toast({ title: "Gagal update status", variant: "destructive" }),
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
            <CardDescription>Daftar janji temu pasien dan hewan</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <div className="flex justify-center py-8">Loading...</div> : bookings.length ? (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>Tanggal & Waktu</TableHead>
                      <TableHead>Pawrent</TableHead>
                      <TableHead>Hewan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((b: any, i: number) => (
                      <TableRow key={b.booking_id || i}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell>
                          <span className="font-medium">{fmt(b.tanggal_booking, b.waktu_booking)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">
                              {b.nama_pawrent ? b.nama_pawrent.charAt(0).toUpperCase() : "-"}
                            </div>
                            <div>
                              <div className="font-medium">{b.nama_pawrent || "-"}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded bg-gray-100 text-gray-800">{b.nama_hewan || "-"}</span>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={b.status || "pending"}
                            onValueChange={(value) => updateStatus.mutate({ id: b.booking_id, status: value })}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="booked">Booked</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                              <SelectItem value="done">Done</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {b.catatan ? <span className="text-xs text-muted-foreground">{b.catatan}</span> : "-"}
                        </TableCell>
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