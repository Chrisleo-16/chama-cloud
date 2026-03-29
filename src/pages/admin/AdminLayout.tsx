import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  LayoutDashboard, 
  Building2, 
  RefreshCcw, 
  Store, 
  LogOut,
  Sprout
} from "lucide-react";

const adminNav = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/wholesalers", label: "Wholesalers", icon: Building2 },
  { path: "/admin/refund", label: "Refund", icon: RefreshCcw },
  { path: "/admin/portal", label: "Wholesaler Portal", icon: Store },
];

export default function AdminLayout() {
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar */}
      <aside className="cc-sidebar w-64 fixed top-0 left-0 h-full flex flex-col">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Sprout className="h-7 w-7 text-brand" />
            <span className="text-xl font-display font-bold text-foreground">Admin</span>
          </div>
          <p className="text-xs text-fg-2 mt-1">Wholesaler Panel</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {adminNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`cc-nav ${isActive ? "active" : ""}`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <button onClick={logout} className="cc-nav w-full text-left">
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="ml-64 flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}