import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children?: React.ReactNode;
  // Added "ADMIN" to the allowed roles
  requiredRole?: "MERCHANT" | "WHOLESALER" | "ADMIN";
}

export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { isLoggedIn, loading, userRole } = useAuth();

  // 1. Still loading auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-[var(--brand-light)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 2. Not logged in → send to login
  if (!isLoggedIn) return <Navigate to="/login" replace />;

  // 3. Role Check & Redirection Logic
  if (requiredRole && userRole !== requiredRole) {
    // Determine the "Home Base" for each role to prevent unauthorized access
    switch (userRole) {
      case "ADMIN":
        return <Navigate to="/admin" replace />;
      case "WHOLESALER":
        return <Navigate to="/wholesaler" replace />;
      case "MERCHANT":
      default:
        return <Navigate to="/dashboard" replace />;
    }
  }

  // 4. Support both wrapper usage and Outlet usage
  return children ? <>{children}</> : <Outlet />;
}