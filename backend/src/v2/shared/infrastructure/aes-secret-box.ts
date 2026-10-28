// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { Injectable } from "@nestjs/common";
import { SecretBox } from "../application/secret-box";
/** AES-256-GCM keyed by ACCESS_KEY_SECRET; the stored value is iv.tag.ciphertext in base64url. */
@Injectable()
export class AesSecretBox extends SecretBox {
  private readonly key: Buffer;
  constructor() {
    super();
    const configured = process.env.ACCESS_KEY_SECRET;
    if (!configured && process.env.DEMO_MODE !== "true")
      throw new Error("ACCESS_KEY_SECRET must be set outside the demo");
    this.key = createHash("sha256")
      .update(configured ?? "quenda-demo-access-key-secret")
      .digest();
  }
  seal(plaintext: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const data = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
    ]);
    return [iv, cipher.getAuthTag(), data]
      .map((part) => part.toString("base64url"))
      .join(".");
  }
  open(sealed: string) {
    const [iv, tag, data] = sealed
      .split(".")
      .map((part) => Buffer.from(part, "base64url"));
    const decipher = createDecipheriv("aes-256-gcm", this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString(
      "utf8",
    );
  }
}
