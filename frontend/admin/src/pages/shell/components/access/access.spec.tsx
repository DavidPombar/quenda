// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, test, expect } from "vitest";
import { commands, page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { stubJsonResponse } from "@frontend-testing/server-stubs";
import { App } from "@/components/app/app.view";
import { stubShell, municipality, facility } from "@/test/fixtures";
import type { AccessKeys, CheckIn, ManagedBooking } from "@/types/models";

const bookingId = "30000000-0000-4000-8000-000000000001";
const kid = "50000000-0000-4000-8000-000000000001";

function encode(value: object | Uint8Array) {
  const bytes =
    value instanceof Uint8Array
      ? value
      : new TextEncoder().encode(JSON.stringify(value));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** A municipal key pair and signer, as the server would hold them. */
async function issuer() {
  const pair = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, [
    "sign",
    "verify",
  ])) as CryptoKeyPair;
  const jwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  const keys: AccessKeys = {
    issuer: municipality.slug,
    timezone: municipality.timezone,
    keys: [
      {
        kty: "OKP",
        crv: "Ed25519",
        alg: "EdDSA",
        kid,
        x: jwk.x ?? "",
        fingerprint: "1a2b:3c4d:5e6f:7a8b",
        createdAt: "2026-10-01T08:00:00Z",
      },
    ],
  };
  async function sign(claims: Record<string, unknown>) {
    const input = `${encode({ alg: "EdDSA", typ: "JWT", kid })}.${encode(claims)}`;
    const signature = await crypto.subtle.sign(
      { name: "Ed25519" },
      pair.privateKey,
      new TextEncoder().encode(input),
    );
    return `${input}.${encode(new Uint8Array(signature))}`;
  }
  return { keys, sign };
}

const now = () => Math.floor(Date.now() / 1000);
const claims = (overrides: Record<string, unknown> = {}) => ({
  iss: municipality.slug,
  sub: bookingId,
  fac: facility.id,
  nbf: now() - 3600,
  exp: now() + 1800,
  ...overrides,
});
const row: ManagedBooking = {
  id: bookingId,
  facilityId: facility.id,
  facilityName: facility.name,
  sport: "padel",
  start: new Date((now() - 600) * 1000).toISOString(),
  end: new Date((now() + 1800) * 1000).toISOString(),
  status: "confirmed",
  outcome: "attended",
  cancelledBy: null,
  cancellationReason: null,
  displayName: "Alex",
  checkedInAt: null,
  canMarkNoShow: true,
  canRevert: false,
  canCancel: false,
};

function stubStaff(keys: AccessKeys) {
  stubShell();
  stubJsonResponse({
    path: "*/v2/public/session",
    response: {
      session: {
        userId: "staff",
        tenantId: municipality.id,
        displayName: "Brais · conserxería",
        role: "staff",
      },
    },
  });
  stubJsonResponse({ path: "*/v2/access/keys", response: keys });
  stubJsonResponse({ path: "*/v2/manager/bookings", response: [row] });
}

function setOnline(value: boolean) {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    get: () => value,
  });
  window.dispatchEvent(new Event(value ? "online" : "offline"));
}

async function scan(token: string) {
  await page.getByRole("textbox", { name: "Código da reserva" }).fill(token);
  await page.getByRole("button", { name: "Comprobar" }).click();
}

afterEach(() => setOnline(true));

describe("access control", () => {
  test("should let door staff in with a valid QR and record the entry, showing only their screens", async () => {
    const { keys, sign } = await issuer();
    stubStaff(keys);
    const recorded: unknown[] = [];
    stubJsonResponse({
      path: "*/v2/access/check-ins",
      method: "POST",
      response: ({ body }: { body: unknown }): CheckIn => {
        recorded.push(body);
        return {
          bookingId,
          facilityId: facility.id,
          facilityName: facility.name,
          displayName: "Alex",
          start: row.start,
          end: row.end,
          checkedInAt: new Date().toISOString(),
          alreadyCheckedIn: false,
        };
      },
    });
    await commands.navigate("/admin/vilaverde/xestion");
    await render(<App />);
    await expect
      .element(
        page.getByRole("heading", { level: 1, name: "Control de acceso" }),
      )
      .toBeVisible();
    const nav = page.getByRole("navigation", { name: "Área do concello" });
    await expect
      .element(nav.getByRole("link", { name: "Reservas" }))
      .toBeVisible();
    await expect
      .element(nav.getByRole("link", { name: "Axustes" }))
      .not.toBeInTheDocument();
    await expect
      .element(nav.getByRole("link", { name: "Auditoría" }))
      .not.toBeInTheDocument();
    const token = await sign(claims());
    await scan(token);
    await expect
      .element(page.getByRole("status").getByText("Acceso permitido"))
      .toBeVisible();
    await expect.element(page.getByText("Alex", { exact: true })).toBeVisible();
    expect(recorded).toEqual([{ token }]);
  });

  test("should refuse forged, early, expired and foreign codes on the phone without calling the server", async () => {
    const { keys, sign } = await issuer();
    const other = await issuer();
    stubStaff(keys);
    await commands.navigate("/admin/vilaverde/acceso");
    await render(<App />);
    await expect.element(page.getByText("Con conexión")).toBeVisible();
    const cases: [string, string][] = [
      [
        await sign(claims({ nbf: now() + 3600, exp: now() + 7200 })),
        "Aínda non: o espazo non abriu para esta reserva",
      ],
      [
        await sign(claims({ nbf: now() - 7200, exp: now() - 3600 })),
        "Código caducado",
      ],
      [await sign(claims({ iss: "portomar" })), "Código doutro concello"],
      [await other.sign(claims()), "Código non válido"],
      ["not-a-code", "Código non válido"],
    ];
    for (const [token, verdict] of cases) {
      await scan(token);
      await expect
        .element(page.getByRole("alert").getByText(verdict))
        .toBeVisible();
    }
  });

  test("should keep entries scanned without connection and send them when it comes back", async () => {
    const { keys, sign } = await issuer();
    stubStaff(keys);
    const recorded: { token: string; scannedAt?: string }[] = [];
    stubJsonResponse({
      path: "*/v2/access/check-ins",
      method: "POST",
      response: ({ body }: { body: unknown }) => {
        recorded.push(body as { token: string; scannedAt?: string });
        return {
          bookingId,
          facilityId: facility.id,
          facilityName: facility.name,
          displayName: "Alex",
          start: row.start,
          end: row.end,
          checkedInAt: new Date().toISOString(),
          alreadyCheckedIn: false,
        } satisfies CheckIn;
      },
    });
    await commands.navigate("/admin/vilaverde/acceso");
    await render(<App />);
    await expect.element(page.getByText("Con conexión")).toBeVisible();
    setOnline(false);
    await expect
      .element(page.getByText("Sen conexión: as entradas gárdanse no móbil"))
      .toBeVisible();
    const token = await sign(claims());
    await scan(token);
    await expect
      .element(
        page.getByText(
          "Rexistrada no móbil; enviarase ao recuperar a conexión.",
        ),
      )
      .toBeVisible();
    await expect
      .element(page.getByText(/Entradas por enviar: 1/))
      .toBeVisible();
    expect(recorded).toEqual([]);
    setOnline(true);
    await expect.element(page.getByText("Entradas enviadas: 1")).toBeVisible();
    expect(recorded).toHaveLength(1);
    expect(recorded[0].token).toBe(token);
    expect(recorded[0].scannedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
