import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Filter } from "lucide-react";
import { useState } from "react";
import { auditLogApi } from "@/lib/api";
import { DashboardLayout } from "@/components/DashboardLayout";

const AuditLogPage = () => {
  const { token } = useAuth();
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  // Fetch audit logs
  const { data: logs, isLoading } = useQuery({
    queryKey: ["auditLogs"],
    queryFn: () => auditLogApi.getAll({}, token!),
    enabled: !!token,
  });

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ["auditStats"],
    queryFn: () => auditLogApi.getStats(token!),
    enabled: !!token,
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

  return (
    <DashboardLayout title="Audit Log" showBackButton backTo="/admin/dashboard">
      <div className="space-y-6">
        {/* Statistics Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Total Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold">{stats.total_logs}</span>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Insert</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold">{stats.total_inserts}</span>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Update</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold">{stats.total_updates}</span>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Delete</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold">{stats.total_deletes}</span>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Audit Logs</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Tabel</TableCell>
                    <TableCell>Aksi</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Waktu</TableCell>
                    <TableCell>Detail</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs?.data?.map((log: any) => (
                    <TableRow key={log.log_id}>
                      <TableCell>{log.log_id}</TableCell>
                      <TableCell>{log.table_name}</TableCell>
                      <TableCell>{getActionBadge(log.action_type)}</TableCell>
                      <TableCell>{log.executed_by}</TableCell>
                      <TableCell>
                        {new Date(log.executed_at).toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell>
                        <button
                          className="text-primary underline"
                          onClick={() => handleViewDetail(log)}
                        >
                          Detail
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detail Audit Log</DialogTitle>
              <DialogDescription>
                Informasi lengkap perubahan data
              </DialogDescription>
            </DialogHeader>
            {selectedLog && (
              <div className="space-y-4">
                <div>
                  <b>ID:</b> {selectedLog.log_id}
                </div>
                <div>
                  <b>Tabel:</b> {selectedLog.table_name}
                </div>
                <div>
                  <b>Aksi:</b> {selectedLog.action_type}
                </div>
                <div>
                  <b>User:</b> {selectedLog.executed_by}
                </div>
                <div>
                  <b>Waktu:</b>{" "}
                  {new Date(selectedLog.executed_at).toLocaleString("id-ID")}
                </div>
                <div>
                  <b>Data Lama:</b>
                  <pre className="bg-muted p-2 rounded text-xs">
                    {selectedLog.old_data || "-"}
                  </pre>
                </div>
                <div>
                  <b>Data Baru:</b>
                  <pre className="bg-muted p-2 rounded text-xs">
                    {selectedLog.new_data || "-"}
                  </pre>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AuditLogPage;