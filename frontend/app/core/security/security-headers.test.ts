import { describe, expect, it } from "vitest";

import { securityHeaders } from "./security-headers";

const production = { nonce: "abc123", dev: false, https: true };

describe("securityHeaders", () => {
  it("sends a strict policy with the request's nonce in production", () => {
    const headers = securityHeaders({ ...production, path: "/privacy" });

    const csp = headers.get("Content-Security-Policy") ?? "";
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'nonce-abc123'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).not.toContain("unsafe-inline");
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("Referrer-Policy")).toBe("same-origin");
    expect(headers.get("Strict-Transport-Security")).toContain("max-age=");
  });

  it("lets other sites frame only the embed pages", () => {
    const embed = securityHeaders({ ...production, path: "/embed/org/process" });
    expect(embed.get("Content-Security-Policy")).toContain("frame-ancestors *");
    expect(embed.has("X-Frame-Options")).toBe(false);

    const lookalike = securityHeaders({ ...production, path: "/embedded" });
    expect(lookalike.get("X-Frame-Options")).toBe("DENY");
  });

  it("sends no HSTS over plain http", () => {
    expect(
      securityHeaders({ ...production, https: false, path: "/" }).has("Strict-Transport-Security"),
    ).toBe(false);
  });

  it("relaxes inline scripts and styles only for the dev server", () => {
    const csp = securityHeaders({ ...production, dev: true, path: "/" }).get(
      "Content-Security-Policy",
    );
    expect(csp).toContain("'unsafe-inline'");
    expect(csp).toContain("ws://localhost:*");
  });
});
