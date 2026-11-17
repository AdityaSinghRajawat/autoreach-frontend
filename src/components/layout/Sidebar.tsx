import { NavLink } from "react-router";

import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/cn";

import { useNavigationSections } from "./useNavigationSections";

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const sections = useNavigationSections();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <NavLink to="/" onClick={onNavigate} className="rounded-md">
          <Logo />
        </NavLink>
      </div>
      <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 pb-6">
        {sections.map((section) => (
          <div key={section.title} className="mt-5 first:mt-2">
            <p className="px-3 pb-1.5 text-[11px] font-semibold tracking-wider text-ink-3 uppercase">
              {section.title}
            </p>
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end ?? false}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink",
                        isActive &&
                          "bg-primary-soft text-primary hover:bg-primary-soft hover:text-primary",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive ? (
                          <span
                            className="absolute top-1/2 -left-3 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary"
                            aria-hidden
                          />
                        ) : null}
                        <item.icon className="size-4 shrink-0" aria-hidden />
                        {item.label}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}
