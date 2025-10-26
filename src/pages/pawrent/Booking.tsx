import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingApi, dokterApi } from "@/lib/api";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

const BookingPawrentPage = () => {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    dokter_id: "",
    tanggal_booking: new Date().toISOString().split("T")[0],
    waktu_booking: "09:00",
    nama_pengunjung: "", // kept for UI but won't be submitted for pawrent
    catatan: ""
  });
  const [dokters, setDokters] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings", "pawrent", user?.pawrent_id],
    queryFn: async () => bookingApi.getMy(token!),
    enabled: !!token && !!user?.pawrent_id,
  });

  const create = useMutation({
    mutationFn: (data: any) => bookingApi.create(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries(["bookings", "pawrent", user?.pawrent_id]);
      setOpen(false);
    }
  });

  useEffect(() => {
    // Fetch daftar dokter on mount (show only active doktor client-side)
    if (token) {
      (async () => {
        try {
          const data = await dokterApi.getAll(token);
          setDokters(Array.isArray(data) ? data : []);
        } catch (err) {
          console.error("Gagal mengambil daftar dokter:", err);
          setDokters([]);
        }
      })();
    }
  }, [token]);

  useEffect(() => {
    // set nama pengunjung otomatis when dialog opens
    if (open) {
      setForm((f) => ({
        ...f,
        nama_pengunjung: `${user?.nama_depan_pawrent || user?.username || ""} ${user?.nama_belakang_pawrent || ""}`.trim()
      }));
    }
  }, [open, user]);

  // Fetch available slots when dokter or date changes
  useEffect(() => {
    const dokterId = Number(form.dokter_id);
    const date = form.tanggal_booking;
    if (!dokterId || !date || !token) {
      setAvailableSlots([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setSlotsLoading(true);
        const res: any = await bookingApi.getAvailable(dokterId, date, token!);
        // expect { availableSlots: string[] }
        if (!cancelled) {
          setAvailableSlots(Array.isArray(res?.availableSlots) ? res.availableSlots : []);
          // if current selected waktu_booking not in available slots, reset to first
          if (!res?.availableSlots?.includes(form.waktu_booking)) {
            setForm(f => ({ ...f, waktu_booking: res?.availableSlots?.[0] ?? "" }));
          }
        }
      } catch (err) {
        console.warn('Gagal mengambil available slots:', err);
        if (!cancelled) setAvailableSlots([]);
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [form.dokter_id, form.tanggal_booking, token]);

  const timeToMinutes = (t: string) => {
    const [hh, mm] = t.split(':').map(s => parseInt(s, 10));
    return hh * 60 + mm;
  };

  // client-side pre-checks (complement server SP validation)
  const validateBeforeSubmit = async () => {
    if (!form.dokter_id) {
      window.alert("Pilih dokter terlebih dahulu");
      return false;
    }

    const dokterId = Number(form.dokter_id);
    const dokter = dokters.find(d => Number(d.dokter_id) === dokterId);

    // check if dokter exists and is_active (client-side friendly check)
    if (!dokter) {
      window.alert("Dokter tidak ditemukan. Segarkan halaman dan coba lagi.");
      return false;
    }
    if (dokter.is_active === 0 || dokter.is_active === false) {
      window.alert("Dokter yang dipilih tidak aktif. Pilih dokter lain.");
      return false;
    }

    // fetch existing bookings for this dokter (server-side SP is authoritative)
    try {
      const res: any = await bookingApi.getByDokter(dokterId, token!);
      const dokterBookings = Array.isArray(res) ? res : [];
      // filter by selected tanggal_booking
      const sameDate = dokterBookings.filter((b: any) => (b.tanggal_booking || '').toString() === form.tanggal_booking);

      const selectedMin = timeToMinutes(form.waktu_booking);
      for (const b of sameDate) {
        const existingTime = (b.waktu_booking || '').toString().substring(0,5);
        if (!existingTime) continue;
        const existingMin = timeToMinutes(existingTime);
        if (Math.abs(existingMin - selectedMin) < 30) {
          window.alert("Waktu booking bentrok dengan booking dokter lain (harus ada jarak minimal 30 menit). Pilih waktu lain.");
          return false;
        }
      }
    } catch (err) {
      // ignore — backend will enforce; but log for debugging
      console.warn("Tidak dapat mengambil booking dokter untuk validasi client-side:", err);
    }

    // check pawrent own bookings (avoid double-booking same dokter/near time)
    const mySameDate = (bookings || []).filter((b: any) => (b.tanggal_booking || '').toString() === form.tanggal_booking);
    const selMin = timeToMinutes(form.waktu_booking);
    for (const b of mySameDate) {
      if (Number(b.dokter_id) === dokterId) {
        const existingTime = (b.waktu_booking || '').toString().substring(0,5);
        if (existingTime && Math.abs(timeToMinutes(existingTime) - selMin) < 30) {
          window.alert("Anda sudah memiliki booking berdekatan dengan dokter ini. Pilih waktu lain.");
          return false;
        }
      }
    }

    // ensure slot is available (server authoritative)
    if (availableSlots.length > 0 && !availableSlots.includes(form.waktu_booking)) {
      window.alert("Waktu yang dipilih tidak tersedia. Pilih slot yang tersedia.");
      return false;
    }

    // Note: shift active check is enforced by stored procedure on server.
    return true;
  };

  const fmt = (d: string, t: string) => {
    try { return `${format(new Date(d), "dd MMM yyyy")} ${t}`; } catch { return `${d} ${t}`; }
  };

  const statusColor = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'booked': return 'bg-blue-100 text-blue-800';
      case 'done': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout title="Booking - Pawrent" showBackButton backTo="/pawrent/dashboard">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Booking Saya</CardTitle>
            <CardDescription>Kelola janji temu untuk hewan Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end mb-4">
              <Button onClick={() => {
                setForm({
                  dokter_id: "",
                  tanggal_booking: new Date().toISOString().split("T")[0],
                  waktu_booking: "09:00",
                  nama_pengunjung: `${user?.nama_depan_pawrent || user?.username || ""} ${user?.nama_belakang_pawrent || ""}`.trim(),
                  catatan: ""
                });
                setOpen(true);
              }}>
                Buat Booking
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>
            ) : bookings.length ? (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>Dokter</TableHead>
                      <TableHead>Tanggal & Waktu</TableHead>
                      <TableHead>Pengunjung</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((b: any, i: number) => (
                      <TableRow key={b.booking_id || i}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                              {b.nama_dokter ? b.nama_dokter.charAt(0).toUpperCase() : "-"}
                            </div>
                            <div className="text-sm">
                              <div className="font-medium">{b.nama_dokter || "-"}</div>
                              {b.nama_klinik && <div className="text-xs text-muted-foreground">{b.nama_klinik}</div>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{fmt(b.tanggal_booking, b.waktu_booking)}</TableCell>
                        <TableCell>{b.nama_pengunjung || "-"}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColor(b.status)}`}>
                            {b.status || "-"}
                          </span>
                        </TableCell>
                        <TableCell>{b.catatan ? <span className="text-xs text-muted-foreground">{b.catatan}</span> : "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : <div className="text-center py-8 text-muted-foreground">Belum ada booking</div>}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Buat Booking Baru</DialogTitle></DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const ok = await validateBeforeSubmit();
            if (!ok) return;
            try {
              await create.mutateAsync({
                dokter_id: Number(form.dokter_id),
                tanggal_booking: form.tanggal_booking,
                waktu_booking: form.waktu_booking,
                // don't send nama_pengunjung for pawrent role — backend sets it
                catatan: form.catatan || null
              });
            } catch (err: any) {
              // show server-side error message
              const msg = err?.response?.data?.message || err?.message || "Gagal membuat booking";
              window.alert(msg);
            }
          }}>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Pilih Dokter</label>
                <select
                  className="w-full border rounded px-2 py-2"
                  value={form.dokter_id}
                  onChange={e => setForm({ ...form, dokter_id: e.target.value })}
                  required
                >
                  <option value="">-- Pilih Dokter --</option>
                  {dokters.map((d: any) => (
                    <option key={d.dokter_id} value={d.dokter_id} disabled={d.is_active === 0 || d.is_active === false}>
                      {d.title_dokter ? `${d.title_dokter} ` : ""}{d.nama_dokter}{d.nama_klinik ? ` • ${d.nama_klinik}` : ""}{(d.is_active === 0 || d.is_active === false) ? ' (tidak aktif)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={form.tanggal_booking} onChange={(e) => setForm({ ...form, tanggal_booking: e.target.value })} required />
                <div>
                  <label className="block text-sm font-medium mb-1">Waktu</label>
                  {slotsLoading ? (
                    <div className="px-3 py-2 border rounded">Memuat slot...</div>
                  ) : availableSlots.length ? (
                    <select
                      className="w-full border rounded px-2 py-2"
                      value={form.waktu_booking}
                      onChange={(e) => setForm({ ...form, waktu_booking: e.target.value })}
                      required
                    >
                      {availableSlots.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <div className="px-3 py-2 border rounded text-sm text-muted-foreground">Tidak ada slot tersedia untuk dokter pada tanggal ini</div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nama Pengunjung</label>
                <Input value={form.nama_pengunjung} readOnly />
                <p className="text-xs text-muted-foreground mt-1">Nama pengunjung otomatis diisi dari akun Anda (pawrent). Server akan menegakkan validasi shift & jeda 30 menit.</p>
              </div>

              <Input value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} placeholder="Catatan (opsional)" />
            </div>

            <DialogFooter>
              <Button type="submit" className="w-full">{create.isLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default BookingPawrentPage;