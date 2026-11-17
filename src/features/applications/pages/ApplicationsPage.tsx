import { ChevronRight, ClipboardCheck } from "lucide-react";
import { Link } from "react-router";

import { useCandidateId } from "@/api/session";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { ListSkeleton } from "@/components/feedback/ListSkeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { buttonVariants } from "@/components/ui/buttonVariants";
import { FilterChips } from "@/components/ui/FilterChips";
import { Pagination } from "@/components/ui/Pagination";
import { ScoreMeter } from "@/components/ui/ScoreMeter";
import { cn } from "@/lib/cn";
import { formatRelative } from "@/lib/format";
import { usePageParam, useSearchParam } from "@/lib/useSearchParam";

import { useApplications, type ApplicationStatus } from "../api";
import { ApplicationStatusBadge } from "../components/ApplicationStatusBadge";

const filters: { value: ApplicationStatus | null; label: string }[] = [
  { value: null, label: "All" },
  { value: "ACTION_REQUIRED", label: "Ready to submit" },
  { value: "IN_PROGRESS", label: "Preparing" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "INTERVIEWING", label: "Interviewing" },
  { value: "FAILED", label: "Failed" },
  { value: "REJECTED", label: "Closed" },
];

export function ApplicationsPage() {
  const candidateId = useCandidateId();
  const [page, setPage] = usePageParam();
  const [statusParam, setStatus] = useSearchParam("status");
  const status = filters.find((filter) => filter.value === statusParam)?.value ?? null;
  const applications = useApplications(candidateId, status, page);

  return (
    <>
      <PageHeader
        title="Applications"
        description="Applications AutoReach prepared or submitted for you, and where each one stands."
      />
      <FilterChips label="Filter by status" options={filters} value={status} onChange={setStatus} />

      {applications.isPending ? (
        <ListSkeleton rows={6} />
      ) : applications.isError ? (
        <ErrorState error={applications.error} onRetry={() => void applications.refetch()} />
      ) : applications.data.items.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title={status ? "Nothing with this status" : "No applications yet"}
          description={
            status
              ? "Try another filter."
              : "Apply from a matched job, or turn on automatic applying in your profile."
          }
          action={
            status ? null : (
              <Link to="/jobs" className={buttonVariants({ variant: "secondary" })}>
                Browse matched jobs
              </Link>
            )
          }
        />
      ) : (
        <>
          <ul
            className={cn(
              "flex flex-col gap-2 transition-opacity",
              applications.isPlaceholderData && "opacity-60",
            )}
          >
            {applications.data.items.map((application) => (
              <li key={application.applicationId}>
                <Link
                  to={`/applications/${application.applicationId}`}
                  className="group flex items-center gap-4 rounded-lg border border-border bg-surface p-4 transition-[border-color,box-shadow] hover:border-border-strong hover:shadow-sm"
                >
                  <ScoreMeter score={application.matchScore} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium group-hover:text-primary">
                      {application.job?.jobTitle ?? "Job no longer available"}
                    </p>
                    <p className="truncate text-sm text-ink-2">
                      {application.job?.companyName}
                      <span className="text-ink-3">
                        {application.job ? " · " : ""}updated{" "}
                        {formatRelative(application.updatedAt)}
                      </span>
                    </p>
                  </div>
                  <ApplicationStatusBadge status={application.status} />
                  <ChevronRight
                    className="hidden size-4 shrink-0 text-ink-3 sm:block"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
          <Pagination meta={applications.data.meta} onPageChange={setPage} noun="applications" />
        </>
      )}
    </>
  );
}
