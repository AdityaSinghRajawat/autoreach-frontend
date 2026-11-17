import { useCallback } from "react";
import { useSearchParams } from "react-router";

// List state lives in the URL, so filters and pages survive reloads and can be shared as links.
export function useSearchParam(name: string): [string | null, (value: string | null) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const setValue = useCallback(
    (value: string | null) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (value === null || value === "") {
            next.delete(name);
          } else {
            next.set(name, value);
          }
          if (name !== "page") {
            next.delete("page");
          }

          return next;
        },
        { replace: true },
      );
    },
    [name, setSearchParams],
  );

  return [searchParams.get(name), setValue];
}

export function usePageParam(): [number, (page: number) => void] {
  const [raw, setRaw] = useSearchParam("page");
  const parsed = Number(raw);
  const page = Number.isInteger(parsed) && parsed > 0 ? parsed : 1;

  const setPage = useCallback(
    (next: number) => {
      setRaw(next <= 1 ? null : String(next));
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [setRaw],
  );

  return [page, setPage];
}
