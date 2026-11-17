import { cn } from "@/lib/cn";

interface ScoreMeterProps {
  score: number;
  size?: "sm" | "lg";
  className?: string;
}

const radius = 15.5;
const circumference = 2 * Math.PI * radius;

function scoreTone(score: number): string {
  if (score >= 0.8) {
    return "stroke-success";
  }

  return score >= 0.6 ? "stroke-primary" : "stroke-warning";
}

// A match score (0..1) as a ring, with the percentage in the middle.
export function ScoreMeter({ score, size = "sm", className }: ScoreMeterProps) {
  const clamped = Math.min(Math.max(score, 0), 1);
  const percent = Math.round(clamped * 100);

  return (
    <span
      role="img"
      aria-label={`${percent}% match`}
      className={cn(
        "relative inline-grid shrink-0 place-items-center",
        size === "lg" ? "size-20" : "size-11",
        className,
      )}
    >
      <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="18" cy="18" r={radius} fill="none" strokeWidth="3" className="stroke-track" />
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
          className={cn("transition-[stroke-dashoffset] duration-700", scoreTone(clamped))}
        />
      </svg>
      <span
        className={cn("font-mono font-semibold tabular", size === "lg" ? "text-lg" : "text-xs")}
        aria-hidden
      >
        {percent}
      </span>
    </span>
  );
}
