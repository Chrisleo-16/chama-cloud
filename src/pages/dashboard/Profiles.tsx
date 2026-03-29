import { useQuery } from "@tanstack/react-query";
import { userApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, User, Phone, Briefcase, Shield, LogOut } from "lucide-react";

export default function Profile() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: userApi.getProfile,
  });
  const { logout } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-4xl font-display font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground mt-2">Your account information</p>
      </div>

      <Card className="cc-card">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Personal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-border">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="font-medium text-foreground">
                {profile?.first_name} {profile?.last_name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pb-3 border-b border-border">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone Number</p>
              <p className="font-mono text-foreground">{profile?.phone_number}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 pb-3 border-b border-border">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="font-medium text-foreground">
                {profile?.role === "WHOLESALER" ? "Wholesaler" : "Merchant"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Account Status</p>
              <p className="font-medium text-success">Active</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={logout} className="cc-btn-outline w-full gap-2">
        <LogOut className="h-4 w-4" /> Sign Out
      </Button>
    </div>
  );
}