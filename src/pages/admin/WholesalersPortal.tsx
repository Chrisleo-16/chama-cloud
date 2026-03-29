import { useQuery } from "@tanstack/react-query";
import { groupsApi, contributionsApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Target, Clock, Wallet, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function WholesalerPortal() {
  const { data: groups } = useQuery({ queryKey: ["groups"], queryFn: groupsApi.list });
  const { data: contributions } = useQuery({ queryKey: ["contributions"], queryFn: contributionsApi.list });
  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [wholesaler, setWholesaler] = useState("");
  const [deadline, setDeadline] = useState("");
  const { toast } = useToast();

  const totalMembers = groups?.reduce((acc, g) => acc + (g.members_count || 0), 0) ?? 0;
  const totalFunded = groups?.reduce((acc, g) => acc + parseFloat(g.current_amount || "0"), 0) ?? 0;
  const totalTarget = groups?.reduce((acc, g) => acc + parseFloat(g.target_amount), 0) ?? 0;
  const fundedPercent = totalTarget > 0 ? (totalFunded / totalTarget) * 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Procurement goal published", description: `${goalName} - KES ${targetAmount}` });
    setGoalName("");
    setTargetAmount("");
    setWholesaler("");
    setDeadline("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Admin Panel</h1>
        <p className="text-muted-foreground mt-1">Manage groups, procurement, and members</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="cc-card p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-fg-2">Members</p>
              <p className="text-2xl font-mono font-bold text-foreground mt-1">{totalMembers}</p>
            </div>
            <Users className="h-5 w-5 text-brand" />
          </div>
        </div>
        <div className="cc-card p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-fg-2">Funded</p>
              <p className="text-2xl font-mono font-bold text-foreground mt-1">{fundedPercent.toFixed(0)}%</p>
            </div>
            <Target className="h-5 w-5 text-accent" />
          </div>
        </div>
        <div className="cc-card p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-fg-2">Days Left</p>
              <p className="text-2xl font-mono font-bold text-foreground mt-1">2</p>
            </div>
            <Clock className="h-5 w-5 text-brand" />
          </div>
        </div>
        <div className="cc-card p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-fg-2">Total Collected</p>
              <p className="text-2xl font-mono font-bold text-foreground mt-1">KES {totalFunded.toLocaleString()}</p>
            </div>
            <Wallet className="h-5 w-5 text-accent" />
          </div>
        </div>
      </div>

      {/* Procurement Goal Form */}
      <div className="cc-card p-6 space-y-4">
        <h2 className="font-display text-xl font-semibold">Set Procurement Goal</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="cc-label">Goal Name</label>
            <input
              type="text"
              className="cc-input"
              placeholder="e.g., Onion Bulk Buy March"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="cc-label">Target Amount (KES)</label>
            <input
              type="number"
              className="cc-input"
              placeholder="50000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="cc-label">Select Wholesaler</label>
            <Select value={wholesaler} onValueChange={setWholesaler}>
              <SelectTrigger><SelectValue placeholder="Select a verified supplier..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="twiga">Twiga Foods</SelectItem>
                <SelectItem value="jumia">Jumia Food</SelectItem>
                <SelectItem value="mkulima">Mkulima Young</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="cc-label">Deadline Date</label>
            <input
              type="date"
              className="cc-input"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit" className="cc-btn-primary">Publish Goal</Button>
            <Button type="button" className="cc-btn-outline" onClick={() => {
              setGoalName("");
              setTargetAmount("");
              setWholesaler("");
              setDeadline("");
            }}>Cancel Goal</Button>
          </div>
        </form>
      </div>

      {/* Member Activity Feed */}
      <div className="cc-card p-6">
        <h2 className="font-display text-xl font-semibold mb-4">Member Activity Feed</h2>
        <div className="space-y-3">
          {["Mary Njoki", "Peter Otieno", "Fatuma Said", "Agnes Kamau", "James Mwangi"].map((name, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-tint flex items-center justify-center text-brand font-bold">
                  {name.split(' ').map(n => n[0]).join('')}
                </div>
                <span className="text-foreground">{name}</span>
              </div>
              <span className="text-xs text-fg-2">+KES {[1500, 2000, 800, 3000, 1200][idx]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}