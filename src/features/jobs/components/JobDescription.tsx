import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const collapsedChars = 1_200;

// Descriptions can arrive as HTML from job boards; only their text is shown, never their markup.
function toPlainText(description: string): string {
  if (!/<[a-z][\s\S]*>/i.test(description)) {
    return description.trim();
  }
  const document = new DOMParser().parseFromString(
    description.replace(/<\/(p|div|li|h\d)>|<br\s*\/?>/gi, "\n"),
    "text/html",
  );

  return (document.body.textContent ?? "").replace(/\n{3,}/g, "\n\n").trim();
}

export function JobDescription({ description }: { description: string }) {
  const text = useMemo(() => toPlainText(description), [description]);
  const [expanded, setExpanded] = useState(false);
  const long = text.length > collapsedChars;

  if (!text) {
    return <p className="text-sm text-ink-3">The posting has no description.</p>;
  }

  return (
    <div>
      <div
        className={cn(
          "relative text-sm leading-relaxed whitespace-pre-line text-ink-2",
          long && !expanded && "max-h-80 overflow-hidden",
        )}
      >
        {text}
        {long && !expanded ? (
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-surface to-transparent" />
        ) : null}
      </div>
      {long ? (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={() => setExpanded((value) => !value)}
        >
          <ChevronDown
            className={cn("transition-transform", expanded && "rotate-180")}
            aria-hidden
          />
          {expanded ? "Show less" : "Read the full description"}
        </Button>
      ) : null}
    </div>
  );
}
