import { useTranslation } from "react-i18next";
import { Link, NavLink, useLocation } from "react-router";

const TYPE_LINKS = [
  { tipo: "iniziativa", key: "layout.menu.initiatives" },
  { tipo: "assemblea", key: "layout.menu.assemblies" },
  { tipo: "consultazione", key: "layout.menu.consultations" },
] as const;

export function Header() {
  const { t } = useTranslation();
  const location = useLocation();
  const currentType =
    location.pathname === "/" ? new URLSearchParams(location.search).get("tipo") : null;

  return (
    <header className="border-b border-ink-100">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link to="/" className="font-semibold text-lg text-ink-900" aria-label={t("layout.home")}>
          Partecipa
        </Link>
        <nav aria-label={t("layout.mainNav")} className="order-last w-full sm:order-none sm:w-auto">
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {TYPE_LINKS.map(({ tipo, key }) => (
              <li key={tipo}>
                <Link
                  to={`/?tipo=${tipo}`}
                  className="nav-link"
                  aria-current={currentType === tipo ? "page" : undefined}
                >
                  {t(key)}
                </Link>
              </li>
            ))}
            <li>
              <NavLink to="/rappresentanti" className="nav-link">
                {t("layout.menu.representatives")}
              </NavLink>
            </li>
            <li>
              <NavLink to="/come-funziona" className="nav-link">
                {t("layout.menu.howItWorks")}
              </NavLink>
            </li>
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          {/* A plain link: the language lives in the session, so switching reloads the page. */}
          <a
            href={`/lingua/${t("layout.language.switchLang")}`}
            lang={t("layout.language.switchLang")}
            className="nav-link"
          >
            {/* The visible code is part of the accessible name (WCAG 2.5.3). */}
            {t("layout.language.switch")}
            <span className="sr-only"> — {t("layout.language.switchLabel")}</span>
          </a>
          <Link to="/registrati" className="nav-link">
            {t("layout.register")}
          </Link>
          <Link to="/entra" className="btn btn-small">
            {t("layout.signIn")}
          </Link>
        </div>
      </div>
    </header>
  );
}
