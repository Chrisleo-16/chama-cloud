import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { groupsApi } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Truck, Phone, Building, Search } from "lucide-react";

// Mock wholesalers data – replace with API call
const mockWholesalers = [
  { id: 1, name: "Twiga Foods", initials: "TF", verified: true, topSupplier: true, categories: "Vegetables | Fruits | Grains", rating: 4.8, reviews: 342, delivery: "Same Day", contact: "Toll: 891234" },
  { id: 2, name: "Jumia Food", initials: "JF", verified: true, topSupplier: false, categories: "Grains | Pulses | Oil", rating: 4.5, reviews: 218, delivery: "Next Day", contact: "Paybill: 247247" },
  { id: 3, name: "Mkulima Young", initials: "MY", verified: true, topSupplier: false, categories: "Vegetables | Herbs", rating: 4.6, reviews: 156, delivery: "2-3 Days", contact: "Toll: 567890" },
  { id: 4, name: "Kakuzi Ltd", initials: "KL", verified: true, topSupplier: true, categories: "Avocados | Macadamia", rating: 4.9, reviews: 89, delivery: "1-2 Days", contact: "Paybill: 300300" },
  { id: 5, name: "Soko Fresh", initials: "SF", verified: true, topSupplier: false, categories: "Fruits | Vegetables", rating: 4.3, reviews: 74, delivery: "Same Day", contact: "Toll: 445566" },
];

export default function Wholesalers() {
  const [search, setSearch] = useState("");

  const filtered = mockWholesalers.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Choose a Verified Supplier</h1>
        <p className="text-muted-foreground mt-1">All suppliers are verified by Chama-Cloud</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-2" />
        <Input
          placeholder="Search wholesalers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm text-fg-2">{filtered.length} suppliers available</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((w) => (
          <Card key={w.id} className="border-border cc-card">
            <CardContent className="p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-full bg-brand-tint flex items-center justify-center text-brand font-bold text-lg">
                    {w.initials}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{w.name}</h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="cc-badge cc-badge-success">Verified</span>
                      {w.topSupplier && <span className="cc-badge cc-badge-accent">Top Supplier</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-sm font-medium">{w.rating}</span>
                  <span className="text-xs text-fg-2">({w.reviews} reviews)</span>
                </div>
              </div>

              <p className="text-sm text-fg-2">{w.categories}</p>
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> {w.delivery}</span>
                <span className="font-mono text-brand">{w.contact}</span>
              </div>

              <button className="cc-btn-primary w-full mt-2">Select Supplier</button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}