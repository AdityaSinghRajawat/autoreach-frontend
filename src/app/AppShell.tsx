import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Menu, Search } from "lucide-react";
import { useState } from "react";
import { Outlet, useNavigate } from "react-router";

import { Logo } from "@/components/brand/Logo";
import { NavigationProgress } from "@/components/feedback/NavigationProgress";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { Sidebar } from "@/components/layout/Sidebar";
import { UserMenu } from "@/components/layout/UserMenu";
import { Button } from "@/components/ui/Button";
import { overlayClassName } from "@/components/ui/Dialog";
import { useLogout } from "@/features/auth/api";

export function AppShell() {
  const navigate = useNavigate();
  const logout = useLogout();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const signOut = () =>
    logout.mutate(undefined, { onSettled: () => navigate("/login", { replace: true }) });

  return (
    <div className="min-h-full lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <NavigationProgress />
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      <aside className="sticky top-0 hidden h-dvh border-r border-border bg-surface lg:block">
        <Sidebar />
      </aside>

      <DialogPrimitive.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className={overlayClassName} />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] animate-drawer-in border-r border-border bg-surface shadow-overlay"
          >
            <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
            <Sidebar onNavigate={() => setDrawerOpen(false)} />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-bg/80 px-4 backdrop-blur-md sm:px-6 lg:px-10">
          <Button
            variant="ghost"
            size="icon"
            className="-ml-2 lg:hidden"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
          >
            <Menu />
          </Button>
          <span className="lg:hidden">
            <Logo showWordmark={false} />
          </span>
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="ml-auto flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-ink-3 transition-colors hover:border-border-strong hover:text-ink-2 sm:w-72 lg:ml-0"
          >
            <Search className="size-4" aria-hidden />
            <span className="hidden sm:inline">Jump to…</span>
            <kbd className="ml-auto hidden rounded border border-border bg-surface-2 px-1.5 font-mono text-[11px] sm:inline">
              Ctrl K
            </kbd>
          </button>
          <div className="lg:ml-auto">
            <UserMenu onSignOut={signOut} />
          </div>
        </header>

        <main
          id="main"
          tabIndex={-1}
          className="flex-1 px-4 py-6 outline-none sm:px-6 sm:py-8 lg:px-10"
        >
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} onSignOut={signOut} />
    </div>
  );
}
