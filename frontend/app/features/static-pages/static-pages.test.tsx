import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderPage } from "../../../test/render";
import HowItWorks from "./how-it-works.route";
import Privacy from "./privacy.route";

describe("how it works", () => {
  it("explains the four ways to take part and the organisations' side", () => {
    renderPage(HowItWorks);
    expect(screen.getByRole("heading", { level: 1, name: "Come funziona" })).toBeInTheDocument();
    for (const name of [
      "Iniziative popolari",
      "Assemblee civiche estratte a sorte",
      "Consultazioni",
      "Candidati ed eletti",
    ]) {
      expect(screen.getByRole("heading", { level: 3, name })).toBeInTheDocument();
    }
    expect(
      screen.getByRole("heading", { level: 2, name: "Per le organizzazioni" }),
    ).toBeInTheDocument();
  });

  it("says that taking part needs registration, not that there is no password", () => {
    renderPage(HowItWorks);
    expect(screen.getByText(/ti registri con email, nome e cognome/)).toBeInTheDocument();
    expect(screen.queryByText(/senza password/)).not.toBeInTheDocument();
  });
});

describe("privacy", () => {
  it("shows every section and the draft notice", () => {
    renderPage(Privacy, { lang: "en" });
    expect(screen.getByRole("heading", { level: 1, name: "Privacy and data" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(5);
    expect(screen.getByText(/^Working draft/)).toBeInTheDocument();
  });
});
