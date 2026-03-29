import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api";
import { Loader2, Phone, Lock, User, Sprout, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const [form, setForm] = useState({
    phone_number: "",
    first_name: "",
    last_name: "",
    password: "",
    role: "MERCHANT" as "MERCHANT" | "WHOLESALER",
    business_name: "",
    mpesa_shortcode: "",
    shortcode_type: "" as "" | "PAYBILL" | "TILL",
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast({ title: "Account created!", description: "Welcome to Chama Cloud" });
      navigate("/dashboard");
    } catch (err) {
      const message = err instanceof ApiError
        ? "Registration failed. Check your details."
        : "Something went wrong.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <Sprout className="h-8 w-8 text-primary" />
            <span className="text-2xl font-display font-bold text-foreground">Chama Cloud</span>
          </Link>
        </div>

        <Card className="border-border shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-2xl">Create your account</CardTitle>
            <CardDescription>Join Chama Cloud in seconds</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Jane" value={form.first_name} onChange={(e) => update("first_name", e.target.value)} className="pl-10" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input placeholder="Mwangi" value={form.last_name} onChange={(e) => update("last_name", e.target.value)} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="2547XXXXXXXX" value={form.phone_number} onChange={(e) => update("phone_number", e.target.value)} className="pl-10" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="password" placeholder="••••••••" value={form.password} onChange={(e) => update("password", e.target.value)} className="pl-10" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => update("role", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MERCHANT">Merchant</SelectItem>
                    <SelectItem value="WHOLESALER">Wholesaler</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.role === "WHOLESALER" && (
                <>
                  <div className="space-y-2">
                    <Label>Business Name</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Your business" value={form.business_name} onChange={(e) => update("business_name", e.target.value)} className="pl-10" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>M-Pesa Shortcode</Label>
                      <Input placeholder="123456" value={form.mpesa_shortcode} onChange={(e) => update("mpesa_shortcode", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Shortcode Type</Label>
                      <Select value={form.shortcode_type} onValueChange={(v) => update("shortcode_type", v)}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PAYBILL">Paybill</SelectItem>
                          <SelectItem value="TILL">Till Number</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              <Button type="submit" className="w-full cc-btn-primary" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Create account
              </Button>
            </form>

            <p className="text-sm text-center text-muted-foreground mt-6">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
