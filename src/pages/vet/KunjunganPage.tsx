import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { kunjunganApi, hewanApi, dokterApi, layananApi, kunjunganObatApi, obatApi, bookingApi } from "@/lib/api";
import { toast } from "sonner";
import { 
  Calendar, 
  Clock, 
  PawPrint, 
  Stethoscope, 
  Plus, 
  Eye, 
  Trash2,
  Edit,
  Search,
  X,
  CheckCircle2,
  Wallet,
  AlertCircle,
  Info,
  FileText,
  Activity,
  Pill,
} from "lucide-react";
import { format } from "date-fns";
import { id as indonesianLocale } from "date-fns/locale";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const KunjunganPage = () => {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isPreviousVisitDialogOpen, setIsPreviousVisitDialogOpen] = useState(false);
  const [editingKunjungan, setEditingKunjungan] = useState<any>(null);
  const [viewingKunjungan, setViewingKunjungan] = useState<any>(null);
  const [viewingPreviousVisit, setViewingPreviousVisit] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [currentDokterId, setCurrentDokterId] = useState<number | null>(null);
  const [currentDokterName, setCurrentDokterName] = useState<string>("");
  const [currentKlinikId, setCurrentKlinikId] = useState<number | null>(null); // Tambahkan state untuk klinik_id
  const [isIdentifyingDokter, setIsIdentifyingDokter] = useState(true);
  const [selectedHewan, setSelectedHewan] = useState<string>("");
  const [hewanHistory, setHewanHistory] = useState<any[]>([]);
  const [selectedPreviousVisit, setSelectedPreviousVisit] = useState<any>(null);

  // Tambahkan state untuk mode booking
  const [mode, setMode] = useState<"manual" | "booking">("manual");

  const [formData, setFormData] = useState({
    hewan_id: "",
    dokter_id: "",
    tanggal_kunjungan: "", // Kosong, fetch dari database
    waktu_kunjungan: "",   // Kosong, fetch dari database
    catatan: "",
    metode_pembayaran: "Cash",
    kunjungan_sebelumnya: "",
    booking_id: "",
    selectedLayanans: [] as { kode_layanan: string }[],
    obatForms: [] as { obat_id: string; qty: string; dosis: string; frekuensi: string }[],
  });

  // Tambahkan state baru untuk layanan/obat seperti di admin
  const [existingLayanans, setExistingLayanans] = useState<any[]>([]);
  const [existingObats, setExistingObats] = useState<any[]>([]);
  const [layananKunjungan, setLayananKunjungan] = useState<any[]>([]);
  const [obatKunjungan, setObatKunjungan] = useState<any[]>([]);
  const [previousLayanan, setPreviousLayanan] = useState<any[]>([]);
  const [previousObat, setPreviousObat] = useState<any[]>([]);

  // Queries
  const { data: kunjungans, isLoading: isLoadingKunjungan } = useQuery({
    queryKey: ["kunjungans"],
    queryFn: () => kunjunganApi.getAll(token!),
  });

  const { data: hewans } = useQuery({
    queryKey: ["hewans"],
    queryFn: () => hewanApi.getAll(token!),
  });

  const { data: dokters, isLoading: isLoadingDokter } = useQuery({
    queryKey: ["dokters"],
    queryFn: () => dokterApi.getAll(token!),
  });

  // Tambahkan queries untuk layanan dan obat seperti di admin
  const { data: layananList, isLoading: layananListLoading } = useQuery({
    queryKey: ["layanan"],
    queryFn: () => layananApi.getAll(token!),
  });

  const { data: obatList, isLoading: obatListLoading } = useQuery({
    queryKey: ["obats"],
    queryFn: () => obatApi.getAll(token!),
  });

  // Query untuk booking yang tersedia (hanya untuk vet ini)
  const { data: availableBookings } = useQuery({
    queryKey: ["bookings", "available-for-kunjungan", currentDokterId],
    queryFn: () => bookingApi.getAvailableForKunjungan(token!),
    enabled: !!currentDokterId,
  });

  // Di dalam komponen, setelah query availableBookings, tambahkan state untuk filtered bookings
  const [filteredAvailableBookings, setFilteredAvailableBookings] = useState<any[]>([]);

  // Tambahkan useEffect untuk filter berdasarkan currentDokterId
  useEffect(() => {
    if (availableBookings && currentDokterId) {
      const filtered = availableBookings.filter((b: any) => b.dokter_id === currentDokterId);
      setFilteredAvailableBookings(filtered);
    } else {
      setFilteredAvailableBookings([]);
    }
  }, [availableBookings, currentDokterId]);

  // Get current dokter_id dan klinik_id - Perbaiki untuk mendapatkan klinik_id
  useEffect(() => {
    let dokterId: number | null = null;
    let dokterName: string = "";
    let klinikId: number | null = null;

    if (user?.dokter_id) {
      dokterId = user.dokter_id;
      dokterName = user.nama_dokter || user.username || "";
      // Jika user sudah memiliki dokter_id, cari klinik_id dari dokters
      if (dokters) {
        const dokterData = dokters.find((d: any) => d.dokter_id === dokterId);
        if (dokterData) {
          klinikId = dokterData.klinik_id;
        }
      }
    }

    if (!dokterId) {
      const storedDokterId = localStorage.getItem('dokter_id');
      if (storedDokterId) {
        dokterId = parseInt(storedDokterId);
        const storedDokterName = localStorage.getItem('dokter_name');
        if (storedDokterName) dokterName = storedDokterName;
        // Cari klinik_id dari dokters
        if (dokters) {
          const dokterData = dokters.find((d: any) => d.dokter_id === dokterId);
          if (dokterData) {
            klinikId = dokterData.klinik_id;
          }
        }
      }
    }

    if (!dokterId && user?.user_id && dokters) {
      const matchedDokter = dokters.find((d: any) => d.user_id === user.user_id);
      if (matchedDokter) {
        dokterId = matchedDokter.dokter_id;
        dokterName = matchedDokter.nama_dokter || "";
        klinikId = matchedDokter.klinik_id;
        localStorage.setItem('dokter_id', dokterId.toString());
        localStorage.setItem('dokter_name', dokterName);
      }
    }

    if (!dokterId && user?.username && dokters) {
      const matchedDokter = dokters.find((d: any) => 
        d.username === user.username || d.email === user.username || d.email === user.email
      );
      if (matchedDokter) {
        dokterId = matchedDokter.dokter_id;
        dokterName = matchedDokter.nama_dokter || "";
        klinikId = matchedDokter.klinik_id;
        localStorage.setItem('dokter_id', dokterId.toString());
        localStorage.setItem('dokter_name', dokterName);
      }
    }

    if (dokterId) {
      setCurrentDokterId(dokterId);
      setCurrentDokterName(dokterName);
      setCurrentKlinikId(klinikId);
      setFormData(prev => ({ ...prev, dokter_id: dokterId.toString() }));
    }

    setIsIdentifyingDokter(false);
  }, [user, dokters]);

  // Mutations - Pastikan hanya untuk kunjungan dokter ini
  const saveMutation = useMutation({
  mutationFn: async (data: any) => {
    console.log("🔧 [MUTATION] Starting mutation with data:", data);
    if (editingKunjungan) {
      console.log("✏️ [MUTATION] Updating existing kunjungan");
      return kunjunganApi.update(editingKunjungan.kunjungan_id, data, token!);
    }
    console.log("➕ [MUTATION] Creating new kunjungan");
    return kunjunganApi.create(data, token!);
  },
  onSuccess: async (res: any) => {
    console.log("✅ [MUTATION] Success response:", res);
    queryClient.invalidateQueries({ queryKey: ["kunjungans"] });
    toast.success(editingKunjungan ? "Kunjungan berhasil diupdate" : "Kunjungan berhasil ditambahkan");
    const kunjunganId = editingKunjungan ? editingKunjungan.kunjungan_id : res?.data?.kunjungan_id;
    if (kunjunganId) {
      console.log("💾 [MUTATION] Saving layanan and obat for kunjunganId:", kunjunganId);
      try {
        for (const layanan of formData.selectedLayanans) {
          console.log("📋 [MUTATION] Saving layanan:", layanan);
          await layananApi.createKunjunganLayanan({ kunjungan_id: kunjunganId, kode_layanan: layanan.kode_layanan }, token!);
        }
        for (const obat of formData.obatForms) {
          console.log("💊 [MUTATION] Saving obat:", obat);
          
          // ✅ PERBAIKAN: Konversi qty dari string ke number
          const obatDataToSend = {
            ...obat,
            kunjungan_id: kunjunganId,
            qty: parseInt(obat.qty) || 1, // Default ke 1 jika parsing gagal
          };
          
          // ✅ VALIDASI: Pastikan qty adalah number yang valid
          if (isNaN(obatDataToSend.qty) || obatDataToSend.qty <= 0) {
            console.warn("⚠️ [MUTATION] Invalid qty for obat, skipping:", obat);
            continue; // Lewati obat ini
          }
          
          await kunjunganObatApi.create(obatDataToSend, token!);
        }
        console.log("✅ [MUTATION] Layanan and obat saved successfully");
        toast.success("Layanan dan obat berhasil disimpan");
      } catch (error: any) {
        console.error("❌ [MUTATION] Error saving layanan/obat:", error);
        toast.error("Kunjungan berhasil, tapi gagal simpan layanan/obat: " + error.message);
      }
    }
    handleCloseDialog();
  },
  onError: (error: any) => {
    console.error("❌ [MUTATION] Error:", error);
    toast.error(error.message || "Gagal menyimpan kunjungan");
  },
});

  const deleteMutation = useMutation({
    mutationFn: (kunjunganId: number) => kunjunganApi.delete(kunjunganId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kunjungans"] });
      toast.success("Kunjungan berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus kunjungan");
    },
  });

  // Handlers - Tambahkan handlers untuk layanan/obat seperti di admin
  const handleOpenDialog = (kunjungan?: any) => {
    if (kunjungan) {
      // Edit: Fetch semua data dari database
      setEditingKunjungan(kunjungan);
      setFormData({
        hewan_id: kunjungan.hewan_id?.toString() || "",
        dokter_id: kunjungan.dokter_id?.toString() || "",
        tanggal_kunjungan: kunjungan.tanggal_kunjungan?.split('T')[0] || "", // Fetch dari DB
        waktu_kunjungan: kunjungan.waktu_kunjungan || "", // Fetch dari DB
        catatan: kunjungan.catatan || "",
        metode_pembayaran: kunjungan.metode_pembayaran || "Cash",
        kunjungan_sebelumnya: kunjungan.kunjungan_sebelumnya?.toString() || "",
        booking_id: kunjungan.booking_id?.toString() || "",
        selectedLayanans: [],
        obatForms: [],
      });
      if (kunjungan.hewan_id) handleHewanChange(kunjungan.hewan_id.toString());
      fetchExistingLayananObat(kunjungan.kunjungan_id); // Pastikan fetch layanan/obat
    } else {
      // Tambah baru: Kosong semua, tidak auto-assign
      setEditingKunjungan(null);
      setFormData({
        hewan_id: "",
        dokter_id: currentDokterId?.toString() || "",
        tanggal_kunjungan: "", // Kosong, user isi manual
        waktu_kunjungan: "",   // Kosong, user isi manual
        catatan: "",
        metode_pembayaran: "Cash",
        kunjungan_sebelumnya: "",
        booking_id: "",
        selectedLayanans: [],
        obatForms: [],
      });
      setHewanHistory([]);
      setSelectedPreviousVisit(null);
      setExistingLayanans([]);
      setExistingObats([]);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingKunjungan(null);
    setHewanHistory([]);
    setSelectedPreviousVisit(null);
    setExistingLayanans([]);
    setExistingObats([]);
  };

  const handleModeChange = (newMode: "manual" | "booking") => {
    setMode(newMode);
    if (newMode === "manual") {
      setFormData(prev => ({
        ...prev,
        tanggal_kunjungan: "", // Kosong, user isi
        waktu_kunjungan: "",   // Kosong, user isi
        // Reset lainnya
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        tanggal_kunjungan: "",
        waktu_kunjungan: "",
        // Reset lainnya
      }));
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
    }));
    setSelectedHewan("");
    setHewanHistory([]);
    setSelectedPreviousVisit(null);
    return;
  }

  try {
    const bookingData = await bookingApi.getById(bookingId, token!);
    console.log("Fetched booking data:", bookingData);

    // ✅ FORMAT TANGGAL: Handle berbagai kemungkinan format
    let formattedTanggal = "";
    if (bookingData.tanggal_booking) {
      const date = new Date(bookingData.tanggal_booking);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        formattedTanggal = `${year}-${month}-${day}`;
      } else {
        // Fallback: coba extract dari string
        const dateMatch = bookingData.tanggal_booking.match(/(\d{4}-\d{2}-\d{2})/);
        formattedTanggal = dateMatch ? dateMatch[1] : "";
      }
    }

    // ✅ FORMAT WAKTU: Handle berbagai kemungkinan format
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

