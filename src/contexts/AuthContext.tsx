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
  clearTokens,
  getUserRole,
  type UserRegistration,
} from "@/lib/api";

interface AuthContextType {
  isLoggedIn: boolean;
  loading: boolean;
  userRole: string | null;
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

  // Function to update auth state from token
  const updateAuthState = useCallback(() => {
    const loggedIn = isAuthenticated();
    setIsLoggedIn(loggedIn);
    if (loggedIn) {
      const role = getUserRole();
      setUserRole(role);
    } else {
      setUserRole(null);
    }
  }, []);

  // Check auth status on mount and when localStorage changes (multi‑tab)
  useEffect(() => {
    updateAuthState();
    setLoading(false);

    window.addEventListener("storage", updateAuthState);
    return () => window.removeEventListener("storage", updateAuthState);
  }, [updateAuthState]);

  const login = useCallback(async (phone: string, password: string) => {
    await apiLogin(phone, password);
    updateAuthState();
  }, [updateAuthState]);

  const register = useCallback(async (payload: UserRegistration) => {
    await apiRegister(payload);
    // Auto‑login after successful registration
    await apiLogin(payload.phone_number, payload.password);
    updateAuthState();
  }, [updateAuthState]);

  const logout = useCallback(() => {
    apiLogout();
    updateAuthState();
  }, [updateAuthState]);

  const getAccessToken = useCallback(() => {
    return localStorage.getItem("cc_access");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        loading,
        userRole,
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