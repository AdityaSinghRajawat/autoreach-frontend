import { cn } from "@/lib/cn";

interface MeterProps {
  value: number;
  max: number;
  label: string;
  className?: string;
}

// A horizontal usage bar; it turns amber past 75% and red past 90%.
export function Meter({ value, max, label, className }: MeterProps) {
  const ratio = max > 0 ? Math.min(value / max, 1) : 0;
  const tone = ratio > 0.9 ? "bg-danger" : ratio > 0.75 ? "bg-warning" : "bg-primary";

  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn("h-1.5 overflow-hidden rounded-full bg-track", className)}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", tone)}
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  );
}
