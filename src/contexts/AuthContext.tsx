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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const fetchAndSetProfile = useCallback(async () => {
    try {
      const userProfile = await userApi.getProfile();
      setProfile(userProfile);
      // Cache in localStorage for instant load on next page refresh
      localStorage.setItem("user_profile", JSON.stringify(userProfile));
      return userProfile;
    } catch (error) {
      console.error("Failed to fetch profile", error);
      return null;
    }
  }, []);

  const updateAuthState = useCallback(async () => {
    const loggedIn = isAuthenticated();
    setIsLoggedIn(loggedIn);
    if (loggedIn) {
      const role = localStorage.getItem("user_role") || getUserRole();
      setUserRole(role);

      // First try to restore profile from localStorage for speed
      const storedProfile = localStorage.getItem("user_profile");
      if (storedProfile) {
        try {
          setProfile(JSON.parse(storedProfile));
        } catch (e) {}
      }

      // Then fetch fresh profile (async)
      await fetchAndSetProfile();
    } else {
      setUserRole(null);
      setProfile(null);
      localStorage.removeItem("user_profile");
    }
    setLoading(false);
  }, [fetchAndSetProfile]);

  useEffect(() => {
    updateAuthState();
    window.addEventListener("storage", updateAuthState);
    return () => window.removeEventListener("storage", updateAuthState);
  }, [updateAuthState]);

  const login = useCallback(
    async (phone: string, password: string) => {
      try {
        await apiLogin(phone, password);
        // After login, token is stored; now fetch profile
        await updateAuthState();
      } catch (error) {
        console.error('Login failed:', error);
        throw error;
      }
    },
    [updateAuthState],
  );

  const register = useCallback(
    async (payload: UserRegistration) => {
      await apiRegister(payload);
      // Store the user's first and last name in localStorage for later use
      localStorage.setItem("cc_first_name", payload.first_name);
      localStorage.setItem("cc_last_name", payload.last_name);
      // Now login with the new credentials
      await apiLogin(payload.phone_number, payload.password);
      await updateAuthState();
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