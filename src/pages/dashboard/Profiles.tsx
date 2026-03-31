"use client";

import { useAuth } from "@/contexts/AuthContext";
import { User, Phone, Briefcase, Shield, LogOut, Building, Leaf, Loader2 } from "lucide-react";

export default function Profile() {
  // ── Use AuthContext profile directly — no duplicate API call needed ───────
  const { profile, loading, logout } = useAuth();

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-[var(--brand-light)] cc-spin" />
    </div>
  );

  const initials = `${profile?.first_name?.[0] || ""}${profile?.last_name?.[0] || ""}`.toUpperCase() || "?";

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      <div className="cc-fade">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--brand-light)] mb-2 flex items-center gap-2">
          <span className="w-4 h-px bg-[var(--brand-light)]" /> Account
        </p>
        <h1 className="cc-h1 mb-1">Profile</h1>
        <p className="text-sm text-[var(--fg-muted)]">Your account information</p>
      </div>

      {/* Avatar card */}
      <div className="cc-card flex items-center gap-5 cc-fade cc-d1">
        <div className="w-16 h-16 rounded-2xl bg-[var(--brand-tint)] border border-[var(--brand-border)] flex items-center justify-center text-2xl font-bold text-[var(--brand-light)] flex-shrink-0">
          {initials}
        </div>
        <div>
          <h2 className="font-bold text-[var(--fg)] text-xl">
            {profile?.first_name} {profile?.last_name}
          </h2>
          <p className="text-sm text-[var(--fg-muted)]">{profile?.phone_number || "—"}</p>
          <span className={`cc-badge mt-1 ${profile?.role === "WHOLESALER" ? "cc-badge-brand" : "cc-badge-success"}`}>
            {profile?.role === "WHOLESALER" ? "Wholesaler" : "Merchant"}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="cc-card space-y-0 p-0 overflow-hidden cc-fade cc-d2">
        {[
          { icon: User,      label: "Full Name",      value: `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "—" },
          { icon: Phone,     label: "Phone Number",   value: profile?.phone_number || "—", mono: true },
          { icon: Briefcase, label: "Role",           value: profile?.role === "WHOLESALER" ? "Wholesaler" : "Merchant" },
          ...(profile?.business_name     ? [{ icon: Building, label: "Business",   value: profile.business_name }]    : []),
          ...(profile?.business_address  ? [{ icon: Building, label: "Location",   value: profile.business_address }] : []),
          ...(profile?.business_category ? [{ icon: Leaf,     label: "Profession", value: profile.business_category }]: []),
          { icon: Shield, label: "Account Status", value: "Active ✓" },
        ].map((row, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-alt)] transition-smooth">
            <div className="w-9 h-9 rounded-xl bg-[var(--brand-tint)] border border-[var(--brand-border)] flex items-center justify-center flex-shrink-0">
              <row.icon className="w-4 h-4 text-[var(--brand-light)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--fg-muted)]">{row.label}</p>
              <p className={`font-medium text-[var(--fg)] ${(row as { mono?: boolean }).mono ? "font-mono" : ""}`}>
                {row.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Sign out */}
      <button
        onClick={logout}
        className="cc-btn-ghost w-full gap-2 text-[var(--danger)] hover:!bg-[var(--danger-bg)] cc-fade cc-d3"
      >
        <LogOut className="w-4 h-4" /> Sign Out
      </button>
    </div>
  );
}