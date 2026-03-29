const API_BASE = "https://chama-cloud-api.onrender.com/api";

// ==================== Types ====================
export interface TokenPair {
  access: string;
  refresh: string;
  role?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  business_name?: string;
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

export interface UserProfile {
  id?: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  role: "MERCHANT" | "WHOLESALER";
  business_name?: string;
  is_verified_wholesaler?: boolean;
}

export interface ChamaGroup {
  id: number;
  name: string;
  description?: string;
  target_amount: string;
  current_amount?: string;
  wholesaler?: number | null;
  wholesaler_name?: string;
  is_active?: boolean;
  is_fully_funded?: string;
  progress_percentage?: string;
  created_at?: string;
  members_count?: number;
}

export interface Contribution {
  id: number;
  group: number;
  group_name?: string;
  merchant?: number;
  merchant_name?: string;
  amount: string;
  status?: "PENDING" | "COMPLETED" | "FAILED";
  created_at?: string;
}

export interface Wholesaler {
  id: number;
  business_name?: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  is_verified_wholesaler?: boolean;
}

// Returned by GET /api/groups/wholesaler/vouchers/
export interface Voucher {
  id: string;           // UUID
  group_name: string;
  wholesaler_name: string;
  amount_paid: string;
  is_claimed: boolean;
  created_at: string;
  claimed_at: string | null;
}

export interface STKPushRequest {
  group_id: number;
  amount: string;
}

export interface WalletData {
  balance: number;
  savings: number;
  payments: number;
}

export interface Activity {
  id: number;
  user: string;
  initials: string;
  time: string;
  amount: number;
  type: "deposit" | "withdrawal";
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

  if (tokens.role) localStorage.setItem("cc_role", tokens.role);
  if (tokens.first_name) localStorage.setItem("cc_first_name", tokens.first_name);
  if (tokens.last_name) localStorage.setItem("cc_last_name", tokens.last_name);
  if (tokens.phone_number) localStorage.setItem("cc_phone_number", tokens.phone_number);
  if (tokens.business_name) localStorage.setItem("cc_business_name", tokens.business_name);
}

export function clearTokens() {
  localStorage.removeItem("cc_access");
  localStorage.removeItem("cc_refresh");
  localStorage.removeItem("cc_role");
  localStorage.removeItem("cc_first_name");
  localStorage.removeItem("cc_last_name");
  localStorage.removeItem("cc_phone_number");
  localStorage.removeItem("cc_business_name");
}

// ==================== JWT helpers ====================
function decodeToken(token: string): Record<string, unknown> | null {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export function getUserRole(): string | null {
  const token = localStorage.getItem("cc_access");
  if (token) {
    const payload = decodeToken(token);
    if (payload?.role) return payload.role as string;
  }
  return localStorage.getItem("cc_role");
}

export function getUserFromToken(): UserProfile | null {
  const token = localStorage.getItem("cc_access");
  const localRole = localStorage.getItem("cc_role");
  const localFirstName = localStorage.getItem("cc_first_name");
  const localLastName = localStorage.getItem("cc_last_name");
  const localPhone = localStorage.getItem("cc_phone_number");
  const localBusiness = localStorage.getItem("cc_business_name");

  if (token) {
    const payload = decodeToken(token);
    if (payload) {
      return {
        first_name: (payload.first_name as string) || localFirstName || "User",
        last_name: (payload.last_name as string) || localLastName || "",
        phone_number: (payload.phone_number as string) || localPhone || "",
        role: (payload.role as "MERCHANT" | "WHOLESALER") || (localRole as "MERCHANT" | "WHOLESALER") || "MERCHANT",
        business_name: (payload.business_name as string) || localBusiness || undefined,
      };
    }
  }

  if (localRole || localFirstName || localLastName || localPhone) {
    return {
      first_name: localFirstName || "User",
      last_name: localLastName || "",
      phone_number: localPhone || "",
      role: (localRole as "MERCHANT" | "WHOLESALER") || "MERCHANT",
      business_name: localBusiness || undefined,
    };
  }

  return null;
}

// ==================== Token refresh ====================
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
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
      if (!res.ok) { clearTokens(); return null; }
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

// ==================== Generic fetcher ====================
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
  if (tokens?.access) headers["Authorization"] = `Bearer ${tokens.access}`;

  let res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  if (res.status === 401 && tokens?.refresh) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      headers["Authorization"] = `Bearer ${newAccess}`;
      res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    }
  }

  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new ApiError(res.status, errorData);
  }

  return res.json();
}

// ==================== Auth ====================
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

// ==================== User Profile ====================
// /api/users/me/ does not exist — decode from JWT instead.
export const userApi = {
  getProfile: async (): Promise<UserProfile> => {
    const fromToken = getUserFromToken();
    if (fromToken) return fromToken;
    throw new Error("Not authenticated");
  },
};

// ==================== Groups (merchant) ====================
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

// ==================== Contributions (merchant) ====================
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

// ==================== Wholesaler-specific APIs ====================
export const wholesalerApi = {
  // GET /api/groups/wholesaler/groups/
  // All ChamaGroups assigned to the logged-in wholesaler
  getGroups: () => apiFetch<ChamaGroup[]>("/groups/wholesaler/groups/"),

  // GET /api/groups/wholesaler/vouchers/
  // All vouchers this wholesaler needs to fulfil
  getVouchers: () => apiFetch<Voucher[]>("/groups/wholesaler/vouchers/"),

  // PATCH /api/groups/wholesaler/scan/{voucher_id}/
  // Mark a voucher as claimed (UUID string id)
  scanVoucher: (voucherId: string) =>
    apiFetch<void>(`/groups/wholesaler/scan/${voucherId}/`, {
      method: "PATCH",
    }),
};

// ==================== Wholesalers list (merchant use) ====================
export const wholesalersApi = {
  list: () => apiFetch<Wholesaler[]>("/auth/wholesalers/"),
};

// ==================== Payments ====================
export const paymentsApi = {
  stkPush: (data: STKPushRequest) =>
    apiFetch<{
      MerchantRequestID?: string;
      CheckoutRequestID?: string;
      ResponseCode?: string;
      ResponseDescription?: string;
    }>("/payments/stk-push/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ==================== Derived APIs ====================

// Wallet — derived from contributions (no dedicated endpoint)
export const walletApi = {
  get: async (): Promise<WalletData> => {
    const contributions = await contributionsApi.list();
    const completed = contributions
      .filter((c) => c.status === "COMPLETED")
      .reduce((sum, c) => sum + parseFloat(c.amount), 0);
    const pending = contributions
      .filter((c) => c.status === "PENDING")
      .reduce((sum, c) => sum + parseFloat(c.amount), 0);
    const total = contributions.reduce(
      (sum, c) => sum + parseFloat(c.amount),
      0
    );
    return { balance: total, savings: completed, payments: pending };
  },
};

// Recent activities — derived from contributions
export const activitiesApi = {
  list: async (): Promise<Activity[]> => {
    const contributions = await contributionsApi.list();
    return contributions
      .sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
      )
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        user: c.merchant_name || "Member",
        initials: (c.merchant_name || "M").charAt(0).toUpperCase(),
        time: c.created_at
          ? new Date(c.created_at).toLocaleString()
          : "recently",
        amount: parseFloat(c.amount),
        type: "deposit" as const,
      }));
  },
};