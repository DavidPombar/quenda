// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, test, expect } from "vitest";
import { commands, page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  stubJsonResponse,
  type ResponseContext,
} from "@frontend-testing/server-stubs";
import { App } from "@/components/app/app.view";
import { stubShell, municipality } from "@/test/fixtures";
import type { AuditEvent } from "@/types/models";

const created: AuditEvent = {
  id: "50000000-0000-4000-8000-000000000001",
  action: "booking.created",
  actorId: "10000000-0000-4000-8000-000000000011",
  actorRole: "citizen",
  actorName: "Alex",
  resourceId: "30000000-0000-4000-8000-000000000021",
  occurredAt: "2026-10-20T08:30:00Z",
  details: { start: "2026-10-21T16:00:00Z", facilityId: "pista-1" },
};
const retention: AuditEvent = {
  id: "50000000-0000-4000-8000-000000000002",
  action: "retention.applied",
  actorId: null,
  actorRole: "system",
  actorName: null,
  resourceId: municipality.id,
  occurredAt: "2026-10-19T02:00:00Z",
  details: null,
};

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
}

describe("audit log", () => {
  test("should list audit events with their details when a manager opens the audit log", async () => {
    stubManager();
    stubJsonResponse({
      path: "*/v2/manager/audit",
      response: [created, retention],
    });
    await commands.navigate("/admin/vilaverde/auditoria");
    await render(<App />);
    await expect
      .element(page.getByRole("heading", { level: 1, name: "Auditoría" }))
      .toBeVisible();
    const table = page.getByRole("table", {
      name: "Eventos rexistrados, do máis recente ao máis antigo (máximo 100).",
    });
    await expect
      .element(table.getByRole("rowheader", { name: "Reserva creada" }))
      .toBeVisible();
    await expect
      .element(
        table.getByRole("rowheader", {
          name: "Política de conservación aplicada",
        }),
      )
      .toBeVisible();
    await expect.element(table.getByText("Sistema")).toBeVisible();
    await expect
      .element(table.getByText("30000000…"))
      .toHaveAttribute("title", created.resourceId);
    await table.getByText("Ver detalle").click();
    await expect
      .element(table.getByText(/"start": "2026-10-21T16:00:00Z"/))
      .toBeVisible();
    await expect
      .element(page.getByRole("link", { name: "Auditoría" }))
      .toHaveAttribute("aria-current", "page");
  });

  test("should request the selected action and local day bounds when the filters change", async () => {
    stubManager();
    const { spy } = stubJsonResponse({
      path: "*/v2/manager/audit",
      response: ({ url }: ResponseContext) =>
        new URL(url).searchParams.get("action") === "booking.cancelled"
          ? []
          : [created],
    });
    await commands.navigate("/admin/vilaverde/auditoria");
    await render(<App />);
    await expect
      .element(page.getByRole("rowheader", { name: "Reserva creada" }))
      .toBeVisible();
    await page
      .getByRole("combobox", { name: "Acción" })
      .selectOptions("booking.cancelled");
    await expect
      .element(
        page.getByRole("heading", {
          name: "Non hai eventos con estes filtros",
        }),
      )
      .toBeVisible();
    const actionUrl = new URL(spy.mock.calls.at(-1)![0].url);
    expect(actionUrl.searchParams.get("action")).toBe("booking.cancelled");
    await page.getByLabelText("Desde o día").fill("2026-10-01");
    await page.getByLabelText("Ata o día").fill("2026-10-20");
    await expect
      .poll(() => new URL(spy.mock.calls.at(-1)![0].url).searchParams.get("to"))
      .toBe("2026-10-20T21:59:59.999Z");
    const rangeUrl = new URL(spy.mock.calls.at(-1)![0].url);
    expect(rangeUrl.searchParams.get("from")).toBe("2026-09-30T22:00:00.000Z");
    expect(rangeUrl.searchParams.get("action")).toBe("booking.cancelled");
    expect(new URL(location.href).searchParams.get("action")).toBe(
      "booking.cancelled",
    );
    await page.getByRole("button", { name: "Quitar filtros" }).click();
    await expect
      .element(page.getByRole("rowheader", { name: "Reserva creada" }))
      .toBeVisible();
  });

  test("should explain the missing permission when the audit log is forbidden", async () => {
    stubManager();
    stubJsonResponse({
      path: "*/v2/manager/audit",
      status: 403,
      response: { code: "forbidden", detail: "Non tes permiso para isto." },
    });
    await commands.navigate("/admin/vilaverde/auditoria");
    await render(<App />);
    await expect
      .element(
        page.getByRole("alert").getByRole("heading", {
          name: "Esta conta non pode consultar a auditoría.",
        }),
      )
      .toBeVisible();
    await expect.element(page.getByRole("table")).not.toBeInTheDocument();
  });

  test("should show the empty state when no event has been recorded", async () => {
    stubManager();
    stubJsonResponse({ path: "*/v2/manager/audit", response: [] });
    await commands.navigate("/admin/vilaverde/auditoria");
    await render(<App />);
    await expect
      .element(
        page.getByRole("heading", {
          name: "Aínda non hai eventos rexistrados",
        }),
      )
      .toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "Quitar filtros" }))
      .not.toBeInTheDocument();
  });

  test("should hide the audit log from visitors without a manager session", async () => {
    stubShell(true);
    await commands.navigate("/admin/vilaverde/auditoria");
    await render(<App />);
    await expect
      .element(
        page.getByRole("heading", {
          name: "Este espazo é para o persoal municipal.",
        }),
      )
      .toBeVisible();
    await expect
      .element(page.getByRole("link", { name: "Auditoría" }))
      .not.toBeInTheDocument();
  });

  test("should keep the table inside its scroll area on a 390px screen", async () => {
    await page.viewport(390, 844);
    stubManager();
    stubJsonResponse({
      path: "*/v2/manager/audit",
      response: [created, retention],
    });
    await commands.navigate("/admin/vilaverde/auditoria");
    await render(<App />);
    await expect
      .element(page.getByRole("rowheader", { name: "Reserva creada" }))
      .toBeVisible();
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      window.innerWidth,
    );
    await page.viewport(1280, 900);
  });
});
