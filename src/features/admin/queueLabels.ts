import type { QueueName } from "./api";

export const queueLabels: Record<QueueName, { title: string; detail: string }> = {
  embedding_queue: { title: "Embedding", detail: "Reading resumes and jobs" },
  matching_queue: { title: "Matching", detail: "Scoring jobs for candidates" },
  enrichment_queue: { title: "Enrichment", detail: "Finding contacts and job boards" },
  outreach_queue: { title: "Outreach", detail: "Sending email and checking replies" },
  application_queue: { title: "Applications", detail: "Preparing and submitting" },
};

export function isQueueName(value: string | undefined): value is QueueName {
  return value !== undefined && value in queueLabels;
}
