import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  kunjunganApi,
  hewanApi,
  dokterApi,
  layananApi,
  kunjunganObatApi, // Ganti dari obatApi ke kunjunganObatApi
  bookingApi,
  klinikApi,
  obatApi, // Tambahkan untuk query daftar obat
} from "@/lib/api";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const AdminKlinikKunjunganPage = () => {
  const { token, user } = useAuth(); // Tambahkan user untuk filter klinik_id
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isPreviousVisitDialogOpen, setIsPreviousVisitDialogOpen] =
    useState(false);
  const [editingKunjungan, setEditingKunjungan] = useState<any>(null);
  const [viewingKunjungan, setViewingKunjungan] = useState<any>(null);
  const [viewingPreviousVisit, setViewingPreviousVisit] = useState<any>(null);
  const [selectedHewan, setSelectedHewan] = useState<string>("");
  // --- MODIFIKASI: Kembalikan state untuk riwayat ---
  const [hewanHistory, setHewanHistory] = useState<any[]>([]);
  const [selectedPreviousVisit, setSelectedPreviousVisit] = useState<any>(null);

  const [formData, setFormData] = useState({
    klinik_id: user?.klinik_id || "", // Set otomatis berdasarkan user.klinik_id
    hewan_id: "",
    dokter_id: "",
    tanggal_kunjungan: "",
    waktu_kunjungan: "",
    catatan: "",
    metode_pembayaran: "Cash",
    // --- MODIFIKASI: Kembalikan state kunjungan_sebelumnya ---
    kunjungan_sebelumnya: "",
    booking_id: "none",
    // Ubah ke array untuk multiple layanan dan obat
    selectedLayanans: [] as { kode_layanan: string }[],
    obatForms: [] as { obat_id: string; qty: string; dosis: string; frekuensi: string }[],
  });

  const [existingLayanans, setExistingLayanans] = useState<any[]>([]);
  const [existingObats, setExistingObats] = useState<any[]>([]);
  const [mode, setMode] = useState<"manual" | "booking">("manual");

  const [showLayananDialog, setShowLayananDialog] = useState(false);
  const [showObatDialog, setShowObatDialog] = useState(false);
  // Hapus state showCombinedDialog, newKunjunganId, selectedLayanan, layananList, obatForm

  // Queries
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["bookings", "available-for-kunjungan"],
    queryFn: async () => {
      const result = await bookingApi.getAvailableForKunjungan(token!);
      console.log('Fetched bookings:', result);  // DEBUG: Lihat data yang diambil
      return result as any[];
    },
  });

  // --- PERBEDAAN: Query kunjungan difilter berdasarkan klinik_id user ---
  const { data: kunjungans, isLoading } = useQuery({
    queryKey: ["kunjungans-admin-klinik", user?.klinik_id],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/kunjungan/admin-klinik`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Gagal mengambil data kunjungan");
      return res.json();
    },
    enabled: !!user?.klinik_id,
  });

  const { data: hewans, isLoading: hewansLoading } = useQuery({
    queryKey: ["hewans"],
    queryFn: async () => {
      const result = await hewanApi.getAll(token!);
      return result as any[];
    },
  });

  const { data: allDoktersData, isLoading: allDoktersLoading } = useQuery({
    queryKey: ["dokters"],
    queryFn: async () => {
      const result = await dokterApi.getAll(token!);
      return result as any[];
    },
  });

  // --- PERBEDAAN: Filter dokter berdasarkan user.klinik_id, bukan formData.klinik_id ---
const filteredDokters = useMemo(() => {
  if (!user?.klinik_id || !allDoktersData) return [];
  return allDoktersData.filter(
    (dokter: any) => dokter.klinik_id?.toString() === user.klinik_id?.toString()
  );
}, [user?.klinik_id, allDoktersData]);

  // Tambahkan query untuk layananList
  const { data: layananList, isLoading: layananListLoading } = useQuery({
    queryKey: ["layanan"],
    queryFn: async () => {
      const result = await layananApi.getAll(token!);
      return result as any[];
    },
  });

  // Tambahkan query untuk obatList
  const { data: obatList, isLoading: obatListLoading } = useQuery({
    queryKey: ["obats"],
    queryFn: async () => {
      const result = await obatApi.getAll(token!);
      return result as any[];
    },
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      data.klinik_id = user?.klinik_id; // Override untuk memastikan sesuai user
      if (editingKunjungan) {
        return kunjunganApi.update(editingKunjungan.kunjungan_id, data, token!);
      }
      return kunjunganApi.create(data, token!);
    },
    onSuccess: async (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["kunjungans-admin-klinik"] });
      toast.success(
        editingKunjungan
          ? "Kunjungan berhasil diupdate"
          : "Kunjungan berhasil ditambahkan"
      );
      const kunjunganId = editingKunjungan ? editingKunjungan.kunjungan_id : res?.data?.kunjungan_id;
      if (kunjunganId) {
        try {
          // Simpan multiple layanan
          for (const layanan of formData.selectedLayanans) {
            await layananApi.createKunjunganLayanan(
              {
                kunjungan_id: kunjunganId,
                kode_layanan: layanan.kode_layanan,
              },
              token!
            );
          }
          // Simpan multiple obat
          for (const obat of formData.obatForms) {
            if (obat.obat_id && obat.qty) {
              await kunjunganObatApi.create(
                {
                  ...obat,
                  kunjungan_id: kunjunganId,
                  qty: parseInt(obat.qty),
                },
                token!
              );
            }
          }
          toast.success("Layanan dan obat berhasil disimpan");
        } catch (error: any) {
          toast.error("Kunjungan berhasil, tapi gagal simpan layanan/obat");
        }
      }
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menyimpan kunjungan");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (kunjunganId: number) =>
      kunjunganApi.delete(kunjunganId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kunjungans-admin-klinik"] });
      toast.success("Kunjungan berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus kunjungan");
    },
  });

  // Handlers

  // --- MODIFIKASI: Kembalikan handler riwayat ---
  const handlePreviousVisitChange = (visitId: string) => {
    const actualValue = visitId === "none" ? "none" : visitId;
    setFormData((prev) => ({ ...prev, kunjungan_sebelumnya: actualValue }));

    if (visitId && visitId !== "none") {
      const visit = hewanHistory.find(
        (v) => v.kunjungan_id.toString() === visitId
      );
      setSelectedPreviousVisit(visit);
    } else {
      setSelectedPreviousVisit(null);
    }
  };

  // --- MODIFIKASI: Kembalikan handleHewanChange versi async ---
  const handleHewanChange = async (hewanId: string) => {
    setSelectedHewan(hewanId);
    setFormData((prev) => ({
      ...prev,
      hewan_id: hewanId,
      kunjungan_sebelumnya: "",
    }));
    setSelectedPreviousVisit(null);

    if (!hewanId) {
      setHewanHistory([]);
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/kunjungan/hewan/${hewanId}/history`, // Perbaiki endpoint agar konsisten
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const history = await response.json();
        setHewanHistory(history);

        if (history.length > 0 && !editingKunjungan) {
          toast.info(`Ditemukan ${history.length} riwayat kunjungan sebelumnya`);
          setFormData((prev) => ({ ...prev, kunjungan_sebelumnya: "none" }));
        }
      } else {
        setHewanHistory([]);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
      setHewanHistory([]);
      toast.error("Gagal mengambil riwayat kunjungan");
    }
  };

  const handleViewPreviousVisit = (kunjunganId: number) => {
    const kunjungan = kunjungans?.find(
      (k: any) => k.kunjungan_id === kunjunganId
    );
    if (kunjungan) {
      setViewingPreviousVisit(kunjungan);
      setIsPreviousVisitDialogOpen(true);
    }
  };

  const handleViewPreviousVisitFromTable = (kunjunganId: number | null) => {
    if (!kunjunganId) return;
    const kunjungan = kunjungans?.find(
      (k: any) => k.kunjungan_id === kunjunganId
    );
    if (kunjungan) {
      setViewingPreviousVisit(kunjungan);
      setIsPreviousVisitDialogOpen(true);
    }
  };

  const handleViewDetail = (kunjungan: any) => {
    setViewingKunjungan(kunjungan);
    setIsDetailDialogOpen(true);
  };

  const handleOpenDialog = async (kunjungan?: any) => {
    // Tambahkan pengecekan loading untuk data dokter
    if (allDoktersLoading) {
      toast.error("Data dokter sedang dimuat, silakan coba lagi.");
      return; // Jangan lanjutkan jika data belum siap
    }

    if (kunjungan) {
      // --- MODE EDIT ---
      setEditingKunjungan(kunjungan);
      setMode("manual");

      const dokter = allDoktersData?.find(
        (d: any) => d.dokter_id === kunjungan.dokter_id
      );

      // Tambahkan fallback: Jika dokter tidak ditemukan, coba ambil klinik_id dari kunjungan (jika ada) atau tampilkan error
      let klinikId = dokter ? dokter.klinik_id.toString() : "";
      if (!klinikId && kunjungan.klinik_id) { // Jika kunjungan punya klinik_id langsung (opsional)
        klinikId = kunjungan.klinik_id.toString();
      }
      if (!klinikId) {
        toast.error("Data klinik tidak ditemukan untuk kunjungan ini. Pastikan data dokter lengkap.");
        return; // Atau lanjutkan dengan kosong, tapi beri peringatan
      }

      setFormData({
        klinik_id: user?.klinik_id || "", // Override dengan user.klinik_id
        hewan_id: kunjungan.hewan_id?.toString() || "",
        dokter_id: kunjungan.dokter_id?.toString() || "",
        tanggal_kunjungan: kunjungan.tanggal_kunjungan?.split("T")[0] || "",
        waktu_kunjungan: kunjungan.waktu_kunjungan || "",
        catatan: kunjungan.catatan || "",
        metode_pembayaran: kunjungan.metode_pembayaran || "Cash",
        kunjungan_sebelumnya: kunjungan.kunjungan_sebelumnya?.toString() || "",
        booking_id: kunjungan.booking_id?.toString() || "none",
        selectedLayanans: [], // Reset, atau populate dari data jika ada
        obatForms: [],
      });
      if (kunjungan.hewan_id) {
        // Panggil versi async
        handleHewanChange(kunjungan.hewan_id.toString());
      }

      // Tambahkan fetch layanan dan obat untuk kunjungan ini
      try {
        const [layananRes, obatRes] = await Promise.all([
          fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/kunjungan-layanan/kunjungan/${kunjungan.kunjungan_id}`, // Perbaiki endpoint
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ),
          fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/kunjungan-obat/kunjungan/${kunjungan.kunjungan_id}`, // Perbaiki endpoint
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ),
        ]);
        if (layananRes.ok) {
          const layananData = await layananRes.json();
          setExistingLayanans(layananData);
        }
        if (obatRes.ok) {
          const obatData = await obatRes.json();
          setExistingObats(obatData);
        }
      } catch (error) {
        console.error("Error fetching existing layanan/obat:", error);
        toast.error("Gagal mengambil data layanan/obat");
      }
    } else {
      // --- MODE TAMBAH BARU ---
      setEditingKunjungan(null);
      setMode("manual");
      const today = new Date().toISOString().split("T")[0];
      const now = new Date().toTimeString().slice(0, 5);
      setFormData({
        klinik_id: user?.klinik_id || "", // Set otomatis
        hewan_id: "",
        dokter_id: "",
        tanggal_kunjungan: today,
        waktu_kunjungan: now,
        catatan: "",
        metode_pembayaran: "Cash",
        // --- MODIFIKASI: Kembalikan state kunjungan_sebelumnya ---
        kunjungan_sebelumnya: "",
        booking_id: "none",
        selectedLayanans: [],
        obatForms: [],
      });
      // --- MODIFIKASI: Kembalikan reset state riwayat ---
      setHewanHistory([]);
      setSelectedPreviousVisit(null);
      setSelectedHewan("");
      setExistingLayanans([]);
      setExistingObats([]);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingKunjungan(null);
    setMode("manual");
    // --- MODIFIKASI: Kembalikan reset state riwayat ---
    setHewanHistory([]);
    setSelectedPreviousVisit(null);
    setSelectedHewan("");
    setExistingLayanans([]);
    setExistingObats([]);
  };

  const handleModeChange = (newMode: "manual" | "booking") => {
    setMode(newMode);
    if (newMode === "manual") {
      const today = new Date().toISOString().split("T")[0];
      const now = new Date().toTimeString().slice(0, 5);
      setFormData({
        klinik_id: user?.klinik_id || "", // Tetap set
        hewan_id: "",
        dokter_id: "",
        tanggal_kunjungan: today,
        waktu_kunjungan: now,
        catatan: "",
        metode_pembayaran: "Cash",
        // --- MODIFIKASI: Kembalikan state kunjungan_sebelumnya ---
        kunjungan_sebelumnya: "",
        booking_id: "none",
        selectedLayanans: [],
        obatForms: [],
      });
      // --- MODIFIKASI: Kembalikan reset state riwayat ---
      setHewanHistory([]);
      setSelectedPreviousVisit(null);
      setSelectedHewan("");
    } else {
      setFormData({
        klinik_id: user?.klinik_id || "", // Tetap set
        hewan_id: "",
        dokter_id: "",
        tanggal_kunjungan: "",
        waktu_kunjungan: "",
        catatan: "",
        metode_pembayaran: "Cash",
        // --- MODIFIKASI: Kembalikan state kunjungan_sebelumnya ---
        kunjungan_sebelumnya: "",
        booking_id: "",
        selectedLayanans: [],
        obatForms: [],
      });
      // --- MODIFIKASI: Kembalikan reset state riwayat ---
      setHewanHistory([]);
      setSelectedPreviousVisit(null);
      setSelectedHewan("");
    }
  };

  const handleBookingChange = async (bookingId: string) => {
    if (!bookingId || bookingId === "none") {
      // Reset form
      setFormData(prev => ({
        ...prev,
        booking_id: "",
        hewan_id: "",
        tanggal_kunjungan: "",
        waktu_kunjungan: "",
        catatan: "",
        klinik_id: user?.klinik_id || "", // Tetap set
        dokter_id: "", // Tambahkan reset dokter_id
      }));
      setSelectedHewan("");
      setHewanHistory([]);
      setSelectedPreviousVisit(null);
      return;
    }

    try {
      const bookingData = await bookingApi.getById(bookingId, token!);
      console.log("Fetched booking data:", bookingData);

      // ✅ FORMAT TANGGAL: Parse sebagai Date object untuk menghindari masalah timezone
      const dateObj = new Date(bookingData.tanggal_booking);
      dateObj.setDate(dateObj.getDate() + 1); // Tambah 1 hari agar sesuai dengan tanggal kunjungan
      const formattedTanggal = dateObj.toISOString().split('T')[0]; // Pastikan format YYYY-MM-DD

      // ✅ FORMAT WAKTU: Pastikan format HH:MM
      let formattedWaktu = "";
      if (bookingData.waktu_booking) {
        // Remove seconds and timezone if present
        formattedWaktu = bookingData.waktu_booking.split(':').slice(0, 2).join(':');
      }

      console.log("Final formatted - Date:", formattedTanggal, "Time:", formattedWaktu);

      // ✅ SET STATE DENGAN NILAI YANG SUDAH DIPASTIKAN
      setFormData(prev => ({
        ...prev,
        booking_id: bookingId,
        hewan_id: bookingData.hewan_id?.toString() || "",
        tanggal_kunjungan: formattedTanggal,
        waktu_kunjungan: formattedWaktu,
        catatan: bookingData.catatan || "",
        klinik_id: user?.klinik_id || "", // Override dengan user.klinik_id
        dokter_id: bookingData.dokter_id?.toString() || "", // Tambahkan ini untuk mengisi dokter_id dari booking
      }));

      setSelectedHewan(bookingData.hewan_id?.toString() || "");

      // ✅ TUNGGU handleHewanChange SELESAI
      if (bookingData.hewan_id) {
        await handleHewanChange(bookingData.hewan_id.toString());
      }

      toast.success("Data booking berhasil diisi");
    } catch (error) {
      console.error("Error fetching booking:", error);
      toast.error("Gagal mengambil data booking");
    }
  };

  const getMetodeBadge = (metode: string) => {
    const badges: any = {
      Cash: <Badge variant="default">💵 Cash</Badge>,
      Transfer: <Badge variant="secondary">🏦 Transfer</Badge>,
      "E-Wallet": <Badge variant="outline">📱 E-Wallet</Badge>,
    };
    return badges[metode] || <Badge>{metode}</Badge>;
  };

  // Perbaiki calculateDaysSince untuk menambahkan 1 hari pada perhitungan
  const calculateDaysSince = (date: string) => {
    const visitDate = new Date(date);
    const today = new Date();
    // Reset time ke 00:00:00 untuk perhitungan hari saja
    visitDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - visitDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // Tambah 1 hari sesuai permintaan

    if (diffDays === 1) return "Hari ini";
    if (diffDays === 2) return "Kemarin";
    if (diffDays < 8) return `${diffDays} hari yang lalu`;
    if (diffDays < 31) return `${Math.floor(diffDays / 7)} minggu yang lalu`;
    if (diffDays < 366) return `${Math.floor(diffDays / 30)} bulan yang lalu`;
    return `${Math.floor(diffDays / 365)} tahun yang lalu`;
  };

  const getBookingSummary = (bookingId: string | number | null | undefined) => {
    if (!bookingId) return "-";
    const found = bookings?.find(
      (b: any) => b.booking_id?.toString() === bookingId?.toString()
    );
    if (!found) return bookingId?.toString() || "-";
    return `${found.nama_pawrent} - ${found.title_dokter} ${found.nama_dokter} - ${new Date(found.tanggal_booking).toLocaleDateString("id-ID")} ${found.waktu_booking} - ${found.nama_hewan}`;
  };

  // useEffect(() => {
  //   if (showCombinedDialog) {
  //     layananApi.getAll(token!).then(setLayananList);
  //   }
  // }, [showCombinedDialog, token]);

  // useEffect(() => {
  //   if (!showCombinedDialog) {
  //     setObatForm({
  //       kunjungan_id: null,
  //       obat_id: "",
  //       qty: "",
  //       dosis: "",
  //       frekuensi: "",
  //     });
  //     setSelectedLayanan("");
  //     setNewKunjunganId(null);
  //   }
  // }, [showCombinedDialog]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = editingKunjungan ? {
      ...editingKunjungan, // Gunakan data asli untuk memastikan konsistensi
      hewan_id: formData.hewan_id || editingKunjungan.hewan_id,
      dokter_id: formData.dokter_id || editingKunjungan.dokter_id,
      tanggal_kunjungan: formData.tanggal_kunjungan || editingKunjungan.tanggal_kunjungan,
      waktu_kunjungan: formData.waktu_kunjungan || editingKunjungan.waktu_kunjungan,
      catatan: formData.catatan !== undefined ? formData.catatan : editingKunjungan.catatan,
      metode_pembayaran: formData.metode_pembayaran || editingKunjungan.metode_pembayaran,
      kunjungan_sebelumnya: formData.kunjungan_sebelumnya === "none" ? null : (formData.kunjungan_sebelumnya || editingKunjungan.kunjungan_sebelumnya),
      booking_id: formData.booking_id === "none" ? null : (formData.booking_id || editingKunjungan.booking_id),
      klinik_id: user?.klinik_id || editingKunjungan.klinik_id, // Override dengan user.klinik_id
    } : {
      klinik_id: user?.klinik_id, // Set otomatis
      hewan_id: formData.hewan_id,
      dokter_id: formData.dokter_id,
      tanggal_kunjungan: formData.tanggal_kunjungan,
      waktu_kunjungan: formData.waktu_kunjungan,
      catatan: formData.catatan,
      metode_pembayaran: formData.metode_pembayaran,
      // --- MODIFIKASI: Kembalikan data kunjungan_sebelumnya ---
      kunjungan_sebelumnya:
        formData.kunjungan_sebelumnya === "none"
          ? null
          : formData.kunjungan_sebelumnya || null,
      booking_id:
        formData.booking_id === "none"
          ? null
          : formData.booking_id || null,
    };

    const requiredChecks: { key: keyof typeof submitData; label: string }[] = [
      { key: "klinik_id", label: "Klinik" },
      { key: "hewan_id", label: "Hewan" },
      { key: "dokter_id", label: "Dokter" },
      { key: "tanggal_kunjungan", label: "Tanggal Kunjungan" },
      { key: "waktu_kunjungan", label: "Waktu Kunjungan" },
      { key: "metode_pembayaran", label: "Metode Pembayaran" },
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

    // Validasi layanan wajib minimal 1 (total existing + selected)
    const totalLayanans = existingLayanans.length + formData.selectedLayanans.length;
    if (totalLayanans === 0) {
      toast.error("Minimal 1 layanan wajib dipilih");
      return;
    }

    // Validasi obat jika diisi
    for (const obat of formData.obatForms) {
      if (obat.obat_id && (!obat.qty || parseInt(obat.qty) <= 0)) {
        toast.error("Qty obat harus > 0 jika obat dipilih");
        return;
      }
    }

    // --- MODIFIKASI: Kembalikan validasi riwayat ---
    if (
      hewanHistory.length > 0 &&
      !editingKunjungan &&
      (formData.kunjungan_sebelumnya === "" ||
        formData.kunjungan_sebelumnya === null ||
        formData.kunjungan_sebelumnya === undefined)
    ) {
      toast.error("Silakan pilih kunjungan sebelumnya atau pilih 'Tidak Ada'");
      return;
    }

    console.log("Submitting kunjungan data:", submitData);
    saveMutation.mutate(submitData);
  };

  // Fungsi untuk menghitung total biaya real-time
  const calculateTotalBiayaRealtime = () => {
    let total = 0;
    // Hitung layanan
    for (const layanan of formData.selectedLayanans) {
      const layananData = layananList?.find((l: any) => l.kode_layanan === layanan.kode_layanan);
      if (layananData) {
        total += parseFloat(layananData.biaya_layanan || 0);
      }
    }
    // Hitung obat
    for (const obat of formData.obatForms) {
      if (obat.obat_id && obat.qty) {
        const obatData = obatList?.find((o: any) => o.obat_id.toString() === obat.obat_id);
        if (obatData) {
          total += parseFloat(obatData.harga_obat || 0) * parseInt(obat.qty);
        }
      }
    }
    return total;
  };

  // Fungsi untuk menambah layanan
  const addLayanan = () => {
    setFormData((prev) => ({
      ...prev,
      selectedLayanans: [...prev.selectedLayanans, { kode_layanan: "" }],
    }));
  };

  // Fungsi untuk menghapus layanan
  const removeLayanan = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      selectedLayanans: prev.selectedLayanans.filter((_, i) => i !== index),
    }));
  };

  // Fungsi untuk update layanan
  const updateLayanan = (index: number, kode_layanan: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedLayanans: prev.selectedLayanans.map((l, i) =>
        i === index ? { kode_layanan } : l
      ),
    }));
  };

  // Fungsi untuk menambah obat
  const addObat = () => {
    setFormData((prev) => ({
      ...prev,
      obatForms: [...prev.obatForms, { obat_id: "", qty: "", dosis: "", frekuensi: "" }],
    }));
  };

  // Fungsi untuk menghapus obat
  const removeObat = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      obatForms: prev.obatForms.filter((_, i) => i !== index),
    }));
  };

  // Fungsi untuk update obat
  const updateObat = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      obatForms: prev.obatForms.map((o, i) =>
        i === index ? { ...o, [field]: value } : o
      ),
    }));
  };

  // Tambahkan fungsi deleteExistingLayanan dan deleteExistingObat
  const deleteExistingLayanan = async (kunjunganId: number, kodeLayanan: string) => {
    try {
      await layananApi.getByKunjungan(kunjunganId, token!); // Gunakan endpoint delete yang sudah ada di kunjungan-layanan.ts
      // Asumsi API delete adalah: DELETE /kunjungan-layanan/:kunjunganId/:kodeLayanan
      // Jika belum ada, tambahkan di backend. Untuk sekarang, gunakan fetch langsung.
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/kunjungan-layanan/${kunjunganId}/${kodeLayanan}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Gagal menghapus layanan');
      setExistingLayanans((prev) => prev.filter((l) => l.kode_layanan !== kodeLayanan));
      toast.success('Layanan berhasil dihapus');
    } catch (error) {
      toast.error('Gagal menghapus layanan');
    }
  };

