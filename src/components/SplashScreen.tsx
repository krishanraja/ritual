/**
 * SplashScreen Component
 * 
 * Premium branded loading experience with refined animations.
 * Follows Google UX principles:
 * - One loading state, one transition
 * - Content pre-renders invisibly underneath
 * - Atomic reveal with smooth crossfade
 * 
 * @created 2025-12-13
 * @updated 2025-12-26 - Premium animations, new tagline
 */

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCouple } from '@/contexts/CoupleContext';
import ritualIcon from '@/assets/ritual-icon.png';

interface SplashScreenProps {
  children: React.ReactNode;
}

export function SplashScreen({ children }: SplashScreenProps) {
  const { loading } = useCouple();
  const [showSplash, setShowSplash] = useState(true);
  const [contentReady, setContentReady] = useState(false);
  const showSplashRef = useRef(true);

  // Remove native HTML splash immediately
  useEffect(() => {
    const nativeSplash = document.getElementById('splash');
    if (nativeSplash) {
      nativeSplash.style.display = 'none';
      nativeSplash.remove();
    }
  }, []);

  // Progressive timeout system - prevents infinite splash with user feedback
  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];
    
    // Warning at 3s
    const warningTimeout = setTimeout(() => {
      if (showSplashRef.current && loading) {
        console.warn('[SplashScreen] Loading taking longer than expected (3s)');
      }
    }, 3000);
    timeouts.push(warningTimeout);
    
    // Critical timeout at 8s - force dismiss with error state
    const criticalTimeout = setTimeout(() => {
      if (showSplashRef.current) {
        console.error('[SplashScreen] ⚠️ CRITICAL: Loading exceeded 8s, forcing splash dismissal');
        console.error('[SplashScreen] This indicates a potential connection or initialization issue');
        showSplashRef.current = false;
        setContentReady(true);
        setShowSplash(false);
      }
    }, 8000);
    timeouts.push(criticalTimeout);

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [loading]);

  // When loading completes, reveal content
  useEffect(() => {
    if (!loading) {
      console.log('[SplashScreen] Loading completed, revealing content');
      setContentReady(true);
      
      const timer = setTimeout(() => {
        if (showSplashRef.current) {
          console.log('[SplashScreen] Dismissing splash screen');
          showSplashRef.current = false;
          setShowSplash(false);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [loading]);

  return (
    <>
      {/* Premium branded splash screen */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, hsl(270 40% 94%), hsl(220 20% 97%))'
            }}
          >
            {/* Ambient gradient orbs */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                className="absolute -top-32 -right-32 w-80 h-80 rounded-full opacity-20"
                style={{ background: 'radial-gradient(circle, hsl(174 58% 42%), transparent 70%)' }}
                animate={{ 
                  scale: [1, 1.2, 1],
                  x: [0, 20, 0],
                  y: [0, -10, 0],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-15"
                style={{ background: 'radial-gradient(circle, hsl(270 55% 55%), transparent 70%)' }}
                animate={{ 
                  scale: [1, 1.15, 1],
                  x: [0, -15, 0],
                  y: [0, 20, 0],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            
            {/* Logo container with glow animation */}
            <div className="relative flex items-center justify-center mb-6">
              {/* Rotating gradient ring */}
              <motion.div
                className="absolute w-32 h-32 rounded-full"
                style={{
                  background: 'conic-gradient(from 0deg, hsl(174 58% 42% / 0.4), hsl(270 55% 55% / 0.4), hsl(174 58% 42% / 0.4))',
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              />
              
              {/* Inner glow circle */}
              <motion.div
                className="absolute w-28 h-28 rounded-full"
                style={{ background: 'hsl(0 0% 100% / 0.6)' }}
                animate={{
                  boxShadow: [
                    '0 0 0 0 hsl(174 58% 42% / 0)',
                    '0 0 30px 10px hsl(174 58% 42% / 0.15)',
                    '0 0 0 0 hsl(174 58% 42% / 0)',
                  ],
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />
              
              {/* Icon */}
              <motion.div
                className="relative w-24 h-24 rounded-full bg-white shadow-lg flex items-center justify-center"
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <img
                  src={ritualIcon}
                  alt="Ritual"
                  className="w-14 h-14 object-contain"
                />
              </motion.div>
            </div>
            
            {/* Logo image */}
            <motion.img 
              src="/ritual-logo-full.png" 
              alt="Ritual" 
              className="relative max-h-14 w-auto"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />
            
            {/* Tagline - Updated to more professional version */}
            <motion.p 
              className="relative mt-8 text-sm font-semibold tracking-wide"
              style={{
                background: 'linear-gradient(135deg, hsl(174 55% 35%), hsl(270 55% 50%))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              Weekly moments, lasting connection
            </motion.p>
            
            {/* Loading indicator */}
            <motion.div 
              className="relative mt-8 flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-primary/50"
                    animate={{ 
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{ 
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.15,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>
              <span className="text-xs font-medium text-muted-foreground/70">
                Loading
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content - renders invisibly, revealed atomically */}
      <motion.div 
        initial={false}
        animate={{ opacity: contentReady && !showSplash ? 1 : 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{ pointerEvents: showSplash ? 'none' : 'auto' }}
      >
        {children}
      </motion.div>
    </>
  );
}
