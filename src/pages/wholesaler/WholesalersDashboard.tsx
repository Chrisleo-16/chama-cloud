"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { wholesalerApi, type ChamaGroup, type Voucher } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Package,
  Clock,
  CheckCircle,
  QrCode,
  Loader2,
  TrendingUp,
  Users,
  Search,
  ScanLine,
  AlertCircle,
  RefreshCw,
  TicketCheck,
  XCircle,
} from "lucide-react";

const formatKES = (amount: number | string) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(typeof amount === "string" ? parseFloat(amount) : amount);

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-KE", { dateStyle: "medium" }) : "—";

// ── Voucher Scanner Modal ─────────────────────────────────────────────────────
function VoucherScanner({
  onClose,
  onConfirm,
  loading,
}: {
  onClose: () => void;
  onConfirm: (id: string) => void;
  loading: boolean;
}) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => ref.current?.focus(), []);

  const handle = () => {
    const trimmed = input.trim();
    // basic UUID format check
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(trimmed)) {
      setError("Please enter a valid Voucher ID (UUID format).");
      return;
    }
    onConfirm(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="cc-modal w-full max-w-md mx-4">
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[var(--brand-tint)] border border-[var(--brand-border)] flex items-center justify-center">
            <ScanLine className="w-8 h-8 text-[var(--brand-light)]" />
          </div>
          <h2 className="cc-h3 text-center">Scan Voucher</h2>
          <p className="text-sm text-[var(--fg-muted)] text-center">
            Enter or paste the Voucher UUID to mark it as claimed.
          </p>
        </div>
        <div className="space-y-4">
          <input
            ref={ref}
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handle()}
            placeholder="e.g. 3fa85f64-5717-4562-b3fc-2c963f66afa6"
            className="cc-input font-mono text-sm"
          />
          {error && (
            <p className="text-xs text-[var(--danger)] flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
            </p>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="cc-btn-ghost flex-1" disabled={loading}>
              Cancel
            </button>
            <button onClick={handle} className="cc-btn-primary flex-1" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 cc-spin" /> : <CheckCircle className="w-4 h-4" />}
              Confirm Claim
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Voucher Card ──────────────────────────────────────────────────────────────
function VoucherCard({
  v,
  onScan,
  scanning,
}: {
  v: Voucher;
  onScan: (id: string) => void;
  scanning: boolean;
}) {
  return (
    <div className={`cc-card hover-lift flex flex-col gap-3 ${v.is_claimed ? "opacity-60" : ""}`}>
      {/* Top */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[var(--fg)] text-sm truncate">
            {v.group_name}
          </p>
          <p className="text-xs text-[var(--fg-muted)] truncate">
            {v.wholesaler_name}
          </p>
        </div>
        <span
          className={`cc-badge flex-shrink-0 ${
            v.is_claimed ? "cc-badge-success" : "cc-badge-warning"
          }`}
        >
          {v.is_claimed ? "✓ Claimed" : "● Pending"}
        </span>
      </div>

      {/* Amount */}
      <p className="font-mono font-bold text-[var(--brand-light)] text-xl">
        {formatKES(v.amount_paid)}
      </p>

      {/* Dates */}
      <div className="text-xs text-[var(--fg-muted)] space-y-0.5">
        <p>Issued: {fmtDate(v.created_at)}</p>
        {v.is_claimed && v.claimed_at && (
          <p>Claimed: {fmtDate(v.claimed_at)}</p>
        )}
      </div>

      {/* UUID */}
      <p className="font-mono text-[10px] text-[var(--fg-muted)] bg-[var(--bg-alt)] rounded-lg px-2 py-1 truncate">
        {v.id}
      </p>

      {/* Action */}
      {!v.is_claimed && (
        <button
          onClick={() => onScan(v.id)}
          disabled={scanning}
          className="cc-btn-primary w-full text-sm"
        >
          {scanning ? (
            <Loader2 className="w-3.5 h-3.5 cc-spin" />
          ) : (
            <TicketCheck className="w-3.5 h-3.5" />
          )}
          Mark as Claimed
        </button>
      )}
    </div>
  );
}

// ── Group Card ────────────────────────────────────────────────────────────────
function GroupCard({ g }: { g: ChamaGroup }) {
  const pct = Math.min(
    100,
    Math.round(parseFloat(g.progress_percentage || "0"))
  );
  return (
    <div className="cc-card hover-lift">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[var(--fg)] text-sm truncate">
            {g.name}
          </h3>
          {g.description && (
            <p className="text-xs text-[var(--fg-muted)] line-clamp-1 mt-0.5">
              {g.description}
            </p>
          )}
        </div>
        <div className="flex gap-1.5 flex-shrink-0 ml-2">
          {g.is_fully_funded === "True" && (
            <span className="cc-badge cc-badge-success text-[10px]">
              ✓ Funded
            </span>
          )}
          <span
            className={`cc-badge text-[10px] ${g.is_active ? "cc-badge-brand" : "cc-badge-neutral"}`}
          >
            {g.is_active ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-[var(--fg-muted)] mb-3">
        <Users className="w-3.5 h-3.5" />
        {g.members_count || 0} members
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-[var(--fg-muted)]">Progress</span>
          <span className="font-mono font-semibold text-[var(--fg)]">
            {pct}%
          </span>
        </div>
        <div className="cc-progress">
          <div className="cc-progress-bar" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between text-xs font-mono pt-0.5">
          <span className="text-[var(--brand-light)]">
            {formatKES(parseFloat(g.current_amount || "0"))}
          </span>
          <span className="text-[var(--fg-muted)]">
            {formatKES(parseFloat(g.target_amount))}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function WholesalerDashboard() {
  const { profile, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<"vouchers" | "groups">("vouchers");
  const [voucherTab, setVoucherTab] = useState<"pending" | "claimed" | "all">("pending");
  const [search, setSearch] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanningId, setScanningId] = useState<string | null>(null);

  // ── Fetch wholesaler groups ─────────────────────────────────────────────
  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ["wholesaler-groups"],
    queryFn: wholesalerApi.getGroups,
    refetchInterval: 60_000,
  });

  // ── Fetch vouchers ──────────────────────────────────────────────────────
  const { data: vouchers, isLoading: vouchersLoading } = useQuery({
    queryKey: ["wholesaler-vouchers"],
    queryFn: wholesalerApi.getVouchers,
    refetchInterval: 30_000,
  });

  // ── Scan / claim voucher ────────────────────────────────────────────────
  const scanMut = useMutation({
    mutationFn: (voucherId: string) => wholesalerApi.scanVoucher(voucherId),
    onMutate: (id) => setScanningId(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wholesaler-vouchers"] });
      setScannerOpen(false);
      toast({ title: "✓ Voucher marked as claimed!" });
    },
    onError: () =>
      toast({ title: "Failed to claim voucher", variant: "destructive" }),
    onSettled: () => setScanningId(null),
  });

  // ── Stats ───────────────────────────────────────────────────────────────
  const pending = (vouchers || []).filter((v) => !v.is_claimed);
  const claimed = (vouchers || []).filter((v) => v.is_claimed);
  const totalValue = (vouchers || []).reduce(
    (s, v) => s + parseFloat(v.amount_paid || "0"),
    0
  );

  // ── Filtered vouchers ───────────────────────────────────────────────────
  const filteredVouchers = (vouchers || []).filter((v) => {
    const matchTab =
      voucherTab === "all" ||
      (voucherTab === "pending" && !v.is_claimed) ||
      (voucherTab === "claimed" && v.is_claimed);
    const matchSearch =
      !search ||
      v.group_name.toLowerCase().includes(search.toLowerCase()) ||
      v.id.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  // ── Filtered groups ─────────────────────────────────────────────────────
  const filteredGroups = (groups || []).filter(
    (g) =>
      !search ||
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      (g.description || "").toLowerCase().includes(search.toLowerCase())
  );

  const isLoading = groupsLoading || vouchersLoading;

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-[var(--brand-light)] cc-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="space-y-8 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 cc-fade">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--brand-light)] mb-2 flex items-center gap-2">
              <span className="w-4 h-px bg-[var(--brand-light)]" /> Wholesaler
              Portal
            </p>
            <h1 className="cc-h1 mb-1">
              {profile?.business_name ||
                `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() ||
                "Wholesaler"}{" "}
              👋
            </h1>
            <p className="text-sm text-[var(--fg-muted)]">
              Manage your assigned groups and fulfil vouchers
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <button
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["wholesaler-vouchers"] });
                queryClient.invalidateQueries({ queryKey: ["wholesaler-groups"] });
              }}
              className="cc-btn-ghost"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => setScannerOpen(true)}
              className="cc-btn-primary"
            >
              <QrCode className="w-4 h-4" />
              Scan Voucher
            </button>
            <button onClick={logout} className="cc-btn-ghost text-[var(--danger)]">
              <XCircle className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 cc-fade cc-d1">
          {[
            {
              label: "My Groups",
              value: groups?.length ?? 0,
              icon: Users,
            },
            {
              label: "Pending Vouchers",
              value: pending.length,
              icon: Clock,
              urgent: pending.length > 0,
            },
            {
              label: "Claimed",
              value: claimed.length,
              icon: CheckCircle,
            },
            {
              label: "Total Value",
              value: formatKES(totalValue),
              icon: TrendingUp,
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`cc-card flex items-center gap-4 py-4 ${
                s.urgent ? "border-amber-500/40" : ""
              }`}
            >
              <div
                className={`stat-icon flex-shrink-0 ${
                  s.urgent ? "bg-amber-500/10" : ""
                }`}
              >
                <s.icon
                  className={`w-4 h-4 ${
                    s.urgent
                      ? "text-amber-500"
                      : "text-[var(--brand-light)]"
                  }`}
                />
              </div>
              <div>
                <p className="text-xs text-[var(--fg-muted)] uppercase tracking-wider">
                  {s.label}
                </p>
                <p className="font-mono font-bold text-[var(--fg)] text-xl">
                  {s.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-[var(--bg-alt)] rounded-xl border border-[var(--border)] w-fit cc-fade cc-d2">
          {(["vouchers", "groups"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setSearch(""); }}
              className={`px-4 py-2 text-sm font-semibold rounded-lg capitalize transition-smooth ${
                tab === t
                  ? "bg-[var(--brand)] text-white"
                  : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
              }`}
            >
              {t === "vouchers" ? (
                <span className="flex items-center gap-2">
                  <TicketCheck className="w-4 h-4" />
                  Vouchers
                  {pending.length > 0 && (
                    <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {pending.length}
                    </span>
                  )}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  My Groups
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm cc-fade cc-d2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fg-muted)]" />
          <input
            placeholder={
              tab === "vouchers" ? "Search vouchers…" : "Search groups…"
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="cc-input pl-10 pr-4"
          />
        </div>

        {/* ── Vouchers tab ─────────────────────────────────────────────── */}
        {tab === "vouchers" && (
          <div className="cc-fade cc-d3">
            {/* Sub-tabs */}
            <div className="flex gap-1 p-1 bg-[var(--bg-alt)] rounded-xl border border-[var(--border)] w-fit mb-5">
              {(["pending", "claimed", "all"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setVoucherTab(t)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-smooth ${
                    voucherTab === t
                      ? "bg-[var(--brand)] text-white"
                      : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {filteredVouchers.length === 0 ? (
              <div className="cc-card flex flex-col items-center py-16 gap-3 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[var(--bg-alt)] flex items-center justify-center">
                  <TicketCheck className="w-5 h-5 text-[var(--fg-muted)]" />
                </div>
                <p className="font-semibold text-[var(--fg)]">
                  No vouchers found
                </p>
                <p className="text-sm text-[var(--fg-muted)]">
                  {voucherTab === "pending"
                    ? "No pending vouchers right now. Great work!"
                    : "No vouchers match your search."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredVouchers.map((v) => (
                  <VoucherCard
                    key={v.id}
                    v={v}
                    onScan={(id) => scanMut.mutate(id)}
                    scanning={scanningId === v.id && scanMut.isPending}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Groups tab ───────────────────────────────────────────────── */}
        {tab === "groups" && (
          <div className="cc-fade cc-d3">
            {filteredGroups.length === 0 ? (
              <div className="cc-card flex flex-col items-center py-16 gap-3 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[var(--bg-alt)] flex items-center justify-center">
                  <Users className="w-5 h-5 text-[var(--fg-muted)]" />
                </div>
                <p className="font-semibold text-[var(--fg)]">
                  No groups assigned
                </p>
                <p className="text-sm text-[var(--fg-muted)]">
                  Groups assigned to you will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredGroups.map((g) => (
                  <GroupCard key={g.id} g={g} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scanner modal */}
      {scannerOpen && (
        <VoucherScanner
          onClose={() => setScannerOpen(false)}
          onConfirm={(id) => scanMut.mutate(id)}
          loading={scanMut.isPending}
        />
      )}
    </div>
  );
}