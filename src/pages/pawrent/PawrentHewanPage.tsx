import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hewanApi } from "@/lib/api";
import { useState } from "react";
import { toast } from "sonner";
import { PawPrint, Search, X, Eye, HeartPulse, Skull, Edit } from "lucide-react";

const PawrentHewanPage = () => {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHewan, setSelectedHewan] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
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
                  Daftar Hewan ({filteredHewans.length})
                </CardTitle>
                <CardDescription>Kelola data hewan kesayangan Anda</CardDescription>
              </div>
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

            {/* Hewan List */}
            {filteredHewans.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredHewans.map((hewan: any) => (
                  <Card key={hewan.hewan_id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl flex items-center gap-2">
                            <PawPrint className="h-5 w-5 text-primary" />
                            {hewan.nama_hewan}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {hewan.nama_jenis_hewan}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col gap-1">
                          {getJenisKelaminBadge(hewan.jenis_kelamin)}
                          {getStatusHidupBadge(hewan.status_hidup)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Umur:</span>
                          <span className="font-medium">{calculateAge(hewan.tanggal_lahir)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tanggal Lahir:</span>
                          <span className="font-medium">{formatDate(hewan.tanggal_lahir)}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleViewDetail(hewan)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Detail
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleOpenEditDialog(hewan)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <PawPrint className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">
                  {searchQuery ? "Tidak ada hasil pencarian" : "Belum ada hewan terdaftar"}
                </p>
                {searchQuery && (
                  <p className="text-sm">Coba kata kunci lain</p>
                )}
              </div>
            )}
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
      </div>
    </DashboardLayout>
  );
};

export default PawrentHewanPage;