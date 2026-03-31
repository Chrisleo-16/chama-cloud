"use client";

import { useQuery } from "@tanstack/react-query";
import { contributionsApi, groupsApi, userApi, creditEngine } from "@/lib/api";
import { Loader2, TrendingUp, Users, AlertCircle, CheckCircle, XCircle, Star, Zap, Info } from "lucide-react";

const formatKES = (n: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(n);

const GRADE_CFG = {
  A: { color: "text-green-500",  bg: "bg-green-500/10",  border: "border-green-500/30",  label: "Excellent" },
  B: { color: "text-blue-400",   bg: "bg-blue-400/10",   border: "border-blue-400/30",   label: "Good" },
  C: { color: "text-amber-400",  bg: "bg-amber-400/10",  border: "border-amber-400/30",  label: "Fair" },
  D: { color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/30", label: "Poor" },
  F: { color: "text-red-500",    bg: "bg-red-500/10",    border: "border-red-500/30",    label: "Not Eligible" },
};

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const cfg   = GRADE_CFG[grade as keyof typeof GRADE_CFG] ?? GRADE_CFG.F;
  const r     = 40;
  const circ  = 2 * Math.PI * r;
  const dash  = (score / 100) * circ;
  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg width="112" height="112" className="-rotate-90">
        <circle cx="56" cy="56" r={r} strokeWidth="8" fill="none" className="stroke-[var(--border)]" />
        <circle cx="56" cy="56" r={r} strokeWidth="8" fill="none"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          className={`transition-all duration-700 ${cfg.color.replace("text-", "stroke-")}`}
          style={{ stroke: "currentColor" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-mono font-black ${cfg.color}`}>{grade}</span>
        <span className="text-xs text-[var(--fg-muted)]">{score}/100</span>
      </div>
    </div>
  );
}

export default function CreditEngine() {
  const { data: contributions, isLoading: cL } = useQuery({ queryKey: ["contributions"], queryFn: contributionsApi.list });
  const { data: groups,        isLoading: gL } = useQuery({ queryKey: ["groups"],        queryFn: groupsApi.list });
  const { data: profile,       isLoading: pL } = useQuery({ queryKey: ["profile"],       queryFn: userApi.getProfile });

  if (cL || gL || pL)
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-[var(--brand-light)] cc-spin" /></div>;

  const merchantScore = creditEngine.scoreMerchant(contributions || [], groups || []);
  const groupScores   = (groups || [])
    .filter(g => g.is_active)
    .map(g => creditEngine.scoreGroup(g, contributions || []))
    .sort((a, b) => b.score - a.score);

  const merchantCfg = GRADE_CFG[merchantScore.grade];

  return (
    <div className="space-y-8 max-w-[1440px] mx-auto pb-16">

      {/* Header */}
      <div className="cc-fade">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--brand-light)] mb-2 flex items-center gap-2">
          <span className="w-4 h-px bg-[var(--brand-light)]" /> Credit Engine
        </p>
        <h1 className="cc-h1 mb-1">Loan Eligibility</h1>
        <p className="text-sm text-[var(--fg-muted)]">
          AI-powered credit scoring based on your contribution history and group health.
        </p>
      </div>

      {/* My Credit Score */}
      <div className={`cc-card border ${merchantCfg.border} cc-fade cc-d1`}>
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <ScoreRing score={merchantScore.score} grade={merchantScore.grade} />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h2 className="cc-h3">Your Credit Score</h2>
              <span className={`cc-badge ${merchantCfg.bg} ${merchantCfg.color} border ${merchantCfg.border} font-bold`}>
                {merchantCfg.label}
              </span>
              {merchantScore.eligible ? (
                <span className="cc-badge cc-badge-success flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Loan Eligible
                </span>
              ) : (
                <span className="cc-badge cc-badge-danger flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> Not Eligible
                </span>
              )}
            </div>
            <p className="text-sm text-[var(--fg-muted)] mb-4">
              Hello <strong className="text-[var(--fg)]">{profile?.first_name}</strong> — based on your contribution history and group activity.
            </p>
            {merchantScore.eligible && (
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${merchantCfg.bg} border ${merchantCfg.border}`}>
                <Zap className={`w-4 h-4 ${merchantCfg.color}`} />
                <span className="text-sm font-mono font-bold text-[var(--fg)]">
                  Max Goods Loan: {formatKES(merchantScore.maxLoan)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Score breakdown */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {merchantScore.reasons.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--fg-muted)] mb-2 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" /> Positive Factors
              </p>
              <ul className="space-y-1.5">
                {merchantScore.reasons.map((r, i) => (
                  <li key={i} className="text-xs text-[var(--fg)] flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>{r}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {merchantScore.recommendations.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--fg-muted)] mb-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-400" /> How to Improve
              </p>
              <ul className="space-y-1.5">
                {merchantScore.recommendations.map((r, i) => (
                  <li key={i} className="text-xs text-[var(--fg)] flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">→</span>{r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <p className="mt-4 text-xs text-[var(--fg-muted)] flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5" />
          Scores are computed from your contribution history. Make more completed contributions to improve.
        </p>
      </div>

      {/* Group Credit Scores */}
      {groupScores.length > 0 && (
        <div className="cc-fade cc-d2">
          <h2 className="cc-h3 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-[var(--brand-light)]" />
            Group Credit Scores
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {groupScores.map((gs, i) => {
              const cfg = GRADE_CFG[gs.grade];
              return (
                <div key={gs.groupId} className={`cc-card hover-lift border ${cfg.border} cc-fade`} style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[var(--fg)] text-sm truncate">{gs.groupName}</h3>
                      <p className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center ${cfg.bg} border ${cfg.border} flex-shrink-0 ml-2`}>
                      <span className={`text-lg font-mono font-black ${cfg.color}`}>{gs.grade}</span>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--fg-muted)]">Credit score</span>
                      <span className="font-mono font-semibold">{gs.score}/100</span>
                    </div>
                    <div className="cc-progress">
                      <div className={`cc-progress-bar`} style={{ width: `${gs.score}%` }} />
                    </div>
                  </div>

                  {/* Loan info */}
                  <div className="space-y-1 text-xs">
                    {gs.eligible ? (
                      <div className="flex items-center gap-1.5 text-green-500 font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Max group loan: {formatKES(gs.maxGroupLoan)}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[var(--fg-muted)]">
                        <XCircle className="w-3.5 h-3.5" />
                        Not yet eligible
                      </div>
                    )}
                    {gs.fundingGap > 0 && (
                      <div className="flex items-center gap-1.5 text-amber-400">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Funding gap: {formatKES(gs.fundingGap)}
                      </div>
                    )}
                  </div>

                  {/* Top reason */}
                  {gs.reasons[0] && (
                    <p className="mt-2 text-xs text-[var(--fg-muted)] line-clamp-1">
                      {gs.reasons[0]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="cc-card cc-fade cc-d3">
        <h2 className="cc-h3 mb-4 flex items-center gap-2">
          <Star className="w-4 h-4 text-[var(--brand-light)]" />
          How Credit Scoring Works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { factor: "Contribution Consistency", weight: "30 pts", desc: "Number and regularity of contributions made." },
            { factor: "Payment Success Rate",      weight: "25 pts", desc: "Percentage of contributions that completed successfully." },
            { factor: "Total Amount Contributed",  weight: "20 pts", desc: "Cumulative KES amount contributed across all groups." },
            { factor: "Group Participation",        weight: "25 pts", desc: "Number of groups joined and whether they are active." },
          ].map(f => (
            <div key={f.factor} className="rounded-xl border border-[var(--border)] p-4 bg-[var(--bg-alt)]">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-[var(--fg)] leading-tight">{f.factor}</p>
                <span className="cc-badge cc-badge-brand text-[10px] flex-shrink-0 ml-1">{f.weight}</span>
              </div>
              <p className="text-xs text-[var(--fg-muted)]">{f.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-[var(--fg-muted)]">
          A score of <strong>50+</strong> is required for loan eligibility. Score of <strong>80+</strong> qualifies for Grade A (best terms).
          Goods loans are fulfilled directly by your linked wholesaler upon approval.
        </p>
      </div>
    </div>
  );
}