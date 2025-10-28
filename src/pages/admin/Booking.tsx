import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingApi, klinikApi, dokterApi, pawrentApi, hewanApi, shiftDokterApi } from "@/lib/api";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

const BookingAdminPage = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [editBooking, setEditBooking] = useState<any>(null);
  const [isCreate, setIsCreate] = useState(false);
  const [editForm, setEditForm] = useState({
    klinik_id: "",
    dokter_id: "",
    pawrent_id: "",
    hewan_id: "",
    tanggal_booking: "",
    waktu_booking: "",
    status: "",
    catatan: ""
  });

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [dokterShift, setDokterShift] = useState<{ jam_mulai: string; jam_selesai: string } | null>(null);

  // Fetch lists untuk dropdown
  const { data: kliniks = [] } = useQuery({
    queryKey: ["kliniks"],
    queryFn: () => klinikApi.getAll(token!),
  });
  const { data: dokters = [] } = useQuery({
    queryKey: ["dokters"],
    queryFn: () => dokterApi.getAll(token!),
  });
  const { data: pawrents = [] } = useQuery({
    queryKey: ["pawrents"],
    queryFn: () => pawrentApi.getAll(token!),
  });

  // Fetch hewan berdasarkan pawrent_id
  const { data: hewans = [] } = useQuery({
    queryKey: ["hewans", editForm.pawrent_id],
    queryFn: () => editForm.pawrent_id ? hewanApi.getByPawrent(editForm.pawrent_id, token!) : Promise.resolve([]),
    enabled: !!editForm.pawrent_id,
  });

  // Query bookings
  const { data: bookings = [], isLoading, error } = useQuery({
    queryKey: ["bookings", "admin"],
    queryFn: () => bookingApi.getAll(token!),
  });

  // Mutations
  const createBooking = useMutation({
    mutationFn: (data: any) => bookingApi.create(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", "admin"] });
      setIsCreate(false);
      toast({ title: "Booking berhasil dibuat" });
    },
    onError: () => toast({ title: "Gagal buat booking", variant: "destructive" }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      bookingApi.update(id, { status }, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", "admin"] });
      toast({ title: "Status berhasil diupdate" });
    },
    onError: () => toast({ title: "Gagal update status", variant: "destructive" }),
  });

  const deleteBooking = useMutation({
    mutationFn: (id: number) => bookingApi.delete(id, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", "admin"] });
      toast({ title: "Booking berhasil dihapus" });
    },
    onError: () => toast({ title: "Gagal hapus booking", variant: "destructive" }),
  });

  const updateBooking = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      bookingApi.update(id, data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", "admin"] });
      setEditBooking(null);
      toast({ title: "Booking berhasil diupdate" });
    },
    onError: () => toast({ title: "Gagal update booking", variant: "destructive" }),
  });

  // useEffect untuk mengisi form saat editBooking berubah
  useEffect(() => {
    if (editBooking) {
      setEditForm({
        klinik_id: editBooking.klinik_id?.toString() || "",
        dokter_id: editBooking.dokter_id?.toString() || "",
        pawrent_id: editBooking.pawrent_id?.toString() || "",
        hewan_id: editBooking.hewan_id?.toString() || "",
        tanggal_booking: editBooking.tanggal_booking || "",
        waktu_booking: editBooking.waktu_booking || "",
        status: editBooking.status || "",
        catatan: editBooking.catatan || ""
      });
    }
  }, [editBooking]);

  // Reset dokter_id dan hewan_id saat klinik_id atau pawrent_id berubah
  useEffect(() => {
    setEditForm((prev) => ({ ...prev, dokter_id: "", hewan_id: "" }));
  }, [editForm.klinik_id]);

  useEffect(() => {
    setEditForm((prev) => ({ ...prev, hewan_id: "" }));
  }, [editForm.pawrent_id]);

  // Fetch available slots when dokter or date changes
  useEffect(() => {
    if (!editForm.dokter_id || !editForm.tanggal_booking || !token) {
      setAvailableSlots([]);
      return;
    }
    console.log('🔍 Fetching slots for dokter:', editForm.dokter_id, 'date:', editForm.tanggal_booking);
    setSlotsLoading(true);
    bookingApi.getAvailable(Number(editForm.dokter_id), editForm.tanggal_booking, token)
      .then((data) => {
        console.log('✅ Available slots:', data.availableSlots);
        setAvailableSlots(data.availableSlots);
      })
      .catch((err) => {
        console.error('❌ Error fetching slots:', err);
        setAvailableSlots([]);
      })
      .finally(() => setSlotsLoading(false));
  }, [editForm.dokter_id, editForm.tanggal_booking, token]);

  // Fetch shift dokter
  useEffect(() => {
    if (!editForm.dokter_id || !token) {
      setDokterShift(null);
      return;
    }
    shiftDokterApi.getByDokter(Number(editForm.dokter_id), token)
      .then((shifts: any[]) => {
        // Ambil shift untuk hari booking (1=Senin, dst)
        if (!editForm.tanggal_booking) {
          setDokterShift(null);
          return;
        }
        const bookingDate = new Date(editForm.tanggal_booking);
        const hariMinggu = bookingDate.getDay() === 0 ? 7 : bookingDate.getDay(); // 0=Sunday, shift pakai 1=Senin, 7=Minggu
        const shift = shifts.find(s => s.hari_minggu === hariMinggu);
        if (shift) {
          setDokterShift({ jam_mulai: shift.jam_mulai, jam_selesai: shift.jam_selesai });
        } else {
          setDokterShift(null);
        }
      })
      .catch(() => setDokterShift(null));
  }, [editForm.dokter_id, editForm.tanggal_booking, token]);

  const handleEdit = (booking: any) => {
    setIsCreate(false);
    setEditBooking(booking);
  };

  // Reset form saat membuka dialog Create
  const handleOpenCreate = () => {
    setEditBooking(null);
    setEditForm({
      klinik_id: "",
      dokter_id: "",
      pawrent_id: "",
      hewan_id: "",
      tanggal_booking: "",
      waktu_booking: "",
      status: "",
      catatan: ""
    });
    setIsCreate(true);
  };

  // Validasi sebelum submit untuk mencegah double booking
  const validateBeforeSubmit = async () => {
    if (!editForm.dokter_id) {
      toast({ title: "Pilih dokter terlebih dahulu", variant: "destructive" });
      return false;
    }

    const dokterId = Number(editForm.dokter_id);
    const dokter = dokters.find(d => Number(d.dokter_id) === dokterId);

    if (!dokter) {
      toast({ title: "Dokter tidak ditemukan. Segarkan halaman dan coba lagi.", variant: "destructive" });
      return false;
    }
    if (dokter.is_active === 0 || dokter.is_active === false) {
      toast({ title: "Dokter yang dipilih tidak aktif. Pilih dokter lain.", variant: "destructive" });
      return false;
    }

    // Fetch existing bookings for this dokter to check conflicts
    try {
      const res: any = await bookingApi.getByDokter(dokterId, token!);
      const dokterBookings = Array.isArray(res) ? res : [];
      const sameDate = dokterBookings.filter((b: any) => (b.tanggal_booking || '').toString() === editForm.tanggal_booking);

      const timeToMinutes = (t: string) => {
        const [hh, mm] = t.split(':').map(s => parseInt(s, 10));
        return hh * 60 + mm;
      };

      const selectedMin = timeToMinutes(editForm.waktu_booking);
      for (const b of sameDate) {
        if (b.booking_id === editBooking?.booking_id) continue;
        const bMin = timeToMinutes(b.waktu_booking);
        if (Math.abs(selectedMin - bMin) < 30) {
          toast({ title: "Waktu booking bentrok dengan booking lain (jarak minimal 30 menit).", variant: "destructive" });
          return false;
        }
      }
    } catch (err) {
      console.warn("Tidak dapat mengambil booking dokter untuk validasi client-side:", err);
    }

    // Ensure slot is available
    if (availableSlots.length > 0 && !availableSlots.includes(editForm.waktu_booking)) {
      toast({ title: "Waktu yang dipilih tidak tersedia. Pilih slot yang tersedia.", variant: "destructive" });
      return false;
    }

    return true;
  };

  const handleCreate = async () => {
    if (!(await validateBeforeSubmit())) return;
    createBooking.mutate(editForm);
  };

  const handleUpdate = async () => {
    if (!(await validateBeforeSubmit())) return;
    updateBooking.mutate({ id: editBooking.booking_id, data: editForm });
  };

  const fmt = (d: string, t: string) => {
    try { return `${format(new Date(d), "dd MMM yyyy")} ${t}`; } catch { return `${d} ${t}`; }
  };

  // Fungsi untuk menghasilkan semua slot potensial
  const generateAllSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

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

