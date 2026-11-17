const numberFormat = new Intl.NumberFormat();
const compactFormat = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
});
const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});
const relativeFormat = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

export function formatCompact(value: number): string {
  return value < 10_000 ? numberFormat.format(value) : compactFormat.format(value);
}

export function formatPercent(value: number, fractionDigits = 0): string {
  return `${value.toFixed(fractionDigits)}%`;
}

// A 0..1 score shown as a whole percentage.
export function formatScore(score: number): string {
  return `${Math.round(score * 100)}%`;
}

export function formatDate(value: string | null | undefined): string {
  return value ? dateFormat.format(new Date(value)) : "—";
}

export function formatDateTime(value: string | null | undefined): string {
  return value ? dateTimeFormat.format(new Date(value)) : "—";
}

const relativeSteps: [Intl.RelativeTimeFormatUnit, number][] = [
  ["second", 60],
  ["minute", 60],
  ["hour", 24],
  ["day", 7],
  ["week", 4.35],
  ["month", 12],
  ["year", Number.POSITIVE_INFINITY],
];

export function formatRelative(value: string, now = Date.now()): string {
  let amount = (new Date(value).getTime() - now) / 1000;

  for (const [unit, size] of relativeSteps) {
    if (Math.abs(amount) < size) {
      return unit === "second" && Math.abs(amount) < 45
        ? "just now"
        : relativeFormat.format(Math.round(amount), unit);
    }
    amount /= size;
  }

  return formatDate(value);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kilobytes = bytes / 1024;

  return kilobytes < 1024 ? `${kilobytes.toFixed(0)} KB` : `${(kilobytes / 1024).toFixed(1)} MB`;
}

// SCREAMING_SNAKE enum values read as sentence case: "ACTION_REQUIRED" -> "Action required".
export function humanize(value: string): string {
  const words = value.toLowerCase().replaceAll("_", " ");

  return words.charAt(0).toUpperCase() + words.slice(1);
}
