import { Plus, RefreshCw, Rss, Trash2 } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { ListSkeleton } from "@/components/feedback/ListSkeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Switch } from "@/components/ui/Switch";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Tooltip } from "@/components/ui/Tooltip";
import { formatNumber, formatRelative } from "@/lib/format";

import {
  useDeleteJobSource,
  useJobSources,
  usePollJobSource,
  useUpdateJobSource,
  type JobSource,
} from "../api";
import { boardTypes } from "../boardTypes";
import { JobSourceDialog } from "../components/JobSourceDialog";

export function JobSourcesPage() {
  const sources = useJobSources();
  const update = useUpdateJobSource();
  const poll = usePollJobSource();
  const remove = useDeleteJobSource();
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<JobSource | null>(null);

  return (
    <>
      <PageHeader
        title="Job sources"
        description="Job boards and career pages AutoReach polls for new postings."
        actions={
          <Button onClick={() => setAdding(true)}>
            <Plus aria-hidden />
            Add board
          </Button>
        }
      />

      {sources.isPending ? (
        <ListSkeleton rows={5} rowClassName="h-14" />
      ) : sources.isError ? (
        <ErrorState error={sources.error} onRetry={() => void sources.refetch()} />
      ) : sources.data.length === 0 ? (
        <EmptyState
          icon={Rss}
          title="No job boards yet"
          description="Add the Greenhouse, Lever or other boards of companies your candidates want to work at."
          action={
            <Button variant="secondary" onClick={() => setAdding(true)}>
              Add a board
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHead>
            <tr>
              <TableHeader>Source</TableHeader>
              <TableHeader>Last poll</TableHeader>
              <TableHeader className="text-right">Jobs</TableHeader>
              <TableHeader>Active</TableHeader>
              <TableHeader>
                <span className="sr-only">Actions</span>
              </TableHeader>
            </tr>
          </TableHead>
          <tbody>
            {sources.data.map((source) => (
              <TableRow key={source.sourceId}>
                <TableCell className="max-w-72">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">
                      {source.companyName ?? source.searchQuery ?? source.boardToken}
                    </span>
                    <Badge>{boardTypes[source.boardType].label}</Badge>
                  </div>
                  <p className="truncate font-mono text-xs text-ink-3">{source.boardToken}</p>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {source.lastError ? (
                    <Tooltip content={source.lastError}>
                      <button
                        type="button"
                        className="rounded-full"
                        aria-label={`Last poll failed: ${source.lastError}`}
                      >
                        <Badge tone="danger" dot>
                          Failed
                        </Badge>
                      </button>
                    </Tooltip>
                  ) : source.lastPolledAt ? (
                    <span className="text-ink-2">{formatRelative(source.lastPolledAt)}</span>
                  ) : (
                    <span className="text-ink-3">Not yet</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono tabular">
                  {source.lastJobCount === null ? "—" : formatNumber(source.lastJobCount)}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={source.isActive}
                    disabled={update.isPending && update.variables.sourceId === source.sourceId}
                    onCheckedChange={(isActive) =>
                      update.mutate({ sourceId: source.sourceId, body: { isActive } })
                    }
                    aria-label={`Poll ${source.companyName ?? source.boardToken}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={poll.isPending && poll.variables === source.sourceId}
                      onClick={() => poll.mutate(source.sourceId)}
                    >
                      <RefreshCw aria-hidden />
                      Poll now
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setRemoving(source)}
                      aria-label={`Remove ${source.companyName ?? source.boardToken}`}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      )}

      <JobSourceDialog open={adding} onOpenChange={setAdding} />

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title="Remove this job board?"
        description="It stops being polled. Jobs already collected from it are kept."
        confirmLabel="Remove"
        destructive
        pending={remove.isPending}
        onConfirm={() =>
          removing && remove.mutate(removing.sourceId, { onSuccess: () => setRemoving(null) })
        }
      />
    </>
  );
}
