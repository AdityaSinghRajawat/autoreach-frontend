import { create } from "zustand";

export type ThemePreference = "light" | "dark" | "system";

const themeKey = "autoreach.theme";
const darkQuery = "(prefers-color-scheme: dark)";

interface ThemeState {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

export const useTheme = create<ThemeState>((set) => ({
  preference: readPreference(),
  setPreference: (preference) => {
    try {
      localStorage.setItem(themeKey, preference);
    } catch {
      // The choice then lasts for this visit only.
    }
    set({ preference });
    applyTheme(preference);
  },
}));

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(themeKey);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // Fall through to the system default.
  }

  return "system";
}

export function applyTheme(preference: ThemePreference): void {
  const dark =
    preference === "dark" || (preference === "system" && window.matchMedia(darkQuery).matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

// Follows the operating system while the preference is "system".
export function watchSystemTheme(): () => void {
  const media = window.matchMedia(darkQuery);
  const onChange = () => {
    if (useTheme.getState().preference === "system") {
      applyTheme("system");
    }
  };
  media.addEventListener("change", onChange);

  return () => media.removeEventListener("change", onChange);
}
