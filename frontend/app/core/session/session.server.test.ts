import { describe, expect, it } from "vitest";

import type { KeyValueStore } from "./key-value-store.server";
import { createValkeySessionStorage, SESSION_TTL_SECONDS } from "./session.server";

function memoryStore() {
  const entries = new Map<string, { value: string; ttl: number }>();
  const store: KeyValueStore = {
    get: async (key) => entries.get(key)?.value ?? null,
    set: async (key, value, ttl) => void entries.set(key, { value, ttl }),
    delete: async (key) => void entries.delete(key),
  };
  return { store, entries };
}

const cookieOf = (setCookie: string) => setCookie.split(";")[0] ?? "";

describe("createValkeySessionStorage", () => {
  it("keeps the data in the store and only a signed id in the cookie", async () => {
    const { store, entries } = memoryStore();
    const storage = createValkeySessionStorage(store, { secure: true, secret: "s3cret" });

    const session = await storage.getSession(null);
    session.set("lang", "en");
    const setCookie = await storage.commitSession(session);

    expect(setCookie).toMatch(/^__Host-partecipa=/);
    expect(setCookie).toMatch(/HttpOnly/);
    expect(setCookie).toMatch(/Secure/);
    expect(setCookie).toMatch(/SameSite=Lax/);
    expect(setCookie).toMatch(/Path=\//);
    const [key, entry] = [...entries][0] ?? [];
    expect(key).toMatch(/^session:/);
    expect(entry?.value).toBe(JSON.stringify({ lang: "en" }));
    expect(entry?.ttl).toBe(SESSION_TTL_SECONDS);
    // The cookie carries only the session id (signed), never the data.
    const signedValue = decodeURIComponent(cookieOf(setCookie).split("=")[1] ?? "");
    const id = JSON.parse(atob(signedValue.split(".")[0] ?? "")) as unknown;
    expect(key).toBe(`session:${String(id)}`);

    const again = await storage.getSession(cookieOf(setCookie));
    expect(again.get("lang")).toBe("en");
  });

  it("ignores a cookie whose signature doesn't match", async () => {
    const { store } = memoryStore();
    const storage = createValkeySessionStorage(store, { secure: true, secret: "s3cret" });
    const session = await storage.getSession(null);
    session.set("lang", "en");
    const cookie = cookieOf(await storage.commitSession(session));

    const other = createValkeySessionStorage(store, { secure: true, secret: "another" });
    expect((await other.getSession(cookie)).get("lang")).toBeUndefined();
  });

  it("uses a plain cookie name on http://localhost, where __Host- needs Secure", async () => {
    const storage = createValkeySessionStorage(memoryStore().store, { secure: false, secret: "s" });
    const setCookie = await storage.commitSession(await storage.getSession(null));
    expect(setCookie).toMatch(/^partecipa=/);
    expect(setCookie).not.toMatch(/Secure/);
  });

  it("removes the data when the session is destroyed", async () => {
    const { store, entries } = memoryStore();
    const storage = createValkeySessionStorage(store, { secure: true, secret: "s" });
    const session = await storage.getSession(null);
    session.set("lang", "it");
    const cookie = cookieOf(await storage.commitSession(session));

    await storage.destroySession(await storage.getSession(cookie));
    expect(entries.size).toBe(0);
  });
});
