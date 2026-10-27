// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, test, expect } from "vitest";
import { commands, page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  stubJsonResponse,
  type ResponseContext,
} from "@frontend-testing/server-stubs";
import { App } from "@/components/app/app.view";
import type { CatalogEntry, MunicipalitySummary } from "@/types/models";
const municipalities: MunicipalitySummary[] = [
  { id: "m1", slug: "vilaverde", name: "Concello de Vilaverde" },
  { id: "m3", slug: "riotorto", name: "Concello de Riotorto" },
];
const pool: CatalogEntry = {
  id: "pool",
  name: "Piscina de Riotorto",
  sport: "swimming",
  address: "Rúa do Río, 1",
  description: "Piscina cuberta.",
  accessible: true,
  slotMinutes: 60,
  priceCents: 0,
  municipality: { slug: "riotorto", name: "Concello de Riotorto" },
};
const court: CatalogEntry = {
  ...pool,
  id: "court",
  name: "Pistas de pádel da Carballeira",
  sport: "padel",
  accessible: false,
  municipality: { slug: "vilaverde", name: "Concello de Vilaverde" },
};
function stubCatalog() {
  stubJsonResponse({
    path: "*/v2/public/municipalities",
    response: municipalities,
  });
  return stubJsonResponse({
    path: "*/v2/public/catalog",
    response: ({ url }: ResponseContext) => {
      const params = new URL(url).searchParams;
      return [pool, court].filter(
        (item) =>
          (!params.get("municipality") ||
            params
              .get("municipality")!
              .split(",")
              .includes(item.municipality.slug)) &&
          (!params.get("sport") || params.get("sport") === item.sport) &&
          (params.get("accessible") !== "true" || item.accessible),
      );
    },
  });
}
describe("shared facility search", () => {
  test("should list facilities from every municipality with a link to book in each one", async () => {
    stubCatalog();
    await commands.navigate("/instalacions");
    await render(<App />);
    await expect
      .element(
        page.getByRole("heading", { level: 2, name: "Piscina de Riotorto" }),
      )
      .toBeVisible();
    await expect
      .element(page.getByText("2 instalacións atopadas"))
      .toBeVisible();
    await expect
      .element(
        page.getByRole("link", {
          name: "Ver horarios e reservar: Piscina de Riotorto",
        }),
      )
      .toHaveAttribute("href", "/app/riotorto/instalacions/pool");
  });
  test("should send the municipality, sport and access filters and keep them in the address", async () => {
    const { spy } = stubCatalog();
    await commands.navigate("/instalacions");
    await render(<App />);
    await page.getByRole("checkbox", { name: "Concello de Riotorto" }).click();
    await page
      .getByRole("combobox", { name: "Deporte" })
      .selectOptions("swimming");
    await page
      .getByRole("checkbox", { name: "Só con acceso sen barreiras" })
      .click();
    await expect
      .poll(() =>
        new URL(spy.mock.calls.at(-1)![0].url).searchParams.get("accessible"),
      )
      .toBe("true");
    await expect.element(page.getByText("1 instalación atopada")).toBeVisible();
    const url = new URL(spy.mock.calls.at(-1)![0].url);
    expect(url.searchParams.get("municipality")).toBe("riotorto");
    expect(url.searchParams.get("sport")).toBe("swimming");
    expect(url.searchParams.get("accessible")).toBe("true");
    expect(new URL(location.href).searchParams.get("municipality")).toBe(
      "riotorto",
    );
    await page
      .getByRole("combobox", { name: "Deporte" })
      .selectOptions("tennis");
    await expect
      .element(page.getByText("Non hai instalacións con estes filtros."))
      .toBeVisible();
  });
  test("should link to the shared search from the home page", async () => {
    await commands.navigate("/");
    await render(<App />);
    await expect
      .element(
        page.getByRole("link", {
          name: "Busca instalacións na túa contorna",
        }),
      )
      .toHaveAttribute("href", "/instalacions");
  });
});
