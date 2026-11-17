import { FileText } from "lucide-react";
import { useState } from "react";

import { useCandidateId } from "@/api/session";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { ListSkeleton } from "@/components/feedback/ListSkeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

import {
  useActivateResume,
  useDeleteResume,
  useResumes,
  useUploadResume,
  type Resume,
} from "../api";
import { ResumeCard } from "../components/ResumeCard";
import { ResumeDropzone } from "../components/ResumeDropzone";

export function ResumesPage() {
  const candidateId = useCandidateId();
  const resumes = useResumes(candidateId);
  const upload = useUploadResume(candidateId);
  const activate = useActivateResume(candidateId);
  const remove = useDeleteResume(candidateId);
  const [pendingDelete, setPendingDelete] = useState<Resume | null>(null);

  return (
    <>
      <PageHeader
        title="Resumes"
        description="AutoReach reads your active resume to score every job against it. Upload a new one whenever your experience changes."
      />

      <ResumeDropzone uploading={upload.isPending} onFile={(file) => upload.mutate(file)} />

      <section aria-labelledby="resume-list" className="mt-8">
        <h2 id="resume-list" className="sr-only">
          Your resumes
        </h2>
        {resumes.isPending ? (
          <ListSkeleton rows={2} rowClassName="h-28" />
        ) : resumes.isError ? (
          <ErrorState error={resumes.error} onRetry={() => void resumes.refetch()} />
        ) : resumes.data.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No resume yet"
            description="Upload one above. Matching starts as soon as it's been read."
          />
        ) : (
          <div className="flex flex-col gap-4">
            {resumes.data.map((resume) => (
              <ResumeCard
                key={resume.resumeId}
                resume={resume}
                activating={activate.isPending && activate.variables === resume.resumeId}
                onActivate={() => activate.mutate(resume.resumeId)}
                onDelete={() => setPendingDelete(resume)}
              />
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete this resume?"
        description={
          pendingDelete?.isActive
            ? "This is your active resume. Matching pauses until you activate another one."
            : "The file and what was read from it are removed. Existing matches are kept."
        }
        confirmLabel="Delete"
        destructive
        pending={remove.isPending}
        onConfirm={() =>
          pendingDelete &&
          remove.mutate(pendingDelete.resumeId, { onSuccess: () => setPendingDelete(null) })
        }
      />
    </>
  );
}
