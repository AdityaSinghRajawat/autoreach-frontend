import type { ComponentType } from "react";
import { createBrowserRouter, type RouteObject } from "react-router";

import { NotFoundPage } from "@/components/feedback/StatusPage";

import { AppShell } from "./AppShell";
import { PublicOnly, RequireAdmin, RequireAuth, RequireCandidate, SessionGate } from "./guards";
import { RouteError } from "./RouteError";

type PageLoader = () => Promise<ComponentType>;

// Each page is its own chunk, fetched the first time its route is visited.
function route(path: string, load: PageLoader): RouteObject {
  return { path, lazy: async () => ({ Component: await load() }) };
}

function indexRoute(load: PageLoader): RouteObject {
  return { index: true, lazy: async () => ({ Component: await load() }) };
}

const authRoutes: RouteObject[] = [
  route("login", () => import("@/features/auth/pages/LoginPage").then((m) => m.LoginPage)),
  route("register", () => import("@/features/auth/pages/RegisterPage").then((m) => m.RegisterPage)),
  route("check-email", () =>
    import("@/features/auth/pages/CheckEmailPage").then((m) => m.CheckEmailPage),
  ),
  route("forgot-password", () =>
    import("@/features/auth/pages/ForgotPasswordPage").then((m) => m.ForgotPasswordPage),
  ),
];

// Emailed links work whether or not someone is signed in on this browser.
const linkRoutes: RouteObject[] = [
  route("verify-email", () =>
    import("@/features/auth/pages/VerifyEmailPage").then((m) => m.VerifyEmailPage),
  ),
  route("reset-password", () =>
    import("@/features/auth/pages/ResetPasswordPage").then((m) => m.ResetPasswordPage),
  ),
];

const candidateRoutes: RouteObject[] = [
  indexRoute(() => import("@/features/dashboard/pages/HomePage").then((m) => m.HomePage)),
  route("jobs", () => import("@/features/jobs/pages/JobsPage").then((m) => m.JobsPage)),
  route("jobs/:jobId", () =>
    import("@/features/jobs/pages/JobDetailPage").then((m) => m.JobDetailPage),
  ),
  route("applications", () =>
    import("@/features/applications/pages/ApplicationsPage").then((m) => m.ApplicationsPage),
  ),
  route("applications/:applicationId", () =>
    import("@/features/applications/pages/ApplicationDetailPage").then(
      (m) => m.ApplicationDetailPage,
    ),
  ),
  route("outreach", () =>
    import("@/features/outreach/pages/MessagesPage").then((m) => m.MessagesPage),
  ),
  route("outreach/linkedin", () =>
    import("@/features/outreach/pages/LinkedinQueuePage").then((m) => m.LinkedinQueuePage),
  ),
  route("outreach/campaigns", () =>
    import("@/features/outreach/pages/CampaignsPage").then((m) => m.CampaignsPage),
  ),
  route("outreach/templates", () =>
    import("@/features/outreach/pages/TemplatesPage").then((m) => m.TemplatesPage),
  ),
  route("contacts", () =>
    import("@/features/contacts/pages/ContactsPage").then((m) => m.ContactsPage),
  ),
  route("mailboxes", () =>
    import("@/features/mailboxes/pages/MailboxesPage").then((m) => m.MailboxesPage),
  ),
  route("resumes", () => import("@/features/resumes/pages/ResumesPage").then((m) => m.ResumesPage)),
  route("profile", () => import("@/features/profile/pages/ProfilePage").then((m) => m.ProfilePage)),
];

const accountRoutes: RouteObject[] = [
  route("settings", () =>
    import("@/features/account/pages/SettingsPage").then((m) => m.SettingsPage),
  ),
  route("settings/email/confirm", () =>
    import("@/features/account/pages/ConfirmEmailChangePage").then((m) => m.ConfirmEmailChangePage),
  ),
];

const adminRoutes: RouteObject[] = [
  indexRoute(() =>
    import("@/features/admin/pages/AdminConsolePage").then((m) => m.AdminConsolePage),
  ),
  route("queues/:queue", () =>
    import("@/features/admin/pages/DeadTasksPage").then((m) => m.DeadTasksPage),
  ),
  route("job-sources", () =>
    import("@/features/admin/pages/JobSourcesPage").then((m) => m.JobSourcesPage),
  ),
  route("api-clients", () =>
    import("@/features/admin/pages/ApiClientsPage").then((m) => m.ApiClientsPage),
  ),
  route("suppressions", () =>
    import("@/features/admin/pages/SuppressionsPage").then((m) => m.SuppressionsPage),
  ),
  route("contacts", () =>
    import("@/features/admin/pages/AdminContactsPage").then((m) => m.AdminContactsPage),
  ),
];

export const routes: RouteObject[] = [
  {
    Component: SessionGate,
    ErrorBoundary: RouteError,
    children: [
      { Component: PublicOnly, children: authRoutes },
      ...linkRoutes,
      {
        Component: RequireAuth,
        children: [
          {
            Component: AppShell,
            children: [
              {
                // Inside the shell, so a broken page keeps the navigation around it.
                ErrorBoundary: RouteError,
                children: [
                  { Component: RequireCandidate, children: candidateRoutes },
                  ...accountRoutes,
                  { path: "admin", Component: RequireAdmin, children: adminRoutes },
                  { path: "*", Component: NotFoundPage },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

export function createRouter() {
  return createBrowserRouter(routes);
}
