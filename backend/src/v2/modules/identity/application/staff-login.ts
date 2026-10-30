// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import {
  Credential,
  CredentialRepository,
  TicketStep,
} from "../domain/credential.repository";
import { TICKET_MINUTES, ticketHash } from "../domain/login-ticket";
import { base32, otpauthUri } from "../domain/totp";
import { SecretGenerator } from "../../../shared/application/secret-generator";
import { DataProtector } from "../../../shared/application/data-protector";
import { Clock } from "../../../shared/application/clock";
import { Municipalities } from "../../../shared/application/municipality-settings";
/** The next step of a staff sign-in, as the browser sees it. */
export interface NextStep {
  ticket: string;
  step: TicketStep;
  /** Only when setting up the second factor: what the authenticator app needs. */
  enrollment?: { secret: string; otpauthUri: string };
}
/** Shared by the three sign-in steps: decides and opens the next one. */
@Injectable()
export class StaffLogin {
  constructor(
    private readonly credentials: CredentialRepository,
    private readonly secrets: SecretGenerator,
    private readonly protector: DataProtector,
    private readonly municipalities: Municipalities,
    private readonly clock: Clock,
  ) {}
  async next(credential: Credential): Promise<NextStep> {
    const now = this.clock.now();
    const step: TicketStep = credential.mustChangePassword
      ? "password_change"
      : credential.totpConfirmedAt
        ? "totp"
        : "enroll";
    const ticket = this.secrets.randomToken(32);
    await this.credentials.saveTicket({
      ticketHash: ticketHash(ticket),
      credentialId: credential.id,
      step,
      expiresAt: now.add({ minutes: TICKET_MINUTES }),
    });
    if (step !== "enroll") return { ticket, step };
    // A fresh secret each time until the person confirms one with a code.
    const secret = base32(
      Buffer.from(this.secrets.randomToken(20), "base64url").subarray(0, 20),
    );
    await this.credentials.setTotpSecret(
      credential.id,
      this.protector.encrypt(secret),
      now,
    );
    const municipality = credential.tenantId
      ? await this.municipalities.find(credential.tenantId)
      : null;
    return {
      ticket,
      step,
      enrollment: {
        secret,
        otpauthUri: otpauthUri({
          secret,
          account: credential.login,
          issuer: municipality
            ? `Quenda · ${municipality.name}`
            : "Quenda · operación",
        }),
      },
    };
  }
}
