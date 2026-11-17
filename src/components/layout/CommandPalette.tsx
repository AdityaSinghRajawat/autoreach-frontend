import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import { LogOut, Monitor, Moon, Search, Settings, Sun } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router";

import { overlayClassName } from "@/components/ui/Dialog";
import { useTheme } from "@/lib/theme";

import { useNavigationSections } from "./useNavigationSections";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignOut: () => void;
}

const itemClassName =
  "flex cursor-default items-center gap-3 rounded-md px-3 py-2.5 text-sm text-ink-2 select-none data-[selected=true]:bg-primary-soft data-[selected=true]:text-primary [&_svg]:size-4";

export function CommandPalette({ open, onOpenChange, onSignOut }: CommandPaletteProps) {
  const navigate = useNavigate();
  const sections = useNavigationSections();
  const setPreference = useTheme((state) => state.setPreference);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  const run = (action: () => void) => {
    onOpenChange(false);
    action();
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={overlayClassName} />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed top-[12vh] left-1/2 z-50 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 animate-dialog-in overflow-hidden rounded-xl border border-border bg-surface shadow-overlay"
        >
          <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
          <Command loop>
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="size-4 text-ink-3" aria-hidden />
              <Command.Input
                placeholder="Go to a page or run a command…"
                className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-3"
              />
            </div>
            <Command.List className="max-h-[50vh] overflow-y-auto p-2">
              <Command.Empty className="px-3 py-8 text-center text-sm text-ink-3">
                Nothing matches that.
              </Command.Empty>
              {sections.map((section) => (
                <Command.Group
                  key={section.title}
                  heading={section.title}
                  className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-ink-3"
                >
                  {section.items.map((item) => (
                    <Command.Item
                      key={item.to}
                      value={`${section.title} ${item.label}`}
                      keywords={item.keywords?.split(" ")}
                      onSelect={() => run(() => navigate(item.to))}
                      className={itemClassName}
                    >
                      <item.icon aria-hidden />
                      {item.label}
                    </Command.Item>
                  ))}
                </Command.Group>
              ))}
              <Command.Group
                heading="Account"
                className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-ink-3"
              >
                <Command.Item
                  onSelect={() => run(() => navigate("/settings"))}
                  className={itemClassName}
                >
                  <Settings aria-hidden />
                  Account settings
                </Command.Item>
                <Command.Item
                  onSelect={() => run(() => setPreference("light"))}
                  className={itemClassName}
                >
                  <Sun aria-hidden />
                  Light theme
                </Command.Item>
                <Command.Item
                  onSelect={() => run(() => setPreference("dark"))}
                  className={itemClassName}
                >
                  <Moon aria-hidden />
                  Dark theme
                </Command.Item>
                <Command.Item
                  onSelect={() => run(() => setPreference("system"))}
                  className={itemClassName}
                >
                  <Monitor aria-hidden />
                  System theme
                </Command.Item>
                <Command.Item onSelect={() => run(onSignOut)} className={itemClassName}>
                  <LogOut aria-hidden />
                  Sign out
                </Command.Item>
              </Command.Group>
            </Command.List>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
