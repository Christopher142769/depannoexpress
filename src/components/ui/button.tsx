"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { tapScale } from "@/lib/animations";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2.5 whitespace-nowrap font-bold tracking-tight transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-glow focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base disabled:pointer-events-none disabled:opacity-50 rounded-pill overflow-hidden",
  {
    variants: {
      variant: {
        primary:
          "bg-grad-brand text-white shadow-[0_4px_20px_rgba(30,115,190,0.35)] hover:shadow-[0_8px_40px_rgba(46,156,240,0.45)] hover:brightness-110 btn-glow-pulse",
        urgent:
          "bg-grad-urgent text-white shadow-[0_4px_20px_rgba(224,35,28,0.35)] hover:shadow-[0_8px_40px_rgba(224,35,28,0.45)] hover:brightness-110",
        ghost:
          "bg-transparent text-text-primary hover:bg-bg-elevated border border-border hover:border-brand-blue/30",
        glass:
          "glass text-text-primary hover:bg-bg-elevated/60 hover:border-accent-glow/20",
        outline:
          "border border-brand-blue/50 text-brand-blue hover:bg-brand-blue/10 hover:border-brand-blue hover:glow-blue-sm",
      },
      size: {
        sm: "h-10 px-5 text-sm",
        md: "h-12 px-7 text-sm",
        lg: "h-14 px-9 text-base",
        xl: "h-16 px-10 text-lg",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  showArrow?: boolean;
  loading?: boolean;
}

function getSlottableChild(children: React.ReactNode) {
  const elements = React.Children.toArray(children).filter(React.isValidElement);
  if (elements.length !== 1) {
    throw new Error("Button avec asChild attend un seul élément React enfant.");
  }
  return elements[0] as React.ReactElement<{ children?: React.ReactNode }>;
}

function ButtonInner({
  loading,
  showArrow,
  children,
}: {
  loading: boolean;
  showArrow: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      ) : null}
      <span className="relative z-10">{children}</span>
      {showArrow && !loading ? (
        <span className="relative z-10 ml-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
          <ArrowRight className="h-4 w-4" />
        </span>
      ) : null}
    </>
  );
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      showArrow = false,
      loading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const classes = cn(buttonVariants({ variant, size, className }));

    if (asChild) {
      const child = getSlottableChild(children);

      return (
        <Slot className={classes} ref={ref} {...props}>
          {React.cloneElement(
            child,
            {},
            <ButtonInner loading={loading} showArrow={showArrow}>
              {child.props.children}
            </ButtonInner>
          )}
        </Slot>
      );
    }

    return (
      <motion.button
        className={classes}
        ref={ref}
        whileTap={tapScale}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
        disabled={disabled || loading}
        {...(props as React.ComponentProps<typeof motion.button>)}
      >
        {/* Reflet premium sur boutons gradient */}
        {(variant === "primary" || variant === "urgent" || !variant) && (
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/15 to-transparent opacity-60" />
        )}
        <ButtonInner loading={loading} showArrow={showArrow}>
          {children}
        </ButtonInner>
      </motion.button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
