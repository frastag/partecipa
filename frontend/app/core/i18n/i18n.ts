import { createInstance, type i18n, type TFunction } from "i18next";

import en from "~/locales/en.json";
import it from "~/locales/it.json";

export const LANGS = ["it", "en"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "it";

export const isLang = (value: unknown): value is Lang =>
  typeof value === "string" && (LANGS as readonly string[]).includes(value);

export const resources = { it: { translation: it }, en: { translation: en } } as const;

/**
 * A synchronous i18next instance for one language. Translations are bundled, so the server
 * render and the hydration in the browser produce the same text.
 */
export function createI18n(lang: Lang): i18n {
  const instance = createInstance();
  void instance.init({
    lng: lang,
    fallbackLng: false,
    resources,
    initAsync: false,
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  return instance;
}

/** For `meta` functions, which can't use hooks. */
export const translator = (lang: Lang): TFunction => createI18n(lang).t;
