import { useQuery } from "@tanstack/react-query";
import { groupsApi, contributionsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, Target, Clock, Wallet, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const { data: groups } = useQuery({ queryKey: ["groups"], queryFn: groupsApi.list });
  const { data: contributions } = useQuery({ queryKey: ["contributions"], queryFn: contributionsApi.list });

  const totalMembers = groups?.reduce((acc, g) => acc + (g.members_count || 0), 0) ?? 0;
  const totalFunded = groups?.reduce((acc, g) => acc + parseFloat(g.current_amount || "0"), 0) ?? 0;
  const totalTarget = groups?.reduce((acc, g) => acc + parseFloat(g.target_amount), 0) ?? 0;
  const fundedPercent = totalTarget > 0 ? (totalFunded / totalTarget) * 100 : 0;

  const stats = [
    { label: "Members", value: totalMembers, icon: Users, color: "text-brand" },
    { label: "Active Groups", value: groups?.length ?? 0, icon: Target, color: "text-accent" },
    { label: "Funded", value: `${fundedPercent.toFixed(0)}%`, icon: TrendingUp, color: "text-brand" },
    { label: "Total Collected", value: `KES ${totalFunded.toLocaleString()}`, icon: Wallet, color: "text-accent" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Admin Panel</h1>
        <p className="text-muted-foreground">Manage wholesalers, groups, and procurement</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s) => (
          <div key={s.label} className="cc-card p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-fg-2">{s.label}</p>
                <p className="text-2xl font-mono font-bold text-foreground mt-1">{s.value}</p>
              </div>
              <div className="bg-brand-tint p-2 rounded-full">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Procurement Goal form – similar to the image */}
      <div className="cc-card p-6 space-y-4">
        <h2 className="font-display text-xl font-semibold">Set Procurement Goal</h2>
        <form className="space-y-4">
          <div>
            <label className="cc-label">Goal Name</label>
            <input type="text" className="cc-input" placeholder="e.g., Onion Bulk Buy March" />
          </div>
          <div>
            <label className="cc-label">Target Amount (KES)</label>
            <input type="number" className="cc-input" placeholder="50000" />
          </div>
          <div>
            <label className="cc-label">Select Wholesaler</label>
            <select className="cc-select">
              <option>Select a verified supplier...</option>
            </select>
          </div>
          <div>
            <label className="cc-label">Deadline Date</label>
            <input type="date" className="cc-input" />
          </div>
          <div className="flex gap-3">
            <button className="cc-btn-primary">Publish Goal</button>
            <button className="cc-btn-outline">Cancel Goal</button>
          </div>
        </form>
      </div>

      {/* Member Activity Feed – placeholder */}
      <div className="cc-card p-6">
        <h2 className="font-display text-xl font-semibold mb-4">Member Activity Feed</h2>
        <div className="space-y-3">
          {["Mary Njoki", "Peter Otieno", "Fatuma Said", "Agnes Kamau"].map((name, idx) => (
            <div key={idx} className="flex items-center gap-3 p-2 border-b border-border">
              <div className="w-8 h-8 rounded-full bg-brand-tint flex items-center justify-center text-brand font-bold">
                {name.split(' ').map(n => n[0]).join('')}
              </div>
              <span className="text-foreground">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}