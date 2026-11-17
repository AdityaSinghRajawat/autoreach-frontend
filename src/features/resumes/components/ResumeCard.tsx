import { FileText, LoaderCircle, MoreHorizontal, Star, Trash2 } from "lucide-react";

import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { cn } from "@/lib/cn";
import { formatBytes, formatDate } from "@/lib/format";

import { isProcessing, type Resume } from "../api";

const statusLooks: Record<Resume["status"], { label: string; tone: BadgeTone }> = {
  UPLOADED: { label: "Reading", tone: "primary" },
  PARSED: { label: "Preparing for matching", tone: "primary" },
  EMBEDDED: { label: "Ready", tone: "success" },
  FAILED: { label: "Couldn't read", tone: "danger" },
};

const visibleSkills = 14;

interface ResumeCardProps {
  resume: Resume;
  activating: boolean;
  onActivate: () => void;
  onDelete: () => void;
}

export function ResumeCard({ resume, activating, onActivate, onDelete }: ResumeCardProps) {
  const status = statusLooks[resume.status];
  const metadata = resume.parsedMetadata;
  const skills = metadata.skills ?? [];
  const canActivate = !resume.isActive && resume.status === "EMBEDDED";

  return (
    <Card className={cn("p-5", resume.isActive && "border-primary/60 ring-1 ring-primary/30")}>
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-surface-2 text-ink-2">
          <FileText className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-sans text-base font-semibold">{resume.fileName}</h3>
            {resume.isActive ? (
              <Badge tone="primary">
                <Star className="size-3 fill-current" aria-hidden />
                Active
              </Badge>
            ) : null}
            <Badge tone={status.tone} dot={!isProcessing(resume)}>
              {isProcessing(resume) ? (
                <LoaderCircle className="size-3 animate-spin" aria-hidden />
              ) : null}
              {status.label}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-ink-3">
            {formatBytes(resume.sizeBytes)} · uploaded {formatDate(resume.createdAt)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {canActivate ? (
            <Button variant="secondary" size="sm" loading={activating} onClick={onActivate}>
              Use for matching
            </Button>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Actions for ${resume.fileName}`}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem destructive onSelect={onDelete}>
                <Trash2 aria-hidden />
                Delete resume
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {resume.status === "FAILED" && resume.failureReason ? (
        <p className="mt-4 rounded-md bg-danger-soft px-3 py-2 text-sm text-ink">
          {resume.failureReason}
        </p>
      ) : null}

      {skills.length > 0 || metadata.jobTitles?.length ? (
        <dl className="mt-5 grid gap-4 border-t border-border pt-4 sm:grid-cols-[1fr_2fr]">
          <div className="flex flex-col gap-3">
            {metadata.yearsOfExperience != null ? (
              <div>
                <dt className="text-xs text-ink-3">Experience</dt>
                <dd className="font-mono text-sm font-medium">
                  {metadata.yearsOfExperience} years
                </dd>
              </div>
            ) : null}
            {metadata.jobTitles?.length ? (
              <div>
                <dt className="text-xs text-ink-3">Titles</dt>
                <dd className="text-sm">{metadata.jobTitles.slice(0, 4).join(", ")}</dd>
              </div>
            ) : null}
          </div>
          {skills.length > 0 ? (
            <div>
              <dt className="text-xs text-ink-3">Skills found</dt>
              <dd className="mt-1.5 flex flex-wrap gap-1.5">
                {skills.slice(0, visibleSkills).map((skill) => (
                  <Badge key={skill}>{skill}</Badge>
                ))}
                {skills.length > visibleSkills ? (
                  <Badge tone="neutral">+{skills.length - visibleSkills} more</Badge>
                ) : null}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </Card>
  );
}
