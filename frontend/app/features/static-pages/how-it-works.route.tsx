import { useTranslation } from "react-i18next";

import { pageMeta } from "~/core/i18n/meta";
import type { Route } from "./+types/how-it-works.route";

export const meta: Route.MetaFunction = ({ matches }) => pageMeta(matches, "howItWorks.title");

const FOR_PEOPLE = ["initiatives", "assemblies", "consultations", "representatives"] as const;

export default function HowItWorks() {
  const { t } = useTranslation();
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">{t("howItWorks.title")}</h1>

      <section aria-labelledby="per-le-persone" className="mt-12">
        <h2 id="per-le-persone" className="text-2xl font-semibold">
          {t("howItWorks.people.title")}
        </h2>
        <p className="mt-3 text-ink-600">{t("howItWorks.people.intro")}</p>
        {FOR_PEOPLE.map((key) => (
          <section key={key} className="mt-8">
            <h3 className="text-lg font-semibold">{t(`howItWorks.${key}.title`)}</h3>
            <p className="mt-2 text-ink-600">{t(`howItWorks.${key}.text`)}</p>
          </section>
        ))}
      </section>

      <section aria-labelledby="per-le-organizzazioni" className="mt-12">
        <h2 id="per-le-organizzazioni" className="text-2xl font-semibold">
          {t("howItWorks.organizations.title")}
        </h2>
        <p className="mt-3 text-ink-600">{t("howItWorks.organizations.text")}</p>
      </section>
    </article>
  );
}
