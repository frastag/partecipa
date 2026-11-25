import { describe, expect, it } from "vitest";

import { localPath } from "./safe-redirect";

describe("localPath", () => {
  it.each([
    ["http://localhost:5173/come-funziona", "/come-funziona"],
    ["https://elsewhere.example/o/eumans?tipo=iniziativa", "/o/eumans?tipo=iniziativa"],
    ["/privacy", "/privacy"],
  ])("keeps only the path and query of %s", (target, expected) => {
    expect(localPath(target)).toBe(expected);
  });

  it.each([
    null,
    undefined,
    "",
    "http://localhost//evil.example/x",
    "javascript:alert(1)",
    "/\\evil.example",
    "http://[",
  ])("falls back to the home page for %s", (target) => {
    expect(localPath(target)).toBe("/");
  });

  it("drops the fragment", () => {
    expect(localPath("http://localhost/privacy#diritti")).toBe("/privacy");
  });
});
