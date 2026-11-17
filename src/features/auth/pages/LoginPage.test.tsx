import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it } from "vitest";

import { Providers } from "@/app/Providers";
import { PublicOnly } from "@/app/guards";
import { useSession } from "@/api/session";
import { envelope, errorEnvelope, server } from "@/test/server";

import { LoginPage } from "./LoginPage";

function renderLogin(entry = "/login") {
  const router = createMemoryRouter(
    [
      { Component: PublicOnly, children: [{ path: "login", Component: LoginPage }] },
      { path: "/jobs", element: <p>jobs page</p> },
      { path: "/", element: <p>home page</p> },
    ],
    { initialEntries: [entry] },
  );
  render(
    <Providers>
      <RouterProvider router={router} />
    </Providers>,
  );
}

afterEach(() => useSession.getState().signOut());

describe("LoginPage", () => {
  it("validates before calling the API", async () => {
    renderLogin();
    await userEvent.click(await screen.findByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
    expect(screen.getByText("Enter your password")).toBeInTheDocument();
  });

  it("shows the server's message when sign-in is refused", async () => {
    server.use(
      http.post("*/api/v1/auth/login", () =>
        HttpResponse.json(errorEnvelope(401, "INVALID_CREDENTIALS", "Wrong email or password."), {
          status: 401,
        }),
      ),
    );
    renderLogin();
    await userEvent.type(await screen.findByLabelText("Email"), "a@b.co");
    await userEvent.type(screen.getByLabelText("Password"), "secret-password");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Wrong email or password.");
  });

  it("signs in and continues to the page in ?next=", async () => {
    server.use(
      http.post("*/api/v1/auth/login", () =>
        HttpResponse.json(
          envelope({
            user: { userId: "u1", email: "a@b.co", roles: ["CANDIDATE"], candidateId: "c1" },
            accessToken: "token",
            refreshToken: "refresh",
            tokenType: "Bearer",
            expiresIn: 900,
          }),
        ),
      ),
    );
    renderLogin("/login?next=%2Fjobs");
    await userEvent.type(await screen.findByLabelText("Email"), "a@b.co");
    await userEvent.type(screen.getByLabelText("Password"), "secret-password");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("jobs page")).toBeInTheDocument();
    expect(useSession.getState().status).toBe("signedIn");
  });
});
