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
  obatApi,
  bookingApi,
  klinikApi,
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
  });

  const [mode, setMode] = useState<"manual" | "booking">("manual");

  const [showLayananDialog, setShowLayananDialog] = useState(false);
  const [showObatDialog, setShowObatDialog] = useState(false);
  const [newKunjunganId, setNewKunjunganId] = useState<number | null>(null);
  const [selectedLayanan, setSelectedLayanan] = useState("");
  const [layananList, setLayananList] = useState<any[]>([]);
  const [obatForm, setObatForm] = useState({
    kunjungan_id: null,
    obat_id: "",
    qty: "",
    dosis: "",
    frekuensi: "",
  });

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

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingKunjungan) {
        return kunjunganApi.update(editingKunjungan.kunjungan_id, data, token!);
      }
      return kunjunganApi.create(data, token!);
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["kunjungans"] });
      toast.success(
        editingKunjungan
          ? "Kunjungan berhasil diupdate"
          : "Kunjungan berhasil ditambahkan"
      );
      handleCloseDialog();
      if (!editingKunjungan && res?.data?.kunjungan_id) {
        setNewKunjunganId(res.data.kunjungan_id);
        setShowLayananDialog(true);
      }
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

  useEffect(() => {
    if (showLayananDialog) {
      layananApi.getAll(token!).then(setLayananList);
    }
  }, [showLayananDialog, token]);

  useEffect(() => {
    if (!showObatDialog) {
      setObatForm({
        kunjungan_id: null,
        obat_id: "",
        qty: "",
        dosis: "",
        frekuensi: "",
      });
      setNewKunjunganId(null);
    }
  }, [showObatDialog]);

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

  if (
    isLoading ||
    bookingsLoading ||
    hewansLoading ||
    allDoktersLoading ||
    kliniksLoading
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
                              }`}
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

                    {/* --- MODIFIKASI: Kembalikan blok Riwayat Kunjungan --- */}
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
                  <span className="font-semibold">Diagnosa</span>
                  <span className="col-span-2">
                    : {viewingPreviousVisit.diagnosa || "-"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-semibold">Tindakan</span>
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

        {/* Dialog Tambah Layanan (muncul setelah add kunjungan) */}
        <Dialog open={showLayananDialog} onOpenChange={setShowLayananDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Layanan</DialogTitle>
              <DialogDescription>
                Pilih layanan yang diberikan untuk kunjungan ini.
              </DialogDescription>
            </DialogHeader>
            <Select onValueChange={setSelectedLayanan}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih layanan..." />
              </SelectTrigger>
              <SelectContent>
                {layananList.map((l: any) => (
                  <SelectItem key={l.layanan_id} value={l.layanan_id}>
                    {l.nama_layanan}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button
                onClick={async () => {
                  if (selectedLayanan && newKunjunganId) {
                    await layananApi.createKunjunganLayanan(
                      {
                        kunjungan_id: newKunjunganId,
                        layanan_id: selectedLayanan,
                      },
                      token!
                    );
                    setShowLayananDialog(false);
                    setShowObatDialog(true); // Lanjut ke dialog obat
                  } else {
                    setShowLayananDialog(false);
                    setShowObatDialog(true); // Lanjut ke dialog obat
                  }
                }}
              >
                Simpan Layanan / Lewati
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Tambah Obat (muncul setelah layanan) */}
        <Dialog open={showObatDialog} onOpenChange={setShowObatDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Resep Obat</DialogTitle>
              <DialogDescription>
                Masukkan resep obat untuk kunjungan ini (opsional).
              </DialogDescription>
            </DialogHeader>
            <Input
              placeholder="ID Obat (WIP: Ganti jadi search/select)"
              value={obatForm.obat_id}
              onChange={(e) =>
                setObatForm({ ...obatForm, obat_id: e.target.value })
              }
            />
            <Input
              placeholder="Qty"
              type="number"
              value={obatForm.qty}
              onChange={(e) =>
                setObatForm({ ...obatForm, qty: e.target.value })
              }
            />
            <Input
              placeholder="Dosis"
              value={obatForm.dosis}
              onChange={(e) =>
                setObatForm({ ...obatForm, dosis: e.target.value })
              }
            />
            <Input
              placeholder="Frekuensi"
              value={obatForm.frekuensi}
              onChange={(e) =>
                setObatForm({ ...obatForm, frekuensi: e.target.value })
              }
            />
            <DialogFooter>
              <Button
                onClick={async () => {
                  if (!obatForm.obat_id || !obatForm.qty) {
                    setShowObatDialog(false);
                    setNewKunjunganId(null);
                    return;
                  }
                  await obatApi.create(
                    { ...obatForm, kunjungan_id: newKunjunganId },
                    token!
                  );
                  setShowObatDialog(false);
                  setNewKunjunganId(null);
                  queryClient.invalidateQueries({ queryKey: ["kunjungans"] });
                }}
              >
                Simpan Obat / Lewati
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default KunjunganPage;