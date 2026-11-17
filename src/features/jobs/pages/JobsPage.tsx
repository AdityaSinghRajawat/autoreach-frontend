import { BriefcaseBusiness, ChevronRight, MapPin, UsersRound } from "lucide-react";
import { Link } from "react-router";

import { useCandidateId } from "@/api/session";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { ListSkeleton } from "@/components/feedback/ListSkeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { buttonVariants } from "@/components/ui/buttonVariants";
import { Select } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { ScoreMeter } from "@/components/ui/ScoreMeter";
import { ApplicationStatusBadge } from "@/features/applications/components/ApplicationStatusBadge";
import { cn } from "@/lib/cn";
import { formatRelative, humanize } from "@/lib/format";
import { usePageParam, useSearchParam } from "@/lib/useSearchParam";

import { useMatchedJobs, type MatchedJob } from "../api";

const thresholds = ["0.5", "0.6", "0.7", "0.8", "0.9"];

export function JobsPage() {
  const candidateId = useCandidateId();
  const [page, setPage] = usePageParam();
  const [minScoreParam, setMinScore] = useSearchParam("minScore");
  const minScore =
    minScoreParam && thresholds.includes(minScoreParam) ? Number(minScoreParam) : null;
  const jobs = useMatchedJobs(candidateId, page, minScore);

  return (
    <>
      <PageHeader
        title="Matched jobs"
        description="Jobs scored against your active resume, best matches first."
        actions={
          <label className="flex items-center gap-2 text-sm text-ink-2">
            <span className="whitespace-nowrap">Show matches from</span>
            <Select
              value={minScoreParam ?? ""}
              onChange={(event) => setMinScore(event.target.value || null)}
              className="h-9 w-40"
            >
              <option value="">My threshold</option>
              {thresholds.map((value) => (
                <option key={value} value={value}>
                  {Math.round(Number(value) * 100)}% and up
                </option>
              ))}
            </Select>
          </label>
        }
      />

      {jobs.isPending ? (
        <ListSkeleton rows={6} rowClassName="h-20" />
      ) : jobs.isError ? (
        <ErrorState error={jobs.error} onRetry={() => void jobs.refetch()} />
      ) : jobs.data.items.length === 0 ? (
        <EmptyState
          icon={BriefcaseBusiness}
          title={minScore === null ? "No matches yet" : "No matches at this score"}
          description={
            minScore === null
              ? "Matches appear once your resume is ready and new jobs come in. Lowering your threshold in Profile shows more."
              : "Try a lower score to see more jobs."
          }
          action={
            minScore === null ? (
              <Link to="/resumes" className={buttonVariants({ variant: "secondary" })}>
                Check your resume
              </Link>
            ) : null
          }
        />
      ) : (
        <>
          <ul
            className={cn(
              "flex flex-col gap-2 transition-opacity",
              jobs.isPlaceholderData && "opacity-60",
            )}
          >
            {jobs.data.items.map((job) => (
              <li key={job.jobId}>
                <JobRow job={job} />
              </li>
            ))}
          </ul>
          <Pagination meta={jobs.data.meta} onPageChange={setPage} noun="jobs" />
        </>
      )}
    </>
  );
}

function JobRow({ job }: { job: MatchedJob }) {
  return (
    <Link
      to={`/jobs/${job.jobId}`}
      state={{ matchScore: job.matchScore, applicationStatus: job.applicationStatus }}
      className="group flex items-center gap-4 rounded-lg border border-border bg-surface p-4 transition-[border-color,box-shadow] hover:border-border-strong hover:shadow-sm"
    >
      <ScoreMeter score={job.matchScore} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-ink group-hover:text-primary">{job.jobTitle}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-2">
          <span className="font-medium text-ink-2">{job.companyName}</span>
          {job.location ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden />
              {job.location}
            </span>
          ) : null}
          <span className="text-ink-3">matched {formatRelative(job.createdAt)}</span>
        </p>
      </div>
      <div className="hidden shrink-0 items-center gap-2 sm:flex">
        {job.discoveredContactsCount > 0 ? (
          <Badge>
            <UsersRound className="size-3" aria-hidden />
            {job.discoveredContactsCount}
          </Badge>
        ) : null}
        {job.applicationStatus ? (
          <ApplicationStatusBadge status={job.applicationStatus} />
        ) : (
          <Badge>{humanize(job.atsType)}</Badge>
        )}
      </div>
      <ChevronRight className="size-4 shrink-0 text-ink-3" aria-hidden />
    </Link>
  );
}
