import { cn } from "@/lib/cn";

interface FilterChipsProps<Value extends string> {
  label: string;
  options: { value: Value | null; label: string }[];
  value: Value | null;
  onChange: (value: Value | null) => void;
}

// A single-choice filter shown as a scrollable row of chips.
export function FilterChips<Value extends string>({
  label,
  options,
  value,
  onChange,
}: FilterChipsProps<Value>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="-mx-1 mb-5 flex [scrollbar-width:none] gap-1.5 overflow-x-auto px-1 pb-1"
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <button
            key={option.value ?? "all"}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-8 shrink-0 rounded-full border px-3.5 text-sm whitespace-nowrap transition-colors",
              selected
                ? "border-ink bg-ink text-bg"
                : "border-border bg-surface text-ink-2 hover:border-border-strong hover:text-ink",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
