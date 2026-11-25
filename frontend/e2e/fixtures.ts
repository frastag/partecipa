import AxeBuilder from "@axe-core/playwright";
import { test as base, expect, type Page } from "@playwright/test";

/** Fails a test on any console error or uncaught exception: hydration, CSP, script errors. */
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: async ({ page }, provide) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await provide(errors);
    expect(errors, "console errors").toEqual([]);
  },
});

export { expect };

/** Serious and critical accessibility violations fail the test (docs/testing.md). */
export async function expectAccessible(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  const blocking = violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
  expect(blocking, "accessibility violations").toEqual([]);
}

/** Waits until React has hydrated the page, so clicks are handled by the app. */
export async function hydrated(page: Page) {
  await page.waitForFunction(() => "__reactRouterRouteModules" in window);
}
