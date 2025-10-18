import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { auditlogApi } from "@/lib/api";
import { 
  FileText, 
  Filter,
  Eye,
  Activity,
  Database,
  Users,
  Clock,
  Plus,
  Edit,
  Trash2,
  BarChart3
} from "lucide-react";

const AuditLogPage = () => {
  const { token } = useAuth();
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [filters, setFilters] = useState({
    start_date: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    table_name: "all",
    action_type: "all",
    executed_by: "",
    limit: 50,
    offset: 0,
  });

  // Prepare filters for API (convert "all" to empty string)
  const getApiFilters = () => {
    return {
      ...filters,
      table_name: filters.table_name === "all" ? "" : filters.table_name,
      action_type: filters.action_type === "all" ? "" : filters.action_type,
    };
  };

  const { data: logsData, isLoading } = useQuery({
    queryKey: ["auditlogs", filters],
    queryFn: () => auditlogApi.getAll(token!, getApiFilters()),
  });

  const { data: stats } = useQuery({
    queryKey: ["auditlog-stats"],
    queryFn: () => auditlogApi.getStats(token!),
  });

  const { data: byTable } = useQuery({
    queryKey: ["auditlog-by-table"],
    queryFn: () => auditlogApi.getByTable(token!),
  });

  const { data: byUser } = useQuery({
    queryKey: ["auditlog-by-user"],
    queryFn: () => auditlogApi.getByUser(token!),
  });

  const handleViewDetail = async (logId: number) => {
    try {
      const log = await auditlogApi.getById(logId, token!);
      setSelectedLog(log);
      setIsDetailDialogOpen(true);
    } catch (error) {
      console.error('Error fetching log detail:', error);
    }
  };

  const getActionBadge = (action: string) => {
    const variants: any = {
      'INSERT': <Badge className="bg-green-100 text-green-800 border-green-200"><Plus className="h-3 w-3 mr-1" /> INSERT</Badge>,
      'UPDATE': <Badge className="bg-blue-100 text-blue-800 border-blue-200"><Edit className="h-3 w-3 mr-1" /> UPDATE</Badge>,
      'DELETE': <Badge className="bg-red-100 text-red-800 border-red-200"><Trash2 className="h-3 w-3 mr-1" /> DELETE</Badge>,
    };
    return variants[action] || <Badge>{action}</Badge>;
  };

  const formatJSON = (jsonString: string | null) => {
    if (!jsonString) return null;
    try {
      return JSON.stringify(JSON.parse(jsonString), null, 2);
    } catch {
      return jsonString;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Audit Log">
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
    <DashboardLayout title="Audit Log" showBackButton={true}>
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_logs || 0}</div>
              <p className="text-xs text-muted-foreground">
                Hari ini: {stats?.today_logs || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Insert Operations</CardTitle>
              <Plus className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.total_inserts || 0}</div>
              <p className="text-xs text-muted-foreground">
                Data baru ditambahkan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Update Operations</CardTitle>
              <Edit className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats?.total_updates || 0}</div>
              <p className="text-xs text-muted-foreground">
                Data diperbarui
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delete Operations</CardTitle>
              <Trash2 className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats?.total_deletes || 0}</div>
              <p className="text-xs text-muted-foreground">
                Data dihapus
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="logs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="logs">Log Activity</TabsTrigger>
            <TabsTrigger value="by-table">By Table</TabsTrigger>
            <TabsTrigger value="by-user">By User</TabsTrigger>
          </TabsList>

          {/* Log Activity Tab */}
          <TabsContent value="logs" className="space-y-4">
            {/* Filter Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filter Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <Label htmlFor="start_date">Tanggal Mulai</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={filters.start_date}
                      onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">Tanggal Akhir</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={filters.end_date}
                      onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="table_name">Tabel</Label>
                    <Select
                      value={filters.table_name}
                      onValueChange={(value) => setFilters({ ...filters, table_name: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Semua Tabel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Tabel</SelectItem>
                        <SelectItem value="Pawrent">Pawrent</SelectItem>
                        <SelectItem value="Hewan">Hewan</SelectItem>
                        <SelectItem value="Kunjungan">Kunjungan</SelectItem>
                        <SelectItem value="Dokter">Dokter</SelectItem>
                        <SelectItem value="Obat">Obat</SelectItem>
                        <SelectItem value="User_Login">User Login</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="action_type">Aksi</Label>
                    <Select
                      value={filters.action_type}
                      onValueChange={(value) => setFilters({ ...filters, action_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Semua Aksi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Aksi</SelectItem>
                        <SelectItem value="INSERT">INSERT</SelectItem>
                        <SelectItem value="UPDATE">UPDATE</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="executed_by">User</Label>
                    <Input
                      id="executed_by"
                      placeholder="Cari user..."
                      value={filters.executed_by}
                      onChange={(e) => setFilters({ ...filters, executed_by: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Logs Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Activity Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Tabel</TableHead>
                      <TableHead>Aksi</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead className="text-right">Detail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logsData?.data?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Tidak ada log ditemukan
                        </TableCell>
                      </TableRow>
                    ) : (
                      logsData?.data?.map((log: any) => (
                        <TableRow key={log.log_id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">
                                  {new Date(log.executed_at).toLocaleDateString('id-ID')}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(log.executed_at).toLocaleTimeString('id-ID')}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="gap-1">
                              <Database className="h-3 w-3" />
                              {log.table_name}
                            </Badge>
                          </TableCell>
                          <TableCell>{getActionBadge(log.action_type)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              {log.executed_by || '-'}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetail(log.log_id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Menampilkan {logsData?.data?.length || 0} dari {logsData?.total || 0} logs
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* By Table Tab */}
          <TabsContent value="by-table" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Activity by Table
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tabel</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Insert</TableHead>
                      <TableHead>Update</TableHead>
                      <TableHead>Delete</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {byTable?.map((item: any) => (
                      <TableRow key={item.table_name}>
                        <TableCell className="font-medium">{item.table_name}</TableCell>
                        <TableCell>{item.count}</TableCell>
                        <TableCell className="text-green-600">{item.inserts}</TableCell>
                        <TableCell className="text-blue-600">{item.updates}</TableCell>
                        <TableCell className="text-red-600">{item.deletes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* By User Tab */}
          <TabsContent value="by-user" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Activity by User
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Total Activity</TableHead>
                      <TableHead>Last Activity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {byUser?.map((item: any) => (
                      <TableRow key={item.executed_by}>
                        <TableCell className="font-medium">{item.executed_by || '-'}</TableCell>
                        <TableCell>{item.count}</TableCell>
                        <TableCell>
                          {new Date(item.last_activity).toLocaleString('id-ID')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Detail Audit Log
              </DialogTitle>
              <DialogDescription>
                Log ID: {selectedLog?.log_id}
              </DialogDescription>
            </DialogHeader>
            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Tabel</Label>
                    <p className="font-medium">{selectedLog.table_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Aksi</Label>
                    <div className="mt-1">{getActionBadge(selectedLog.action_type)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">User</Label>
                    <p className="font-medium">{selectedLog.executed_by || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Waktu</Label>
                    <p className="font-medium">
                      {new Date(selectedLog.executed_at).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                {selectedLog.old_data && (
                  <div>
                    <Label className="text-muted-foreground">Data Lama</Label>
                    <pre className="mt-2 p-4 bg-red-50 border border-red-200 rounded-md text-xs overflow-x-auto">
                      {formatJSON(selectedLog.old_data)}
                    </pre>
                  </div>
                )}

                {selectedLog.new_data && (
                  <div>
                    <Label className="text-muted-foreground">Data Baru</Label>
                    <pre className="mt-2 p-4 bg-green-50 border border-green-200 rounded-md text-xs overflow-x-auto">
                      {formatJSON(selectedLog.new_data)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AuditLogPage;