const deleteExistingObat = async (kunjungan_obat_id: number) => {
  try {
    // PERBAIKI: Gunakan kunjunganObatApi.delete dengan kunjungan_obat_id
    await kunjunganObatApi.delete(kunjungan_obat_id, token!);
    // PERBAIKI: Filter berdasarkan kunjungan_obat_id
    setExistingObats((prev) => prev.filter((o) => o.kunjungan_obat_id !== kunjungan_obat_id));
    toast.success('Obat berhasil dihapus');
  } catch (error) {
    toast.error('Gagal menghapus obat');
  }
};

  // Tambahkan fungsi calculateTotalBiaya untuk tabel
  const calculateTotalBiaya = (layanan_kunjungan: any[], obat_kunjungan: any[]) => {
    const totalLayanan = layanan_kunjungan?.reduce((sum, l) => sum + ((l.harga_saat_itu || 0) * (l.qty || 1)), 0) || 0; // Perbaiki: kalikan dengan qty
    const totalObat = obat_kunjungan?.reduce((sum, o) => sum + ((o.qty || 0) * (o.harga_saat_itu || 0)), 0) || 0;
    return totalLayanan + totalObat;
  };

  // Fungsi untuk menghitung total biaya riwayat
  const calculatePreviousTotal = () => {
    const layananTotal = previousLayanan.reduce((sum, l) => {
      // Gunakan harga_saat_itu jika ada dan > 0, jika tidak gunakan biaya_layanan dari master
      const harga = (l.harga_saat_itu && l.harga_saat_itu > 0) ? l.harga_saat_itu : (layananList?.find(list => list.kode_layanan === l.kode_layanan)?.biaya_layanan || 0);
      return sum + (harga * (l.qty || 1));
    }, 0);
    const obatTotal = previousObat.reduce((sum, o) => sum + ((o.harga_saat_itu || 0) * (o.qty || 0)), 0);
    return layananTotal + obatTotal;
  };

  // Tambahkan state untuk data layanan dan obat kunjungan
  const [layananKunjungan, setLayananKunjungan] = useState<any[]>([]);
  const [obatKunjungan, setObatKunjungan] = useState<any[]>([]);
  const [previousLayanan, setPreviousLayanan] = useState<any[]>([]);
  const [previousObat, setPreviousObat] = useState<any[]>([]);

  // useEffect untuk fetch layanan dan obat saat viewingKunjungan berubah
  useEffect(() => {
    if (viewingKunjungan) {
      const fetchLayananObat = async () => {
        try {
          // Fetch layanan untuk kunjungan ini
          const layananResponse = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/kunjungan-layanan/kunjungan/${viewingKunjungan.kunjungan_id}`, // Perbaiki endpoint
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (layananResponse.ok) {
            const layananData = await layananResponse.json();
            setLayananKunjungan(layananData);
          } else {
            console.error("Failed to fetch layanan:", layananResponse.statusText);
            setLayananKunjungan([]);
          }

          // Fetch obat untuk kunjungan ini
          const obatResponse = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/kunjungan-obat/kunjungan/${viewingKunjungan.kunjungan_id}`, // Perbaiki endpoint
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (obatResponse.ok) {
            const obatData = await obatResponse.json();
            setObatKunjungan(obatData);
          } else {
            console.error("Failed to fetch obat:", obatResponse.statusText);
            setObatKunjungan([]);
          }
        } catch (error) {
          console.error("Error fetching layanan/obat:", error);
          setLayananKunjungan([]);
          setObatKunjungan([]);
        }
      };
      fetchLayananObat();
    } else {
      setLayananKunjungan([]);
      setObatKunjungan([]);
    }
  }, [viewingKunjungan, token]);

  useEffect(() => {
    if (viewingPreviousVisit) {
      const fetchPreviousData = async () => {
        try {
          const [layananRes, obatRes] = await Promise.all([
            fetch(`${import.meta.env.VITE_API_BASE_URL}/api/kunjungan-layanan/kunjungan/${viewingPreviousVisit.kunjungan_id}`, { // Perbaiki endpoint
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(`${import.meta.env.VITE_API_BASE_URL}/api/kunjungan-obat/kunjungan/${viewingPreviousVisit.kunjungan_id}`, { // Perbaiki endpoint
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);
          if (layananRes.ok) setPreviousLayanan(await layananRes.json());
          if (obatRes.ok) setPreviousObat(await obatRes.json());
        } catch (error) {
          console.error("Error fetching previous data:", error);
          setPreviousLayanan([]);
          setPreviousObat([]);
        }
      };
      fetchPreviousData();
    } else {
      setPreviousLayanan([]);
      setPreviousObat([]);
    }
  }, [viewingPreviousVisit, token]);

  if (
    isLoading ||
    bookingsLoading ||
    hewansLoading ||
    allDoktersLoading ||
    layananListLoading ||
    obatListLoading
  ) {
    return (
      <DashboardLayout title="Kelola Kunjungan">
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
    <DashboardLayout title="Kelola Kunjungan" showBackButton={true}>
      <div className="space-y-6">
        {/* Header Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <Stethoscope className="h-6 w-6" />
              Kelola Kunjungan Medis
            </CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300">
              Pantau dan kelola semua kunjungan pasien hewan di klinik
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Daftar Kunjungan Medis
            </CardTitle>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" /> Tambah Kunjungan
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Hewan</TableHead>
                  <TableHead>Pemilik</TableHead>
                  <TableHead>Dokter</TableHead>
                  <TableHead>Catatan</TableHead>
                  <TableHead>Pembayaran</TableHead>
                  <TableHead className="text-right">Total Biaya</TableHead>
                  <TableHead className="text-center">Detail</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kunjungans?.map((k) => (
                  <TableRow key={k.kunjungan_id}>
                    <TableCell>
                      <div className="flex flex-col">
<span className="font-medium">
  {(() => {
    const date = new Date(k.tanggal_kunjungan);
    
    // Parse waktu kunjungan (format HH:MM)
    const [hours, minutes] = k.waktu_kunjungan.split(':').map(Number);
    
    // Set waktu ke date object
    date.setHours(hours, minutes, 0, 0);
    
    // Kurangi 10 jam 50 menit (dalam milidetik)
    const adjustedDate = new Date(date.getTime() - (10 * 60 + 50) * 60 * 1000);
    
    // Format tanggal dan waktu
    const formattedDate = adjustedDate.toLocaleDateString("id-ID");
    const formattedTime = adjustedDate.toLocaleTimeString("id-ID", {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    return `${formattedDate} - ${formattedTime}`;
  })()}
</span>
                        {k.kunjungan_sebelumnya && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 mt-1 text-xs text-primary hover:text-primary"
                                  onClick={() =>
                                    handleViewPreviousVisitFromTable(
                                      k.kunjungan_sebelumnya
                                    )
                                  }
                                >
                                  <Info className="h-3 w-3 mr-1" /> Kunjungan
                                  Sebelumnya
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  Klik untuk melihat detail kunjungan sebelumnya
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{k.nama_hewan}</TableCell>
                    <TableCell>{k.nama_pawrent}</TableCell>
                    <TableCell>
                      {k.title_dokter || ""} {k.nama_dokter}
                    </TableCell>
                    <TableCell>
                      <div
                        className="max-w-[200px] truncate"
                        title={k.catatan}
                      >
                        {k.catatan || "-"}
                      </div>
                    </TableCell>
                    <TableCell>{getMetodeBadge(k.metode_pembayaran)}</TableCell>
                    <TableCell className="font-semibold text-right text-green-600">
                      Rp {k.total_biaya?.toLocaleString('id-ID', { maximumFractionDigits: 0 }) || '0'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetail(k)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(k)}
                          disabled={allDoktersLoading}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (
                              confirm("Yakin ingin menghapus kunjungan ini?")
                            ) {
                              deleteMutation.mutate(k.kunjungan_id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
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
                {editingKunjungan
                  ? "Edit Kunjungan"
                  : "Tambah Kunjungan Baru"}
              </DialogTitle>
              <DialogDescription>
                {editingKunjungan
                  ? "Update informasi kunjungan medis"
                  : "Masukkan informasi kunjungan medis baru"}
              </DialogDescription>
            </DialogHeader>

            {!editingKunjungan && (
              <div className="flex w-full bg-muted p-1 rounded-md">
                <Button
                  variant={mode === "manual" ? "primary" : "ghost"}
                  className="w-1/2"
                  onClick={() => handleModeChange("manual")}
                >
                  Input Manual
                </Button>
                <Button
                  variant={mode === "booking" ? "primary" : "ghost"}
                  className="w-1/2"
                  onClick={() => handleModeChange("booking")}
                >
                  Dari Booking
                </Button>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                {/* --- BAGIAN BOOKING --- */}
                {mode === "booking" && (
                  <>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="booking" className="text-right">
                        Pilih Booking
                      </Label>
                      <Select
                        value={formData.booking_id || ""}
                        onValueChange={handleBookingChange}
                      >
                        <SelectTrigger id="booking" className="col-span-3">
                          <SelectValue placeholder="Pilih dari data booking" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Tidak ada (manual)</SelectItem>
                          {bookings?.map((booking: any) => (
                            <SelectItem
                              key={booking.booking_id}
                              value={booking.booking_id.toString()}
                            >
                              {`${booking.nama_pawrent || 'Pawrent Tidak Diketahui'} - ${
                                (booking.title_dokter || '') + ' ' + (booking.nama_dokter || 'Dokter Tidak Diketahui')
                              } - ${new Date(booking.tanggal_booking).toLocaleDateString("id-ID")} ${
                                booking.waktu_booking || '00:00'
                              } - ${booking.nama_hewan || 'Hewan Tidak Diketahui'}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Data di bawah ini akan terisi otomatis dari booking */}
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="klinik-booking" className="text-right">
                        Klinik
                      </Label>
                      <Input
                        id="klinik-booking"
                        value="Klinik Anda" // Tampilkan sebagai disabled
                        disabled
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="hewan-booking" className="text-right">
                        Hewan
                      </Label>
                      <Input
                        id="hewan-booking"
                        value={
                          hewans?.find(
                            (h: any) =>
                              h.hewan_id.toString() === formData.hewan_id
                          )?.nama_hewan || ""
                        }
                        disabled
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="dokter-booking" className="text-right">
                        Dokter
                      </Label>
                      <Input
                        id="dokter-booking"
                        value={(() => {
                          const dr = allDoktersData?.find(
                            (d: any) => d.dokter_id.toString() === formData.dokter_id
                          );
                          return dr
                            ? `${dr.title_dokter || ""} ${dr.nama_dokter}`
                            : "";
                        })()}
                        disabled
                        className="col-span-3"
                      />
                    </div>
                  </>
                )}

                {/* --- BAGIAN MANUAL (ADD NEW & EDIT) --- */}
                {mode === "manual" && (
                  <>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="klinik-manual" className="text-right">
                        Klinik
                      </Label>
                      <Input
                        id="klinik-manual"
                        value="Klinik Anda" // Tampilkan sebagai disabled
                        disabled
                        className="col-span-3"
                      />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="hewan-manual" className="text-right">
                        Hewan
                      </Label>
                      <Select
                        value={selectedHewan}
                        onValueChange={handleHewanChange}
                      >
                        <SelectTrigger id="hewan-manual" className="col-span-3">
                          <SelectValue placeholder="Pilih Hewan" />
                        </SelectTrigger>
                        <SelectContent>
                          {hewans?.map((hewan: any) => (
                            <SelectItem
                              key={hewan.hewan_id}
                              value={hewan.hewan_id.toString()}
                            >
                              {hewan.nama_hewan} ({hewan.nama_pawrent})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="dokter-manual" className="text-right">
                        Dokter
                      </Label>
                      <Select
                        value={formData.dokter_id || ""}
                        onValueChange={(value) =>
                          setFormData({ ...formData, dokter_id: value })
                        }
                      >
                        <SelectTrigger
                          id="dokter-manual"
                          className="col-span-3"
                        >
                          <SelectValue placeholder="Pilih Dokter" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredDokters.map((dokter: any) => (
                            <SelectItem
                              key={dokter.dokter_id}
                              value={dokter.dokter_id.toString()}
                            >
                              {`${dokter.title_dokter || ""} ${
                                dokter.nama_dokter
                              }`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {/* --- MODIFIKASI: Pindahkan blok Riwayat Kunjungan ke sini agar muncul di kedua mode --- */}
                {hewanHistory.length > 0 && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label
                      htmlFor="kunjungan-sebelumnya"
                      className="text-right"
                    >
                      Riwayat Kunjungan
                    </Label>
                    <div className="col-span-3 flex items-center gap-2">
                      <Select
                        value={formData.kunjungan_sebelumnya || "none"}
                        onValueChange={handlePreviousVisitChange}
                      >
                        <SelectTrigger id="kunjungan-sebelumnya">
                          <SelectValue placeholder="Pilih riwayat kunjungan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            Tidak Ada / Kunjungan Baru
                          </SelectItem>
                          {hewanHistory.map((visit) => (
                            <SelectItem
                              key={visit.kunjungan_id}
                              value={visit.kunjungan_id.toString()}
                            >
                              {`${new Date(
                                visit.tanggal_kunjungan
                              ).toLocaleDateString("id-ID")} - ${
                                visit.title_dokter || ""
                              } ${visit.nama_dokter} - ${calculateDaysSince(
                                visit.tanggal_kunjungan
                              )}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={
                          !selectedPreviousVisit ||
                          formData.kunjungan_sebelumnya === "none"
                        }
                        onClick={() =>
                          handleViewPreviousVisit(
                            selectedPreviousVisit.kunjungan_id
                          )
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* --- FIELD UMUM (Tanggal, Waktu, Catatan, Pembayaran) --- */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tanggal" className="text-right">
                    Tanggal Kunjungan
                  </Label>
                  <Input
                    id="tanggal"
                    type="date"
                    value={formData.tanggal_kunjungan}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tanggal_kunjungan: e.target.value,
                      })
                    }
                    className="col-span-3"
                    disabled={mode === "booking"}
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="waktu" className="text-right">
                    Waktu Kunjungan
                  </Label>
                  <Input
                    id="waktu"
                    type="time"
                    value={formData.waktu_kunjungan}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        waktu_kunjungan: e.target.value,
                      })
                    }
                    className="col-span-3"
                    disabled={mode === "booking"}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="catatan" className="text-right">
                    Catatan/Keluhan
                  </Label>
                  <Input
                    id="catatan"
                    value={formData.catatan}
                    onChange={(e) =>
                      setFormData({ ...formData, catatan: e.target.value })
                    }
                    className="col-span-3"
                    placeholder="Masukkan keluhan awal..."
                    disabled={mode === "booking" && !!formData.catatan}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="metode_pembayaran" className="text-right">
                    Metode Pembayaran
                  </Label>
                  <Select
                    value={formData.metode_pembayaran}
                    onValueChange={(value) =>
                      setFormData({ ...formData, metode_pembayaran: value })
                    }
                  >
                    <SelectTrigger id="metode_pembayaran" className="col-span-3">
                      <SelectValue placeholder="Pilih metode pembayaran" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Transfer">Transfer</SelectItem>
                      <SelectItem value="E-Wallet">E-Wallet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Bagian Layanan dan Obat - Tampil untuk kedua mode */}
                <div className="border-t pt-4 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Layanan dan Obat</h3>
                    <div className="text-sm text-muted-foreground">
                      Total Biaya: <span className="font-bold text-green-600">Rp {calculateTotalBiayaRealtime().toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>

                  {/* Layanan Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Layanan *</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addLayanan}>
                        <Plus className="h-4 w-4 mr-1" /> Tambah Layanan
                      </Button>
                    </div>
                    {editingKunjungan && existingLayanans.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-base font-medium">Layanan yang Sudah Ada</Label>
                        {existingLayanans.map((layanan) => (
                          <div key={layanan.layanan_id} className="flex items-center justify-between p-3 border rounded-md bg-blue-50 dark:bg-blue-950/20">
                            <div>
                              <p className="font-medium">{layanan.nama_layanan}</p>
                              <p className="text-sm text-muted-foreground">Qty: {layanan.qty} - Harga: Rp {layanan.harga_saat_itu.toLocaleString('id-ID')}</p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteExistingLayanan(viewingKunjungan?.kunjungan_id || editingKunjungan.kunjungan_id, layanan.kode_layanan)}
                            >
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    {formData.selectedLayanans.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground border-2 border-dashed rounded-md">
                        Belum ada layanan dipilih. Klik "Tambah Layanan" untuk menambah.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {formData.selectedLayanans.map((layanan, index) => {
                          const layananData = layananList?.find((l: any) => l.kode_layanan === layanan.kode_layanan);
                          return (
                            <div key={index} className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                              <Select
                                value={layanan.kode_layanan}
                                onValueChange={(value) => updateLayanan(index, value)}
                              >
                                <SelectTrigger className="flex-1">
                                  <SelectValue placeholder="Pilih layanan..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {layananList?.map((l: any) => (
                                    <SelectItem key={l.kode_layanan} value={l.kode_layanan}>
                                      {l.nama_layanan} - Rp {parseFloat(l.biaya_layanan || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {layananData && (
                                <div className="text-sm font-medium text-green-600">
                                  Rp {parseFloat(layananData.biaya_layanan || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                                </div>
                              )}
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeLayanan(index)}>
                                <X className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Obat Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Resep Obat (Opsional)</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addObat}>
                        <Plus className="h-4 w-4 mr-1" /> Tambah Obat
                      </Button>
                    </div>
                    {editingKunjungan && existingObats.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-base font-medium">Obat yang Sudah Ada</Label>
                        {existingObats.map((obat) => (
                        <Card key={obat.kunjungan_obat_id} className="p-4">
                            <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">{obat.nama_obat}</p>
                                <p className="text-sm text-muted-foreground">
                                Qty: {obat.qty} - Dosis: {obat.dosis} - Frekuensi: {obat.frekuensi} - Harga: Rp {obat.harga_saat_itu.toLocaleString('id-ID')}
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                // PERBAIKI: Gunakan obat.kunjungan_obat_id
                                onClick={() => deleteExistingObat(obat.kunjungan_obat_id)}
                            >
                                <X className="h-4 w-4 text-destructive" />
                            </Button>
                            </div>
                        </Card>
                        ))}

                      </div>
                    )}
                    {formData.obatForms.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground border-2 border-dashed rounded-md">
                        Belum ada obat ditambahkan. Klik "Tambah Obat" untuk menambah resep.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {formData.obatForms.map((obat, index) => {
                          const obatData = obatList?.find((o: any) => o.obat_id.toString() === obat.obat_id);
                          return (
                            <Card key={index} className="p-4">
                              <div className="flex items-start gap-4">
                                <div className="flex-1 space-y-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <Label>Obat</Label>
                                      <Select
                                        value={obat.obat_id}
                                        onValueChange={(value) => updateObat(index, 'obat_id', value)}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Pilih obat..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {obatList?.map((o: any) => (
                                            <SelectItem key={o.obat_id} value={o.obat_id.toString()}>
                                              {o.nama_obat} - Rp {parseFloat(o.harga_obat || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label>Qty</Label>
                                      <Input
                                        type="number"
                                        min="1"
                                        value={obat.qty}
                                        onChange={(e) => updateObat(index, 'qty', e.target.value)}
                                        placeholder="1"
                                      />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <Label>Dosis</Label>
                                      <Input
                                        value={obat.dosis}
                                        onChange={(e) => updateObat(index, 'dosis', e.target.value)}
                                        placeholder="500mg"
                                      />
                                    </div>
                                    <div>
                                      <Label>Frekuensi</Label>
                                      <Input
                                        value={obat.frekuensi}
                                        onChange={(e) => updateObat(index, 'frekuensi', e.target.value)}
                                        placeholder="3x sehari"
                                      />
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right space-y-2">
                                  {obatData && obat.qty && (
                                    <div className="text-sm">
                                      <div className="font-medium">Harga per unit:</div>
                                      <div className="text-green-600">Rp {parseFloat(obatData.harga_obat || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</div>
                                      <div className="font-medium mt-1">Total:</div>
                                      <div className="text-lg font-bold text-green-600">
                                        Rp {(parseFloat(obatData.harga_obat || 0) * parseInt(obat.qty || '0')).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                                      </div>
                                    </div>
                                  )}
                                  <Button type="button" variant="ghost" size="sm" onClick={() => removeObat(index)}>
                                    <X className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
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
                    : editingKunjungan
                    ? "Simpan Perubahan"
                    : "Simpan Kunjungan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog Detail Kunjungan */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Detail Kunjungan #{viewingKunjungan?.kunjungan_id}
              </DialogTitle>
              <DialogDescription>
                Informasi lengkap kunjungan medis
              </DialogDescription>
            </DialogHeader>
            {viewingKunjungan && (
              <div className="space-y-6">
                {/* Info Kunjungan */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Informasi Kunjungan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="font-semibold">Tanggal & Waktu</Label>
                          <p>
                            {(() => {
                              const date = new Date(viewingKunjungan.tanggal_kunjungan);
                              
                              // Parse waktu kunjungan
                              const [hours, minutes] = viewingKunjungan.waktu_kunjungan.split(':').map(Number);
                              date.setHours(hours, minutes, 0, 0);
                              
                              // Kurangi 10 jam 50 menit
                              const adjustedDate = new Date(date.getTime() - (10 * 60 + 50) * 60 * 1000);
                              
                              const formattedDate = adjustedDate.toLocaleDateString("id-ID");
                              const formattedTime = adjustedDate.toLocaleTimeString("id-ID", {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              });
                              
                              return `${formattedDate} - ${formattedTime}`;
                            })()}
                          </p>
                      </div>
                      <div>
                        <Label className="font-semibold">Hewan</Label>
                        <p>{viewingKunjungan.nama_hewan || "Tidak ada data"}</p>
                      </div>
                      <div>
                        <Label className="font-semibold">Pemilik</Label>
                        <p>{viewingKunjungan.nama_pawrent || "Tidak ada data"}</p>
                      </div>
                      <div>
                        <Label className="font-semibold">Dokter</Label>
                        <p>{viewingKunjungan.title_dokter} {viewingKunjungan.nama_dokter}</p>
                      </div>
                      <div>
                        <Label className="font-semibold">Metode Pembayaran</Label>
                        <div>{getMetodeBadge(viewingKunjungan.metode_pembayaran)}</div>
                      </div>
                      <div>
                        <Label className="font-semibold">Total Biaya</Label>
                        <p>Rp {calculateTotalBiaya(layananKunjungan, obatKunjungan).toLocaleString("id-ID", { maximumFractionDigits: 0 })}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="font-semibold">Catatan/Keluhan</Label>
                      <p>{viewingKunjungan.catatan || "Tidak ada catatan"}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Layanan */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-600" />
                      Layanan ({layananKunjungan.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {layananKunjungan.length > 0 ? (
                      <div className="space-y-3">
                        {layananKunjungan.map((l: any) => (
                          <div key={l.layanan_id} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              <div>
                                <p className="font-medium text-blue-900 dark:text-blue-100">{l.nama_layanan}</p>
                                <p className="text-sm text-muted-foreground">Qty: {l.qty}</p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Rp {l.harga_saat_itu.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                            </Badge>
                          </div>
                        ))}
                        <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                          <div className="flex justify-between items-center font-semibold text-blue-900 dark:text-blue-100">
                            <span>Total Layanan:</span>
                            <span>Rp {layananKunjungan.reduce((sum, l) => sum + ((l.harga_saat_itu || 0) * (l.qty || 1)), 0).toLocaleString("id-ID", { maximumFractionDigits: 0 })}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Tidak ada layanan yang tercatat</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Obat */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Pill className="h-5 w-5 text-green-600" />
                      Resep Obat ({obatKunjungan.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {obatKunjungan.length > 0 ? (
                      <div className="space-y-3">
                        {obatKunjungan.map((o: any) => (
                          <div key={o.kunjungan_obat_id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                              <div>
                                <p className="font-medium text-green-900 dark:text-green-100">{o.nama_obat}</p>
                                <p className="text-sm text-muted-foreground">
                                  Qty: {o.qty} • Dosis: {o.dosis} • Frekuensi: {o.frekuensi}
                                </p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Rp {(o.harga_saat_itu * o.qty).toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                            </Badge>
                          </div>
                        ))}
                        <div className="pt-2 border-t border-green-200 dark:border-green-800">
                          <div className="flex justify-between items-center font-semibold text-green-900 dark:text-green-100">
                            <span>Total Obat:</span>
                            <span>Rp {obatKunjungan.reduce((sum, o) => sum + ((o.harga_saat_itu || 0) * (o.qty || 0)), 0).toLocaleString("id-ID", { maximumFractionDigits: 0 })}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Pill className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Tidak ada resep obat</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Detail Riwayat Kunjungan */}
        <Dialog
          open={isPreviousVisitDialogOpen}
          onOpenChange={setIsPreviousVisitDialogOpen}
        >
  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detail Riwayat Kunjungan</DialogTitle>
              {viewingPreviousVisit && (
                <DialogDescription>
                  Kunjungan pada{" "}
                  {new Date(
                    viewingPreviousVisit.tanggal_kunjungan
                  ).toLocaleDateString("id-ID")}{" "}
                  (
                  {calculateDaysSince(
                    viewingPreviousVisit.tanggal_kunjungan
                  )}
                  )
                </DialogDescription>
              )}
           
            </DialogHeader>
            {viewingPreviousVisit && (
              <div className="space-y-6">
                {/* Info Kunjungan Riwayat */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Informasi Kunjungan Riwayat
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="font-semibold">Tanggal & Waktu</Label>
<p>
  {(() => {
    const date = new Date(viewingPreviousVisit.tanggal_kunjungan);
    
    // Parse waktu kunjungan
    const [hours, minutes] = viewingPreviousVisit.waktu_kunjungan.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);
    
    // Kurangi 10 jam 50 menit
    const adjustedDate = new Date(date.getTime() - (10 * 60 + 50) * 60 * 1000);
    
    const formattedDate = adjustedDate.toLocaleDateString("id-ID");
    const formattedTime = adjustedDate.toLocaleTimeString("id-ID", {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    return `${formattedDate} - ${formattedTime}`;
  })()}
</p>
                      </div>
                      <div>
                        <Label className="font-semibold">Hewan</Label>
                        <p>{viewingPreviousVisit.nama_hewan}</p>
                      </div>
                      <div>
                        <Label className="font-semibold">Dokter</Label>
                        <p>{viewingPreviousVisit.title_dokter || ""} {viewingPreviousVisit.nama_dokter}</p>
                      </div>
                      <div>
                        <Label className="font-semibold">Total Biaya</Label>
                        <p>Rp {calculatePreviousTotal().toLocaleString("id-ID", { maximumFractionDigits: 0 })}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="font-semibold">Catatan/Keluhan</Label>
                      <p>{viewingPreviousVisit.catatan || "Tidak ada catatan"}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Layanan Riwayat */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-600" />
                      Layanan ({previousLayanan.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {previousLayanan.length > 0 ? (
                      <div className="space-y-3">
                        {previousLayanan.map((l: any) => {
                          // Fallback harga jika harga_saat_itu tidak ada atau 0
                          const harga = (l.harga_saat_itu && l.harga_saat_itu > 0) ? l.harga_saat_itu : (layananList?.find(list => list.kode_layanan === l.kode_layanan)?.biaya_layanan || 0);
                          const totalHarga = harga * (l.qty || 1);
                          return (
                            <div key={l.layanan_id} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                <div>
                                  <p className="font-medium text-blue-900 dark:text-blue-100">{l.nama_layanan}</p>
                                  <p className="text-sm text-muted-foreground">Qty: {l.qty}</p>
                                </div>
                              </div>
                              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                Rp {totalHarga.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                              </Badge>
                            </div>
                          );
                        })}
                        <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                          <div className="flex justify-between items-center font-semibold text-blue-900 dark:text-blue-100">
                            <span>Total Layanan:</span>
                            <span>Rp {previousLayanan.reduce((sum, l) => {
                              const harga = (l.harga_saat_itu && l.harga_saat_itu > 0) ? l.harga_saat_itu : (layananList?.find(list => list.kode_layanan === l.kode_layanan)?.biaya_layanan || 0);
                              return sum + (harga * (l.qty || 1));
                            }, 0).toLocaleString("id-ID", { maximumFractionDigits: 0 })}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Tidak ada layanan yang tercatat</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Obat Riwayat */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Pill className="h-5 w-5 text-green-600" />
                      Resep Obat ({previousObat.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {previousObat.length > 0 ? (
                      <div className="space-y-3">
                        {previousObat.map((o: any) => (
                          <div key={o.kunjungan_obat_id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                              <div>
                                <p className="font-medium text-green-900 dark:text-green-100">{o.nama_obat}</p>
                                <p className="text-sm text-muted-foreground">
                                  Qty: {o.qty} • Dosis: {o.dosis} • Frekuensi: {o.frekuensi}
                                </p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Rp {(o.harga_saat_itu * o.qty).toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                            </Badge>
                          </div>
                        ))}
                        <div className="pt-2 border-t border-green-200 dark:border-green-800">
                          <div className="flex justify-between items-center font-semibold text-green-900 dark:text-green-100">
                            <span>Total Obat:</span>
                            <span>Rp {previousObat.reduce((sum, o) => sum + ((o.harga_saat_itu || 0) * (o.qty || 0)), 0).toLocaleString("id-ID", { maximumFractionDigits: 0 })}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Pill className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Tidak ada resep obat</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsPreviousVisitDialogOpen(false)}
              >
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminKlinikKunjunganPage;