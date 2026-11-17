import { ChevronLeft, ChevronRight } from "lucide-react";

import type { PaginationMeta } from "@/api/types";
import { formatNumber } from "@/lib/format";

import { Button } from "./Button";

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  noun?: string;
}

export function Pagination({ meta, onPageChange, noun = "results" }: PaginationProps) {
  if (meta.totalPages <= 1) {
    return null;
  }

  const first = (meta.page - 1) * meta.perPage + 1;
  const last = Math.min(meta.page * meta.perPage, meta.totalItems);

  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-4">
      <p className="text-sm text-ink-3">
        <span className="tabular">
          {formatNumber(first)}–{formatNumber(last)}
        </span>{" "}
        of <span className="tabular">{formatNumber(meta.totalItems)}</span> {noun}
      </p>
      <div className="flex gap-1">
        <Button
          variant="secondary"
          size="icon"
          disabled={meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPageChange(meta.page + 1)}
          aria-label="Next page"
        >
          <ChevronRight />
        </Button>
      </div>
    </nav>
  );
}
