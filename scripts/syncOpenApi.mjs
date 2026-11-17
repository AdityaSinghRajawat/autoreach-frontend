// Copies the backend's API spec next to the frontend so types are generated from one source.
import { copyFileSync } from "node:fs";
import { resolve } from "node:path";

const source = resolve(
  process.env.BACKEND_DIR ?? "../autoreach-backend",
  "docs/swagger/openapi.json",
);
copyFileSync(source, resolve("openapi/openapi.json"));
console.log(`copied ${source}`);
