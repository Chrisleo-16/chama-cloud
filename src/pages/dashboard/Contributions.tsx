'use client';

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contributionsApi, groupsApi, type Contribution } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Plus, Loader2, Trash2, Coins, CheckCircle, XCircle, Clock,
  ArrowUpRight, Filter, Search, Download, TrendingUp
} from "lucide-react";

const formatKES = (amount: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);

const STATUS_CFG = {
  COMPLETED: { label: "Completed", cls: "cc-badge-success", icon: CheckCircle },
  PENDING:   { label: "Pending",   cls: "cc-badge-warning", icon: Clock       },
  FAILED:    { label: "Failed",    cls: "cc-badge-danger",  icon: XCircle     },
} as const;

const FILTER_OPTS = ['ALL', 'COMPLETED', 'PENDING', 'FAILED'] as const;
type FilterOpt = typeof FILTER_OPTS[number];

export default function Contributions() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupId, setGroupId]       = useState("");
  const [amount, setAmount]         = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterOpt>('ALL');
  const [search, setSearch]         = useState("");
  const queryClient                 = useQueryClient();
  const { toast }                   = useToast();

  // ── Auth context gives us profile + role already fetched ─────────────────
  const { profile, userRole, loading: authLoading } = useAuth();

  const { data: contributions, isLoading } = useQuery({ queryKey: ["contributions"], queryFn: contributionsApi.list });
  const { data: groups }                   = useQuery({ queryKey: ["groups"],        queryFn: groupsApi.list });

  const currentUserId = profile?.id;

  // Filter contributions to only show current user's contributions (same logic as Groups page)
  const myContributions = (contributions || []).filter((c) => {
    if (!profile) return false;

    // Primary match: by merchant ID (same as Groups page)
    if (c.merchant && profile.id && +c.merchant === +profile.id) return true;

    // Secondary match: by merchant name (same as Groups page)
    const name = profile.first_name?.trim().toLowerCase() || "";
    return name && c.merchant_name?.toLowerCase().startsWith(name);
  });

  // Filter groups to show appropriate groups for each role
  const myGroups = (groups || []).filter((g) => {
    if (userRole === "WHOLESALER" && currentUserId) {
      // For wholesaler, show groups assigned to them
      return g.wholesaler === currentUserId;
    }

    // For merchants, show all active groups they can contribute to
    if (userRole === "MERCHANT") {
      return g.is_active;
    }

    // Admin sees everything
    return true;
  });

  const createMut = useMutation({
    mutationFn: contributionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contributions"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      setDialogOpen(false); setGroupId(""); setAmount("");
      toast({ title: "Contribution recorded!" });
    },
    onError: () => toast({ title: "Failed to create contribution", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: contributionsApi.delete,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["contributions"] }); toast({ title: "Deleted" }); },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  const totalContributed = myContributions.reduce((s, c) => s + parseFloat(c.amount || "0"), 0);
  const completedContributions = myContributions
    .filter(c => c.status === "COMPLETED")
    .reduce((s, c) => s + parseFloat(c.amount || "0"), 0);
  const completed = myContributions.filter(c => c.status === "COMPLETED").length;
  const pending   = myContributions.filter(c => c.status === "PENDING").length;
  const rate      = myContributions.length ? Math.round((completed / myContributions.length) * 100) : 0;

  const filtered = myContributions.filter(c => {
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesSearch = !search || c.merchant_name?.toLowerCase().includes(search.toLowerCase()) || String(c.id).includes(search);
    return matchesStatus && matchesSearch;
  });

  if (authLoading || isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-[var(--brand-light)] cc-spin" /></div>;

  return (
    <div className="space-y-8 max-w-[1440px] mx-auto pb-16">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 cc-fade">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--brand-light)] mb-2 flex items-center gap-2">
            <span className="w-4 h-px bg-[var(--brand-light)]" /> Financial Records
          </p>
          <h1 className="cc-h1 mb-1">Contributions</h1>
          <p className="text-sm text-[var(--fg-muted)]">Track all group savings and payments</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="cc-btn-outline text-xs py-2 px-3"><Download className="w-3.5 h-3.5" />Export</button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button className="cc-btn-primary"><Plus className="w-4 h-4" />Add Contribution</button>
            </DialogTrigger>
            <DialogContent className="p-0 border-0 bg-transparent shadow-none max-w-md">
              <div className="cc-modal">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[var(--brand-tint)] border border-[var(--brand-border)] flex items-center justify-center text-primary">
                    <Coins className="w-5 h-5  text-primary" />
                  </div>
                  <DialogHeader className="p-0"><DialogTitle className="cc-h3 p-0 text-primary">New Contribution</DialogTitle></DialogHeader>
                </div>
                <form onSubmit={e => { e.preventDefault(); createMut.mutate({ group: parseInt(groupId), amount }); }} className="space-y-5">
                  <div>
                    <label className="cc-label text-primary">Group</label>
                    <Select value={groupId} onValueChange={setGroupId}>
                      <SelectTrigger className="cc-input text-left flex items-center justify-between">
                        <SelectValue placeholder="Select a group" />
                      </SelectTrigger>
                      <SelectContent className="bg-[var(--bg-card)] border border-[var(--border-mid)] rounded-xl shadow-xl">
                        {myGroups?.map(g => <SelectItem key={g.id} value={String(g.id)} className="text-[var(--fg)] hover:bg-[var(--bg-alt)]">{g.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="cc-label text-primary">Amount (KES)</label>
                    <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="5,000" required className="cc-input" />
                  </div>
                  <button type="submit" className="cc-btn-primary w-full" disabled={createMut.isPending || !groupId}>
                    {createMut.isPending && <Loader2 className="w-4 h-4 cc-spin" />}
                    Submit Contribution
                  </button>
                </form>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 cc-fade cc-d1">
        {[
          { label: 'Total Contributed', value: formatKES(totalContributed), icon: Coins,       color: true  },
          { label: 'Completed',         value: completed,        icon: CheckCircle, color: true  },
          { label: 'Pending',           value: pending,          icon: Clock,       color: false },
          { label: 'Success Rate',      value: `${rate}%`,       icon: TrendingUp,  color: rate > 80 },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="flex justify-between items-start mb-3">
              <p className="text-xs text-[var(--fg-muted)] uppercase tracking-wider">{s.label}</p>
              <div className="stat-icon"><s.icon className="w-4 h-4 text-[var(--brand-light)]" /></div>
            </div>
            <p className="font-mono text-2xl font-bold text-[var(--fg)]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 cc-fade cc-d2">
        {/* Status filters */}
        <div className="cc-tabs">
          {FILTER_OPTS.map(f => (
            <button key={f} onClick={() => setStatusFilter(f)} className={`cc-tab capitalize ${statusFilter === f ? 'active' : ''}`}>
              {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        {/* Search */}
        <div className="relative flex-1 max-w-xs ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fg-muted)]" />
          <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="cc-input pl-10" />
        </div>
      </div>

      {/* Table */}
      {filtered?.length === 0 ? (
        <div className="cc-card flex flex-col items-center py-20 gap-4 cc-fade">
          <div className="w-14 h-14 rounded-2xl bg-[var(--bg-alt)] flex items-center justify-center">
            <Coins className="w-6 h-6 text-[var(--fg-muted)]" />
          </div>
          <p className="font-semibold text-[var(--fg)]">No contributions yet</p>
          <p className="text-sm text-[var(--fg-muted)]">Add your first contribution to get started.</p>
        </div>
      ) : (
        <div className="cc-card p-0 overflow-hidden cc-fade cc-d3">
          <div className="overflow-x-auto">
            <table className="cc-table w-full">
              <thead>
                <tr><th>#</th><th>Merchant</th><th>Group</th><th className="text-right">Amount</th><th>Status</th><th>Date</th><th></th></tr>
              </thead>
              <tbody>
                {filtered?.map((c, i) => {
                  const groupName = myGroups?.find(g => g.id === c.group)?.name || `Group #${c.group}`;
                  const status    = c.status as keyof typeof STATUS_CFG || "PENDING";
                  const { cls, icon: Icon, label } = STATUS_CFG[status] ?? STATUS_CFG.PENDING;
                  return (
                    <tr key={c.id} className="cc-fade" style={{ animationDelay: `${i * 30}ms` }}>
                      <td className="font-mono text-xs text-[var(--fg-muted)]">#{c.id}</td>
                      <td className="font-medium">{c.merchant_name || "—"}</td>
                      <td className="text-[var(--fg-muted)] text-sm">{groupName}</td>
                      <td className="text-right">
                        <span className="font-mono font-bold text-[var(--brand-light)]">{formatKES(parseFloat(c.amount))}</span>
                      </td>
                      <td>
                        <span className={`cc-badge ${cls} flex items-center gap-1.5 w-fit`}>
                          <Icon className="w-3 h-3" />{label}
                        </span>
                      </td>
                      <td className="text-[var(--fg-muted)] text-xs font-mono whitespace-nowrap">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString('en-KE') : "—"}
                      </td>
                      <td>
                        <button onClick={() => deleteMut.mutate(c.id)} className="cc-btn-ghost p-2 hover:!text-[var(--danger)] hover:!bg-[var(--danger-bg)]">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}