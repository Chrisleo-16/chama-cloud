'use client';

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { groupsApi, type ChamaGroup } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Loader2, Pencil, Trash2, Users, Search,
  TrendingUp, CheckCircle, Leaf, MoreHorizontal, Target
} from "lucide-react";

const formatKES = (amount: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);

function GroupForm({ group, onSubmit, loading }: { group?: ChamaGroup; onSubmit: (d: Partial<ChamaGroup>) => void; loading: boolean }) {
  const [name, setName]               = useState(group?.name ?? "");
  const [description, setDescription] = useState(group?.description ?? "");
  const [targetAmount, setTargetAmount] = useState(group?.target_amount ?? "");

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit({ name, description, target_amount: targetAmount }); }} className="space-y-5">
      <div><label className="cc-label">Group Name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Umoja Traders" required className="cc-input" /></div>
      <div><label className="cc-label">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this group about?" rows={3} className="cc-input h-24 resize-none" /></div>
      <div><label className="cc-label">Target Amount (KES)</label><input type="number" step="0.01" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} placeholder="100,000" required className="cc-input" /></div>
      <button type="submit" className="cc-btn-primary w-full" disabled={loading}>
        {loading && <Loader2 className="w-4 h-4 cc-spin" />}
        {group ? "Update Group" : "Create Group"}
      </button>
    </form>
  );
}

export default function Groups() {
  const [dialogOpen, setDialogOpen]   = useState(false);
  const [editGroup, setEditGroup]     = useState<ChamaGroup | undefined>();
  const [searchTerm, setSearchTerm]   = useState("");
  const queryClient                   = useQueryClient();
  const { toast }                     = useToast();

  const { data: groups, isLoading } = useQuery({ queryKey: ["groups"], queryFn: groupsApi.list });

  const createMut = useMutation({
    mutationFn: groupsApi.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["groups"] }); setDialogOpen(false); toast({ title: "Group created!" }); },
    onError: () => toast({ title: "Failed to create", variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ChamaGroup> }) => groupsApi.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["groups"] }); setDialogOpen(false); setEditGroup(undefined); toast({ title: "Group updated!" }); },
    onError: () => toast({ title: "Failed to update", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: groupsApi.delete,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["groups"] }); toast({ title: "Group deleted" }); },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  const handleSubmit = (data: Partial<ChamaGroup>) => {
    if (editGroup) updateMut.mutate({ id: editGroup.id, data });
    else createMut.mutate(data);
  };

  const filtered = groups?.filter(g =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (g.description && g.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-[var(--brand-light)] cc-spin" />
    </div>
  );

  // Summary stats
  const totalFunded   = groups?.filter(g => g.is_fully_funded === "True").length ?? 0;
  const totalActive   = groups?.filter(g => g.is_active).length ?? 0;
  const totalCapital  = groups?.reduce((s, g) => s + parseFloat(g.current_amount || "0"), 0) ?? 0;

  return (
    <div className="space-y-8 max-w-[1440px] mx-auto pb-16">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 cc-fade">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--brand-light)] mb-2 flex items-center gap-2">
            <span className="w-4 h-px bg-[var(--brand-light)]" /> Chama Groups
          </p>
          <h1 className="cc-h1 mb-1">Groups</h1>
          <p className="text-sm text-[var(--fg-muted)]">Manage your savings and investment groups</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) setEditGroup(undefined); }}>
          <DialogTrigger asChild>
            <button className="cc-btn-primary flex-shrink-0"><Plus className="w-4 h-4" />New Group</button>
          </DialogTrigger>
          <DialogContent className="p-0 border-0 bg-transparent shadow-none max-w-lg">
            <div className="cc-modal">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[var(--brand-tint)] border border-[var(--brand-border)] flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-[var(--brand-light)]" />
                </div>
                <DialogHeader className="p-0"><DialogTitle className="cc-h3 p-0">{editGroup ? "Edit Group" : "Create New Group"}</DialogTitle></DialogHeader>
              </div>
              <GroupForm group={editGroup} onSubmit={handleSubmit} loading={createMut.isPending || updateMut.isPending} />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-4 cc-fade cc-d1">
        {[
          { label: 'Total Capital', value: formatKES(totalCapital), icon: TrendingUp },
          { label: 'Active Groups', value: totalActive,             icon: Users },
          { label: 'Fully Funded',  value: totalFunded,             icon: CheckCircle },
        ].map(s => (
          <div key={s.label} className="cc-card flex items-center gap-4 py-4">
            <div className="stat-icon flex-shrink-0"><s.icon className="w-4 h-4 text-[var(--brand-light)]" /></div>
            <div><p className="text-xs text-[var(--fg-muted)] uppercase tracking-wider">{s.label}</p><p className="font-mono font-bold text-[var(--fg)] text-xl">{s.value}</p></div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md cc-fade cc-d2">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fg-muted)]" />
        <input placeholder="Search groups…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="cc-input pl-10 pr-4" />
      </div>

      {/* Grid */}
      {filtered?.length === 0 ? (
        <div className="cc-card flex flex-col items-center py-20 gap-4 text-center cc-fade">
          <div className="w-14 h-14 rounded-2xl bg-[var(--bg-alt)] flex items-center justify-center">
            <Users className="w-6 h-6 text-[var(--fg-muted)]" />
          </div>
          <p className="font-semibold text-[var(--fg)]">No groups found</p>
          <p className="text-sm text-[var(--fg-muted)]">Create your first chama group to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered?.map((g, idx) => {
            const pct = parseFloat(g.progress_percentage || "0");
            return (
              <div key={g.id} className="cc-card hover-lift cc-fade cursor-pointer group" style={{ animationDelay: `${idx * 60}ms` }}>

                {/* Top row */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-[var(--fg)] text-base tracking-tight leading-tight truncate">{g.name}</h3>
                      {g.is_fully_funded === "True" && (
                        <span className="cc-badge cc-badge-success text-[10px]">✓ Funded</span>
                      )}
                    </div>
                    {g.wholesaler_name && <p className="text-xs text-[var(--fg-muted)] truncate">via {g.wholesaler_name}</p>}
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-smooth flex-shrink-0">
                    <button onClick={() => { setEditGroup(g); setDialogOpen(true); }} className="cc-btn-ghost p-2">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteMut.mutate(g.id)} className="cc-btn-ghost p-2 hover:!text-[var(--danger)] hover:!bg-[var(--danger-bg)]">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                {g.description && <p className="text-xs text-[var(--fg-muted)] line-clamp-2 mb-4">{g.description}</p>}

                {/* Status */}
                <div className="flex gap-2 mb-4">
                  <span className={`cc-badge ${g.is_active ? 'cc-badge-brand' : 'cc-badge-neutral'}`}>
                    {g.is_active ? '● Active' : '○ Inactive'}
                  </span>
                </div>

                {/* Progress */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--fg-muted)]">Savings progress</span>
                    <span className="font-mono font-semibold text-[var(--fg)]">{Math.round(pct)}%</span>
                  </div>
                  <div className="cc-progress"><div className="cc-progress-bar" style={{ width: `${pct}%` }} /></div>
                  <div className="flex justify-between text-xs font-mono pt-0.5">
                    <span className="text-[var(--brand-light)]">{formatKES(parseFloat(g.current_amount || "0"))}</span>
                    <span className="text-[var(--fg-muted)]">{formatKES(parseFloat(g.target_amount))}</span>
                  </div>
                </div>

                {/* Members count */}
                <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--fg-muted)]">
                  <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{g.members_count || 0} members</div>
                  <button className="text-[var(--brand-light)] font-semibold hover:underline flex items-center gap-1">
                    View <Target className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}