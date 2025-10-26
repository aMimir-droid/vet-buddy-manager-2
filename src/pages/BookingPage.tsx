import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingApi } from "@/lib/api";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";

const BookingPage = () => {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({
    dokter_id: "",
    tanggal_booking: "",
    waktu_booking: "",
    nama_pengunjung: "",
    catatan: ""
  });

  // Fetch bookings depending on role
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings', user?.role_id, user?.dokter_id, user?.pawrent_id],
    queryFn: async () => {
      if (user?.role_id === 2 && user.dokter_id) {
        return bookingApi.getByDokter(user.dokter_id, token!);
      } else if (user?.role_id === 3) {
        return bookingApi.getMy(token!);
      } else {
        // admin: fetch all dokter bookings by calling dokter list + fetching per dokter is expensive;
        // fallback: call vet endpoint for dokter  — but simplest: fetch with /booking/dokter for first dokter
        return []; // keep empty for admin for now (admin can use Klinik/Dokter pages)
      }
    },
    enabled: !!token
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => bookingApi.create(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', user?.role_id, user?.dokter_id, user?.pawrent_id] });
      setIsDialogOpen(false);
    },
  });

  const handleOpenCreate = () => {
    setForm({
      dokter_id: "",
      tanggal_booking: new Date().toISOString().split('T')[0],
      waktu_booking: "09:00",
      nama_pengunjung: "",
      catatan: ""
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      dokter_id: Number(form.dokter_id),
      tanggal_booking: form.tanggal_booking,
      waktu_booking: form.waktu_booking,
      nama_pengunjung: form.nama_pengunjung,
      catatan: form.catatan
    });
  };

  const formatDateTime = (d: string, t: string) => {
    try {
      return `${format(new Date(d), 'dd MMM yyyy')} ${t}`;
    } catch {
      return `${d} ${t}`;
    }
  };

  return (
    <DashboardLayout title="Booking Janji Temu" showBackButton={true} backTo={user?.role_id === 2 ? "/vet/dashboard" : user?.role_id === 3 ? "/pawrent/dashboard" : "/admin/dashboard"}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Booking Janji Temu</CardTitle>
            <CardDescription>Kelola booking untuk dokter / pawrent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end mb-4">
              {(user?.role_id === 3 || user?.role_id === 1) && (
                <Button onClick={handleOpenCreate}>Buat Booking Baru</Button>
              )}
            </div>

            {isLoading ? (
              <div>Loading...</div>
            ) : bookings && bookings.length > 0 ? (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>Dokter</TableHead>
                      <TableHead>Tanggal & Waktu</TableHead>
                      <TableHead>Pengunjung</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((b: any, idx: number) => (
                      <TableRow key={b.booking_id || idx}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{b.nama_dokter || b.dokter_id || '-'}</TableCell>
                        <TableCell>{formatDateTime(b.tanggal_booking, b.waktu_booking)}</TableCell>
                        <TableCell>{b.nama_pengunjung || '-'}</TableCell>
                        <TableCell>{b.status || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">Belum ada booking</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Booking Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm">Dokter ID</label>
              <Input value={form.dokter_id} onChange={(e) => setForm({ ...form, dokter_id: e.target.value })} placeholder="Masukkan dokter_id" required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm">Tanggal</label>
                <Input type="date" value={form.tanggal_booking} onChange={(e) => setForm({ ...form, tanggal_booking: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm">Waktu</label>
                <Input type="time" value={form.waktu_booking} onChange={(e) => setForm({ ...form, waktu_booking: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="block text-sm">Nama Pengunjung</label>
              <Input value={form.nama_pengunjung} onChange={(e) => setForm({ ...form, nama_pengunjung: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm">Catatan</label>
              <Input value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={createMutation.isLoading}>
                {createMutation.isLoading ? 'Menyimpan...' : 'Simpan Booking'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default BookingPage;