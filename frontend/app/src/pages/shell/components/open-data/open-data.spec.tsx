// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, test, expect } from "vitest";
import { page, commands } from "vitest/browser";
import { render } from "vitest-browser-react";
import { App } from "@/components/app/app.view";
import { stubShell } from "@/test/fixtures";
describe("Open data page", () => {
  test("should link every download, its schema and the DCAT catalogue under the municipality's licence", async () => {
    stubShell();
    await commands.navigate("/app/vilaverde/datos-abertos");
    await render(<App />);
    await expect
      .element(page.getByRole("heading", { level: 1, name: "Datos abertos" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("link", { name: /CC BY 4\.0/ }))
      .toHaveAttribute("href", "https://creativecommons.org/licenses/by/4.0/");
    await expect
      .element(page.getByRole("link", { name: "GeoJSON", exact: true }))
      .toHaveAttribute(
        "href",
        "/v2/public/open-data/facilities.geojson?slug=vilaverde",
      );
    await expect
      .element(page.getByRole("link", { name: "Esquema CSV" }))
      .toHaveAttribute(
        "href",
        "/v2/public/open-data/schemas/facilities.tableschema.json",
      );
    await expect
      .element(page.getByRole("link", { name: "RDF/XML" }))
      .toHaveAttribute(
        "href",
        "/v2/public/open-data/catalog.rdf?slug=vilaverde",
      );
    await expect
      .element(
        page.getByText("Non se publican datos persoais", { exact: false }),
      )
      .toBeVisible();
  });
  test("should reach the page from the help links of the application", async () => {
    stubShell();
    await commands.navigate("/app/vilaverde/instalacions");
    await render(<App />);
    await page.getByRole("link", { name: "Datos abertos" }).first().click();
    await expect
      .element(page.getByRole("heading", { level: 1, name: "Datos abertos" }))
      .toBeVisible();
  });
});
