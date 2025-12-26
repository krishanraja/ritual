/**
 * Card Component
 * 
 * Soft neumorphic card with enhanced shadows and hover effects.
 * Designed for warmth and tactile feel.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Card elevation variant */
  variant?: 'default' | 'elevated' | 'glass' | 'interactive';
  /** Whether the card has a glow effect */
  glow?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', glow = false, ...props }, ref) => {
    const baseStyles = "rounded-2xl bg-card text-card-foreground transition-all duration-normal ease-out-expo";
    
    const variantStyles = {
      default: "border border-border/50 shadow-soft",
      elevated: "border border-border/30 shadow-card hover:shadow-elevated",
      glass: "bg-white/70 dark:bg-card/70 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-soft",
      interactive: "border border-border/50 shadow-soft hover:shadow-card hover:-translate-y-0.5 cursor-pointer active:translate-y-0 active:shadow-soft",
    };
    
    const glowStyles = glow ? "shadow-glow" : "";
    
    return (
      <div 
        ref={ref} 
        className={cn(baseStyles, variantStyles[variant], glowStyles, className)} 
        {...props} 
      />
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn("flex flex-col space-y-1.5 p-5 pb-3", className)} 
      {...props} 
    />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 
      ref={ref} 
      className={cn(
        "text-xl font-bold leading-tight tracking-tight",
        className
      )} 
      {...props} 
    />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p 
      ref={ref} 
      className={cn("text-sm text-muted-foreground leading-relaxed", className)} 
      {...props} 
    />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn("p-5 pt-0", className)} 
      {...props} 
    />
  ),
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn("flex items-center p-5 pt-0", className)} 
      {...props} 
    />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
