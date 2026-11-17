import { ArrowLeft, ChevronDown, CircleCheck, RotateCcw } from "lucide-react";
import { Link, useParams } from "react-router";

import { EmptyState } from "@/components/feedback/EmptyState";
import { NotFoundPage } from "@/components/feedback/StatusPage";
import { ErrorState } from "@/components/feedback/ErrorState";
import { ListSkeleton } from "@/components/feedback/ListSkeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { formatDateTime } from "@/lib/format";
import { usePageParam } from "@/lib/useSearchParam";

import { useDeadTasks, useRetryDeadTask, type QueueName } from "../api";
import { isQueueName, queueLabels } from "../queueLabels";

export function DeadTasksPage() {
  const queue = useParams().queue;

  return isQueueName(queue) ? <DeadTasks queue={queue} /> : <NotFoundPage />;
}

function DeadTasks({ queue }: { queue: QueueName }) {
  const [page, setPage] = usePageParam();
  const tasks = useDeadTasks(queue, page);
  const retry = useRetryDeadTask(queue);

  return (
    <>
      <Link
        to="/admin"
        className="mb-6 inline-flex items-center gap-1.5 rounded-md text-sm text-ink-2 hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Console
      </Link>
      <PageHeader
        title={`${queueLabels[queue].title} · dead tasks`}
        description="Tasks that ran out of retries or failed for good. Fix the cause, then run them again."
      />

      {tasks.isPending ? (
        <ListSkeleton rows={4} rowClassName="h-24" />
      ) : tasks.isError ? (
        <ErrorState error={tasks.error} onRetry={() => void tasks.refetch()} />
      ) : tasks.data.items.length === 0 ? (
        <EmptyState
          icon={CircleCheck}
          title="No dead tasks"
          description="Everything in this queue either finished or is still being retried."
        />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {tasks.data.items.map((task) => (
              <Card key={task.taskId} className="p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="font-mono text-sm font-medium">{task.taskType}</code>
                      <Badge tone="danger">
                        {task.retried}/{task.maxRetry} retries
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-ink-3">
                      {task.lastFailedAt ? `Failed ${formatDateTime(task.lastFailedAt)} · ` : ""}
                      <span className="font-mono">{task.taskId}</span>
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={retry.isPending && retry.variables === task.taskId}
                    onClick={() =>
                      retry.mutate(task.taskId, { onSuccess: () => void tasks.refetch() })
                    }
                  >
                    <RotateCcw aria-hidden />
                    Run again
                  </Button>
                </div>
                <p className="mt-3 rounded-md bg-danger-soft px-3 py-2 font-mono text-xs break-words">
                  {task.lastError}
                </p>
                <details className="group mt-3">
                  <summary className="inline-flex cursor-pointer items-center gap-1 text-xs text-ink-2 select-none hover:text-ink">
                    <ChevronDown
                      className="size-3.5 transition-transform group-open:rotate-180"
                      aria-hidden
                    />
                    Payload
                  </summary>
                  <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-surface-2 p-3 font-mono text-xs">
                    {JSON.stringify(task.payload, null, 2)}
                  </pre>
                </details>
              </Card>
            ))}
          </div>
          <Pagination meta={tasks.data.meta} onPageChange={setPage} noun="tasks" />
        </>
      )}
    </>
  );
}
