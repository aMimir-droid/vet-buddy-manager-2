import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingApi, dokterApi, klinikApi, shiftDokterApi, hewanApi, apiCall } from "@/lib/api";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const BookingPawrentPage = () => {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    klinik_id: "",
    dokter_id: "",
    hewan_id: "",
    tanggal_booking: new Date().toISOString().split("T")[0],
    waktu_booking: "09:00",
    catatan: ""
  });
  const [dokters, setDokters] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [dokterShift, setDokterShift] = useState<{ jam_mulai: string; jam_selesai: string } | null>(null);

  // Fetch kliniks
  const { data: kliniks = [] } = useQuery({
    queryKey: ["kliniks"],
    queryFn: () => klinikApi.getAll(token!),
    enabled: !!token,
  });

  // Fetch hewan berdasarkan pawrent_id
  const { data: hewans = [] } = useQuery({
    queryKey: ["hewans", user?.pawrent_id],
    queryFn: () => hewanApi.getByPawrent(user?.pawrent_id, token!),
    enabled: !!user?.pawrent_id,
  });

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings", "pawrent", user?.pawrent_id],
    queryFn: async () => bookingApi.getMy(token!),
    enabled: !!token && !!user?.pawrent_id,
  });

  const create = useMutation({
    mutationFn: (data: any) => bookingApi.create({ ...data, pawrent_id: user?.pawrent_id }, token!),  // TAMBAHKAN: Sertakan pawrent_id dari user
    onSuccess: () => {
      queryClient.invalidateQueries(["bookings", "pawrent", user?.pawrent_id]);
      setOpen(false);
      toast({ title: "Booking berhasil dibuat" });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "Gagal membuat booking";
      toast({ title: msg, variant: "destructive" });
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
      }));
    }
  }, [open, user]);

  // Reset dokter_id and hewan_id when klinik_id changes
  useEffect(() => {
    setForm((prev) => ({ ...prev, dokter_id: "", hewan_id: "" }));
  }, [form.klinik_id]);

  // Fetch available slots when dokter or date changes
  useEffect(() => {
    if (!form.dokter_id || !form.tanggal_booking || !token) {
      setAvailableSlots([]);
      return;
    }
    console.log('🔍 Fetching slots for dokter:', form.dokter_id, 'date:', form.tanggal_booking);
    setSlotsLoading(true);
    bookingApi.getAvailable(Number(form.dokter_id), form.tanggal_booking, token)
      .then((data) => {
        console.log('✅ Available slots:', data.availableSlots);
        setAvailableSlots(data.availableSlots);
      })
      .catch((err) => {
        console.error('❌ Error fetching slots:', err);
        setAvailableSlots([]);
      })
      .finally(() => setSlotsLoading(false));
  }, [form.dokter_id, form.tanggal_booking, token]);

  // Fetch shift dokter
  useEffect(() => {
    if (!form.dokter_id || !token) {
      setDokterShift(null);
      return;
    }
    shiftDokterApi.getByDokter(Number(form.dokter_id), token)
      .then((shifts: any[]) => {
        // Ambil shift untuk hari booking (1=Senin, dst)
        if (!form.tanggal_booking) {
          setDokterShift(null);
          return;
        }
        const bookingDate = new Date(form.tanggal_booking);
        const hariMinggu = bookingDate.getDay() === 0 ? 7 : bookingDate.getDay(); // 0=Sunday, shift pakai 1=Senin, 7=Minggu
        const shift = shifts.find(s => s.hari_minggu === hariMinggu);
        if (shift) {
          setDokterShift({ jam_mulai: shift.jam_mulai, jam_selesai: shift.jam_selesai });
        } else {
          setDokterShift(null);
        }
      })
      .catch(() => setDokterShift(null));
  }, [form.dokter_id, form.tanggal_booking, token]);

  const timeToMinutes = (t: string) => {
    const [hh, mm] = t.split(':').map(s => parseInt(s, 10));
    return hh * 60 + mm;
  };

  // client-side pre-checks (complement server SP validation)
  const validateBeforeSubmit = async () => {
    if (!form.klinik_id) {
      toast({ title: "Pilih klinik terlebih dahulu", variant: "destructive" });
      return false;
    }
    if (!form.dokter_id) {
      toast({ title: "Pilih dokter terlebih dahulu", variant: "destructive" });
      return false;
    }
    if (!form.hewan_id) {
      toast({ title: "Pilih hewan terlebih dahulu", variant: "destructive" });
      return false;
    }

    const dokterId = Number(form.dokter_id);
    const dokter = dokters.find(d => Number(d.dokter_id) === dokterId);

    // check if dokter exists and is_active (client-side friendly check)
    if (!dokter) {
      toast({ title: "Dokter tidak ditemukan. Segarkan halaman dan coba lagi.", variant: "destructive" });
      return false;
    }
    if (dokter.is_active === 0 || dokter.is_active === false) {
      toast({ title: "Dokter yang dipilih tidak aktif. Pilih dokter lain.", variant: "destructive" });
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
          toast({ title: "Waktu booking bentrok dengan booking dokter lain (harus ada jarak minimal 30 menit). Pilih waktu lain.", variant: "destructive" });
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
          toast({ title: "Anda sudah memiliki booking berdekatan dengan dokter ini. Pilih waktu lain.", variant: "destructive" });
          return false;
        }
      }
    }

    // ensure slot is available (server authoritative)
    if (availableSlots.length > 0 && !availableSlots.includes(form.waktu_booking)) {
      toast({ title: "Waktu yang dipilih tidak tersedia. Pilih slot yang tersedia.", variant: "destructive" });
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

  // TAMBAHKAN: State untuk nama pengunjung dari backend
  const [fetchedNamaPengunjung, setFetchedNamaPengunjung] = useState('');

  // TAMBAHKAN: Fetch nama pengunjung dari backend saat mount
  useEffect(() => {
    if (token && user?.role_id === 3) {
      apiCall<{ nama_depan_pawrent: string; nama_belakang_pawrent: string }>({
        endpoint: '/pawrent/me',
        token
      })
        .then((data) => {
          const fullName = `${data.nama_depan_pawrent} ${data.nama_belakang_pawrent}`.trim();
          setFetchedNamaPengunjung(fullName);
          setForm((prev) => ({ ...prev, nama_pengunjung: fullName }));
        })
        .catch((err) => {
          console.error('Error fetching pawrent name:', err);
          // Fallback ke username jika gagal
          setFetchedNamaPengunjung(user.username || '');
          setForm((prev) => ({ ...prev, nama_pengunjung: user.username || '' }));
        });
    }
  }, [token, user]);

  // Fungsi untuk menghasilkan slot berdasarkan shift dokter
  const generateSlotsByShift = () => {
    if (!dokterShift) return [];
    const slots = [];
    const [startHour, startMin] = dokterShift.jam_mulai.split(':').map(Number);
    const [endHour, endMin] = dokterShift.jam_selesai.split(':').map(Number);

    let current = new Date();
    current.setHours(startHour, startMin, 0, 0);
    const end = new Date();
    end.setHours(endHour, endMin, 0, 0);

    while (current < end) {
      const hh = current.getHours().toString().padStart(2, '0');
      const mm = current.getMinutes().toString().padStart(2, '0');
      slots.push(`${hh}:${mm}`);
      current.setMinutes(current.getMinutes() + 30);
    }
    return slots;
  };

  const allSlots = dokterShift ? generateSlotsByShift() : [];

  // Filter dokter berdasarkan klinik_id yang dipilih dan hanya yang aktif (is_active = 1 atau true)
  const filteredDokters = form.klinik_id ? dokters.filter(d => {
    const matchKlinik = d.klinik_id == form.klinik_id;  // Loose equality untuk handle string/number
    const matchActive = d.is_active == 1 || d.is_active == true;  // Loose equality untuk handle number/boolean
    return matchKlinik && matchActive;
  }) : [];
  
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
                  klinik_id: "",
                  dokter_id: "",
                  hewan_id: "",
                  tanggal_booking: new Date().toISOString().split("T")[0],
                  waktu_booking: "09:00",
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
                        <TableCell>{b.nama_hewan || "-"}</TableCell>
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
                klinik_id: Number(form.klinik_id),
                dokter_id: Number(form.dokter_id),
                hewan_id: Number(form.hewan_id),
                tanggal_booking: form.tanggal_booking,
                waktu_booking: form.waktu_booking,
                catatan: form.catatan || null
              });
            } catch (err: any) {
              // Error sudah ditangani di onError mutation
            }
          }}>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Pilih Klinik</label>
                <Select value={form.klinik_id} onValueChange={(value) => setForm({ ...form, klinik_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Klinik" />
                  </SelectTrigger>
                  <SelectContent>
                    {kliniks.map((k: any) => (
                      <SelectItem key={k.klinik_id} value={k.klinik_id.toString()}>
                        {k.nama_klinik}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Pilih Hewan</label>
                <Select value={form.hewan_id} onValueChange={(value) => setForm({ ...form, hewan_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Hewan" />
                  </SelectTrigger>
                  <SelectContent>
                    {hewans.map((h: any) => (
                      <SelectItem key={h.hewan_id} value={h.hewan_id.toString()}>
                        {h.nama_hewan}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Pilih Dokter</label>
                <Select value={form.dokter_id} onValueChange={(value) => setForm({ ...form, dokter_id: value })} disabled={!form.klinik_id}>
                  <SelectTrigger>
                    <SelectValue placeholder={form.klinik_id ? "Pilih Dokter" : "Pilih Klinik terlebih dahulu"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredDokters.map((d: any) => (
                      <SelectItem key={d.dokter_id} value={d.dokter_id.toString()} disabled={d.is_active === 0 || d.is_active === false}>
                        {d.title_dokter ? `${d.title_dokter} ` : ""}{d.nama_dokter}{(d.is_active === 0 || d.is_active === false) ? ' (tidak aktif)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={form.tanggal_booking} onChange={(e) => setForm({ ...form, tanggal_booking: e.target.value })} required />
                <div>
                  <label className="block text-sm font-medium mb-1">Waktu</label>
                  <div className="text-sm text-muted-foreground mb-1">
                    Slot tersedia: {availableSlots.length}
                  </div>
                  {slotsLoading ? (
                    <div className="px-3 py-2 border rounded">Memuat slot...</div>
                  ) : allSlots.length ? (
                    <Select value={form.waktu_booking} onValueChange={(value) => setForm({ ...form, waktu_booking: value })} disabled={slotsLoading || !form.dokter_id || !form.tanggal_booking}>
                      <SelectTrigger>
                        <SelectValue placeholder={slotsLoading ? "Memuat slot..." : "Pilih Waktu Booking"} />
                      </SelectTrigger>
                      <SelectContent>
                        {allSlots.map((slot) => {
                          const isAvailable = availableSlots.includes(slot);
                          return (
                            <SelectItem
                              key={slot}
                              value={slot}
                              disabled={!isAvailable}
                              className={!isAvailable ? "opacity-50 cursor-not-allowed" : ""}
                            >
                              {slot} {!isAvailable ? "(Booked)" : ""}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="px-3 py-2 border rounded text-sm text-muted-foreground">Tidak ada slot tersedia untuk dokter pada tanggal ini</div>
                  )}
                </div>
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