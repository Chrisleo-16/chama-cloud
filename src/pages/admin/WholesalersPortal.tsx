"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { groupsApi, contributionsApi, wholesalersApi } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users, Target, Clock, Wallet, Loader2, TrendingUp, CheckCircle, XCircle } from "lucide-react";

const formatKES = (n: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(n);

export default function WholesalerPortal() {
  const { toast }   = useToast();
  const queryClient = useQueryClient();
  const [goalName, setGoalName]       = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [wholesaler, setWholesaler]   = useState("none");
  const [deadline, setDeadline]       = useState("");

  const { data: groups,        isLoading: gL } = useQuery({ queryKey: ["groups"],        queryFn: groupsApi.list });
  const { data: contributions, isLoading: cL } = useQuery({ queryKey: ["contributions"], queryFn: contributionsApi.list });
  const { data: wholesalers,   isLoading: wL } = useQuery({ queryKey: ["wholesalers"],   queryFn: wholesalersApi.list });

  const createGroupMut = useMutation({
    mutationFn: () => groupsApi.create({
      name: goalName,
      target_amount: targetAmount,
      wholesaler: wholesaler !== "none" ? Number(wholesaler) : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({ title: "Procurement goal published!" });
      setGoalName(""); setTargetAmount(""); setWholesaler("none"); setDeadline("");
    },
    onError: () => toast({ title: "Failed to publish goal", variant: "destructive" }),
  });

  if (gL || cL)
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-[var(--brand-light)] cc-spin" /></div>;

  const totalMembers  = (groups || []).reduce((acc, g) => acc + (g.members_count || 0), 0);
  const totalFunded   = (groups || []).reduce((acc, g) => acc + parseFloat(g.current_amount || "0"), 0);
  const totalTarget   = (groups || []).reduce((acc, g) => acc + parseFloat(g.target_amount), 0);
  const fundedPercent = totalTarget > 0 ? (totalFunded / totalTarget) * 100 : 0;

  // Recent contributions sorted by date
  const recent = [...(contributions || [])]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-8 max-w-[1440px] mx-auto pb-16">

      {/* Header */}
      <div className="cc-fade">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--brand-light)] mb-2 flex items-center gap-2">
          <span className="w-4 h-px bg-[var(--brand-light)]" /> Admin Panel
        </p>
        <h1 className="cc-h1 mb-1">Wholesaler Portal</h1>
        <p className="text-sm text-[var(--fg-muted)]">Manage groups, procurement goals and member activity</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 cc-fade cc-d1">
        {[
          { label: "Total Members",    value: totalMembers,                     icon: Users,       },
          { label: "Funded",           value: `${fundedPercent.toFixed(0)}%`,   icon: Target,      },
          { label: "Total Collected",  value: formatKES(totalFunded),           icon: Wallet,      },
          { label: "Active Groups",    value: (groups || []).filter(g => g.is_active).length, icon: TrendingUp },
        ].map(s => (
          <div key={s.label} className="cc-card flex items-center gap-4 py-4">
            <div className="stat-icon flex-shrink-0"><s.icon className="w-4 h-4 text-[var(--brand-light)]" /></div>
            <div>
              <p className="text-xs text-[var(--fg-muted)] uppercase tracking-wider">{s.label}</p>
              <p className="font-mono font-bold text-[var(--fg)] text-xl">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Procurement Goal Form */}
      <div className="cc-card cc-fade cc-d2">
        <h2 className="cc-h3 mb-5">Set Procurement Goal</h2>
        <form onSubmit={e => { e.preventDefault(); createGroupMut.mutate(); }} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="cc-label">Goal Name</label>
              <input type="text" className="cc-input" placeholder="e.g. Onion Bulk Buy March"
                value={goalName} onChange={e => setGoalName(e.target.value)} required />
            </div>
            <div>
              <label className="cc-label">Target Amount (KES)</label>
              <input type="number" className="cc-input" placeholder="50000"
                value={targetAmount} onChange={e => setTargetAmount(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="cc-label">Select Wholesaler</label>
              <Select value={wholesaler} onValueChange={setWholesaler} disabled={wL}>
                <SelectTrigger className="cc-select">
                  <SelectValue placeholder={wL ? "Loading…" : "Select a supplier"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {(wholesalers || []).map(w => (
                    <SelectItem key={w.id} value={String(w.id)}>
                      {w.business_name || `${w.first_name} ${w.last_name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="cc-label">Deadline Date</label>
              <input type="date" className="cc-input" value={deadline} onChange={e => setDeadline(e.target.value)} required />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={createGroupMut.isPending} className="cc-btn-primary">
              {createGroupMut.isPending && <Loader2 className="w-4 h-4 cc-spin" />}
              Publish Goal
            </button>
            <button type="button" className="cc-btn-ghost" onClick={() => {
              setGoalName(""); setTargetAmount(""); setWholesaler("none"); setDeadline("");
            }}>Clear</button>
          </div>
        </form>
      </div>

      {/* Groups overview */}
      <div className="cc-fade cc-d3">
        <h2 className="cc-h3 mb-4">All Groups</h2>
        <div className="cc-card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="cc-table w-full">
              <thead>
                <tr><th>Group</th><th>Wholesaler</th><th>Members</th><th className="text-right">Collected</th><th className="text-right">Target</th><th>Progress</th><th>Status</th></tr>
              </thead>
              <tbody>
                {(groups || []).map(g => {
                  const pct = Math.min(100, Math.round(parseFloat(g.progress_percentage || "0")));
                  return (
                    <tr key={g.id}>
                      <td className="font-medium">{g.name}</td>
                      <td className="text-xs text-[var(--fg-muted)]">{g.wholesaler_name || "—"}</td>
                      <td className="font-mono">{g.members_count || 0}</td>
                      <td className="text-right font-mono text-[var(--brand-light)]">{formatKES(parseFloat(g.current_amount || "0"))}</td>
                      <td className="text-right font-mono text-[var(--fg-muted)]">{formatKES(parseFloat(g.target_amount))}</td>
                      <td>
                        <div className="flex items-center gap-2 min-w-[80px]">
                          <div className="cc-progress flex-1"><div className="cc-progress-bar" style={{ width: `${pct}%` }} /></div>
                          <span className="text-xs font-mono text-[var(--fg-muted)]">{pct}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`cc-badge ${g.is_active ? "cc-badge-brand" : "cc-badge-neutral"}`}>
                          {g.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Live activity feed — real contributions */}
      <div className="cc-fade cc-d4">
        <h2 className="cc-h3 mb-4">Live Member Activity</h2>
        <div className="cc-card p-0 overflow-hidden">
          {recent.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-2 text-center">
              <Clock className="w-6 h-6 text-[var(--fg-muted)]" />
              <p className="text-sm text-[var(--fg-muted)]">No activity yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {recent.map((c, i) => {
                const group = (groups || []).find(g => g.id === c.group);
                const StatusIcon = c.status === "COMPLETED" ? CheckCircle : c.status === "FAILED" ? XCircle : Clock;
                const statusColor = c.status === "COMPLETED" ? "text-green-500" : c.status === "FAILED" ? "text-red-500" : "text-amber-500";
                return (
                  <div key={c.id} className="flex items-center justify-between px-5 py-3 hover:bg-[var(--bg-alt)] transition-smooth">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--brand-tint)] border border-[var(--brand-border)] flex items-center justify-center text-xs font-bold text-[var(--brand-light)]">
                        {(c.merchant_name || "M").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--fg)]">{c.merchant_name || `Member #${c.merchant}`}</p>
                        <p className="text-xs text-[var(--fg-muted)]">
                          {group?.name || `Group #${c.group}`} · {c.created_at ? new Date(c.created_at).toLocaleDateString("en-KE") : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-[var(--brand-light)]">+{formatKES(parseFloat(c.amount))}</span>
                      <StatusIcon className={`w-4 h-4 ${statusColor}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}