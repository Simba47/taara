import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { lazy, Suspense } from "react";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Roster = lazy(() => import("./pages/Roster"));
const ActorProfile = lazy(() => import("./pages/ActorProfile"));
const AddTalent = lazy(() => import("./pages/AddTalent"));
const ActorRegistration = lazy(() => import("./pages/ActorRegistration"));
const ShortlistsPage = lazy(() => import("./pages/ShortlistsPage"));
const PublicShortlist = lazy(() => import("./pages/PublicShortlist"));
const Login = lazy(() => import("./pages/Login"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center animate-pulse">
      <span className="font-display text-primary-foreground text-sm font-bold">T</span>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Fully public — no sidebar, no auth check */}
                <Route path="/login" element={<Login />} />
                <Route path="/profile/:slug" element={<PublicProfile />} />
                <Route path="/shortlist/:slug" element={<PublicShortlist />} />
                <Route path="/register" element={<ActorRegistration />} />

                {/* Manager dashboard — requires login */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/roster" element={<ProtectedRoute><Roster /></ProtectedRoute>} />
                <Route path="/roster/new" element={<ProtectedRoute><AddTalent /></ProtectedRoute>} />
                <Route path="/roster/:id" element={<ProtectedRoute><ActorProfile /></ProtectedRoute>} />
                <Route path="/shortlists" element={<ProtectedRoute><ShortlistsPage /></ProtectedRoute>} />
                <Route path="/shortlists/:id" element={<ProtectedRoute><ShortlistsPage /></ProtectedRoute>} />
                <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />

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
