import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { pageMeta } from "~/core/i18n/meta";
import type { Route } from "./+types/sign-in-soon.route";

// Placeholder for /entra and /registrati until login through Keycloak (build order step 2).
export const meta: Route.MetaFunction = ({ matches }) => pageMeta(matches, "account.soon.title");

export default function SignInSoon() {
  const { t } = useTranslation();
  return (
    <section className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-semibold text-ink-900">{t("account.soon.title")}</h1>
      <p className="mt-4 text-lg text-ink-600">{t("account.soon.text")}</p>
      <p className="mt-8">
        <Link to="/" className="btn">
          {t("account.soon.back")}
        </Link>
      </p>
    </section>
  );
}
