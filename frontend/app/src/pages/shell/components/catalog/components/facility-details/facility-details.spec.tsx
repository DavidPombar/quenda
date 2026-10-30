// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, test, expect } from "vitest";
import { page, commands } from "vitest/browser";
import { render } from "vitest-browser-react";
import { stubJsonResponse } from "@frontend-testing/server-stubs";
import { App } from "@/components/app/app.view";
import {
  facility,
  pavilion,
  stubAvailability,
  stubShell,
} from "@/test/fixtures";
import type { Slot } from "@/types/models";
const slot: Slot = {
  start: "2026-10-20T08:00:00Z",
  end: "2026-10-20T09:00:00Z",
  status: "available",
};
const later: Slot = {
  start: "2026-10-20T09:00:00Z",
  end: "2026-10-20T10:00:00Z",
  status: "available",
};
const [fullCourt, , thirdA, thirdB] = pavilion.resources;
function stubCreate(target = facility) {
  return stubJsonResponse({
    path: "*/v2/citizen/bookings",
    method: "POST",
    response: {
      id: "booking-1",
      facilityId: target.id,
      ...slot,
      status: "confirmed",
    },
    status: 201,
  });
}
describe("Facility details with a single court", () => {
  test("should show a confirmation when a free slot is reserved", async () => {
    stubShell(true);
    stubAvailability(facility, () => [slot]);
    const create = stubCreate();
    await commands.navigate(`/app/vilaverde/instalacions/${facility.id}`);
    await render(<App />);
    await page.getByRole("button", { name: "10:00 Libre" }).click();
    await page.getByRole("button", { name: "Confirmar reserva" }).click();
    await expect
      .element(
        page.getByRole("heading", { name: "A túa quenda está confirmada!" }),
      )
      .toBeVisible();
    await expect
      .element(page.getByRole("combobox", { name: "Pista" }))
      .not.toBeInTheDocument();
    expect(create.spy.mock.calls[0][0].body).toEqual({
      id: expect.any(String) as string,
      facilityId: facility.id,
      start: slot.start,
    });
  });
  test("should keep the dialog open with an explanation when another person reserves the slot first", async () => {
    stubShell(true);
    stubAvailability(facility, () => [slot]);
    stubJsonResponse({
      path: "*/v2/citizen/bookings",
      method: "POST",
      response: {
        code: "slot_taken",
        detail: "Esta quenda xa está reservada. Escolle outra hora.",
      },
      status: 409,
    });
    await commands.navigate(`/app/vilaverde/instalacions/${facility.id}`);
    await render(<App />);
    await page.getByRole("button", { name: "10:00 Libre" }).click();
    await page.getByRole("button", { name: "Confirmar reserva" }).click();
    await expect
      .element(page.getByRole("alert"))
      .toMatchTextContent("Esta quenda xa está reservada.");
    await expect.element(page.getByRole("dialog")).toBeVisible();
  });
});
describe("Facility details with several courts", () => {
  test("should book the court chosen in the selector", async () => {
    stubShell(true);
    stubAvailability(pavilion, () => [slot]);
    const create = stubCreate(pavilion);
    await commands.navigate(`/app/vilaverde/instalacions/${pavilion.id}`);
    await render(<App />);
    const selector = page.getByRole("combobox", { name: "Pista" });
    await expect.element(selector).toHaveDisplayValue("Pista completa");
    await selector.selectOptions("Pista completa › Tercio B");
    await page.getByRole("button", { name: "10:00 Libre" }).click();
    await expect
      .element(page.getByRole("dialog"))
      .toMatchTextContent(/Pista completa › Tercio B/);
    await page.getByRole("button", { name: "Confirmar reserva" }).click();
    await expect
      .element(
        page.getByRole("heading", { name: "A túa quenda está confirmada!" }),
      )
      .toBeVisible();
    expect(create.spy.mock.calls[0][0].body).toEqual({
      id: expect.any(String) as string,
      facilityId: pavilion.id,
      resourceId: thirdB.id,
      start: slot.start,
    });
  });
  test("should not offer a court that is out of service", async () => {
    stubShell(true);
    stubAvailability(pavilion, () => [slot]);
    await commands.navigate(`/app/vilaverde/instalacions/${pavilion.id}`);
    await render(<App />);
    const selector = page.getByRole("combobox", { name: "Pista" });
    await expect.element(selector).toBeVisible();
    const options = Array.from(
      (selector.element() as HTMLSelectElement).options,
    ).map((option) => option.text);
    expect(options).toEqual([
      "Pista completa",
      "Pista completa › Tercio A",
      "Pista completa › Tercio B",
      "Todas as pistas",
    ]);
  });
  test("should list every court in a table and book the chosen cell", async () => {
    stubShell(true);
    stubAvailability(pavilion, (resourceId) =>
      resourceId === fullCourt.id
        ? [{ ...slot, status: "booked" }, later]
        : [slot, later],
    );
    const create = stubCreate(pavilion);
    await commands.navigate(`/app/vilaverde/instalacions/${pavilion.id}`);
    await render(<App />);
    await page
      .getByRole("combobox", { name: "Pista" })
      .selectOptions("Todas as pistas");
    const table = page.getByRole("table", {
      name: /Quendas de todas as pistas/,
    });
    await expect.element(table).toBeVisible();
    await expect
      .element(page.getByRole("region", { name: /Quendas de todas as pistas/ }))
      .toBeVisible();
    await expect
      .element(table.getByRole("columnheader", { name: "10:00" }))
      .toBeVisible();
    await expect
      .element(table.getByRole("rowheader", { name: "Pista completa" }))
      .toBeVisible();
    await expect
      .element(
        table.getByRole("rowheader", { name: "Pista completa › Tercio A" }),
      )
      .toBeVisible();
    await expect
      .element(table.getByRole("row", { name: /Tercio C/ }))
      .toMatchTextContent(/Fóra de servizo/);
    await expect
      .element(
        table.getByRole("button", {
          name: "10:00, Pista completa, Reservada",
        }),
      )
      .toBeDisabled();
    await table.getByRole("button", { name: "10:00, Tercio A, Libre" }).click();
    await expect
      .element(page.getByRole("dialog"))
      .toMatchTextContent(/Pista completa › Tercio A/);
    await page.getByRole("button", { name: "Confirmar reserva" }).click();
    await expect
      .element(
        page.getByRole("heading", { name: "A túa quenda está confirmada!" }),
      )
      .toBeVisible();
    expect(create.spy.mock.calls[0][0].body).toMatchObject({
      facilityId: pavilion.id,
      resourceId: thirdA.id,
      start: slot.start,
    });
  });
  test("should keep the table inside its own scroll area on a phone", async () => {
    stubShell(true);
    const many = Array.from({ length: 12 }, (_, i) => ({
      start: `2026-10-20T${String(6 + i).padStart(2, "0")}:00:00Z`,
      end: `2026-10-20T${String(7 + i).padStart(2, "0")}:00:00Z`,
      status: "available" as const,
    }));
    stubAvailability(pavilion, () => many);
    await page.viewport(390, 844);
    await commands.navigate(`/app/vilaverde/instalacions/${pavilion.id}`);
    await render(<App />);
    await page
      .getByRole("combobox", { name: "Pista" })
      .selectOptions("Todas as pistas");
    await expect.element(page.getByRole("table")).toBeVisible();
    const region = page
      .getByRole("region", { name: /Quendas de todas as pistas/ })
      .element();
    expect(region.scrollWidth, "the table scrolls inside").toBeGreaterThan(
      region.clientWidth,
    );
    expect(
      document.documentElement.scrollWidth > window.innerWidth,
      "page overflow at 390px",
    ).toBe(false);
  });
});
test("should show the reduced price of a verified category before the person confirms", async () => {
  stubShell(true);
  stubAvailability(facility, () => [slot]);
  stubJsonResponse({
    path: `*/v2/citizen/tariffs/${facility.id}`,
    response: { category: "resident", priceCents: 250 },
  });
  await commands.navigate(`/app/vilaverde/instalacions/${facility.id}`);
  await render(<App />);
  await expect
    .element(page.getByRole("heading", { name: "Tarifas" }))
    .toBeVisible();
  await page.getByRole("button", { name: "10:00 Libre" }).click();
  const dialog = page.getByRole("dialog");
  await expect.element(dialog).toMatchTextContent(/2,50\s€/);
  await expect
    .element(dialog)
    .toMatchTextContent("A túa tarifa: Persoa empadroada");
});
test("should show the general price and invite the visitor to sign in for their own tariff", async () => {
  stubShell();
  stubAvailability(facility, () => [slot]);
  await commands.navigate(`/app/vilaverde/instalacions/${facility.id}`);
  await render(<App />);
  await page.getByRole("button", { name: "10:00 Libre" }).click();
  const dialog = page.getByRole("dialog");
  await expect.element(dialog).toMatchTextContent(/4,00\s€/);
  await expect
    .element(dialog)
    .toMatchTextContent("verás o teu prezo ao entrar");
});
test("should show a club's season slot as taken and the campaign's published criteria", async () => {
  stubShell(true);
  stubJsonResponse({
    path: "*/v2/public/season-campaigns",
    response: [
      {
        id: "51000000-0000-4000-8000-000000000011",
        name: "Curso 2026–2027",
        startsOn: "2026-09-01",
        endsOn: "2027-06-30",
        criteria: { gl: "Clubs con sede no concello", es: "Clubes con sede" },
        facilityIds: [pavilion.id],
      },
    ],
  });
  stubAvailability(pavilion, () => [{ ...slot, status: "season" }, later]);
  await commands.navigate(`/app/vilaverde/instalacions/${pavilion.id}`);
  await render(<App />);
  await page
    .getByRole("combobox", { name: "Pista" })
    .selectOptions("Todas as pistas");
  await expect
    .element(
      page.getByRole("button", { name: "10:00, Pista completa, Uso de club" }),
    )
    .toBeDisabled();
  await expect
    .element(page.getByRole("heading", { name: "Temporada de clubs" }))
    .toBeVisible();
  await expect
    .element(page.getByText(/Clubs con sede no concello/))
    .toBeVisible();
});