useEffect(() => {
  console.log("🔄 [FORM_DATA_UPDATED]", formData);
}, [formData]);

  const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  console.log("🚀 [SUBMIT] Starting submit process");

  // ✅ PERBAIKAN: Gunakan nilai yang sudah kita miliki, bukan bergantung pada state yang mungkin belum update
  const currentTanggal = formData.tanggal_kunjungan;
  const currentWaktu = formData.waktu_kunjungan;
  
  console.log("📋 [SUBMIT] Current tanggal:", currentTanggal);
  console.log("📋 [SUBMIT] Current waktu:", currentWaktu);

  // Validasi 4: Tanggal dan waktu wajib diisi
  console.log("📋 [SUBMIT] Checking tanggal dan waktu validation");
  if (!currentTanggal || !currentWaktu) {
    console.error("❌ [SUBMIT] Validation failed: Tanggal or waktu is empty");
    toast.error("Tanggal dan waktu kunjungan wajib diisi");
    return;
  }
  console.log("✅ [SUBMIT] Tanggal dan waktu validation passed");

    // Membuat submitData
      console.log("📝 [SUBMIT] Building submitData");
  const submitData = {
    klinik_id: currentKlinikId,
    hewan_id: parseInt(formData.hewan_id),
    dokter_id: currentDokterId,
    tanggal_kunjungan: currentTanggal, // Gunakan currentTanggal
    waktu_kunjungan: currentWaktu,     // Gunakan currentWaktu
    catatan: formData.catatan,
    metode_pembayaran: formData.metode_pembayaran,
    kunjungan_sebelumnya: formData.kunjungan_sebelumnya || null,
    booking_id: mode === "booking" ? (formData.booking_id ? parseInt(formData.booking_id) : null) : null,
  };
  
  console.log("📦 [SUBMIT] SubmitData built:", submitData);
  console.log("🔄 [SUBMIT] Calling saveMutation.mutate");
  saveMutation.mutate(submitData);
};

  const handleHewanChange = async (hewanId: string) => {
  setSelectedHewan(hewanId);
  
  // ✅ PERBAIKAN: Gunakan functional update untuk menghindari closure issue
  setFormData(prev => ({ 
    ...prev, 
    hewan_id: hewanId, 
    kunjungan_sebelumnya: "" 
  }));
  
  setSelectedPreviousVisit(null);
  
  if (!hewanId) {
    setHewanHistory([]);
    return;
  }
  
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/kunjungan/hewan/${hewanId}/history`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (response.ok) {
      const history = await response.json();
      setHewanHistory(history);
      
      if (history.length > 0 && !editingKunjungan) {
        toast.info(`Ditemukan ${history.length} riwayat kunjungan sebelumnya`);
      }
    } else {
      setHewanHistory([]);
    }
  } catch (error) {
    console.error('Error fetching history:', error);
    setHewanHistory([]);
    toast.error('Gagal mengambil riwayat kunjungan');
  }
};

  const handlePreviousVisitChange = (visitId: string) => {
    const actualValue = visitId === "none" ? "" : visitId;
    setFormData({ ...formData, kunjungan_sebelumnya: actualValue });
    
    if (visitId && visitId !== "none") {
      const visit = hewanHistory.find(v => v.kunjungan_id.toString() === visitId);
      setSelectedPreviousVisit(visit);
    } else {
      setSelectedPreviousVisit(null);
    }
  };

  const handleViewPreviousVisit = (kunjunganId: number) => {
    const kunjungan = myKunjungans.find((k: any) => k.kunjungan_id === kunjunganId);
    if (kunjungan) {
      setViewingPreviousVisit(kunjungan);
      setIsPreviousVisitDialogOpen(true);
    }
  };

  const handleViewPreviousVisitFromTable = (kunjunganId: number | null) => {
    if (!kunjunganId) return;
    const kunjungan = myKunjungans.find((k: any) => k.kunjungan_id === kunjunganId);
    if (kunjungan) {
      setViewingPreviousVisit(kunjungan);
      setIsPreviousVisitDialogOpen(true);
    }
  };

  const handleViewDetail = (kunjungan: any) => {
    setViewingKunjungan(kunjungan);
    setIsDetailDialogOpen(true);
    fetchLayananObat(kunjungan.kunjungan_id);
  };

  const handleDelete = (kunjunganId: number, namaHewan: string) => {
    if (confirm(`Yakin ingin menghapus kunjungan ${namaHewan}?`)) {
      deleteMutation.mutate(kunjunganId);
    }
  };

  // Tambahkan handlers untuk layanan/obat seperti di admin
  const addLayanan = () => {
    setFormData(prev => ({ ...prev, selectedLayanans: [...prev.selectedLayanans, { kode_layanan: "" }] }));
  };

  const removeLayanan = (index: number) => {
    setFormData(prev => ({ ...prev, selectedLayanans: prev.selectedLayanans.filter((_, i) => i !== index) }));
  };

  const updateLayanan = (index: number, kode_layanan: string) => {
    setFormData(prev => ({
      ...prev,
      selectedLayanans: prev.selectedLayanans.map((l, i) => i === index ? { kode_layanan } : l)
    }));
  };

  const addObat = () => {
    setFormData(prev => ({ ...prev, obatForms: [...prev.obatForms, { obat_id: "", qty: "", dosis: "", frekuensi: "" }] }));
  };

  const removeObat = (index: number) => {
    setFormData(prev => ({ ...prev, obatForms: prev.obatForms.filter((_, i) => i !== index) }));
  };

  const updateObat = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      obatForms: prev.obatForms.map((o, i) => i === index ? { ...o, [field]: value } : o)
    }));
  };

  const deleteExistingLayanan = async (kunjunganId: number, kodeLayanan: string) => {
    try {
      await layananApi.deleteKunjunganLayanan(kunjunganId, kodeLayanan, token!);
      toast.success("Layanan berhasil dihapus");
      fetchExistingLayananObat(kunjunganId);
    } catch (error) {
      toast.error("Gagal menghapus layanan");
    }
  };

  const deleteExistingObat = async (kunjunganId: number, obatId: number) => {
    try {
      await kunjunganObatApi.delete(kunjunganId, obatId, token!);
      toast.success("Obat berhasil dihapus");
      fetchExistingLayananObat(kunjunganId);
    } catch (error) {
      toast.error("Gagal menghapus obat");
    }
  };
  
const calculateTotalBiaya = (layanan_kunjungan: any[], obat_kunjungan: any[]) => {
  const totalLayanan = layanan_kunjungan?.reduce((sum, l) => sum + ((l.harga_saat_itu || 0) * (l.qty || 1)), 0) || 0; // Perbaiki: kalikan dengan qty
  const totalObat = obat_kunjungan?.reduce((sum, o) => sum + ((o.qty || 0) * (o.harga_saat_itu || 0)), 0) || 0;
  return totalLayanan + totalObat;
};

  const calculateTotalBiayaRealtime = () => {
    let total = 0;
    for (const layanan of formData.selectedLayanans) {
      const layananData = layananList?.find((l: any) => l.kode_layanan === layanan.kode_layanan);
      if (layananData) total += layananData.biaya_layanan || 0;
    }
    for (const obat of formData.obatForms) {
      if (obat.obat_id && obat.qty) {
        const obatData = obatList?.find((o: any) => o.obat_id.toString() === obat.obat_id);
        if (obatData) total += (obatData.harga_obat || 0) * parseInt(obat.qty);
      }
    }
    return total;
  };

  const calculatePreviousTotal = () => {
    let total = 0;
    for (const layanan of previousLayanan) {
      total += (layanan.harga_saat_itu || 0) * (layanan.qty || 1);
    }
    for (const obat of previousObat) {
      total += (obat.harga_saat_itu || 0) * (obat.qty || 0);
    }
    return total;
  };

  const fetchExistingLayananObat = async (kunjunganId: number) => {
    try {
      const layananRes = await layananApi.getByKunjungan(kunjunganId, token!);
      setExistingLayanans(layananRes || []);
      const obatRes = await kunjunganObatApi.getByKunjungan(kunjunganId, token!);
      setExistingObats(obatRes || []);
    } catch (error) {
      console.error('Error fetching layanan/obat:', error);
    }
  };

  const fetchLayananObat = async (kunjunganId: number) => {
    try {
      const layananRes = await layananApi.getByKunjungan(kunjunganId, token!);
      setLayananKunjungan(layananRes || []);
      const obatRes = await kunjunganObatApi.getByKunjungan(kunjunganId, token!);
      setObatKunjungan(obatRes || []);
    } catch (error) {
      console.error('Error fetching layanan/obat:', error);
    }
  };

  // useEffect untuk fetch data saat viewing berubah
  useEffect(() => {
    if (viewingKunjungan) fetchLayananObat(viewingKunjungan.kunjungan_id);
    else {
      setLayananKunjungan([]);
      setObatKunjungan([]);
    }
  }, [viewingKunjungan]);

  useEffect(() => {
    if (viewingPreviousVisit) {
      fetchLayananObat(viewingPreviousVisit.kunjungan_id);
      setPreviousLayanan(layananKunjungan);
      setPreviousObat(obatKunjungan);
    } else {
      setPreviousLayanan([]);
      setPreviousObat([]);
    }
  }, [viewingPreviousVisit]);

  // Tambahkan query untuk detail kunjungan jika belum ada (opsional, untuk memastikan fetch lengkap)
  const { data: kunjunganDetail, isLoading: detailLoading } = useQuery({
    queryKey: ["kunjungan-detail", viewingKunjungan?.kunjungan_id],
    queryFn: () => kunjunganApi.getById(viewingKunjungan.kunjungan_id, token!),
    enabled: !!viewingKunjungan,
  });

  // Di useEffect untuk viewingKunjungan, pastikan fetch semua
  useEffect(() => {
    if (viewingKunjungan) {
      fetchLayananObat(viewingKunjungan.kunjungan_id);
      // Jika ada query detail, gunakan di sini
    } else {
      setLayananKunjungan([]);
      setObatKunjungan([]);
    }
  }, [viewingKunjungan]);

  // Tambahkan useEffect untuk fetch data layanan/obat kunjungan sebelumnya
useEffect(() => {
  if (viewingPreviousVisit) {
    const fetchPreviousData = async () => {
      try {
        const [layananRes, obatRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/kunjungan-layanan/kunjungan/${viewingPreviousVisit.kunjungan_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/kunjungan-obat/kunjungan/${viewingPreviousVisit.kunjungan_id}`, {
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

  // Utility functions
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount) || numAmount === null || numAmount === undefined) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(numAmount);
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

  // Filter data - Hanya untuk currentDokterId
  const myKunjungans = currentDokterId ? (kunjungans?.filter((k: any) => k.dokter_id === currentDokterId) || []) : [];

  const filteredKunjungans = myKunjungans.filter((k: any) => {
    const matchSearch = k.nama_hewan?.toLowerCase().includes(searchQuery.toLowerCase()) || k.nama_pawrent?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchMonth = filterMonth === "all" || new Date(k.tanggal_kunjungan).getMonth() === parseInt(filterMonth);
    return matchSearch && matchMonth;
  });

  // Statistics - Hanya untuk myKunjungans
  const todayDate = new Date().toISOString().split('T')[0];
  const stats = {
    total: myKunjungans.length,
    today: myKunjungans.filter((k: any) => k.tanggal_kunjungan?.split('T')[0] === todayDate).length,
    totalRevenue: myKunjungans.reduce((sum: number, k: any) => sum + (parseFloat(k.total_biaya) || 0), 0),
  };

  const isLoading = isLoadingKunjungan || isLoadingDokter || isIdentifyingDokter || layananListLoading || obatListLoading;

  if (isLoading) {
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
    <DashboardLayout title="Kelola Kunjungan" showBackButton={true} backTo="/vet/dashboard">
      <div className="space-y-6">
        {/* Info Card - Show current dokter */}
        {currentDokterId && currentDokterName && (
          <Alert>
            <Stethoscope className="h-4 w-4" />
            <AlertTitle>Dokter Login</AlertTitle>
            <AlertDescription>
              Anda login sebagai: <strong>{currentDokterName}</strong> (ID: {currentDokterId})
              <br />
              <span className="text-xs text-muted-foreground">
                Menampilkan {myKunjungans.length} kunjungan Anda
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Warning if dokter not found */}
        {!currentDokterId && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Peringatan</AlertTitle>
            <AlertDescription>
              Tidak dapat mendeteksi data dokter dari login Anda.
              <br />
              <span className="text-xs">Silakan logout dan login kembali, atau hubungi administrator.</span>
            </AlertDescription>
          </Alert>
        )}

        {/* Statistics Cards */}
        {currentDokterId && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Kunjungan</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">Kunjungan saya</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hari Ini</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.today}</div>
                <p className="text-xs text-muted-foreground">Kunjungan hari ini</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">Rp {stats.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Dari kunjungan saya</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        {currentDokterId && (
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Daftar Kunjungan Saya
                  </CardTitle>
                  <CardDescription>Kelola data kunjungan pasien Anda</CardDescription>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Kunjungan
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari hewan atau pemilik..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={filterMonth} onValueChange={setFilterMonth}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Bulan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Bulan</SelectItem>
                    <SelectItem value="0">Januari</SelectItem>
                    <SelectItem value="1">Februari</SelectItem>
                    <SelectItem value="2">Maret</SelectItem>
                    <SelectItem value="3">April</SelectItem>
                    <SelectItem value="4">Mei</SelectItem>
                    <SelectItem value="5">Juni</SelectItem>
                    <SelectItem value="6">Juli</SelectItem>
                    <SelectItem value="7">Agustus</SelectItem>
                    <SelectItem value="8">September</SelectItem>
                    <SelectItem value="9">Oktober</SelectItem>
                    <SelectItem value="10">November</SelectItem>
                    <SelectItem value="11">Desember</SelectItem>
                  </SelectContent>
                </Select>

                {(searchQuery || filterMonth !== "all") && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchQuery("");
                      setFilterMonth("all");
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                )}
              </div>

              {/* Table */}
              {filteredKunjungans.length > 0 ? (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead>Tanggal & Waktu</TableHead>
                        <TableHead>Hewan</TableHead>
                        <TableHead>Pemilik</TableHead>
                        <TableHead>Total Biaya</TableHead>
                        <TableHead>Pembayaran</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredKunjungans.map((kunjungan: any) => (
                        <TableRow key={kunjungan.kunjungan_id}>
                          <TableCell className="font-mono font-medium">
                            #{kunjungan.kunjungan_id}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 font-medium">
                                <Calendar className="h-3 w-3" />
                                {formatDate(kunjungan.tanggal_kunjungan)}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {kunjungan.waktu_kunjungan}
                              </div>
                              {/* NEW: Tombol lihat kunjungan sebelumnya */}
                              {kunjungan.kunjungan_sebelumnya && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 mt-1 text-xs text-primary hover:text-primary"
                                        onClick={() => handleViewPreviousVisitFromTable(kunjungan.kunjungan_sebelumnya)}
                                      >
                                        <Info className="h-3 w-3 mr-1" />
                                        Kunjungan Sebelumnya
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Klik untuk melihat detail kunjungan sebelumnya</p>
                                    </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <PawPrint className="h-4 w-4 text-primary" />
                              <span className="font-medium">{kunjungan.nama_hewan}</span>
                            </div>
                          </TableCell>
                          <TableCell>{kunjungan.nama_pawrent}</TableCell>
                          <TableCell className="font-semibold text-right text-green-600">
                            Rp {kunjungan.total_biaya?.toLocaleString('id-ID', { maximumFractionDigits: 0 }) || '0'}
                          </TableCell>
                          <TableCell>{getMetodeBadge(kunjungan.metode_pembayaran)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleViewDetail(kunjungan)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Detail
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleOpenDialog(kunjungan)}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleDelete(kunjungan.kunjungan_id, kunjungan.nama_hewan)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Tidak ada data kunjungan</p>
                  <p className="text-sm mb-4">
                    {searchQuery || filterMonth !== "all"
                      ? "Coba ubah filter pencarian"
                      : "Mulai dengan menambahkan kunjungan pertama"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {editingKunjungan ? (
                  <Edit className="h-5 w-5" />
                ) : (
                  <Plus className="h-5 w-5" />
                )}
                {editingKunjungan ? "Edit Kunjungan" : "Tambah Kunjungan"}
              </DialogTitle>
              <DialogDescription>
                {editingKunjungan 
                  ? `Update data kunjungan #${editingKunjungan.kunjungan_id}`
                  : "Masukkan data kunjungan baru"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Mode Selection */}
              {!editingKunjungan && (
                <div>
                  <Label>Mode Input</Label>
                  <Select value={mode} onValueChange={handleModeChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="booking">Dari Booking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {mode === "booking" && !editingKunjungan && (
                <div>
                  <Label>Pilih Booking *</Label>
                  <Select value={formData.booking_id} onValueChange={handleBookingChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih booking yang tersedia untuk Anda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Pilih Booking</SelectItem>
                      {filteredAvailableBookings.map((booking: any) => (
                        <SelectItem key={booking.booking_id} value={booking.booking_id.toString()}>
                          {`${booking.nama_pawrent || 'Pawrent Tidak Diketahui'} - ${booking.title_dokter || ''} ${booking.nama_dokter || 'Dokter Tidak Diketahui'} - ${new Date(booking.tanggal_booking).toLocaleDateString('id-ID')} ${booking.waktu_booking || '00:00'} - ${booking.nama_hewan || 'Hewan Tidak Diketahui'}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Hewan / Pasien *</Label>
                  <Select
                    value={formData.hewan_id}
                    onValueChange={handleHewanChange}
                    disabled={mode === "booking"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih hewan..." />
                    </SelectTrigger>
                    <SelectContent>
                      {hewans?.map((hewan: any) => (
                        <SelectItem key={hewan.hewan_id} value={hewan.hewan_id.toString()}>
                          <div className="flex items-center gap-2">
                            <PawPrint className="h-3 w-3" />
                            {hewan.nama_hewan} - {hewan.nama_pawrent}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <input type="hidden" name="dokter_id" value={formData.dokter_id} />

<div>
  <Label>Tanggal *</Label>
  <Input
    type="date"
    value={formData.tanggal_kunjungan}
    onChange={(e) => setFormData({ ...formData, tanggal_kunjungan: e.target.value })}
    disabled={mode === "booking"}
    required
  />
  {/* Tambahkan debug display */}
  <p className="text-xs text-muted-foreground mt-1">
    Current value: {formData.tanggal_kunjungan || "EMPTY"}
  </p>
</div>

<div>
  <Label>Waktu *</Label>
  <Input
    type="time"
    value={formData.waktu_kunjungan}
    onChange={(e) => setFormData({ ...formData, waktu_kunjungan: e.target.value })}
    disabled={mode === "booking"}
    required
  />
  {/* Tambahkan debug display */}
  <p className="text-xs text-muted-foreground mt-1">
    Current value: {formData.waktu_kunjungan || "EMPTY"}
  </p>
</div>

                {/* NEW: Field kunjungan sebelumnya */}
                {hewanHistory.length > 0 && (
                  <div className="col-span-2">
                    <Label>
                      Kunjungan Sebelumnya *
                      <span className="text-xs text-muted-foreground ml-2">
                        (Ditemukan {hewanHistory.length} riwayat kunjungan)
                      </span>
                    </Label>
                    <Select
                      value={formData.kunjungan_sebelumnya || "none"}
                      onValueChange={handlePreviousVisitChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kunjungan sebelumnya" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Tidak Ada / Kunjungan Pertama</SelectItem>
                        {hewanHistory.map((visit: any) => (
                          <SelectItem 
                            key={visit.kunjungan_id} 
                            value={visit.kunjungan_id.toString()}
                          >
                            {new Date(visit.tanggal_kunjungan).toLocaleDateString('id-ID')} - {visit.nama_dokter} - {calculateDaysSince(visit.tanggal_kunjungan)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedPreviousVisit && (
                      <div className="mt-2 p-3 bg-muted rounded-md">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium">Detail Kunjungan Sebelumnya:</p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewPreviousVisit(selectedPreviousVisit.kunjungan_id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Lihat Detail
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <strong>Tanggal:</strong> {new Date(selectedPreviousVisit.tanggal_kunjungan).toLocaleDateString('id-ID')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <strong>Dokter:</strong> {selectedPreviousVisit.nama_dokter}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <strong>Catatan:</strong> {selectedPreviousVisit.catatan || '-'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <Label>Metode Pembayaran *</Label>
                  <Select
                    value={formData.metode_pembayaran}
                    onValueChange={(value: any) => setFormData({ ...formData, metode_pembayaran: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">💵 Cash</SelectItem>
                      <SelectItem value="Transfer">🏦 Transfer</SelectItem>
                      <SelectItem value="E-Wallet">📱 E-Wallet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label>Catatan / Diagnosa</Label>
                  <Textarea
                    placeholder="Tulis catatan pemeriksaan, diagnosa, atau keluhan..."
                    value={formData.catatan}
                    onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              {/* Bagian Layanan dan Obat */}
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
                                  <SelectItem key={l.kode_layanan} value={l.kode_layanan}>{l.nama_layanan} - Rp {l.biaya_layanan}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {layananData && (
                              <div className="text-sm font-medium text-green-600">
                                Rp {layananData.biaya_layanan.toLocaleString('id-ID')}
                              </div>
                            )}
                            <Button type="button" variant="ghost" onClick={() => removeLayanan(index)}>
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
                              onClick={() => deleteExistingObat(viewingKunjungan?.kunjungan_id || editingKunjungan.kunjungan_id, obat.obat_id)}
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
                            <div className="grid grid-cols-4 gap-4">
                              <div>
                                <Label>Obat</Label>
                                <Select value={obat.obat_id} onValueChange={(value) => updateObat(index, 'obat_id', value)}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Pilih obat..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {obatList?.map((o: any) => (
                                      <SelectItem key={o.obat_id} value={o.obat_id.toString()}>{o.nama_obat} - Rp {o.harga_obat}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Qty</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  placeholder="1"
                                  value={obat.qty}
                                  onChange={(e) => updateObat(index, 'qty', e.target.value)}
                                  required={!!obat.obat_id} // Required jika obat dipilih
                                />
                              </div>
                              <div>
                                <Label>Dosis</Label>
                                <Input placeholder="2x sehari" value={obat.dosis} onChange={(e) => updateObat(index, 'dosis', e.target.value)} />
                              </div>
                              <div className="flex items-end gap-2">
                                <div className="flex-1">
                                  <Label>Frekuensi</Label>
                                  <Input placeholder="3x sehari" value={obat.frekuensi} onChange={(e) => updateObat(index, 'frekuensi', e.target.value)} />
                                </div>
                                <Button type="button" variant="ghost" onClick={() => removeObat(index)}>
                                  <X className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                            {obatData && obat.qty && (
                              <div className="mt-4 text-sm">
                                <div className="font-medium">Harga per unit:</div>
                                <div className="text-green-600">Rp {obatData.harga_obat.toLocaleString('id-ID')}</div>
                                <div className="font-medium mt-1">Total:</div>
                                <div className="text-lg font-bold text-green-600">
                                  Rp {(obatData.harga_obat * parseInt(obat.qty || '0')).toLocaleString('id-ID')}
                                </div>
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Batal
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2"></div>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {editingKunjungan ? "Update" : "Simpan"}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Detail Dialog */}
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
                              <Activity className="h-5 w-5 text-blue-600" />
                              <div>
                                <p className="font-medium">{l.nama_layanan}</p>
                                <p className="text-sm text-muted-foreground">Qty: {l.qty || 1}</p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Rp {((l.harga_saat_itu || 0) * (l.qty || 1)).toLocaleString('id-ID')}
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
                              <Pill className="h-5 w-5 text-green-600" />
                              <div>
                                <p className="font-medium">{o.nama_obat}</p>
                                <p className="text-sm text-muted-foreground">
                                  Qty: {o.qty} | Dosis: {o.dosis} | Frekuensi: {o.frekuensi}
                                </p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Rp {((o.harga_saat_itu || 0) * (o.qty || 0)).toLocaleString('id-ID')}
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

        {/* NEW: Dialog untuk melihat detail kunjungan sebelumnya */}
        <Dialog open={isPreviousVisitDialogOpen} onOpenChange={setIsPreviousVisitDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detail Riwayat Kunjungan</DialogTitle>
              {viewingPreviousVisit && (
                <DialogDescription>
                  Kunjungan pada{" "}
                  {new Date(viewingPreviousVisit.tanggal_kunjungan).toLocaleDateString("id-ID")}{" "}
                  ({calculateDaysSince(viewingPreviousVisit.tanggal_kunjungan)})
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
                        <p>{new Date(viewingPreviousVisit.tanggal_kunjungan).toLocaleDateString("id-ID")} - {viewingPreviousVisit.waktu_kunjungan}</p>
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
                        {previousLayanan.map((l: any) => (
                          <div key={l.layanan_id} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-3">
                              <Activity className="h-5 w-5 text-blue-600" />
                              <div>
                                <p className="font-medium">{l.nama_layanan}</p>
                                <p className="text-sm text-muted-foreground">Qty: {l.qty || 1}</p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Rp {((l.harga_saat_itu || 0) * (l.qty || 1)).toLocaleString('id-ID')}
                            </Badge>
                          </div>
                        ))}
                        <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                          <div className="flex justify-between items-center font-semibold text-blue-900 dark:text-blue-100">
                            <span>Total Layanan:</span>
                            <span>Rp {previousLayanan.reduce((sum, l) => sum + ((l.harga_saat_itu || 0) * (l.qty || 1)), 0).toLocaleString("id-ID", { maximumFractionDigits: 0 })}</span>
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
                              <Pill className="h-5 w-5 text-green-600" />
                              <div>
                                <p className="font-medium">{o.nama_obat}</p>
                                <p className="text-sm text-muted-foreground">
                                  Qty: {o.qty} | Dosis: {o.dosis} | Frekuensi: {o.frekuensi}
                                </p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Rp {((o.harga_saat_itu || 0) * (o.qty || 0)).toLocaleString('id-ID')}
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
              <Button onClick={() => setIsPreviousVisitDialogOpen(false)}>
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