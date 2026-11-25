import createClient, { type Client } from "openapi-fetch";

import { config } from "~/core/config.server";
import type { paths } from "./schema";

export interface FieldError {
  readonly field: string;
  readonly code: string;
}

/** An API failure as the front end needs it: the status and the code to translate. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly fieldErrors: readonly FieldError[] = [],
  ) {
    super(`API ${status} ${code}`);
    this.name = "ApiError";
  }
}

export interface ApiClientOptions {
  /** The person's access token, from the session (build order step 2). */
  readonly accessToken?: string;
  readonly baseUrl?: string;
  readonly fetch?: typeof fetch;
}

/** The only way the web server calls the API (docs/code-style-react.md). */
export function apiClient(options: ApiClientOptions = {}): Client<paths> {
  return createClient<paths>({
    baseUrl: options.baseUrl ?? `${config().apiOrigin}/api/v1`,
    fetch: options.fetch,
    headers: options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {},
  });
}

/** The data of a call, or an {@link ApiError} built from the RFC 9457 problem detail. */
export function unwrap<T>(result: { data?: T; error?: unknown; response: Response }): T {
  if (result.response.ok && result.data !== undefined) return result.data;
  throw toApiError(result.response.status, result.error);
}

function toApiError(status: number, body: unknown): ApiError {
  const problem =
    typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const code = typeof problem["code"] === "string" ? problem["code"] : `HTTP_${status}`;
  const errors = Array.isArray(problem["errors"]) ? problem["errors"] : [];
  const fieldErrors = errors.filter(
    (e): e is FieldError =>
      typeof e === "object" &&
      e !== null &&
      typeof e.field === "string" &&
      typeof e.code === "string",
  );
  return new ApiError(status, code, fieldErrors);
}
