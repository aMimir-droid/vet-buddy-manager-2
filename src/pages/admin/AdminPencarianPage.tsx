import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiCall } from "@/lib/api";
import { useNavigate } from "react-router-dom";

const AdminPencarianPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  // State untuk input
  const [hewanId, setHewanId] = useState("");
  const [jenisId, setJenisId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // State untuk hasil
  const [riwayatResult, setRiwayatResult] = useState<any[]>([]);
  const [hewanResult, setHewanResult] = useState<any[]>([]);
  const [kunjunganResult, setKunjunganResult] = useState<any[]>([]);

  // Handler
  const handleRiwayatSearch = async () => {
    if (!hewanId) return;
    const res = await apiCall<any[]>({
      endpoint: `/pencarian/riwayat-kunjungan/${hewanId}`,
      method: "GET",
      token,
    });
    setRiwayatResult(res);
  };

  const handleHewanSearch = async () => {
    if (!jenisId) return;
    const res = await apiCall<any[]>({
      endpoint: `/pencarian/hewan-by-jenis/${jenisId}`,
      method: "GET",
      token,
    });
    setHewanResult(res);
  };

  const handleKunjunganSearch = async () => {
    if (!startDate || !endDate) return;
    const res = await apiCall<any[]>({
      endpoint: `/pencarian/kunjungan-by-date?start=${startDate}&end=${endDate}`,
      method: "GET",
      token,
    });
    setKunjunganResult(res);
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Pencarian Data</h1>

      <button
        className="mb-6 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded"
        onClick={() => navigate("/admin/dashboard")}
      >
        &larr; Kembali ke Dashboard
      </button>

      {/* Riwayat Kunjungan by Hewan */}
      <div className="mb-8 p-4 border rounded bg-white shadow">
        <h2 className="font-semibold mb-2">Riwayat Kunjungan Hewan</h2>
        <div className="flex items-center mb-2">
          <input
            type="number"
            placeholder="ID Hewan"
            value={hewanId}
            onChange={e => setHewanId(e.target.value)}
            className="border px-2 py-1 mr-2 rounded"
          />
          <button onClick={handleRiwayatSearch} className="bg-primary text-white px-4 py-1 rounded">
            Cari
          </button>
        </div>
        {riwayatResult.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-primary text-white">
                <tr>
                  <th className="px-2 py-1 border">ID Kunjungan</th>
                  <th className="px-2 py-1 border">Tanggal</th>
                  <th className="px-2 py-1 border">Dokter</th>
                  <th className="px-2 py-1 border">Diagnosa</th>
                </tr>
              </thead>
              <tbody>
                {riwayatResult.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-100">
                    <td className="px-2 py-1 border">{row.ID_Kunjungan}</td>
                    <td className="px-2 py-1 border">
                      {row.Tanggal
                        ? new Date(row.Tanggal).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric"
                          })
                        : "-"}
                    </td>
                    <td className="px-2 py-1 border">{row.Dokter}</td>
                    <td className="px-2 py-1 border">{row.Diagnosa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 mt-2">Belum ada data.</p>
        )}
      </div>

      {/* Hewan by Jenis */}
      <div className="mb-8 p-4 border rounded bg-white shadow">
        <h2 className="font-semibold mb-2">Hewan Berdasarkan Jenis</h2>
        <div className="flex items-center mb-2">
          <input
            type="number"
            placeholder="ID Jenis Hewan"
            value={jenisId}
            onChange={e => setJenisId(e.target.value)}
            className="border px-2 py-1 mr-2 rounded"
          />
          <button onClick={handleHewanSearch} className="bg-primary text-white px-4 py-1 rounded">
            Cari
          </button>
        </div>
        {hewanResult.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-primary text-white">
                <tr>
                  <th className="px-2 py-1 border">Nama Hewan</th>
                  <th className="px-2 py-1 border">Nama Pemilik</th>
                </tr>
              </thead>
              <tbody>
                {hewanResult.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-100">
                    <td className="px-2 py-1 border">{row.Nama_Hewan}</td>
                    <td className="px-2 py-1 border">{row.Nama_Pemilik}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 mt-2">Belum ada data.</p>
        )}
      </div>

      {/* Kunjungan by Date Range */}
      <div className="mb-8 p-4 border rounded bg-white shadow">
        <h2 className="font-semibold mb-2">Kunjungan Berdasarkan Rentang Tanggal</h2>
        <div className="flex items-center mb-2">
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="border px-2 py-1 mr-2 rounded"
          />
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="border px-2 py-1 mr-2 rounded"
          />
          <button onClick={handleKunjunganSearch} className="bg-primary text-white px-4 py-1 rounded">
            Cari
          </button>
        </div>
        {kunjunganResult.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-primary text-white">
                <tr>
                  <th className="px-2 py-1 border">ID Kunjungan</th>
                  <th className="px-2 py-1 border">Tanggal Kunjungan</th>
                  <th className="px-2 py-1 border">Nama Hewan</th>
                  <th className="px-2 py-1 border">Nama Pemilik</th>
                  <th className="px-2 py-1 border">Nama Dokter</th>
                </tr>
              </thead>
              <tbody>
                {kunjunganResult.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-100">
                    <td className="px-2 py-1 border">{row.ID_Kunjungan}</td>
                    <td className="px-2 py-1 border">
                      {row.Tanggal_Kunjungan
                        ? new Date(row.Tanggal_Kunjungan).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric"
                          })
                        : "-"}
                    </td>
                    <td className="px-2 py-1 border">{row.Nama_Hewan}</td>
                    <td className="px-2 py-1 border">{row.Nama_Pemilik}</td>
                    <td className="px-2 py-1 border">{row.Nama_Dokter}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 mt-2">Belum ada data.</p>
        )}
      </div>
    </div>
  );
};

export default AdminPencarianPage;