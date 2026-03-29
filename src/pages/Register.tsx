import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError, getUserFromToken } from "@/lib/api";
import { Loader2, Phone, Lock, User, Sprout, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Role = "MERCHANT" | "WHOLESALER";

export default function Register() {
  const [form, setForm] = useState({
    phone_number: "",
    first_name: "",
    last_name: "",
    password: "",
    role: "MERCHANT" as Role,
    business_name: "",
    mpesa_shortcode: "",
    shortcode_type: "" as "" | "PAYBILL" | "TILL",
  });
  
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const update = (field: string, value: string) => 
    setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Logic: Clean the data so we don't send Wholesaler info for Merchants
      const registrationData = {
        phone_number: form.phone_number.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        password: form.password,
        role: form.role,
        ...(form.role === "WHOLESALER" && {
          business_name: form.business_name.trim(),
          mpesa_shortcode: form.mpesa_shortcode.trim(),
          shortcode_type: form.shortcode_type,
        }),
      };

      // 2. Validation: Basic Kenyan Phone check (starts with 254 or 07/01)
      if (!/^(?:254|\+254|0)?(7|1)\d{8}$/.test(registrationData.phone_number)) {
        throw new Error("Please enter a valid Kenyan phone number.");
      }

      const resp = await register(registrationData);
      
      toast({ title: "Account created!", description: "Welcome to Chama Cloud" });
      
      // Prefer token / response role from signup from backend, else form role fallback
      const user = getUserFromToken();
      const role = user?.role || (resp as any)?.role || form.role;
      const destination = role === "WHOLESALER" ? "/wholesaler" : "/dashboard";
      navigate(destination, { replace: true });
      
    } catch (err: any) {
      const message = err instanceof ApiError 
        ? err.message 
        : err.message || "Something went wrong.";
        
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
                  <Label htmlFor="first_name">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="first_name"
                      placeholder="Jane" 
                      value={form.first_name} 
                      onChange={(e) => update("first_name", e.target.value)} 
                      className="pl-10" 
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input 
                    id="last_name"
                    placeholder="Mwangi" 
                    value={form.last_name} 
                    onChange={(e) => update("last_name", e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="phone"
                    placeholder="2547XXXXXXXX" 
                    value={form.phone_number} 
                    onChange={(e) => update("phone_number", e.target.value)} 
                    className="pl-10" 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password"
                    type="password" 
                    placeholder="••••••••" 
                    value={form.password} 
                    onChange={(e) => update("password", e.target.value)} 
                    className="pl-10" 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Account Type</Label>
                <Select value={form.role} onValueChange={(v: Role) => update("role", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MERCHANT">Merchant (Retailer)</SelectItem>
                    <SelectItem value="WHOLESALER">Wholesaler (Supplier)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.role === "WHOLESALER" && (
                <div className="space-y-4 pt-2 border-t border-dashed">
                  <div className="space-y-2">
                    <Label htmlFor="business_name">Business Name</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="business_name"
                        placeholder="e.g. Mwangi Wholesale Ltd" 
                        value={form.business_name} 
                        onChange={(e) => update("business_name", e.target.value)} 
                        className="pl-10" 
                        required={form.role === "WHOLESALER"}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="shortcode">M-Pesa Shortcode</Label>
                      <Input 
                        id="shortcode"
                        placeholder="123456" 
                        value={form.mpesa_shortcode} 
                        onChange={(e) => update("mpesa_shortcode", e.target.value)} 
                        required={form.role === "WHOLESALER"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select 
                        value={form.shortcode_type} 
                        onValueChange={(v) => update("shortcode_type", v)}
                        required={form.role === "WHOLESALER"}
                      >
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PAYBILL">Paybill</SelectItem>
                          <SelectItem value="TILL">Till Number</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full mt-4" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
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