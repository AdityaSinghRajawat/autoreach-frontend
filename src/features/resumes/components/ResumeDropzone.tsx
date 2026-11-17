import { FileUp } from "lucide-react";
import { useId, useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/cn";
import { formatBytes } from "@/lib/format";

const acceptedTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const maxBytes = 4 * 1024 * 1024;

interface ResumeDropzoneProps {
  uploading: boolean;
  onFile: (file: File) => void;
}

export function ResumeDropzone({ uploading, onFile }: ResumeDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const accept = (file: File | undefined) => {
    if (!file) {
      return;
    }
    if (!acceptedTypes.includes(file.type)) {
      toast.error("Upload a PDF or Word (.docx) file.");
      return;
    }
    if (file.size > maxBytes) {
      toast.error(`That file is ${formatBytes(file.size)}. The limit is ${formatBytes(maxBytes)}.`);
      return;
    }
    onFile(file);
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    accept(event.dataTransfer.files[0]);
  };

  return (
    <label
      htmlFor={inputId}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border-strong bg-surface px-6 py-10 text-center transition-colors hover:border-primary hover:bg-primary-soft/40 has-[:focus-visible]:border-primary",
        dragging && "border-primary bg-primary-soft/60",
        uploading && "pointer-events-none opacity-60",
      )}
    >
      <span className="grid size-12 place-items-center rounded-full bg-primary-soft text-primary">
        <FileUp className={cn("size-5", uploading && "animate-bounce")} aria-hidden />
      </span>
      <span className="font-medium">{uploading ? "Uploading…" : "Drop your resume here"}</span>
      <span className="text-sm text-ink-3">
        or <span className="text-primary underline-offset-4 hover:underline">browse</span> · PDF or
        DOCX up to {formatBytes(maxBytes)}
      </span>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="sr-only"
        disabled={uploading}
        onChange={(event) => {
          accept(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </label>
  );
}
