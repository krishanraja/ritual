import { motion, Transition, Easing } from 'framer-motion';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  enter: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -8,
  },
};

const pageTransition: Transition = {
  type: 'tween',
  ease: 'easeInOut' as Easing,
  duration: 0.2,
};

const loadingBarVariants = {
  initial: {
    scaleX: 0,
    opacity: 1,
  },
  animate: {
    scaleX: 1,
    opacity: 0,
    transition: {
      scaleX: { duration: 0.3, ease: 'easeOut' as Easing },
      opacity: { duration: 0.15, delay: 0.25 },
    },
  },
};

export const PageTransition = ({ children }: PageTransitionProps) => {
  return (
    <>
      {/* Subtle loading bar */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={loadingBarVariants}
        className="fixed top-0 left-0 right-0 h-0.5 bg-primary/60 origin-left z-[100]"
      />
      
      <motion.div
        initial="initial"
        animate="enter"
        exit="exit"
        variants={pageVariants}
        transition={pageTransition}
        className="h-full w-full"
      >
        {children}
      </motion.div>
    </>
  );
};
