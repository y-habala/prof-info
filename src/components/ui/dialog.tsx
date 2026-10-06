"use client";
import * as React from "react";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// Thin wrapper around Base UI's Dialog — the API we actually use everywhere
// is: controlled open + onOpenChange + a trigger element + content with
// optional title.
export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </BaseDialog.Root>
  );
}

export function DialogTrigger({
  render,
  children,
}: {
  render?: React.ReactElement;
  children?: React.ReactNode;
}) {
  if (render) {
    // No children forwarded on purpose: Base UI clones the `render` element and
    // its own props win the merge, so the element keeps its label by itself.
    // Callers must never read `render.props` either — an element built inside a
    // Server Component arrives here as a Flight lazy wrapper with no `.props`.
    return <BaseDialog.Trigger render={render} />;
  }
  return <BaseDialog.Trigger>{children}</BaseDialog.Trigger>;
}

export function DialogContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 transition-opacity duration-150" />
      <BaseDialog.Popup
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2",
          "rounded-xl border border-border bg-card p-6 shadow-xl",
          "data-[starting-style]:opacity-0 data-[starting-style]:scale-95",
          "data-[ending-style]:opacity-0 data-[ending-style]:scale-95",
          "transition-all duration-150",
          className
        )}
      >
        <BaseDialog.Close
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Fermer"
        >
          <X className="size-4" />
        </BaseDialog.Close>
        {children}
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}

export function DialogHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mb-4 space-y-1.5", className)}>{children}</div>;
}

export function DialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <BaseDialog.Title className={cn("text-lg font-semibold leading-none", className)}>
      {children}
    </BaseDialog.Title>
  );
}

export function DialogDescription({ children }: { children: React.ReactNode }) {
  return <BaseDialog.Description className="text-sm text-muted-foreground">{children}</BaseDialog.Description>;
}
