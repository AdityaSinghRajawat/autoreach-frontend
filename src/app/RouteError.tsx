import { Compass, TriangleAlert } from "lucide-react";
import { isRouteErrorResponse, useRouteError } from "react-router";

import { StatusPage } from "@/components/feedback/StatusPage";

// Catches render errors and failed page loads so one broken page never blanks the whole app.
export function RouteError() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  if (!notFound) {
    console.error(error);
  }

  return (
    <StatusPage
      icon={notFound ? Compass : TriangleAlert}
      title={notFound ? "This page doesn't exist" : "Something broke on this page"}
      description={
        notFound
          ? "The link may be old, or the page has moved."
          : "Reloading usually fixes it. If it keeps happening, the problem is on our side."
      }
      reload={!notFound}
    />
  );
}
