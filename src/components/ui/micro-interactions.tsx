/**
 * Micro-Interactions Library
 * 
 * Reusable animation components for delightful user interactions.
 * Uses Framer Motion for smooth, spring-based animations.
 * 
 * @created 2025-12-26
 */

import { motion, AnimatePresence, type Variants, type Transition } from 'framer-motion';
import { ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// SHARED TRANSITIONS
// ============================================================================

export const springTransition: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 25,
  mass: 0.8,
};

export const bouncyTransition: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 15,
  mass: 0.6,
};

export const smoothTransition: Transition = {
  type: 'tween',
  ease: [0.16, 1, 0.3, 1],
  duration: 0.3,
};

// ============================================================================
// PRESSABLE - Tactile button/card press effect
// ============================================================================

interface PressableProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  /** Scale amount when pressed (0.95 - 0.99) */
  pressScale?: number;
}

export const Pressable = forwardRef<HTMLDivElement, PressableProps>(
  ({ children, className, disabled, onClick, pressScale = 0.97 }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn("cursor-pointer", disabled && "cursor-not-allowed opacity-50", className)}
        whileTap={disabled ? undefined : { scale: pressScale }}
        transition={springTransition}
        onClick={disabled ? undefined : onClick}
      >
        {children}
      </motion.div>
    );
  }
);
Pressable.displayName = 'Pressable';

// ============================================================================
// HOVER LIFT - Card lift effect on hover
// ============================================================================

interface HoverLiftProps {
  children: ReactNode;
  className?: string;
  /** Lift amount in pixels */
  liftAmount?: number;
  /** Whether to show shadow enhancement */
  shadowOnHover?: boolean;
}

export const HoverLift = ({ 
  children, 
  className,
  liftAmount = 4,
  shadowOnHover = true,
}: HoverLiftProps) => {
  return (
    <motion.div
      className={className}
      whileHover={{ 
        y: -liftAmount,
        transition: springTransition,
      }}
      style={{
        boxShadow: shadowOnHover ? undefined : 'none',
      }}
    >
      {children}
    </motion.div>
  );
};

// ============================================================================
// POP IN - Scale-based entrance animation
// ============================================================================

interface PopInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Whether component is visible */
  show?: boolean;
}

export const PopIn = ({ 
  children, 
  className,
  delay = 0,
  show = true,
}: PopInProps) => {
  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          className={className}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            transition: {
              ...bouncyTransition,
              delay,
            },
          }}
          exit={{ 
            opacity: 0, 
            scale: 0.8,
            transition: { duration: 0.15 },
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// PULSE - Attention-grabbing pulse animation
// ============================================================================

interface PulseProps {
  children: ReactNode;
  className?: string;
  /** Whether pulsing is active */
  active?: boolean;
  /** Pulse intensity (1.02 - 1.1) */
  intensity?: number;
}

export const Pulse = ({ 
  children, 
  className,
  active = true,
  intensity = 1.05,
}: PulseProps) => {
  return (
    <motion.div
      className={className}
      animate={active ? {
        scale: [1, intensity, 1],
      } : {}}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
};

// ============================================================================
// GLOW PULSE - Box shadow pulse for emphasis
// ============================================================================

interface GlowPulseProps {
  children: ReactNode;
  className?: string;
  /** Whether glowing is active */
  active?: boolean;
  /** Glow color (CSS color value) */
  glowColor?: string;
}

export const GlowPulse = ({ 
  children, 
  className,
  active = true,
  glowColor = 'hsl(174 65% 45% / 0.4)',
}: GlowPulseProps) => {
  return (
    <motion.div
      className={className}
      animate={active ? {
        boxShadow: [
          `0 0 0 0 ${glowColor.replace('0.4', '0')}`,
          `0 0 20px 4px ${glowColor}`,
          `0 0 0 0 ${glowColor.replace('0.4', '0')}`,
        ],
      } : {}}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
};

// ============================================================================
// SHAKE - Error/attention shake animation
// ============================================================================

interface ShakeProps {
  children: ReactNode;
  className?: string;
  /** Trigger shake animation */
  shake?: boolean;
  /** Shake intensity in pixels */
  intensity?: number;
}

export const Shake = ({ 
  children, 
  className,
  shake = false,
  intensity = 10,
}: ShakeProps) => {
  return (
    <motion.div
      className={className}
      animate={shake ? {
        x: [0, -intensity, intensity, -intensity, intensity, 0],
      } : {}}
      transition={{
        duration: 0.4,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
};

// ============================================================================
// SPIN - Rotation animation for icons
// ============================================================================

interface SpinProps {
  children: ReactNode;
  className?: string;
  /** Whether spinning is active */
  spinning?: boolean;
  /** Spin duration in seconds */
  duration?: number;
}

export const Spin = ({ 
  children, 
  className,
  spinning = false,
  duration = 1,
}: SpinProps) => {
  return (
    <motion.div
      className={className}
      animate={spinning ? { rotate: 360 } : { rotate: 0 }}
      transition={{
        duration,
        repeat: spinning ? Infinity : 0,
        ease: 'linear',
      }}
    >
      {children}
    </motion.div>
  );
};

// ============================================================================
// CHECK MARK ANIMATION - Animated checkmark reveal
// ============================================================================

interface CheckAnimationProps {
  className?: string;
  /** Whether check is visible */
  checked?: boolean;
  /** Size of the check */
  size?: number;
}

export const CheckAnimation = ({ 
  className,
  checked = false,
  size = 24,
}: CheckAnimationProps) => {
  const checkVariants: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { 
      pathLength: 1, 
      opacity: 1,
      transition: {
        pathLength: { duration: 0.3, ease: 'easeOut' },
        opacity: { duration: 0.1 },
      },
    },
  };

  return (
    <AnimatePresence>
      {checked && (
        <motion.svg
          className={className}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={checkVariants}
          />
        </motion.svg>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// NUMBER FLIP - Animated number counter
// ============================================================================

interface NumberFlipProps {
  value: number;
  className?: string;
}

export const NumberFlip = ({ value, className }: NumberFlipProps) => {
  return (
    <motion.span
      key={value}
      className={cn("inline-block", className)}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      transition={springTransition}
    >
      {value}
    </motion.span>
  );
};

// ============================================================================
// BADGE BOUNCE - Badge entrance with bounce
// ============================================================================

interface BadgeBounceProps {
  children: ReactNode;
  className?: string;
  /** Whether badge is visible */
  show?: boolean;
}

export const BadgeBounce = ({ 
  children, 
  className,
  show = true,
}: BadgeBounceProps) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={className}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: 1, 
            opacity: 1,
            transition: bouncyTransition,
          }}
          exit={{ 
            scale: 0, 
            opacity: 0,
            transition: { duration: 0.15 },
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

