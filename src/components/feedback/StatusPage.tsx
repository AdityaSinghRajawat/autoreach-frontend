import { Compass } from "lucide-react";
import { Link } from "react-router";

import { buttonVariants } from "@/components/ui/buttonVariants";

export function NotFoundPage() {
  return (
    <StatusPage
      icon={Compass}
      title="This page doesn't exist"
      description="The link may be old, or the page has moved."
    />
  );
}

interface StatusPageProps {
  icon: typeof Compass;
  title: string;
  description: string;
  reload?: boolean;
}

export function StatusPage({ icon: Icon, title, description, reload = false }: StatusPageProps) {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4 py-16">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-surface-2 text-ink-2">
          <Icon className="size-6" aria-hidden />
        </span>
        <h1 className="font-display text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-ink-2">{description}</p>
        <div className="mt-2 flex gap-2">
          {reload ? (
            <button
              type="button"
              className={buttonVariants({ variant: "primary" })}
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          ) : null}
          <Link to="/" className={buttonVariants({ variant: reload ? "secondary" : "primary" })}>
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
