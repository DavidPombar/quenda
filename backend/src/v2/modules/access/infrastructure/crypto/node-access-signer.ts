// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  createHash,
  createPrivateKey,
  generateKeyPairSync,
  sign,
} from "node:crypto";
import { Injectable } from "@nestjs/common";
import { AccessSigner, PassClaims } from "../../application/access-signer";
import { AccessKeyRecord, PublicJwk } from "../../domain/access.read-model";
import { SecretBox } from "../../../../shared/application/secret-box";
function base64url(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}
/** ES256 (P-256, SHA-256) with node:crypto; the private key is sealed before it is stored. */
@Injectable()
export class NodeAccessSigner extends AccessSigner {
  constructor(private readonly secrets: SecretBox) {
    super();
  }
  generate(createdAt: AccessKeyRecord["createdAt"]): AccessKeyRecord {
    const { publicKey, privateKey } = generateKeyPairSync("ec", {
      namedCurve: "P-256",
    });
    const jwk = publicKey.export({ format: "jwk" }) as PublicJwk;
    // RFC 7638 thumbprint as the key id.
    const kid = createHash("sha256")
      .update(
        JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y }),
      )
      .digest("base64url");
    return {
      kid,
      publicJwk: { ...jwk, kid, alg: "ES256", use: "sig" },
      privateKeySealed: this.secrets.seal(
        privateKey.export({ format: "pem", type: "pkcs8" }).toString(),
      ),
      createdAt,
      retiredAt: null,
    };
  }
  sign(key: AccessKeyRecord, claims: PassClaims) {
    const input = `${base64url({ alg: "ES256", typ: "JWT", kid: key.kid })}.${base64url(claims)}`;
    const signature = sign("sha256", Buffer.from(input), {
      key: createPrivateKey(this.secrets.open(key.privateKeySealed)),
      dsaEncoding: "ieee-p1363",
    });
    return `${input}.${signature.toString("base64url")}`;
  }
}
