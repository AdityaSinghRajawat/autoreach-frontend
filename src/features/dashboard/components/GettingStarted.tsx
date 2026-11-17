import { Check, ChevronRight } from "lucide-react";
import { Link } from "react-router";

import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { useMailboxes } from "@/features/mailboxes/api";
import { useCampaigns, useTemplates } from "@/features/outreach/api";
import { useResumes } from "@/features/resumes/api";
import { cn } from "@/lib/cn";

interface Step {
  title: string;
  detail: string;
  to: string;
  done: boolean;
}

// Shown until the candidate has everything matching and outreach need; then it disappears.
export function GettingStarted({ candidateId }: { candidateId: string }) {
  const resumes = useResumes(candidateId);
  const mailboxes = useMailboxes(candidateId);
  const templates = useTemplates(candidateId);
  const campaigns = useCampaigns(candidateId);

  if (!resumes.data || !mailboxes.data || !templates.data || !campaigns.data) {
    return null;
  }

  const steps: Step[] = [
    {
      title: "Upload your resume",
      detail: "Matching starts once it's been read.",
      to: "/resumes",
      done: resumes.data.some((resume) => resume.isActive && resume.status === "EMBEDDED"),
    },
    {
      title: "Connect a mailbox",
      detail: "The address your outreach is sent from.",
      to: "/mailboxes",
      done: mailboxes.data.some((mailbox) => mailbox.status === "ACTIVE"),
    },
    {
      title: "Write and approve a template",
      detail: "Your first email or LinkedIn note.",
      to: "/outreach/templates",
      done: templates.data.some((template) => template.status === "APPROVED"),
    },
    {
      title: "Start a campaign",
      detail: "Lets AutoReach follow up for you.",
      to: "/outreach/campaigns",
      done: campaigns.data.some((campaign) => campaign.status === "ACTIVE"),
    },
  ];
  const completed = steps.filter((step) => step.done).length;

  if (completed === steps.length) {
    return null;
  }

  return (
    <Card className="mb-6 overflow-hidden">
      <CardHeader>
        <div>
          <CardTitle>Get started</CardTitle>
          <p className="mt-1 text-sm text-ink-2">
            {completed} of {steps.length} done. Each step unlocks more of the Reach Path.
          </p>
        </div>
        <span className="font-mono text-sm text-ink-3 tabular">
          {Math.round((completed / steps.length) * 100)}%
        </span>
      </CardHeader>
      <CardBody>
        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.to}>
              <Link
                to={step.to}
                className={cn(
                  "group flex h-full items-start gap-3 rounded-lg border p-3 transition-colors",
                  step.done
                    ? "border-transparent bg-success-soft"
                    : "border-border hover:border-primary hover:bg-primary-soft/40",
                )}
              >
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full font-mono text-xs font-semibold",
                    step.done ? "bg-success text-white" : "bg-surface-2 text-ink-2",
                  )}
                >
                  {step.done ? <Check className="size-3.5" aria-label="Done" /> : index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block text-sm font-medium",
                      step.done && "text-ink-2 line-through",
                    )}
                  >
                    {step.title}
                  </span>
                  <span className="block text-xs text-ink-3">{step.detail}</span>
                </span>
                {step.done ? null : (
                  <ChevronRight
                    className="mt-0.5 size-4 text-ink-3 group-hover:text-primary"
                    aria-hidden
                  />
                )}
              </Link>
            </li>
          ))}
        </ol>
      </CardBody>
    </Card>
  );
}
