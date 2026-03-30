import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminGuard from "@/components/AdminGuard";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import AdminLayout from "./pages/admin/AdminLayout";
import Overview from "./pages/dashboard/Overview";
import Groups from "./pages/dashboard/Groups";
import Contributions from "./pages/dashboard/Contributions";
import Payments from "./pages/dashboard/Payments";
import Vouchers from "./pages/dashboard/Vouchers";
import Deposit from "./pages/dashboard/Deposit";
import Withdraw from "./pages/dashboard/Withdraw";
import NewChama from "./pages/dashboard/NewChama";
import Invite from "./pages/dashboard/Invite";
import GroupDetails from "./pages/dashboard/GroupDetails";
import Reports from "./pages/dashboard/Reports";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Wholesalers from "./pages/admin/Wholesalers";
import Refund from "./pages/admin/Refund";
import WholesalerPortal from "./pages/admin/WholesalersPortal";
import Profile from "./pages/dashboard/Profiles";
import WholesalerDashboard from "./pages/wholesaler/WholesalersDashboard";
import CreditEngine from "./pages/dashboard/CreditEngine";

const queryClient = new QueryClient();

// ── Smart root redirect based on role ────────────────────────────────────────
// Must be inside AuthProvider to use useAuth()
function RootRedirect() {
  const { isLoggedIn, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-[var(--brand-light)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (userRole === "WHOLESALER") return <Navigate to="/wholesaler" replace />;
  return <Navigate to="/dashboard" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Landing */}
            <Route path="/" element={<Index />} />

            {/* Auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* ── Merchant Dashboard ──────────────────────────────────── */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredRole="MERCHANT">
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Overview />} />
              <Route path="groups" element={<Groups />} />
              <Route path="contributions" element={<Contributions />} />
              <Route path="payments" element={<Payments />} />
              <Route path="vouchers" element={<Vouchers />} />
              <Route path="deposit" element={<Deposit />} />
              <Route path="withdraw" element={<Withdraw />} />
              <Route path="new-chama" element={<NewChama />} />
              <Route path="invite" element={<Invite />} />
              <Route path="reports" element={<Reports />} />
              <Route path="group/:id" element={<GroupDetails />} />
              <Route path="profile" element={<Profile />} />
              <Route path="credit"     element={<CreditEngine />} />
            </Route>

            {/* ── Wholesaler Dashboard ────────────────────────────────── */}
            {/* Wholesalers get their own standalone page, no shared layout */}
            <Route
              path="/wholesaler"
              element={
                <ProtectedRoute requiredRole="WHOLESALER">
                  <WholesalerDashboard />
                </ProtectedRoute>
              }
            />

            {/* ── Admin ───────────────────────────────────────────────── */}
            <Route element={<AdminGuard />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="wholesalers" element={<Wholesalers />} />
                <Route path="refund" element={<Refund />} />
                <Route path="portal" element={<WholesalerPortal />} />
              </Route>
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
