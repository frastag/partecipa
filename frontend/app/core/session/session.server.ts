import { randomBytes } from "node:crypto";
import { createCookie, createSessionStorage, type SessionStorage } from "react-router";

import { config } from "~/core/config.server";
import type { Lang } from "~/core/i18n/i18n";
import { type KeyValueStore, valkeyStore } from "./key-value-store.server";

/** What the web session holds. Tokens are added by the login step (build order 2). */
export interface SessionData {
  lang: Lang;
}

/** A session nobody uses for a week disappears from Valkey (assumption, docs/infrastructure.md). */
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
const KEY_PREFIX = "session:";

export function createValkeySessionStorage(
  store: KeyValueStore,
  options: { secure: boolean; secret: string },
): SessionStorage<SessionData> {
  // __Host- needs Secure, which plain http://localhost can't have in every browser.
  const cookie = createCookie(options.secure ? "__Host-partecipa" : "partecipa", {
    httpOnly: true,
    secure: options.secure,
    sameSite: "lax",
    path: "/",
    secrets: [options.secret],
  });
  const ttl = (expires?: Date) =>
    expires
      ? Math.max(1, Math.round((expires.getTime() - Date.now()) / 1000))
      : SESSION_TTL_SECONDS;

  return createSessionStorage<SessionData>({
    cookie,
    async createData(data, expires) {
      const id = randomBytes(32).toString("base64url");
      await store.set(KEY_PREFIX + id, JSON.stringify(data), ttl(expires));
      return id;
    },
    async readData(id) {
      const raw = await store.get(KEY_PREFIX + id);
      return raw ? (JSON.parse(raw) as Partial<SessionData>) : null;
    },
    async updateData(id, data, expires) {
      await store.set(KEY_PREFIX + id, JSON.stringify(data), ttl(expires));
    },
    async deleteData(id) {
      await store.delete(KEY_PREFIX + id);
    },
  });
}

let storage: SessionStorage<SessionData> | undefined;

export function sessionStorage(): SessionStorage<SessionData> {
  storage ??= createValkeySessionStorage(valkeyStore, {
    secure: config().publicOrigin.startsWith("https:"),
    secret: config().sessionSecret,
  });
  return storage;
}

export const getSession = (request: Request) =>
  sessionStorage().getSession(request.headers.get("Cookie"));
