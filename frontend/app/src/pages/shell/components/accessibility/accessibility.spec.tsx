// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, test, expect } from "vitest";
import { page, commands } from "vitest/browser";
import { render } from "vitest-browser-react";
import { App } from "@/components/app/app.view";
import { municipality, stubShell } from "@/test/fixtures";
describe("Accessibility statement page", () => {
  test("should show the active municipality's statement to a visitor without a session", async () => {
    stubShell();
    await commands.navigate("/app/vilaverde/accesibilidade");
    await render(<App />);
    await expect
      .element(
        page.getByRole("heading", {
          level: 1,
          name: "Declaración de accesibilidade",
        }),
      )
      .toBeVisible();
    await expect.element(page.getByText(/parcialmente conforme/)).toBeVisible();
    await expect
      .element(page.getByText(municipality.accessibility.unit, { exact: true }))
      .toBeVisible();
    await expect
      .element(page.getByText(municipality.accessibility.exceptions.gl))
      .toBeVisible();
    await expect
      .element(
        page.getByRole("link", { name: municipality.accessibility.email }),
      )
      .toHaveAttribute("href", `mailto:${municipality.accessibility.email}`);
    await expect
      .element(
        page.getByRole("link", { name: municipality.accessibility.phone }),
      )
      .toHaveAttribute("href", "tel:+34986000001");
    await expect.element(page.getByText("27 de outubro de 2026")).toBeVisible();
  });
  test("should show the statement in Spanish when the person switches language", async () => {
    stubShell();
    await commands.navigate("/app/vilaverde/accesibilidade");
    await render(<App />);
    await page.getByRole("button", { name: "ES" }).click();
    await expect
      .element(
        page.getByRole("heading", {
          level: 1,
          name: "Declaración de accesibilidad",
        }),
      )
      .toBeVisible();
    await expect
      .element(page.getByText(municipality.accessibility.exceptions.es))
      .toBeVisible();
  });
  test("should link the statement from the catalog footer", async () => {
    stubShell();
    await commands.navigate("/app/vilaverde/instalacions");
    await render(<App />);
    await expect
      .element(page.getByRole("link", { name: "Accesibilidade" }).first())
      .toHaveAttribute("href", "/app/vilaverde/accesibilidade");
  });
});
