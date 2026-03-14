import { LayoutDashboard, Users, LogOut, ListChecks, Calendar } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

const mainNav = [
  { title: "Home", url: "/dashboard", icon: LayoutDashboard },
  { title: "Roster", url: "/roster", icon: Users },
  { title: "Shortlists", url: "/shortlists", icon: ListChecks },
  { title: "Calendar", url: "/calendar", icon: Calendar },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <div className="px-4 py-6">
        {!collapsed ? (
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-glow">
              <span className="font-display text-primary-foreground text-sm font-bold">T</span>
            </div>
            <div>
              <h1 className="font-display text-lg font-extrabold tracking-tight text-foreground">TAARA</h1>
              <p className="text-[10px] text-muted-foreground font-body -mt-0.5">Talent Management</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-glow">
              <span className="font-display text-primary-foreground text-sm font-bold">T</span>
            </div>
          </div>
        )}
      </div>
      <SidebarContent>
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] text-muted-foreground/60 uppercase tracking-[0.12em] font-body font-medium px-5 mb-2">
              Manage
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-body text-[13px] text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm"
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
                      {!collapsed && <span className="font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3 border-t border-sidebar-border">
        {!collapsed && user && (
          <div className="px-3 py-2 mb-1">
            <p className="text-[12px] font-body font-medium text-foreground truncate">{user.user_metadata?.full_name || user.email}</p>
            <p className="text-[10px] text-muted-foreground font-body truncate">{user.email}</p>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 text-muted-foreground hover:text-foreground text-[13px] font-body font-medium w-full px-3 py-2.5 rounded-xl hover:bg-sidebar-accent transition-all duration-200"
              >
                <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
                {!collapsed && <span>Log Out</span>}
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
