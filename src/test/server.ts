import { setupServer } from "msw/node";

// Tests add their own handlers with server.use(); unhandled requests fail the test.
export const server = setupServer();

export function envelope<T>(data: T, statusCode = 200) {
  return { success: true, statusCode, data };
}

export function errorEnvelope(
  statusCode: number,
  code: string,
  message: string,
  details: { field: string; issue: string }[] = [],
) {
  return { success: false, statusCode, error: { code, message, details } };
}
