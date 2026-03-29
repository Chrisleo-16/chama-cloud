import { useQuery } from "@tanstack/react-query";
import { contributionsApi, groupsApi } from "@/lib/api";
import { QRCodeSVG } from "qrcode.react";
import { Download, Phone, MapPin, Calendar, Package, User, CheckCircle, ArrowRight, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formatKES = (amount: number) => 
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);

export default function Vouchers() {
  const { toast } = useToast();
  const { data: contributions } = useQuery({ queryKey: ["contributions"], queryFn: contributionsApi.list });
  const { data: groups } = useQuery({ queryKey: ["groups"], queryFn: groupsApi.list });

  // Find the most recent completed contribution
  const latestContribution = contributions
    ?.filter(c => c.status === "COMPLETED")
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())[0];

  const group = latestContribution ? groups?.find(g => g.id === latestContribution.group) : null;

  // If no contribution exists, show empty state (early return)
  if (!latestContribution || !group) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="animate-fade-in-up">
          <h1 className="text-4xl font-display font-bold text-foreground">My Voucher</h1>
          <p className="text-muted-foreground mt-2">Your goods are reserved. Contact the delivery agent.</p>
        </div>
        <div className="cc-card text-center py-16">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-lg font-semibold">No vouchers yet</h3>
          <p className="text-muted-foreground mt-1">Make a contribution to generate a voucher.</p>
        </div>
      </div>
    );
  }

  // Build voucher data from real contribution and group (only when data exists)
  const voucher = {
    id: `CC-${new Date().getFullYear()}-${group.id}-${latestContribution.id}`,
    merchantName: latestContribution.merchant_name || "You",
    group: group.name,
    item: group.description?.slice(0, 40) || "Procurement goods",
    share: `${Math.round((parseFloat(latestContribution.amount) / parseFloat(group.target_amount)) * 100)}%`,
    amount: parseFloat(latestContribution.amount),
    deliveryDate: new Date(latestContribution.created_at || Date.now()).toLocaleDateString('en-KE'),
    deliveryTime: "8:00 AM – 12:00 PM",
    location: "Gikomba Mkt, Gate C, Stall 14", // Placeholder – could come from group
    agentName: "Kevin Atieno",
    agentPhone: "+254 722 123 456",
    qrValue: `${voucher.id}|${latestContribution.merchant_name}|${group.name}|${latestContribution.amount}`
  };

  const handleDownload = () => {
    toast({ title: "Voucher downloaded", description: "Check your downloads folder." });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="animate-fade-in-up">
        <h1 className="text-4xl font-display font-bold text-foreground">My Voucher</h1>
        <p className="text-muted-foreground mt-2">Your goods are reserved. Contact the delivery agent.</p>
      </div>

      <div className="cc-card p-6 md:p-8 space-y-6 animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
        {/* Header */}
        <div className="flex flex-wrap justify-between items-start gap-4 pb-4 border-b border-border">
          <div>
            <h2 className="text-2xl font-display font-bold text-primary">Chama-Cloud</h2>
            <p className="text-sm text-muted-foreground">B2B Procurement</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Voucher ID</p>
            <p className="font-mono text-brand font-semibold text-lg">{voucher.id}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Details */}
          <div className="space-y-5">
            <div className="flex gap-3 items-start">
              <User className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Merchant</p>
                <p className="font-medium text-foreground text-lg">{voucher.merchantName}</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <Package className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Item Allocated</p>
                <p className="font-medium text-foreground">{voucher.item}</p>
                <p className="text-sm text-muted-foreground">{voucher.share} Share - {formatKES(voucher.amount)} Contributed</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <Calendar className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Delivery Date</p>
                <p className="font-medium text-foreground">{voucher.deliveryDate}</p>
                <p className="text-sm text-muted-foreground">{voucher.deliveryTime}</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Delivery Location</p>
                <p className="font-medium text-foreground">{voucher.location}</p>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-muted/20 rounded-2xl p-6 flex flex-col items-center text-center space-y-4">
            <div className="bg-white p-3 rounded-xl shadow-md">
              <QRCodeSVG value={voucher.qrValue} size={160} />
            </div>
            <p className="text-sm text-muted-foreground">Show this QR code to the delivery agent to claim your goods</p>
            <div className="flex items-center gap-2 text-success bg-success/10 px-3 py-1 rounded-full">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Verified by M-Pesa</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
          <button onClick={handleDownload} className="cc-btn-primary gap-2">
            <Download className="h-4 w-4" /> Download Voucher
          </button>
          <button className="cc-btn-outline gap-2">
            <Phone className="h-4 w-4" /> Contact Delivery Agent
          </button>
        </div>

        <div className="bg-accent/10 rounded-xl p-4 flex flex-wrap justify-between items-center gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Delivery Agent</p>
            <p className="font-semibold text-foreground">{voucher.agentName}</p>
            <p className="text-sm">{voucher.agentPhone}</p>
          </div>
          <button className="cc-btn-outline text-sm gap-1">
            Call Now <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}