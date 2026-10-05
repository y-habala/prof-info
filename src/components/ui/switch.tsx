"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> & {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

// Minimal, accessible switch — a real styled checkbox with sr-only input so
// native focus/keyboard work out of the box. onCheckedChange is a thin
// shim over onChange for parity with v1's call sites.
export function Switch({ className, checked, onCheckedChange, onChange, ...props }: Props) {
  return (
    <label
      className={cn(
        "inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border border-input p-0.5 transition-colors",
        checked ? "bg-primary border-primary" : "bg-muted",
        props.disabled && "pointer-events-none opacity-50",
        className
      )}
    >
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={(e) => {
          onCheckedChange?.(e.target.checked);
          onChange?.(e);
        }}
        {...props}
      />
      <span
        aria-hidden
        className={cn(
          "size-5 rounded-full bg-background shadow-sm transition-transform",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </label>
  );
}
