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
// --- MODIFIKASI: Tambahkan 'useMemo' ---
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
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

const KunjunganPage = () => {
  const { token } = useAuth();
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
    klinik_id: "",
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

  const [mode, setMode] = useState<"manual" | "booking">("manual");

  const [showLayananDialog, setShowLayananDialog] = useState(false);
  const [showObatDialog, setShowObatDialog] = useState(false);
  // Hapus state showCombinedDialog, newKunjunganId, selectedLayanan, layananList, obatForm

  // Queries
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      const result = await bookingApi.getAll(token!);
      return result as any[];
    },
  });

  const { data: kunjungans, isLoading } = useQuery({
    queryKey: ["kunjungans"],
    queryFn: async () => {
      const result = await kunjunganApi.getAll(token!);
      return result as any[];
    },
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

  const { data: kliniksData, isLoading: kliniksLoading } = useQuery({
    queryKey: ["kliniks"],
    queryFn: async () => {
      const result = await klinikApi.getAll(token!);
      return result as any[];
    },
  });

  const filteredDokters = useMemo(() => {
    if (!formData.klinik_id || !allDoktersData) {
      return [];
    }
    return allDoktersData.filter(
      (dokter: any) => dokter.klinik_id.toString() === formData.klinik_id
    );
  }, [formData.klinik_id, allDoktersData]);

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
      if (editingKunjungan) {
        return kunjunganApi.update(editingKunjungan.kunjungan_id, data, token!);
      }
      return kunjunganApi.create(data, token!);
    },
    onSuccess: async (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["kunjungans"] });
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
      queryClient.invalidateQueries({ queryKey: ["kunjungans"] });
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
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000/api"
        }/kunjungan/hewan/${hewanId}/history`,
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

  const handleOpenDialog = (kunjungan?: any) => {
    if (kunjungan) {
      // --- MODE EDIT ---
      setEditingKunjungan(kunjungan);
      setMode("manual");

      const dokter = allDoktersData?.find(
        (d: any) => d.dokter_id === kunjungan.dokter_id
      );

      setFormData({
        klinik_id: dokter ? dokter.klinik_id.toString() : "",
        hewan_id: kunjungan.hewan_id?.toString() || "",
        dokter_id: kunjungan.dokter_id?.toString() || "",
        tanggal_kunjungan: kunjungan.tanggal_kunjungan?.split("T")[0] || "",
        waktu_kunjungan: kunjungan.waktu_kunjungan || "",
        catatan: kunjungan.catatan || "",
        metode_pembayaran: kunjungan.metode_pembayaran || "Cash",
        // --- MODIFIKASI: Kembalikan data kunjungan_sebelumnya ---
        kunjungan_sebelumnya: kunjungan.kunjungan_sebelumnya?.toString() || "",
        booking_id: kunjungan.booking_id?.toString() || "none",
        selectedLayanans: [], // Reset, atau populate dari data jika ada
        obatForms: [],
      });
      if (kunjungan.hewan_id) {
        // Panggil versi async
        handleHewanChange(kunjungan.hewan_id.toString());
      }
    } else {
      // --- MODE TAMBAH BARU ---
      setEditingKunjungan(null);
      setMode("manual");
      const today = new Date().toISOString().split("T")[0];
      const now = new Date().toTimeString().slice(0, 5);
      setFormData({
        klinik_id: "",
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
  };

  const handleModeChange = (newMode: "manual" | "booking") => {
    setMode(newMode);
    if (newMode === "manual") {
      const today = new Date().toISOString().split("T")[0];
      const now = new Date().toTimeString().slice(0, 5);
      setFormData({
        klinik_id: "",
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
        klinik_id: "",
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
    if (!bookings) {
      toast.error("Data booking belum dimuat");
      return;
    }

    if (bookingId && bookingId !== "none") {
      const selectedBooking = bookings?.find((b) => b.booking_id == bookingId);
      if (selectedBooking) {
        console.log("Selected booking:", selectedBooking);

        const newFormData = {
          klinik_id: selectedBooking.klinik_id?.toString() || "",
          hewan_id: selectedBooking.hewan_id?.toString() || "",
          dokter_id: selectedBooking.dokter_id?.toString() || "",
          tanggal_kunjungan:
            selectedBooking.tanggal_booking.split("T")[0] || "",
          waktu_kunjungan: selectedBooking.waktu_booking || "",
          catatan: selectedBooking.catatan || "",
          metode_pembayaran: "Cash",
          // --- MODIFIKASI: Kembalikan state kunjungan_sebelumnya ---
          kunjungan_sebelumnya: "",
          booking_id: bookingId,
          selectedLayanans: [],
          obatForms: [],
        };

        setFormData(newFormData);
        setSelectedHewan(selectedBooking.hewan_id?.toString() || "");

        // --- MODIFIKASI: Kembalikan fetch history untuk booking ---
        if (selectedBooking.hewan_id) {
          try {
            const response = await fetch(
              `${
                import.meta.env.VITE_API_URL || "http://localhost:3000/api"
              }/kunjungan/hewan/${selectedBooking.hewan_id}/history`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (response.ok) {
              const history = await response.json();
              setHewanHistory(history);

              if (history.length > 0) {
                toast.info(
                  `Ditemukan ${history.length} riwayat kunjungan sebelumnya`
                );
                setFormData((prev) => ({
                  ...prev,
                  kunjungan_sebelumnya: "none",
                }));
              }
            } else {
              setHewanHistory([]);
            }
          } catch (error) {
            console.error("Error fetching history:", error);
            setHewanHistory([]);
            toast.error("Gagal mengambil riwayat kunjungan");
          }
        }
      } else {
        console.log("Booking not found for ID:", bookingId);
      }
    } else {
      const today = new Date().toISOString().split("T")[0];
      const now = new Date().toTimeString().slice(0, 5);
      setFormData({
        klinik_id: "",
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

  const calculateDaysSince = (date: string) => {
    const visitDate = new Date(date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - visitDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hari ini";
    if (diffDays === 1) return "Kemarin";
    if (diffDays < 7) return `${diffDays} hari yang lalu`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu yang lalu`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} bulan yang lalu`;
    return `${Math.floor(diffDays / 365)} tahun yang lalu`;
  };

  const getBookingSummary = (bookingId: string | number | null | undefined) => {
    if (!bookingId) return "-";
    const found = bookings?.find(
      (b: any) => b.booking_id?.toString() === bookingId?.toString()
    );
    if (!found) return bookingId?.toString() || "-";
    return `${found.nama_pawrent} - ${found.title_dokter} ${
      found.nama_dokter
    } - ${new Date(found.tanggal_booking).toLocaleDateString("id-ID")} ${
      found.waktu_booking
    } - ${found.nama_hewan}`;
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

    const submitData = {
      klinik_id: formData.klinik_id,
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

    // Validasi layanan wajib minimal 1
    if (formData.selectedLayanans.length === 0) {
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

  // Tambahkan fungsi calculateTotalBiaya untuk tabel
  const calculateTotalBiaya = (layanan_kunjungan: any[], obat_kunjungan: any[]) => {
    const totalLayanan = layanan_kunjungan?.reduce((sum, l) => sum + ((l.harga_saat_itu || 0) * (l.qty || 1)), 0) || 0; // Perbaiki: kalikan dengan qty
    const totalObat = obat_kunjungan?.reduce((sum, o) => sum + ((o.qty || 0) * (o.harga_saat_itu || 0)), 0) || 0;
    return totalLayanan + totalObat;
  };

  // Tambahkan state untuk data layanan dan obat kunjungan
  const [layananKunjungan, setLayananKunjungan] = useState<any[]>([]);
  const [obatKunjungan, setObatKunjungan] = useState<any[]>([]);

  // useEffect untuk fetch layanan dan obat saat viewingKunjungan berubah
  useEffect(() => {
    if (viewingKunjungan) {
      const fetchLayananObat = async () => {
        try {
          // Fetch layanan untuk kunjungan ini
          const layananResponse = await fetch(
            `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/kunjungan-layanan/kunjungan/${viewingKunjungan.kunjungan_id}`,
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
            `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/kunjungan-obat/kunjungan/${viewingKunjungan.kunjungan_id}`,
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

  if (
    isLoading ||
    bookingsLoading ||
    hewansLoading ||
    allDoktersLoading ||
    kliniksLoading ||
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
                          {new Date(k.tanggal_kunjungan).toLocaleDateString(
                            "id-ID"
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {k.waktu_kunjungan}
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
                      Rp {calculateTotalBiaya(k.layanan_kunjungan, k.obat_kunjungan).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
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
                              {`${booking.nama_pawrent} - ${
                                booking.title_dokter || ""
                              } ${booking.nama_dokter} - ${new Date(
                                booking.tanggal_booking
                              ).toLocaleDateString("id-ID")} ${
                                booking.waktu_booking
                              } - ${booking.nama_hewan}`}
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
                        value={
                          kliniksData?.find(
                            (k: any) =>
                              k.klinik_id.toString() === formData.klinik_id
                          )?.nama_klinik || ""
                        }
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
                            (d: any) =>
                              d.dokter_id.toString() === formData.dokter_id
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
                      <Select
                        value={formData.klinik_id || ""}
                        onValueChange={(value) => {
                          setFormData({
                            ...formData,
                            klinik_id: value,
                            dokter_id: "",
                          });
                        }}
                      >
                        <SelectTrigger id="klinik-manual" className="col-span-3">
                          <SelectValue placeholder="Pilih Klinik" />
                        </SelectTrigger>
                        <SelectContent>
                          {kliniksData?.map((klinik: any) => (
                            <SelectItem
                              key={klinik.klinik_id}
                              value={klinik.klinik_id.toString()}
                            >
                              {klinik.nama_klinik}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                        disabled={!formData.klinik_id}
                      >
                        <SelectTrigger
                          id="dokter-manual"
                          className="col-span-3"
                        >
                          <SelectValue placeholder="Pilih Dokter" />
                        </SelectTrigger>
                        <SelectContent>
                          {!formData.klinik_id ? (
                            <SelectItem value="-" disabled>
                              Pilih klinik terlebih dahulu
                            </SelectItem>
                          ) : (
                            filteredDokters.map((dokter: any) => (
                              <SelectItem
                                key={dokter.dokter_id}
                                value={dokter.dokter_id.toString()}
                              >
                                {`${dokter.title_dokter || ""} ${
                                  dokter.nama_dokter
                                }`}
                              </SelectItem>
                            ))
                          )}
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
                          {new Date(viewingKunjungan.tanggal_kunjungan).toLocaleDateString("id-ID")} - {viewingKunjungan.waktu_kunjungan}
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
                              Rp {(l.harga_saat_itu * l.qty).toLocaleString("id-ID", { maximumFractionDigits: 0 })}
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
          <DialogContent className="max-w-2xl">
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
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-semibold">Hewan</span>
                  <span className="col-span-2">
                    : {viewingPreviousVisit.nama_hewan}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-semibold">Dokter</span>
                  <span className="col-span-2">
                    : {viewingPreviousVisit.title_dokter || ""}{" "}
                    {viewingPreviousVisit.nama_dokter}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-semibold">Catatan/Keluhan</span>
                  <span className="col-span-2">
                    : {viewingPreviousVisit.catatan || "-"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-semibold">Layanan</span>
                  <span className="col-span-2">
                    :{" "}
                    {viewingPreviousVisit.layanan_kunjungan?.length > 0
                      ? viewingPreviousVisit.layanan_kunjungan
                          .map((l: any) => l.nama_layanan)
                          .join(", ")
                      : "-"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-semibold">Obat</span>
                  <span className="col-span-2">
                    :{" "}
                    {viewingPreviousVisit.obat_kunjungan?.length > 0
                      ? viewingPreviousVisit.obat_kunjungan
                          .map(
                            (o: any) =>
                              `${o.nama_obat} (${o.qty} ${o.unit}, ${o.dosis} ${o.frekuensi})`
                          )
                          .join(", ")
                      : "-"}
                  </span>
                </div>
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

export default KunjunganPage;