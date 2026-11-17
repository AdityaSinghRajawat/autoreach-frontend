import { useNavigation } from "react-router";

// A thin bar along the top while the next page's code loads.
export function NavigationProgress() {
  const loading = useNavigation().state !== "idle";

  return (
    <div
      role="progressbar"
      aria-label="Loading page"
      aria-hidden={!loading}
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden"
    >
      {loading ? (
        <div className="h-full w-1/3 animate-[progress_1s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-primary to-ember" />
      ) : null}
    </div>
  );
}
