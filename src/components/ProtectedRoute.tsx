import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children?: React.ReactNode;
  // Optional — if provided, user must have this role or gets redirected
  requiredRole?: "MERCHANT" | "WHOLESALER";
}

export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { isLoggedIn, loading, userRole } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-[var(--brand-light)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in → send to login
  if (!isLoggedIn) return <Navigate to="/login" replace />;

  // Wrong role → redirect to correct dashboard
  if (requiredRole && userRole !== requiredRole) {
    if (userRole === "WHOLESALER") return <Navigate to="/wholesaler" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  // Support both wrapper usage (<ProtectedRoute><Layout/></ProtectedRoute>)
  // and outlet usage (<ProtectedRoute/> wrapping nested routes via AdminGuard pattern)
  return children ? <>{children}</> : <Outlet />;
}