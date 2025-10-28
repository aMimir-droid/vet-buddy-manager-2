import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Stethoscope,
  Clock,
  FileText,
  Eye,
  ArrowRight,
  Info,
  X,
  DollarSign,
  PawPrint,
  Pill,
  Activity,
} from "lucide-react";
// --- MODIFIKASI: Tambahkan 'useMemo' dan 'useEffect' ---
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  bookingApi, // Gunakan bookingApi
  hewanApi,
  dokterApi,
  klinikApi,
  pawrentApi,
  shiftDokterApi,
} from "@/lib/api";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";

const AdminKlinikBookingPage = () => {
  const { token, user } = useAuth(); // Tambahkan user untuk filter klinik_id
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<any>(null); // Ubah ke booking
  const [viewingBooking, setViewingBooking] = useState<any>(null); // Ubah ke booking

  const [formData, setFormData] = useState({
    klinik_id: user?.klinik_id || "", // Set otomatis berdasarkan user.klinik_id
    dokter_id: "",
    pawrent_id: "",
    hewan_id: "",
    tanggal_booking: "",
    waktu_booking: "",
    status: "pending",
    catatan: "",
  });

  // --- MODIFIKASI: Tambahkan state untuk available slots dan shift ---
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [dokterShift, setDokterShift] = useState<{ jam_mulai: string; jam_selesai: string } | null>(null);

  // Queries
  // --- PERBEDAAN: Query booking difilter berdasarkan klinik_id user ---
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["bookings-admin-klinik", user?.klinik_id],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/booking/admin-klinik`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Gagal mengambil data booking");
      return res.json();
    },
    enabled: !!user?.klinik_id,
  });

  const { data: hewans = [] } = useQuery({
    queryKey: ["hewans", formData.pawrent_id],
    queryFn: () => formData.pawrent_id ? hewanApi.getByPawrent(formData.pawrent_id, token!) : Promise.resolve([]),
    enabled: !!formData.pawrent_id,
  });

  const { data: allDoktersData, isLoading: allDoktersLoading } = useQuery({
    queryKey: ["dokters", user?.klinik_id], // Tambahkan klinik_id ke key
    queryFn: async () => {
      // Gunakan endpoint baru untuk filter di server
      const result = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/dokter/by-klinik/${user?.klinik_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!result.ok) throw new Error("Gagal mengambil data dokter");
      return result.json();
    },
    enabled: !!token && !!user?.klinik_id, // Pastikan keduanya ada
  });

  const { data: pawrents = [] } = useQuery({
    queryKey: ["pawrents"],
    queryFn: () => pawrentApi.getAll(token!),
  });

  // Hapus filter useEffect, karena data sudah difilter di server
  // const [filteredDokters, setFilteredDokters] = useState<any[]>([]);
  // useEffect(() => { ... }); // Hapus ini

  // Langsung gunakan allDoktersData sebagai filteredDokters
  const filteredDokters = allDoktersData || [];

  // --- MODIFIKASI: useEffect untuk fetch available slots ---
  useEffect(() => {
    if (!formData.dokter_id || !formData.tanggal_booking || !token) {
      setAvailableSlots([]);
      return;
    }
    console.log('🔍 Fetching slots for dokter:', formData.dokter_id, 'date:', formData.tanggal_booking);
    setSlotsLoading(true);
    bookingApi.getAvailable(Number(formData.dokter_id), formData.tanggal_booking, token)
      .then((data) => {
        console.log('✅ Available slots:', data.availableSlots);
        setAvailableSlots(data.availableSlots);
      })
      .catch((err) => {
        console.error('❌ Error fetching slots:', err);
        setAvailableSlots([]);
      })
      .finally(() => setSlotsLoading(false));
  }, [formData.dokter_id, formData.tanggal_booking, token]);

  // --- MODIFIKASI: Fetch shift dokter ---
  useEffect(() => {
    if (!formData.dokter_id || !token) {
      setDokterShift(null);
      return;
    }
    shiftDokterApi.getByDokter(Number(formData.dokter_id), token)
      .then((shifts: any[]) => {
        // Ambil shift untuk hari booking (1=Senin, dst)
        if (!formData.tanggal_booking) {
          setDokterShift(null);
          return;
        }
        const bookingDate = new Date(formData.tanggal_booking);
        const hariMinggu = bookingDate.getDay() === 0 ? 7 : bookingDate.getDay(); // 0=Sunday, shift pakai 1=Senin, 7=Minggu
        const shift = shifts.find(s => s.hari_minggu === hariMinggu);
        if (shift) {
          setDokterShift({ jam_mulai: shift.jam_mulai, jam_selesai: shift.jam_selesai });
        } else {
          setDokterShift(null);
        }
      })
      .catch(() => setDokterShift(null));
  }, [formData.dokter_id, formData.tanggal_booking, token]);

  // --- MODIFIKASI: Reset dokter_id dan hewan_id saat klinik_id atau pawrent_id berubah ---
  useEffect(() => {
    setFormData((prev) => ({ ...prev, dokter_id: "", hewan_id: "" }));
  }, [formData.klinik_id]);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, hewan_id: "" }));
  }, [formData.pawrent_id]);

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      data.klinik_id = user?.klinik_id; // Override untuk memastikan sesuai user
      if (editingBooking) {
        return bookingApi.update(editingBooking.booking_id, data, token!);
      }
      return bookingApi.create(data, token!);
    },
    onSuccess: async (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["bookings-admin-klinik"] });
      toast.success(
        editingBooking
          ? "Booking berhasil diupdate"
          : "Booking berhasil ditambahkan"
      );
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menyimpan booking");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (bookingId: number) =>
      bookingApi.delete(bookingId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings-admin-klinik"] });
      toast.success("Booking berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus booking");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      bookingApi.update(id, { status }, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings-admin-klinik"] });
      toast.success("Status berhasil diupdate");
    },
    onError: () => toast.error("Gagal update status"),
  });

  const handleViewDetail = (booking: any) => {
    setViewingBooking(booking);
    setIsDialogOpen(true); // Gunakan dialog yang sama untuk detail
  };

  const handleOpenDialog = async (booking?: any) => {
    if (allDoktersLoading) {
      toast.error("Data dokter sedang dimuat, silakan coba lagi.");
      return;
    }

    if (booking) {
      // --- MODE EDIT ---
      setEditingBooking(booking);
      setFormData({
        klinik_id: user?.klinik_id || "", // Override dengan user.klinik_id
        dokter_id: booking.dokter_id?.toString() || "",
        pawrent_id: booking.pawrent_id?.toString() || "",
        hewan_id: booking.hewan_id?.toString() || "",
        tanggal_booking: booking.tanggal_booking?.split("T")[0] || "",
        waktu_booking: booking.waktu_booking || "",
        status: booking.status || "pending",
        catatan: booking.catatan || "",
      });
    } else {
      // --- MODE TAMBAH BARU ---
      setEditingBooking(null);
      const today = new Date().toISOString().split("T")[0];
      setFormData({
        klinik_id: user?.klinik_id || "", // Set otomatis
        dokter_id: "",
        pawrent_id: "",
        hewan_id: "",
        tanggal_booking: today,
        waktu_booking: "",
        status: "pending",
        catatan: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingBooking(null);
  };

  // --- MODIFIKASI: Validasi sebelum submit untuk mencegah double booking ---
  const validateBeforeSubmit = async () => {
    if (!formData.dokter_id) {
      toast.error("Pilih dokter terlebih dahulu");
      return false;
    }

    const dokterId = Number(formData.dokter_id);
    const dokter = filteredDokters.find(d => Number(d.dokter_id) === dokterId);

    if (!dokter) {
      toast.error("Dokter tidak ditemukan. Segarkan halaman dan coba lagi.");
      return false;
    }
    if (dokter.is_active === 0 || dokter.is_active === false) {
      toast.error("Dokter yang dipilih tidak aktif. Pilih dokter lain.");
      return false;
    }

    // Fetch existing bookings for this dokter to check conflicts
    try {
      const res: any = await bookingApi.getByDokter(dokterId, token!);
      const dokterBookings = Array.isArray(res) ? res : [];
      const sameDate = dokterBookings.filter((b: any) => (b.tanggal_booking || '').toString() === formData.tanggal_booking);

      const timeToMinutes = (t: string) => {
        const [hh, mm] = t.split(':').map(s => parseInt(s, 10));
        return hh * 60 + mm;
      };

      const selectedMin = timeToMinutes(formData.waktu_booking);
      for (const b of sameDate) {
        if (b.booking_id === editingBooking?.booking_id) continue;
        const bMin = timeToMinutes(b.waktu_booking);
        if (Math.abs(selectedMin - bMin) < 30) {
          toast.error("Waktu booking bentrok dengan booking lain (jarak minimal 30 menit).");
          return false;
        }
      }
    } catch (err) {
      console.warn("Tidak dapat mengambil booking dokter untuk validasi client-side:", err);
    }

    // Ensure slot is available
    if (availableSlots.length > 0 && !availableSlots.includes(formData.waktu_booking)) {
      toast.error("Waktu yang dipilih tidak tersedia. Pilih slot yang tersedia.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!(await validateBeforeSubmit())) return;

    const submitData = editingBooking ? {
      ...editingBooking,
      pawrent_id: formData.pawrent_id || editingBooking.pawrent_id,
      hewan_id: formData.hewan_id || editingBooking.hewan_id,
      dokter_id: formData.dokter_id || editingBooking.dokter_id,
      tanggal_booking: formData.tanggal_booking || editingBooking.tanggal_booking,
      waktu_booking: formData.waktu_booking || editingBooking.waktu_booking,
      status: formData.status || editingBooking.status,
      catatan: formData.catatan !== undefined ? formData.catatan : editingBooking.catatan,
      klinik_id: user?.klinik_id || editingBooking.klinik_id, // Override dengan user.klinik_id
    } : {
      klinik_id: user?.klinik_id, // Set otomatis
      pawrent_id: formData.pawrent_id,
      hewan_id: formData.hewan_id,
      dokter_id: formData.dokter_id,
      tanggal_booking: formData.tanggal_booking,
      waktu_booking: formData.waktu_booking,
      status: formData.status,
      catatan: formData.catatan,
    };

    const requiredChecks: { key: keyof typeof submitData; label: string }[] = [
      { key: "klinik_id", label: "Klinik" },
      { key: "pawrent_id", label: "Pawrent" },
      { key: "hewan_id", label: "Hewan" },
      { key: "dokter_id", label: "Dokter" },
      { key: "tanggal_booking", label: "Tanggal Booking" },
      { key: "waktu_booking", label: "Waktu Booking" },
    ];

    const missing = requiredChecks
      .filter((check) => {
        const val = submitData[check.key];
        return val === "" || val === null || val === undefined;
      })
      .map((c) => c.label);

    if (missing.length > 0) {
      toast.error(`Field wajib belum lengkap: ${missing.join(", ")}`);
      return;
    }

    console.log("Submitting booking data:", submitData);
    saveMutation.mutate(submitData);
  };

  const getStatusBadge = (status: string) => {
    const badges: any = {
      pending: <Badge variant="secondary">Pending</Badge>,
      booked: <Badge variant="default">Booked</Badge>,
      cancelled: <Badge variant="destructive">Cancelled</Badge>,
      done: <Badge variant="outline">Done</Badge>,  // TAMBAHKAN: Badge untuk 'done'
    };
    return badges[status] || <Badge>{status}</Badge>;
  };

  // --- MODIFIKASI: Fungsi untuk generate slots berdasarkan shift ---
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

  // --- MODIFIKASI: Format tanggal ---
  const fmt = (d: string, t: string) => {
    try { return `${format(new Date(d), "dd MMM yyyy")} ${t}`; } catch { return `${d} ${t}`; }
  };

  if (isLoading || allDoktersLoading) {
    return (
      <DashboardLayout title="Kelola Booking">
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
    <DashboardLayout title="Kelola Booking" showBackButton={true}>
      <div className="space-y-6">
        {/* Header Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <Calendar className="h-6 w-6" />
              Kelola Booking Medis
            </CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300">
              Pantau dan kelola semua booking pasien hewan di klinik
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Daftar Booking Medis
            </CardTitle>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" /> Tambah Booking
            </Button>
          </CardHeader>
          <CardContent>
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
                {bookings?.map((b: any) => (
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
                        onValueChange={(value) => updateStatusMutation.mutate({ id: b.booking_id, status: value })}
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(b)}
                          disabled={allDoktersLoading}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (
                              confirm("Yakin ingin menghapus booking ini?")
                            ) {
                              deleteMutation.mutate(b.booking_id);
                            }
                          }}
                        >
                          Hapus
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialog Form Add/Edit */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {editingBooking
                  ? "Edit Booking"
                  : "Tambah Booking Baru"}
              </DialogTitle>
              <DialogDescription>
                {editingBooking
                  ? "Update informasi booking medis"
                  : "Masukkan informasi booking medis baru"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="klinik" className="text-right">
                    Klinik
                  </Label>
                  <Input
                    id="klinik"
                    value="Klinik Anda" // Tampilkan sebagai disabled
                    disabled
                    className="col-span-3"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="pawrent" className="text-right">
                    Pawrent
                  </Label>
                  <Select
                    value={formData.pawrent_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, pawrent_id: value })
                    }
                  >
                    <SelectTrigger id="pawrent" className="col-span-3">
                      <SelectValue placeholder="Pilih Pawrent" />
                    </SelectTrigger>
                    <SelectContent>
                      {pawrents.map((p: any) => (
                        <SelectItem
                          key={p.pawrent_id}
                          value={p.pawrent_id.toString()}
                        >
                          {p.nama_depan_pawrent} {p.nama_belakang_pawrent}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="hewan" className="text-right">
                    Hewan
                  </Label>
                  <Select
                    value={formData.hewan_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, hewan_id: value })
                    }
                    disabled={!formData.pawrent_id}
                  >
                    <SelectTrigger id="hewan" className="col-span-3">
                      <SelectValue placeholder={formData.pawrent_id ? "Pilih Hewan" : "Pilih Pawrent terlebih dahulu"} />
                    </SelectTrigger>
                    <SelectContent>
                      {hewans.map((h: any) => (
                        <SelectItem
                          key={h.hewan_id}
                          value={h.hewan_id.toString()}
                        >
                          {h.nama_hewan} - {h.jenis_hewan}
                        </SelectItem>
                      ))}
                      {/* Jika hewan yang dipilih tidak ada di hewans, tetap tampilkan */}
                      {!hewans.some(h => h.hewan_id.toString() === formData.hewan_id) && formData.hewan_id && (
                        (() => {
                          const hewan = bookings.find(b => b.hewan_id?.toString() === formData.hewan_id);
                          return hewan ? (
                            <SelectItem key={hewan.hewan_id} value={hewan.hewan_id.toString()}>
                              {hewan.nama_hewan} - {hewan.jenis_hewan} (data lama)
                            </SelectItem>
                          ) : null;
                        })()
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dokter" className="text-right">
                    Dokter
                  </Label>
                  <Select
                    value={formData.dokter_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, dokter_id: value })
                    }
                    disabled={!formData.klinik_id}
                  >
                    <SelectTrigger id="dokter" className="col-span-3">
                      <SelectValue placeholder={formData.klinik_id ? "Pilih Dokter" : "Pilih Klinik terlebih dahulu"} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredDokters.map((dokter: any) => (
                        <SelectItem
                          key={dokter.dokter_id}
                          value={dokter.dokter_id.toString()}
                          disabled={dokter.is_active === 0 || dokter.is_active === false}
                          className={dokter.is_active === 0 || dokter.is_active === false ? "opacity-50 cursor-not-allowed" : ""}
                        >
                          {dokter.title_dokter ? `${dokter.title_dokter} ` : ""}{dokter.nama_dokter}{(dokter.is_active === 0 || dokter.is_active === false) ? ' (tidak aktif)' : ''}
                        </SelectItem>
                      ))}
                      {/* Jika dokter yang dipilih tidak ada di filteredDokters, tetap tampilkan */}
                      {!filteredDokters.some(d => d.dokter_id.toString() === formData.dokter_id) && formData.dokter_id && (
                        (() => {
                          const dokter = allDoktersData.find(d => d.dokter_id.toString() === formData.dokter_id);
                          return dokter ? (
                            <SelectItem key={dokter.dokter_id} value={dokter.dokter_id.toString()}>
                              {dokter.title_dokter ? `${dokter.title_dokter} ` : ""}{dokter.nama_dokter} (data lama)
                            </SelectItem>
                          ) : null;
                        })()
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tanggal" className="text-right">
                    Tanggal Booking
                  </Label>
                  <Input
                    id="tanggal"
                    type="date"
                    value={formData.tanggal_booking}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tanggal_booking: e.target.value,
                      })
                    }
                    className="col-span-3"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="waktu" className="text-right">
                    Waktu Booking
                  </Label>
                  <div className="col-span-3">
                    <div className="text-sm text-muted-foreground mb-2">
                      Slot tersedia: {availableSlots.length}
                    </div>
                    <Select
                      value={formData.waktu_booking}
                      onValueChange={(value) =>
                        setFormData({ ...formData, waktu_booking: value })
                      }
                      disabled={slotsLoading || !formData.dokter_id || !formData.tanggal_booking}
                    >
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
                        {!allSlots.includes(formData.waktu_booking) && formData.waktu_booking && (
                          <SelectItem key={formData.waktu_booking} value={formData.waktu_booking}>
                            {formData.waktu_booking} (data lama)
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger id="status" className="col-span-3">
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="booked">Booked</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="catatan" className="text-right">
                    Catatan
                  </Label>
                  <Input
                    id="catatan"
                    value={formData.catatan}
                    onChange={(e) =>
                      setFormData({ ...formData, catatan: e.target.value })
                    }
                    className="col-span-3"
                    placeholder="Masukkan catatan..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={handleCloseDialog}
                  type="button"
                >
                  Batal
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending
                    ? "Menyimpan..."
                    : editingBooking
                    ? "Simpan Perubahan"
                    : "Simpan Booking"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminKlinikBookingPage;