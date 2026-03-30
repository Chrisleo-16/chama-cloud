const API_BASE = "https://chama-cloud-api.onrender.com/api";

// ==================== Types ====================

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

export interface UserProfile {
  id?: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  role: "MERCHANT" | "WHOLESALER" | "ADMIN";
  business_name?: string;
  business_address?: string;
  business_category?: string;
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

// GET /api/groups/vouchers/ — merchant's own vouchers
export interface MerchantVoucher {
  id: string;           // UUID
  group_name: string;
  wholesaler_name: string;
  amount_paid: string;
  is_claimed: boolean;
  created_at: string;
  claimed_at: string | null;
}

// GET /api/groups/wholesaler/vouchers/ — wholesaler's vouchers to fulfil
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

// ── Credit Engine types (client-side computed) ───────────────────────────────
export interface CreditScore {
  score: number;           // 0–100
  grade: "A" | "B" | "C" | "D" | "F";
  eligible: boolean;
  maxLoan: number;         // KES
  reasons: string[];
  recommendations: string[];
}

export interface GroupCreditScore {
  groupId: number;
  groupName: string;
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  eligible: boolean;
  fundingGap: number;
  maxGroupLoan: number;
  reasons: string[];
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
  if (!token) return null;
  const payload = decodeToken(token);
  return (payload?.role as string) || null;
}

export function getUserFromToken(): UserProfile | null {
  const token = localStorage.getItem("cc_access");
  if (!token) return null;
  const payload = decodeToken(token);
  if (!payload) return null;

  // Start with token data (may be empty)
  let firstName = "";
  let lastName = "";
  let phoneNumber = (payload.phone_number as string) || (payload.phone as string) || "";
  let role = (payload.role as "MERCHANT" | "WHOLESALER" | "ADMIN") || "MERCHANT";
  let businessName = (payload.business_name as string) || undefined;
  let businessAddress = (payload.business_address as string) || undefined;
  let businessCategory = (payload.business_category as string) || undefined;
  let isVerifiedWholesaler = (payload.is_verified_wholesaler as boolean) || false;

  // Override with localStorage items if present (set during registration or profile fetch)
  const storedFirstName = localStorage.getItem("cc_first_name");
  const storedLastName = localStorage.getItem("cc_last_name");
  if (storedFirstName) firstName = storedFirstName;
  if (storedLastName) lastName = storedLastName;

  // If still empty, try to extract from token's name field (if any)
  if (!firstName && payload.name) {
    const nameParts = (payload.name as string).split(' ');
    firstName = nameParts[0] || "";
    lastName = nameParts.slice(1).join(' ') || "";
  }

  // Fallback to "User" only if no first name
  if (!firstName) firstName = "User";

  return {
    id: (payload.user_id as number) || (payload.id as number),
    first_name: firstName,
    last_name: lastName,
    phone_number: phoneNumber,
    role,
    business_name: businessName,
    business_address: businessAddress,
    business_category: businessCategory,
    is_verified_wholesaler: isVerifiedWholesaler,
  };
}

// // ==================== Token refresh ====================

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

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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

export function logout() { clearTokens(); }
export function isAuthenticated(): boolean { return !!getTokens()?.access; }

// ==================== User Profile (JWT-decoded) ====================

export const userApi = {
  getProfile: async (): Promise<UserProfile> => {
    const fromToken = getUserFromToken();
    if (fromToken) return fromToken;
    throw new Error("Not authenticated");
  },
};

// ==================== Groups ====================

export const groupsApi = {
  list:   ()                          => apiFetch<ChamaGroup[]>("/groups/list/"),
  get:    (id: number)                => apiFetch<ChamaGroup>(`/groups/list/${id}/`),
  create: (data: Partial<ChamaGroup>) => apiFetch<ChamaGroup>("/groups/list/", {
    method: "POST", body: JSON.stringify(data),
  }),
  update: (id: number, data: Partial<ChamaGroup>) => apiFetch<ChamaGroup>(`/groups/list/${id}/`, {
    method: "PATCH", body: JSON.stringify(data),
  }),
  delete: (id: number) => apiFetch<void>(`/groups/list/${id}/`, { method: "DELETE" }),

  // Join a group — PATCH the group to add current user as member
  join: (id: number) => apiFetch<ChamaGroup>(`/groups/list/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({ join: true }),
  }),
};

// ==================== Contributions ====================

export const contributionsApi = {
  list:   ()                                        => apiFetch<Contribution[]>("/groups/contributions/"),
  get:    (id: number)                              => apiFetch<Contribution>(`/groups/contributions/${id}/`),
  create: (data: { group: number; amount: string }) => apiFetch<Contribution>("/groups/contributions/", {
    method: "POST", body: JSON.stringify(data),
  }),
  update: (id: number, data: Partial<Contribution>) => apiFetch<Contribution>(`/groups/contributions/${id}/`, {
    method: "PATCH", body: JSON.stringify(data),
  }),
  delete: (id: number) => apiFetch<void>(`/groups/contributions/${id}/`, { method: "DELETE" }),
};

// ==================== Merchant Vouchers ====================
// GET /api/groups/vouchers/ — vouchers belonging to the logged-in merchant

export const vouchersApi = {
  list: () => apiFetch<MerchantVoucher[]>("/groups/vouchers/"),
};

// ==================== Wholesaler-specific ====================

export const wholesalerApi = {
  getGroups:   ()                  => apiFetch<ChamaGroup[]>("/groups/wholesaler/groups/"),
  getVouchers: ()                  => apiFetch<Voucher[]>("/groups/wholesaler/vouchers/"),
  scanVoucher: (voucherId: string) => apiFetch<void>(`/groups/wholesaler/scan/${voucherId}/`, {
    method: "PATCH",
  }),
};

// ==================== Wholesalers list ====================

export const wholesalersApi = {
  list: () => apiFetch<Wholesaler[]>("/auth/wholesalers/"),
};

// ==================== Payments ====================

export const paymentsApi = {
  stkPush: (data: STKPushRequest) => apiFetch<{
    MerchantRequestID?: string;
    CheckoutRequestID?: string;
    ResponseCode?: string;
    ResponseDescription?: string;
  }>("/payments/stk-push/", { method: "POST", body: JSON.stringify(data) }),
};

// ==================== Derived ====================

export const walletApi = {
  get: async (): Promise<WalletData> => {
    const contributions = await contributionsApi.list();
    const completed = contributions.filter(c => c.status === "COMPLETED").reduce((s, c) => s + parseFloat(c.amount), 0);
    const pending   = contributions.filter(c => c.status === "PENDING").reduce((s, c) => s + parseFloat(c.amount), 0);
    const total     = contributions.reduce((s, c) => s + parseFloat(c.amount), 0);
    return { balance: total, savings: completed, payments: pending };
  },
};

export const activitiesApi = {
  list: async (): Promise<Activity[]> => {
    const contributions = await contributionsApi.list();
    return contributions
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 5)
      .map(c => ({
        id: c.id,
        user: c.merchant_name || "Member",
        initials: (c.merchant_name || "M").charAt(0).toUpperCase(),
        time: c.created_at ? new Date(c.created_at).toLocaleString() : "recently",
        amount: parseFloat(c.amount),
        type: "deposit" as const,
      }));
  },
};

// ==================== Credit Engine (client-side) ====================
// Evaluates loan eligibility based on contribution history and group health.
// No dedicated backend endpoint — computed from existing data.

export const creditEngine = {
  scoreMerchant: (
    contributions: Contribution[],
    groups: ChamaGroup[],
  ): CreditScore => {
    const reasons: string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    const completed  = contributions.filter(c => c.status === "COMPLETED");
    const total      = contributions.length;
    const successRate = total > 0 ? completed.length / total : 0;
    const totalAmount = completed.reduce((s, c) => s + parseFloat(c.amount), 0);

    // 1. Contribution consistency (30 pts)
    if (total >= 10)      { score += 30; reasons.push("10+ contributions made"); }
    else if (total >= 5)  { score += 20; reasons.push("5–9 contributions made"); }
    else if (total >= 1)  { score += 10; reasons.push("At least 1 contribution made"); }
    else                  { recommendations.push("Make your first contribution to build credit"); }

    // 2. Success rate (25 pts)
    if (successRate >= 0.9)      { score += 25; reasons.push("Excellent payment success rate (90%+)"); }
    else if (successRate >= 0.7) { score += 15; reasons.push("Good payment success rate (70%+)"); }
    else if (successRate >= 0.5) { score += 5;  recommendations.push("Improve payment success rate"); }
    else                         { recommendations.push("Many failed payments — resolve pending issues"); }

    // 3. Total contributed (20 pts)
    if (totalAmount >= 50000)     { score += 20; reasons.push("Contributed KES 50,000+"); }
    else if (totalAmount >= 10000){ score += 12; reasons.push("Contributed KES 10,000+"); }
    else if (totalAmount >= 1000) { score += 6;  reasons.push("Contributed KES 1,000+"); }
    else                          { recommendations.push("Increase total contributions to improve score"); }

    // 4. Group membership (15 pts)
    const myGroupIds = new Set(contributions.map(c => c.group));
    const myGroups   = groups.filter(g => myGroupIds.has(g.id));
    if (myGroups.length >= 3)     { score += 15; reasons.push("Member of 3+ groups"); }
    else if (myGroups.length >= 1){ score += 8;  reasons.push("Member of at least 1 group"); }
    else                          { recommendations.push("Join a chama group to improve eligibility"); }

    // 5. Active group bonus (10 pts)
    const activeGroups = myGroups.filter(g => g.is_active);
    if (activeGroups.length > 0)  { score += 10; reasons.push(`Active in ${activeGroups.length} group(s)`); }
    else                          { recommendations.push("Ensure your groups are active"); }

    const grade =
      score >= 80 ? "A" :
      score >= 65 ? "B" :
      score >= 50 ? "C" :
      score >= 35 ? "D" : "F";

    const eligible = score >= 50;
    const maxLoan  = eligible ? Math.round(totalAmount * (score / 100) * 2) : 0;

    return { score, grade, eligible, maxLoan, reasons, recommendations };
  },

  scoreGroup: (group: ChamaGroup, contributions: Contribution[]): GroupCreditScore => {
    const reasons: string[] = [];
    let score = 0;

    const current  = parseFloat(group.current_amount || "0");
    const target   = parseFloat(group.target_amount  || "1");
    const progress = current / target;
    const groupContribs = contributions.filter(c => c.group === group.id);
    const completed     = groupContribs.filter(c => c.status === "COMPLETED");

    // 1. Funding progress (35 pts)
    if (progress >= 0.75)      { score += 35; reasons.push("75%+ funded"); }
    else if (progress >= 0.5)  { score += 25; reasons.push("50%+ funded"); }
    else if (progress >= 0.25) { score += 15; reasons.push("25%+ funded"); }
    else                       { reasons.push("Less than 25% funded — needs more contributions"); }

    // 2. Member count (25 pts)
    const members = group.members_count || 0;
    if (members >= 10)      { score += 25; reasons.push("10+ active members"); }
    else if (members >= 5)  { score += 15; reasons.push("5–9 members"); }
    else if (members >= 2)  { score += 8;  reasons.push("2–4 members"); }
    else                    { reasons.push("Low membership"); }

    // 3. Contribution volume (25 pts)
    if (completed.length >= 20) { score += 25; reasons.push("20+ completed contributions"); }
    else if (completed.length >= 10) { score += 15; reasons.push("10+ completed contributions"); }
    else if (completed.length >= 5)  { score += 8;  reasons.push("5+ completed contributions"); }

    // 4. Active status (15 pts)
    if (group.is_active) { score += 15; reasons.push("Group is active"); }

    const grade =
      score >= 80 ? "A" :
      score >= 65 ? "B" :
      score >= 50 ? "C" :
      score >= 35 ? "D" : "F";

    const eligible    = score >= 50;
    const fundingGap  = Math.max(0, target - current);
    const maxGroupLoan = eligible ? Math.round(current * 0.5) : 0;

    return { groupId: group.id, groupName: group.name, score, grade, eligible, fundingGap, maxGroupLoan, reasons };
  },
};