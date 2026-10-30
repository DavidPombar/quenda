// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type { Principal } from "../../../shared/application/principal";
import type { OperatorPrincipal } from "../../../shared/application/operator-principal";
/** 'tenant': a manager or door staff of one municipality; 'operator': the deployment's. */
export type Realm = "tenant" | "operator";
export type TicketStep = "password_change" | "enroll" | "totp";
/** Local account with a password and a TOTP second factor (#8, part C). */
export interface Credential {
  id: string;
  realm: Realm;
  tenantId: string | null;
  subjectId: string;
  login: string;
  passwordHash: string;
  mustChangePassword: boolean;
  /** Encrypted with the data key. */
  totpSecret: string | null;
  totpConfirmedAt: Temporal.Instant | null;
  totpLastStep: number | null;
  failedAttempts: number;
  lockedUntil: Temporal.Instant | null;
  disabledAt: Temporal.Instant | null;
}
export interface StaffAccount {
  userId: string;
  displayName: string;
  role: "manager" | "access";
  login: string | null;
  enrolled: boolean;
  disabled: boolean;
}
export abstract class CredentialRepository {
  /** Locks and returns the credential, active or not. */
  abstract findByLogin(
    realm: Realm,
    tenantId: string | null,
    login: string,
  ): Promise<Credential | null>;
  abstract findById(id: string): Promise<Credential | null>;
  abstract findBySubject(
    realm: Realm,
    subjectId: string,
  ): Promise<Credential | null>;
  abstract loginTaken(
    realm: Realm,
    tenantId: string | null,
    login: string,
  ): Promise<boolean>;
  abstract create(args: {
    id: string;
    realm: Realm;
    tenantId: string | null;
    subjectId: string;
    login: string;
    passwordHash: string;
    at: Temporal.Instant;
  }): Promise<void>;
  /** A failed password or code; locks the account when `lockedUntil` is given. */
  abstract recordFailure(
    id: string,
    lockedUntil: Temporal.Instant | null,
  ): Promise<void>;
  abstract clearFailures(id: string): Promise<void>;
  abstract setPassword(
    id: string,
    passwordHash: string,
    mustChange: boolean,
    at: Temporal.Instant,
  ): Promise<void>;
  /** Stores a new, unconfirmed secret. */
  abstract setTotpSecret(
    id: string,
    secret: string,
    at: Temporal.Instant,
  ): Promise<void>;
  abstract acceptTotp(
    id: string,
    step: number,
    at: Temporal.Instant,
  ): Promise<void>;
  /** New temporary password; the second factor must be set up again. */
  abstract reset(
    id: string,
    passwordHash: string,
    at: Temporal.Instant,
  ): Promise<void>;
  abstract setDisabled(id: string, at: Temporal.Instant | null): Promise<void>;
  abstract saveTicket(args: {
    ticketHash: string;
    credentialId: string;
    step: TicketStep;
    expiresAt: Temporal.Instant;
  }): Promise<void>;
  /** Removes and returns a live ticket. */
  abstract takeTicket(
    ticketHash: string,
    now: Temporal.Instant,
  ): Promise<{
    credentialId: string;
    step: TicketStep;
    expiresAt: Temporal.Instant;
  } | null>;
  abstract dropTickets(credentialId: string): Promise<void>;
  /** The person a tenant credential signs in as; null when deleted. */
  abstract tenantPrincipal(
    tenantId: string,
    userId: string,
  ): Promise<Principal | null>;
  abstract operatorPrincipal(
    operatorId: string,
  ): Promise<OperatorPrincipal | null>;
  /** Marks the user as having a local account, so the demo never hands it out. */
  abstract markLocal(tenantId: string, userId: string): Promise<void>;
  /** Managers and door staff of the municipality, with their account state. */
  abstract staff(tenantId: string): Promise<StaffAccount[]>;
  abstract createStaffUser(args: {
    id: string;
    tenantId: string;
    displayName: string;
    role: "manager" | "access";
  }): Promise<void>;
  abstract createOperator(id: string, displayName: string): Promise<void>;
  /** Ends every session of the user (tenant) or operator. */
  abstract revokeSessions(realm: Realm, subjectId: string): Promise<void>;
}
