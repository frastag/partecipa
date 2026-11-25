import { useTranslation } from "react-i18next";

import { pageMeta } from "~/core/i18n/meta";
import type { Route } from "./+types/privacy.route";

export const meta: Route.MetaFunction = ({ matches }) => pageMeta(matches, "privacy.title");

const SECTIONS = [
  "responsibilities",
  "organizationSees",
  "collection",
  "rights",
  "security",
] as const;

export default function Privacy() {
  const { t } = useTranslation();
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">{t("privacy.title")}</h1>
      <p className="mt-6 rounded-lg border border-ink-100 bg-ink-50 p-4 text-sm text-ink-600">
        {t("privacy.draft")}
      </p>
      {SECTIONS.map((key) => (
        <section key={key} className="mt-10">
          <h2 className="text-2xl font-semibold">{t(`privacy.${key}.title`)}</h2>
          <p className="mt-3 text-ink-600">{t(`privacy.${key}.text`)}</p>
        </section>
      ))}
    </article>
  );
}
