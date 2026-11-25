import { useTranslation } from "react-i18next";
import { Link } from "react-router";

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="mt-16 border-t border-ink-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-ink-600 sm:flex-row sm:justify-between">
        <p>
          <span className="font-semibold text-ink-900">Partecipa</span> ·{" "}
          {t("layout.footer.tagline")}
        </p>
        <nav aria-label={t("layout.footer.nav")}>
          <ul className="flex gap-4">
            <li>
              <Link to="/privacy" className="nav-link">
                {t("layout.footer.privacy")}
              </Link>
            </li>
            <li>
              <Link to="/come-funziona" className="nav-link">
                {t("layout.footer.howItWorks")}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
