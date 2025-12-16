import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useSEO } from '@/hooks/useSEO';
import { NotificationContainer } from '@/components/InlineNotification';
import { Check, X, Heart, Sparkles, Users } from 'lucide-react';
import { AnimatedGradientBackground } from '@/components/AnimatedGradientBackground';
import { RitualLogo } from '@/components/RitualLogo';
import { useIsMobile } from '@/hooks/use-mobile';
import ritualBackgroundVideo from '@/assets/ritual-background.mp4';
import ritualVideoPoster from '@/assets/ritual-video-poster.jpg';

// Validation helpers
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

const validateName = (name: string): boolean => {
  return name.trim().length >= 2 && name.trim().length <= 100;
};

const getErrorMessage = (error: any): string => {
  const message = error?.message || 'An unexpected error occurred';
  
  // User-friendly error messages
  if (message.includes('Invalid login credentials') || message.includes('Invalid email or password')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  if (message.includes('User already registered') || message.includes('already registered')) {
    return 'An account with this email already exists. Please sign in instead.';
  }
  if (message.includes('Email rate limit') || message.includes('rate limit')) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  if (message.includes('Password should be at least')) {
    return 'Password must be at least 8 characters long.';
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }
  if (message.includes('Email not confirmed')) {
    return 'Please check your email and confirm your account.';
  }
  
  return message;
};

const Auth = () => {
  const isMobile = useIsMobile();
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [touched, setTouched] = useState<{ name?: boolean; email?: boolean; password?: boolean; confirmPassword?: boolean }>({});
  const navigate = useNavigate();

  // Validation state
  const emailValid = useMemo(() => email.length === 0 || validateEmail(email), [email]);
  const nameValid = useMemo(() => name.length === 0 || validateName(name), [name]);
  const passwordStrong = password.length >= 8;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  
  // Form validation
  const canSubmit = useMemo(() => {
    if (isLogin) {
      return emailValid && email.length > 0 && password.length > 0;
    } else {
      return emailValid && email.length > 0 && 
             nameValid && name.length > 0 && 
             passwordStrong && passwordsMatch;
    }
  }, [isLogin, emailValid, email, nameValid, name, passwordStrong, passwordsMatch]);

  // SEO for auth page
  useSEO({
    title: isLogin ? 'Sign In' : 'Create Account',
    description: 'Sign in or create an account to start building meaningful weekly rituals with your partner.',
  });

  // Store join intent if user came to join
  useEffect(() => {
    if (searchParams.get('join') === 'true') {
      sessionStorage.setItem('pendingAction', 'join');
      setIsLogin(false); // Switch to signup mode
    }
  }, [searchParams]);

  useEffect(() => {
    // Set up listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[AUTH] Auth state change event:", event, "has session:", !!session);
      if (session) {
        console.log("[AUTH] Session detected, navigating to home");
        navigate("/");
      } else if (event === 'SIGNED_OUT') {
        console.log("[AUTH] User signed out");
      } else if (event === 'TOKEN_REFRESHED') {
        console.log("[AUTH] Token refreshed");
      }
    });

    // Then check existing session with explicit error handling
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error("[AUTH] Session check error:", error.message);
          // Don't show error to user - they might just not be logged in
          // Only log for debugging
        }
        if (session) {
          console.log("[AUTH] Existing session found, navigating to home");
          navigate("/");
        } else {
          console.log("[AUTH] No existing session, showing auth form");
        }
      })
      .catch((error) => {
        console.error("[AUTH] Unexpected error checking session:", error);
        // Fail gracefully - allow user to still see auth form
      });

    return () => {
      console.log("[AUTH] Cleaning up auth state listener");
      subscription.unsubscribe();
    };
  }, [navigate]);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleBlur = (field: 'name' | 'email' | 'password' | 'confirmPassword') => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({ name: true, email: true, password: true, confirmPassword: true });
    
    // Client-side validation
    if (!isLogin) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        showNotification('error', "Please enter your name");
        return;
      }
      if (!validateName(trimmedName)) {
        showNotification('error', "Name must be between 2 and 100 characters");
        return;
      }
    }
    
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      showNotification('error', "Please enter your email address");
      return;
    }
    if (!validateEmail(trimmedEmail)) {
      showNotification('error', "Please enter a valid email address");
      return;
    }
    
    if (!password) {
      showNotification('error', "Please enter your password");
      return;
    }
    
    if (!isLogin) {
      if (!passwordStrong) {
        showNotification('error', "Password must be at least 8 characters");
        return;
      }
      if (!passwordsMatch) {
        showNotification('error', "Passwords don't match");
        return;
      }
    }
    
    setLoading(true);
    setNotification(null); // Clear any previous notifications

    try {
      if (isLogin) {
        console.log("[AUTH] Attempting sign in for:", trimmedEmail);
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        
        if (error) {
          console.error("[AUTH] Sign in error:", error.message);
          throw error;
        }
        
        console.log("[AUTH] Sign in successful, user:", data.user?.id);
        // Success - navigation will happen via onAuthStateChange
        // Note: Don't set loading to false - let navigation handle it
      } else {
        console.log("[AUTH] Attempting sign up for:", trimmedEmail);
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name: name.trim(),
            },
          },
        });
        
        if (error) {
          console.error("[AUTH] Sign up error:", error.message);
          throw error;
        }
        
        console.log("[AUTH] Sign up successful, user:", data.user?.id);
        
        // Check if email confirmation is required
        if (data.user && !data.session) {
          showNotification('info', 'Please check your email to confirm your account before signing in.');
          setLoading(false);
          return;
        }
        
        // Success - navigation will happen via onAuthStateChange
        // Note: Don't set loading to false - let navigation handle it
      }
    } catch (error: any) {
      console.error("[AUTH] Auth error caught:", error);
      const friendlyMessage = getErrorMessage(error);
      showNotification('error', friendlyMessage);
      setLoading(false);
    }
  };

  // Mobile video background component
  const MobileVideoBackground = () => isMobile ? (
    <video
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      poster={ritualVideoPoster}
      onCanPlayThrough={() => setVideoLoaded(true)}
      className="fixed inset-0 z-[1] w-full h-full object-cover pointer-events-none opacity-20"
    >
      <source src={ritualBackgroundVideo} type="video/mp4" />
    </video>
  ) : null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex items-center justify-center p-3 sm:p-4 relative overflow-hidden min-h-0">
        <AnimatedGradientBackground variant="warm" />
        <MobileVideoBackground />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-5 sm:p-6 md:p-8 shadow-card max-h-[calc(100dvh-2rem)] overflow-y-auto">
            {/* Branded Logo */}
            <div className="flex justify-center mb-4 sm:mb-5">
              <RitualLogo size="md" variant="full" />
            </div>
            
            <h1 className="text-xl sm:text-2xl font-bold text-center mb-1 sm:mb-2 text-foreground">
              {isLogin ? "Welcome back" : "Join thousands of couples"}
            </h1>
            <p className="text-center text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
              {isLogin 
                ? "Your partner might be waiting for you" 
                : "Building deeper connections, one ritual at a time"}
            </p>
            
            {/* Value proposition for signup */}
            {!isLogin && (
              <div className="flex justify-center gap-3 sm:gap-4 mb-4 sm:mb-5 text-[10px] sm:text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Heart className="w-3 h-3 text-pink-500" />
                  <span>Weekly rituals</span>
                </div>
                <div className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-500" />
                  <span>AI-powered</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-teal-500" />
                  <span>For couples</span>
                </div>
              </div>
            )}

            {/* Inline Notification */}
            {notification && (
              <div className="mb-3 sm:mb-4">
                <NotificationContainer 
                  notification={notification} 
                  onDismiss={() => setNotification(null)} 
                />
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4 sm:space-y-5">
              {!isLogin && (
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm">Your name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => handleBlur('name')}
                    required={!isLogin}
                    className={`rounded-xl h-11 sm:h-12 ${touched.name && !nameValid ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  />
                  {touched.name && !nameValid && name.length > 0 && (
                    <p className="text-xs text-destructive">Name must be between 2 and 100 characters</p>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur('email')}
                  required
                  className={`rounded-xl h-11 sm:h-12 ${touched.email && !emailValid ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                />
                {touched.email && !emailValid && email.length > 0 && (
                  <p className="text-xs text-destructive">Please enter a valid email address</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur('password')}
                  required
                  className="rounded-xl h-11 sm:h-12"
                />
                {!isLogin && password.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    {passwordStrong ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <X className="w-3 h-3 text-destructive" />
                    )}
                    <span className={passwordStrong ? 'text-green-600' : 'text-muted-foreground'}>
                      At least 8 characters
                    </span>
                  </div>
                )}
              </div>

              {!isLogin && (
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-sm">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onBlur={() => handleBlur('confirmPassword')}
                    required
                    className="rounded-xl h-11 sm:h-12"
                  />
                  {confirmPassword.length > 0 && (
                    <div className="flex items-center gap-2 text-xs">
                      {passwordsMatch ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <X className="w-3 h-3 text-destructive" />
                      )}
                      <span className={passwordsMatch ? 'text-green-600' : 'text-destructive'}>
                        {passwordsMatch ? 'Passwords match' : 'Passwords don\'t match'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !canSubmit}
                className="w-full bg-gradient-ritual text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed h-11 sm:h-12 rounded-xl mt-2"
              >
                {loading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
              </Button>
            </form>

            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setNotification(null);
                setTouched({});
              }}
              className="w-full mt-3 sm:mt-4 text-center text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>

            <p className="text-[10px] sm:text-xs text-center text-muted-foreground mt-3 sm:mt-4 leading-tight">
              By {isLogin ? 'signing in' : 'signing up'}, you agree to our{' '}
              <a href="/terms" className="underline hover:text-foreground">Terms</a> and{' '}
              <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;