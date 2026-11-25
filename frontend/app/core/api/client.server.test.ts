import { describe, expect, it, vi } from "vitest";

import { ApiError, apiClient, unwrap } from "./client.server";

const BASE = "http://api.test/api/v1";

function stubFetch(status: number, body: unknown, contentType = "application/json") {
  return vi.fn<typeof fetch>(
    async () =>
      new Response(JSON.stringify(body), { status, headers: { "Content-Type": contentType } }),
  );
}

describe("apiClient", () => {
  it("calls the versioned API with the person's token", async () => {
    const fetch = stubFetch(200, { status: "UP" });
    const client = apiClient({ baseUrl: BASE, fetch, accessToken: "token-1" });

    const health = unwrap(await client.GET("/actuator/health"));

    expect(health).toEqual({ status: "UP" });
    const request = fetch.mock.calls[0]?.[0] as Request;
    expect(request.url).toBe(`${BASE}/actuator/health`);
    expect(request.method).toBe("GET");
    expect(request.headers.get("Authorization")).toBe("Bearer token-1");
  });

  it("sends no Authorization header for anonymous calls", async () => {
    const fetch = stubFetch(200, { status: "UP" });
    await apiClient({ baseUrl: BASE, fetch }).GET("/actuator/health");
    expect((fetch.mock.calls[0]?.[0] as Request).headers.has("Authorization")).toBe(false);
  });

  it("turns a problem detail into an ApiError with its code and field codes", async () => {
    const problem = {
      status: 400,
      code: "VALIDATION_FAILED",
      errors: [{ field: "name", code: "NotBlank" }, { field: 3 }],
    };
    const client = apiClient({
      baseUrl: BASE,
      fetch: stubFetch(400, problem, "application/problem+json"),
    });

    const call = client.GET("/actuator/health").then(unwrap);

    await expect(call).rejects.toBeInstanceOf(ApiError);
    await expect(call).rejects.toMatchObject({
      status: 400,
      code: "VALIDATION_FAILED",
      fieldErrors: [{ field: "name", code: "NotBlank" }],
    });
  });

  it("names the status when the body is not a problem detail", async () => {
    const client = apiClient({ baseUrl: BASE, fetch: stubFetch(502, "Bad gateway", "text/plain") });
    await expect(client.GET("/actuator/health").then(unwrap)).rejects.toMatchObject({
      code: "HTTP_502",
    });
  });
});
