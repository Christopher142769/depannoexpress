"use client";

import * as React from "react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/** Bottom sheet mobile — glissière depuis le bas */
export function BottomSheet({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  className,
}: BottomSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <Drawer.Trigger asChild>{trigger}</Drawer.Trigger> : null}
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Drawer.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[85vh] flex-col",
            "rounded-t-card border-t border-border bg-bg-elevated",
            className
          )}
        >
          <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-pill bg-border" />
          {(title || description) && (
            <div className="px-6 pt-4 pb-2">
              {title ? (
                <Drawer.Title className="font-display text-lg font-bold text-text-primary">
                  {title}
                </Drawer.Title>
              ) : null}
              {description ? (
                <Drawer.Description className="mt-1 text-sm text-text-secondary">
                  {description}
                </Drawer.Description>
              ) : null}
            </div>
          )}
          <div className="flex-1 overflow-y-auto px-6 pb-8 pt-2">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
