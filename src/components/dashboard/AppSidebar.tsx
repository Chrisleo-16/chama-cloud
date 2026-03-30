import {
  LayoutDashboard,
  Users,
  Coins,
  CreditCard,
  Sprout,
  Ticket,
  Package,
  Store,
  ClipboardList,
  BitcoinIcon,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

// Define menu structure with role access
const menuItems = [
  {
    title: "Overview",
    url: "/dashboard",
    icon: LayoutDashboard,
    roles: ["MERCHANT", "WHOLESALER"],
  },
  {
    title: "Groups",
    url: "/dashboard/groups",
    icon: Users,
    roles: ["MERCHANT"],
  },
  {
    title: "Contributions",
    url: "/dashboard/contributions",
    icon: Coins,
    roles: ["MERCHANT"],
  },
  {
    title: "Inventory",
    url: "/dashboard/inventory",
    icon: Package,
    roles: ["WHOLESALER"],
  },
  {
    title: "Sales",
    url: "/dashboard/sales",
    icon: ClipboardList,
    roles: ["WHOLESALER"],
  },
  {
    title: "Merchants",
    url: "/dashboard/merchants",
    icon: Store,
    roles: ["WHOLESALER"],
  },
  {
    title: "Payments",
    url: "/dashboard/payments",
    icon: CreditCard,
    roles: ["MERCHANT", "WHOLESALER"],
  },
  {
    title: "Vouchers",
    url: "/dashboard/vouchers",
    icon: Ticket,
    roles: ["MERCHANT"],
  },
  {
    title: "Profiles",
    url: "/dashboard/profile",
    icon: Users,
    roles: ["MERCHANT", "WHOLESALER"],
  },
  {
    title: "Credit Engine",
    url: "/dashboard/credit",
    icon: BitcoinIcon,
    roles: ["MERCHANT", "WHOLESALER"],
  }
];

export function AppSidebar() {
  const { userRole, profile } = useAuth(); // profile usually contains the decoded token data
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";

  // DEBUG: Check your console to see what this says!
  console.log("Current Sidebar Role:", userRole);

  // Filter items. We'll add a fallback so you can at least see "Overview" while debugging.
  const filteredItems = menuItems.filter((item) => {
    // If userRole is missing, we check if the item is a 'common' item (Overview/Payments)
    if (!userRole) return item.url === "/dashboard";

    // Otherwise, check if the role (forced to uppercase) matches
    return item.roles.includes(userRole.toUpperCase());
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-1.5 rounded-lg">
            <Sprout className="h-6 w-6 text-primary shrink-0" />
          </div>
          {!collapsed && (
            <span className="font-display font-bold text-lg">Chama Cloud</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4">
            {/* If userRole is null, this will still show "Merchant Menu" */}
            {userRole === "WHOLESALER" ? "Wholesaler Menu" : "Merchant Menu"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                  >
                    <NavLink to={item.url} className="flex items-center w-full">
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <span className="ml-3 font-medium">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
