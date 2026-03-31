"use client";

import { useQuery } from "@tanstack/react-query";
import { vouchersApi } from "@/lib/api";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, Download, Package, CheckCircle, AlertCircle, Clock, TicketCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const formatKES = (n: number | string) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 })
    .format(typeof n === "string" ? parseFloat(n) : n);

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-KE", { dateStyle: "medium" }) : "—";

export default function Vouchers() {
  const { toast } = useToast();
  const { profile, loading: authLoading } = useAuth();

  const { data: vouchers, isLoading } = useQuery({
    queryKey: ["merchant-vouchers"],
    queryFn: vouchersApi.list,
  });

  // Filter vouchers to show only user's vouchers
  const myVouchers = (vouchers || []).filter((v) => {
    if (!profile) return false;
    // Filter by user name in wholesaler_name or group association
    const userName = profile.first_name?.trim().toLowerCase() || "";
    const wholesalerName = v.wholesaler_name?.toLowerCase() || "";
    const groupName = v.group_name?.toLowerCase() || "";
    
    return wholesalerName.includes(userName) || groupName.includes(userName);
  });

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[var(--brand-light)] cc-spin" />
      </div>
    );

  if (!myVouchers || myVouchers.length === 0)
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="cc-fade">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--brand-light)] mb-2 flex items-center gap-2">
            <span className="w-4 h-px bg-[var(--brand-light)]" /> My Vouchers
          </p>
          <h1 className="cc-h1 mb-1">Vouchers</h1>
          <p className="text-sm text-[var(--fg-muted)]">Your goods redemption vouchers from completed group purchases.</p>
        </div>
        <div className="cc-card flex flex-col items-center py-20 gap-4 text-center cc-fade">
          <div className="w-14 h-14 rounded-2xl bg-[var(--bg-alt)] flex items-center justify-center">
            <TicketCheck className="w-6 h-6 text-[var(--fg-muted)]" />
          </div>
          <p className="font-semibold text-[var(--fg)]">No vouchers yet</p>
          <p className="text-sm text-[var(--fg-muted)]">
            Vouchers are generated when your group completes a funded procurement. Keep contributing!
          </p>
        </div>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="cc-fade">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--brand-light)] mb-2 flex items-center gap-2">
          <span className="w-4 h-px bg-[var(--brand-light)]" /> My Vouchers
        </p>
        <h1 className="cc-h1 mb-1">Vouchers</h1>
        <p className="text-sm text-[var(--fg-muted)]">
          Show the QR code to your wholesaler to claim your goods.
        </p>
      </div>

      {/* Voucher cards */}
      <div className="space-y-6">
        {myVouchers.map((v, idx) => (
          <div key={v.id} className="cc-card cc-fade" style={{ animationDelay: `${idx * 80}ms` }}>

            {/* Voucher header */}
            <div className="flex flex-wrap justify-between items-start gap-4 pb-4 border-b border-[var(--border)]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-bold text-[var(--fg)] text-lg">{v.group_name}</h2>
                  {v.is_claimed ? (
                    <span className="cc-badge cc-badge-success flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Claimed
                    </span>
                  ) : (
                    <span className="cc-badge cc-badge-warning flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Pending Claim
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--fg-muted)] font-mono">{v.id}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[var(--fg-muted)]">Amount Paid</p>
                <p className="font-mono font-bold text-[var(--brand-light)] text-xl">{formatKES(v.amount_paid)}</p>
              </div>
            </div>

            {/* Body */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              {/* Details */}
              <div className="space-y-4">
                <div className="flex gap-3 items-start">
                  <Package className="w-4 h-4 text-[var(--fg-muted)] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-[var(--fg-muted)]">Wholesaler</p>
                    <p className="font-medium text-[var(--fg)]">{v.wholesaler_name}</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <Clock className="w-4 h-4 text-[var(--fg-muted)] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-[var(--fg-muted)]">Issued</p>
                    <p className="font-medium text-[var(--fg)]">{fmtDate(v.created_at)}</p>
                  </div>
                </div>
                {v.is_claimed && v.claimed_at && (
                  <div className="flex gap-3 items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-[var(--fg-muted)]">Claimed</p>
                      <p className="font-medium text-[var(--fg)]">{fmtDate(v.claimed_at)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center gap-3 bg-[var(--bg-alt)] rounded-2xl p-6">
                {!v.is_claimed ? (
                  <>
                    <div className="bg-white p-3 rounded-xl shadow-md">
                      <QRCodeSVG value={`${v.id}|${v.group_name}|${v.wholesaler_name}|${v.amount_paid}`} size={140} />
                    </div>
                    <p className="text-xs text-[var(--fg-muted)] text-center">Show to wholesaler to claim goods</p>
                    <div className="flex items-center gap-1.5 text-green-500 text-xs font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" /> Verified Payment
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <CheckCircle className="w-12 h-12 text-green-500" />
                    <p className="text-sm font-semibold text-[var(--fg)]">Goods Collected</p>
                    <p className="text-xs text-[var(--fg-muted)]">Claimed on {fmtDate(v.claimed_at)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            {!v.is_claimed && (
              <div className="mt-4 pt-4 border-t border-[var(--border)] flex justify-between items-center gap-3 flex-wrap">
                <p className="text-xs text-[var(--fg-muted)] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Present this voucher at the wholesaler's delivery point.
                </p>
                <button
                  onClick={() => toast({ title: "Download coming soon", description: "PDF export will be available shortly." })}
                  className="cc-btn-ghost text-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}