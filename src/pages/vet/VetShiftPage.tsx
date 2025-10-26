import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { shiftDokterApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PawPrint, Clock, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const VetShiftPage = () => {
  const { token, user } = useAuth();
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchShifts = async () => {
    if (!token || !user?.dokter_id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await shiftDokterApi.getAll(token);
      // Filter hanya shift milik dokter ini
      const myShifts = data.filter((shift: any) => shift.dokter_id === user.dokter_id);
      setShifts(myShifts);
    } catch (err: any) {
      console.error('Fetch shifts error', err);
      setError(err?.message || 'Gagal memuat data shift');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, [token, user]);

  const dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  if (loading) {
    return (
      <DashboardLayout title="Shift Saya">
        <div className="flex items-center justify-center h-64">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-2 text-muted-foreground">Memuat data shift...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Shift Saya">
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
    <DashboardLayout title="Shift Saya" showBackButton={true} backTo="/vet/dashboard">
      <div className="space-y-6">
        <Card className="bg-gradient-to-r from-green-100 to-blue-100 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Jadwal Shift Dokter
            </CardTitle>
            <p className="text-muted-foreground">Lihat jadwal kerja Anda</p>
          </CardHeader>
        </Card>

        {shifts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <PawPrint className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Belum ada shift</p>
              <p className="text-muted-foreground">Shift Anda belum ditetapkan</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Daftar Shift
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Hari</TableHead>
                    <TableHead>Jam Mulai</TableHead>
                    <TableHead>Jam Selesai</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shifts.map((shift: any) => (
                    <TableRow key={shift.shift_id}>
                      <TableCell className="font-medium">
                        {dayNames[shift.hari_minggu - 1] || `Hari ${shift.hari_minggu}`}
                      </TableCell>
                      <TableCell>{shift.jam_mulai}</TableCell>
                      <TableCell>{shift.jam_selesai}</TableCell>
                      <TableCell>
                        <Badge variant={shift.is_active ? "default" : "secondary"}>
                          {shift.is_active ? "Aktif" : "Non-aktif"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default VetShiftPage;