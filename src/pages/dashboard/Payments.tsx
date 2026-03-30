'use client';

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentsApi, groupsApi, contributionsApi, userApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Smartphone, CreditCard, History, CheckCircle, XCircle,
  Clock, Zap, Shield, ArrowRight, Send, Wifi
} from "lucide-react";

const formatKES = (amount: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);

const STEPS = [
  { n: 1, text: "Select the chama group you want to contribute to." },
  { n: 2, text: "Enter the amount and click 'Send Payment Request'." },
  { n: 3, text: "An M-Pesa prompt appears on your phone — enter your PIN." },
  { n: 4, text: "Contribution recorded automatically. Done!" },
];

export default function Payments() {
  const [groupId, setGroupId] = useState("");
  const [amount, setAmount]   = useState("");
  const { toast }             = useToast();
  const queryClient           = useQueryClient();

  const { data: groups,        isLoading: gL } = useQuery({ queryKey: ["groups"],        queryFn: groupsApi.list });
  const { data: contributions, isLoading: cL } = useQuery({ queryKey: ["contributions"], queryFn: contributionsApi.list });
  const { data: profile,      isLoading: pL } = useQuery({ queryKey: ["profile"],       queryFn: userApi.getProfile });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const preselected = searchParams.get("groupId");
    if (preselected) setGroupId(preselected);
  }, [searchParams]);

  const currentUserId = profile?.id;
  const myContributions = (contributions || []).filter((c) => {
    if (c.merchant && +c.merchant === +currentUserId) return true;
    const merchantName = profile?.first_name?.toLowerCase() || "";
    return !!(c.merchant_name && merchantName && c.merchant_name.toLowerCase().startsWith(merchantName));
  });

  const myGroups = (groups || []).filter((g) => {
    if (profile?.role === "WHOLESALER" && currentUserId) {
      return g.wholesaler === currentUserId;
    }

    // Show all active groups for merchants to contribute to
    return g.is_active;
  });

  const stkMut = useMutation({
    mutationFn: paymentsApi.stkPush,
    onSuccess: () => {
      toast({ title: "STK Push sent!", description: "Check your phone for the M-Pesa prompt." });
      setGroupId(""); setAmount("");
      queryClient.invalidateQueries({ queryKey: ["contributions"] });
    },
    onError: () => toast({ title: "Payment failed", description: "Could not initiate M-Pesa.", variant: "destructive" }),
  });

  const sortedContribs = [...(myContributions || [])].sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId || !amount) return;
    stkMut.mutate({ group_id: parseInt(groupId), amount });
  };

  return (
    <div className="space-y-8 max-w-[1440px] mx-auto pb-16">

      {/* Header */}
      <div className="cc-fade">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--brand-light)] mb-2 flex items-center gap-2">
          <span className="w-4 h-px bg-[var(--brand-light)]" /> M-Pesa Integration
        </p>
        <h1 className="cc-h1 mb-1">Payments</h1>
        <p className="text-sm text-[var(--fg-muted)]">Initiate M-Pesa STK push contributions to your groups</p>
        <div className="mt-4 flex gap-2">
          <button onClick={() => navigate('/dashboard/deposit')} className="cc-btn-primary text-xs">Deposit</button>
          <button onClick={() => navigate('/dashboard/withdraw')} className="cc-btn-outline text-xs">Withdraw</button>
        </div>
      </div>

      {/* Two column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Payment Form — Glow card */}
        <div className="cc-card-glow cc-fade cc-d1">
          {/* M-Pesa branding strip */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #00A651, #007A3D)' }}>
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="cc-h3 mb-0.5">M-Pesa STK Push</h2>
              <p className="text-xs text-[var(--fg-muted)]">Safaricom · Secure payment</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5 text-xs text-[var(--success)] font-semibold bg-[var(--success-bg)] px-3 py-1.5 rounded-full border border-[var(--success-border)]">
              <Wifi className="w-3 h-3" /> Live
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="cc-label">Select Group</label>
              <select value={groupId} onChange={e => setGroupId(e.target.value)} className="cc-select" required>
                <option value="">Choose a group…</option>
                {myGroups?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>

            <div>
              <label className="cc-label">Amount (KES)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-mono font-bold text-[var(--brand-light)]">KES</span>
                <input type="number" step="0.01" min="1" value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="0.00" required className="cc-input pl-14 font-mono text-lg font-bold" />
              </div>
            </div>

            {/* Selected group preview */}
            {groupId && (
              <div className="rounded-xl border border-[var(--brand-border)] p-4 bg-[var(--brand-tint)]">
                {(() => {
                  const g = groups?.find(gr => String(gr.id) === groupId);
                  if (!g) return null;
                  const pct = parseFloat(g.progress_percentage || "0");
                  return (
                    <div>
                      <p className="text-xs text-[var(--brand-light)] font-bold uppercase tracking-wider mb-2">{g.name}</p>
                      <div className="cc-progress mb-1"><div className="cc-progress-bar" style={{ width: `${pct}%` }} /></div>
                      <p className="text-xs text-[var(--fg-muted)] font-mono">{Math.round(pct)}% funded · Goal: {formatKES(parseFloat(g.target_amount))}</p>
                    </div>
                  );
                })()}
              </div>
            )}

            <button type="submit" className="cc-btn-primary w-full py-3 text-base font-bold"
              disabled={stkMut.isPending || !groupId || !amount}>
              {stkMut.isPending
                ? <><Loader2 className="w-5 h-5 cc-spin" />Sending prompt…</>
                : <><Send className="w-5 h-5" />Send Payment Request</>}
            </button>

            <div className="flex items-center gap-2 text-xs text-[var(--fg-muted)] justify-center">
              <Shield className="w-3.5 h-3.5 text-[var(--success)]" />
              256-bit encrypted · Powered by Safaricom API
            </div>
          </form>
        </div>

        {/* How it works */}
        <div className="cc-card cc-fade cc-d2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-tint)] border border-[var(--accent-border)] flex items-center justify-center">
              <Zap className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="cc-h3 mb-0.5">How it works</h2>
              <p className="text-xs text-[var(--fg-muted)]">4 simple steps</p>
            </div>
          </div>

          <div className="space-y-4">
            {STEPS.map((step, i) => (
              <div key={step.n} className="flex gap-4 cc-fade" style={{ animationDelay: `${200 + i * 80}ms` }}>
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-[var(--brand-light)] border border-[var(--brand-border)]"
                  style={{ background: 'var(--brand-tint)' }}>
                  {step.n}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-[var(--fg-muted)] leading-relaxed pt-1">{step.text}</p>
                  {i < STEPS.length - 1 && (
                    <div className="ml-[-28px] mt-3 mb-0 w-px h-4 bg-[var(--border-mid)] ml-4" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Trust signals */}
          <div className="mt-6 pt-5 border-t border-[var(--border)] grid grid-cols-3 gap-3 text-center">
            {[
              { icon: Shield, label: 'Secure' },
              { icon: Zap,    label: 'Instant' },
              { icon: CheckCircle, label: 'Verified' },
            ].map(t => (
              <div key={t.label} className="flex flex-col items-center gap-1.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--bg-alt)] flex items-center justify-center">
                  <t.icon className="w-4 h-4 text-[var(--brand-light)]" />
                </div>
                <span className="text-xs font-semibold text-[var(--fg-muted)]">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment history */}
      <div className="cc-fade cc-d4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="cc-h3">Payment History</h2>
          <History className="w-5 h-5 text-[var(--fg-muted)]" />
        </div>

        <div className="cc-card p-0 overflow-hidden">
          {cL ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-[var(--brand-light)] cc-spin" /></div>
          ) : sortedContribs.length === 0 ? (
            <div className="flex flex-col items-center py-14 gap-3">
              <CreditCard className="w-8 h-8 text-[var(--fg-muted)]" />
              <p className="text-sm text-[var(--fg-muted)]">No payments made yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="cc-table w-full">
                <thead><tr><th>Date</th><th>Group</th><th className="text-right">Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {sortedContribs.map((c, i) => {
                    const group  = myGroups?.find(g => g.id === c.group);
                    const status = (c.status || "PENDING") as "COMPLETED" | "PENDING" | "FAILED";
                    const icons  = { COMPLETED: CheckCircle, PENDING: Clock, FAILED: XCircle };
                    const clses  = { COMPLETED: 'cc-badge-success', PENDING: 'cc-badge-warning', FAILED: 'cc-badge-danger' };
                    const Icon   = icons[status];
                    return (
                      <tr key={c.id} className="cc-fade" style={{ animationDelay: `${i * 30}ms` }}>
                        <td className="font-mono text-xs text-[var(--fg-muted)] whitespace-nowrap">
                          {c.created_at ? new Date(c.created_at).toLocaleDateString('en-KE') : "—"}
                        </td>
                        <td className="font-medium">{group?.name || `Group #${c.group}`}</td>
                        <td className="text-right font-mono font-bold text-[var(--brand-light)]">{formatKES(parseFloat(c.amount))}</td>
                        <td>
                          <span className={`cc-badge ${clses[status]} flex items-center gap-1.5 w-fit`}>
                            <Icon className="w-3 h-3" />{status.charAt(0) + status.slice(1).toLowerCase()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}