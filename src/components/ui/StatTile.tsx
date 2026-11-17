import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import { Skeleton } from "./Skeleton";

interface StatTileProps {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  detail?: ReactNode;
  loading?: boolean;
  accent?: boolean;
}

export function StatTile({
  label,
  value,
  icon: Icon,
  detail,
  loading = false,
  accent = false,
}: StatTileProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border bg-surface p-4",
        accent && "border-transparent bg-gradient-to-br from-primary to-[#5b43d6] text-primary-ink",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={cn("text-sm", accent ? "text-primary-ink/80" : "text-ink-2")}>
          {label}
        </span>
        <Icon className={cn("size-4", accent ? "text-primary-ink/70" : "text-ink-3")} aria-hidden />
      </div>
      {loading ? (
        <Skeleton className="h-8 w-20" />
      ) : (
        <span className="font-mono text-2xl font-semibold tabular">{value}</span>
      )}
      {detail ? (
        <span className={cn("text-xs", accent ? "text-primary-ink/70" : "text-ink-3")}>
          {detail}
        </span>
      ) : null}
    </div>
  );
}
