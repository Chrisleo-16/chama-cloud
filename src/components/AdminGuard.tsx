import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminGuard() {
  const { isLoggedIn, userRole, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (userRole !== "WHOLESALER") return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}