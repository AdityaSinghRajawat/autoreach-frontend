import {
  Archive,
  BadgeCheck,
  Layers,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useCandidateId } from "@/api/session";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { ListSkeleton } from "@/components/feedback/ListSkeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { FilterChips } from "@/components/ui/FilterChips";
import { cn } from "@/lib/cn";
import { formatRelative } from "@/lib/format";

import { useDeleteTemplate, useTemplates, useUpdateTemplate, type Template } from "../api";
import { TemplateDialog } from "../components/TemplateDialog";
import { channelLabels } from "../placeholders";
import { channelIcons, templateStatusLooks } from "../status";

type View = "current" | "ARCHIVED";

export function TemplatesPage() {
  const candidateId = useCandidateId();
  const templates = useTemplates(candidateId);
  const update = useUpdateTemplate(candidateId);
  const remove = useDeleteTemplate(candidateId);
  const [view, setView] = useState<View | null>("current");
  const [editing, setEditing] = useState<Template | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Template | null>(null);

  const setStatus = (template: Template, status: Template["status"]) =>
    update.mutate(
      { templateId: template.templateId, body: { status } },
      {
        onSuccess: () =>
          toast.success(
            status === "APPROVED"
              ? `${template.name} approved`
              : status === "ARCHIVED"
                ? `${template.name} archived`
                : `${template.name} moved back to draft`,
          ),
        onError: (error) => toast.error(error.message),
      },
    );

  const visible =
    templates.data?.filter((template) =>
      view === "ARCHIVED" ? template.status === "ARCHIVED" : template.status !== "ARCHIVED",
    ) ?? [];

  return (
    <>
      <PageHeader
        title="Templates"
        description="Reusable messages with placeholders that are filled in for each person."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus aria-hidden />
            New template
          </Button>
        }
      />
      <FilterChips<View>
        label="Show templates"
        options={[
          { value: "current", label: "Drafts and approved" },
          { value: "ARCHIVED", label: "Archived" },
        ]}
        value={view}
        onChange={(value) => setView(value ?? "current")}
      />

      {templates.isPending ? (
        <ListSkeleton rows={4} rowClassName="h-32" />
      ) : templates.isError ? (
        <ErrorState error={templates.error} onRetry={() => void templates.refetch()} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Layers}
          title={view === "ARCHIVED" ? "No archived templates" : "No templates yet"}
          description="Write one for your first email, a LinkedIn note, and a follow-up. Campaigns are built from them."
          action={
            view === "ARCHIVED" ? null : (
              <Button variant="secondary" onClick={() => setCreating(true)}>
                Write a template
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((template) => {
            const Icon = channelIcons[template.channel];
            const status = templateStatusLooks[template.status];

            return (
              <Card key={template.templateId} className="flex flex-col gap-3 p-5">
                <div className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-sans text-base font-semibold">{template.name}</h3>
                    <p className="text-xs text-ink-3">
                      {channelLabels[template.channel]} · edited{" "}
                      {formatRelative(template.updatedAt)}
                    </p>
                  </div>
                  <Badge tone={status.tone} dot>
                    {status.label}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Actions for ${template.name}`}
                      >
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onSelect={() => setEditing(template)}>
                        <Pencil aria-hidden />
                        Edit
                      </DropdownMenuItem>
                      {template.status === "APPROVED" ? (
                        <DropdownMenuItem onSelect={() => setStatus(template, "DRAFT")}>
                          <RotateCcw aria-hidden />
                          Back to draft
                        </DropdownMenuItem>
                      ) : null}
                      {template.status === "ARCHIVED" ? (
                        <DropdownMenuItem onSelect={() => setStatus(template, "DRAFT")}>
                          <RotateCcw aria-hidden />
                          Restore as draft
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onSelect={() => setStatus(template, "ARCHIVED")}>
                          <Archive aria-hidden />
                          Archive
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem destructive onSelect={() => setDeleting(template)}>
                        <Trash2 aria-hidden />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {template.subject ? (
                  <p className="truncate text-sm font-medium">{template.subject}</p>
                ) : null}
                <p className={cn("line-clamp-3 text-sm whitespace-pre-line text-ink-2")}>
                  {template.body}
                </p>
                {template.status === "DRAFT" ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-auto self-start"
                    loading={
                      update.isPending && update.variables.templateId === template.templateId
                    }
                    onClick={() => setStatus(template, "APPROVED")}
                  >
                    <BadgeCheck aria-hidden />
                    Approve
                  </Button>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}

      <TemplateDialog
        candidateId={candidateId}
        open={creating || editing !== null}
        template={editing}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
            setEditing(null);
          }
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.name ?? "template"}?`}
        description="Templates used by a campaign can't be deleted; archive them instead."
        confirmLabel="Delete"
        destructive
        pending={remove.isPending}
        onConfirm={() =>
          deleting && remove.mutate(deleting.templateId, { onSettled: () => setDeleting(null) })
        }
      />
    </>
  );
}
