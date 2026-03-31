import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  isAuthenticated,
  getUserRole,
  type UserRegistration,
  type UserProfile,
  userApi,
} from "@/lib/api";

interface AuthContextType {
  isLoggedIn: boolean;
  loading: boolean;
  userRole: string | null;
  profile: UserProfile | null;
  login: (phone: string, password: string) => Promise<void>;
  register: (payload: UserRegistration) => Promise<void>;
  logout: () => void;
  getAccessToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

/** Returns true only if the cached profile has real data (not the old empty stub). */
function isValidProfile(p: UserProfile | null): boolean {
  if (!p) return false;
  // Reject the old stub: first_name "User" + empty phone is the fallback pattern
  if (p.first_name === "User" && !p.phone_number && !p.last_name) return false;
  return true;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn]   = useState(false);
  const [loading,    setLoading]      = useState(true);
  const [userRole,   setUserRole]     = useState<string | null>(null);
  const [profile,    setProfile]      = useState<UserProfile | null>(null);

  /**
   * Hit /auth/profile/ and update state + cache.
   * This is the single source of truth for profile data.
   */
  const fetchAndSetProfile = useCallback(async (): Promise<UserProfile | null> => {
    try {
      const userProfile = await userApi.getProfile();
      setProfile(userProfile);
      setUserRole(userProfile.role ?? null);
      localStorage.setItem("user_profile", JSON.stringify(userProfile));
      if (userProfile.role) localStorage.setItem("user_role", userProfile.role);
      return userProfile;
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      return null;
    }
  }, []);

  /**
   * Sync React state with localStorage/API.
   * Called on mount, after login, and on cross-tab storage events.
   */
  const updateAuthState = useCallback(async () => {
    const loggedIn = isAuthenticated();
    setIsLoggedIn(loggedIn);

    if (!loggedIn) {
      setUserRole(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    // ── 1. Instant restore from cache (avoids blank flash) ────────────────
    const raw = localStorage.getItem("user_profile");
    if (raw) {
      try {
        const cached: UserProfile = JSON.parse(raw);
        if (isValidProfile(cached)) {
          setProfile(cached);
          setUserRole(cached.role ?? getUserRole());
        }
      } catch {
        localStorage.removeItem("user_profile");
      }
    }

    // ── 2. Always refresh from the real API ──────────────────────────────
    await fetchAndSetProfile();
    setLoading(false);
  }, [fetchAndSetProfile]);

  useEffect(() => {
    updateAuthState();
    window.addEventListener("storage", updateAuthState);
    return () => window.removeEventListener("storage", updateAuthState);
  }, [updateAuthState]);

  const login = useCallback(
    async (phone: string, password: string) => {
      // apiLogin now caches profile data from the token response immediately
      await apiLogin(phone, password);
      await updateAuthState();
    },
    [updateAuthState],
  );

  const register = useCallback(
    async (payload: UserRegistration) => {
      await apiRegister(payload);
      await apiLogin(payload.phone_number, payload.password);
      await updateAuthState();
    },
    [updateAuthState],
  );

  const logout = useCallback(() => {
    apiLogout();
    setIsLoggedIn(false);
    setUserRole(null);
    setProfile(null);
    setLoading(false);
  }, []);

  const getAccessToken = useCallback(
    () => localStorage.getItem("cc_access"),
    [],
  );

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, loading, userRole, profile, login, register, logout, getAccessToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}