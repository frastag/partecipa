import type { MetaDescriptor } from "react-router";

import { DEFAULT_LANG, isLang, translator, type Lang } from "./i18n";

interface MatchWithData {
  readonly id: string;
  readonly loaderData?: unknown;
}

/** The language the root loader chose, for `meta` functions (which can't use hooks). */
export function langOf(matches: readonly (MatchWithData | undefined)[]): Lang {
  const root = matches.find((match) => match?.id === "root")?.loaderData;
  const lang = typeof root === "object" && root !== null && "lang" in root ? root.lang : undefined;
  return isLang(lang) ? lang : DEFAULT_LANG;
}

/** "<page> — Partecipa", or the site title when `pageKey` is omitted. */
export function pageMeta(
  matches: readonly (MatchWithData | undefined)[],
  pageKey?: string,
): MetaDescriptor[] {
  const t = translator(langOf(matches));
  return [
    { title: pageKey ? t("meta.pageTitle", { page: t(pageKey) }) : t("meta.siteTitle") },
    { name: "description", content: t("meta.description") },
  ];
}
