import { type RouteConfig, index, route } from "@react-router/dev/routes";

// Every URL of the site (docs/routes.md). Page URLs are Italian.
export default [
  index("features/home/home.route.tsx"),
  route("come-funziona", "features/static-pages/how-it-works.route.tsx"),
  route("privacy", "features/static-pages/privacy.route.tsx"),
  // Placeholders until login through Keycloak (build order step 2).
  route("entra", "features/account/sign-in-soon.route.tsx", { id: "sign-in" }),
  route("registrati", "features/account/sign-in-soon.route.tsx", { id: "register" }),
  route("lingua/:code", "core/i18n/language.route.ts"),
  route("healthz", "core/health/healthz.route.ts"),
  route("*", "core/layout/not-found.route.tsx"),
] satisfies RouteConfig;
