"use client";

import { useState, type ReactNode } from "react";
import {
  Activity,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  ShieldCheck,
  Users,
  X
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const adminBasePath = process.env.NEXT_PUBLIC_ADMIN_BASE_PATH ?? "/admin";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Customers", icon: Users },
  { label: "Care plans", icon: ClipboardList },
  { label: "Metrics", icon: Activity },
  { label: "Audit", icon: ShieldCheck }
];

export function AdminWorkspaceShell({
  children,
  email
}: {
  children: ReactNode;
  email?: string | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const displayEmail = email ?? "Valence admin";

  const aside = (
    <aside className="flex h-full w-72 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <div>
          <p className="text-sm font-semibold">Valence Admin</p>
          <p className="text-xs text-muted-foreground">Operations workspace</p>
        </div>
        <Button
          className="lg:hidden"
          onClick={() => setIsOpen(false)}
          size="icon"
          type="button"
          variant="ghost"
        >
          <X className="size-4" />
          <span className="sr-only">Close navigation</span>
        </Button>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              className={cn(
                "flex h-10 items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition-colors",
                item.active
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              key={item.label}
              type="button"
            >
              <Icon className="size-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <p className="truncate text-sm font-medium">{displayEmail}</p>
        <form action={`${adminBasePath}/sign-out`} className="mt-3" method="post">
          <Button className="w-full justify-start" type="submit" variant="outline">
            <LogOut data-icon="inline-start" />
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  );

  return (
    <div className="min-h-dvh bg-background text-foreground lg:grid lg:grid-cols-[18rem_1fr]">
      <div className="hidden lg:block">{aside}</div>

      {isOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-foreground/30"
            onClick={() => setIsOpen(false)}
            type="button"
          />
          <div className="absolute inset-y-0 left-0 shadow-xl">{aside}</div>
        </div>
      ) : null}

      <main className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <Button
            className="lg:hidden"
            onClick={() => setIsOpen(true)}
            size="icon"
            type="button"
            variant="outline"
          >
            <Menu className="size-4" />
            <span className="sr-only">Open navigation</span>
          </Button>
          <PanelLeftClose className="hidden size-4 text-muted-foreground lg:block" />
          <div>
            <p className="text-sm font-medium">Operations overview</p>
            <p className="text-xs text-muted-foreground">
              Metrics, customers, and clinical workflow context
            </p>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
