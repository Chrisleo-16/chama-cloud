import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRight, Wallet, Clock, ShieldCheck } from "lucide-react";

export default function Refund() {
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      toast({ title: "Refund processed", description: `KES ${amount} sent to ${phone}` });
      setTransactionId(`MPR-2026-${Math.floor(Math.random() * 10000)}`);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Refund</h1>
        <p className="text-muted-foreground mt-1">Process B2C refunds via M-Pesa</p>
      </div>

      <Card className="border-border cc-card">
        <CardHeader>
          <CardTitle className="font-display">Transaction Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>M-Pesa Number</Label>
              <Input placeholder="2547XXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div>
              <Label>Amount (KES)</Label>
              <Input type="number" min="1" placeholder="1500" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <Button type="submit" className="cc-btn-primary w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Process Refund
            </Button>
          </form>

          {transactionId && (
            <div className="mt-6 p-4 bg-brand-tint rounded-xl space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-fg-2">Amount Refunded:</span>
                <span className="font-mono font-bold text-foreground">KES {amount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-fg-2">M-Pesa Number:</span>
                <span className="font-mono">{phone.replace(/(\d{4})\d+(\d{3})/, '$1****$2')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-fg-2">Transaction ID:</span>
                <span className="font-mono text-brand">{transactionId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-fg-2">Estimated Arrival:</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Within 5 minutes</span>
              </div>
            </div>
          )}

          <div className="text-center text-xs text-fg-2 pt-4 border-t border-border">
            <p className="flex items-center justify-center gap-2"><ShieldCheck className="h-4 w-4 text-brand" /> Processed via M-Pesa B2C Transfer</p>
            <p className="mt-2">Your money's safety is our priority. All refunds are processed securely through M-Pesa.</p>
            <div className="flex justify-center gap-4 mt-4">
              <button className="cc-btn-outline text-sm">Join Another Chama →</button>
              <button className="cc-btn-primary text-sm">View Wallet</button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}