import { useState, useEffect } from "react";
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
import { kunjunganApi, hewanApi, dokterApi, bookingApi } from "@/lib/api";
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
  const [isIdentifyingDokter, setIsIdentifyingDokter] = useState(true);
  const [selectedHewan, setSelectedHewan] = useState<string>("");
  const [hewanHistory, setHewanHistory] = useState<any[]>([]);
  const [selectedPreviousVisit, setSelectedPreviousVisit] = useState<any>(null);

  const [formData, setFormData] = useState({
    hewan_id: "",
    dokter_id: "",
    tanggal_kunjungan: new Date().toISOString().split('T')[0],
    waktu_kunjungan: new Date().toTimeString().slice(0, 5),
    total_biaya: "",
    catatan: "",
    metode_pembayaran: "Cash",
    kunjungan_sebelumnya: "",
  });

  // Tambahkan state baru
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

  // GANTI: Gunakan endpoint available untuk bookings di kunjungan
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["bookings", "available"],  // Tambahkan key unik
    queryFn: async () => {
      const result = await bookingApi.getAvailable(token!);  // Asumsi Anda tambahkan method ini di api.ts
      return result as any[];
    },
  });

  // Get current dokter_id - IMPROVED LOGIC
  useEffect(() => {
    let dokterId: number | null = null;
    let dokterName: string = "";

    // Priority 1: Check from user context
    if (user?.dokter_id) {
      dokterId = user.dokter_id;
      dokterName = user.nama_dokter || user.username || "";
    }
    
    // Priority 2: Check from localStorage (in case user context is empty)
    if (!dokterId) {
      const storedDokterId = localStorage.getItem('dokter_id');
      if (storedDokterId) {
        dokterId = parseInt(storedDokterId);
        const storedDokterName = localStorage.getItem('dokter_name');
        if (storedDokterName) {
          dokterName = storedDokterName;
        }
      }
    }

    // Priority 3: Match dengan dokters list by user_id
    if (!dokterId && user?.user_id && dokters && dokters.length > 0) {
      const matchedDokter = dokters.find((d: any) => d.user_id === user.user_id);
      if (matchedDokter) {
        dokterId = matchedDokter.dokter_id;
        dokterName = matchedDokter.nama_dokter || "";
        // Store untuk future use
        localStorage.setItem('dokter_id', dokterId.toString());
        localStorage.setItem('dokter_name', dokterName);
      }
    }

    // Priority 4: Match dengan dokters list by username/email
    if (!dokterId && user?.username && dokters && dokters.length > 0) {
      const matchedDokter = dokters.find((d: any) => 
        d.username === user.username || 
        d.email === user.username ||
        d.email === user.email
      );
      if (matchedDokter) {
        dokterId = matchedDokter.dokter_id;
        dokterName = matchedDokter.nama_dokter || "";
        // Store untuk future use
        localStorage.setItem('dokter_id', dokterId.toString());
        localStorage.setItem('dokter_name', dokterName);
      }
    }

    if (dokterId) {
      setCurrentDokterId(dokterId);
      setCurrentDokterName(dokterName);
      setFormData(prev => ({
        ...prev,
        dokter_id: dokterId.toString()
      }));
    }

    setIsIdentifyingDokter(false);
  }, [user, dokters]);

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingKunjungan) {
        return kunjunganApi.update(editingKunjungan.kunjungan_id, data, token!);
      }
      return kunjunganApi.create(data, token!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kunjungans"] });
      toast.success(editingKunjungan ? "Kunjungan berhasil diupdate" : "Kunjungan berhasil ditambahkan");
      handleCloseDialog();
    },
    onError: (error: any) => {
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

  // Handlers
  const handleOpenDialog = (kunjungan?: any) => {
    if (kunjungan) {
      setEditingKunjungan(kunjungan);
      setFormData({
        hewan_id: kunjungan.hewan_id?.toString() || "",
        dokter_id: kunjungan.dokter_id?.toString() || "",
        tanggal_kunjungan: kunjungan.tanggal_kunjungan?.split('T')[0] || "",
        waktu_kunjungan: kunjungan.waktu_kunjungan || "",
        total_biaya: kunjungan.total_biaya?.toString() || "",
        catatan: kunjungan.catatan || "",
        metode_pembayaran: kunjungan.metode_pembayaran || "Cash",
        kunjungan_sebelumnya: kunjungan.kunjungan_sebelumnya?.toString() || "",
      });
      if (kunjungan.hewan_id) {
        handleHewanChange(kunjungan.hewan_id.toString());
      }
    } else {
      setEditingKunjungan(null);
      setFormData({
        hewan_id: "",
        dokter_id: currentDokterId?.toString() || "",
        tanggal_kunjungan: new Date().toISOString().split('T')[0],
        waktu_kunjungan: new Date().toTimeString().slice(0, 5),
        total_biaya: "",
        catatan: "",
        metode_pembayaran: "Cash",
        kunjungan_sebelumnya: "",
      });
      setHewanHistory([]);
      setSelectedPreviousVisit(null);
      setSelectedHewan("");
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingKunjungan(null);
    setHewanHistory([]);
    setSelectedPreviousVisit(null);
    setSelectedHewan("");
    setFormData({
      hewan_id: "",
      dokter_id: currentDokterId?.toString() || "",
      tanggal_kunjungan: new Date().toISOString().split('T')[0],
      waktu_kunjungan: new Date().toTimeString().slice(0, 5),
      total_biaya: "",
      catatan: "",
      metode_pembayaran: "Cash",
      kunjungan_sebelumnya: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (hewanHistory.length > 0 && !formData.kunjungan_sebelumnya && !editingKunjungan) {
      toast.error("Silakan pilih kunjungan sebelumnya atau pilih 'Tidak Ada'");
      return;
    }
    
    const submitData = {
      ...formData,
      total_biaya: parseFloat(formData.total_biaya),
      hewan_id: parseInt(formData.hewan_id),
      dokter_id: parseInt(formData.dokter_id),
      kunjungan_sebelumnya: formData.kunjungan_sebelumnya || null,
    };

    saveMutation.mutate(submitData);
  };

  const handleViewDetail = (kunjungan: any) => {
    setViewingKunjungan(kunjungan);
    setIsDetailDialogOpen(true);
  };

  const handleDelete = (kunjunganId: number, namaHewan: string) => {
    if (confirm(`Yakin ingin menghapus kunjungan ${namaHewan}?`)) {
      deleteMutation.mutate(kunjunganId);
    }
  };

  // NEW: Handler untuk perubahan hewan (fetch history)
  const handleHewanChange = async (hewanId: string) => {
    setSelectedHewan(hewanId);
    setFormData({ ...formData, hewan_id: hewanId, kunjungan_sebelumnya: "" });
    setSelectedPreviousVisit(null);
    
    if (!hewanId) {
      setHewanHistory([]);
      return;
    }
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/kunjungan/hewan/${hewanId}/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
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

  // NEW: Handler untuk perubahan kunjungan sebelumnya
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

  // NEW: Handler untuk melihat detail kunjungan sebelumnya dari form
  const handleViewPreviousVisit = (kunjunganId: number) => {
    const kunjungan = kunjungans?.find((k: any) => k.kunjungan_id === kunjunganId);
    if (kunjungan) {
      setViewingPreviousVisit(kunjungan);
      setIsPreviousVisitDialogOpen(true);
    }
  };

  // NEW: Handler untuk melihat detail kunjungan sebelumnya dari table
  const handleViewPreviousVisitFromTable = (kunjunganId: number | null) => {
    if (!kunjunganId) return;
    const kunjungan = kunjungans?.find((k: any) => k.kunjungan_id === kunjunganId);
    if (kunjungan) {
      setViewingPreviousVisit(kunjungan);
      setIsPreviousVisitDialogOpen(true);
    }
  };

  // NEW: Helper untuk menghitung hari sejak kunjungan
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

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return 'Rp 0';
    }
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy', { locale: indonesianLocale });
    } catch {
      return dateString;
    }
  };

  const getMetodeBadge = (metode: string) => {
    const badges: any = {
      'Cash': <Badge variant="default" className="gap-1">💵 Cash</Badge>,
      'Transfer': <Badge variant="secondary" className="gap-1">🏦 Transfer</Badge>,
      'E-Wallet': <Badge variant="outline" className="gap-1">📱 E-Wallet</Badge>,
    };
    return badges[metode] || <Badge>{metode}</Badge>;
  };

  const normalizeDate = (dateString: string) => {
    return dateString.split('T')[0];
  };

  // Helper function to convert UTC date to local date
  const convertUTCToLocal = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return dateString.split('T')[0]; // Fallback: ambil bagian tanggal saja
    }
  };

  // Helper function to get today's date in local timezone
  const getTodayDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to safely compare dates (handle UTC timezone)
  const isSameDay = (dateString: string, compareDate: string) => {
    try {
      const localDate = convertUTCToLocal(dateString);
      return localDate === compareDate;
    } catch {
      return false;
    }
  };

  // Helper function to safely get month and year from date string (handle UTC timezone)
  const getMonthYear = (dateString: string) => {
    try {
      const localDate = convertUTCToLocal(dateString); // Convert to local first
      const [year, month, day] = localDate.split('-');
      return {
        month: parseInt(month) - 1, // Convert to 0-indexed
        year: parseInt(year)
      };
    } catch {
      return null;
    }
  };

  // FILTER DATA - ONLY show kunjungan for current dokter
  const myKunjungans = currentDokterId 
    ? (kunjungans?.filter((k: any) => k.dokter_id === currentDokterId) || [])
    : [];

  const filteredKunjungans = myKunjungans.filter((k: any) => {
    const matchSearch = 
      k.nama_hewan?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.nama_pawrent?.toLowerCase().includes(searchQuery.toLowerCase());

    let matchMonth = true;
    if (filterMonth !== "all") {
      const date = new Date(k.tanggal_kunjungan);
      matchMonth = date.getMonth() === parseInt(filterMonth);
    }

    return matchSearch && matchMonth;
  });

  // Statistics
  const todayDate = getTodayDate();
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const stats = {
    total: myKunjungans.length,
    today: myKunjungans.filter((k: any) => {
      return isSameDay(k.tanggal_kunjungan, todayDate);
    }).length,
    thisMonth: myKunjungans.filter((k: any) => {
      const dateInfo = getMonthYear(k.tanggal_kunjungan);
      if (!dateInfo) return false;
      return dateInfo.month === currentMonth && dateInfo.year === currentYear;
    }).length,
    totalRevenue: myKunjungans.reduce((sum: number, k: any) => {
      const biaya = parseFloat(k.total_biaya);
      return sum + (isNaN(biaya) ? 0 : biaya);
    }, 0),
  };

  const isLoading = isLoadingKunjungan || isLoadingDokter || isIdentifyingDokter;

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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <CardTitle className="text-sm font-medium">Bulan Ini</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.thisMonth}</div>
                <p className="text-xs text-muted-foreground">Total bulan ini</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{formatCurrency(stats.totalRevenue)}</div>
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
                            Rp {k.total_biaya?.toLocaleString('id-ID', { maximumFractionDigits: 0 }) || '0'}
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {editingKunjungan ? (
                  <>
                    <Edit className="h-5 w-5" />
                    Edit Kunjungan
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    Tambah Kunjungan
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {editingKunjungan 
                  ? `Update data kunjungan #${editingKunjungan.kunjungan_id}`
                  : "Masukkan data kunjungan baru"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hewan_id">Hewan / Pasien *</Label>
                  <Select
                    value={formData.hewan_id}
                    onValueChange={handleHewanChange}
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
                  <Label htmlFor="tanggal_kunjungan">Tanggal *</Label>
                  <Input
                    id="tanggal_kunjungan"
                    type="date"
                    value={formData.tanggal_kunjungan}
                    onChange={(e) => setFormData({ ...formData, tanggal_kunjungan: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="waktu_kunjungan">Waktu *</Label>
                  <Input
                    id="waktu_kunjungan"
                    type="time"
                    value={formData.waktu_kunjungan}
                    onChange={(e) => setFormData({ ...formData, waktu_kunjungan: e.target.value })}
                    required
                  />
                </div>

                {/* NEW: Field kunjungan sebelumnya */}
                {hewanHistory.length > 0 && (
                  <div className="col-span-2">
                    <Label htmlFor="kunjungan_sebelumnya">
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
                  <Label htmlFor="total_biaya">Total Biaya (Rp) *</Label>
                  <Input
                    id="total_biaya"
                    type="number"
                    placeholder="150000"
                    value={formData.total_biaya}
                    onChange={(e) => setFormData({ ...formData, total_biaya: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="metode_pembayaran">Metode Pembayaran *</Label>
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
                  <Label htmlFor="catatan">Catatan / Diagnosa</Label>
                  <Textarea
                    id="catatan"
                    placeholder="Tulis catatan pemeriksaan, diagnosa, atau keluhan..."
                    value={formData.catatan}
                    onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                    rows={3}
                  />
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Detail Kunjungan
              </DialogTitle>
              <DialogDescription>
                ID Kunjungan: #{viewingKunjungan?.kunjungan_id}
              </DialogDescription>
            </DialogHeader>
            
            {viewingKunjungan && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Tanggal</Label>
                    <p className="font-medium flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(viewingKunjungan.tanggal_kunjungan)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Waktu</Label>
                    <p className="font-medium flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4" />
                      {viewingKunjungan.waktu_kunjungan}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Hewan</Label>
                    <p className="font-medium flex items-center gap-2 mt-1">
                      <PawPrint className="h-4 w-4 text-primary" />
                      {viewingKunjungan.nama_hewan}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Pemilik</Label>
                    <p className="font-medium mt-1">{viewingKunjungan.nama_pawrent}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Dokter</Label>
                    <p className="font-medium flex items-center gap-2 mt-1">
                      <Stethoscope className="h-4 w-4" />
                      {viewingKunjungan.nama_dokter}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Metode Pembayaran</Label>
                    <div className="mt-1">
                      {getMetodeBadge(viewingKunjungan.metode_pembayaran)}
                    </div>
                  </div>
                </div>

                {viewingKunjungan.catatan && (
                  <div>
                    <Label className="text-muted-foreground">Catatan / Diagnosa</Label>
                    <p className="mt-1 p-3 bg-muted rounded-md whitespace-pre-wrap">
                      {viewingKunjungan.catatan}
                    </p>
                  </div>
                )}

                <div className="bg-primary/10 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <Label className="text-muted-foreground">Total Biaya</Label>
                      <p className="text-3xl font-bold text-primary mt-1">
                        {formatCurrency(viewingKunjungan.total_biaya)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* NEW: Dialog untuk melihat detail kunjungan sebelumnya */}
        <Dialog open={isPreviousVisitDialogOpen} onOpenChange={setIsPreviousVisitDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Detail Kunjungan Sebelumnya
              </DialogTitle>
              <DialogDescription>
                Informasi lengkap kunjungan medis sebelumnya
              </DialogDescription>
            </DialogHeader>
            {viewingPreviousVisit && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Tanggal Kunjungan</Label>
                    <p className="font-medium">
                      {formatDate(viewingPreviousVisit.tanggal_kunjungan)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Waktu</Label>
                    <p className="font-medium">{viewingPreviousVisit.waktu_kunjungan}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Hewan</Label>
                    <p className="font-medium">{viewingPreviousVisit.nama_hewan}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Pemilik</Label>
                    <p className="font-medium">{viewingPreviousVisit.nama_pawrent}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Dokter</Label>
                    <p className="font-medium">{viewingPreviousVisit.nama_dokter}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Total Biaya</Label>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(viewingPreviousVisit.total_biaya)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Metode Pembayaran</Label>
                    <div className="mt-1">{getMetodeBadge(viewingPreviousVisit.metode_pembayaran)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Waktu Kunjungan</Label>
                    <p className="text-sm text-muted-foreground">
                      {calculateDaysSince(viewingPreviousVisit.tanggal_kunjungan)}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Catatan / Diagnosa</Label>
                  <div className="mt-2 p-4 bg-muted rounded-md">
                    <p className="text-sm whitespace-pre-wrap">
                      {viewingPreviousVisit.catatan || 'Tidak ada catatan'}
                    </p>
                  </div>
                </div>

                {/* Tambahkan detail layanan dan obat */}
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-semibold">Layanan</span>
                  <span className="col-span-2">
                    : {previousLayanan.length > 0 ? previousLayanan.map(l => `${l.nama_layanan} (Qty: ${l.qty}, Harga: Rp ${l.harga_saat_itu?.toLocaleString('id-ID')})`).join(", ") : "-"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-semibold">Obat</span>
                  <span className="col-span-2">
                    : {previousObat.length > 0 ? previousObat.map(o => `${o.nama_obat} (Qty: ${o.qty}, Dosis: ${o.dosis}, Frekuensi: ${o.frekuensi}, Harga: Rp ${o.harga_saat_itu?.toLocaleString('id-ID')})`).join(", ") : "-"}
                  </span>
                </div>

                {/* NEW: Hitung dan tampilkan total biaya layanan dan obat */}
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-semibold">Total Biaya</span>
                  <span className="col-span-2">: Rp {calculatePreviousTotal().toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
                </div>
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