import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useLocation } from "react-router-dom";

interface AppLayoutProps {
  children: React.ReactNode;
}

// These paths show NO sidebar — fully standalone, never show manager dashboard
// /register is always standalone — actors filling the form must NEVER see the manager sidebar
const STANDALONE_PATHS = ["/login", "/register"];
const STANDALONE_PREFIXES = ["/profile/", "/shortlist/"];

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();

  const isStandalone =
    STANDALONE_PATHS.includes(location.pathname) ||
    STANDALONE_PREFIXES.some((p) => location.pathname.startsWith(p));

  if (isStandalone) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center px-6 border-b border-border glass-surface sticky top-0 z-10">
            <SidebarTrigger className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors" />
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
