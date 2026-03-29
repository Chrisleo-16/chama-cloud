import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  isAuthenticated,
  clearTokens,
  getUserRole,
  getUserFromToken,
  type UserRegistration,
  type UserProfile,
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Read auth state from token in localStorage
  const updateAuthState = useCallback(() => {
    const loggedIn = isAuthenticated();
    setIsLoggedIn(loggedIn);
    if (loggedIn) {
      const role = localStorage.getItem("user_role") || getUserRole();
      const user = getUserFromToken();
      setUserRole(role);
      setProfile(user);
    } else {
      setUserRole(null);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    updateAuthState();
    setLoading(false);
    window.addEventListener("storage", updateAuthState);
    return () => window.removeEventListener("storage", updateAuthState);
  }, [updateAuthState]);

  const login = useCallback(
    async (phone: string, password: string) => {
      const response = await apiLogin(phone, password);
      if (response.role) {
        localStorage.setItem("user_role", response.role);
      }
      updateAuthState();

      // Role-based redirect is handled in ProtectedRoute / LoginPage
      // by reading userRole after this resolves
    },
    [updateAuthState],
  );

  const register = useCallback(
    async (payload: UserRegistration) => {
      await apiRegister(payload);
      await apiLogin(payload.phone_number, payload.password);
      updateAuthState();
    },
    [updateAuthState],
  );

  const logout = useCallback(() => {
    apiLogout();
    updateAuthState();
  }, [updateAuthState]);

  const getAccessToken = useCallback(
    () => localStorage.getItem("cc_access"),
    [],
  );

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        loading,
        userRole,
        profile,
        login,
        register,
        logout,
        getAccessToken,
      }}
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
