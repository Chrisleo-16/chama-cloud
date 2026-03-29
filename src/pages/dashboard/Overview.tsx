'use client';

import { useQuery } from "@tanstack/react-query";
import { groupsApi, contributionsApi, walletApi, activitiesApi, userApi } from "@/lib/api";
import {
  Users, TrendingUp, Target, Wallet, ArrowUpRight, Calendar,
  CreditCard, PiggyBank, Clock, CheckCircle, PlusCircle, Send,
  Gift, Sparkles, BarChart3, Leaf, ChevronRight, Zap
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const formatKES = (amount: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);

const sparklineData = [
  { v: 12000 }, { v: 19000 }, { v: 15000 }, { v: 22000 },
  { v: 28000 }, { v: 24000 }, { v: 38000 },
];

export default function Overview() {
  const { data: groups,        isLoading: gL } = useQuery({ queryKey: ["groups"],        queryFn: groupsApi.list });
  const { data: contributions, isLoading: cL } = useQuery({ queryKey: ["contributions"], queryFn: contributionsApi.list });
  const { data: wallet,        isLoading: wL } = useQuery({ queryKey: ["wallet"],        queryFn: walletApi.get });
  const { data: activities,    isLoading: aL } = useQuery({ queryKey: ["activities"],    queryFn: activitiesApi.list });
  const { data: profile,       isLoading: pL } = useQuery({ queryKey: ["profile"],       queryFn: userApi.getProfile });

  if (gL || cL || wL || aL || pL) return (
    <div className="flex items-center justify-center h-80">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[var(--brand-tint)] border border-[var(--brand-border)] flex items-center justify-center mx-auto">
          <Leaf className="w-6 h-6 text-[var(--brand-light)] cc-spin" />
        </div>
        <p className="text-sm font-medium text-[var(--fg-muted)]">Loading your dashboard…</p>
      </div>
    </div>
  );

  const totalContributed  = contributions?.reduce((s, c) => s + parseFloat(c.amount || "0"), 0) ?? 0;
  const activeGroups      = groups?.filter(g => g.is_active).length ?? 0;
  const firstName         = profile?.first_name || "Member";
  const walletBalance     = wallet?.balance || 0;
  const procGroup         = groups?.find(g => g.is_active);
  const procProgress      = procGroup
    ? (parseFloat(procGroup.current_amount || "0") / parseFloat(procGroup.target_amount)) * 100
    : 0;
  const procRemaining     = procGroup
    ? parseFloat(procGroup.target_amount) - parseFloat(procGroup.current_amount || "0")
    : 0;

  return (
    <div className="space-y-8 pb-16 max-w-[1440px] mx-auto">

      {/* ══ HERO WELCOME ══════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--brand-border)] cc-fade"
        style={{ background: 'linear-gradient(135deg, var(--ink-700) 0%, var(--ink-800) 50%, var(--ink-900) 100%)' }}>
        {/* Glow blobs */}
        <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--emerald-glow-strong) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-20 -left-12 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--amber-glow) 0%, transparent 70%)' }} />

        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--brand-light)] mb-2 flex items-center gap-2">
              <span className="w-4 h-px bg-[var(--brand-light)]" /> Dashboard
            </p>
            <h1 className="cc-h1 mb-2">
              Hello, <span className="cc-gradient-text">{firstName}</span> 👋
            </h1>
            <p className="text-sm text-[var(--fg-muted)] max-w-sm">
              Your savings are growing. Here's a snapshot of your chamas and portfolio.
            </p>
          </div>

          {/* Wallet pill */}
          <div className="flex-shrink-0">
            <div className="rounded-2xl border border-[var(--brand-border)] p-5 min-w-[220px]"
              style={{ background: 'rgba(16,185,129,0.07)', backdropFilter: 'blur(12px)' }}>
              <p className="text-xs text-[var(--fg-muted)] mb-1 uppercase tracking-wider">Wallet Balance</p>
              <p className="font-mono text-3xl font-bold text-[var(--fg)] tracking-tight">{formatKES(walletBalance)}</p>
              <div className="flex gap-2 mt-4">
                <button className="cc-btn-primary text-xs py-2 px-4 flex-1">Deposit</button>
                <button className="cc-btn-outline text-xs py-2 px-4 flex-1">Withdraw</button>
              </div>
            </div>
          </div>
        </div>

        {/* Mini sparkline */}
        <div className="h-20 px-6 pb-4 opacity-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={.4} /><stop offset="95%" stopColor="#10B981" stopOpacity={0} /></linearGradient></defs>
              <Area type="monotone" dataKey="v" stroke="#10B981" strokeWidth={1.5} fill="url(#sg)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ══ STAT CARDS ════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Saved",     value: formatKES(totalContributed), icon: PiggyBank,  change: "+8%",  pos: true  },
          { label: "Active Chamas",   value: activeGroups,                icon: Users,      change: `${activeGroups}`, pos: true },
          { label: "Wallet",          value: formatKES(walletBalance),    icon: Wallet,     change: "+2%",  pos: true  },
          { label: "Next Deadline",   value: "2 Days",                    icon: Calendar,   change: "Urgent",pos:false  },
        ].map((s, i) => (
          <div key={s.label} className={`stat-card cc-fade`} style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex justify-between items-start mb-4">
              <div className="stat-icon"><s.icon className="w-5 h-5 text-[var(--brand-light)]" /></div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.pos ? 'bg-[var(--success-bg)] text-[var(--success)]' : 'bg-[var(--warning-bg)] text-[var(--warning)]'}`}>
                {s.change}
              </span>
            </div>
            <p className="text-xs text-[var(--fg-muted)] uppercase tracking-wider mb-1">{s.label}</p>
            <p className="font-mono text-2xl font-bold text-[var(--fg)] tracking-tight">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ══ MAIN 2-COL ════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Chamas */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex justify-between items-center">
            <h2 className="cc-h3">My Chamas</h2>
            <button className="text-xs font-semibold text-[var(--brand-light)] flex items-center gap-1 hover:underline">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups?.slice(0, 4).map((group, i) => {
              const pct = (parseFloat(group.current_amount || "0") / parseFloat(group.target_amount)) * 100;
              return (
                <div key={group.id} className="cc-card hover-lift cursor-pointer cc-fade" style={{ animationDelay: `${i * 70}ms` }}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-[var(--fg)] text-base tracking-tight leading-tight">{group.name}</h3>
                      <p className="text-xs text-[var(--fg-muted)] mt-0.5">
                        {group.members_count || 0} members · {group.is_active ? '● Active' : '○ Inactive'}
                      </p>
                    </div>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-[var(--brand-light)] flex-shrink-0"
                      style={{ background: 'var(--brand-tint)', border: '1px solid var(--brand-border)' }}>
                      {group.name.split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-[var(--fg-muted)]">
                      <span>Progress</span><span className="font-mono font-semibold text-[var(--fg)]">{Math.round(pct)}%</span>
                    </div>
                    <div className="cc-progress"><div className="cc-progress-bar" style={{ width: `${pct}%` }} /></div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[var(--brand-light)]">KES {parseFloat(group.current_amount||"0").toLocaleString()}</span>
                      <span className="text-[var(--fg-muted)]">KES {parseFloat(group.target_amount).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {!groups?.length && (
              <div className="cc-card col-span-2 flex flex-col items-center py-14 gap-3 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[var(--bg-alt)] flex items-center justify-center">
                  <Gift className="w-5 h-5 text-[var(--fg-muted)]" />
                </div>
                <p className="text-sm text-[var(--fg-muted)]">No groups yet. Create your first chama!</p>
                <button className="cc-btn-primary text-sm"><PlusCircle className="w-4 h-4" />New Chama</button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Procurement + Quick Actions */}
        <div className="space-y-5">

          {/* Procurement Goal */}
          {procGroup && (
            <div className="cc-card-glow cc-fade cc-d2">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs text-[var(--brand-light)] uppercase tracking-wider mb-1 font-bold">Procurement Goal</p>
                  <h3 className="cc-h4">{procGroup.name}</h3>
                </div>
                <Target className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <div className="space-y-1.5 mb-4">
                <div className="flex justify-between text-sm"><span className="text-[var(--fg-muted)]">Progress</span><span className="font-mono font-semibold">{Math.round(procProgress)}%</span></div>
                <div className="cc-progress"><div className="cc-progress-bar" style={{ width: `${procProgress}%` }} /></div>
                <div className="flex justify-between text-xs font-mono mt-2">
                  <span className="text-[var(--fg-muted)]">Remaining</span>
                  <span className="text-[var(--accent)]">{formatKES(procRemaining)}</span>
                </div>
              </div>
              <button className="cc-btn-primary w-full gap-2"><Send className="w-4 h-4" />Contribute via M-Pesa</button>
            </div>
          )}

          {/* Quick Actions */}
          <div className="cc-card cc-fade cc-d3">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--fg-muted)] mb-3">Quick Actions</p>
            <div className="space-y-2">
              {[
                { label: 'New Chama',     icon: PlusCircle, color: 'brand' },
                { label: 'Invite Member', icon: Send,        color: 'brand' },
                { label: 'View Reports',  icon: BarChart3,  color: 'accent' },
              ].map(a => (
                <button key={a.label} className="w-full flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] hover:border-[var(--brand-border)] hover:bg-[var(--brand-tint)] transition-smooth text-left group">
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg-alt)] flex items-center justify-center group-hover:bg-[var(--brand-tint)] transition-smooth">
                    <a.icon className="w-4 h-4 text-[var(--fg-muted)] group-hover:text-[var(--brand-light)] transition-smooth" />
                  </div>
                  <span className="text-sm font-medium text-[var(--fg-muted)] group-hover:text-[var(--fg)] transition-smooth">{a.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[var(--fg-muted)] ml-auto opacity-0 group-hover:opacity-100 transition-smooth" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══ RECENT ACTIVITY ═══════════════════════════════════════════ */}
      <div className="cc-fade cc-d4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="cc-h3">Recent Activity</h2>
          <span className="text-xs text-[var(--fg-muted)]">{activities?.length || 0} events</span>
        </div>
        <div className="cc-card p-0 overflow-hidden">
          {activities?.length === 0 || !activities ? (
            <div className="flex flex-col items-center py-14 gap-3">
              <Sparkles className="w-8 h-8 text-[var(--fg-muted)]" />
              <p className="text-sm text-[var(--fg-muted)]">No recent activity. Start contributing!</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {activities.map((act: any, i: number) => (
                <div key={act.id || i} className="flex items-center justify-between px-5 py-4 hover:bg-[var(--bg-alt)] transition-smooth">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-[var(--brand-light)]"
                      style={{ background: 'var(--brand-tint)', border: '1px solid var(--brand-border)' }}>
                      {act.initials || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--fg)]">{act.user}</p>
                      <p className="text-xs text-[var(--fg-muted)] flex items-center gap-1"><Clock className="w-3 h-3" />{act.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[var(--brand-light)]">+{formatKES(act.amount)}</span>
                    <ArrowUpRight className="w-4 h-4 text-[var(--brand-light)]" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}