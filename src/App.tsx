import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
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
import AdminDashboard from "./pages/admin/AdminDashboard";
import Wholesalers from "./pages/admin/Wholesalers";
import Refund from "./pages/admin/Refund";
import WholesalerPortal from "./pages/admin/WholesalersPortal";
import Profile from "./pages/dashboard/Profiles";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Overview />} />
              <Route path="groups" element={<Groups />} />
              <Route path="contributions" element={<Contributions />} />
              <Route path="payments" element={<Payments />} />
              <Route path="vouchers" element={<Vouchers />} />
              <Route path="profile" element={<Profile/>}/>
            </Route>
            <Route element={<AdminGuard />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="wholesalers" element={<Wholesalers />} />
                <Route path="refund" element={<Refund />} />
                <Route path="portal" element={<WholesalerPortal />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;