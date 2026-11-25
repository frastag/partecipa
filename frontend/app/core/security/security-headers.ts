export interface SecurityHeaderOptions {
  readonly path: string;
  readonly nonce: string;
  /** Vite's dev server injects inline styles and a websocket for hot reload. */
  readonly dev: boolean;
  readonly https: boolean;
}

/** The only pages another site may put in an iframe (docs/privacy-and-security.md). */
export const isEmbed = (path: string) => path === "/embed" || path.startsWith("/embed/");

/** Headers for every response of the web server (docs/privacy-and-security.md, "Headers"). */
export function securityHeaders({ path, nonce, dev, https }: SecurityHeaderOptions): Headers {
  const embed = isEmbed(path);
  const csp = [
    "default-src 'self'",
    "img-src 'self' data:",
    "base-uri 'self'",
    "form-action 'self'",
    `frame-ancestors ${embed ? "*" : "'none'"}`,
    dev ? "script-src 'self' 'unsafe-inline'" : `script-src 'self' 'nonce-${nonce}'`,
    ...(dev ? ["style-src 'self' 'unsafe-inline'", "connect-src 'self' ws://localhost:*"] : []),
  ].join("; ");

  const headers = new Headers({
    "Content-Security-Policy": csp,
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "same-origin",
  });
  if (!embed) headers.set("X-Frame-Options", "DENY");
  if (https) headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  return headers;
}
