// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { OidcClaims } from "../../domain/oidc-provider";
import { ExternalIdentityRepository } from "../../domain/external-identity.repository";
import { SessionRepository } from "../../domain/session.repository";
import { normaliseNif } from "../../domain/sign-in-target";
import { ConsentRepository } from "../../../account/domain/consent.repository";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { DataProtector } from "../../../../shared/application/data-protector";
import { Clock } from "../../../../shared/application/clock";
import { IdGenerator } from "../../../../shared/application/id-generator";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
import { Principal } from "../../../../shared/application/principal";
export type CompleteOidcLoginError =
  AppError<"not_found"> | AppError<"consent_required">;
const fallbackName = "Persoa usuaria";
function displayName(claims: OidcClaims) {
  const full = [claims.givenName, claims.familyName]
    .filter((part): part is string => part !== null)
    .join(" ");
  return (full || claims.name || fallbackName).slice(0, 200);
}
/**
 * Signs a citizen in with validated eID claims. The account is found (or created) by
 * (municipality, issuer, subject), so the same person has independent accounts per municipality.
 * The NIF is kept only when the municipality verifies residency and a data key is configured,
 * and then only encrypted plus a keyed digest.
 */
@Injectable()
export class CompleteOidcLogin {
  constructor(
    private readonly identities: ExternalIdentityRepository,
    private readonly sessions: SessionRepository,
    private readonly consents: ConsentRepository,
    private readonly municipalities: Municipalities,
    private readonly protector: DataProtector,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    tenantId: string;
    legalVersion: string | null;
    claims: OidcClaims;
  }): Promise<
    Result<{ token: string; principal: Principal }, CompleteOidcLoginError>
  > {
    const municipality = await this.municipalities.find(args.tenantId);
    if (!municipality) return Result.err(failure("not_found"));
    // The notice may have changed while the person was at the identity provider.
    if (args.legalVersion !== municipality.legalVersion)
      return Result.err(failure("consent_required"));
    const { claims } = args;
    const now = this.clock.now();
    const profile = {
      displayName: displayName(claims),
      email: claims.email,
      assurance: "eid" as const,
    };
    const existing = await this.identities.findUser(
      municipality.id,
      claims.issuer,
      claims.subject,
    );
    let principal: Principal;
    if (existing) {
      principal = await this.identities.updateCitizen(
        municipality.id,
        existing.userId,
        profile,
      );
    } else {
      principal = await this.identities.createCitizen({
        id: this.ids.next(),
        tenantId: municipality.id,
        profile,
      });
      await this.identities.link({
        id: this.ids.next(),
        tenantId: municipality.id,
        userId: principal.userId,
        issuer: claims.issuer,
        subject: claims.subject,
        createdAt: now,
      });
    }
    if (!municipality.storeNif)
      await this.identities.setNif(municipality.id, principal.userId, null);
    else if (claims.nif && this.protector.available()) {
      const nif = normaliseNif(claims.nif);
      await this.identities.setNif(municipality.id, principal.userId, {
        ciphertext: this.protector.encrypt(nif),
        digest: this.protector.digest(nif),
      });
    }
    await this.consents.add({
      id: this.ids.next(),
      tenantId: municipality.id,
      userId: principal.userId,
      legalVersion: municipality.legalVersion,
      acceptedAt: now,
    });
    await this.audit.record(principal, "consent.accepted", principal.userId, {
      legalVersion: municipality.legalVersion,
    });
    await this.audit.record(principal, "auth.signed_in", principal.userId, {
      method: "oidc",
    });
    const token = await this.sessions.create(principal, now.add({ hours: 8 }));
    return Result.ok({ token, principal });
  }
}
