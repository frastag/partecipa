import { useMemo } from "react";
import { I18nextProvider } from "react-i18next";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from "react-router";

import { createI18n, DEFAULT_LANG, isLang } from "~/core/i18n/i18n";
import { pageMeta } from "~/core/i18n/meta";
import { ErrorPage } from "~/core/layout/ErrorPage";
import { Footer } from "~/core/layout/Footer";
import { Header } from "~/core/layout/Header";
import { SkipLink } from "~/core/layout/SkipLink";
import { useFocusOnNavigation } from "~/core/layout/useFocusOnNavigation";
import { useNonce } from "~/core/security/nonce";
import { securityMiddleware } from "~/core/security/security.server";
import { getSession } from "~/core/session/session.server";
import type { Route } from "./+types/root";
import "./styles/app.css";

export const middleware: Route.MiddlewareFunction[] = [securityMiddleware];

/** Reading the session never creates one: visitors get a cookie only when they choose. */
export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request);
  const lang = session.get("lang");
  return { lang: isLang(lang) ? lang : DEFAULT_LANG };
}

export const meta: Route.MetaFunction = ({ matches }) => pageMeta(matches);

export function Layout({ children }: { children: React.ReactNode }) {
  const lang = useRouteLoaderData<typeof loader>("root")?.lang ?? DEFAULT_LANG;
  const i18n = useMemo(() => createI18n(lang), [lang]);
  const nonce = useNonce();

  return (
    <html lang={lang}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-white font-sans text-ink-900 antialiased">
        <I18nextProvider i18n={i18n}>
          <SkipLink />
          <Header />
          <main id="contenuto" tabIndex={-1} className="outline-none">
            {children}
          </main>
          <Footer />
        </I18nextProvider>
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export default function App() {
  useFocusOnNavigation();
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error) && error.status === 404) return <ErrorPage kind="notFound" />;
  if (import.meta.env.DEV) console.error(error);
  return <ErrorPage kind="generic" />;
}
