import { createClient } from "redis";

import { config } from "~/core/config.server";

/** The little the session store needs from Valkey; tests use an in-memory map. */
export interface KeyValueStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
}

const connect = () =>
  createClient({ url: config().valkeyUrl })
    .on("error", (error: unknown) => console.error("valkey client error", error))
    .connect();

let client: ReturnType<typeof connect> | undefined;

function connected(): ReturnType<typeof connect> {
  client ??= connect();
  return client;
}

/** Valkey speaks the Redis protocol, so the official Redis client works unchanged. */
export const valkeyStore: KeyValueStore = {
  async get(key) {
    return (await connected()).get(key);
  },
  async set(key, value, ttlSeconds) {
    await (await connected()).set(key, value, { expiration: { type: "EX", value: ttlSeconds } });
  },
  async delete(key) {
    await (await connected()).del(key);
  },
};

export async function pingValkey(): Promise<boolean> {
  try {
    return (await (await connected()).ping()) === "PONG";
  } catch {
    return false;
  }
}
