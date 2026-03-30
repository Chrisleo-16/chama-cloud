"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { wholesalersApi, groupsApi } from "@/lib/api";
import { Loader2, Search, Star, CheckCircle, Package, Users, Phone, Building } from "lucide-react";

// Goods categories for display — derived from groups linked to each wholesaler
// since backend doesn't have a categories field yet
const CATEGORY_MAP: Record<string, string> = {
  "grain":   "Grains & Cereals",
  "vegetable": "Vegetables",
  "fruit":   "Fruits",
  "oil":     "Cooking Oil",
  "flour":   "Flour & Baking",
  "sugar":   "Sugar & Sweeteners",
  "rice":    "Rice & Pasta",
  "beans":   "Beans & Pulses",
  "maize":   "Maize & Feeds",
};

function inferCategories(business_name: string, groups: string[]): string {
  const text = `${business_name} ${groups.join(" ")}`.toLowerCase();
  const found = Object.entries(CATEGORY_MAP)
    .filter(([key]) => text.includes(key))
    .map(([, val]) => val);
  return found.length > 0 ? found.slice(0, 3).join(" · ") : "General Goods";
}

export default function Wholesalers() {
  const [search, setSearch] = useState("");

  const { data: wholesalers, isLoading: wL } = useQuery({
    queryKey: ["wholesalers"], queryFn: wholesalersApi.list,
  });
  const { data: groups } = useQuery({
    queryKey: ["groups"], queryFn: groupsApi.list,
  });

  if (wL)
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-[var(--brand-light)] cc-spin" /></div>;

  const filtered = (wholesalers || []).filter(w => {
    const name = `${w.business_name || ""} ${w.first_name} ${w.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-16">
      <div className="cc-fade">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--brand-light)] mb-2 flex items-center gap-2">
          <span className="w-4 h-px bg-[var(--brand-light)]" /> Verified Suppliers
        </p>
        <h1 className="cc-h1 mb-1">Wholesalers</h1>
        <p className="text-sm text-[var(--fg-muted)]">All verified suppliers on ChamaCloud</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md cc-fade cc-d1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fg-muted)]" />
        <input placeholder="Search wholesalers…" value={search} onChange={e => setSearch(e.target.value)} className="cc-input pl-10" />
      </div>

      <p className="text-sm text-[var(--fg-muted)] cc-fade cc-d1">{filtered.length} supplier{filtered.length !== 1 ? "s" : ""} available</p>

      {filtered.length === 0 ? (
        <div className="cc-card flex flex-col items-center py-16 gap-3 text-center cc-fade">
          <Building className="w-8 h-8 text-[var(--fg-muted)]" />
          <p className="font-semibold text-[var(--fg)]">No wholesalers found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((w, i) => {
            // Groups linked to this wholesaler
            const linkedGroups = (groups || []).filter(g => g.wholesaler === w.id);
            const groupNames   = linkedGroups.map(g => g.name);
            const categories   = inferCategories(w.business_name || "", groupNames);
            const initials     = (w.business_name || `${w.first_name} ${w.last_name}`).slice(0, 2).toUpperCase();

            return (
              <div key={w.id} className="cc-card hover-lift cc-fade" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3 items-start">
                    <div className="w-12 h-12 rounded-xl bg-[var(--brand-tint)] border border-[var(--brand-border)] flex items-center justify-center text-[var(--brand-light)] font-bold text-lg flex-shrink-0">
                      {initials}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--fg)]">
                        {w.business_name || `${w.first_name} ${w.last_name}`}
                      </h3>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <span className="cc-badge cc-badge-success flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Verified
                        </span>
                        {w.is_verified_wholesaler && (
                          <span className="cc-badge cc-badge-brand flex items-center gap-1">
                            <Star className="w-3 h-3" /> Top Supplier
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Categories */}
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-3.5 h-3.5 text-[var(--fg-muted)] flex-shrink-0" />
                  <p className="text-xs text-[var(--fg-muted)]">{categories}</p>
                </div>

                {/* Contact */}
                {w.phone_number && (
                  <div className="flex items-center gap-2 mb-3">
                    <Phone className="w-3.5 h-3.5 text-[var(--fg-muted)] flex-shrink-0" />
                    <p className="text-xs font-mono text-[var(--fg-muted)]">{w.phone_number}</p>
                  </div>
                )}

                {/* Linked groups */}
                {linkedGroups.length > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-3.5 h-3.5 text-[var(--fg-muted)] flex-shrink-0" />
                    <p className="text-xs text-[var(--fg-muted)]">
                      {linkedGroups.length} group{linkedGroups.length !== 1 ? "s" : ""} linked:{" "}
                      {groupNames.slice(0, 2).join(", ")}{groupNames.length > 2 ? ` +${groupNames.length - 2} more` : ""}
                    </p>
                  </div>
                )}

                <button className="cc-btn-primary w-full text-sm">Select Supplier</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}