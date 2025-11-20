import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { backupApi } from "@/lib/api";
import { toast } from "sonner";
import { Database, Download, RotateCcw, Trash2, Plus, Shield, AlertTriangle, Loader2, Calendar, User, HardDrive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const AdminBackupPage = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<any>(null);
  const [formData, setFormData] = useState({
    backup_name: "",
    description: "",
  });

  // Fetch backups
  const { data: backups, isLoading } = useQuery({
    queryKey: ["backups"],
    queryFn: () => backupApi.getAll(token!),
    enabled: !!token,
  });

  // Create backup mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => backupApi.create(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backups"] });
      toast.success("✅ Backup berhasil dibuat", {
        description: "Database telah di-backup dengan sukses",
      });
      setIsCreateDialogOpen(false);
      setFormData({ backup_name: "", description: "" });
    },
    onError: (error: any) => {
      toast.error("❌ Gagal membuat backup", {
        description: error.message || "Terjadi kesalahan saat membuat backup",
      });
    },
  });

  // Restore backup mutation
  const restoreMutation = useMutation({
    mutationFn: (id: number) => backupApi.restore(id, token!),
    onSuccess: () => {
      toast.success("✅ Database berhasil di-restore", {
        description: "Halaman akan dimuat ulang dalam 3 detik...",
      });
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    },
    onError: (error: any) => {
      toast.error("❌ Gagal restore backup", {
        description: error.message || "Terjadi kesalahan saat restore backup",
      });
    },
  });

  // Delete backup mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => backupApi.delete(id, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backups"] });
      toast.success("✅ Backup berhasil dihapus");
      setIsDeleteDialogOpen(false);
      setSelectedBackup(null);
    },
    onError: (error: any) => {
      toast.error("❌ Gagal menghapus backup", {
        description: error.message || "Terjadi kesalahan saat menghapus backup",
      });
    },
  });

  const handleCreateBackup = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.backup_name.trim()) {
      toast.error("Nama backup wajib diisi");
      return;
    }
    
    // Validate backup name (no special characters except underscore and hyphen)
    const nameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!nameRegex.test(formData.backup_name)) {
      toast.error("Nama backup hanya boleh berisi huruf, angka, underscore (_) dan hyphen (-)");
      return;
    }
    
    createMutation.mutate(formData);
  };

  const handleDownload = (backup: any) => {
    backupApi.download(backup.backup_id, token!);
    toast.success("📥 Mengunduh backup...", {
      description: `File: ${backup.backup_name}.sql`,
    });
  };

  const handleOpenRestore = (backup: any) => {
    setSelectedBackup(backup);
    setIsRestoreDialogOpen(true);
  };

  const handleConfirmRestore = () => {
    if (selectedBackup) {
      restoreMutation.mutate(selectedBackup.backup_id);
      setIsRestoreDialogOpen(false);
    }
  };

  const handleOpenDelete = (backup: any) => {
    setSelectedBackup(backup);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedBackup) {
      deleteMutation.mutate(selectedBackup.backup_id);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "-";
    const mb = bytes / (1024 * 1024);
    if (mb < 1) {
      const kb = bytes / 1024;
      return `${kb.toFixed(2)} KB`;
    }
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy, HH:mm", { locale: localeId });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Backup & Restore">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-2 text-muted-foreground">Memuat data backup...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Backup & Restore" showBackButton backTo="/admin/dashboard">
      <div className="space-y-6">
        {/* Info Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <Shield className="h-5 w-5" />
              Backup & Restore Database
            </CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300">
              Kelola backup database untuk keamanan dan pemulihan data sistem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <Database className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Backup</p>
                  <p className="text-2xl font-bold">{backups?.length || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <HardDrive className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Ukuran</p>
                  <p className="text-2xl font-bold">
                    {formatFileSize(backups?.reduce((acc: number, b: any) => acc + (b.file_size || 0), 0) || 0)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Backup Terakhir</p>
                  <p className="text-sm font-medium">
                    {backups && backups.length > 0 
                      ? format(new Date(backups[0].created_at), "dd/MM/yyyy")
                      : "-"
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warning Card */}
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-orange-900 dark:text-orange-100">⚠️ Perhatian!</h4>
                <ul className="text-sm text-orange-800 dark:text-orange-200 mt-2 space-y-1 list-disc list-inside">
                  <li>Restore backup akan <strong>menimpa semua data saat ini</strong></li>
                  <li>Pastikan membuat backup terbaru sebelum melakukan restore</li>
                  <li>Proses restore tidak dapat dibatalkan setelah dimulai</li>
                  <li>Disarankan melakukan backup secara berkala (harian/mingguan)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Backup List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>Daftar Backup</CardTitle>
              <CardDescription>
                Total: {backups?.length || 0} backup tersimpan
              </CardDescription>
            </div>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Buat Backup Baru
            </Button>
          </CardHeader>
          <CardContent>
            {backups && backups.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Backup</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead>Tanggal Dibuat</TableHead>
                      <TableHead>Ukuran File</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Dibuat Oleh</TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backups.map((backup: any) => (
                      <TableRow key={backup.backup_id}>
                        <TableCell className="font-medium">{backup.backup_name}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {backup.description || <span className="text-muted-foreground italic">-</span>}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(backup.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <HardDrive className="h-4 w-4 text-muted-foreground" />
                            {formatFileSize(backup.file_size)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              backup.backup_status === "completed" ? "default" :
                              backup.backup_status === "failed" ? "destructive" : "secondary"
                            }
                          >
                            {backup.backup_status === "completed" ? "✅ Selesai" :
                             backup.backup_status === "failed" ? "❌ Gagal" : "⏳ Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {backup.created_by_username || "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(backup)}
                              title="Download Backup"
                              className="hover:bg-blue-50"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenRestore(backup)}
                              title="Restore Database"
                              className="hover:bg-green-50"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleOpenDelete(backup)}
                              title="Hapus Backup"
                            >
                              <Trash2 className="h-4 w-4" />
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
                <Database className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">Belum ada backup</p>
                <p className="text-sm mt-1">Buat backup pertama Anda untuk keamanan data</p>
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="mt-4"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Backup Sekarang
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Backup Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                Buat Backup Baru
              </DialogTitle>
              <DialogDescription>
                Backup database akan disimpan secara lokal di server
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateBackup}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="backup_name">
                    Nama Backup <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="backup_name"
                    placeholder="contoh: daily_backup, before_update"
                    value={formData.backup_name}
                    onChange={(e) => setFormData({ ...formData, backup_name: e.target.value })}
                    required
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground">
                    Hanya huruf, angka, underscore (_) dan hyphen (-) yang diperbolehkan
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi (Opsional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Catatan tentang backup ini..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.description.length}/500 karakter
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setFormData({ backup_name: "", description: "" });
                  }}
                  disabled={createMutation.isPending}
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Membuat Backup...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 mr-2" />
                      Buat Backup
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Restore Confirmation Dialog */}
        <AlertDialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Konfirmasi Restore Database
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3 pt-2">
                <p>Anda akan me-restore backup:</p>
                <div className="bg-muted p-3 rounded-md">
                  <p className="font-semibold text-foreground">{selectedBackup?.backup_name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Dibuat: {selectedBackup && formatDate(selectedBackup.created_at)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Ukuran: {selectedBackup && formatFileSize(selectedBackup.file_size)}
                  </p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded-md border border-orange-200 dark:border-orange-800">
                  <p className="text-orange-600 dark:text-orange-400 font-medium text-sm">
                    ⚠️ PERINGATAN PENTING:
                  </p>
                  <ul className="text-orange-700 dark:text-orange-300 text-sm mt-2 space-y-1 list-disc list-inside">
                    <li>Semua data saat ini akan diganti</li>
                    <li>Tindakan ini tidak dapat dibatalkan</li>
                    <li>Sistem akan dimuat ulang setelah restore</li>
                  </ul>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={restoreMutation.isPending}>
                Batal
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmRestore}
                className="bg-orange-600 hover:bg-orange-700"
                disabled={restoreMutation.isPending}
              >
                {restoreMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Restoring...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Ya, Restore Sekarang
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-600" />
                Hapus Backup
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3 pt-2">
                <p>Anda yakin ingin menghapus backup ini?</p>
                <div className="bg-muted p-3 rounded-md">
                  <p className="font-semibold text-foreground">{selectedBackup?.backup_name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedBackup?.description || "Tidak ada deskripsi"}
                  </p>
                </div>
                <p className="text-sm text-red-600 dark:text-red-400">
                  File backup akan dihapus secara permanen dari server.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>
                Batal
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive hover:bg-destructive/90"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Ya, Hapus
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminBackupPage;