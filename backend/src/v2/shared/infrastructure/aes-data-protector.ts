// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  hkdfSync,
  randomBytes,
} from "node:crypto";
import { Logger } from "@nestjs/common";
import { DataProtector } from "../application/data-protector";
const version = "v1";
/**
 * AES-256-GCM with a random 96-bit IV per value and HMAC-SHA256 digests. Both subkeys are derived
 * with HKDF from QUENDA_DATA_KEY (base64, 32 bytes), so one secret serves both purposes without
 * reusing the same key material. Ciphertext format: `v1.<iv>.<tag>.<data>` in base64url.
 */
export class AesDataProtector extends DataProtector {
  private readonly keys: { encryption: Buffer; digest: Buffer } | null;
  constructor(key: string | undefined = process.env.QUENDA_DATA_KEY) {
    super();
    const material = key ? Buffer.from(key, "base64") : Buffer.alloc(0);
    if (material.length !== 32) {
      this.keys = null;
      new Logger(DataProtector.name).warn(
        key
          ? "QUENDA_DATA_KEY must be 32 bytes in base64; sensitive fields such as the NIF will not be stored"
          : "QUENDA_DATA_KEY is not set; sensitive fields such as the NIF will not be stored",
      );
      return;
    }
    const derive = (info: string) =>
      Buffer.from(hkdfSync("sha256", material, Buffer.alloc(0), info, 32));
    this.keys = {
      encryption: derive("quenda/data/encryption"),
      digest: derive("quenda/data/digest"),
    };
  }
  available() {
    return this.keys !== null;
  }
  encrypt(plaintext: string) {
    const keys = this.require();
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", keys.encryption, iv);
    const data = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
    ]);
    return [version, iv, cipher.getAuthTag(), data]
      .map((part) =>
        typeof part === "string" ? part : part.toString("base64url"),
      )
      .join(".");
  }
  decrypt(ciphertext: string) {
    if (!this.keys) return null;
    const [prefix, iv, tag, data] = ciphertext.split(".");
    if (prefix !== version || !iv || !tag || data === undefined) return null;
    try {
      const decipher = createDecipheriv(
        "aes-256-gcm",
        this.keys.encryption,
        Buffer.from(iv, "base64url"),
      );
      decipher.setAuthTag(Buffer.from(tag, "base64url"));
      return Buffer.concat([
        decipher.update(Buffer.from(data, "base64url")),
        decipher.final(),
      ]).toString("utf8");
    } catch {
      return null;
    }
  }
  digest(value: string) {
    return createHmac("sha256", this.require().digest)
      .update(value, "utf8")
      .digest("base64url");
  }
  private require() {
    if (!this.keys) throw new Error("DataProtector is not configured");
    return this.keys;
  }
}
