import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { AuthProvider } from "@/modules/auth/hooks/useAuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { useAdminStore } from "@/stores/adminStore";
import { lazy, Suspense, useEffect } from "react";

const LandingPage    = lazy(() => import("./pages/LandingPage"));
const AdminAuthPage  = lazy(() => import("./pages/admin/AdminAuthPage"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const LoginPage      = lazy(() => import("@/modules/auth/components/LoginPage"));
const ManagerProfileLazy = lazy(() =>
  import("@/modules/manager/components/ManagerProfilePage").then(m => ({ default: m.ManagerProfilePage }))
);
const Dashboard         = lazy(() => import("./pages/Dashboard"));
const Roster            = lazy(() => import("./pages/Roster"));
const ActorProfile      = lazy(() => import("./pages/ActorProfile"));
const AddTalent         = lazy(() => import("./pages/AddTalent"));
const ActorRegistration = lazy(() => import("./pages/ActorRegistration"));
const ShortlistsPage    = lazy(() => import("./pages/ShortlistsPage"));
const PublicShortlist   = lazy(() => import("./pages/PublicShortlist"));
const PublicProfile     = lazy(() => import("./pages/PublicProfile"));
const CalendarPage      = lazy(() => import("./pages/CalendarPage"));
const NotFound          = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000*60*5, gcTime: 1000*60*10, retry: 1, refetchOnWindowFocus: false },
  },
});

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center animate-pulse">
      <span className="font-display text-primary-foreground text-sm font-bold">T</span>
    </div>
  </div>
);

// Only initialize admin store on admin routes — NOT on manager pages
function AdminStoreInit() {
  const location = useLocation();
  const { initialized, initialize } = useAdminStore();
  const isAdminRoute = location.pathname.startsWith("/admin");

  useEffect(() => {
    if (isAdminRoute && !initialized) initialize();
  }, [isAdminRoute, initialized, initialize]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster /><Sonner />
        <BrowserRouter>
          <AdminStoreInit />
          <AppLayout>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Landing */}
                <Route path="/" element={<LandingPage />} />

                {/* Admin auth */}
                <Route path="/admin/login"  element={<AdminAuthPage mode="login" />} />
                <Route path="/admin/signup" element={<AdminAuthPage mode="signup" />} />

                {/* Admin protected */}
                <Route path="/admin/dashboard" element={
                  <AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>
                } />

                {/* Manager login only */}
                <Route path="/manager/login"       element={<LoginPage />} />
                <Route path="/login"               element={<LoginPage />} />
                <Route path="/auth/verify"         element={<LoginPage />} />
                <Route path="/auth/reset-password" element={<LoginPage />} />

                {/* Public */}
                <Route path="/profile/:slug"   element={<PublicProfile />} />
                <Route path="/shortlist/:slug" element={<PublicShortlist />} />
                <Route path="/register"        element={<ActorRegistration />} />

                {/* Protected manager workspace */}
                <Route path="/dashboard"      element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/roster"         element={<ProtectedRoute><Roster /></ProtectedRoute>} />
                <Route path="/roster/new"     element={<ProtectedRoute><AddTalent /></ProtectedRoute>} />
                <Route path="/roster/:id"     element={<ProtectedRoute><ActorProfile /></ProtectedRoute>} />
                <Route path="/shortlists"     element={<ProtectedRoute><ShortlistsPage /></ProtectedRoute>} />
                <Route path="/shortlists/:id" element={<ProtectedRoute><ShortlistsPage /></ProtectedRoute>} />
                <Route path="/calendar"       element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
                <Route path="/settings"       element={<ProtectedRoute><ManagerProfileLazy /></ProtectedRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AppLayout>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
