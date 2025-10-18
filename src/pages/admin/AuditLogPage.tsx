import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Eye, Filter } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { auditLogApi } from "@/lib/api"; // ✅ Fixed import name

const AuditLogPage = () => {
  const { token } = useAuth();
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTable, setFilterTable] = useState<string>("all");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Fetch audit logs
  const { data: logs, isLoading } = useQuery({
    queryKey: ["auditLogs", filterTable, filterAction, startDate, endDate],
    queryFn: async () => {
      const params: any = {};
      
      if (filterTable !== "all") params.table = filterTable;
      if (filterAction !== "all") params.action = filterAction;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      return auditLogApi.getAll(params, token!);
    },
    enabled: !!token,
  });

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ["auditStats"],
    queryFn: () => auditLogApi.getStats(token!),
    enabled: !!token,
  });

  // Filter logs by search query
  const filteredLogs = logs?.filter((log: any) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      log.table_name?.toLowerCase().includes(searchLower) ||
      log.action_type?.toLowerCase().includes(searchLower) ||
      log.username?.toLowerCase().includes(searchLower) ||
      log.record_id?.toString().includes(searchLower)
    );
  });

  const handleViewDetail = (log: any) => {
    setSelectedLog(log);
    setIsDetailDialogOpen(true);
  };

  const getActionBadge = (action: string) => {
    const variants: any = {
      INSERT: "default",
      UPDATE: "secondary",
      DELETE: "destructive",
    };
    return <Badge variant={variants[action] || "outline"}>{action}</Badge>;
  };

  const tableNames = [
    "all",
    "User_Login",
    "Dokter",
    "Pawrent",
    "Hewan",
    "Kunjungan",
    "Obat",
    "Klinik",
    "Detail_Layanan",
  ];

  const actionTypes = ["all", "INSERT", "UPDATE", "DELETE"];

  return (
    <DashboardLayout title="Audit Log" showBackButton backTo="/admin/dashboard">
      <div className="space-y-6">
        {/* Statistics Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_logs}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Inserts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.total_inserts}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Updates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.total_updates}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Deletes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {stats.total_deletes}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Table</label>
                <Select value={filterTable} onValueChange={setFilterTable}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tableNames.map((table) => (
                      <SelectItem key={table} value={table}>
                        {table === "all" ? "All Tables" : table}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Action</label>
                <Select value={filterAction} onValueChange={setFilterAction}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {actionTypes.map((action) => (
                      <SelectItem key={action} value={action}>
                        {action === "all" ? "All Actions" : action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by table, action, user, or record ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Audit Logs</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Table</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Record ID</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          Tidak ada log ditemukan
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLogs?.map((log: any) => (
                        <TableRow key={log.log_id}>
                          <TableCell className="whitespace-nowrap">
                            {format(
                              new Date(log.action_timestamp),
                              "dd MMM yyyy HH:mm",
                              { locale: id }
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {log.table_name}
                          </TableCell>
                          <TableCell>{getActionBadge(log.action_type)}</TableCell>
                          <TableCell>{log.username || "-"}</TableCell>
                          <TableCell>{log.record_id}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetail(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Audit Log Detail</DialogTitle>
            </DialogHeader>
            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Timestamp
                    </label>
                    <p className="text-sm">
                      {format(
                        new Date(selectedLog.action_timestamp),
                        "dd MMMM yyyy HH:mm:ss",
                        { locale: id }
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Table
                    </label>
                    <p className="text-sm font-medium">{selectedLog.table_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Action
                    </label>
                    <div>{getActionBadge(selectedLog.action_type)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      User
                    </label>
                    <p className="text-sm">{selectedLog.username || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Record ID
                    </label>
                    <p className="text-sm">{selectedLog.record_id}</p>
                  </div>
                </div>

                {selectedLog.old_values && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Old Values
                    </label>
                    <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                      {JSON.stringify(
                        JSON.parse(selectedLog.old_values),
                        null,
                        2
                      )}
                    </pre>
                  </div>
                )}

                {selectedLog.new_values && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      New Values
                    </label>
                    <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                      {JSON.stringify(
                        JSON.parse(selectedLog.new_values),
                        null,
                        2
                      )}
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