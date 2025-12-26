/**
 * Button Component
 * 
 * Premium button with tactile press states, soft shadows, and smooth animations.
 * Designed for warmth and delightful interactions.
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    // Base styles
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "text-sm font-semibold",
    "rounded-xl",
    // Focus states
    "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    // Disabled state
    "disabled:pointer-events-none disabled:opacity-50",
    // Icon sizing
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    // Transitions - smooth with tactile feel
    "transition-all duration-150 ease-out",
    // Tactile press effect
    "active:scale-[0.97] active:transition-transform active:duration-75",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-foreground",
          "shadow-sm hover:shadow-md",
          "hover:bg-primary/90",
        ].join(" "),
        
        destructive: [
          "bg-destructive text-destructive-foreground",
          "shadow-sm hover:shadow-md",
          "hover:bg-destructive/90",
        ].join(" "),
        
        outline: [
          "border-2 border-border bg-background",
          "hover:bg-accent hover:text-accent-foreground hover:border-accent",
          "shadow-xs hover:shadow-sm",
        ].join(" "),
        
        secondary: [
          "bg-secondary text-secondary-foreground",
          "shadow-xs hover:shadow-sm",
          "hover:bg-secondary/80",
        ].join(" "),
        
        ghost: [
          "hover:bg-accent/50 hover:text-accent-foreground",
          "active:bg-accent/70",
        ].join(" "),
        
        link: [
          "text-primary underline-offset-4 hover:underline",
          "active:scale-100", // No press effect for links
        ].join(" "),
        
        // New premium variants
        gradient: [
          "bg-gradient-ritual text-white",
          "shadow-md hover:shadow-lg hover:shadow-primary/20",
          "hover:brightness-105",
        ].join(" "),
        
        soft: [
          "bg-primary/10 text-primary",
          "hover:bg-primary/20",
          "border border-primary/20",
        ].join(" "),
        
        glow: [
          "bg-primary text-primary-foreground",
          "shadow-glow hover:shadow-lg",
          "hover:bg-primary/90",
        ].join(" "),
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-base font-bold",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Shows loading spinner and disables button */
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    return (
      <Comp 
        className={cn(buttonVariants({ variant, size, className }))} 
        ref={ref} 
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
            <span className="sr-only">Loading</span>
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
