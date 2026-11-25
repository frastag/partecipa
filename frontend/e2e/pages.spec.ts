import { expect, expectAccessible, hydrated, test } from "./fixtures";

const PAGES = [
  {
    path: "/",
    h1: "Le decisioni pubbliche si prendono anche da qui.",
    title: "Partecipa — decidere insieme",
  },
  { path: "/come-funziona", h1: "Come funziona", title: "Come funziona — Partecipa" },
  { path: "/privacy", h1: "Privacy e dati", title: "Privacy e dati — Partecipa" },
  { path: "/entra", h1: "Accesso in arrivo", title: "Accesso in arrivo — Partecipa" },
];

for (const { path, h1, title } of PAGES) {
  test(`${path} renders, hydrates and is accessible`, async ({ page, consoleErrors }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(h1);
    await expect(page).toHaveTitle(title);
    await hydrated(page);
    await expectAccessible(page);
    expect(consoleErrors).toEqual([]);
  });
}

test("an unknown page answers 404 with a way back", async ({ page }) => {
  const response = await page.goto("/non-esiste");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("404");
  await expect(page.getByText("Questa pagina non esiste, o non è pubblica.")).toBeVisible();
  await expectAccessible(page);
  await page.getByRole("link", { name: "Torna all'inizio" }).click();
  await expect(page).toHaveURL("/");
});

test("the skip link is the first stop and jumps to the content", async ({ page }) => {
  await page.goto("/privacy");
  await hydrated(page);
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Vai al contenuto" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#contenuto$/);
});

test("the language switch keeps the page and lasts across pages", async ({ page }) => {
  await page.goto("/come-funziona");
  await page.getByRole("link", { name: "EN — English" }).click();
  await expect(page).toHaveURL("/come-funziona");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("How it works");

  await page.goto("/privacy");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Privacy and data");
  await expectAccessible(page);

  await page.getByRole("link", { name: "IT — Italiano" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Privacy e dati");
});

test("navigating moves focus to the new page's heading", async ({ page }) => {
  await page.goto("/");
  await hydrated(page);
  await page.getByRole("contentinfo").getByRole("link", { name: "Privacy e dati" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
});

test("anonymous visitors get no cookie", async ({ page, context }) => {
  await page.goto("/");
  await page.goto("/privacy");
  expect(await context.cookies()).toEqual([]);
});
