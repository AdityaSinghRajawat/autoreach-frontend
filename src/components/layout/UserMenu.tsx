import { LogOut, Monitor, Moon, Settings, Sun } from "lucide-react";
import { useNavigate } from "react-router";

import { useSession } from "@/api/session";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { useTheme, type ThemePreference } from "@/lib/theme";

const themes: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

interface UserMenuProps {
  onSignOut: () => void;
}

export function UserMenu({ onSignOut }: UserMenuProps) {
  const navigate = useNavigate();
  const user = useSession((state) => state.user);
  const { preference, setPreference } = useTheme();
  const email = user?.email ?? "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="grid size-9 place-items-center rounded-full bg-primary-soft font-display text-sm font-semibold text-primary uppercase ring-offset-2 ring-offset-bg hover:ring-2 hover:ring-border-strong"
        aria-label="Account menu"
      >
        {email.charAt(0) || "?"}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuLabel>
          Signed in as
          <span className="block truncate text-sm font-medium text-ink">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate("/settings")}>
          <Settings aria-hidden />
          Account settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="flex gap-1 p-1" role="group" aria-label="Theme">
          {themes.map((theme) => (
            <button
              key={theme.value}
              type="button"
              onClick={() => setPreference(theme.value)}
              aria-pressed={preference === theme.value}
              className="flex flex-1 flex-col items-center gap-1 rounded-md py-2 text-xs text-ink-2 hover:bg-surface-2 aria-pressed:bg-primary-soft aria-pressed:text-primary"
            >
              <theme.icon className="size-4" aria-hidden />
              {theme.label}
            </button>
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onSelect={onSignOut}>
          <LogOut aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
