// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type {
  Assurance,
  Principal,
} from "../../../shared/application/principal";
export interface CitizenProfile {
  displayName: string;
  email: string | null;
  assurance: Assurance;
}
/** Citizen accounts reached through an external identity (issuer + subject) in one municipality. */
export abstract class ExternalIdentityRepository {
  /** Locks and returns the active account linked to the identity, if any. */
  abstract findUser(
    tenantId: string,
    issuer: string,
    subject: string,
  ): Promise<Principal | null>;
  abstract createCitizen(args: {
    id: string;
    tenantId: string;
    profile: CitizenProfile;
  }): Promise<Principal>;
  abstract updateCitizen(
    tenantId: string,
    userId: string,
    profile: CitizenProfile,
  ): Promise<Principal>;
  abstract link(args: {
    id: string;
    tenantId: string;
    userId: string;
    issuer: string;
    subject: string;
    createdAt: Temporal.Instant;
  }): Promise<void>;
  /** Stores (or with null clears) the protected NIF. */
  abstract setNif(
    tenantId: string,
    userId: string,
    nif: { ciphertext: string; digest: string } | null,
  ): Promise<void>;
}
