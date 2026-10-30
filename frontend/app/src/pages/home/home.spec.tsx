// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, test, expect } from "vitest";
import { commands, page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  stubJsonResponse,
  type ResponseContext,
} from "@frontend-testing/server-stubs";
import { App } from "@/components/app/app.view";
import { municipality, sports } from "@/test/fixtures";
import type { CatalogEntry } from "@/types/models";
const neighbour = {
  ...municipality,
  id: "m3",
  slug: "riotorto",
  name: "Concello de Riotorto",
};
const pool: CatalogEntry = {
  id: "pool",
  name: "Piscina de Riotorto",
  sport: "swimming",
  sportName: { gl: "Natación", es: "Natación" },
  sportArt: "swimming",
  photo: null,
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
  sportName: { gl: "Pádel", es: "Pádel" },
  sportArt: "padel",
  municipality: { slug: "vilaverde", name: "Concello de Vilaverde" },
};
function stubCatalog() {
  stubJsonResponse({
    path: "*/v2/public/municipalities",
    response: [municipality, neighbour],
  });
  stubJsonResponse({ path: "*/v2/public/sports", response: sports });
  return stubJsonResponse({
    path: "*/v2/public/catalog",
    response: ({ url }: ResponseContext) => {
      const params = new URL(url).searchParams;
      const items = [pool, court].filter(
        (item) =>
          (!params.get("municipality") ||
            params
              .get("municipality")!
              .split(",")
              .includes(item.municipality.slug)) &&
          (!params.get("sport") || params.get("sport") === item.sport),
      );
      return { items, total: items.length, page: 1, pageSize: 12 };
    },
  });
}
describe("shared catalogue on the app home", () => {
  test("should show facilities of several municipalities linking to each municipality's booking page", async () => {
    stubCatalog();
    await commands.navigate("/app/");
    await render(<App />);
    await expect
      .element(
        page.getByRole("heading", { level: 2, name: "Piscina de Riotorto" }),
      )
      .toBeVisible();
    await expect
      .element(
        page.getByRole("link", {
          name: "Ver horarios e reservar: Piscina de Riotorto",
        }),
      )
      .toHaveAttribute("href", "/app/riotorto/instalacions/pool");
    await expect
      .element(
        page.getByRole("link", {
          name: "Ver horarios e reservar: Pistas de pádel da Carballeira",
        }),
      )
      .toHaveAttribute("href", "/app/vilaverde/instalacions/court");
  });
  test("should narrow the results by municipality and sport", async () => {
    const { spy } = stubCatalog();
    await commands.navigate("/app/");
    await render(<App />);
    await page.getByRole("checkbox", { name: "Concello de Riotorto" }).click();
    await page.getByRole("button", { name: "Natación", exact: true }).click();
    await expect
      .poll(() =>
        new URL(spy.mock.calls.at(-1)![0].url).searchParams.get("sport"),
      )
      .toBe("swimming");
    expect(
      new URL(spy.mock.calls.at(-1)![0].url).searchParams.get("municipality"),
    ).toBe("riotorto");
    await expect
      .element(
        page.getByRole("heading", {
          level: 2,
          name: "Pistas de pádel da Carballeira",
        }),
      )
      .not.toBeInTheDocument();
  });
});
