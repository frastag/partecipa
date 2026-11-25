/** Liveness of the web server for the load balancer (docs/infrastructure.md). */
export function loader() {
  return Response.json({ status: "UP" }, { headers: { "Cache-Control": "no-store" } });
}
