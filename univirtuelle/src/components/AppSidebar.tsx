import {
  LayoutDashboard, Users, BookOpen, FileText, BarChart3, Settings, Bell, Clock,
  LogOut, ChevronLeft, CalendarDays, CreditCard
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { title: "Tableau de bord", url: "/dashboard", icon: LayoutDashboard, roles: ["admin", "secretaire", "enseignant"] },
  { title: "Enseignants", url: "/enseignants", icon: Users, roles: ["admin", "secretaire"] },
  { title: "Cours", url: "/cours", icon: BookOpen, roles: ["admin", "secretaire"] },
  { title: "Mes cours", url: "/mes-cours", icon: BookOpen, roles: ["enseignant"] },
  { title: "Activités", url: "/activites", icon: FileText, roles: ["admin", "secretaire", "enseignant"] },
  { title: "Heures", url: "/heures", icon: Clock, roles: ["admin", "secretaire", "enseignant"] },
  { title: "Rapports", url: "/rapports", icon: BarChart3, roles: ["admin", "secretaire", "enseignant"] },
  { title: "Notifications", url: "/notifications", icon: Bell, roles: ["admin", "secretaire", "enseignant"] },
  { title: "Paiements", url: "/paiements", icon: CreditCard, roles: ["admin", "secretaire"] },
  { title: "Années académiques", url: "/annees-academiques", icon: CalendarDays, roles: ["admin"] },
  { title: "Paramètres", url: "/parametres", icon: Settings, roles: ["admin"] },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";

  const filteredItems = navItems.filter((item) => user && item.roles.includes(user.role));

  const roleLabel = user?.role === "admin" ? "Administrateur" : user?.role === "secretaire" ? "Secrétaire" : "Enseignant";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="bg-sidebar">
        <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
          <img
            src="/logo-uvci.png"
            alt="UVCI"
            className="h-9 w-9 shrink-0 rounded-lg object-contain bg-sidebar-primary p-0.5"
          />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sidebar-primary-foreground truncate">UniVirtuelle</p>
              <p className="text-xs text-sidebar-muted truncate">Gestion des heures</p>
            </div>
          )}
          {!collapsed && (
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-7 w-7 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-muted text-xs uppercase tracking-wider px-4">
            {!collapsed && "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-sidebar border-t border-sidebar-border p-3">
        {!collapsed && (
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="h-8 w-8 rounded-full bg-sidebar-primary flex items-center justify-center text-xs font-semibold text-sidebar-primary-foreground">
              {user?.email?.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.email}</p>
              <p className="text-xs text-sidebar-muted truncate">{roleLabel}</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 text-sidebar-muted hover:text-destructive hover:bg-sidebar-accent"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="text-sm">Déconnexion</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
