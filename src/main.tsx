import "./styles/index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";

import { Providers } from "./app/Providers";
import { createRouter } from "./app/router";
import { applyTheme, useTheme } from "./lib/theme";

const root = document.getElementById("root");
if (!root) {
  throw new Error("index.html has no #root element");
}

// Applied before the first render so a dark theme never flashes light.
applyTheme(useTheme.getState().preference);

const router = createRouter();

createRoot(root).render(
  <StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>,
);
