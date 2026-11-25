import { render } from "@testing-library/react";
import type { ComponentType } from "react";
import { I18nextProvider } from "react-i18next";
import { createRoutesStub } from "react-router";

import { createI18n, type Lang } from "~/core/i18n/i18n";

/** Renders a page inside a router and the i18n provider, like the real document shell. */
export function renderPage(Page: ComponentType, { lang = "it" as Lang, path = "/" } = {}) {
  const Stub = createRoutesStub([{ path: "*", Component: Page }]);
  return render(
    <I18nextProvider i18n={createI18n(lang)}>
      <Stub initialEntries={[path]} />
    </I18nextProvider>,
  );
}
