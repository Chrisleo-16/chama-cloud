const API_BASE = "https://chama-cloud-api.onrender.com/api";

// ==================== Types from OpenAPI ====================
export interface TokenPair {
  access: string;
  refresh: string;
}

export interface UserRegistration {
  phone_number: string;
  first_name: string;
  last_name: string;
  password: string;
  role: "MERCHANT" | "WHOLESALER";
  business_name?: string;
  mpesa_shortcode?: string;
  shortcode_type?: "PAYBILL" | "TILL" | "";
}

export interface ChamaGroup {
  id: number;
  name: string;
  description?: string;
  target_amount: string;      // decimal as string
  current_amount?: string;
  wholesaler?: number | null;
  wholesaler_name?: string;
  is_active?: boolean;
  is_fully_funded?: string;   // e.g. "No" or "Yes"
  progress_percentage?: string;
  created_at?: string;
  members_count?: number;     // you might need to compute or ask backend
}

export interface Contribution {
  id: number;
  group: number;
  merchant?: number;
  merchant_name?: string;
  amount: string;
  status?: "PENDING" | "COMPLETED" | "FAILED";
  created_at?: string;
}

export interface STKPushRequest {
  group_id: number;
  amount: string;
}

// ==================== Token management ====================
function getTokens(): TokenPair | null {
  const access = localStorage.getItem("cc_access");
  const refresh = localStorage.getItem("cc_refresh");
  return access && refresh ? { access, refresh } : null;
}

function setTokens(tokens: TokenPair) {
  localStorage.setItem("cc_access", tokens.access);
  localStorage.setItem("cc_refresh", tokens.refresh);
}

export function clearTokens() {
  localStorage.removeItem("cc_access");
  localStorage.removeItem("cc_refresh");
}

// ==================== Token refresh ====================
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  // Prevent multiple concurrent refresh requests
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const tokens = getTokens();
    if (!tokens?.refresh) return null;
    try {
      const res = await fetch(`${API_BASE}/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: tokens.refresh }),
      });
      if (!res.ok) {
        clearTokens();
        return null;
      }
      const data = await res.json();
      localStorage.setItem("cc_access", data.access);
      return data.access;
    } catch {
      clearTokens();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ==================== Generic API fetcher ====================
export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, data: unknown) {
    super(`API Error ${status}`);
    this.status = status;
    this.data = data;
  }
}

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const tokens = getTokens();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (tokens?.access) {
    headers["Authorization"] = `Bearer ${tokens.access}`;
  }

  let res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  // If 401 and we have a refresh token, try once more
  if (res.status === 401 && tokens?.refresh) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      headers["Authorization"] = `Bearer ${newAccess}`;
      res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    }
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new ApiError(res.status, errorData);
  }

  return res.json();
}

// ==================== Auth endpoints ====================
export async function register(payload: UserRegistration) {
  return apiFetch<UserRegistration>("/auth/register/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function login(phone_number: string, password: string) {
  const data = await apiFetch<TokenPair>("/token/", {
    method: "POST",
    body: JSON.stringify({ phone_number, password }),
  });
  setTokens(data);
  return data;
}

export function logout() {
  clearTokens();
}

export function isAuthenticated(): boolean {
  return !!getTokens()?.access;
}

// ==================== Groups ====================
export const groupsApi = {
  list: () => apiFetch<ChamaGroup[]>("/groups/list/"),
  get: (id: number) => apiFetch<ChamaGroup>(`/groups/list/${id}/`),
  create: (data: Partial<ChamaGroup>) =>
    apiFetch<ChamaGroup>("/groups/list/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<ChamaGroup>) =>
    apiFetch<ChamaGroup>(`/groups/list/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiFetch<void>(`/groups/list/${id}/`, { method: "DELETE" }),
};

// ==================== Contributions ====================
export const contributionsApi = {
  list: () => apiFetch<Contribution[]>("/groups/contributions/"),
  get: (id: number) => apiFetch<Contribution>(`/groups/contributions/${id}/`),
  create: (data: { group: number; amount: string }) =>
    apiFetch<Contribution>("/groups/contributions/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<Contribution>) =>
    apiFetch<Contribution>(`/groups/contributions/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiFetch<void>(`/groups/contributions/${id}/`, { method: "DELETE" }),
};

// ==================== Payments ====================
export const paymentsApi = {
  stkPush: (data: STKPushRequest) =>
    apiFetch<{ MerchantRequestID?: string; CheckoutRequestID?: string; ResponseCode?: string; ResponseDescription?: string }>(
      "/payments/stk-push/",
      { method: "POST", body: JSON.stringify(data) }
    ),
};
// Add this function to your existing api.ts
export function getUserRole(): string | null {
  const token = localStorage.getItem("cc_access");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || null;
  } catch {
    return null;
  }
}
// Add to api.ts

// --- Wallet (derived from contributions if no direct endpoint)
export interface WalletData {
  balance: number;
  savings: number;
  payments: number;
}

export const walletApi = {
  get: async (): Promise<WalletData> => {
    // If backend has /wallet/ endpoint, use it; otherwise derive from contributions
    // For now, derive from contributions (total contributed by current user)
    const contributions = await contributionsApi.list();
    const total = contributions.reduce((sum, c) => sum + parseFloat(c.amount), 0);
    return { balance: total, savings: total, payments: 0 };
  }
};

// --- Recent Activities (derived from contributions sorted by date)
export interface Activity {
  id: number;
  user: string;
  initials: string;
  time: string;
  amount: number;
  type: "deposit" | "withdrawal";
}

export const activitiesApi = {
  list: async (): Promise<Activity[]> => {
    const contributions = await contributionsApi.list();
    // Sort by created_at descending, take latest 5
    return contributions
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 5)
      .map(c => ({
        id: c.id,
        user: c.merchant_name || "You",
        initials: (c.merchant_name || "U").charAt(0).toUpperCase(),
        time: c.created_at ? new Date(c.created_at).toLocaleString() : "recent",
        amount: parseFloat(c.amount),
        type: "deposit"
      }));
  }
};

// --- User profile (if backend has /users/me/)
export interface UserProfile {
  first_name: string;
  last_name: string;
  phone_number: string;
  role: string;
}

export const userApi = {
  getProfile: async (): Promise<UserProfile> => {
    // Try to fetch from /users/me/; if not available, decode from token
    try {
      return await apiFetch<UserProfile>("/users/me/");
    } catch {
      // Fallback: decode from JWT
      const token = localStorage.getItem("cc_access");
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
          first_name: payload.first_name || "User",
          last_name: payload.last_name || "",
          phone_number: payload.phone_number || "",
          role: payload.role || "MERCHANT"
        };
      }
      throw new Error("No user profile");
    }
  }
};
