import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { pageMeta } from "~/core/i18n/meta";
import type { Route } from "./+types/home.route";

export const meta: Route.MetaFunction = ({ matches }) => pageMeta(matches);

// Placeholder until the process list (build order step 3); /?tipo= shows the same page.
export default function Home() {
  const { t } = useTranslation();
  return (
    <section className="mx-auto max-w-4xl px-4 py-20">
      <p className="pill">{t("home.pill")}</p>
      <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        {t("home.title")}
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-ink-600">{t("home.text")}</p>
      <p className="mt-10">
        <Link to="/come-funziona" className="btn">
          {t("home.howItWorks")}
        </Link>
      </p>
    </section>
  );
}
