import { randomBytes } from "node:crypto";
import type { MiddlewareFunction } from "react-router";

import { config } from "~/core/config.server";
import { nonceContext } from "./nonce";
import { securityHeaders } from "./security-headers";

/** Root middleware: a fresh nonce per request and the security headers on every response. */
export const securityMiddleware: MiddlewareFunction<Response> = async (
  { request, context },
  next,
) => {
  const nonce = randomBytes(16).toString("base64");
  context.set(nonceContext, nonce);
  const response = await next();

  const headers = new Headers(response.headers);
  const extra = securityHeaders({
    path: new URL(request.url).pathname,
    nonce,
    dev: import.meta.env.DEV,
    https: config().publicOrigin.startsWith("https:"),
  });
  extra.forEach((value, name) => headers.set(name, value));
  // Some responses (redirects) have immutable headers: copy instead of mutating.
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};
