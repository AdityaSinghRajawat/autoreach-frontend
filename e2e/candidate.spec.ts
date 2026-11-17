import { expect, test, type Page } from "@playwright/test";

// One throwaway candidate per run, deleted again at the end through the settings page.
const password = "e2e-test-password-1";

const candidatePages = [
  { path: "/", heading: /Here's your reach/ },
  { path: "/jobs", heading: "Matched jobs" },
  { path: "/applications", heading: "Applications" },
  { path: "/outreach", heading: "Messages" },
  { path: "/outreach/linkedin", heading: "LinkedIn queue" },
  { path: "/outreach/campaigns", heading: "Campaigns" },
  { path: "/outreach/templates", heading: "Templates" },
  { path: "/contacts", heading: "Contacts" },
  { path: "/resumes", heading: "Resumes" },
  { path: "/profile", heading: "Profile" },
  { path: "/mailboxes", heading: "Mailboxes" },
  { path: "/settings", heading: "Account settings" },
];

function watchForErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.url().includes("/api/") && response.status() >= 500) {
      errors.push(`${response.status()} ${response.url()}`);
    }
  });

  return errors;
}

async function openInApp(page: Page, path: string) {
  await page.evaluate((target) => {
    history.pushState({}, "", target);
    dispatchEvent(new PopStateEvent("popstate"));
  }, path);
}

test("a candidate signs up, uses every page, writes a template and deletes the account", async ({
  page,
}, testInfo) => {
  const email = `e2e-${testInfo.project.name}-${Date.now()}@example.com`;
  const errors = watchForErrors(page);

  await page.goto("/jobs");
  await expect(page).toHaveURL(/\/login\?next=%2Fjobs/);

  await page.getByRole("link", { name: "Create an account" }).click();
  await page.getByLabel("Full name").fill("E2E Candidate");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  // Password hashing makes sign-up take a few seconds.
  await expect(page).toHaveURL(/\/jobs$/, { timeout: 20_000 });

  for (const { path, heading } of candidatePages) {
    await openInApp(page, path);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
  }

  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Account settings" })).toBeVisible();

  await openInApp(page, "/outreach/templates");
  await page.getByRole("button", { name: "New template" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name").fill("First touch");
  await dialog.getByLabel("Subject").fill("Interested in {{jobTitle}}");
  await dialog.getByLabel("Message").fill("Hi {{contactFirstName}}, I'd love to chat.");
  await dialog.getByRole("button", { name: "Create draft" }).click();
  await expect(page.getByRole("heading", { name: "First touch" })).toBeVisible();
  await page.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByText("Approved", { exact: true })).toBeVisible();

  await openInApp(page, "/settings");
  await page.getByRole("button", { name: "Delete my account" }).click();
  await page.getByLabel("Enter your password to confirm").fill(password);
  await page.getByRole("button", { name: "Delete everything" }).click();
  await expect(page).toHaveURL(/\/login/);

  expect(errors).toEqual([]);
});
