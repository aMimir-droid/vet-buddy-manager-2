import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

const Dashboard = () => {
  const { user, isAdmin, isVet, isPawrent, isAdminKlinik } = useAuth();

  // Redirect based on role
  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  } else if (isVet) {
    return <Navigate to="/vet/dashboard" replace />;
  } else if (isPawrent) {
    return <Navigate to="/pawrent/dashboard" replace />;
  } else if (isAdminKlinik) {
    return <Navigate to="/admin-klinik/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
};

export default Dashboard;
