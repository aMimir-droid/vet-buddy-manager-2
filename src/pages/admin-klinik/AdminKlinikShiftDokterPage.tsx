import React, { useEffect, useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { shiftDokterApi, dokterApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PawPrint, Clock, User, Calendar, Plus, Edit, Trash2, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

const AdminKlinikShiftDokterPage = () => {
  const { token, user } = useAuth();
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingShift, setEditingShift] = useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [form, setForm] = useState({
    dokter_id: '',
    hari_minggu: '1',
    jam_mulai: '',
    jam_selesai: '',
    is_active: true,
  });
  const [selectedDokter, setSelectedDokter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch semua dokter (sudah difilter berdasarkan klinik di backend untuk admin klinik)
  const { data: allDokters = [] } = useQuery({
    queryKey: ['dokters'],
    queryFn: () => dokterApi.getAll(token!),
    enabled: !!token,
  });

  // Karena API sudah filter berdasarkan klinik, langsung gunakan allDokters
  const filteredDokters = allDokters;

  // Fetch shifts berdasarkan klinik user
  const { data: shiftsData, isLoading, refetch } = useQuery({
    queryKey: ['shifts-by-klinik', user?.klinik_id],
    queryFn: () => shiftDokterApi.getByKlinik(user!.klinik_id!, token!),
    enabled: !!token && !!user?.klinik_id,
  });

  useEffect(() => {
    if (shiftsData) {
      setShifts(Array.isArray(shiftsData) ? shiftsData : []);
    }
  }, [shiftsData]);

  const dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !user?.klinik_id) return setError('User belum login');
    if (!form.dokter_id || !form.jam_mulai || !form.jam_selesai) return setError('Isi semua field yang diperlukan');
    setError(null);
    try {
      const payload = {
        dokter_id: parseInt(form.dokter_id, 10),
        hari_minggu: parseInt(form.hari_minggu, 10),
        jam_mulai: form.jam_mulai,
        jam_selesai: form.jam_selesai,
        is_active: form.is_active,
      };
      await shiftDokterApi.createByKlinik(user.klinik_id, payload, token);
      setIsCreateDialogOpen(false);
      setForm({ dokter_id: '', hari_minggu: '1', jam_mulai: '', jam_selesai: '', is_active: true });
      refetch();
      toast.success('Shift berhasil ditambahkan');
    } catch (err: any) {
      console.error('Create shift error', err);
      setError(err?.message || 'Gagal membuat shift');
      toast.error(err?.message || 'Gagal membuat shift');
    }
  };

  const handleEdit = (shift: any) => {
    setEditingShift(shift);
    setForm({
      dokter_id: shift.dokter_id.toString(),
      hari_minggu: shift.hari_minggu.toString(),
      jam_mulai: shift.jam_mulai,
      jam_selesai: shift.jam_selesai,
      is_active: shift.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingShift || !user?.klinik_id) return;
    setError(null);
    try {
      const payload = {
        dokter_id: parseInt(form.dokter_id, 10),
        hari_minggu: parseInt(form.hari_minggu, 10),
        jam_mulai: form.jam_mulai,
        jam_selesai: form.jam_selesai,
        is_active: form.is_active,
      };
      await shiftDokterApi.updateByKlinik(user.klinik_id, editingShift.shift_id, payload, token);
      setIsEditDialogOpen(false);
      setEditingShift(null);
      setForm({ dokter_id: '', hari_minggu: '1', jam_mulai: '', jam_selesai: '', is_active: true });
      refetch();
      toast.success('Shift berhasil diupdate');
    } catch (err: any) {
      console.error('Update shift error', err);
      setError(err?.message || 'Gagal update shift');
      toast.error(err?.message || 'Gagal update shift');
    }
  };

  const handleDelete = async (shiftId: number) => {
    if (!token || !user?.klinik_id) return;
    if (!confirm('Apakah Anda yakin ingin menghapus shift ini?')) return;
    try {
      await shiftDokterApi.deleteByKlinik(user.klinik_id, shiftId, token);
      refetch();
      toast.success('Shift berhasil dihapus');
    } catch (err: any) {
      console.error('Delete shift error', err);
      setError(err?.message || 'Gagal hapus shift');
      toast.error(err?.message || 'Gagal hapus shift');
    }
  };

  const groupedShifts = shifts.reduce((acc: any, shift: any) => {
    const key = shift.dokter_id;
    if (!acc[key]) {
      acc[key] = {
        dokter: { nama_dokter: shift.nama_dokter, title_dokter: shift.title_dokter },
        shifts: []
      };
    }
    acc[key].shifts.push(shift);
    return acc;
  }, {});

  const sortedGroupedShifts = Object.keys(groupedShifts)
    .sort((a, b) => {
      const nameA = groupedShifts[a].dokter.nama_dokter || '';
      const nameB = groupedShifts[b].dokter.nama_dokter || '';
      return nameA.localeCompare(nameB);
    })
    .map(key => ({ key, ...groupedShifts[key] }));

  let filteredGroupedShifts = selectedDokter === 'all' 
    ? sortedGroupedShifts 
    : sortedGroupedShifts.filter((group: any) => group.key === selectedDokter);

  if (searchTerm) {
    filteredGroupedShifts = filteredGroupedShifts.filter((group: any) =>
      group.dokter.nama_dokter.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.dokter.title_dokter.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Kelola Shift Dokter">
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
    <DashboardLayout title="Kelola Shift Dokter" showBackButton={true}>
      <div className="space-y-6">
        <Card className="shadow-lg border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <PawPrint className="h-5 w-5" />
              Daftar Shift Dokter di Klinik Anda
            </CardTitle>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Shift
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-green-600" />
                    Tambah Shift Baru
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dokter_id" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Dokter
                      </Label>
                      <Select 
                        name="dokter_id" 
                        value={form.dokter_id} 
                        onValueChange={(value) => setForm(prev => ({ ...prev, dokter_id: value }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Pilih Dokter" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredDokters.map((d: any) => (
                            <SelectItem key={d.dokter_id} value={d.dokter_id.toString()}>
                              {d.title_dokter} {d.nama_dokter}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="hari_minggu" className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Hari
                      </Label>
                      <Select name="hari_minggu" value={form.hari_minggu} onValueChange={(value) => setForm(prev => ({ ...prev, hari_minggu: value }))}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {dayNames.map((d, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="jam_mulai" className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Jam Mulai
                      </Label>
                      <Input
                        id="jam_mulai"
                        name="jam_mulai"
                        type="time"
                        value={form.jam_mulai}
                        onChange={handleChange}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="jam_selesai" className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Jam Selesai
                      </Label>
                      <Input
                        id="jam_selesai"
                        name="jam_selesai"
                        type="time"
                        value={form.jam_selesai}
                        onChange={handleChange}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_active"
                      name="is_active"
                      checked={form.is_active}
                      onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_active: !!checked }))}
                    />
                    <Label htmlFor="is_active">Aktif</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                      Simpan
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreateDialogOpen(false);
                        setForm({ dokter_id: '', hari_minggu: '1', jam_mulai: '', jam_selesai: '', is_active: true });
                      }}
                    >
                      Batal
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
        </Card>

        {error && (
          <Card className="border-red-200 bg-red-50 shadow-lg">
            <CardContent className="p-4">
              <div className="text-red-600 flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            </CardContent>
          </Card>
        )}

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="w-6 h-6 text-green-600" />
                Edit Shift
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_dokter_id" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Dokter
                  </Label>
                  <Select 
                    name="dokter_id" 
                    value={form.dokter_id} 
                    onValueChange={(value) => setForm(prev => ({ ...prev, dokter_id: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Pilih Dokter" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredDokters.map((d: any) => (
                        <SelectItem key={d.dokter_id} value={d.dokter_id.toString()}>
                          {d.title_dokter} {d.nama_dokter}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit_hari_minggu" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Hari
                  </Label>
                  <Select name="hari_minggu" value={form.hari_minggu} onValueChange={(value) => setForm(prev => ({ ...prev, hari_minggu: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dayNames.map((d, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit_jam_mulai" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Jam Mulai
                  </Label>
                  <Input
                    id="edit_jam_mulai"
                    name="jam_mulai"
                    type="time"
                    value={form.jam_mulai}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_jam_selesai" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Jam Selesai
                  </Label>
                  <Input
                    id="edit_jam_selesai"
                    name="jam_selesai"
                    type="time"
                    value={form.jam_selesai}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit_is_active"
                  name="is_active"
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_active: !!checked }))}
                />
                <Label htmlFor="edit_is_active">Aktif</Label>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                  Update
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingShift(null);
                    setForm({ dokter_id: '', hari_minggu: '1', jam_mulai: '', jam_selesai: '', is_active: true });
                  }}
                >
                  Batal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Card className="shadow-lg border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="filter-dokter" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Filter Dokter
                </Label>
                <Select value={selectedDokter} onValueChange={setSelectedDokter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Pilih Dokter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Dokter</SelectItem>
                    {filteredDokters.map((d: any) => (
                      <SelectItem key={d.dokter_id} value={d.dokter_id.toString()}>
                        {d.title_dokter} {d.nama_dokter}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="search" className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Cari Nama Dokter
                </Label>
                <Input
                  id="search"
                  type="text"
                  placeholder="Masukkan nama dokter..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-48"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {filteredGroupedShifts.map((group: any) => (
          <Card key={group.key} className="shadow-lg border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-green-600" />
                {group.dokter.title_dokter} {group.dokter.nama_dokter}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>No</TableHead>
                    <TableHead>Hari</TableHead>
                    <TableHead>Jam Mulai</TableHead>
                    <TableHead>Jam Selesai</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.shifts.map((s: any, index: number) => (
                    <TableRow key={s.shift_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{typeof s.hari_minggu === 'number' ? dayNames[s.hari_minggu - 1] ?? s.hari_minggu : s.hari_minggu}</TableCell>
                      <TableCell>{s.jam_mulai}</TableCell>
                      <TableCell>{s.jam_selesai}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${s.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {s.is_active ? 'Aktif' : 'Non-aktif'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(s)} className="flex items-center gap-1">
                            <Edit className="w-3 h-3" />
                            Edit
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(s.shift_id)} className="flex items-center gap-1">
                            <Trash2 className="w-3 h-3" />
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
        ))}
      </div>
    </DashboardLayout>
  );
};

export default AdminKlinikShiftDokterPage;