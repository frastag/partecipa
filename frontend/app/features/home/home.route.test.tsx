import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderPage } from "../../../test/render";
import Home from "./home.route";

describe("home page", () => {
  it("states what the platform is for, in Italian by default", () => {
    renderPage(Home);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Le decisioni pubbliche si prendono anche da qui.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Scopri come funziona" })).toHaveAttribute(
      "href",
      "/come-funziona",
    );
  });

  it("is translated into English", () => {
    renderPage(Home, { lang: "en" });
    expect(
      screen.getByRole("heading", { level: 1, name: "Public decisions are made here too." }),
    ).toBeInTheDocument();
  });
});
