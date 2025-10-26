import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Calendar, Clock, User, PawPrint, Building2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { shiftDokterApi } from '@/lib/api';

const PawrentShiftPage = () => {
  const { token } = useAuth();
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [selectedKlinik, setSelectedKlinik] = useState<string>('all');
  const [selectedDokter, setSelectedDokter] = useState<string>('all');

  const fetchShifts = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await shiftDokterApi.getAll(token);
      // Filter hanya shift aktif
      const activeShifts = data.filter((shift: any) => shift.is_active);
      setShifts(activeShifts);
    } catch (err: any) {
      console.error('Fetch shifts error', err);
      setError(err?.message || 'Gagal memuat data shift');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, [token]);

  const dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  // Dapatkan daftar klinik unik dari shifts
  const klinikList = Array.from(
    new Set(shifts.map((shift: any) => shift.klinik_id).filter(Boolean))
  ).map((klinikId: any) => {
    const shift = shifts.find((s: any) => s.klinik_id === klinikId);
    return {
      id: klinikId,
      name: shift?.nama_klinik || `Klinik ${klinikId}` // Menggunakan nama_klinik dari join
    };
  });

  // Dapatkan daftar dokter unik dari shifts
  const dokterList = Array.from(
    new Set(shifts.map((shift: any) => shift.dokter_id).filter(Boolean))
  ).map((dokterId: any) => {
    const shift = shifts.find((s: any) => s.dokter_id === dokterId);
    return {
      id: dokterId,
      name: `${shift?.title_dokter} ${shift?.nama_dokter}` || `Dokter ${dokterId}`
    };
  });

  // Filter shifts berdasarkan selectedDay, selectedKlinik, dan selectedDokter
  const filteredShifts = shifts.filter((shift: any) => {
    const dayMatch = selectedDay === 'all' || shift.hari_minggu.toString() === selectedDay;
    const klinikMatch = selectedKlinik === 'all' || shift.klinik_id.toString() === selectedKlinik;
    const dokterMatch = selectedDokter === 'all' || shift.dokter_id.toString() === selectedDokter;
    return dayMatch && klinikMatch && dokterMatch;
  });

  // Kelompokkan shift berdasarkan hari
  const shiftsByDay = filteredShifts.reduce((acc: any, shift: any) => {
    const day = shift.hari_minggu;
    if (!acc[day]) acc[day] = [];
    acc[day].push(shift);
    return acc;
  }, {});

  if (loading) {
    return (
      <DashboardLayout title="Jadwal Dokter">
        <div className="flex items-center justify-center h-64">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-2 text-muted-foreground">Memuat jadwal dokter...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Jadwal Dokter">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="text-red-600 flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Jadwal Dokter" showBackButton={true} backTo="/pawrent/dashboard">
      <div className="space-y-6">
        <Card className="bg-gradient-to-r from-blue-100 to-purple-100 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Jadwal Dokter Aktif
            </CardTitle>
            <p className="text-muted-foreground">Lihat jadwal kerja dokter untuk membuat booking</p>
          </CardHeader>
        </Card>

        {/* Filter Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter Jadwal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Filter berdasarkan Hari</label>
                <Select value={selectedDay} onValueChange={setSelectedDay}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Hari" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Hari</SelectItem>
                    {dayNames.map((day, index) => (
                      <SelectItem key={index + 1} value={(index + 1).toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Filter berdasarkan Klinik</label>
                <Select value={selectedKlinik} onValueChange={setSelectedKlinik}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Klinik" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Klinik</SelectItem>
                    {klinikList.map((klinik) => (
                      <SelectItem key={klinik.id} value={klinik.id.toString()}>
                        {klinik.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Filter berdasarkan Dokter</label>
                <Select value={selectedDokter} onValueChange={setSelectedDokter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Dokter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Dokter</SelectItem>
                    {dokterList.map((dokter) => (
                      <SelectItem key={dokter.id} value={dokter.id.toString()}>
                        {dokter.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {Object.keys(shiftsByDay).length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <PawPrint className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Belum ada jadwal</p>
              <p className="text-muted-foreground">Jadwal dokter belum tersedia untuk filter yang dipilih</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(shiftsByDay).map(([day, dayShifts]: [string, any]) => (
              <Card key={day} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {dayNames[parseInt(day) - 1]}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dayShifts.map((shift: any) => (
                    <div key={shift.shift_id} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">
                          {shift.title_dokter} {shift.nama_dokter}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Clock className="h-3 w-3" />
                        <span>{shift.jam_mulai} - {shift.jam_selesai}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        <span>{shift.nama_klinik || `Klinik ${shift.klinik_id}`}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PawrentShiftPage;