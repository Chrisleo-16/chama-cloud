"use client";

import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { contributionsApi, groupsApi } from "@/lib/api";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";
import { ArrowLeft, TrendingUp, Loader2, Coins, CheckCircle } from "lucide-react";

const formatKES = (n: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(n);

export default function Reports() {
  const navigate = useNavigate();

  const { data: contributions, isLoading: cL } = useQuery({ queryKey: ["contributions"], queryFn: contributionsApi.list });
  const { data: groups,        isLoading: gL } = useQuery({ queryKey: ["groups"],        queryFn: groupsApi.list });

  if (cL || gL)
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-[var(--brand-light)] cc-spin" /></div>;

  // Monthly totals from contributions
  const monthlyMap: Record<string, number> = {};
  (contributions || []).forEach(c => {
    if (!c.created_at) return;
    const month = new Date(c.created_at).toLocaleDateString("en-KE", { month: "short", year: "2-digit" });
    monthlyMap[month] = (monthlyMap[month] || 0) + parseFloat(c.amount);
  });
  const monthlyData = Object.entries(monthlyMap)
    .map(([month, total]) => ({ month, total }))
    .slice(-6);

  // Per-group totals
  const groupData = (groups || []).map(g => ({
    name: g.name.length > 12 ? g.name.slice(0, 12) + "…" : g.name,
    current: parseFloat(g.current_amount || "0"),
    target:  parseFloat(g.target_amount),
  }));

  const totalContributed = (contributions || []).reduce((s, c) => s + parseFloat(c.amount), 0);
  const completed        = (contributions || []).filter(c => c.status === "COMPLETED").length;
  const successRate      = (contributions || []).length > 0 ? Math.round((completed / (contributions || []).length) * 100) : 0;

  return (
    <div className="space-y-8 max-w-[1440px] mx-auto pb-16">
      <div className="flex items-center gap-3 cc-fade">
        <button onClick={() => navigate("/dashboard", { replace: true })} className="cc-btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--brand-light)] mb-1">Analytics</p>
          <h1 className="cc-h1">Reports</h1>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 cc-fade cc-d1">
        {[
          { label: "Total Contributed", value: formatKES(totalContributed), icon: Coins },
          { label: "Completed Payments", value: completed, icon: CheckCircle },
          { label: "Success Rate", value: `${successRate}%`, icon: TrendingUp },
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

      {/* Monthly trend */}
      {monthlyData.length > 0 && (
        <div className="cc-card cc-fade cc-d2">
          <h2 className="cc-h3 mb-5">Monthly Contributions</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--brand-light)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--brand-light)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--fg-muted)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--fg-muted)" }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatKES(v)} contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Area type="monotone" dataKey="total" stroke="var(--brand-light)" strokeWidth={2} fill="url(#grad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Per-group bar chart */}
      {groupData.length > 0 && (
        <div className="cc-card cc-fade cc-d3">
          <h2 className="cc-h3 mb-5">Group Funding Status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={groupData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--fg-muted)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--fg-muted)" }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatKES(v)} contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Bar dataKey="current" name="Collected" fill="var(--brand-light)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="target"  name="Target"    fill="var(--border)"      radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <button onClick={() => navigate("/dashboard", { replace: true })} className="cc-btn-ghost">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>
    </div>
  );
}