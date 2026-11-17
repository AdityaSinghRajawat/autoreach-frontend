import { cn } from "@/lib/cn";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
}

// The mark is the Reach Path in miniature: three stations joined by one track, the last one live.
export function Logo({ className, showWordmark = true }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden>
        <rect width="32" height="32" rx="9" className="fill-primary" />
        <path
          d="M8 22c4 0 5-12 9-12s4 7 7 7"
          fill="none"
          strokeWidth="2.2"
          strokeLinecap="round"
          className="stroke-primary-ink/70"
        />
        <circle cx="8" cy="22" r="2.6" className="fill-primary-ink" />
        <circle cx="17" cy="10" r="2.6" className="fill-primary-ink" />
        <circle cx="24" cy="17" r="3" className="fill-ember" />
      </svg>
      {showWordmark ? (
        <span className="font-display text-lg font-semibold tracking-tight text-ink">
          AutoReach
        </span>
      ) : (
        <span className="sr-only">AutoReach</span>
      )}
    </span>
  );
}
