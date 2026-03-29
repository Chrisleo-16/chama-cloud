import { useState, useEffect } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, Moon, Sun, Globe, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DashboardLayout() {
  const { logout, isLoggedIn, userRole, profile, loading } = useAuth();
  
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  const [language, setLanguage] = useState<"en" | "sw">(() => {
    return (localStorage.getItem("language") as "en" | "sw") || "en";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  // 1. Prevent the "White Screen" while AuthContext is checking local storage
  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium animate-pulse">Syncing Chama Cloud...</p>
      </div>
    );
  }

  // 2. Security: If the token is invalid or missing, kick back to login
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background text-foreground">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border bg-card px-4 sticky top-0 z-20">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="hidden md:block">
                <p className="text-sm font-semibold">
                  {profile?.first_name ? `Jambo, ${profile.first_name}` : "Dashboard"}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                  {userRole}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Language switcher */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <Globe className="h-4 w-4" />
                    <span>{language === "en" ? "EN" : "SW"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setLanguage("en")}>English</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage("sw")}>Kiswahili</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="ghost" size="sm" onClick={() => setTheme(t => t === "light" ? "dark" : "light")}>
                {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>

              <Button variant="ghost" size="sm" onClick={logout} className="hover:text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </div>
          </header>
          
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
            {/* 3. The Outlet is where your specific pages (Overview, etc.) appear */}
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}