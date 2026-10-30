// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, test, expect } from "vitest";
import { commands, page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  stubJsonResponse,
  type ResponseContext,
} from "@frontend-testing/server-stubs";
import { App } from "@/components/app/app.view";
import {
  stubShell,
  municipality,
  insightsFor,
  webAnalyticsFor,
} from "@/test/fixtures";

function stubManager() {
  stubShell();
  // Without an Umami in the deployment the visits section stays hidden.
  stubJsonResponse({
    path: "*/v2/manager/web-analytics",
    response: webAnalyticsFor({ available: false, app: null }),
  });
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

  test("should break a facility with several courts down by court", async () => {
    stubManager();
    const report = insightsFor("2026-10-01", "2026-10-31", 42);
    const court = (
      id: string,
      name: string,
      parentId: string | null,
      occupancy: number,
    ) => ({
      id,
      name,
      parentId,
      confirmed: 1,
      cancelled: 0,
      noShows: 0,
      bookedMinutes: 60,
      openMinutes: 120,
      occupancy,
    });
    stubJsonResponse({
      path: "*/v2/manager/insights",
      response: {
        ...report,
        byFacility: report.byFacility.map((facility) => ({
          ...facility,
          byResource: [
            court("whole", "Pista completa", null, 50),
            court("a", "Tercio A", "whole", 75),
          ],
        })),
      },
    });
    await commands.navigate(
      "/admin/vilaverde/indicadores?from=2026-10-01&to=2026-10-31",
    );
    await render(<App />);
    const table = page.getByRole("table", {
      name: "Ocupación por instalación",
    });
    const third = table.getByRole("row").filter({ hasText: "Tercio A" });
    await expect
      .element(
        table.getByRole("rowheader", {
          name: "Pistas de pádel da Carballeira, Tercio A",
        }),
      )
      .toBeVisible();
    await expect
      .element(third.getByRole("cell", { name: "75 %" }))
      .toBeVisible();
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
  test("should show the council's app visits for the same period when analytics is on", async () => {
    stubManager();
    const { spy } = stubJsonResponse({
      path: "*/v2/manager/web-analytics",
      response: webAnalyticsFor(),
    });
    await commands.navigate(
      "/admin/vilaverde/indicadores?from=2026-10-01&to=2026-10-31",
    );
    await render(<App />);
    const section = page.getByRole("region", { name: "Visitas á app" });
    await expect
      .element(section.getByRole("definition").filter({ hasText: "120" }))
      .toBeVisible();
    await expect.element(section.getByText("2 min 05 s")).toBeVisible();
    const events = section.getByRole("table", { name: "Eventos" });
    await expect
      .element(events.getByRole("rowheader", { name: "Reservas confirmadas" }))
      .toBeVisible();
    await expect
      .element(
        section
          .getByRole("table", { name: "Dispositivos" })
          .getByRole("rowheader", { name: "Móbil" }),
      )
      .toBeVisible();
    const url = new URL(spy.mock.calls.at(-1)![0].url);
    expect(url.searchParams.get("from")).toBe("2026-10-01");
    expect(url.searchParams.get("to")).toBe("2026-10-31");
  });
  test("should invite the manager to switch analytics on in the settings", async () => {
    stubManager();
    stubJsonResponse({
      path: "*/v2/manager/web-analytics",
      response: webAnalyticsFor({ enabled: false, app: null }),
    });
    await commands.navigate(
      "/admin/vilaverde/indicadores?from=2026-10-01&to=2026-10-31",
    );
    await render(<App />);
    await expect
      .element(
        page.getByText(/A analítica web está desactivada. Podes activala/),
      )
      .toBeVisible();
  });
});
