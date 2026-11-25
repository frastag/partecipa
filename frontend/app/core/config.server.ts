import { existsSync } from "node:fs";

// Local development reads frontend/.env (copied from .env.example); deployments set real
// environment variables, which a .env file never overrides.
if (existsSync(".env")) process.loadEnvFile(".env");

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name} (see .env.example)`);
  return value;
}

export interface Config {
  /** The origin people use, e.g. https://partecipa.example; decides the cookie name and HSTS. */
  readonly publicOrigin: string;
  /** Where the server calls the API, without the /api/v1 path. */
  readonly apiOrigin: string;
  readonly valkeyUrl: string;
  readonly sessionSecret: string;
}

let cached: Config | undefined;

export function config(): Config {
  cached ??= {
    publicOrigin: required("PUBLIC_ORIGIN"),
    apiOrigin: required("API_ORIGIN"),
    valkeyUrl: required("VALKEY_URL"),
    sessionSecret: required("SESSION_SECRET"),
  };
  return cached;
}
