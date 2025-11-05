import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Eye, Filter, X } from "lucide-react";
import { auditLogApi } from "@/lib/api";
import { format } from "date-fns";

const AdminKlinikAuditLogPage = () => {
  const { token } = useAuth();
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [filters, setFilters] = useState({
    start_date: "",
    end_date: "",
    limit: 100,
    offset: 0,
  });

  // Fetch audit logs for this klinik only
  const { data: logsData, isLoading } = useQuery({
    queryKey: ["auditLogsByKlinik", filters],
    queryFn: () => auditLogApi.getByKlinik(filters, token!),
    enabled: !!token,
  });

  // Fetch statistics for this klinik
  const { data: stats } = useQuery({
    queryKey: ["auditStatsKlinik"],
    queryFn: () => auditLogApi.getStats(token!),
    enabled: !!token,
  });

  const handleViewDetail = async (log: any) => {
    try {
      const detailData = await auditLogApi.getById(log.log_id, token!);
      setSelectedLog(detailData);
      setIsDetailDialogOpen(true);
    } catch (error) {
      console.error("Error fetching log detail:", error);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, offset: 0 }));
  };

  const handleClearFilters = () => {
    setFilters({
      start_date: "",
      end_date: "",
      limit: 100,
      offset: 0,
    });
  };

  const getActionBadge = (action: string) => {
    const variants: any = {
      INSERT: "default",
      UPDATE: "secondary",
      DELETE: "destructive",
    };
    return (
      <Badge variant={variants[action] || "outline"}>
        {action}
      </Badge>
    );
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy HH:mm:ss");
    } catch {
      return dateString;
    }
  };

  return (
    <DashboardLayout title="Audit Log Klinik" showBackButton backTo="/admin-klinik/dashboard">
      <div className="space-y-6">
        {/* Info Card */}
        <Card className="bg-gradient-to-r from-purple-100 to-purple-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              Audit Log Klinik Anda
            </CardTitle>
            <CardDescription>
              Monitor aktivitas dan perubahan data di klinik Anda
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold">{stats.total_logs}</span>
                <p className="text-xs text-muted-foreground mt-1">
                  Minggu ini: {stats.week_logs}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Insert</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold text-green-600">
                  {stats.total_inserts}
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Update</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold text-blue-600">
                  {stats.total_updates}
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Delete</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold text-red-600">
                  {stats.total_deletes}
                </span>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => handleFilterChange("start_date", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => handleFilterChange("end_date", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Audit Logs</CardTitle>
            <CardDescription>
              Total: {logsData?.total || 0} logs untuk klinik Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Table</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Summary</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logsData?.data?.map((log: any) => (
                      <TableRow key={log.log_id}>
                        <TableCell>
                          <Badge variant="outline">{log.table_name}</Badge>
                        </TableCell>
                        <TableCell>{getActionBadge(log.action_type)}</TableCell>
                        <TableCell>{log.executed_by || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{log.role_name || "-"}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {log.changes_summary || "-"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDateTime(log.executed_at)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(log)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Detail
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
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
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Detail Audit Log
              </DialogTitle>
              <DialogDescription>
                Informasi lengkap perubahan data
              </DialogDescription>
            </DialogHeader>
            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Table</Label>
                    <p className="font-medium">{selectedLog.table_name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Action</Label>
                    <div>{getActionBadge(selectedLog.action_type)}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">User</Label>
                    <p className="font-medium">{selectedLog.executed_by || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Role</Label>
                    <p className="font-medium">{selectedLog.role_name || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Date & Time</Label>
                    <p className="font-medium">
                      {formatDateTime(selectedLog.executed_at)}
                    </p>
                  </div>
                </div>

                {selectedLog.changes_summary && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Summary</Label>
                    <p className="text-sm bg-muted p-3 rounded-md mt-1">
                      {selectedLog.changes_summary}
                    </p>
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

export default AdminKlinikAuditLogPage;