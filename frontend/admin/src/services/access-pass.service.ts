// SPDX-License-Identifier: AGPL-3.0-or-later
import { compactVerify, decodeProtectedHeader, importJWK } from "jose";
import type { AccessBooking, AccessDay } from "@/types/models";
export type PassCheck =
  | { result: "valid"; booking: AccessBooking }
  | { result: "already_in"; booking: AccessBooking }
  | { result: "revoked"; booking: AccessBooking | null }
  | { result: "out_of_window"; booking: AccessBooking | null }
  | { result: "invalid" };
interface Claims {
  iss: string;
  sub: string;
  nbf: number;
  exp: number;
}
// Device clocks drift; a minute either side is tolerated.
const SKEW_SECONDS = 60;
/**
 * Checks a scanned pass with nothing but the synced day: ES256 signature with the municipality's
 * published key, issuer, validity window, revocation list and earlier check-ins.
 */
export async function checkPass(
  token: string,
  day: AccessDay,
  checkedIn: ReadonlySet<string>,
  nowSeconds: number,
): Promise<PassCheck> {
  let claims: Claims;
  try {
    const { kid } = decodeProtectedHeader(token);
    const jwk = day.keys.find((key) => key.kid === kid);
    if (!jwk) return { result: "invalid" };
    const { payload } = await compactVerify(
      token,
      await importJWK(jwk, "ES256"),
      { algorithms: ["ES256"] },
    );
    claims = JSON.parse(new TextDecoder().decode(payload)) as Claims;
  } catch {
    return { result: "invalid" };
  }
  if (claims.iss !== day.issuer) return { result: "invalid" };
  const booking = day.bookings.find((item) => item.id === claims.sub) ?? null;
  if (day.revoked.includes(claims.sub)) return { result: "revoked", booking };
  if (
    nowSeconds + SKEW_SECONDS < claims.nbf ||
    nowSeconds - SKEW_SECONDS > claims.exp ||
    !booking
  )
    return { result: "out_of_window", booking };
  if (booking.checkedInAt || checkedIn.has(booking.id))
    return { result: "already_in", booking };
  return { result: "valid", booking };
}
