"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  groupsApi, wholesalersApi, contributionsApi, type ChamaGroup,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Loader2, Pencil, Trash2, Users, Search, TrendingUp,
  CheckCircle, Leaf, Target, Send, Copy, CheckCheck,
} from "lucide-react";

const formatKES = (n: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(n);

// ── Group Form ────────────────────────────────────────────────────────────────
function GroupForm({ group, onSubmit, loading }: {
  group?: ChamaGroup;
  onSubmit: (d: Partial<ChamaGroup>) => void;
  loading: boolean;
}) {
  const [name, setName]                 = useState(group?.name ?? "");
  const [description, setDescription]  = useState(group?.description ?? "");
  const [targetAmount, setTargetAmount] = useState(group?.target_amount?.toString() ?? "");
  const [wholesalerId, setWholesalerId] = useState(group?.wholesaler?.toString() ?? "none");

  const { data: wholesalers, isLoading: wLoading } = useQuery({
    queryKey: ["wholesalers"], queryFn: wholesalersApi.list,
  });

  return (
    <form onSubmit={e => {
      e.preventDefault();
      onSubmit({
        name, description, target_amount: targetAmount,
        wholesaler: wholesalerId !== "none" ? Number(wholesalerId) : undefined,
      });
    }} className="space-y-5">
      <div>
        <label className="cc-label">Group Name</label>
        <input value={name} onChange={e => setName(e.target.value)}
          placeholder="e.g. Umoja Traders" required className="cc-input" />
      </div>
      <div>
        <label className="cc-label">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)}
          placeholder="What will this group buy together?" rows={3}
          className="cc-input h-24 resize-none" />
      </div>
      <div>
        <label className="cc-label">Target Amount (KES)</label>
        <input type="number" step="0.01" value={targetAmount}
          onChange={e => setTargetAmount(e.target.value)}
          placeholder="100,000" required className="cc-input" />
      </div>
      <div>
        <label className="cc-label">Linked Wholesaler (optional)</label>
        <Select value={wholesalerId} onValueChange={setWholesalerId} disabled={wLoading}>
          <SelectTrigger className="cc-select">
            <SelectValue placeholder={wLoading ? "Loading…" : "Select a wholesaler"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {wholesalers?.map(w => (
              <SelectItem key={w.id} value={String(w.id)}>
                {w.business_name || `${w.first_name} ${w.last_name}`.trim()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <button type="submit" className="cc-btn-primary w-full" disabled={loading}>
        {loading && <Loader2 className="w-4 h-4 cc-spin" />}
        {group ? "Update Group" : "Create Group"}
      </button>
    </form>
  );
}

// ── Referral Copy Button ──────────────────────────────────────────────────────
function ReferralButton({ groupId, groupName }: { groupId: number; groupName: string }) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/register?ref_group=${groupId}&ref_name=${encodeURIComponent(groupName)}`;
  const copy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy}
      className="text-[var(--brand-light)] font-semibold hover:underline flex items-center gap-1 text-xs">
      {copied
        ? <><CheckCheck className="w-3 h-3" /> Copied!</>
        : <><Copy className="w-3 h-3" /> Invite</>}
    </button>
  );
}

// ── Join + Contribute Dialog ──────────────────────────────────────────────────
// This dialog does two things in sequence:
//   1. PATCH /groups/list/{id}/ with { join: true }  → records membership
//   2. Navigate to /dashboard/payments               → records contribution
function JoinContributeDialog({ group, isMember }: { group: ChamaGroup; isMember: boolean }) {
  const [open, setOpen]   = useState(false);
  const [amount, setAmount] = useState("");
  const queryClient       = useQueryClient();
  const { toast }         = useToast();
  const navigate          = useNavigate();
  const pct               = Math.min(100, Math.round(parseFloat(group.progress_percentage || "0")));

  // Step 1 — join the group (records membership on backend)
  const joinMut = useMutation({
    mutationFn: () => groupsApi.join(group.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["contributions"] });
    },
    onError: (err: any) => {
      // 400 "already a member" is fine — continue to payment
      const alreadyMember =
        err?.status === 400 ||
        JSON.stringify(err?.data || "").toLowerCase().includes("already");
      if (!alreadyMember) {
        toast({ title: "Could not join group", variant: "destructive" });
        throw err;
      }
    },
  });

  const handleProceed = async () => {
    if (!isMember) {
      try {
        await joinMut.mutateAsync();
      } catch {
        return; // joinMut.onError already toasted
      }
    }
    setOpen(false);
    // Navigate to payment page — groupId passed so the STK push knows the target
    navigate(`/dashboard/payments?groupId=${group.id}&amount=${encodeURIComponent(amount)}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="cc-btn-primary text-xs py-1.5 px-3">
          <Send className="w-3 h-3" /> {isMember ? "Contribute" : "Join & Contribute"}
        </button>
      </DialogTrigger>
      <DialogContent className="p-0 border-0 bg-transparent shadow-none max-w-sm">
        <div className="cc-modal">
          <DialogHeader>
            <DialogTitle className="cc-h3">
              {isMember ? `Contribute to ${group.name}` : `Join ${group.name}`}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {!isMember && (
              <p className="text-sm text-[var(--fg-muted)]">
                Your first contribution will add you as a member of{" "}
                <strong className="text-[var(--fg)]">{group.name}</strong>.
              </p>
            )}

            {/* Progress snapshot */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--fg-muted)]">Group progress</span>
                <span className="font-mono font-semibold">{pct}%</span>
              </div>
              <div className="cc-progress">
                <div className="cc-progress-bar" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[var(--brand-light)]">
                  {formatKES(parseFloat(group.current_amount || "0"))}
                </span>
                <span className="text-[var(--fg-muted)]">
                  {formatKES(parseFloat(group.target_amount))}
                </span>
              </div>
            </div>

            {group.wholesaler_name && (
              <p className="text-xs text-[var(--fg-muted)]">
                Linked wholesaler: <strong>{group.wholesaler_name}</strong>
              </p>
            )}

            {/* Amount input */}
            <div>
              <label className="cc-label">Amount (KES)</label>
              <input
                type="number"
                step="1"
                min="1"
                className="cc-input"
                placeholder="e.g. 5000"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setOpen(false)} className="cc-btn-ghost flex-1">
                Cancel
              </button>
              <button
                onClick={handleProceed}
                disabled={!amount || joinMut.isPending}
                className="cc-btn-primary flex-1"
              >
                {joinMut.isPending
                  ? <Loader2 className="w-4 h-4 cc-spin" />
                  : <Send className="w-4 h-4" />}
                {isMember ? "Pay via M-Pesa" : "Join & Pay"}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Groups() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editGroup, setEditGroup]   = useState<ChamaGroup | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode]     = useState<"mine" | "all">("mine");
  const queryClient                 = useQueryClient();
  const { toast }                   = useToast();
  const navigate                    = useNavigate();

  // ── Profile from AuthContext — no duplicate API call ─────────────────────
  const { profile, userRole, loading: authLoading } = useAuth();
  const profileLocation = profile?.business_address?.toLowerCase()?.trim() || "";
  const profileCategory = profile?.business_category?.toLowerCase()?.trim() || "";

  const { data: groups,        isLoading: gL } = useQuery({ queryKey: ["groups"],       queryFn: groupsApi.list });
  const { data: contributions              }   = useQuery({ queryKey: ["contributions"], queryFn: contributionsApi.list });

  // ── Groups the current user has contributed to (real-time from API) ───────
  const myGroupIds = new Set(
    (contributions || [])
      .filter(c => {
        if (!profile) return false;
        if (c.merchant && profile.id && +c.merchant === +profile.id) return true;
        const name = profile.first_name?.trim().toLowerCase() || "";
        return name && c.merchant_name?.toLowerCase().startsWith(name);
      })
      .map(c => c.group)
  );

  const displayGroups = (groups || []).filter(g => {
    const matchSearch =
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.description || "").toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchSearch) return false;

    if (viewMode === "mine") {
      return myGroupIds.has(g.id);
    }

    // "Discover all" — rank local matches first but show all
    return true;
  });

  // Sort "discover" so local matches come first
  const sortedGroups = viewMode === "all"
    ? [...displayGroups].sort((a, b) => {
        const aLocal =
          (a.description || "").toLowerCase().includes(profileLocation) ||
          (a.description || "").toLowerCase().includes(profileCategory);
        const bLocal =
          (b.description || "").toLowerCase().includes(profileLocation) ||
          (b.description || "").toLowerCase().includes(profileCategory);
        return (bLocal ? 1 : 0) - (aLocal ? 1 : 0);
      })
    : displayGroups;

  const createMut = useMutation({
    mutationFn: groupsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      setDialogOpen(false);
      toast({ title: "Group created!" });
    },
    onError: () => toast({ title: "Failed to create", variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ChamaGroup> }) => groupsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      setDialogOpen(false);
      setEditGroup(undefined);
      toast({ title: "Group updated!" });
    },
    onError: () => toast({ title: "Failed to update", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: groupsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({ title: "Group deleted" });
    },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  const handleSubmit = (data: Partial<ChamaGroup>) => {
    if (editGroup) updateMut.mutate({ id: editGroup.id, data });
    else createMut.mutate(data);
  };

  const [pollAnswer, setPollAnswer]     = useState<"coming" | "delayed" | "unknown" | null>(null);
  const [pollSubmitted, setPollSubmitted] = useState(false);

  if (authLoading || gL) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-[var(--brand-light)] cc-spin" />
    </div>
  );

  const myGroups     = (groups || []).filter(g => myGroupIds.has(g.id));
  const totalFunded  = myGroups.filter(g => g.is_fully_funded === "True").length;
  const totalActive  = myGroups.filter(g => g.is_active).length;
  const totalCapital = myGroups.reduce((s, g) => s + parseFloat(g.current_amount || "0"), 0);

  return (
    <div className="space-y-8 max-w-[1440px] mx-auto pb-16">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 cc-fade">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--brand-light)] mb-2 flex items-center gap-2">
            <span className="w-4 h-px bg-[var(--brand-light)]" /> Chama Groups
          </p>
          <h1 className="cc-h1 mb-1">Groups</h1>
          <p className="text-sm text-[var(--fg-muted)]">Create, join and manage your savings groups</p>
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
                <DialogHeader className="p-0">
                  <DialogTitle className="cc-h3 p-0">
                    {editGroup ? "Edit Group" : "Create New Group"}
                  </DialogTitle>
                </DialogHeader>
              </div>
              <GroupForm
                group={editGroup}
                onSubmit={handleSubmit}
                loading={createMut.isPending || updateMut.isPending}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 cc-fade cc-d1">
        {[
          { label: "Total Capital", value: formatKES(totalCapital), icon: TrendingUp  },
          { label: "Active Groups", value: totalActive,             icon: Users       },
          { label: "Fully Funded",  value: totalFunded,             icon: CheckCircle },
        ].map(s => (
          <div key={s.label} className="cc-card flex items-center gap-4 py-4">
            <div className="stat-icon flex-shrink-0">
              <s.icon className="w-4 h-4 text-[var(--brand-light)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--fg-muted)] uppercase tracking-wider">{s.label}</p>
              <p className="font-mono font-bold text-[var(--fg)] text-xl">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Supply notifications + poll */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 cc-fade">
        <div className="cc-card">
          <h3 className="text-sm font-semibold mb-2">Supply Notifications</h3>
          <p className="text-xs text-[var(--fg-muted)] mb-2">
            Track the latest incoming stock by group you joined.
          </p>
          {myGroups.length ? (
            myGroups.slice(0, 2).map((g) => {
              const progress = Math.min(100, Math.round(parseFloat(g.progress_percentage || "0")));
              return (
                <article key={g.id} className="mb-2 border-b border-[var(--border)] pb-2">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-[var(--fg)]">{g.name}</p>
                    <span className="text-xs text-[var(--fg-muted)]">ETA 3 days</span>
                  </div>
                  <div className="cc-progress mb-1">
                    <div className="cc-progress-bar" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-xs text-[var(--fg-muted)]">
                    {progress}% stocked · {g.members_count || 0} members
                  </p>
                </article>
              );
            })
          ) : (
            <p className="text-xs text-[var(--fg-muted)]">
              No joined groups yet. Join a group to receive updates.
            </p>
          )}
        </div>

        <div className="cc-card">
          <h3 className="text-sm font-semibold mb-2">Stock Arrival Poll</h3>
          <p className="text-xs text-[var(--fg-muted)] mb-3">
            How confident are you the next delivery is on schedule?
          </p>
          {pollSubmitted ? (
            <p className="text-sm text-[var(--success)]">
              Thanks for your feedback! We'll include this in our next supply report.
            </p>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                {[
                  { value: 'coming',  label: 'On Track' },
                  { value: 'delayed', label: 'Delayed'  },
                  { value: 'unknown', label: 'Unsure'   },
                ].map(opt => (
                  <button key={opt.value}
                    onClick={() => setPollAnswer(opt.value as typeof pollAnswer)}
                    className={`cc-btn-outline text-xs flex-1 ${pollAnswer === opt.value ? 'cc-btn-primary' : ''}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
              <button disabled={!pollAnswer} onClick={() => setPollSubmitted(true)}
                className="cc-btn-primary text-xs w-full">
                Submit poll
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 cc-fade cc-d2">
        <div className="flex gap-1 p-1 bg-[var(--bg-alt)] rounded-xl border border-[var(--border)] w-fit">
          {(["mine", "all"] as const).map(v => (
            <button key={v} onClick={() => setViewMode(v)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-smooth capitalize
                ${viewMode === v ? "bg-[var(--brand)] text-white" : "text-[var(--fg-muted)]"}`}>
              {v === "mine" ? "My Groups" : "Discover All"}
            </button>
          ))}
        </div>
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fg-muted)]" />
          <input placeholder="Search groups…" value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)} className="cc-input pl-10 pr-4" />
        </div>
      </div>

      {/* Group grid */}
      {sortedGroups.length === 0 ? (
        <div className="cc-card flex flex-col items-center py-20 gap-4 text-center cc-fade">
          <div className="w-14 h-14 rounded-2xl bg-[var(--bg-alt)] flex items-center justify-center">
            <Users className="w-6 h-6 text-[var(--fg-muted)]" />
          </div>
          <p className="font-semibold text-[var(--fg)]">
            {viewMode === "mine" ? "You haven't joined any groups yet" : "No groups found"}
          </p>
          <p className="text-sm text-[var(--fg-muted)]">
            {viewMode === "mine"
              ? 'Switch to "Discover All" to find and join a group.'
              : "Create your first chama group to get started."}
          </p>
          {viewMode === "mine" && (
            <button onClick={() => setViewMode("all")} className="cc-btn-primary text-sm">
              Discover Groups
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {sortedGroups.map((g, idx) => {
            const pct      = parseFloat(g.progress_percentage || "0");
            const isMember = myGroupIds.has(g.id);
            // Show "local match" badge in discover mode
            const isLocal  = viewMode === "all" && (
              (g.description || "").toLowerCase().includes(profileLocation) ||
              (g.description || "").toLowerCase().includes(profileCategory)
            );
            
            // Calculate actual member count from contributions
            const memberCount = (contributions || [])
              .filter(c => c.group === g.id)
              .reduce((unique, c) => {
                // Count unique merchants by ID or name
                const identifier = c.merchant || c.merchant_name || 'unknown';
                unique.add(identifier);
                return unique;
              }, new Set()).size;

            return (
              <div key={g.id} className="cc-card hover-lift group"
                style={{ animationDelay: `${idx * 60}ms` }}>

                {/* Top row */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-[var(--fg)] text-base tracking-tight leading-tight truncate">
                        {g.name}
                      </h3>
                      {g.is_fully_funded === "True" &&
                        <span className="cc-badge cc-badge-success text-[10px]">✓ Funded</span>}
                      {isMember &&
                        <span className="cc-badge cc-badge-brand text-[10px]">● Member</span>}
                      {isLocal && !isMember &&
                        <span className="cc-badge cc-badge-warning text-[10px]">📍 Near you</span>}
                    </div>
                    {g.wholesaler_name &&
                      <p className="text-xs text-[var(--fg-muted)] truncate">via {g.wholesaler_name}</p>}
                  </div>
                  {isMember && (
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-smooth flex-shrink-0">
                      <button onClick={() => { setEditGroup(g); setDialogOpen(true); }}
                        className="cc-btn-ghost p-2">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteMut.mutate(g.id)}
                        className="cc-btn-ghost p-2 hover:!text-[var(--danger)] hover:!bg-[var(--danger-bg)]">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {g.description &&
                  <p className="text-xs text-[var(--fg-muted)] line-clamp-2 mb-4">{g.description}</p>}

                <div className="flex gap-2 mb-4">
                  <span className={`cc-badge ${g.is_active ? "cc-badge-brand" : "cc-badge-neutral"}`}>
                    {g.is_active ? "● Active" : "○ Inactive"}
                  </span>
                </div>

                {/* Progress */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--fg-muted)]">Savings progress</span>
                    <span className="font-mono font-semibold text-[var(--fg)]">{Math.round(pct)}%</span>
                  </div>
                  <div className="cc-progress">
                    <div className="cc-progress-bar" style={{ width: `${Math.min(pct, 100)}%` }} />
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

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--fg-muted)]">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />{memberCount} members
                  </div>
                  <div className="flex items-center gap-2">
                    {isMember ? (
                      <>
                        <button
                          onClick={() => navigate(`/dashboard/group/${g.id}`)}
                          className="cc-btn-outline text-xs">
                          View details
                        </button>
                        <JoinContributeDialog group={g} isMember={true} />
                      </>
                    ) : (
                      <JoinContributeDialog group={g} isMember={false} />
                    )}
                    <ReferralButton groupId={g.id} groupName={g.name} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}