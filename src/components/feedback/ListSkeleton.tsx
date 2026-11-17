import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";

interface ListSkeletonProps {
  rows?: number;
  rowClassName?: string;
}

export function ListSkeleton({ rows = 5, rowClassName }: ListSkeletonProps) {
  return (
    <div role="status" aria-label="Loading" className="flex flex-col gap-3">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className={cn("h-16", rowClassName)} />
      ))}
    </div>
  );
}
