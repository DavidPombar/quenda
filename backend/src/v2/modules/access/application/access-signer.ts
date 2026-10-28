// SPDX-License-Identifier: AGPL-3.0-or-later
import type { AccessKeyRecord } from "../domain/access.read-model";
export interface PassClaims {
  iss: string;
  sub: string;
  fac: string;
  seq: number;
  iat: number;
  nbf: number;
  exp: number;
}
/** ES256 keys and compact JWS; verifiable offline with the published public key. */
export abstract class AccessSigner {
  abstract generate(createdAt: AccessKeyRecord["createdAt"]): AccessKeyRecord;
  abstract sign(key: AccessKeyRecord, claims: PassClaims): string;
}
