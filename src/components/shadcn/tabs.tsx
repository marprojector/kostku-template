"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* ============================================================
   Tabs — shadcn/ui style (state lokal, tanpa radix)
   ============================================================ */
interface TabsContextValue {
  value: string;
  setValue: (v: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabs() {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("Tabs parts harus di dalam <Tabs>");
  return ctx;
}

const Tabs = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { defaultValue?: string; value?: string; onValueChange?: (v: string) => void }>(
  ({ defaultValue = "", value, onValueChange, className, children, ...props }, ref) => {
    const [internal, setInternal] = React.useState(defaultValue);
    const controlled = value ?? internal;
    const setValue = React.useCallback(
      (v: string) => {
        setInternal(v);
        onValueChange?.(v);
      },
      [onValueChange]
    );
    return (
      <TabsContext.Provider value={{ value: controlled, setValue }}>
        <div ref={ref} className={className} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = "Tabs";

const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="tablist"
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-lg bg-[var(--muted)] p-1 text-[var(--muted-foreground)]",
        className
      )}
      {...props}
    />
  )
);
TabsList.displayName = "TabsList";

const TabsTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }>(
  ({ className, value, ...props }, ref) => {
    const { value: current, setValue } = useTabs();
    const active = current === value;
    return (
      <button
        ref={ref}
        role="tab"
        aria-selected={active}
        onClick={() => setValue(value)}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
          active
            ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
            : "hover:bg-[color-mix(in_srgb,var(--muted)_60%,var(--card))]",
          className
        )}
        {...props}
      />
    );
  }
);
TabsTrigger.displayName = "TabsTrigger";

const TabsContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { value: string }>(
  ({ className, value, ...props }, ref) => {
    const { value: current } = useTabs();
    if (current !== value) return null;
    return (
      <div
        ref={ref}
        role="tabpanel"
        className={cn("mt-2 focus-visible:outline-none", className)}
        {...props}
      />
    );
  }
);
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
