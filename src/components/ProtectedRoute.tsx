/**
 * ProtectedRoute Component
 * 
 * Route-level protection for authenticated routes.
 * Handles redirects based on auth state and couple requirements.
 * 
 * @created 2025-12-22
 */

import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCouple } from '@/contexts/CoupleContext';
import { RitualSpinner } from '@/components/RitualSpinner';

type ProtectionLevel = 
  | 'auth'           // Just needs to be logged in
  | 'couple'         // Needs to have a couple (partner_one or partner_two)
  | 'paired'         // Needs to have a complete couple (both partners)
  | 'cycle';         // Needs to have an active cycle

interface ProtectedRouteProps {
  children: ReactNode;
  /** The level of protection required for this route */
  requires?: ProtectionLevel;
  /** Custom redirect path if protection fails */
  redirectTo?: string;
}

/**
 * ProtectedRoute - Wraps routes that require authentication
 * 
 * Usage:
 * <Route path="/profile" element={
 *   <ProtectedRoute requires="auth">
 *     <Profile />
 *   </ProtectedRoute>
 * } />
 */
export function ProtectedRoute({ 
  children, 
  requires = 'auth',
  redirectTo 
}: ProtectedRouteProps) {
  const { user, couple, loading } = useCouple();
  const location = useLocation();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-warm">
        <RitualSpinner size="lg" />
      </div>
    );
  }

  // Check authentication
  if (!user) {
    // Save the intended destination for post-login redirect
    const returnTo = location.pathname + location.search;
    return (
      <Navigate 
        to={redirectTo || `/auth?returnTo=${encodeURIComponent(returnTo)}`} 
        replace 
      />
    );
  }

  // Check couple requirement
  if (requires === 'couple' || requires === 'paired' || requires === 'cycle') {
    if (!couple) {
      return <Navigate to={redirectTo || '/'} replace />;
    }
  }

  // Check paired requirement (both partners present)
  if (requires === 'paired' || requires === 'cycle') {
    if (!couple?.partner_two) {
      return <Navigate to={redirectTo || '/'} replace />;
    }
  }

  // All checks passed, render the protected content
  return <>{children}</>;
}

/**
 * PublicRoute - Redirects authenticated users away from auth pages
 */
interface PublicRouteProps {
  children: ReactNode;
  /** Where to redirect authenticated users */
  redirectTo?: string;
}

export function PublicRoute({ children, redirectTo = '/' }: PublicRouteProps) {
  const { user, loading } = useCouple();
  const location = useLocation();

  // Don't redirect while loading - prevents flash
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-warm">
        <RitualSpinner size="lg" />
      </div>
    );
  }

  // Redirect authenticated users
  if (user) {
    // Check if there's a returnTo param
    const searchParams = new URLSearchParams(location.search);
    const returnTo = searchParams.get('returnTo');
    return <Navigate to={returnTo || redirectTo} replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;


