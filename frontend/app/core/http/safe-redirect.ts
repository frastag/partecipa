/**
 * Where to send someone back to: the path and query of `target`, never its host. Anything that
 * isn't a plain local path ("//evil.example", "javascript:") becomes "/".
 */
export function localPath(
  target: string | null | undefined,
  base = "http://local.invalid",
): string {
  if (!target) return "/";
  let url: URL;
  try {
    url = new URL(target, base);
  } catch {
    return "/";
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return "/";
  const path = url.pathname;
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return "/";
  return path + url.search;
}
