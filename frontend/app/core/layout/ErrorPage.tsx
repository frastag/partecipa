import { useTranslation } from "react-i18next";
import { Link } from "react-router";

/** The 404 page and the generic error page; the tab keeps the site title from the root. */
export function ErrorPage({ kind }: { kind: "notFound" | "generic" }) {
  const { t } = useTranslation();
  return (
    <section className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="text-5xl font-semibold text-ink-900">{t(`errors.${kind}.title`)}</h1>
      <p className="mt-4 text-lg text-ink-600">{t(`errors.${kind}.text`)}</p>
      <p className="mt-8">
        <Link to="/" className="btn">
          {t(`errors.${kind}.back`)}
        </Link>
      </p>
    </section>
  );
}
