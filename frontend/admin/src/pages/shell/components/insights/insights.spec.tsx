// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, test, expect } from "vitest";
import { commands, page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  stubJsonResponse,
  type ResponseContext,
} from "@frontend-testing/server-stubs";
import { App } from "@/components/app/app.view";
import { stubShell, municipality, insightsFor } from "@/test/fixtures";

function stubManager() {
  stubShell();
  stubJsonResponse({
    path: "*/v2/public/session",
    response: {
      session: {
        userId: "manager",
        tenantId: municipality.id,
        displayName: "Uxía",
        role: "manager",
      },
    },
  });
  return stubJsonResponse({
    path: "*/v2/manager/insights",
    response: ({ url }: ResponseContext) => {
      const params = new URL(url).searchParams;
      const from = params.get("from") ?? "";
      return insightsFor(
        from,
        params.get("to") ?? "",
        from.startsWith("2026-10") ? 42 : 30,
      );
    },
  });
}

describe("indicators", () => {
  test("should show an accessible weekday × hour heatmap for the period in the URL", async () => {
    stubManager();
    await commands.navigate(
      "/admin/vilaverde/indicadores?from=2026-10-01&to=2026-10-31",
    );
    await render(<App />);
    const table = page.getByRole("table", {
      name: /Ocupación por día da semana e hora, do 1 ao 31 de outubro de 2026/,
    });
    await expect.element(table).toBeVisible();
    await expect
      .element(table.getByRole("columnheader", { name: "Lun" }))
      .toBeVisible();
    await expect
      .element(table.getByRole("rowheader", { name: "18:00" }))
      .toBeVisible();
    await expect
      .element(table.getByRole("cell", { name: "80 %" }))
      .toBeVisible();
    await expect
      .element(table.getByRole("cell", { name: "Pechado" }).first())
      .toBeInTheDocument();
    const noShows = page
      .getByRole("term")
      .filter({ hasText: "Non presentados" })
      .element().parentElement!;
    expect(noShows.querySelector(".stat-value")?.textContent).toBe("3");
    await expect
      .element(
        page.getByRole("columnheader", {
          name: "Non presentados",
          exact: true,
        }),
      )
      .toBeVisible();
    await expect
      .element(page.getByRole("link", { name: /Descargar CSV/ }))
      .toHaveAttribute(
        "href",
        "/v2/manager/insights/export?from=2026-10-01&to=2026-10-31&lang=gl",
      );
  });

  test("should request both months and show the difference when comparing", async () => {
    const { spy } = stubManager();
    await commands.navigate(
      "/admin/vilaverde/indicadores?from=2026-10-01&to=2026-10-31",
    );
    await render(<App />);
    await page.getByText("Comparar con outro período").click();
    await expect
      .element(
        page.getByRole("table", {
          name: /do 1 ao 30 de setembro de 2026/,
        }),
      )
      .toBeVisible();
    const requested = spy.mock.calls.map(([request]) => {
      const params = new URL(request.url).searchParams;
      return `${params.get("from")}/${params.get("to")}`;
    });
    expect(requested).toContain("2026-10-01/2026-10-31");
    expect(requested).toContain("2026-09-01/2026-09-30");
    await expect
      .element(page.getByText("+12 puntos fronte ao período comparado"))
      .toBeVisible();
    await expect
      .element(page.getByRole("link", { name: /Descargar CSV/ }))
      .toHaveLength(2);
    expect(new URL(location.href).searchParams.get("compareFrom")).toBe(
      "2026-09-01",
    );
  });

  test("should explain a period longer than 16 months without calling the API", async () => {
    const { spy } = stubManager();
    await commands.navigate(
      "/admin/vilaverde/indicadores?from=2025-01-01&to=2026-05-01",
    );
    await render(<App />);
    await expect
      .element(page.getByText("O período non pode superar os 16 meses."))
      .toBeVisible();
    expect(spy).not.toHaveBeenCalled();
  });
});
