/**
 * App.tsx
 * 
 * Main application component with routing and providers.
 * 
 * @updated 2025-12-13 - Added SEO pages (FAQ, Blog)
 */

import { Suspense, lazy, memo } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { CoupleProvider } from "@/contexts/CoupleContext";
import { AnalyticsProvider } from "@/contexts/AnalyticsContext";
import { AppShell } from "@/components/AppShell";
import { SplashScreen } from "@/components/SplashScreen";
import { ContextualFeedback } from "@/components/ContextualFeedback";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute, PublicRoute } from "@/components/ProtectedRoute";
import { SessionExpiredBanner } from "@/components/SessionExpiredBanner";
import { OfflineBanner } from "@/components/OfflineBanner";
import { AuthDebugPanel } from "@/components/AuthDebugPanel";

// Critical: Landing page loads immediately for fast LCP
import Landing from "./pages/Landing";

// Code-split non-critical routes for smaller initial bundle
const Auth = lazy(() => import("./pages/Auth"));
const QuickInput = lazy(() => import("./pages/QuickInput"));
const RitualCards = lazy(() => import("./pages/RitualCards"));
const RitualPicker = lazy(() => import("./pages/RitualPicker"));
const Memories = lazy(() => import("./pages/Memories"));
const Profile = lazy(() => import("./pages/Profile"));
const Contact = lazy(() => import("./pages/Contact"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const NotFound = lazy(() => import("./pages/NotFound"));

// SEO pages - lazy loaded for content marketing
const FAQ = lazy(() => import("./pages/FAQ"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogArticle = lazy(() => import("./pages/BlogArticle"));

// Optimized React Query configuration for performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes (stale time)
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      // Refetch on window focus only if data is stale
      refetchOnWindowFocus: false,
      // Don't refetch on reconnect if data is fresh
      refetchOnReconnect: 'always',
      // Retry failed requests once
      retry: 1,
      // Retry delay increases exponentially
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
});

// Minimal loading fallback for lazy routes - matches app background
const LazyFallback = () => (
  <div className="h-full flex items-center justify-center bg-gradient-warm">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const AnimatedRoutes = memo(() => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={
          <PublicRoute>
            <Suspense fallback={<LazyFallback />}><Auth /></Suspense>
          </PublicRoute>
        } />
        
        {/* Protected routes - require authenticated couple with partner */}
        <Route path="/input" element={
          <ProtectedRoute requires="paired">
            <Suspense fallback={<LazyFallback />}><QuickInput /></Suspense>
          </ProtectedRoute>
        } />
        <Route path="/picker" element={
          <ProtectedRoute requires="paired">
            <Suspense fallback={<LazyFallback />}><RitualPicker /></Suspense>
          </ProtectedRoute>
        } />
        <Route path="/rituals" element={
          <ProtectedRoute requires="paired">
            <Suspense fallback={<LazyFallback />}><RitualCards /></Suspense>
          </ProtectedRoute>
        } />
        <Route path="/memories" element={
          <ProtectedRoute requires="paired">
            <Suspense fallback={<LazyFallback />}><Memories /></Suspense>
          </ProtectedRoute>
        } />
        {/* Redirect old history route to memories */}
        <Route path="/history" element={<Navigate to="/memories" replace />} />
        
        {/* Protected routes - require authentication only */}
        <Route path="/profile" element={
          <ProtectedRoute requires="auth">
            <Suspense fallback={<LazyFallback />}><Profile /></Suspense>
          </ProtectedRoute>
        } />
        
        {/* Public pages */}
        <Route path="/contact" element={<Suspense fallback={<LazyFallback />}><Contact /></Suspense>} />
        <Route path="/terms" element={<Suspense fallback={<LazyFallback />}><Terms /></Suspense>} />
        <Route path="/privacy" element={<Suspense fallback={<LazyFallback />}><Privacy /></Suspense>} />
        
        {/* SEO Pages */}
        <Route path="/faq" element={<Suspense fallback={<LazyFallback />}><FAQ /></Suspense>} />
        <Route path="/blog" element={<Suspense fallback={<LazyFallback />}><Blog /></Suspense>} />
        <Route path="/blog/:slug" element={<Suspense fallback={<LazyFallback />}><BlogArticle /></Suspense>} />
        
        <Route path="*" element={<Suspense fallback={<LazyFallback />}><NotFound /></Suspense>} />
      </Routes>
    </AnimatePresence>
  );
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <CoupleProvider>
            <AnalyticsProvider>
              <SplashScreen>
                <OfflineBanner />
                <SessionExpiredBanner />
                <AppShell>
                  <AnimatedRoutes />
                  <ContextualFeedback />
                </AppShell>
                <AuthDebugPanel />
              </SplashScreen>
            </AnalyticsProvider>
          </CoupleProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
