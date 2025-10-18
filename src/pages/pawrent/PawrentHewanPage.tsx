import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; // ADD THIS LINE
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hewanApi } from "@/lib/api";
import { useState } from "react";
import { toast } from "sonner";
import { PawPrint, Search, X, Eye, HeartPulse, Skull, Edit, Plus, Trash2, Pencil, AlertTriangle } from "lucide-react";

const PawrentHewanPage = () => {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHewan, setSelectedHewan] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false); // NEW
  const [deletingHewan, setDeletingHewan] = useState<any>(null); // NEW
  const [editingHewan, setEditingHewan] = useState<any>(null);
  const [formData, setFormData] = useState({
    nama_hewan: "",
    tanggal_lahir: "",
    jenis_kelamin: "Jantan",
    status_hidup: "Hidup",
    jenis_hewan_id: "",
  });

  // Get all hewans
  const { data: hewans, isLoading } = useQuery({
    queryKey: ["hewans"],
    queryFn: () => hewanApi.getAll(token!),
  });

  // Get jenis hewan for dropdown (from hewans data)
  const jenisHewanList = Array.from(
    new Set(hewans?.map((h: any) => JSON.stringify({ id: h.jenis_hewan_id, nama: h.nama_jenis_hewan })))
  ).map((item: string) => JSON.parse(item));

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => {
      if (!editingHewan) return Promise.reject("No hewan selected");
      return hewanApi.updateMy(editingHewan.hewan_id, data, token!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hewans"] });
      toast.success("Data hewan berhasil diupdate");
      setIsEditDialogOpen(false);
      setEditingHewan(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal update data hewan");
    },
  });

  // NEW: Create mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => hewanApi.createMy(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hewans"] });
      toast.success("Hewan berhasil ditambahkan");
      setIsCreateDialogOpen(false);
      setFormData({
        nama_hewan: "",
        tanggal_lahir: "",
        jenis_kelamin: "Jantan",
        status_hidup: "Hidup",
        jenis_hewan_id: "",
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menambah hewan");
    },
  });

  // NEW: Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => hewanApi.deleteMy(id, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hewans"] });
      toast.success("Hewan berhasil dihapus");
      setIsDeleteDialogOpen(false);
      setDeletingHewan(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus hewan");
    },
  });

  // Filter hewans by current pawrent_id
  const myHewans = hewans?.filter((h: any) => h.pawrent_id === user?.pawrent_id) || [];

  const handleViewDetail = (hewan: any) => {
    setSelectedHewan(hewan);
    setIsDetailDialogOpen(true);
  };

  const handleOpenEditDialog = (hewan: any) => {
    setEditingHewan(hewan);
    setFormData({
      nama_hewan: hewan.nama_hewan || "",
      tanggal_lahir: hewan.tanggal_lahir?.split('T')[0] || "",
      jenis_kelamin: hewan.jenis_kelamin || "Jantan",
      status_hidup: hewan.status_hidup || "Hidup",
      jenis_hewan_id: hewan.jenis_hewan_id?.toString() || "",
    });
    setIsEditDialogOpen(true);
  };

  // NEW: Handler untuk open create dialog
  const handleOpenCreateDialog = () => {
    setFormData({
      nama_hewan: "",
      tanggal_lahir: "",
      jenis_kelamin: "Jantan",
      status_hidup: "Hidup",
      jenis_hewan_id: "",
    });
    setIsCreateDialogOpen(true);
  };

  // NEW: Handler untuk open delete confirmation
  const handleOpenDeleteDialog = (hewan: any) => {
    setDeletingHewan(hewan);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  // NEW: Handler untuk create submit
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  // NEW: Handler untuk confirm delete
  const handleConfirmDelete = () => {
    if (deletingHewan) {
      deleteMutation.mutate(deletingHewan.hewan_id);
    }
  };

  const getJenisKelaminBadge = (jk: string) => {
    return jk === "Jantan" ? (
      <Badge variant="default" className="gap-1">♂ Jantan</Badge>
    ) : (
      <Badge variant="secondary" className="gap-1">♀ Betina</Badge>
    );
  };

  const getStatusHidupBadge = (status: string) => {
    return status === "Hidup" ? (
      <Badge variant="default" className="gap-1">
        <HeartPulse className="h-3 w-3" /> Hidup
      </Badge>
    ) : (
      <Badge variant="destructive" className="gap-1">
        <Skull className="h-3 w-3" /> Mati
      </Badge>
    );
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return "-";
    const today = new Date();
    const birth = new Date(birthDate);
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    if (years > 0) {
      return `${years} tahun ${months} bulan`;
    } else {
      return `${months} bulan`;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const filteredHewans = myHewans.filter((h: any) => 
    h.nama_hewan?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.nama_jenis_hewan?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <DashboardLayout title="Hewan Saya">
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
    <DashboardLayout title="Hewan Saya" showBackButton={true} backTo="/pawrent/dashboard">
      <div className="space-y-6">
        {/* Info Card */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PawPrint className="h-5 w-5 text-primary" />
              Hewan Kesayangan Anda
            </CardTitle>
            <CardDescription>
              Informasi lengkap tentang hewan peliharaan Anda yang terdaftar di klinik
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hewan</CardTitle>
              <PawPrint className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{myHewans.length}</div>
              <p className="text-xs text-muted-foreground">
                Hewan terdaftar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status Hidup</CardTitle>
              <HeartPulse className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {myHewans.filter((h: any) => h.status_hidup === "Hidup").length}
              </div>
              <p className="text-xs text-muted-foreground">
                Hewan hidup
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jenis Hewan</CardTitle>
              <PawPrint className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">
                {new Set(myHewans.map((h: any) => h.jenis_hewan_id)).size}
              </div>
              <p className="text-xs text-muted-foreground">
                Jenis berbeda
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <PawPrint className="h-5 w-5" />
                  Daftar Hewan Saya ({filteredHewans?.length || 0})
                </CardTitle>
                <CardDescription>Kelola data hewan kesayangan Anda</CardDescription>
              </div>
              {/* NEW: Tambah Hewan Button */}
              <Button onClick={handleOpenCreateDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                Tambah Hewan
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama hewan atau jenis..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchQuery && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Table */}
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">No</TableHead>
                    <TableHead>Nama Hewan</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Jenis Kelamin</TableHead>
                    <TableHead>Umur</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHewans && filteredHewans.length > 0 ? (
                    filteredHewans.map((hewan: any, index: number) => (
                      <TableRow key={hewan.hewan_id}>
                        <TableCell className="text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <PawPrint className="h-8 w-8 rounded-md bg-primary/10 text-primary" />
                            <div>
                              <p className="font-semibold">{hewan.nama_hewan}</p>
                              <p className="text-sm text-muted-foreground">
                                {hewan.nama_jenis_hewan}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">
                            {hewan.nama_jenis_hewan}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {getJenisKelaminBadge(hewan.jenis_kelamin)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <p className="text-sm font-medium">
                            {calculateAge(hewan.tanggal_lahir)}
                          </p>
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusHidupBadge(hewan.status_hidup)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetail(hewan)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditDialog(hewan)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {/* NEW: Delete Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDeleteDialog(hewan)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <PawPrint className="h-12 w-12 opacity-20" />
                          <p>Tidak ada data hewan</p>
                          <Button onClick={handleOpenCreateDialog} size="sm" className="mt-2">
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah Hewan Pertama
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PawPrint className="h-5 w-5" />
                Detail Hewan
              </DialogTitle>
              <DialogDescription>
                Informasi lengkap data hewan
              </DialogDescription>
            </DialogHeader>
            
            {selectedHewan && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Nama Hewan</Label>
                    <p className="font-semibold text-lg mt-1">{selectedHewan.nama_hewan}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Jenis Hewan</Label>
                    <p className="font-semibold text-lg mt-1">{selectedHewan.nama_jenis_hewan}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Jenis Kelamin</Label>
                    <div className="mt-1">{getJenisKelaminBadge(selectedHewan.jenis_kelamin)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">{getStatusHidupBadge(selectedHewan.status_hidup)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Tanggal Lahir</Label>
                    <p className="font-medium mt-1">{formatDate(selectedHewan.tanggal_lahir)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Umur</Label>
                    <p className="font-medium mt-1">{calculateAge(selectedHewan.tanggal_lahir)}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <Label className="text-muted-foreground">Pemilik</Label>
                  <p className="font-semibold text-lg mt-1">{selectedHewan.nama_pawrent}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Edit Data Hewan
              </DialogTitle>
              <DialogDescription>
                Perbarui informasi hewan kesayangan Anda
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nama_hewan">Nama Hewan *</Label>
                  <Input
                    id="nama_hewan"
                    placeholder="Nama hewan"
                    value={formData.nama_hewan}
                    onChange={(e) => setFormData({ ...formData, nama_hewan: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="jenis_hewan_id">Jenis Hewan *</Label>
                  <Select
                    value={formData.jenis_hewan_id}
                    onValueChange={(value) => setFormData({ ...formData, jenis_hewan_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis hewan" />
                    </SelectTrigger>
                    <SelectContent>
                      {jenisHewanList.map((jenis: any) => (
                        <SelectItem key={jenis.id} value={jenis.id.toString()}>
                          {jenis.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tanggal_lahir">Tanggal Lahir</Label>
                  <Input
                    id="tanggal_lahir"
                    type="date"
                    value={formData.tanggal_lahir}
                    onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <Label htmlFor="jenis_kelamin">Jenis Kelamin *</Label>
                  <Select
                    value={formData.jenis_kelamin}
                    onValueChange={(value) => setFormData({ ...formData, jenis_kelamin: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Jantan">♂ Jantan</SelectItem>
                      <SelectItem value="Betina">♀ Betina</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status_hidup">Status Hidup *</Label>
                  <Select
                    value={formData.status_hidup}
                    onValueChange={(value) => setFormData({ ...formData, status_hidup: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hidup">
                        <div className="flex items-center gap-2">
                          <HeartPulse className="h-4 w-4 text-green-600" />
                          Hidup
                        </div>
                      </SelectItem>
                      <SelectItem value="Mati">
                        <div className="flex items-center gap-2">
                          <Skull className="h-4 w-4 text-red-600" />
                          Mati
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-md border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    ℹ️ Pastikan data yang dimasukkan akurat. Perubahan data akan langsung tersimpan di sistem.
                  </p>
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={updateMutation.isPending}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* NEW: Create Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PawPrint className="h-5 w-5" />
                Tambah Hewan Baru
              </DialogTitle>
              <DialogDescription>
                Daftarkan hewan kesayangan Anda
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nama_hewan">Nama Hewan *</Label>
                  <Input
                    id="nama_hewan"
                    value={formData.nama_hewan}
                    onChange={(e) => setFormData({ ...formData, nama_hewan: e.target.value })}
                    placeholder="Contoh: Milo, Bella, Luna"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="jenis_hewan_id">Jenis Hewan *</Label>
                    <select
                      id="jenis_hewan_id"
                      className="w-full h-10 px-3 border rounded-md"
                      value={formData.jenis_hewan_id}
                      onChange={(e) => setFormData({ ...formData, jenis_hewan_id: e.target.value })}
                      required
                    >
                      <option value="">Pilih Jenis</option>
                      {jenisHewanList.map((jenis: any) => (
                        <option key={jenis.id} value={jenis.id}>
                          {jenis.nama}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="jenis_kelamin">Jenis Kelamin *</Label>
                    <select
                      id="jenis_kelamin"
                      className="w-full h-10 px-3 border rounded-md"
                      value={formData.jenis_kelamin}
                      onChange={(e) => setFormData({ ...formData, jenis_kelamin: e.target.value })}
                      required
                    >
                      <option value="Jantan">♂ Jantan</option>
                      <option value="Betina">♀ Betina</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="tanggal_lahir">Tanggal Lahir</Label>
                  <Input
                    id="tanggal_lahir"
                    type="date"
                    value={formData.tanggal_lahir}
                    onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Opsional - Isi jika Anda tahu tanggal lahir hewan
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-md border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Catatan:</strong> Data hewan akan terdaftar atas nama Anda. 
                    Pastikan informasi yang dimasukkan benar.
                  </p>
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Menyimpan..." : "Simpan Hewan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* NEW: Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Konfirmasi Hapus Hewan
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  Apakah Anda yakin ingin menghapus hewan <strong>{deletingHewan?.nama_hewan}</strong>?
                </p>
                <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Perhatian:</strong>
                  </p>
                  <ul className="text-sm text-amber-700 dark:text-amber-300 mt-1 list-disc list-inside">
                    <li>Hewan yang memiliki riwayat kunjungan tidak dapat dihapus</li>
                    <li>Tindakan ini tidak dapat dibatalkan</li>
                    <li>Semua data terkait hewan akan hilang</li>
                  </ul>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>
                Batal
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteMutation.isPending ? "Menghapus..." : "Ya, Hapus"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default PawrentHewanPage;