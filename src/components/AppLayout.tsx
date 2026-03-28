import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useLocation } from "react-router-dom";

interface AppLayoutProps { children: React.ReactNode; }

const STANDALONE_PATHS = ["/", "/login", "/register", "/admin/login", "/admin/signup"];
const STANDALONE_PREFIXES = ["/profile/", "/shortlist/", "/auth/", "/admin/", "/manager/"];

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const isStandalone =
    STANDALONE_PATHS.includes(location.pathname) ||
    STANDALONE_PREFIXES.some(p => location.pathname.startsWith(p));

  if (isStandalone) return <>{children}</>;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center px-4 sm:px-6 border-b border-border glass-surface sticky top-0 z-10 gap-3">
            <SidebarTrigger className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors shrink-0" />
            <div className="flex-1 min-w-0 sm:hidden">
              <p className="font-display text-base font-bold tracking-tight text-foreground">TAARA</p>
            </div>
          </header>
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
