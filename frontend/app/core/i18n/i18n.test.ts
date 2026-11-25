import { describe, expect, it } from "vitest";

import en from "~/locales/en.json";
import it_ from "~/locales/it.json";
import { createI18n, isLang } from "./i18n";

function keys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
}

describe("translations", () => {
  it("have the same keys in Italian and English", () => {
    expect(keys(en).sort()).toEqual(keys(it_).sort());
  });

  it("have no empty text", () => {
    for (const [lang, file] of [
      ["it", it_],
      ["en", en],
    ] as const) {
      const empty = keys(file).filter((key) => createI18n(lang).t(key) === "");
      expect(empty, lang).toEqual([]);
    }
  });

  it("translate synchronously, so server and browser render the same text", () => {
    expect(createI18n("en").t("layout.skipLink")).toBe("Skip to content");
    expect(createI18n("it").t("layout.skipLink")).toBe("Vai al contenuto");
  });

  it("accept only the two languages", () => {
    expect(isLang("it")).toBe(true);
    expect(isLang("en")).toBe(true);
    expect(isLang("fr")).toBe(false);
    expect(isLang(undefined)).toBe(false);
  });
});
