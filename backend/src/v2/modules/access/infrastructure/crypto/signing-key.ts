// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  randomUUID,
  sign,
  verify,
} from "node:crypto";
import { open, seal } from "./key-encryption";
export interface StoredSigningKey {
  id: string;
  tenantId: string;
  publicKey: string;
  encryptedPrivateKey: Buffer;
}
/** A fresh Ed25519 pair; the PKCS#8 private key is sealed to its tenant and key id. */
export function generateSigningKey(tenantId: string): StoredSigningKey {
  const id = randomUUID();
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const jwk = publicKey.export({ format: "jwk" });
  return {
    id,
    tenantId,
    publicKey: jwk.x as string,
    encryptedPrivateKey: seal(
      privateKey.export({ format: "der", type: "pkcs8" }),
      `${tenantId}:${id}`,
    ),
  };
}
/** Compact JWS (RFC 7515) with EdDSA (RFC 8037); a plain JWT any library can verify. */
export function signJws(key: StoredSigningKey, claims: object) {
  const privateKey = createPrivateKey({
    key: open(key.encryptedPrivateKey, `${key.tenantId}:${key.id}`),
    format: "der",
    type: "pkcs8",
  });
  const input = `${encode({ alg: "EdDSA", typ: "JWT", kid: key.id })}.${encode(claims)}`;
  return `${input}.${sign(null, Buffer.from(input), privateKey).toString("base64url")}`;
}
export function jwsKeyId(token: string) {
  const header = decode(token.split(".")[0] ?? "");
  return header && header.alg === "EdDSA" && typeof header.kid === "string"
    ? header.kid
    : null;
}
export function verifyJws(token: string, x: string) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const key = createPublicKey({
    key: { kty: "OKP", crv: "Ed25519", x },
    format: "jwk",
  });
  const valid = verify(
    null,
    Buffer.from(`${parts[0]}.${parts[1]}`),
    key,
    Buffer.from(parts[2], "base64url"),
  );
  return valid ? decode(parts[1]) : null;
}
function encode(value: object) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}
function decode(part: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(
      Buffer.from(part, "base64url").toString("utf8"),
    );
    return value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}
