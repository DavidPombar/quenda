// SPDX-License-Identifier: AGPL-3.0-or-later
import type { AccessKeys } from "@/types/models";
/** Registered claims of a Quenda access credential (compact JWS, EdDSA). */
export interface AccessClaims {
  iss: string;
  sub: string;
  fac: string;
  nbf: number;
  exp: number;
}
export type CredentialStatus =
  "valid" | "not_yet_valid" | "expired" | "other_municipality" | "invalid";
function bytes(part: string) {
  const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
function json(part: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(new TextDecoder().decode(bytes(part)));
    return value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}
function isClaims(
  value: Record<string, unknown> | null,
): value is Record<string, unknown> & AccessClaims {
  return (
    !!value &&
    typeof value.iss === "string" &&
    typeof value.sub === "string" &&
    typeof value.fac === "string" &&
    typeof value.nbf === "number" &&
    typeof value.exp === "number"
  );
}
/**
 * Checks a scanned credential on the phone, without a connection (M3): the signature against the
 * cached municipal key, the issuer and the validity window at `seconds` since the epoch. The
 * server repeats every check when the scan is recorded.
 */
export async function verifyCredential(
  token: string,
  keys: AccessKeys,
  seconds: number,
): Promise<{ status: CredentialStatus; claims: AccessClaims | null }> {
  const parts = token.trim().split(".");
  if (parts.length !== 3) return { status: "invalid", claims: null };
  const header = json(parts[0]);
  const claims = json(parts[1]);
  if (!header || header.alg !== "EdDSA" || !isClaims(claims))
    return { status: "invalid", claims: null };
  if (claims.iss !== keys.issuer)
    return { status: "other_municipality", claims };
  const key = keys.keys.find((item) => item.kid === header.kid);
  if (!key) return { status: "invalid", claims };
  try {
    const publicKey = await crypto.subtle.importKey(
      "jwk",
      { kty: "OKP", crv: "Ed25519", x: key.x },
      { name: "Ed25519" },
      false,
      ["verify"],
    );
    const valid = await crypto.subtle.verify(
      { name: "Ed25519" },
      publicKey,
      bytes(parts[2]),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
    );
    if (!valid) return { status: "invalid", claims };
  } catch {
    return { status: "invalid", claims };
  }
  if (seconds < claims.nbf) return { status: "not_yet_valid", claims };
  if (seconds >= claims.exp) return { status: "expired", claims };
  return { status: "valid", claims };
}