// Filter dokter berdasarkan klinik_id yang dipilih dan hanya yang aktif (gunakan loose equality == untuk handle tipe data berbeda dari API)
  const filteredDokters = editForm.klinik_id ? dokters.filter(d => {
    const matchKlinik = d.klinik_id == editForm.klinik_id;  // Loose equality untuk handle string/number
    const matchActive = d.is_active == 1 || d.is_active == true;  // Loose equality untuk handle number/boolean
    return matchKlinik && matchActive;
  }) : [];

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <DashboardLayout title="Booking - Admin" showBackButton backTo="/admin/dashboard">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Semua Booking</CardTitle>
            <CardDescription>Kelola semua booking: lihat, edit, hapus, ubah status</CardDescription>
            {/* Tombol Tambah Booking */}
            <Dialog open={isCreate} onOpenChange={(open) => {
              if (open) {
                handleOpenCreate();
              } else {
                setIsCreate(false);
              }
            }}>
              <DialogTrigger asChild>
                <Button>Tambah Booking</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Booking Baru</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Select value={editForm.klinik_id} onValueChange={(value) => setEditForm({ ...editForm, klinik_id: value })}>
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
                  <Select value={editForm.dokter_id} onValueChange={(value) => setEditForm({ ...editForm, dokter_id: value })} disabled={!editForm.klinik_id}>
                    <SelectTrigger>
                      <SelectValue placeholder={editForm.klinik_id ? "Pilih Dokter" : "Pilih Klinik terlebih dahulu"} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredDokters.map((d: any) => (
                        <SelectItem
                          key={d.dokter_id}
                          value={d.dokter_id.toString()}
                          disabled={d.is_active === 0 || d.is_active === false}
                          className={d.is_active === 0 || d.is_active === false ? "opacity-50 cursor-not-allowed" : ""}
                        >
                          {d.title_dokter ? `${d.title_dokter} ` : ""}{d.nama_dokter}{(d.is_active === 0 || d.is_active === false) ? ' (tidak aktif)' : ''}
                        </SelectItem>
                      ))}
                      {/* Jika dokter yang dipilih tidak ada di filteredDokters, tetap tampilkan */}
                      {!filteredDokters.some(d => d.dokter_id.toString() === editForm.dokter_id) && editForm.dokter_id && (
                        (() => {
                          const dokter = dokters.find(d => d.dokter_id.toString() === editForm.dokter_id);
                          return dokter ? (
                            <SelectItem key={dokter.dokter_id} value={dokter.dokter_id.toString()}>
                              {dokter.title_dokter ? `${dokter.title_dokter} ` : ""}{dokter.nama_dokter} (data lama)
                            </SelectItem>
                          ) : null;
                        })()
                      )}
                    </SelectContent>
                  </Select>
                  <Select value={editForm.pawrent_id} onValueChange={(value) => setEditForm({ ...editForm, pawrent_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Pawrent" />
                    </SelectTrigger>
                    <SelectContent>
                      {pawrents.map((p: any) => (
                        <SelectItem key={p.pawrent_id} value={p.pawrent_id.toString()}>
                          {p.nama_depan_pawrent} {p.nama_belakang_pawrent}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={editForm.hewan_id} onValueChange={(value) => setEditForm({ ...editForm, hewan_id: value })} disabled={!editForm.pawrent_id}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Hewan" />
                    </SelectTrigger>
                    <SelectContent>
                      {hewans.map((h: any) => (
                        <SelectItem key={h.hewan_id} value={h.hewan_id.toString()}>
                          {h.nama_hewan} - {h.jenis_hewan}
                        </SelectItem>
                      ))}
                      {/* Jika hewan yang dipilih tidak ada di hewans, tetap tampilkan */}
                      {!hewans.some(h => h.hewan_id.toString() === editForm.hewan_id) && editForm.hewan_id && (
                        (() => {
                          const hewan = bookings.find(b => b.hewan_id?.toString() === editForm.hewan_id);
                          return hewan ? (
                            <SelectItem key={hewan.hewan_id} value={hewan.hewan_id.toString()}>
                              {hewan.nama_hewan} - {hewan.jenis_hewan} (data lama)
                            </SelectItem>
                          ) : null;
                        })()
                      )}
                    </SelectContent>
                  </Select>
                  <Input placeholder="Tanggal Booking" type="date" value={editForm.tanggal_booking} onChange={(e) => setEditForm({ ...editForm, tanggal_booking: e.target.value })} />
                  <div className="text-sm text-muted-foreground">
                    Slot tersedia: {availableSlots.length}
                  </div>
                  <Select value={editForm.waktu_booking} onValueChange={(value) => setEditForm({ ...editForm, waktu_booking: value })} disabled={slotsLoading || !editForm.dokter_id || !editForm.tanggal_booking}>
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
                      {/* Jika waktu_booking yang dipilih tidak ada di allSlots, tetap tampilkan */}
                      {!allSlots.includes(editForm.waktu_booking) && editForm.waktu_booking && (
                        <SelectItem key={editForm.waktu_booking} value={editForm.waktu_booking}>
                          {editForm.waktu_booking} (data lama)
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <Input placeholder="Catatan" value={editForm.catatan} onChange={(e) => setEditForm({ ...editForm, catatan: e.target.value })} />
                  <Button onClick={handleCreate} disabled={createBooking.isPending}>
                    {createBooking.isPending ? "Membuat..." : "Buat"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {bookings.length ? (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Klinik</TableHead>
                      <TableHead>Dokter</TableHead>
                      <TableHead>Pawrent</TableHead>
                      <TableHead>Hewan</TableHead>
                      <TableHead>Tanggal & Waktu</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((b: any) => (
                      <TableRow key={b.booking_id}>
                        <TableCell>{b.booking_id}</TableCell>
                        <TableCell>{b.nama_klinik || "-"}</TableCell>
                        <TableCell>{b.nama_dokter || "-"}</TableCell>
                        <TableCell>{b.nama_pawrent || "-"}</TableCell>
                        <TableCell>{b.nama_hewan || "-"}</TableCell> 
                        <TableCell>{fmt(b.tanggal_booking, b.waktu_booking)}</TableCell>
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
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => handleEdit(b)}>Edit</Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Booking</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <Select value={editForm.klinik_id} onValueChange={(value) => setEditForm({ ...editForm, klinik_id: value })}>
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
                                  <Select value={editForm.dokter_id} onValueChange={(value) => setEditForm({ ...editForm, dokter_id: value })} disabled={!editForm.klinik_id}>
                                    <SelectTrigger>
                                      <SelectValue placeholder={editForm.klinik_id ? "Pilih Dokter" : "Pilih Klinik terlebih dahulu"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {filteredDokters.map((d: any) => (
                                        <SelectItem
                                          key={d.dokter_id}
                                          value={d.dokter_id.toString()}
                                          disabled={d.is_active === 0 || d.is_active === false}
                                          className={d.is_active === 0 || d.is_active === false ? "opacity-50 cursor-not-allowed" : ""}
                                        >
                                          {d.title_dokter ? `${d.title_dokter} ` : ""}{d.nama_dokter}{(d.is_active === 0 || d.is_active === false) ? ' (tidak aktif)' : ''}
                                        </SelectItem>
                                      ))}
                                      {/* Jika dokter yang dipilih tidak ada di filteredDokters, tetap tampilkan */}
                                      {!filteredDokters.some(d => d.dokter_id.toString() === editForm.dokter_id) && editForm.dokter_id && (
                                        (() => {
                                          const dokter = dokters.find(d => d.dokter_id.toString() === editForm.dokter_id);
                                          return dokter ? (
                                            <SelectItem key={dokter.dokter_id} value={dokter.dokter_id.toString()}>
                                              {dokter.title_dokter ? `${dokter.title_dokter} ` : ""}{dokter.nama_dokter} (data lama)
                                            </SelectItem>
                                          ) : null;
                                        })()
                                      )}
                                    </SelectContent>
                                  </Select>
                                  <Select value={editForm.pawrent_id} onValueChange={(value) => setEditForm({ ...editForm, pawrent_id: value })}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Pilih Pawrent" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {pawrents.map((p: any) => (
                                        <SelectItem key={p.pawrent_id} value={p.pawrent_id.toString()}>
                                          {p.nama_depan_pawrent} {p.nama_belakang_pawrent}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Select value={editForm.hewan_id} onValueChange={(value) => setEditForm({ ...editForm, hewan_id: value })} disabled={!editForm.pawrent_id}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Pilih Hewan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {hewans.map((h: any) => (
                                        <SelectItem key={h.hewan_id} value={h.hewan_id.toString()}>
                                          {h.nama_hewan} - {h.jenis_hewan}
                                        </SelectItem>
                                      ))}
                                      {/* Jika hewan yang dipilih tidak ada di hewans, tetap tampilkan */}
                                      {!hewans.some(h => h.hewan_id.toString() === editForm.hewan_id) && editForm.hewan_id && (
                                        (() => {
                                          const hewan = bookings.find(b => b.hewan_id?.toString() === editForm.hewan_id);
                                          return hewan ? (
                                            <SelectItem key={hewan.hewan_id} value={hewan.hewan_id.toString()}>
                                              {hewan.nama_hewan} - {hewan.jenis_hewan} (data lama)
                                            </SelectItem>
                                          ) : null;
                                        })()
                                      )}
                                    </SelectContent>
                                  </Select>
                                  <Input placeholder="Tanggal Booking" type="date" value={editForm.tanggal_booking} onChange={(e) => setEditForm({ ...editForm, tanggal_booking: e.target.value })} />
                                  <div className="text-sm text-muted-foreground">
                                    Slot tersedia: {availableSlots.length}
                                  </div>
                                  <Select value={editForm.waktu_booking} onValueChange={(value) => setEditForm({ ...editForm, waktu_booking: value })} disabled={slotsLoading || !editForm.dokter_id || !editForm.tanggal_booking}>
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
                                      {/* Jika waktu_booking yang dipilih tidak ada di allSlots, tetap tampilkan */}
                                      {!allSlots.includes(editForm.waktu_booking) && editForm.waktu_booking && (
                                        <SelectItem key={editForm.waktu_booking} value={editForm.waktu_booking}>
                                          {editForm.waktu_booking} (data lama)
                                        </SelectItem>
                                      )}
                                    </SelectContent>
                                  </Select>
                                  <Input placeholder="Catatan" value={editForm.catatan} onChange={(e) => setEditForm({ ...editForm, catatan: e.target.value })} />
                                  <Button onClick={handleUpdate} disabled={updateBooking.isPending}>
                                    {updateBooking.isPending ? "Updating..." : "Update"}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button variant="destructive" size="sm" onClick={() => deleteBooking.mutate(b.booking_id)}>Hapus</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : <div className="text-muted-foreground">Tidak ada booking.</div>}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default BookingAdminPage;