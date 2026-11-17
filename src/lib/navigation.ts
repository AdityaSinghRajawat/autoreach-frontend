// Only same-origin paths are followed after sign-in, so a crafted ?next= can't send users elsewhere.
export function safeNextPath(next: string | null, fallback = "/"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }

  return next;
}
