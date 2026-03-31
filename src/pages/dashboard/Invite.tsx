"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { groupsApi, contributionsApi } from "@/lib/api";
import { ArrowLeft, Link2, Copy, CheckCheck, Users } from "lucide-react";

export default function Invite() {
  const navigate  = useNavigate();
  const [copied, setCopied]   = useState(false);
  const [groupId, setGroupId] = useState<number | null>(null);

  const { data: groups }        = useQuery({ queryKey: ["groups"],        queryFn: groupsApi.list });
  const { data: contributions } = useQuery({ queryKey: ["contributions"], queryFn: contributionsApi.list });

  const myGroupIds  = new Set((contributions || []).map(c => c.group));
  const myGroups    = (groups || []).filter(g => myGroupIds.has(g.id));
  const selectedGroup = myGroups.find(g => g.id === groupId);

  const inviteLink = groupId && selectedGroup
    ? `${window.location.origin}/register?ref_group=${groupId}&ref_name=${encodeURIComponent(selectedGroup.name)}`
    : `${window.location.origin}/register`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto pb-16 px-4 pt-8">
      <div className="flex items-center gap-3 cc-fade">
        <button onClick={() => navigate("/dashboard", { replace: true })} className="cc-btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--brand-light)] mb-1">Community</p>
          <h1 className="cc-h1">Invite a Member</h1>
        </div>
      </div>

      <div className="cc-card flex flex-col gap-5 cc-fade cc-d1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--brand-tint)] border border-[var(--brand-border)] flex items-center justify-center flex-shrink-0">
            <Link2 className="w-5 h-5 text-[var(--brand-light)]" />
          </div>
          <div>
            <p className="font-semibold text-[var(--fg)]">Share your invite link</p>
            <p className="text-xs text-[var(--fg-muted)]">
              Invite someone directly into one of your groups — they'll be prompted to join on registration.
            </p>
          </div>
        </div>

        {/* Group selector */}
        {myGroups.length > 0 && (
          <div>
            <label className="cc-label">Invite to a specific group (optional)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => setGroupId(null)}
                className={`flex items-center gap-2 p-3 rounded-xl border text-sm transition-smooth ${!groupId ? "border-[var(--brand-border)] bg-[var(--brand-tint)] text-[var(--brand-light)]" : "border-[var(--border)] text-[var(--fg-muted)]"}`}
              >
                <Users className="w-4 h-4" /> General invite
              </button>
              {myGroups.slice(0, 5).map(g => (
                <button
                  key={g.id}
                  onClick={() => setGroupId(g.id === groupId ? null : g.id)}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-sm transition-smooth text-left ${groupId === g.id ? "border-[var(--brand-border)] bg-[var(--brand-tint)] text-[var(--brand-light)]" : "border-[var(--border)] text-[var(--fg-muted)]"}`}
                >
                  <Users className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{g.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Link */}
        <div className="flex gap-2">
          <input readOnly value={inviteLink} className="cc-input font-mono text-xs flex-1" />
          <button onClick={handleCopy} className="cc-btn-primary flex-shrink-0">
            {copied ? <><CheckCheck className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy</>}
          </button>
        </div>

        {groupId && selectedGroup && (
          <p className="text-xs text-[var(--brand-light)] bg-[var(--brand-tint)] border border-[var(--brand-border)] rounded-lg px-3 py-2">
            This link will pre-select <strong>{selectedGroup.name}</strong> during registration so your friend joins directly.
          </p>
        )}
      </div>

      <button onClick={() => navigate("/dashboard", { replace: true })} className="cc-btn-ghost">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>
    </div>
  );
}