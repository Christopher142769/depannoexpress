"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

/** Toast notifications — wrapper Sonner avec thème Dépannage Express */
function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-bg-elevated group-[.toaster]:text-text-primary group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-card",
          description: "group-[.toast]:text-text-secondary",
          actionButton: "group-[.toast]:bg-brand-blue group-[.toast]:text-white",
          cancelButton: "group-[.toast]:bg-bg-surface group-[.toast]:text-text-secondary",
          success: "group-[.toast]:border-success/30",
          error: "group-[.toast]:border-brand-red/30",
          warning: "group-[.toast]:border-warning/30",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };

// Réexport pour usage simple : import { toast } from "sonner"
export { toast } from "sonner";
