// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, test, expect } from "vitest";
import { commands, page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { stubJsonResponse } from "@frontend-testing/server-stubs";
import { App } from "@/components/app/app.view";
import { municipality, stubShell } from "@/test/fixtures";
import type {
  DeploymentInsights,
  DeploymentMunicipality,
  MunicipalitySettings,
  NewManager,
  NewMunicipality,
} from "@/types/models";

const settings: MunicipalitySettings = {
  ...municipality,
  holidaysCalendar: "",
  analyticsUrl: "",
  analyticsWebsiteId: null,
};
const deployment: DeploymentMunicipality[] = [
  {
    settings,
    facilities: 4,
    activeFacilities: 3,
    managers: [
      {
        id: "manager",
        municipalityId: municipality.id,
        displayName: "Uxía",
        email: null,
      },
    ],
  },
];
const session = { operatorId: "operator", displayName: "Deputación" };

function stubOperator(signedIn = true) {
  stubShell();
  stubJsonResponse({
    path: "*/v2/public/operator-session",
    response: { session: signedIn ? session : null },
  });
  stubJsonResponse({
    path: "*/v2/operator/municipalities",
    response: deployment,
  });
}

describe("supramunicipal operator area", () => {
  test("should sign the operator in from the empty state and list the municipalities", async () => {
    stubOperator(false);
    const { spy } = stubJsonResponse({
      path: "*/v2/public/operator-sessions",
      method: "POST",
      status: 201,
      response: session,
    });
    await commands.navigate("/admin/operador");
    await render(<App />);
    await page.getByRole("button", { name: "Entrar como operador/a" }).click();
    // The click only starts the request; wait for it rather than checking straight away.
    await expect.poll(() => spy).toHaveBeenCalledOnce();
    await expect
      .element(
        page.getByRole("heading", { level: 2, name: "Concello de Vilaverde" }),
      )
      .toBeVisible();
    await expect.element(page.getByText(/^3 \/ 4/)).toBeVisible();
    await expect.element(page.getByText("Uxía")).toBeVisible();
  });

  test("should create a municipality with a suggested slug after validating the form", async () => {
    stubOperator();
    const { spy } = stubJsonResponse({
      path: "*/v2/operator/municipalities",
      method: "POST",
      status: 201,
      response: ({ body }: { body: unknown }) => ({
        ...settings,
        ...(body as NewMunicipality),
      }),
    });
    await commands.navigate("/admin/operador/concellos");
    await render(<App />);
    await page.getByRole("button", { name: "Novo concello" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Dar de alta" }).click();
    await expect
      .element(dialog.getByText("Escribe polo menos 2 caracteres."))
      .toBeVisible();
    expect(spy).not.toHaveBeenCalled();
    await dialog
      .getByRole("textbox", { name: "Nome do concello" })
      .fill("Concello de Riotorto");
    await expect
      .element(
        dialog.getByRole("textbox", { name: "Identificador no enderezo" }),
      )
      .toHaveValue("riotorto");
    await dialog
      .getByRole("textbox", { name: "Contacto municipal" })
      .fill("deportes@riotorto.example");
    await dialog
      .getByRole("textbox", { name: "Texto en galego" })
      .fill("Aviso de privacidade do concello de Riotorto.");
    await dialog
      .getByRole("textbox", { name: "Texto en castelán" })
      .fill("Aviso de privacidad del ayuntamiento de Riotorto.");
    await dialog.getByRole("button", { name: "Dar de alta" }).click();
    await expect
      .element(page.getByRole("status"))
      .toHaveTextContent("Concello dado de alta: Concello de Riotorto");
    expect(spy.mock.calls.at(-1)![0].body).toMatchObject({
      slug: "riotorto",
      name: "Concello de Riotorto",
      timezone: "Europe/Madrid",
      locale: "gl",
      contact: "deportes@riotorto.example",
    });
  });

  test("should add a manager to a municipality", async () => {
    stubOperator();
    const { spy } = stubJsonResponse({
      path: "*/v2/operator/municipalities/:id/managers",
      method: "POST",
      status: 201,
      response: ({ body }: { body: unknown }) => ({
        ...(body as NewManager),
        municipalityId: municipality.id,
      }),
    });
    await commands.navigate("/admin/operador/concellos");
    await render(<App />);
    await page.getByRole("button", { name: "Engadir xestor/a" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("textbox", { name: "Nome" }).fill("Antía Souto");
    await dialog
      .getByRole("textbox", { name: "Correo de traballo" })
      .fill("antia");
    await dialog.getByRole("button", { name: "Engadir xestor/a" }).click();
    await expect
      .element(dialog.getByText("Escribe un enderezo de correo válido."))
      .toBeVisible();
    await dialog
      .getByRole("textbox", { name: "Correo de traballo" })
      .fill("antia@vilaverde.example");
    await dialog.getByRole("button", { name: "Engadir xestor/a" }).click();
    await expect
      .element(page.getByRole("status"))
      .toHaveTextContent("Xestor/a engadido/a: Antía Souto");
    expect(spy.mock.calls.at(-1)![0].body).toMatchObject({
      displayName: "Antía Souto",
      email: "antia@vilaverde.example",
    });
  });

  test("should show aggregated indicators per municipality with a deployment total", async () => {
    stubOperator();
    const insights: DeploymentInsights = {
      total: 12,
      confirmed: 10,
      cancelled: 2,
      noShows: 1,
      bookedMinutes: 600,
      openMinutes: 6000,
      occupancy: 10,
      facilities: 4,
      municipalities: [
        {
          id: municipality.id,
          slug: municipality.slug,
          name: municipality.name,
          from: "2026-10-01",
          to: "2026-10-31",
          total: 12,
          confirmed: 10,
          cancelled: 2,
          noShows: 1,
          bookedMinutes: 600,
          openMinutes: 6000,
          occupancy: 10,
          facilities: 4,
        },
      ],
    };
    const { spy } = stubJsonResponse({
      path: "*/v2/operator/insights",
      response: insights,
    });
    await commands.navigate(
      "/admin/operador/indicadores?from=2026-10-01&to=2026-10-31",
    );
    await render(<App />);
    const table = page.getByRole("table", {
      name: "Indicadores por concello no período seleccionado.",
    });
    await expect
      .element(table.getByRole("rowheader", { name: "Concello de Vilaverde" }))
      .toBeVisible();
    await expect
      .element(table.getByRole("rowheader", { name: "Total do despregamento" }))
      .toBeVisible();
    await expect
      .element(table.getByRole("columnheader", { name: "Non presentados" }))
      .toBeVisible();
    const url = new URL(spy.mock.calls.at(-1)![0].url);
    expect(url.searchParams.get("from")).toBe("2026-10-01");
    expect(url.searchParams.get("to")).toBe("2026-10-31");
  });

  test("should offer both municipal management and the operator area from the admin home", async () => {
    stubShell();
    await commands.navigate("/admin/");
    await render(<App />);
    await expect
      .element(page.getByRole("link", { name: "Concello de Vilaverde" }))
      .toHaveAttribute("href", "/admin/vilaverde/xestion");
    await expect
      .element(
        page.getByRole("link", { name: "Entrar na área supramunicipal" }),
      )
      .toHaveAttribute("href", "/admin/operador");
  });
});
