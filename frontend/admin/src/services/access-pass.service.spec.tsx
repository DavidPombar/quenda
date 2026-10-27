// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, test } from "vitest";
import { SignJWT, exportJWK, generateKeyPair } from "jose";
import type { AccessDay } from "@/types/models";
import { checkPass } from "./access-pass.service";
const NOW = 1_900_000_000;
async function issuer(kid: string) {
  const { privateKey, publicKey } = await generateKeyPair("ES256", {
    extractable: true,
  });
  return {
    jwk: {
      ...(await exportJWK(publicKey)),
      kid,
      alg: "ES256",
    } as unknown as Record<string, string>,
    sign: (
      claims: { sub: string; nbf: number; exp: number },
      iss = "vilaverde",
    ) =>
      new SignJWT({})
        .setProtectedHeader({ alg: "ES256", kid })
        .setIssuer(iss)
        .setSubject(claims.sub)
        .setNotBefore(claims.nbf)
        .setExpirationTime(claims.exp)
        .sign(privateKey),
  };
}
function day(
  keys: Record<string, string>[],
  revoked: string[] = [],
): AccessDay {
  return {
    date: "2030-03-17",
    syncedAt: "2030-03-17T08:00:00Z",
    issuer: "vilaverde",
    keys,
    revoked,
    bookings: ["b1", "b2"].map((id) => ({
      id,
      code: id.toUpperCase(),
      facilityId: "f1",
      facilityName: "Pista 1",
      start: "2030-03-17T10:00:00Z",
      end: "2030-03-17T11:00:00Z",
      status: revoked.includes(id) ? "cancelled" : "confirmed",
      holder: "Alex",
      checkedInAt: null,
    })),
  };
}
describe("offline pass check", () => {
  test("should accept a pass signed with the municipality's key inside its window", async () => {
    const key = await issuer("k1");
    const token = await key.sign({ sub: "b1", nbf: NOW - 60, exp: NOW + 600 });
    const check = await checkPass(token, day([key.jwk]), new Set(), NOW);
    expect(check).toMatchObject({ result: "valid", booking: { id: "b1" } });
    expect(
      (await checkPass(token, day([key.jwk]), new Set(["b1"]), NOW)).result,
    ).toBe("already_in");
  });
  test("should reject a pass outside its window, revoked or from another issuer", async () => {
    const key = await issuer("k1");
    const expired = await key.sign({
      sub: "b1",
      nbf: NOW - 7200,
      exp: NOW - 3600,
    });
    expect(
      (await checkPass(expired, day([key.jwk]), new Set(), NOW)).result,
    ).toBe("out_of_window");
    const revoked = await key.sign({
      sub: "b2",
      nbf: NOW - 60,
      exp: NOW + 600,
    });
    expect(
      (await checkPass(revoked, day([key.jwk], ["b2"]), new Set(), NOW)).result,
    ).toBe("revoked");
    const foreign = await key.sign(
      { sub: "b1", nbf: NOW - 60, exp: NOW + 600 },
      "portomar",
    );
    expect(
      (await checkPass(foreign, day([key.jwk]), new Set(), NOW)).result,
    ).toBe("invalid");
  });
  test("should reject a pass whose signature does not match the published key", async () => {
    const published = await issuer("k1");
    const forger = await issuer("k1");
    const token = await forger.sign({
      sub: "b1",
      nbf: NOW - 60,
      exp: NOW + 600,
    });
    expect(
      (await checkPass(token, day([published.jwk]), new Set(), NOW)).result,
    ).toBe("invalid");
    expect(
      (await checkPass("not-a-token", day([published.jwk]), new Set(), NOW))
        .result,
    ).toBe("invalid");
  });
});
